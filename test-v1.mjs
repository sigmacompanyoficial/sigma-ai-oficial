const mod = await import('pdf-parse');
console.log('Keys:', Object.keys(mod));
console.log('Default type:', typeof mod.default);
if (typeof mod.default === 'function') {
  console.log('SUCCESS: pdf-parse is a function in .default');
} else if (typeof mod === 'function') {
  console.log('SUCCESS: pdf-parse is the module itself');
}
