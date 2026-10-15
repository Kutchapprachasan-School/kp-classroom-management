import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve('src');
const OUTPUT_FILE = path.resolve('docs/CODEBASE_INDEX.md');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function analyzeFile(filePath) {
  const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const lineCount = lines.length;

  const keyItems = [];
  const componentOrFunctionRegex = /^(?:export\s+(?:default\s+)?(?:function|const|class|interface|type)\s+([A-Za-z0-9_]+))/;
  const viewOrSectionCommentRegex = /^\s*(?:\/\/|\/\*+)\s*==+\s*([^=]+?)\s*==+/;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const compMatch = line.match(componentOrFunctionRegex);
    if (compMatch) {
      keyItems.push({ type: 'export', name: compMatch[1], line: lineNum });
    }
    const sectionMatch = line.match(viewOrSectionCommentRegex);
    if (sectionMatch) {
      keyItems.push({ type: 'section', name: sectionMatch[1].trim(), line: lineNum });
    }
  });

  // Category determination
  let category = 'Other';
  if (relPath.startsWith('src/views/')) category = 'Views (หน้าระบบ)';
  else if (relPath.startsWith('src/components/layout/')) category = 'Layout Components';
  else if (relPath.startsWith('src/components/dashboard/')) category = 'Dashboard Components';
  else if (relPath.startsWith('src/components/student/')) category = 'Student Portal Components';
  else if (relPath.startsWith('src/components/')) category = 'General Components';
  else if (relPath.startsWith('src/services/')) category = 'Services (Business Logic & Storage)';
  else if (relPath.startsWith('src/config/')) category = 'Config & Constants';
  else if (relPath.startsWith('src/utils/')) category = 'Utilities';
  else if (relPath.startsWith('src/types/')) category = 'Type Definitions';
  else if (relPath.startsWith('src/context/')) category = 'Contexts & State';
  else if (relPath.startsWith('src/data/')) category = 'Data & Mock Stores';

  return {
    relPath,
    category,
    lineCount,
    keyItems
  };
}

const files = getAllFiles(SRC_DIR);
const analyzed = files.map(analyzeFile);

// Group by category
const grouped = {};
analyzed.forEach((item) => {
  if (!grouped[item.category]) grouped[item.category] = [];
  grouped[item.category].push(item);
});

// Category ordering
const categoryOrder = [
  'Views (หน้าระบบ)',
  'Layout Components',
  'Dashboard Components',
  'Student Portal Components',
  'General Components',
  'Services (Business Logic & Storage)',
  'Config & Constants',
  'Contexts & State',
  'Utilities',
  'Type Definitions',
  'Data & Mock Stores',
  'Other'
];

let markdown = `# Codebase Index & Symbol Location Map (สารบัญโครงสร้างโค้ด)\n\n`;
markdown += `> **กฎเหล็กเพื่อประสิทธิภาพ Context และ Token (Rule 6)**:\n`;
markdown += `> สารบัญนี้ทำหน้าที่เป็น Navigation Map เพื่อให้ AI Assistant และผู้พัฒนาสามารถตรวจสอบตำแหน่งไฟล์, สัญลักษณ์หลัก (Components / Functions / Types), และช่วงบรรทัด (Line Ranges) ได้ทันที **โดยไม่ต้องเปิดดูทั้งไฟล์ (ห้าม Full View)**\n`;
markdown += `> **ข้อบังคับ**: ทุกครั้งที่มีการเพิ่มไฟล์ใหม่, ลบไฟล์, หรือปรับแก้โครงสร้างหลัก ต้องรัน \`node scripts/index_codebase.mjs\` เพื่ออัปเดตสารบัญนี้เสมอ\n\n`;
markdown += `*อัปเดตล่าสุด: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} | รวมทั้งหมด ${analyzed.length} ไฟล์*\n\n`;
markdown += `---\n\n`;

categoryOrder.forEach((cat) => {
  const items = grouped[cat];
  if (!items || items.length === 0) return;

  markdown += `## ${cat}\n\n`;
  markdown += `| ไฟล์ (File Path) | จำนวนบรรทัด | สัญลักษณ์หลัก & ช่วงบรรทัด (Key Exports & Line Numbers) |\n`;
  markdown += `| :--- | :---: | :--- |\n`;

  items.sort((a, b) => a.relPath.localeCompare(b.relPath));

  items.forEach((item) => {
    const symbols = item.keyItems.slice(0, 10).map((s) => {
      if (s.type === 'section') {
        return `📌 *${s.name}* (L${s.line})`;
      }
      return `\`${s.name}\` (L${s.line})`;
    }).join(', ');

    const displaySymbols = symbols ? symbols : '*(Internal / Default Export)*';
    const moreCount = item.keyItems.length > 10 ? ` *(+${item.keyItems.length - 10} รายการ)*` : '';

    markdown += `| [${item.relPath}](file:///${path.resolve(item.relPath).replace(/\\/g, '/')}) | ${item.lineCount} | ${displaySymbols}${moreCount} |\n`;
  });

  markdown += `\n`;
});

fs.writeFileSync(OUTPUT_FILE, markdown, 'utf-8');
console.log(`Successfully generated ${OUTPUT_FILE} with ${analyzed.length} files indexed.`);
