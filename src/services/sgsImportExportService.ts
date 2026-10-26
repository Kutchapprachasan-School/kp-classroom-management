/**
 * SGS Roster Import & Score Alignment Service
 * Implements ADR-005 and Technical Specification:
 * - Multi-channel ingestion (Excel/CSV, Clipboard Paste, Extension)
 * - Smart Thai Title Tokenizer (ด.ช., ด.ญ., นาย, นางสาว)
 * - Row-Order Fidelity Invariant (sgsRowIndex preservation 100%)
 * - 4-State Dry-Run Preview (NEW, EXISTS, CONFLICT, INVALID)
 * - Dual Reverse Sync (Excel template & 1-click clipboard copy)
 */

import { resolveRoomCandidates, CANONICAL_TIMESTAMP_ROOM_MAP } from './masterDataService';

/**
 * แปลงชื่อหรือรหัสห้องเรียนทุกรูปแบบให้เป็นมาตรฐานเดียวกัน "ม.X/Y" เสมอ
 * เช่น "4/4", "ม. 4 / 4", "ม4/4", "room-4-4", "room-1791986991422", "ชั้นมัธยมศึกษาปีที่ 4 ห้องที่ 4" -> "ม.4/4"
 */
export function normalizeClassroomName(raw?: string | null, fallback = 'ม.1/1'): string {
  if (!raw) return fallback;
  const trimmed = String(raw).trim();
  if (!trimmed) return fallback;

  // 1. Direct match in canonical timestamp room map
  if (CANONICAL_TIMESTAMP_ROOM_MAP[trimmed]) {
    return CANONICAL_TIMESTAMP_ROOM_MAP[trimmed];
  }

  // 2. Direct Thai pattern "ม.4/4", "ม. 4 / 4", "ม4/4", "4/4", "4 / 4"
  const slashMatch = trimmed.match(/^(?:ม\.?\s*)?(\d+)\s*\/\s*(\d+)$/);
  if (slashMatch) {
    return `ม.${slashMatch[1]}/${slashMatch[2]}`;
  }

  // 3. Verbose Thai pattern "ชั้นมัธยมศึกษาปีที่ 4 ห้องที่ 4", "ชั้น ม.4 ห้อง 4", "ม.4 ห้องที่ 4"
  const verboseMatch =
    trimmed.match(/(?:ชั้น\s*(?:มัธยมศึกษาปีที่|ม\.?)\s*(\d+)\s*(?:ห้องที่|ห้อง|\/)\s*(\d+))|(?:ห้อง\s*(?:ม\.?)?\s*(\d+)\s*\/\s*(\d+))/i) ||
    trimmed.match(/ม\.?\s*(\d+)\s*(?:ห้องที่|ห้อง|\/)\s*(\d+)/i);
  if (verboseMatch) {
    const g = verboseMatch[1] || verboseMatch[3];
    const r = verboseMatch[2] || verboseMatch[4];
    if (g && r) return `ม.${g}/${r}`;
  }

  // 4. English / Room code "room-4-4", "room_4_4", "M.4/4", "m4/4"
  const roomCodeMatch =
    trimmed.match(/^room[-_](\d+)[-_](\d+)$/i) ||
    trimmed.match(/^m\.?\s*(\d+)\s*[-_\/]\s*(\d+)$/i);
  if (roomCodeMatch) {
    return `ม.${roomCodeMatch[1]}/${roomCodeMatch[2]}`;
  }

  return trimmed;
}

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
  existingSeatNo?: number;       // เลขที่เดิมในระบบ
  isSeatChanged?: boolean;       // ตรวจพบว่าเลขที่ในไฟล์ SGS ต่างจากเลขที่เดิม
  selectedAction?: 'IMPORT' | 'SKIP' | 'TRANSFER_ROOM' | 'UPDATE_SEAT'; // ทางเลือกของครู
}

export interface SgsImportDryRunSummary {
  totalRows: number;
  newCount: number;
  existsCount: number;
  conflictCount: number;
  invalidCount: number;
  seatChangedCount: number;
  rows: SgsParsedRow[];
  hasBlockingErrors: boolean;
  detectedGrade?: string;
  detectedRooms: string[];
  roomStudentCounts: Record<string, number>;
  isMultiRoomFile: boolean;
  targetClassroomMismatch: boolean;
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

  const canonicalDefaultClassroom = normalizeClassroomName(defaultClassroom);

  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const parsedRows: SgsParsedRow[] = [];
  let physicalRowCounter = 1;
  let currentRoom = canonicalDefaultClassroom;

  for (const line of lines) {
    // 1. Detect Room Section Headers in SGS files (e.g. ชั้น ม.1  ห้องที่ 1, ชั้นมัธยมศึกษาปีที่ 4 ห้องที่ 4, ชั้น ม.4/4, ม.4 ห้อง 4)
    const fullRoomMatch =
      line.match(/(?:ชั้น\s*(?:มัธยมศึกษาปีที่|ม\.?)\s*(\d+)\s*(?:ห้องที่|ห้อง|\/)\s*(\d+))|(?:ห้อง\s*(?:ม\.?)?\s*(\d+)\s*\/\s*(\d+))/i) ||
      line.match(/ม\.?\s*(\d+)\s*(?:ห้องที่|ห้อง|\/)\s*(\d+)/i);
    if (fullRoomMatch) {
      const g = fullRoomMatch[1] || fullRoomMatch[3];
      const r = fullRoomMatch[2] || fullRoomMatch[4];
      if (g && r) {
        currentRoom = `ม.${g}/${r}`;
        continue;
      }
    }

    // 2. Detect Room Summary Footer (e.g. ห้องที่  1  รวม  35  คน -> Next room is ม.1/2)
    const summaryRoomMatch = line.match(/ห้องที่\s*(\d+)\s*รวม\s*\d+\s*คน/i);
    if (summaryRoomMatch) {
      const finishedRoomNum = parseInt(summaryRoomMatch[1], 10);
      const gradeLevel = (currentRoom || canonicalDefaultClassroom || 'ม.1').split('/')[0] || 'ม.1';
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

    // Strip CSV quotes helper: '"16001"' -> '16001', "'นายสมชาย'" -> "นายสมชาย"
    const cleanToken = (t: string) => t.trim().replace(/^["']+|["']+$/g, '').trim();

    // Delimiter detection: Tab takes precedence, then Comma, then multi-space
    let rawTokens: string[] = [];
    if (line.includes('\t')) {
      rawTokens = line.split('\t');
    } else if (line.includes(',')) {
      rawTokens = line.split(',');
    } else {
      rawTokens = line.split(/\s{2,}|\s+/);
    }
    const tokens = rawTokens.map(cleanToken).filter(Boolean);

    if (tokens.length === 0) continue;

    let rawSeatNo: string | undefined;
    let parsedSeatNo: number | null = null;
    let studentCode = '';
    let rawNameTokens: string[] = [];
    let detectedClassroom = currentRoom || canonicalDefaultClassroom;

    // Find Student Code (usually 5 digits, but can be 4-7 digits string)
    const codeIndex = tokens.findIndex((t) => /^\d{4,7}$/.test(t) && t.length >= 4);

    if (codeIndex !== -1) {
      studentCode = tokens[codeIndex];

      // Check if tokens before studentCode are seat number
      if (codeIndex > 0 && /^\d{1,3}$/.test(tokens[0])) {
        rawSeatNo = tokens[0];
        parsedSeatNo = parseInt(tokens[0], 10);
      }

      // Remaining tokens after codeIndex are likely Name and possibly Classroom
      const remainingTokens = tokens.filter((_, idx) => idx !== codeIndex && idx !== 0);

      // Check last tokens for classroom: Support two-token (e.g. "ม.4" "4") and single-token ("4/4", "ม.4/4")
      if (remainingTokens.length >= 2) {
        const last1 = remainingTokens[remainingTokens.length - 1];
        const last2 = remainingTokens[remainingTokens.length - 2];
        const twoTokenTest = `${last2} ${last1}`;
        const twoTokenNorm = normalizeClassroomName(twoTokenTest, '');
        if (twoTokenNorm && /ม\.\d+\/\d+/.test(twoTokenNorm)) {
          detectedClassroom = twoTokenNorm;
          rawNameTokens = remainingTokens.slice(0, remainingTokens.length - 2);
        } else {
          const oneTokenNorm = normalizeClassroomName(last1, '');
          if (oneTokenNorm && /ม\.\d+\/\d+/.test(oneTokenNorm)) {
            detectedClassroom = oneTokenNorm;
            rawNameTokens = remainingTokens.slice(0, remainingTokens.length - 1);
          } else {
            rawNameTokens = remainingTokens;
          }
        }
      } else if (remainingTokens.length === 1) {
        const oneTokenNorm = normalizeClassroomName(remainingTokens[0], '');
        if (oneTokenNorm && /ม\.\d+\/\d+/.test(oneTokenNorm)) {
          detectedClassroom = oneTokenNorm;
          rawNameTokens = [];
        } else {
          rawNameTokens = remainingTokens;
        }
      } else {
        rawNameTokens = remainingTokens;
      }
    } else {
      if (/^\d{1,3}$/.test(tokens[0]) && tokens.length >= 2) {
        rawSeatNo = tokens[0];
        parsedSeatNo = parseInt(tokens[0], 10);
        rawNameTokens = tokens.slice(1);
      } else {
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
      classroom: normalizeClassroomName(detectedClassroom, canonicalDefaultClassroom),
      status: isInvalid ? 'INVALID' : 'NEW',
      conflictReason: isInvalid ? 'ไม่พบรหัสนักเรียนหรือชื่อไม่สมบูรณ์' : undefined,
      selectedAction: isInvalid ? 'SKIP' : 'IMPORT',
    });
  }

  // Within-Batch Roll Number Auto-Sequencing per Room
  const rowsByRoom = new Map<string, SgsParsedRow[]>();
  for (const row of parsedRows) {
    const roomKey = normalizeClassroomName(row.classroom || canonicalDefaultClassroom);
    row.classroom = roomKey;
    if (!rowsByRoom.has(roomKey)) {
      rowsByRoom.set(roomKey, []);
    }
    rowsByRoom.get(roomKey)!.push(row);
  }

  const resultRows: SgsParsedRow[] = [];

  for (const [, roomRows] of rowsByRoom.entries()) {
    // 1. Deduplicate rows with exact same studentCode within this batch
    const seenCodes = new Set<string>();
    const uniqueRoomRows: SgsParsedRow[] = [];
    for (const r of roomRows) {
      const codeKey = (r.studentCode || '').trim();
      if (!codeKey || r.status === 'INVALID') {
        uniqueRoomRows.push(r);
        continue;
      }
      if (!seenCodes.has(codeKey)) {
        seenCodes.add(codeKey);
        uniqueRoomRows.push(r);
      }
    }

    // 2. Check for duplicate or missing/invalid parsedSeatNo within valid rows
    const validRows = uniqueRoomRows.filter((r) => r.status !== 'INVALID');
    const seenNos = new Set<number>();
    let hasDuplicateOrInvalidSeat = false;

    for (const r of validRows) {
      const seat = r.parsedSeatNo;
      if (seat === null || seat === undefined || seat <= 0 || isNaN(seat) || seenNos.has(seat)) {
        hasDuplicateOrInvalidSeat = true;
        break;
      }
      seenNos.add(seat);
    }

    if (hasDuplicateOrInvalidSeat) {
      let seatCounter = 1;
      for (const r of uniqueRoomRows) {
        if (r.status !== 'INVALID') {
          r.parsedSeatNo = seatCounter;
          r.rawSeatNo = String(seatCounter);
          seatCounter++;
        }
      }
    }

    resultRows.push(...uniqueRoomRows);
  }

  return resultRows.map((row, index) => ({
    ...row,
    rowIndex: index + 1,
  }));
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

  const roomStudentCounts: Record<string, number> = {};
  parsedRows.forEach((r) => {
    const rm = r.classroom || targetClassroom;
    if (rm) {
      roomStudentCounts[rm] = (roomStudentCounts[rm] || 0) + 1;
    }
  });
  const detectedRooms = Object.keys(roomStudentCounts).sort();
  const isMultiRoomFile = detectedRooms.length > 1;
  const targetClassroomMismatch =
    detectedRooms.length > 0 && !detectedRooms.includes(targetClassroom);
  const detectedGrade = detectedRooms[0]?.split('/')[0] || undefined;

  const evaluatedRows: SgsParsedRow[] = parsedRows.map((row) => {
    // If already marked INVALID by parser
    if (row.status === 'INVALID') {
      return { ...row, selectedAction: 'SKIP' };
    }

    const studentRoom = row.classroom || targetClassroom;
    const existing = existingByCode.get(row.studentCode.trim());

    if (!existing) {
      // Brand new student
      return {
        ...row,
        classroom: studentRoom,
        status: 'NEW',
        selectedAction: 'IMPORT'
      };
    }

    // Student exists in DB
    const roomCandidates = resolveRoomCandidates(studentRoom);
    const isSameRoom =
      !existing.classroomId ||
      roomCandidates.includes(existing.classroomId) ||
      existing.classroomId === studentRoom ||
      existing.classroomId === `room-${studentRoom.replace('ม.', '').replace('/', '-')}`;

    if (isSameRoom) {
      // Exists in this exact room
      const existingSeatNo = existing.sgsSeatNo;
      const parsedNo = row.parsedSeatNo ?? (row.rawSeatNo ? parseInt(row.rawSeatNo, 10) : null);
      const isSeatChanged =
        existingSeatNo !== undefined &&
        parsedNo !== null &&
        !isNaN(parsedNo) &&
        existingSeatNo !== parsedNo;

      return {
        ...row,
        existingStudentId: existing.id,
        existingSeatNo,
        isSeatChanged,
        classroom: studentRoom,
        status: 'EXISTS',
        conflictReason: isSeatChanged
          ? `เลขที่เปลี่ยน: ในระบบคือเลขที่ ${existingSeatNo} แต่ในไฟล์ SGS คือเลขที่ ${parsedNo}`
          : 'มีรายชื่ออยู่ในห้องเรียนนี้แล้ว (ข้ามอัตโนมัติ เพื่อรักษาคะแนนเดิม)',
        selectedAction: 'SKIP'
      };
    }

    // Conflict: exists in a different classroom!
    return {
      ...row,
      existingStudentId: existing.id,
      classroom: studentRoom,
      status: 'CONFLICT',
      conflictReason: `รหัสนี้ลงทะเบียนอยู่ในห้อง ${existing.classroomId} แล้ว`,
      selectedAction: 'TRANSFER_ROOM' // Recommended action
    };
  });

  const newCount = evaluatedRows.filter(r => r.status === 'NEW').length;
  const existsCount = evaluatedRows.filter(r => r.status === 'EXISTS').length;
  const conflictCount = evaluatedRows.filter(r => r.status === 'CONFLICT').length;
  const invalidCount = evaluatedRows.filter(r => r.status === 'INVALID').length;
  const seatChangedCount = evaluatedRows.filter(r => r.status === 'EXISTS' && r.isSeatChanged).length;

  return {
    totalRows: evaluatedRows.length,
    newCount,
    existsCount,
    conflictCount,
    invalidCount,
    seatChangedCount,
    rows: evaluatedRows,
    hasBlockingErrors: invalidCount > 0 && evaluatedRows.every(r => r.status === 'INVALID'),
    detectedGrade,
    detectedRooms,
    roomStudentCounts,
    isMultiRoomFile,
    targetClassroomMismatch
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
