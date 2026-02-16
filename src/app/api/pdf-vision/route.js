import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { getRequiredEnv } from "@/lib/env";

export const runtime = 'nodejs';

/**
 * Función para convertir PDF a imagen usando herramientas del sistema (poppler-utils)
 * Más confiable en Linux que librerías de terceros con binarios estáticos.
 */
async function convertPdfToImage(pdfPath, outPrefix, tempDir) {
    try {
        // -r 300 para alta resolución (esencial para lectura/OCR de documentos)
        const command = `pdftocairo -jpeg -singlefile -r 300 -f 1 -l 1 "${pdfPath}" "${path.join(tempDir, outPrefix)}"`;
        console.log('🖥️ [PDF-VISION] Executing:', command);
        execSync(command);

        const expectedPath = path.join(tempDir, `${outPrefix}.jpg`);
        if (fs.existsSync(expectedPath)) {
            return expectedPath;
        }

        // Fallback: algunos sistemas pueden añadir .jpg o -1.jpg
        const files = fs.readdirSync(tempDir);
        const match = files.find(f => f.startsWith(outPrefix) && f.endsWith('.jpg'));
        if (match) return path.join(tempDir, match);

        throw new Error("No se generó el archivo de imagen de salida.");
    } catch (err) {
        console.error('❌ [PDF-VISION] Conversion error:', err.message);
        throw err;
    }
}

export async function POST(req) {
    let pdfPath = null;
    let imagePath = null;

    try {
        const formData = await req.formData();
        const file = formData.get("file");
        const prompt = formData.get("prompt") || "Resume este documento y describe lo que ves.";
        const model = formData.get("model") || "nvidia/nemotron-nano-12b-v2-vl:free";

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Guardar archivo temporal
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const tempDir = os.tmpdir();
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        pdfPath = path.join(tempDir, `input-${uniqueSuffix}.pdf`);
        fs.writeFileSync(pdfPath, buffer);

        console.log('📄 [PDF-VISION] Processing PDF:', file.name);

        // Convertir PDF a imagen usando pdftocairo
        const outPrefix = `page-${uniqueSuffix}`;
        imagePath = await convertPdfToImage(pdfPath, outPrefix, tempDir);

        const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });
        const dataUrl = `data:image/jpeg;base64,${imageBase64}`;

        console.log('📡 [PDF-VISION] Sending to OpenRouter with model:', model);

        // Conectar a OpenRouter
        const openai = new OpenAI({
            apiKey: getRequiredEnv('OPENROUTER_API_KEY'),
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
                "HTTP-Referer": "https://sigmompany.ai",
                "X-Title": "Sigma LLM",
            }
        });

        const visionPrompt = `Actúa como un experto en OCR y análisis de documentos. 
Analiza detalladamente esta imagen de un documento. Lee TODO el texto palabra por palabra y describe el contenido con precisión. 
Si el texto está en latín, transcríbelo ignorando cualquier suposición previa.
Instrucción adicional: ${prompt}`;

        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: visionPrompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: dataUrl,
                            },
                        },
                    ],
                },
            ],
            temperature: 0.1, // Baja temperatura para reducir alucinaciones
        });

        console.log('✅ [PDF-VISION] Success');

        return NextResponse.json({
            result: response.choices[0].message.content,
            imageUrl: dataUrl
        });

    } catch (error) {
        console.error('❌ [PDF-VISION] error:', error);
        return NextResponse.json({ error: "Error processing PDF: " + error.message }, { status: 500 });
    } finally {
        // Cleanup
        if (pdfPath && fs.existsSync(pdfPath)) {
            try { fs.unlinkSync(pdfPath); } catch (e) { }
        }
        if (imagePath && fs.existsSync(imagePath)) {
            try { fs.unlinkSync(imagePath); } catch (e) { }
        }
    }
}
