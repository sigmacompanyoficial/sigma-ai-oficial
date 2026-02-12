import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { load as cheerioLoad } from 'cheerio';

export const runtime = 'nodejs';

/**
 * Extrae el texto de un archivo (solo en servidor)
 */
async function extractFileText(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  try {
    // PDF
    if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath);

      // Importación directa para evitar errores de test en pdf-parse 1.1.1
      const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');

      if (typeof pdfParse !== 'function') {
        throw new Error('pdfParse no es una función');
      }

      const data = await pdfParse(buffer);
      return data.text;
    }

    // DOCX
    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }

    // Excel
    if (['.xls', '.xlsx'].includes(ext)) {
      const workbook = XLSX.readFile(filePath);
      let text = '';
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        text += `\n=== Sheet: ${sheetName} ===\n`;
        text += XLSX.utils.sheet_to_csv(sheet) + '\n';
      });
      return text;
    }

    // HTML
    if (['.html', '.htm'].includes(ext)) {
      const html = fs.readFileSync(filePath, 'utf8');
      const $ = cheerioLoad(html);
      return $.text();
    }

    // Texto plano y código
    if ([
      '.txt', '.js', '.ts', '.jsx', '.tsx',
      '.css', '.py', '.java', '.c', '.cpp',
      '.json', '.md', '.csv', '.log', '.env'
    ].includes(ext)) {
      return fs.readFileSync(filePath, 'utf8');
    }

    throw new Error(`Formato no soportado: ${ext}`);
  } catch (error) {
    throw new Error(`Error al extraer: ${error.message}`);
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Only allow images server-side
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml'];
    const isImageType = file.type && allowedImageTypes.includes(file.type.toLowerCase());
    const ext = path.extname(file.name || '').toLowerCase();
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
    if (!isImageType && !allowedExt.includes(ext)) {
      return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 });
    }

    // Crear directorio tmp si no existe
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const tempPath = path.join(tmpDir, file.name);

    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(tempPath, Buffer.from(arrayBuffer));

    const text = await extractFileText(tempPath);

    fs.unlinkSync(tempPath);

    return NextResponse.json({ text: text.slice(0, 10000) });

  } catch (error) {
    console.error('File parsing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
