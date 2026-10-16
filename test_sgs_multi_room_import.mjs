import assert from 'assert';
import fs from 'fs';
import * as XLSX from 'xlsx';
import {
  parseSgsClipboardText,
  evaluateSgsImportDryRun
} from './src/services/sgsImportExportService.ts';
import {
  M1_SGS_STUDENT_LOOKUP,
  getM1SgsStudentInfo,
  isGrade1SgsStudentCode
} from './src/config/m1SgsLookup.ts';

console.log('Testing SGS Multi-Room Import & Detection System...');

// 1. Verify M1 Lookup Mapping
assert.strictEqual(Object.keys(M1_SGS_STUDENT_LOOKUP).length, 204, 'Must contain exactly 204 students');
assert.strictEqual(isGrade1SgsStudentCode('16056'), true, 'Student 16056 is Grade 1');
assert.strictEqual(isGrade1SgsStudentCode('15833'), true, 'Student 15833 is Grade 1');
assert.strictEqual(isGrade1SgsStudentCode('99999'), false, 'Non-existent student is false');

const s16056 = getM1SgsStudentInfo('16056');
assert.strictEqual(s16056?.room, 'ม.1/1', 'Student 16056 belongs to room ม.1/1');
assert.strictEqual(s16056?.seatNo, 1, 'Student 16056 is seat 1');

// 2. Test authentic SGS Excel file parsing
const xlsPath = 'C:/Users/ADMIN/.gemini/antigravity/brain/7dd4b73b-a80a-48fc-b132-617c87deccd1/.user_uploaded/media_1792120293430_2ec460a6.xls';
if (fs.existsSync(xlsPath)) {
  const buf = fs.readFileSync(xlsPath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const tsv = XLSX.utils.sheet_to_csv(sheet, { FS: '\t' });

  // Parse with default classroom set to ม.3/1 (simulating user viewing room 3/1)
  const parsedRows = parseSgsClipboardText(tsv, 'ม.3/1');
  assert.strictEqual(parsedRows.length, 204, 'Must parse exactly 204 students from SGS file');

  // Verify rooms in parsedRows
  const roomCounts = {};
  for (const r of parsedRows) {
    roomCounts[r.classroom] = (roomCounts[r.classroom] || 0) + 1;
  }

  assert.strictEqual(roomCounts['ม.1/1'], 35, 'ม.1/1 should have 35 students');
  assert.strictEqual(roomCounts['ม.1/2'], 35, 'ม.1/2 should have 35 students');
  assert.strictEqual(roomCounts['ม.1/3'], 30, 'ม.1/3 should have 30 students');
  assert.strictEqual(roomCounts['ม.1/4'], 35, 'ม.1/4 should have 35 students');
  assert.strictEqual(roomCounts['ม.1/5'], 35, 'ม.1/5 should have 35 students');
  assert.strictEqual(roomCounts['ม.1/6'], 34, 'ม.1/6 should have 34 students');

  // Dry run evaluation with targetClassroom = 'ม.3/1'
  const summary = evaluateSgsImportDryRun(parsedRows, 'ม.3/1', []);
  assert.strictEqual(summary.totalRows, 204);
  assert.strictEqual(summary.isMultiRoomFile, true, 'isMultiRoomFile must be true');
  assert.strictEqual(summary.targetClassroomMismatch, true, 'targetClassroomMismatch must be true because ม.3/1 is not in ม.1');
  assert.strictEqual(summary.detectedGrade, 'ม.1');
  assert.deepStrictEqual(summary.detectedRooms, ['ม.1/1', 'ม.1/2', 'ม.1/3', 'ม.1/4', 'ม.1/5', 'ม.1/6']);

  // Ensure row.classroom is preserved and NOT overwritten by targetClassroom
  assert.strictEqual(summary.rows[0].classroom, 'ม.1/1', 'Student 1 must stay in ม.1/1');
  assert.strictEqual(summary.rows[35].classroom, 'ม.1/2', 'Student 36 must stay in ม.1/2');
  assert.strictEqual(summary.rows[203].classroom, 'ม.1/6', 'Student 204 must stay in ม.1/6');

  console.log('✓ All 204 students parsed and assigned to correct rooms ม.1/1 - ม.1/6');
  console.log('✓ Dry-run multi-room detection & summary stats verified');
}

console.log('All multi-room SGS import tests PASSED!');
