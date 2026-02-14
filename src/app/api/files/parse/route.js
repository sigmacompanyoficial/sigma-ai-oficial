import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { load as cheerioLoad } from 'cheerio';
import Tesseract from 'tesseract.js';

export const runtime = 'nodejs';

/**
 * Extrae el texto de un archivo de forma modular
 */
async function extractFileText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  try {
    switch (ext) {
      case '.pdf': {
        const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
        const data = await pdfParse(buffer);
        return data.text;
      }

      case '.docx': {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      }

      case '.xlsx':
      case '.xls': {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        let text = '';
        workbook.SheetNames.forEach(sheetName => {
          text += `\n=== Hoja: ${sheetName} ===\n`;
          text += XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]) + '\n';
        });
        return text;
      }

      case '.html':
      case '.htm': {
        const $ = cheerioLoad(buffer.toString('utf8'));
        return $('body').text() || $.text();
      }

      case '.txt':
      case '.csv':
      case '.js':
      case '.ts':
      case '.py':
      case '.md':
      case '.json':
      case '.env':
        return buffer.toString('utf8');

      // Imágenes (OCR como fallback o por petición explícita)
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.webp':
      case '.bmp': {
        const { data: { text } } = await Tesseract.recognize(buffer, 'spa+eng');
        return text;
      }

      default:
        throw new Error(`Extensión ${ext} no soportada`);
    }
  } catch (error) {
    console.error(`Error procesando ${ext}:`, error);
    throw new Error(`Error al analizar el archivo: ${error.message}`);
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Permitir imágenes y documentos
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml'];
    const allowedDocTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/html', 'application/json', 'text/csv'
    ];

    const isImage = file.type && allowedImageTypes.includes(file.type.toLowerCase());
    const isDoc = file.type && allowedDocTypes.includes(file.type.toLowerCase());
    const ext = path.extname(file.name || '').toLowerCase();
    const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.docx', '.xlsx', '.txt', '.csv', '.json', '.html', '.js', '.py', '.md'];

    if (!isImage && !isDoc && !allowedExt.includes(ext)) {
      return NextResponse.json({ error: 'Formato de archivo no soportado' }, { status: 400 });
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
