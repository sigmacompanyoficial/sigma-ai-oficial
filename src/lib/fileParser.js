/**
 * Cliente: Envía archivo al servidor para extracción
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
    const error = await response.json();
    console.error('[FILE_PARSER] Parse failed:', error);
    throw new Error(error.error || 'Error al procesar el archivo');
  }

  const result = await response.json();
  console.log('[FILE_PARSER] Extraction completed:', {
    name: file?.name,
    extractedChars: result?.text?.length || 0,
  });
  return result.text;
}

/**
 * PDF Vision: Convierte PDF a imagen y lo analiza con un modelo multimodal
 */
export async function uploadAndVisionPDF(file, prompt = "Resume este documento detalladamente y extrae los puntos clave.") {
  console.log('[FILE_PARSER] Starting PDF Vision:', {
    name: file?.name,
    type: file?.type,
    size: file?.size,
  });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('prompt', prompt);
  // Podemos pasar el modelo aquí si quisiéramos externalizarlo

  const response = await fetch('/api/pdf-vision', {
    method: 'POST',
    body: formData,
  });

  console.log('[FILE_PARSER] PDF Vision response status:', response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error('[FILE_PARSER] PDF Vision failed:', error);
    throw new Error(error.error || 'Error al analizar el PDF con visión');
  }

  const result = await response.json();
  console.log('[FILE_PARSER] PDF Vision completed for', file?.name);

  // Devolvemos el resultado del análisis visual como "contenido" del documento
  return `[ANÁLISIS VISUAL DEL PDF]:\n${result.result}`;
}
