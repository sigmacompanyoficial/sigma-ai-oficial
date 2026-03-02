import { NextResponse } from "next/server";
import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { getOptionalEnv } from "@/lib/env";

export const runtime = "nodejs";

const MAX_PDF_SIZE = 20 * 1024 * 1024;
const MAX_PAGES_FOR_VISION = 4;
const CONVERT_DPI = 160;
const DEFAULT_VISION_MODEL = "google/gemma-3-4b-it:free";
const FALLBACK_VISION_MODELS = [
  "google/gemini-2.0-flash:free",
  "mistralai/pixtral-12b:free",
];
const execFileAsync = promisify(execFile);
const OPENROUTER_KEY_ENV_NAMES = [
  "OPENROUTER_API_KEY_1",
  "OPENROUTER_API_KEY_2",
  "OPENROUTER_API_KEY_3",
  "OPENROUTER_API_KEY_4",
  "OPENROUTER_API_KEY_5",
];

function getOpenRouterApiKeys() {
  const keys = OPENROUTER_KEY_ENV_NAMES.map((name) => getOptionalEnv(name)).filter(Boolean);
  const legacyKey = getOptionalEnv("OPENROUTER_API_KEY");
  if (legacyKey) keys.push(legacyKey);

  const uniqueKeys = [...new Set(keys)];
  if (!uniqueKeys.length) {
    throw new Error(
      "Missing OpenRouter API keys. Define OPENROUTER_API_KEY_1..OPENROUTER_API_KEY_5 or OPENROUTER_API_KEY"
    );
  }
  return uniqueKeys;
}

/**
 * Convierte PDF a imágenes JPEG con pdftocairo para enviarlas al modelo de visión.
 */
async function convertPdfToImages(pdfBuffer) {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "sigma-pdf-vision-"));
  const pdfPath = path.join(tempDir, "input.pdf");
  const outputPrefix = path.join(tempDir, "page");

  try {
    await fs.promises.writeFile(pdfPath, pdfBuffer);

    await execFileAsync(
      "pdftocairo",
      [
        "-jpeg",
        "-r", String(CONVERT_DPI),
        "-f", "1",
        "-l", String(MAX_PAGES_FOR_VISION),
        pdfPath,
        outputPrefix,
      ],
      { timeout: 30_000 }
    );

    const files = (await fs.promises.readdir(tempDir))
      .filter((name) => /^page-\d+\.jpe?g$/i.test(name))
      .sort((a, b) => {
        const pa = Number((a.match(/(\d+)/) || [0, 0])[1]);
        const pb = Number((b.match(/(\d+)/) || [0, 0])[1]);
        return pa - pb;
      });

    if (!files.length) {
      throw new Error("No se pudieron generar imágenes del PDF");
    }

    const images = await Promise.all(
      files.map(async (name) => {
        const buffer = await fs.promises.readFile(path.join(tempDir, name));
        return {
          base64: buffer.toString("base64"),
          mimeType: "image/jpeg",
        };
      })
    );

    return images;
  } catch (error) {
    if ((error?.message || "").includes("ENOENT")) {
      throw new Error("Falta 'pdftocairo' en el servidor para convertir PDFs a imágenes");
    }
    throw error;
  } finally {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {
      // No-op de limpieza
    }
  }
}

async function requestVisionWithOpenRouter({ images, prompt, requestedModel }) {
  const apiKeys = getOpenRouterApiKeys();

  const content = [
    {
      type: "text",
      text: `Extrae el contenido de este documento de forma MUY rápida y precisa.\n\nObjetivo:\n1) OCR fiel del texto clave (titulos, datos, tablas, cifras).\n2) Si hay dibujos, diagramas, esquemas o graficos, describelos claramente.\n3) Resume lo esencial para que otro modelo de texto responda al usuario.\n\nFormato de salida:\n[OCR CLAVE]\\n...\\n\\n[DIBUJOS Y ELEMENTOS VISUALES]\\n...\\n\\n[RESUMEN PARA RESPUESTA]\\n...\n\nPeticion del usuario: ${prompt || "Analiza este documento"}`,
    },
  ];

  for (const image of images) {
    content.push({
      type: "image_url",
      image_url: { url: `data:${image.mimeType};base64,${image.base64}` },
    });
  }

  const models = [requestedModel, ...FALLBACK_VISION_MODELS].filter(Boolean);
  let lastError = null;

  for (const model of models) {
    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex += 1) {
      const apiKey = apiKeys[keyIndex];
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40_000);

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://sigmacompany.ai",
            "X-Title": "Sigma LLM",
          },
          body: JSON.stringify({
            model,
            stream: false,
            temperature: 0.1,
            max_tokens: 1800,
            messages: [{ role: "user", content }],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const body = await response.text().catch(() => "");
          throw new Error(`OpenRouter ${response.status}: ${body.slice(0, 200)}`);
        }

        const data = await response.json();
        const output = data?.choices?.[0]?.message?.content?.trim();
        if (output) {
          return { output, modelUsed: model, keyUsed: keyIndex + 1 };
        }

        throw new Error(`Modelo ${model} devolvio respuesta vacia`);
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
        console.warn(
          `⚠️ [PDF-VISION] Fallo en ${model} con key #${keyIndex + 1}/${apiKeys.length}:`,
          error.message
        );
      }
    }
  }

  throw lastError || new Error("No se pudo analizar el documento con vision");
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const prompt = String(formData.get("prompt") || "Analiza este documento y extrae lo importante.");
    const model = String(formData.get("model") || DEFAULT_VISION_MODEL);

    if (!file) {
      return NextResponse.json({ error: "No se recibio ningun archivo" }, { status: 400 });
    }

    const isPDF = file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf");
    if (!isPDF) {
      return NextResponse.json({ error: "Solo se aceptan archivos PDF en este endpoint" }, { status: 400 });
    }

    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json({ error: "El PDF supera 20MB" }, { status: 413 });
    }

    console.log(`📄 [PDF-VISION] Processing ${file.name} (${Math.round(file.size / 1024)}KB)`);

    const bytes = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(bytes);

    const images = await convertPdfToImages(pdfBuffer);
    if (!images.length) {
      throw new Error("No se pudieron generar imágenes del PDF");
    }

    console.log(`🖼️ [PDF-VISION] Rendered ${images.length} page(s), sending to Gemma vision...`);

    const { output, modelUsed, keyUsed } = await requestVisionWithOpenRouter({
      images,
      prompt,
      requestedModel: model,
    });

    const result = [
      `[PIPELINE]: pdf->imagenes->${modelUsed}(key#${keyUsed})->gpt`,
      `[PAGINAS_ANALIZADAS]: ${images.length}`,
      output,
    ].join("\n");

    return NextResponse.json({
      result,
      method: "pdftocairo-gemma-vision-ocr",
      pages: images.length,
      visionModel: modelUsed,
    });
  } catch (error) {
    console.error("❌ [PDF-VISION] Error:", error);
    const isAbort = error?.name === "AbortError";
    return NextResponse.json(
      { error: isAbort ? "Timeout analizando PDF" : `Error al procesar PDF: ${error.message || "desconocido"}` },
      { status: isAbort ? 504 : 500 }
    );
  }
}
