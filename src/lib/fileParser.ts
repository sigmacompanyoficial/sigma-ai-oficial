// @ts-nocheck
/**
 * Cliente: Envía archivo al servidor para extracción de texto
 */
export async function uploadAndExtractFile(file) {
  console.log('[FILE_PARSER] Starting extraction:', {
    name: file?.name,
    type: file?.type,
    size: file?.size,
  });

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/files/parse', {
    method: 'POST',
    body: formData,
  });

  console.log('[FILE_PARSER] Parse response status:', response.status, 'for', file?.name);

  if (!response.ok) {
    let errorMsg = 'Error al procesar el archivo';
    try {
      const error = await response.json();
      errorMsg = error.error || errorMsg;
    } catch { }
    console.error('[FILE_PARSER] Parse failed:', errorMsg);
    throw new Error(errorMsg);
  }

  const result = await response.json();
  console.log('[FILE_PARSER] Extraction completed:', {
    name: file?.name,
    extractedChars: result?.text?.length || 0,
  });
  return result.text;
}

/**
 * PDF: Convierte páginas a imágenes y envía a visión (Gemma/fallback)
 */
export async function uploadAndVisionPDF(file, prompt = "Resume este documento detalladamente y extrae los puntos clave.") {
  console.log('[FILE_PARSER] Starting PDF analysis:', {
    name: file?.name,
    type: file?.type,
    size: file?.size,
  });

  if (file.size > 20 * 1024 * 1024) {
    throw new Error('El PDF es demasiado grande. Por favor, usa archivos de menos de 20MB.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('prompt', prompt);
  formData.append('model', 'google/gemma-3-4b-it:free');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

  try {
    const response = await fetch('/api/pdf-vision', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('[FILE_PARSER] PDF analysis response status:', response.status);

    if (!response.ok) {
      let errorMsg = 'Error al analizar el PDF';
      try {
        const error = await response.json();
        errorMsg = error.error || errorMsg;
      } catch { }
      console.error('[FILE_PARSER] PDF analysis failed:', errorMsg);
      throw new Error(errorMsg);
    }

    const result = await response.json();
    const method = result.method || 'unknown';
    const pages = result.pages ? ` (${result.pages} páginas)` : '';
    console.log(`[FILE_PARSER] PDF analysis completed via ${method}${pages}`);

    // Añadir contexto sobre el método usado
    const methodLabel = method === 'gemma-vision-ocr-fast'
      ? '[OCR + DESCRIPCIÓN VISUAL (GEMMA)]'
      : '[ANÁLISIS DEL PDF]';

    return `${methodLabel}:\n${result.result}`;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('El análisis del PDF tardó demasiado. Intenta con un PDF más pequeño.');
    }
    throw err;
  }
}
