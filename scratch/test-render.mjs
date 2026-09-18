import { JSDOM, VirtualConsole } from 'jsdom';
import fs from 'fs';
import path from 'path';

const distPath = path.resolve('dist');
const html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');

const virtualConsole = new VirtualConsole();
virtualConsole.on('error', (err) => console.error('JS CONSOLE ERROR:', err));
virtualConsole.on('jsdomError', (err) => console.error('JSDOM ERROR:', err));
virtualConsole.on('log', (msg) => console.log('JS CONSOLE LOG:', msg));

const dom = new JSDOM(html, {
  url: 'https://mmk3996.github.io/training-night/',
  runScripts: 'dangerously',
  resources: 'usable',
  virtualConsole,
});

// Wait for scripts
setTimeout(() => {
  console.log('Root HTML after render:');
  console.log(dom.window.document.getElementById('root')?.innerHTML);
}, 2000);
