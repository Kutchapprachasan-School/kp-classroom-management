import { describe, it, expect, beforeEach } from 'vitest';

if (typeof (globalThis as any).localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    length: 0,
    key: () => null,
  };
}

import { studentService, type StudentRecord } from '../src/services/studentService';
import { getLocalClassrooms } from '../src/services/classroomService';
import { sgsRosterAndSubmissionService } from '../src/services/sgsRosterAndSubmissionService';

describe('Student Seat Sorting & Grade 1/1 Count Protection', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('automatically sanitizes misplaced/bloated high-school students in Grade 1 room and sorts by seat number', () => {
    const rawContaminated: any[] = [
      { id: 'stu-14462', no: 1, code: '14462', name: 'นาย กิตติกร ภวมัย', classroomId: 'room-1-1' },
      { id: 'stu-16058', no: 3, code: '16058', name: 'ด.ช. ณัฐพล เนตรสว่าง', classroomId: 'room-1-1' },
      { id: 'stu-14504', no: 1, code: '14504', name: 'นาย ธนโชติ ไชยงาม', classroomId: 'room-1-1' },
      { id: 'stu-16056', no: 1, code: '16056', name: 'ด.ช. จิรพัฒน์ ภูฆัง', classroomId: 'room-1-1' },
      { id: 'stu-16057', no: 2, code: '16057', name: 'ด.ช. ชยุติ พลทอง', classroomId: 'room-1-1' },
    ];

    localStorage.setItem('cls_students_room-1-1', JSON.stringify(rawContaminated));

    const result = studentService.getStudents('room-1-1');

    // High school students starting with 'นาย' or code 14xxx must be removed
    expect(result.some((s) => s.name.startsWith('นาย'))).toBe(false);
    expect(result.some((s) => s.code.startsWith('14'))).toBe(false);

    // Only genuine Grade 1 students remain
    expect(result.length).toBe(3);

    // Result must ALWAYS be sorted by seat number (no) ascending: 1, 2, 3
    expect(result.map((s) => s.no)).toEqual([1, 2, 3]);
    expect(result[0].code).toBe('16056');
    expect(result[1].code).toBe('16057');
    expect(result[2].code).toBe('16058');
  });

  it('protects DB student_count in classroomService from being overwritten by stale/bloated local cache', () => {
    // Classroom record from DB with 35 students
    const classrooms = [
      { id: 'room-1-1', name: 'ม.1/1', level: 'ม.1', roomNumber: 'ม.1/1', studentCount: 35 },
    ];
    localStorage.setItem('cls_classrooms_data', JSON.stringify(classrooms));

    // Even if local storage somehow had empty or different items
    const loaded = getLocalClassrooms();
    const room11 = loaded.find((c) => c.id === 'room-1-1');
    expect(room11).toBeDefined();
    expect(room11?.studentCount).toBe(35);
  });

  it('guarantees sgsRosterAndSubmissionService.getSgsRoster returns students sorted by seat number ascending', () => {
    const students: StudentRecord[] = [
      { id: 'stu-3', no: 3, code: '16058', name: 'ด.ช. ณัฐพล เนตรสว่าง', attendance: '0/0', score: 0, status: 'NORMAL', classroomId: 'room-1-1' },
      { id: 'stu-1', no: 1, code: '16056', name: 'ด.ช. จิรพัฒน์ ภูฆัง', attendance: '0/0', score: 0, status: 'NORMAL', classroomId: 'room-1-1' },
      { id: 'stu-2', no: 2, code: '16057', name: 'ด.ช. ชยุติ พลทอง', attendance: '0/0', score: 0, status: 'NORMAL', classroomId: 'room-1-1' },
    ];

    studentService.saveLocalStudents('room-1-1', students);

    const roster = sgsRosterAndSubmissionService.getSgsRoster('room-1-1');
    expect(roster.length).toBe(3);
    expect(roster.map((s) => s.sgsSeatNo)).toEqual([1, 2, 3]);
  });
});
