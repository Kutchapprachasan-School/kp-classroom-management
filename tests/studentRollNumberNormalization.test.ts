import { describe, it, expect } from 'vitest';
import {
  normalizeRoomRollNumbers,
  parseGradeAndRoom,
  studentService,
  type StudentRecord,
} from '../src/services/studentService';

describe('studentService - Roll Number Normalization & Prevention Guards', () => {
  it('should return empty array when input is empty', () => {
    const res = normalizeRoomRollNumbers([]);
    expect(res.students).toEqual([]);
    expect(res.hasRepaired).toBe(false);
  });

  it('should preserve valid sequential roll numbers (1..N) without repair', () => {
    const input: StudentRecord[] = [
      { id: 'stu-1', no: 1, code: '10001', name: 'นายกานต์', attendance: '100%', score: 80, status: 'NORMAL' },
      { id: 'stu-2', no: 2, code: '10002', name: 'นางสาวกานดา', attendance: '100%', score: 85, status: 'NORMAL' },
      { id: 'stu-3', no: 3, code: '10003', name: 'นายคมสันต์', attendance: '100%', score: 75, status: 'NORMAL' },
    ];
    const res = normalizeRoomRollNumbers(input);
    expect(res.hasRepaired).toBe(false);
    expect(res.students.map((s) => s.no)).toEqual([1, 2, 3]);
    expect(res.students.length).toBe(3);
  });

  it('should auto-heal duplicate roll numbers (e.g. boys 1..N and girls 1..M) into 1..Total without losing any student', () => {
    const input: StudentRecord[] = [
      { id: 'stu-1', no: 1, code: '10001', name: 'นายเอก (ชาย 1)', attendance: '100%', score: 80, status: 'NORMAL' },
      { id: 'stu-2', no: 1, code: '10002', name: 'นางสาวแก้ว (หญิง 1)', attendance: '100%', score: 85, status: 'NORMAL' },
      { id: 'stu-3', no: 2, code: '10003', name: 'นายโท (ชาย 2)', attendance: '100%', score: 75, status: 'NORMAL' },
      { id: 'stu-4', no: 2, code: '10004', name: 'นางสาวก้อย (หญิง 2)', attendance: '100%', score: 90, status: 'NORMAL' },
    ];
    const res = normalizeRoomRollNumbers(input);
    expect(res.hasRepaired).toBe(true);
    expect(res.students.length).toBe(4);
    expect(res.students.map((s) => s.no)).toEqual([1, 2, 3, 4]);
    // Verifies all students are intact by code
    const codes = res.students.map((s) => s.code);
    expect(codes).toContain('10001');
    expect(codes).toContain('10002');
    expect(codes).toContain('10003');
    expect(codes).toContain('10004');
  });

  it('should repair negative or NaN or zero roll numbers deterministically', () => {
    const input: StudentRecord[] = [
      { id: 'stu-1', no: 0, code: '10001', name: 'นายศูนย์', attendance: '100%', score: 80, status: 'NORMAL' },
      { id: 'stu-2', no: -5, code: '10002', name: 'นายติดลบ', attendance: '100%', score: 85, status: 'NORMAL' },
      { id: 'stu-3', no: NaN, code: '10003', name: 'นายไม่มีเลขที่', attendance: '100%', score: 75, status: 'NORMAL' },
    ];
    const res = normalizeRoomRollNumbers(input);
    expect(res.hasRepaired).toBe(true);
    expect(res.students.length).toBe(3);
    expect(res.students.map((s) => s.no)).toEqual([1, 2, 3]);
  });

  it('should deduplicate repeated student identities strictly by code/id (Zero Mock / No Duplicate Rows)', () => {
    const input: StudentRecord[] = [
      { id: 'stu-1', no: 1, code: '10001', name: 'นายสมชาย', attendance: '100%', score: 80, status: 'NORMAL' },
      { id: 'stu-1-dup', no: 1, code: '10001', name: 'นายสมชาย (แถวซ้ำ)', attendance: '100%', score: 80, status: 'NORMAL' },
      { id: 'stu-2', no: 2, code: '10002', name: 'นายสมศักดิ์', attendance: '100%', score: 85, status: 'NORMAL' },
    ];
    const res = normalizeRoomRollNumbers(input);
    expect(res.students.length).toBe(2);
    expect(res.students[0].code).toBe('10001');
    expect(res.students[1].code).toBe('10002');
    expect(res.students.map((s) => s.no)).toEqual([1, 2]);
  });

  it('parseGradeAndRoom accurately extracts gradeLevel and roomNumber for ม.4/4 and timestamp IDs', () => {
    expect(parseGradeAndRoom('ม.4/4')).toEqual({ gradeLevel: 4, roomNumber: 4 });
    expect(parseGradeAndRoom('room-4-4')).toEqual({ gradeLevel: 4, roomNumber: 4 });
    expect(parseGradeAndRoom('room-1791986991422')).toEqual({ gradeLevel: 4, roomNumber: 4 }); // canonical ม.4/4
    expect(parseGradeAndRoom('room-1-1')).toEqual({ gradeLevel: 1, roomNumber: 1 });
    expect(parseGradeAndRoom('room-1791986382424')).toEqual({ gradeLevel: 1, roomNumber: 3 }); // canonical ม.1/3
  });

  it('reorderStudents preserves omitted students and appends them at the end without loss', async () => {
    const roomId = 'room-test-reorder';
    const initialStudents: StudentRecord[] = [
      { id: 'stu-A', no: 1, code: 'A001', name: 'นักเรียน A', attendance: '100%', score: 80, status: 'NORMAL', classroomId: roomId },
      { id: 'stu-B', no: 2, code: 'B002', name: 'นักเรียน B', attendance: '100%', score: 85, status: 'NORMAL', classroomId: roomId },
      { id: 'stu-C', no: 3, code: 'C003', name: 'นักเรียน C', attendance: '100%', score: 90, status: 'NORMAL', classroomId: roomId },
    ];
    await studentService.batchImport(roomId, initialStudents);

    // Reorder only passes ['stu-C', 'stu-A'], omitting 'stu-B'
    const result = await studentService.reorderStudents(roomId, ['stu-C', 'stu-A']);
    expect(result.length).toBe(3);
    expect(result[0].id).toBe('stu-C');
    expect(result[0].no).toBe(1);
    expect(result[1].id).toBe('stu-A');
    expect(result[1].no).toBe(2);
    expect(result[2].id).toBe('stu-B'); // student B was NOT dropped!
    expect(result[2].no).toBe(3);
  });

  it('getLocalStudents merges across candidate IDs (e.g. room-4-4 and room-1791986991422) without dropping students', () => {
    if (typeof localStorage === 'undefined' || !localStorage.setItem) {
      const store: Record<string, string> = {};
      (globalThis as any).localStorage = {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v; },
        removeItem: (k: string) => { delete store[k]; },
        clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
      };
    }

    const listPart1: StudentRecord[] = [
      { id: 'stu-401', no: 1, code: '40001', name: 'นายสี่หนึ่ง', attendance: '100%', score: 80, status: 'NORMAL', classroomId: 'room-4-4' },
      { id: 'stu-402', no: 2, code: '40002', name: 'นายสี่สอง', attendance: '100%', score: 85, status: 'NORMAL', classroomId: 'room-4-4' },
    ];
    const listPart2: StudentRecord[] = [
      { id: 'stu-403', no: 1, code: '40003', name: 'นางสาวสี่สาม', attendance: '100%', score: 90, status: 'NORMAL', classroomId: 'room-1791986991422' },
      { id: 'stu-404', no: 2, code: '40004', name: 'นางสาวสี่สี่', attendance: '100%', score: 95, status: 'NORMAL', classroomId: 'room-1791986991422' },
    ];

    localStorage.setItem('cls_students_room-4-4', JSON.stringify(listPart1));
    localStorage.setItem('cls_students_room-1791986991422', JSON.stringify(listPart2));

    const merged = studentService.getStudents('ม.4/4');
    expect(merged.length).toBe(4);
    expect(merged.map((s) => s.no)).toEqual([1, 2, 3, 4]);
  });
});
