import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Iniciando despliegue de Juegos Asocomunales Sabaneta 2026...');

// 1. Build
console.log('📦 Compilando aplicación de producción...');
execSync('npm run build', { stdio: 'inherit' });

// 2. Ensure .nojekyll and 404.html
const distPath = path.resolve('dist');
fs.writeFileSync(path.join(distPath, '.nojekyll'), '');
fs.copyFileSync(path.join(distPath, 'index.html'), path.join(distPath, '404.html'));

// 3. Push to gh-pages branch
console.log('🌐 Publicando a GitHub Pages (rama gh-pages)...');
const repoUrl = 'https://github.com/elkinguttierrez-pixel/juegos-asocomunales-sabaneta.git';

process.chdir(distPath);
execSync('git init', { stdio: 'ignore' });
execSync('git checkout -B gh-pages', { stdio: 'ignore' });
execSync('git add -A', { stdio: 'ignore' });
execSync('git commit -m "Auto-deploy to GitHub Pages"', { stdio: 'ignore' });
execSync(`git push -f ${repoUrl} gh-pages`, { stdio: 'inherit' });

console.log('✅ ¡Despliegue completado con éxito!');
console.log('🔗 URL pública: https://elkinguttierrez-pixel.github.io/juegos-asocomunales-sabaneta/');
