import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";
import { getRequiredEnv } from "@/lib/env";

export const runtime = 'nodejs';

/**
 * Extrae texto de un PDF usando pdf-parse (método principal, sin dependencias externas)
 */
async function extractTextFromPDF(pdfPath) {
    try {
        const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
        const buffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(buffer);
        const text = (data.text || '').replace(/\u0000/g, '').replace(/\r\n/g, '\n').trim();
        console.log(`📄 [PDF] pdf-parse extracted ${text.length} chars, ${data.numpages} pages`);
        return { text, pages: data.numpages, method: 'pdf-parse' };
    } catch (err) {
        console.warn('⚠️ [PDF] pdf-parse failed:', err.message);
        return null;
    }
}

/**
 * Convierte PDF a imagen usando pdftocairo (método visual, opcional)
 */
async function convertPdfToImage(pdfPath, outPrefix, tempDir) {
    const { execSync } = await import('child_process');
    // Intenta primero -jpeg (más compatible)
    const commands = [
        `pdftocairo -jpeg -singlefile -r 200 -f 1 -l 1 "${pdfPath}" "${path.join(tempDir, outPrefix)}"`,
        `pdftocairo -png -singlefile -r 200 -f 1 -l 1 "${pdfPath}" "${path.join(tempDir, outPrefix)}"`,
    ];

    for (const command of commands) {
        try {
            execSync(command, { timeout: 30000 });
            const files = fs.readdirSync(tempDir);
            const match = files.find(f => f.startsWith(outPrefix) && (f.endsWith('.jpg') || f.endsWith('.png')));
            if (match) {
                const ext = path.extname(match);
                return { path: path.join(tempDir, match), mimeType: ext === '.png' ? 'image/png' : 'image/jpeg' };
            }
        } catch (err) {
            console.warn(`⚠️ [PDF-VISION] Command failed: ${command.split(' ')[0]}... - ${err.message}`);
        }
    }
    throw new Error("No se pudo convertir el PDF a imagen (pdftocairo no disponible)");
}

/**
 * Analiza un PDF con visión IA
 */
async function analyzeWithVision(imagePath, mimeType, prompt, model, openai) {
    const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });
    const dataUrl = `data:${mimeType};base64,${imageBase64}`;

    console.log('📡 [PDF-VISION] Sending to OpenRouter, model:', model);

    const visionPrompt = `Actúa como un experto en OCR y análisis de documentos.
Analiza detalladamente esta imagen de un documento PDF. Lee TODO el texto de forma precisa y completa.
Extrae y organiza la información en formato estructurado (títulos, secciones, datos relevantes).
Instrucción adicional del usuario: ${prompt}`;

    const response = await openai.chat.completions.create({
        model,
        messages: [{
            role: "user",
            content: [
                { type: "text", text: visionPrompt },
                { type: "image_url", image_url: { url: dataUrl } }
            ]
        }],
        temperature: 0.1,
        max_tokens: 2000,
    });

    return response.choices[0].message.content;
}

export async function POST(req) {
    let pdfPath = null;
    let imagePath = null;

    try {
        const formData = await req.formData();
        const file = formData.get("file");
        const prompt = formData.get("prompt") || "Resume este documento y extrae los puntos clave de forma detallada.";
        const model = formData.get("model") || "meta-llama/llama-4-scout:free";
        const forceVision = formData.get("forceVision") === "true";

        if (!file) {
            return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
        }

        const isPDF = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');
        if (!isPDF) {
            return NextResponse.json({ error: "Solo se aceptan archivos PDF" }, { status: 400 });
        }

        if (file.size > 20 * 1024 * 1024) { // 20MB limit
            return NextResponse.json({ error: "El PDF es demasiado grande (máximo 20MB)" }, { status: 413 });
        }

        // Guardar archivo temporal
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const tempDir = os.tmpdir();
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        pdfPath = path.join(tempDir, `sigma-pdf-${uniqueSuffix}.pdf`);
        fs.writeFileSync(pdfPath, buffer);

        console.log(`📄 [PDF] Processing: ${file.name} (${(file.size / 1024).toFixed(0)}KB)`);

        // === MÉTODO 1: Extracción de texto directa (rápida, sin dependencias) ===
        if (!forceVision) {
            const textResult = await extractTextFromPDF(pdfPath);
            if (textResult && textResult.text && textResult.text.length > 100) {
                // El texto es suficiente, enviarlo al LLM para interpretación
                const openai = new OpenAI({
                    apiKey: getRequiredEnv('OPENROUTER_API_KEY'),
                    baseURL: "https://openrouter.ai/api/v1",
                    defaultHeaders: {
                        "HTTP-Referer": "https://sigmacompany.ai",
                        "X-Title": "Sigma LLM",
                    }
                });

                const MAX_CHARS = 12000;
                const textToAnalyze = textResult.text.slice(0, MAX_CHARS);
                const truncationNote = textResult.text.length > MAX_CHARS
                    ? `\n\n[Nota: El documento tiene ${textResult.pages} páginas. Se muestran los primeros ${MAX_CHARS} caracteres]`
                    : `\n\n[Documento de ${textResult.pages} página(s)]`;

                const analysisPrompt = `Analiza el siguiente texto extraído de un PDF y responde a esta solicitud del usuario: "${prompt}"

=== CONTENIDO DEL PDF ===
${textToAnalyze}${truncationNote}
=== FIN DEL CONTENIDO ===

Proporciona un análisis completo, estructurado y útil del documento.`;

                console.log(`📤 [PDF] Sending ${textToAnalyze.length} chars to LLM for analysis...`);

                const response = await openai.chat.completions.create({
                    model: "google/gemma-3-27b-it:free",
                    messages: [{ role: "user", content: analysisPrompt }],
                    temperature: 0.3,
                    max_tokens: 2000,
                });

                const result = response.choices[0].message.content;
                console.log('✅ [PDF] Text extraction + LLM analysis success');

                return NextResponse.json({
                    result,
                    method: 'text-extraction',
                    pages: textResult.pages,
                    charCount: textResult.text.length
                });
            }

            // Si pdf-parse extrajo poco texto, el PDF puede ser escaneado → usar visión
            console.log('⚠️ [PDF] PDF parece escaneado (poco texto), intentando visión...');
        }

        // === MÉTODO 2: Análisis Visual (para PDFs escaneados o con fuerza) ===
        const openai = new OpenAI({
            apiKey: getRequiredEnv('OPENROUTER_API_KEY'),
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
                "HTTP-Referer": "https://sigmacompany.ai",
                "X-Title": "Sigma LLM",
            }
        });

        try {
            const outPrefix = `sigma-page-${uniqueSuffix}`;
            const imageResult = await convertPdfToImage(pdfPath, outPrefix, tempDir);
            imagePath = imageResult.path;

            const result = await analyzeWithVision(imagePath, imageResult.mimeType, prompt, model, openai);
            console.log('✅ [PDF-VISION] Vision analysis success');

            return NextResponse.json({
                result,
                method: 'vision',
            });
        } catch (visionErr) {
            console.error('❌ [PDF-VISION] Vision failed:', visionErr.message);

            // Último recurso: si pdf-parse extrajo ALGO de texto, usarlo aunque sea poco
            const fallbackText = await extractTextFromPDF(pdfPath);
            if (fallbackText && fallbackText.text && fallbackText.text.length > 10) {
                return NextResponse.json({
                    result: `📄 **Texto extraído del PDF** (${fallbackText.pages} página(s)):\n\n${fallbackText.text.slice(0, 8000)}`,
                    method: 'text-fallback',
                    pages: fallbackText.pages
                });
            }

            return NextResponse.json({
                error: `No se pudo procesar el PDF: ${visionErr.message}. El PDF puede estar protegido o en un formato no compatible.`
            }, { status: 500 });
        }

    } catch (error) {
        console.error('❌ [PDF] Critical error:', error);
        return NextResponse.json({
            error: "Error al procesar el PDF: " + (error.message || 'Error desconocido')
        }, { status: 500 });
    } finally {
        // Cleanup temp files
        for (const tmpFile of [pdfPath, imagePath]) {
            if (tmpFile && fs.existsSync(tmpFile)) {
                try { fs.unlinkSync(tmpFile); } catch { }
            }
        }
    }
}
