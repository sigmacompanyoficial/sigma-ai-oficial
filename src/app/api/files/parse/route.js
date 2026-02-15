import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { load as cheerioLoad } from 'cheerio';
import Tesseract from 'tesseract.js';

export const runtime = 'nodejs';
const MAX_EXTRACTED_CHARS = 40000;

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
      case '.jsx':
      case '.ts':
      case '.tsx':
      case '.py':
      case '.md':
      case '.json':
      case '.yaml':
      case '.yml':
      case '.xml':
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
  let tempPath = null;
  try {
    console.log('📄 [PARSE_API] New parse request');
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    console.log('📄 [PARSE_API] File received:', { name: file.name, type: file.type, size: file.size });

    // Permitir imágenes y documentos
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml'];
    const allowedDocTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain', 'text/html', 'application/json', 'text/csv'
    ];

    const isImage = file.type && allowedImageTypes.includes(file.type.toLowerCase());
    const isDoc = file.type && allowedDocTypes.includes(file.type.toLowerCase());
    const ext = path.extname(file.name || '').toLowerCase();
    const allowedExt = [
      '.jpg', '.jpeg', '.png', '.webp', '.bmp',
      '.pdf', '.docx', '.xlsx', '.xls',
      '.txt', '.csv', '.json', '.html', '.htm',
      '.js', '.jsx', '.ts', '.tsx', '.py', '.md',
      '.xml', '.yaml', '.yml', '.env'
    ];

    if (!isImage && !isDoc && !allowedExt.includes(ext)) {
      console.warn('⚠️ [PARSE_API] Unsupported format:', { name: file.name, type: file.type, ext });
      return NextResponse.json({ error: 'Formato de archivo no soportado' }, { status: 400 });
    }

    // Crear directorio tmp si no existe
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}-${file.name}`;
    tempPath = path.join(tmpDir, uniqueName);

    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(tempPath, Buffer.from(arrayBuffer));

    const text = await extractFileText(tempPath);
    const normalizedText = (text || '').replace(/\u0000/g, '').replace(/\r\n/g, '\n').trim();
    console.log('✅ [PARSE_API] Extraction done:', { name: file.name, extractedChars: normalizedText.length });

    return NextResponse.json({ text: normalizedText.slice(0, MAX_EXTRACTED_CHARS) });

  } catch (error) {
    console.error('❌ [PARSE_API] File parsing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (tempPath && fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (cleanupErr) {
        console.warn('No se pudo limpiar archivo temporal:', cleanupErr);
      }
    }
  }
}
