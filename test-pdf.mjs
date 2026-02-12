import * as pdfModule from 'pdf-parse';
console.log('Full Module:', pdfModule);
import pdfDefault from 'pdf-parse';
console.log('Default Import:', typeof pdfDefault);
const { default: pdfDestructured } = await import('pdf-parse');
console.log('Destructured Default:', typeof pdfDestructured);
