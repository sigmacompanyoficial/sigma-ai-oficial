import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import os from "os";
import { getRequiredEnv } from "@/lib/env";

export const runtime = 'nodejs';

/**
 * Extrae texto de un PDF usando pdf-parse con fallback a pdfjs-dist
 */
async function extractTextFromPDF(pdfPath) {
    const buffer = fs.readFileSync(pdfPath);

    // Intento 1: pdf-parse (rápido)
    try {
        const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
        const data = await pdfParse(buffer);
        const text = (data.text || '').replace(/\u0000/g, '').replace(/\r\n/g, '\n').trim();

        if (text.length > 100) {
            console.log(`📄 [PDF] pdf-parse success: ${text.length} chars, ${data.numpages} pages`);
            return { text, pages: data.numpages, method: 'pdf-parse' };
        }
    } catch (err) {
        console.warn('⚠️ [PDF] pdf-parse failed:', err.message);
    }

    // Intento 2: pdfjs-dist (más robusto)
    try {
        console.log('📄 [PDF] Trying pdfjs-dist fallback...');
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

        // Disable worker for simpler usage in Node.js
        const loadingTask = pdfjs.getDocument({
            data: new Uint8Array(buffer),
            useSystemFonts: true,
            disableFontFace: true
        });

        const pdf = await loadingTask.promise;
        let fullText = '';
        const numPages = pdf.numPages;

        // Extraer texto de todas las páginas (o hasta un límite)
        const maxPagesToParse = Math.min(numPages, 50);
        for (let i = 1; i <= maxPagesToParse; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }

        const cleanedText = fullText.replace(/\u0000/g, '').trim();
        if (cleanedText.length > 20) {
            console.log(`📄 [PDF] pdfjs-dist success: ${cleanedText.length} chars, ${numPages} pages`);
            return { text: cleanedText, pages: numPages, method: 'pdfjs-dist' };
        }
    } catch (err) {
        console.error('❌ [PDF] pdfjs-dist fallback failed:', err.message);
    }

    return null;
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
 * Analiza un PDF con visión IA usando fetch directo y reintentos para 429
 */
async function analyzeWithVision(images, prompt, model) {
    const apiKey = getRequiredEnv('OPENROUTER_API_KEY');

    // Nemotron Nano a veces falla con demasiadas imágenes en el tier free.
    // Limitamos a las primeras 5 páginas para un análisis equilibrado.
    const activeImages = images.slice(0, 5);

    const content = [
        {
            type: "text",
            text: `Actúa como un experto en visión artificial, OCR y análisis de documentos. 
Instrucciones críticas para estas ${activeImages.length} páginas:
1. Si el documento contiene TEXTO, extráelo TODO de forma literal y precisa. No resumas el texto, transcríbelo.
2. Si el documento contiene DIBUJOS, esquemas o fotos, explícalos detalladamente, describiendo objetos, acciones y contexto visual de forma simple y directa.
3. Responde de forma clara siguiendo la solicitud: ${prompt || 'Analiza el documento'}`
        }
    ];

    for (const img of activeImages) {
        const base64 = fs.readFileSync(img.path, { encoding: "base64" });
        content.push({
            type: "image_url",
            image_url: { url: `data:${img.mimeType};base64,${base64}` }
        });
    }

    const visionModels = [model, "google/gemini-2.0-flash:free", "mistralai/pixtral-12b:free"];
    let lastError = null;

    for (const targetModel of visionModels) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                if (attempt > 0) {
                    console.log(`🔄 [PDF-VISION] Retry attempt ${attempt} for ${targetModel}...`);
                    await new Promise(r => setTimeout(r, 2000));
                }

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://sigmacompany.ai',
                        'X-Title': 'Sigma LLM'
                    },
                    body: JSON.stringify({
                        model: targetModel,
                        messages: [{ role: 'user', content }],
                        temperature: 0.1,
                        max_tokens: 3000
                    })
                });

                if (response.status === 429) {
                    lastError = new Error('429 Rate Limit/Provider Overloaded');
                    console.warn(`⚠️ [PDF-VISION] 429 on ${targetModel}`);
                    continue;
                }

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`OpenRouter Error ${response.status}: ${errText}`);
                }

                const data = await response.json();
                return data.choices[0].message.content;

            } catch (err) {
                console.error(`❌ [PDF-VISION] Attempt ${attempt} failed on ${targetModel}:`, err.message);
                lastError = err;
                if (!err.message.includes('429')) break;
            }
        }
        if (!lastError || !lastError.message.includes('429')) break;
    }
    throw lastError || new Error('Todos los modelos de visión fallaron.');
}

export async function POST(req) {
    let pdfPath = null;
    let imagePath = null;

    try {
        const formData = await req.formData();
        const file = formData.get("file");
        const prompt = formData.get("prompt") || "Resume este documento y extrae los puntos clave de forma detallada.";
        const model = formData.get("model") || "nvidia/nemotron-nano-12b-v2-vl:free";
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

        // === MÉTODO HÍBRIDO: Texto + Visión (para dibujos) ===
        let textPart = "";
        let visionPart = "";

        // 1. Extraer texto del PDF (método rápido)
        try {
            const textResult = await extractTextFromPDF(pdfPath);
            if (textResult && textResult.text) {
                textPart = textResult.text.slice(0, 50000);
            }
        } catch (e) {
            console.warn('⚠️ [PDF] Text extraction failed:', e.message);
        }

        // 2. Análisis Visual (Múltiples páginas para encontrar dibujos/texto/esquemas)
        const images = [];
        try {
            const { execSync } = await import('child_process');
            const maxPages = 5; // Analizamos hasta las primeras 5 páginas de forma visual

            for (let i = 1; i <= maxPages; i++) {
                const pagePrefix = `sigma-p${i}-${uniqueSuffix}`;
                const pageImgPath = path.join(tempDir, `${pagePrefix}.jpg`);

                try {
                    // Intentamos convertir la página i
                    const cmd = `pdftocairo -jpeg -singlefile -r 150 -f ${i} -l ${i} "${pdfPath}" "${path.join(tempDir, pagePrefix)}"`;
                    execSync(cmd, { timeout: 15000 });

                    if (fs.existsSync(pageImgPath)) {
                        images.push({
                            path: pageImgPath,
                            mimeType: 'image/jpeg'
                        });
                        console.log(`🎨 [PDF-VISION] Page ${i} converted to image.`);
                    } else {
                        // Si no existe, es que llegamos al final de las páginas
                        break;
                    }
                } catch (pErr) {
                    console.warn(`⚠️ [PDF-VISION] Could not convert page ${i}:`, pErr.message);
                    break;
                }
            }

            if (images.length > 0) {
                console.log(`👁️ [PDF-VISION] Sending ${images.length} pages to ${model}...`);
                const visionPrompt = `Analiza estas páginas del documento. 
                Extrae TODO el texto que veas (OCR) de forma precisa y si encuentras dibujos, esquemas o imágenes, explícalos de forma simple y clara.`;

                visionPart = await analyzeWithVision(images, visionPrompt, model);
            }
        } catch (vErr) {
            console.error('⚠️ [PDF-VISION] Visual analysis flow failed:', vErr.message);
        }

        // 3. Devolución Directa (Sin unificación intermedia para mayor velocidad y contexto real)
        let finalContext = "";
        if (textPart && textPart.length > 200) {
            finalContext += `[TEXTO DIGITAL EXTRAÍDO]:\n${textPart}\n\n`;
        }

        if (visionPart) {
            finalContext += `[ANÁLISIS VISUAL Y OCR (VISION MODEL)]: \n${visionPart}`;
        } else if (!textPart) {
            finalContext = "No se pudo extraer contenido legible del documento.";
        }

        return NextResponse.json({
            result: finalContext,
            method: 'hybrid-vision-ocr'
        });

    } catch (error) {
        console.error('❌ [PDF] Critical error:', error);
        return NextResponse.json({
            error: "Error al procesar el PDF: " + (error.message || 'Error desconocido')
        }, { status: 500 });
    } finally {
        // Cleanup temp files
        const filesToCleanup = [pdfPath];
        if (pdfPath) {
            const dir = path.dirname(pdfPath);
            const prefix = path.basename(pdfPath).replace('.pdf', '');
            try {
                const allFiles = fs.readdirSync(dir);
                const relatedFiles = allFiles.filter(f => f.includes(uniqueSuffix)).map(f => path.join(dir, f));
                filesToCleanup.push(...relatedFiles);
            } catch (err) {
                console.warn('Cleanup directory read failed:', err.message);
            }
        }

        const uniqueFiles = [...new Set(filesToCleanup)];
        for (const tmpFile of uniqueFiles) {
            if (tmpFile && fs.existsSync(tmpFile)) {
                try { fs.unlinkSync(tmpFile); } catch { }
            }
        }
    }
}
