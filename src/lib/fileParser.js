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
