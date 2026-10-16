/**
 * SGS Roster Import & Score Alignment Service
 * Implements ADR-005 and Technical Specification:
 * - Multi-channel ingestion (Excel/CSV, Clipboard Paste, Extension)
 * - Smart Thai Title Tokenizer (ด.ช., ด.ญ., นาย, นางสาว)
 * - Row-Order Fidelity Invariant (sgsRowIndex preservation 100%)
 * - 4-State Dry-Run Preview (NEW, EXISTS, CONFLICT, INVALID)
 * - Dual Reverse Sync (Excel template & 1-click clipboard copy)
 */

export type SgsImportRowStatus = 'NEW' | 'EXISTS' | 'CONFLICT' | 'INVALID';

export interface SgsParsedRow {
  rowIndex: number;              // ลำดับแถว 1..N ตามลำดับต้นฉบับในไฟล์หรือข้อความ
  rawSeatNo?: string;            // เลขที่ที่ตรวจพบ
  parsedSeatNo: number | null;   // เลขที่ที่แปลงเป็นตัวเลขได้
  studentCode: string;           // รหัสนักเรียน (เก็บเป็น String ห้ามตัด 0)
  title: string;                 // คำนำหน้า (ด.ช., ด.ญ., นาย, นางสาว)
  firstName: string;             // ชื่อ
  lastName: string;              // นามสกุล
  fullName: string;              // ชื่อ-นามสกุลรวม
  gender: 'MALE' | 'FEMALE';     // เพศที่วิเคราะห์ได้จากคำนำหน้า
  classroom?: string;            // ชั้น/ห้อง เช่น ม.1/1
  status: SgsImportRowStatus;    // สถานะเปรียบเทียบกับฐานข้อมูล
  conflictReason?: string;       // เหตุผลข้อขัดแย้ง (ถ้ามี)
  existingStudentId?: string;    // ไอดีของนักเรียนเดิมในระบบ (กรณีมีอยู่แล้ว)
  selectedAction?: 'IMPORT' | 'SKIP' | 'TRANSFER_ROOM'; // ทางเลือกของครู
}

export interface SgsImportDryRunSummary {
  totalRows: number;
  newCount: number;
  existsCount: number;
  conflictCount: number;
  invalidCount: number;
  rows: SgsParsedRow[];
  hasBlockingErrors: boolean;
}

export interface SgsScoreExportRow {
  sgsRowIndex: number;
  sgsSeatNo: number;
  studentCode: string;
  studentName: string;
  unit1Score: number;            // คะแนนเก็บหน่วย 1
  unit2Score: number;            // คะแนนเก็บหน่วย 2
  midtermScore: number;          // คะแนนสอบกลางภาค
  finalScore: number;            // คะแนนสอบปลายภาค
  totalScore: number;            // รวม 100
  grade: string;                 // เกรด 0 - 4
}

export interface ExistingStudentLookup {
  id: string;
  studentCode: string;
  name: string;
  classroomId?: string;
  sgsSeatNo?: number;
}

// ==========================================
// THAI TITLE TOKENIZER & GENDER DETECTION
// ==========================================

const THAI_MALE_TITLES = [
  'เด็กชาย', 'ด.ช.', 'ด.ช', 'นาย'
];

const THAI_FEMALE_TITLES = [
  'เด็กหญิง', 'ด.ญ.', 'ด.ญ', 'นางสาว', 'น.ส.', 'น.ส', 'นาง'
];

export interface ParsedThaiName {
  title: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE';
}

export function parseThaiFullName(rawName: string): ParsedThaiName {
  const cleaned = (rawName || '').trim().replace(/\s+/g, ' ');
  let title = '';
  let gender: 'MALE' | 'FEMALE' = 'MALE';
  let remaining = cleaned;

  // Check Female Titles first (to avoid 'นาง' colliding with 'นางสาว')
  for (const t of THAI_FEMALE_TITLES) {
    if (remaining.startsWith(t)) {
      title = t;
      gender = 'FEMALE';
      remaining = remaining.substring(t.length).trim();
      break;
    }
  }

  // Check Male Titles if not female
  if (!title) {
    for (const t of THAI_MALE_TITLES) {
      if (remaining.startsWith(t)) {
        title = t;
        gender = 'MALE';
        remaining = remaining.substring(t.length).trim();
        break;
      }
    }
  }

  // Normalize Title representation for display
  if (title === 'ด.ช' || title === 'ด.ช.' || title === 'เด็กชาย') title = 'ด.ช.';
  else if (title === 'ด.ญ' || title === 'ด.ญ.' || title === 'เด็กหญิง') title = 'ด.ญ.';
  else if (title === 'น.ส' || title === 'น.ส.' || title === 'นางสาว') title = 'นางสาว';
  else if (!title) {
    title = 'นาย'; // Default fallback
  }

  // Split remaining into First Name and Last Name
  const parts = remaining.split(' ').filter(Boolean);
  let firstName = '';
  let lastName = '';

  if (parts.length === 0) {
    firstName = cleaned;
    lastName = '';
  } else if (parts.length === 1) {
    firstName = parts[0];
    lastName = '';
  } else {
    firstName = parts[0];
    lastName = parts.slice(1).join(' ');
  }

  const fullName = `${title}${firstName} ${lastName}`.trim();

  return {
    title,
    firstName,
    lastName,
    fullName,
    gender
  };
}

// ==========================================
// SMART CLIPBOARD PARSER (Tabs / CSV / Spacing)
// ==========================================

export function parseSgsClipboardText(rawText: string, defaultClassroom?: string): SgsParsedRow[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const parsedRows: SgsParsedRow[] = [];
  let physicalRowCounter = 1;
  let currentRoom = defaultClassroom;

  for (const line of lines) {
    // 1. Detect Room Section Headers in SGS files (e.g. ชั้น ม.1  ห้องที่ 1)
    const fullRoomMatch = line.match(/ชั้น\s*(?:ม\.?)?\s*(\d+)\s*ห้องที่\s*(\d+)/i) ||
                          line.match(/ห้อง\s*(?:ม\.?)?\s*(\d+)\s*\/\s*(\d+)/i);
    if (fullRoomMatch) {
      currentRoom = `ม.${fullRoomMatch[1]}/${fullRoomMatch[2]}`;
      continue;
    }

    // 2. Detect Room Summary Footer (e.g. ห้องที่  1  รวม  35  คน -> Next room is ม.1/2)
    const summaryRoomMatch = line.match(/ห้องที่\s*(\d+)\s*รวม\s*\d+\s*คน/i);
    if (summaryRoomMatch) {
      const finishedRoomNum = parseInt(summaryRoomMatch[1], 10);
      const gradeLevel = (currentRoom || defaultClassroom || 'ม.1').split('/')[0] || 'ม.1';
      currentRoom = `${gradeLevel}/${finishedRoomNum + 1}`;
      continue;
    }

    // 3. Skip decorative headers and metadata rows
    if (
      line.includes('โรงเรียน') ||
      line.includes('วิชา') ||
      line.includes('ครูที่ปรึกษา') ||
      line.includes('ปีการศึกษา') ||
      line.startsWith('SGS') ||
      line.startsWith('ตารางแสดง') ||
      (line.includes('เลขที่') && (line.includes('ชื่อ') || line.includes('รหัส') || line.includes('เลขประจำตัว'))) ||
      (line.includes('ลำดับ') && line.includes('ชื่อ-สกุล'))
    ) {
      continue;
    }

    // Delimiter detection: Tab takes precedence, then Comma, then multi-space
    let tokens: string[] = [];
    if (line.includes('\t')) {
      tokens = line.split('\t').map(t => t.trim()).filter(Boolean);
    } else if (line.includes(',')) {
      tokens = line.split(',').map(t => t.trim()).filter(Boolean);
    } else {
      tokens = line.split(/\s{2,}|\s+/).map(t => t.trim()).filter(Boolean);
    }

    if (tokens.length === 0) continue;

    // Pattern Matching for Tokens:
    // Typical SGS Row formats:
    // Format 1: [SeatNo] [StudentCode] [Title] [FirstName] [LastName] [Room?]
    // Format 2: [SeatNo] [StudentCode] [FullName] [Room?]
    // Format 3: [StudentCode] [FullName] [SeatNo?]
    let rawSeatNo: string | undefined;
    let parsedSeatNo: number | null = null;
    let studentCode = '';
    let rawNameTokens: string[] = [];
    let detectedClassroom = currentRoom || defaultClassroom;

    // Find Student Code (usually 5 digits, but can be 4-7 digits string)
    const codeIndex = tokens.findIndex(t => /^\d{4,7}$/.test(t) && t.length >= 4);

    if (codeIndex !== -1) {
      studentCode = tokens[codeIndex];

      // Check if tokens before studentCode are seat number
      if (codeIndex > 0 && /^\d{1,3}$/.test(tokens[0])) {
        rawSeatNo = tokens[0];
        parsedSeatNo = parseInt(tokens[0], 10);
      }

      // Remaining tokens after codeIndex are likely Name and possibly Classroom
      const remainingTokens = tokens.filter((_, idx) => idx !== codeIndex && idx !== 0);

      // Check last token for classroom (e.g. ม.1/1, ม.3/2, 1/1, 3/1)
      if (remainingTokens.length > 1) {
        const lastToken = remainingTokens[remainingTokens.length - 1];
        if (/^(?:ม\.?\s*)?\d+\/\d+$/.test(lastToken)) {
          detectedClassroom = lastToken.startsWith('ม.') ? lastToken : `ม.${lastToken}`;
          rawNameTokens = remainingTokens.slice(0, remainingTokens.length - 1);
        } else {
          rawNameTokens = remainingTokens;
        }
      } else {
        rawNameTokens = remainingTokens;
      }
    } else {
      // If no valid student code was found, skip line if it looks like arbitrary non-student text
      if (/^\d{1,3}$/.test(tokens[0]) && tokens.length >= 2) {
        rawSeatNo = tokens[0];
        parsedSeatNo = parseInt(tokens[0], 10);
        rawNameTokens = tokens.slice(1);
      } else {
        // Skip decorative / unparsable rows without a code
        continue;
      }
    }

    // Name Parsing
    const rawFullName = rawNameTokens.join(' ');
    if (!rawFullName.trim() && !studentCode) continue;

    const parsedName = parseThaiFullName(rawFullName);

    // Initial Status
    const isInvalid = !studentCode || !parsedName.firstName;

    parsedRows.push({
      rowIndex: physicalRowCounter++,
      rawSeatNo,
      parsedSeatNo,
      studentCode: studentCode || `TEMP_${physicalRowCounter}`,
      title: parsedName.title,
      firstName: parsedName.firstName,
      lastName: parsedName.lastName,
      fullName: parsedName.fullName,
      gender: parsedName.gender,
      classroom: detectedClassroom,
      status: isInvalid ? 'INVALID' : 'NEW',
      conflictReason: isInvalid ? 'ไม่พบรหัสนักเรียนหรือชื่อไม่สมบูรณ์' : undefined,
      selectedAction: isInvalid ? 'SKIP' : 'IMPORT'
    });
  }

  return parsedRows;
}

// ==========================================
// 4-STATE DRY-RUN EVALUATION ENGINE
// ==========================================

export function evaluateSgsImportDryRun(
  parsedRows: SgsParsedRow[],
  targetClassroom: string,
  existingStudents: ExistingStudentLookup[]
): SgsImportDryRunSummary {
  const existingByCode = new Map<string, ExistingStudentLookup>();
  existingStudents.forEach(st => {
    if (st.studentCode) {
      existingByCode.set(st.studentCode.trim(), st);
    }
  });

  const evaluatedRows: SgsParsedRow[] = parsedRows.map((row) => {
    // If already marked INVALID by parser
    if (row.status === 'INVALID') {
      return { ...row, selectedAction: 'SKIP' };
    }

    const existing = existingByCode.get(row.studentCode.trim());

    if (!existing) {
      // Brand new student
      return {
        ...row,
        classroom: targetClassroom,
        status: 'NEW',
        selectedAction: 'IMPORT'
      };
    }

    // Student exists in DB
    const isSameRoom =
      !existing.classroomId ||
      existing.classroomId === targetClassroom ||
      existing.classroomId === `room-${targetClassroom.replace('ม.', '').replace('/', '-')}`;

    if (isSameRoom) {
      // Exists in this exact room
      return {
        ...row,
        existingStudentId: existing.id,
        classroom: targetClassroom,
        status: 'EXISTS',
        conflictReason: 'มีรายชื่ออยู่ในห้องเรียนนี้แล้ว (ข้ามอัตโนมัติ เพื่อรักษาคะแนนเดิม)',
        selectedAction: 'SKIP'
      };
    }

    // Conflict: exists in a different classroom!
    return {
      ...row,
      existingStudentId: existing.id,
      status: 'CONFLICT',
      conflictReason: `รหัสนี้ลงทะเบียนอยู่ในห้อง ${existing.classroomId} แล้ว`,
      selectedAction: 'TRANSFER_ROOM' // Recommended action
    };
  });

  const newCount = evaluatedRows.filter(r => r.status === 'NEW').length;
  const existsCount = evaluatedRows.filter(r => r.status === 'EXISTS').length;
  const conflictCount = evaluatedRows.filter(r => r.status === 'CONFLICT').length;
  const invalidCount = evaluatedRows.filter(r => r.status === 'INVALID').length;

  return {
    totalRows: evaluatedRows.length,
    newCount,
    existsCount,
    conflictCount,
    invalidCount,
    rows: evaluatedRows,
    hasBlockingErrors: invalidCount > 0 && evaluatedRows.every(r => r.status === 'INVALID')
  };
}

// ==========================================
// REVERSE SYNC & SCORE EXPORT HELPERS
// ==========================================

export function generateSgsScoreExportRows(
  roster: Array<{
    sgsRowIndex?: number;
    sgsSeatNo?: number;
    studentCode: string;
    studentName: string;
    unit1Score?: number;
    unit2Score?: number;
    midtermScore?: number;
    finalScore?: number;
    totalScore?: number;
    grade?: string;
  }>
): SgsScoreExportRow[] {
  // Sort strictly by sgsRowIndex to guarantee 100% SGS order alignment
  const sorted = [...roster].sort((a, b) => (a.sgsRowIndex ?? 0) - (b.sgsRowIndex ?? 0));

  return sorted.map((item, idx) => {
    const unit1 = item.unit1Score ?? 0;
    const unit2 = item.unit2Score ?? 0;
    const midterm = item.midtermScore ?? 0;
    const final = item.finalScore ?? 0;
    const total = item.totalScore ?? (unit1 + unit2 + midterm + final);

    let grade = item.grade;
    if (!grade) {
      if (total >= 80) grade = '4';
      else if (total >= 75) grade = '3.5';
      else if (total >= 70) grade = '3';
      else if (total >= 65) grade = '2.5';
      else if (total >= 60) grade = '2';
      else if (total >= 55) grade = '1.5';
      else if (total >= 50) grade = '1';
      else grade = '0';
    }

    return {
      sgsRowIndex: item.sgsRowIndex ?? idx + 1,
      sgsSeatNo: item.sgsSeatNo ?? idx + 1,
      studentCode: item.studentCode,
      studentName: item.studentName,
      unit1Score: unit1,
      unit2Score: unit2,
      midtermScore: midterm,
      finalScore: final,
      totalScore: total,
      grade
    };
  });
}

/**
 * 1-Click Clipboard Formatter: Formats a single column of scores separated by newlines
 * so teachers can paste directly into SGS web table.
 */
export function formatScoreColumnForClipboard(
  rows: SgsScoreExportRow[],
  column: 'unit1' | 'unit2' | 'midterm' | 'final' | 'total' | 'grade'
): string {
  return rows.map((r) => {
    switch (column) {
      case 'unit1': return r.unit1Score.toString();
      case 'unit2': return r.unit2Score.toString();
      case 'midterm': return r.midtermScore.toString();
      case 'final': return r.finalScore.toString();
      case 'total': return r.totalScore.toString();
      case 'grade': return r.grade;
      default: return '';
    }
  }).join('\n');
}

/**
 * Generates CSV content matching SGS import specification
 */
export function generateSgsCsvContent(rows: SgsScoreExportRow[]): string {
  const headers = ['ลำดับ', 'เลขที่', 'รหัสนักเรียน', 'ชื่อ-สกุล', 'คะแนนเก็บหน่วย1', 'คะแนนเก็บหน่วย2', 'คะแนนกลางภาค', 'คะแนนปลายภาค', 'คะแนนรวม', 'เกรด'];
  const dataLines = rows.map(r => [
    r.sgsRowIndex,
    r.sgsSeatNo,
    r.studentCode,
    `"${r.studentName}"`,
    r.unit1Score,
    r.unit2Score,
    r.midtermScore,
    r.finalScore,
    r.totalScore,
    r.grade
  ].join(','));

  return '\uFEFF' + [headers.join(','), ...dataLines].join('\n'); // Add BOM for Excel Thai readability
}
