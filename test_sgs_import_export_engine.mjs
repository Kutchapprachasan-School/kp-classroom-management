import assert from 'node:assert';
import {
  parseThaiFullName,
  parseSgsClipboardText,
  evaluateSgsImportDryRun,
  generateSgsScoreExportRows,
  formatScoreColumnForClipboard,
  generateSgsCsvContent
} from './src/services/sgsImportExportService.ts';

console.log('🧪 Starting SGS Roster Import & Score Alignment Engine Test Suite...');

// -------------------------------------------------------------
// Test 1: Thai Name Tokenizer & Gender Detection
// -------------------------------------------------------------
console.log('\n--- 1. Testing Thai Name Tokenizer & Gender Detection ---');

const testCases = [
  {
    raw: 'ด.ช.ธนกฤต วิทยานุกูล',
    expectedTitle: 'ด.ช.',
    expectedFirst: 'ธนกฤต',
    expectedLast: 'วิทยานุกูล',
    expectedGender: 'MALE'
  },
  {
    raw: 'เด็กหญิงสุดา งามดี',
    expectedTitle: 'ด.ญ.',
    expectedFirst: 'สุดา',
    expectedLast: 'งามดี',
    expectedGender: 'FEMALE'
  },
  {
    raw: 'นายศิริชัย เลิศล้ำ',
    expectedTitle: 'นาย',
    expectedFirst: 'ศิริชัย',
    expectedLast: 'เลิศล้ำ',
    expectedGender: 'MALE'
  },
  {
    raw: 'นางสาวกานดา สดใส',
    expectedTitle: 'นางสาว',
    expectedFirst: 'กานดา',
    expectedLast: 'สดใส',
    expectedGender: 'FEMALE'
  },
  {
    raw: 'ด.ญ. สมใจ มุ่งมั่น', // space after title
    expectedTitle: 'ด.ญ.',
    expectedFirst: 'สมใจ',
    expectedLast: 'มุ่งมั่น',
    expectedGender: 'FEMALE'
  }
];

for (const tc of testCases) {
  const result = parseThaiFullName(tc.raw);
  assert.strictEqual(result.title, tc.expectedTitle, `Title mismatch for ${tc.raw}`);
  assert.strictEqual(result.firstName, tc.expectedFirst, `First name mismatch for ${tc.raw}`);
  assert.strictEqual(result.lastName, tc.expectedLast, `Last name mismatch for ${tc.raw}`);
  assert.strictEqual(result.gender, tc.expectedGender, `Gender mismatch for ${tc.raw}`);
  console.log(`  ✓ Tokenized: "${tc.raw}" -> [${result.title}] ${result.firstName} ${result.lastName} (${result.gender})`);
}

// -------------------------------------------------------------
// Test 2: Clipboard Text Parsing (Tab-separated from SGS web)
// -------------------------------------------------------------
console.log('\n--- 2. Testing SGS Web Tab-Separated Clipboard Parser ---');

const sgsWebSample = `
เลขที่	รหัสนักเรียน	ชื่อ-สกุล	ชั้น/ห้อง
1	08451	ด.ช. ภัทรพล เจริญผล	ม.1/1
2	08452	ด.ช. ศุภชัย วิมลชาติ	ม.1/1
4	08454	ด.ญ. กัญญารัตน์ ศรีสุข	ม.1/1
`;

const parsedTabRows = parseSgsClipboardText(sgsWebSample);
assert.strictEqual(parsedTabRows.length, 3, 'Should parse exactly 3 student rows (skipping header)');

// Verify row 1
assert.strictEqual(parsedTabRows[0].rowIndex, 1);
assert.strictEqual(parsedTabRows[0].parsedSeatNo, 1);
assert.strictEqual(parsedTabRows[0].studentCode, '08451');
assert.strictEqual(parsedTabRows[0].firstName, 'ภัทรพล');
assert.strictEqual(parsedTabRows[0].gender, 'MALE');

// Verify row 3 (Gap in seat numbers: seat 4, but physical row index 3)
assert.strictEqual(parsedTabRows[2].rowIndex, 3);
assert.strictEqual(parsedTabRows[2].parsedSeatNo, 4, 'Seat number 4 must be preserved');
assert.strictEqual(parsedTabRows[2].studentCode, '08454');
assert.strictEqual(parsedTabRows[2].firstName, 'กัญญารัตน์');
assert.strictEqual(parsedTabRows[2].gender, 'FEMALE');

console.log('  ✓ Parsed 3 rows with gap handling (Seats: 1, 2, 4 -> RowIndexes: 1, 2, 3)');

// -------------------------------------------------------------
// Test 3: Leading Zeros Preservation Invariant
// -------------------------------------------------------------
console.log('\n--- 3. Testing Leading Zeros Preservation ---');

assert.strictEqual(typeof parsedTabRows[0].studentCode, 'string');
assert.strictEqual(parsedTabRows[0].studentCode.startsWith('0'), true, 'Leading zero must NOT be dropped');
console.log(`  ✓ Student code "${parsedTabRows[0].studentCode}" preserved as string with leading zero`);

// -------------------------------------------------------------
// Test 4: 4-State Dry-Run Evaluation (NEW, EXISTS, CONFLICT, INVALID)
// -------------------------------------------------------------
console.log('\n--- 4. Testing 4-State Dry-Run Evaluation Engine ---');

const existingDatabaseStudents = [
  // Existing in room 1/1 (should result in EXISTS)
  {
    id: 'st-001',
    studentCode: '08451',
    name: 'ด.ช. ภัทรพล เจริญผล',
    classroomId: 'ม.1/1',
    sgsSeatNo: 1
  },
  // Existing in a DIFFERENT room 1/2 (should result in CONFLICT)
  {
    id: 'st-099',
    studentCode: '08452',
    name: 'ด.ช. ศุภชัย วิมลชาติ',
    classroomId: 'ม.1/2',
    sgsSeatNo: 15
  }
];

const dryRunResult = evaluateSgsImportDryRun(parsedTabRows, 'ม.1/1', existingDatabaseStudents);

assert.strictEqual(dryRunResult.totalRows, 3);
assert.strictEqual(dryRunResult.existsCount, 1, '08451 should be classified as EXISTS');
assert.strictEqual(dryRunResult.conflictCount, 1, '08452 should be classified as CONFLICT (different room)');
assert.strictEqual(dryRunResult.newCount, 1, '08454 should be classified as NEW');
assert.strictEqual(dryRunResult.invalidCount, 0);
assert.strictEqual(dryRunResult.seatChangedCount, 0, 'No seat changed when sgsSeatNo matches parsedSeatNo');

// Verify specific row actions
const existsRow = dryRunResult.rows.find(r => r.studentCode === '08451');
assert.strictEqual(existsRow.status, 'EXISTS');
assert.strictEqual(existsRow.selectedAction, 'SKIP', 'EXISTS row must default to safe SKIP');
assert.strictEqual(existsRow.isSeatChanged, false);

const conflictRow = dryRunResult.rows.find(r => r.studentCode === '08452');
assert.strictEqual(conflictRow.status, 'CONFLICT');
assert.strictEqual(conflictRow.selectedAction, 'TRANSFER_ROOM', 'CONFLICT row defaults to TRANSFER_ROOM option');

const newRow = dryRunResult.rows.find(r => r.studentCode === '08454');
assert.strictEqual(newRow.status, 'NEW');
assert.strictEqual(newRow.selectedAction, 'IMPORT');

// Verify Seat Shift Detection Test Case
const shiftedDatabaseStudents = [
  {
    id: 'st-001',
    studentCode: '08451',
    name: 'ด.ช. ภัทรพล เจริญผล',
    classroomId: 'ม.1/1',
    sgsSeatNo: 5 // In DB they are seat 5, but in parsed file they are seat 1!
  }
];
const shiftedResult = evaluateSgsImportDryRun(parsedTabRows, 'ม.1/1', shiftedDatabaseStudents);
assert.strictEqual(shiftedResult.seatChangedCount, 1, 'Should detect 1 shifted seat');
const shiftedRow = shiftedResult.rows.find(r => r.studentCode === '08451');
assert.strictEqual(shiftedRow.isSeatChanged, true);
assert.strictEqual(shiftedRow.existingSeatNo, 5);
assert.strictEqual(shiftedRow.parsedSeatNo, 1);
assert.ok(shiftedRow.conflictReason.includes('เลขที่เปลี่ยน'), 'Conflict reason must explain seat change');

console.log('  ✓ 4-State classification & Smart Seat Alignment verified: 1 NEW, 1 EXISTS (Seat Shift Detected), 1 CONFLICT');

// -------------------------------------------------------------
// Test 5: Reverse Sync Score Export & 1-Click Clipboard
// -------------------------------------------------------------
console.log('\n--- 5. Testing Reverse Sync Score Export & Alignment ---');

const courseRoster = [
  // Student 3 in physical row
  {
    sgsRowIndex: 3,
    sgsSeatNo: 4,
    studentCode: '08454',
    studentName: 'ด.ญ. กัญญารัตน์ ศรีสุข',
    unit1Score: 28,
    unit2Score: 20,
    midtermScore: 18,
    finalScore: 26
  },
  // Student 1 in physical row
  {
    sgsRowIndex: 1,
    sgsSeatNo: 1,
    studentCode: '08451',
    studentName: 'ด.ช. ภัทรพล เจริญผล',
    unit1Score: 25,
    unit2Score: 18,
    midtermScore: 16,
    finalScore: 24
  },
  // Student 2 in physical row
  {
    sgsRowIndex: 2,
    sgsSeatNo: 2,
    studentCode: '08452',
    studentName: 'ด.ช. ศุภชัย วิมลชาติ',
    unit1Score: 22,
    unit2Score: 15,
    midtermScore: 14,
    finalScore: 20
  }
];

const exportRows = generateSgsScoreExportRows(courseRoster);

// Crucial: Must be sorted by sgsRowIndex (1, 2, 3), not seat numbers, not code, not gender
assert.strictEqual(exportRows[0].sgsRowIndex, 1);
assert.strictEqual(exportRows[0].studentCode, '08451');
assert.strictEqual(exportRows[0].totalScore, 83);
assert.strictEqual(exportRows[0].grade, '4');

assert.strictEqual(exportRows[1].sgsRowIndex, 2);
assert.strictEqual(exportRows[1].studentCode, '08452');
assert.strictEqual(exportRows[1].totalScore, 71);
assert.strictEqual(exportRows[1].grade, '3');

assert.strictEqual(exportRows[2].sgsRowIndex, 3);
assert.strictEqual(exportRows[2].sgsSeatNo, 4);
assert.strictEqual(exportRows[2].studentCode, '08454');
assert.strictEqual(exportRows[2].totalScore, 92);
assert.strictEqual(exportRows[2].grade, '4');

console.log('  ✓ Reverse sync strictly preserves original sgsRowIndex order (1: 08451, 2: 08452, 3: 08454)');

// Test 1-click clipboard column formatter
const midtermClipboard = formatScoreColumnForClipboard(exportRows, 'midterm');
assert.strictEqual(midtermClipboard, '16\n14\n18');
console.log('  ✓ 1-Click Clipboard Formatter generated:\n' + midtermClipboard.split('\n').map(l => '      ' + l).join('\n'));

// Test CSV Content with BOM
const csv = generateSgsCsvContent(exportRows);
assert.strictEqual(csv.startsWith('\uFEFF'), true, 'CSV must start with UTF-8 BOM');
assert.strictEqual(csv.includes('08454'), true);
console.log('  ✓ CSV generator with UTF-8 BOM verified');

console.log('\n🎉 ALL SGS IMPORT & SCORE ALIGNMENT ENGINE TESTS PASSED PERFECTLY!\n');
