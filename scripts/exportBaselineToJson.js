import fs from 'fs';
import path from 'path';

// Read initialData.ts
const initialDataPath = path.resolve('src/data/initialData.ts');
const content = fs.readFileSync(initialDataPath, 'utf8');

// Helper to extract exported const JSON arrays/objects
function extractConst(name) {
  const marker = `export const ${name}`;
  const startIdx = content.indexOf(marker);
  if (startIdx === -1) return null;
  const eqIdx = content.indexOf('=', startIdx);
  const openBracket = content.indexOf('[', eqIdx);
  const openBrace = content.indexOf('{', eqIdx);
  
  let isArray = false;
  let startCharIdx = -1;
  if (openBracket !== -1 && (openBrace === -1 || openBracket < openBrace)) {
    isArray = true;
    startCharIdx = openBracket;
  } else if (openBrace !== -1) {
    isArray = false;
    startCharIdx = openBrace;
  }
  
  // Find matching closing bracket/brace
  let depth = 0;
  let endCharIdx = -1;
  const openChar = isArray ? '[' : '{';
  const closeChar = isArray ? ']' : '}';
  
  for (let i = startCharIdx; i < content.length; i++) {
    if (content[i] === openChar) depth++;
    else if (content[i] === closeChar) {
      depth--;
      if (depth === 0) {
        endCharIdx = i;
        break;
      }
    }
  }
  
  const rawStr = content.slice(startCharIdx, endCharIdx + 1);
  return JSON.parse(rawStr);
}

const jacs = extractConst('SABANETA_JACS');
const athletes = extractConst('INITIAL_ATHLETES');
const registrations = extractConst('INITIAL_REGISTRATIONS');
const matches = [];
const medals = extractConst('INITIAL_MEDALS');

const baseline = {
  jacs,
  athletes,
  registrations,
  matches,
  medals
};

const outDir = path.resolve('server/data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'baseline.json'), JSON.stringify(baseline, null, 2), 'utf8');
console.log(`✅ Baseline exported to server/data/baseline.json with ${athletes.length} athletes, ${registrations.length} registrations, ${jacs.length} JACs.`);
