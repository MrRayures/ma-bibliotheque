import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';

const ICONS_DIR = 'src/assets/icons';
const OUTPUT_DIR = 'public/icons';
const OUTPUT_FILE = join(OUTPUT_DIR, 'sprite.svg');

async function extractSvgContent(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const cleaned = content.replace(/<defs\s*\/>/g, '');
  const innerMatch = cleaned.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  return innerMatch ? innerMatch[1].trim() : '';
}

async function generateSprite() {
  const files = (await readdir(ICONS_DIR)).filter((f) => extname(f) === '.svg').sort();

  const symbols = [];

  for (const file of files) {
    const id = basename(file, '.svg');
    const inner = await extractSvgContent(join(ICONS_DIR, file));

    if (!inner) {
      console.warn(`[icons] Skipped empty SVG: ${file}`);
      continue;
    }

    symbols.push(`  <symbol id="${id}" viewBox="0 0 24 24">\n    ${inner}\n  </symbol>`);
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  const sprite = [
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">',
    ...symbols,
    '</svg>',
    '',
  ].join('\n');

  await writeFile(OUTPUT_FILE, sprite, 'utf-8');
  console.log(`[icons] Generated sprite with ${symbols.length} icons → ${OUTPUT_FILE}`);
}

generateSprite();
