import { NextResponse } from "next/server";
import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { getRequiredEnv } from "@/lib/env";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);
const MAX_PDF_SIZE = 20 * 1024 * 1024;
const MAX_PAGES_FOR_VISION = 4;
const CONVERT_DPI = 130;
const DEFAULT_VISION_MODEL = "google/gemma-3-4b-it:free";
const FALLBACK_VISION_MODELS = [
  "google/gemini-2.0-flash:free",
  "mistralai/pixtral-12b:free",
];

function sortByPageNumber(fileA, fileB) {
  const pageA = Number((fileA.match(/-(\d+)\.(?:jpg|jpeg|png)$/i) || [])[1] || 0);
  const pageB = Number((fileB.match(/-(\d+)\.(?:jpg|jpeg|png)$/i) || [])[1] || 0);
  return pageA - pageB;
}

async function convertPdfToImages(pdfPath, tempDir, suffix) {
  const prefix = path.join(tempDir, `sigma-page-${suffix}`);

  // Convertimos en lote para reducir latencia total frente a convertir página a página.
  await execFileAsync(
    "pdftocairo",
    [
      "-jpeg",
      "-r", String(CONVERT_DPI),
      "-f", "1",
      "-l", String(MAX_PAGES_FOR_VISION),
      pdfPath,
      prefix,
    ],
    { timeout: 25_000 }
  );

  const files = fs.readdirSync(tempDir)
    .filter((name) => name.startsWith(`sigma-page-${suffix}-`) && /\.(jpg|jpeg|png)$/i.test(name))
    .sort(sortByPageNumber);

  return files.map((name) => ({
    path: path.join(tempDir, name),
    mimeType: /\.png$/i.test(name) ? "image/png" : "image/jpeg",
  }));
}

async function requestVisionWithOpenRouter({ images, prompt, requestedModel }) {
  const apiKey = getRequiredEnv("OPENROUTER_API_KEY");

  const content: any[] = [
    {
      type: "text",
      text: `Extrae el contenido de este documento de forma MUY rápida y precisa.

Objetivo:
1) OCR fiel del texto clave (titulos, datos, tablas, cifras).
2) Si hay dibujos, diagramas, esquemas o graficos, describelos claramente.
3) Resume lo esencial para que otro modelo de texto responda al usuario.

Formato de salida:
[OCR CLAVE]\n...\n\n[DIBUJOS Y ELEMENTOS VISUALES]\n...\n\n[RESUMEN PARA RESPUESTA]\n...

Peticion del usuario: ${prompt || "Analiza este documento"}`,
    },
  ];

  for (const image of images) {
    const base64 = fs.readFileSync(image.path, { encoding: "base64" });
    content.push({
      type: "image_url",
      image_url: { url: `data:${image.mimeType};base64,${base64}` },
    });
  }

  const models = [requestedModel, ...FALLBACK_VISION_MODELS].filter(Boolean);
  let lastError = null;

  for (const model of models) {
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
        return { output, modelUsed: model };
      }

      throw new Error(`Modelo ${model} devolvio respuesta vacia`);
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      console.warn(`⚠️ [PDF-VISION] Fallo en ${model}:`, error.message);
    }
  }

  throw lastError || new Error("No se pudo analizar el documento con vision");
}

export async function POST(req) {
  let pdfPath = null;
  let uniqueSuffix = null;

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

    uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const tempDir = os.tmpdir();
    pdfPath = path.join(tempDir, `sigma-upload-${uniqueSuffix}.pdf`);

    const bytes = await file.arrayBuffer();
    fs.writeFileSync(pdfPath, Buffer.from(bytes));

    console.log(`📄 [PDF-VISION] Processing ${file.name} (${Math.round(file.size / 1024)}KB)`);

    const images = await convertPdfToImages(pdfPath, tempDir, uniqueSuffix);
    if (images.length === 0) {
      return NextResponse.json({ error: "No se pudieron generar imagenes del PDF" }, { status: 422 });
    }

    const { output, modelUsed } = await requestVisionWithOpenRouter({
      images,
      prompt,
      requestedModel: model,
    });

    const result = [
      `[PIPELINE]: pdf->imagenes->${modelUsed}->gpt`,
      `[PAGINAS_ANALIZADAS]: ${images.length}`,
      output,
    ].join("\n");

    return NextResponse.json({
      result,
      method: "gemma-vision-ocr-fast",
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
  } finally {
    const filesToRemove = [];
    if (pdfPath) filesToRemove.push(pdfPath);

    if (uniqueSuffix) {
      const tempDir = os.tmpdir();
      try {
        const generated = fs.readdirSync(tempDir)
          .filter((name) => name.includes(uniqueSuffix))
          .map((name) => path.join(tempDir, name));
        filesToRemove.push(...generated);
      } catch (cleanupErr) {
        console.warn("⚠️ [PDF-VISION] Cleanup scan failed:", cleanupErr.message);
      }
    }

    for (const target of new Set(filesToRemove)) {
      if (!target || !fs.existsSync(target)) continue;
      try {
        fs.unlinkSync(target);
      } catch {
        // No-op cleanup failure
      }
    }
  }
}
