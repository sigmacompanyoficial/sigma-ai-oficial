/**
 * Cliente: Envía archivo al servidor para extracción
 */
export async function uploadAndExtractFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/files/parse', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al procesar el archivo');
  }

  const result = await response.json();
  return result.text;
}
