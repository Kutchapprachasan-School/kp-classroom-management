// tests/studentAuthAndProfile.test.ts
// ชุดทดสอบการเปลี่ยนภาพโปรไฟล์นักเรียน, การเปลี่ยนรหัสผ่านด้วยตนเอง,
// และการรีเซ็ตรหัสผ่านโดยครูที่ปรึกษา / แอดมิน

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
import { authService } from '../src/services/authService';

describe('Student Profile, Password Change & Reset Engine', () => {
  const testRoomId = 'room-test-4-4';
  const sampleStudent: StudentRecord = {
    id: 'stu-15171',
    no: 1,
    code: '15171',
    name: 'น.ส. ณัฐรยาน์ มะลิวงค์',
    attendance: '8/8',
    score: 95,
    status: 'NORMAL',
    gender: 'FEMALE',
    avatarUrl: '/images/banners/student-avatar-girl.png',
    classroomId: testRoomId,
    isPasswordChanged: false,
    passwordHash: null,
  };

  beforeEach(() => {
    localStorage.clear();
    studentService.saveLocalStudents(testRoomId, [sampleStudent]);
  });

  it('updates student avatar and dispatches sync event', () => {
    const newAvatar = '/images/buddies/buddy-c2.png';
    const updated = studentService.updateStudentAvatar('15171', newAvatar);
    expect(updated).toBe(true);

    const found = studentService.findStudentByCode('15171');
    expect(found?.student.avatarUrl).toBe(newAvatar);
  });

  it('allows student to log in with initial 5-digit student code as password', async () => {
    const user = await authService.loginStudent('15171', '15171');
    expect(user.studentCode).toBe('15171');
    expect(user.role).toBe('STUDENT');
  });

  it('allows student to change password, and denies login with old password', async () => {
    // 1. เปลี่ยนรหัสผ่านจาก 15171 เป็น SecretPass123
    const changeSuccess = await authService.studentChangePassword('15171', '15171', 'SecretPass123');
    expect(changeSuccess).toBe(true);

    // 2. ข้อมูลนักเรียนต้องมี isPasswordChanged = true และมี hash
    const found = studentService.findStudentByCode('15171');
    expect(found?.student.isPasswordChanged).toBe(true);
    expect(found?.student.passwordHash).toBeTruthy();

    // 3. ล็อกอินด้วยรหัสผ่านใหม่สำเร็จ
    const userNew = await authService.loginStudent('15171', 'SecretPass123');
    expect(userNew.studentCode).toBe('15171');

    // 4. ล็อกอินด้วยรหัสเก่าต้องถูกปฏิเสธ
    await expect(authService.loginStudent('15171', '15171')).rejects.toThrow(
      'รหัสผ่านไม่ถูกต้อง'
    );
  });

  it('allows advisor / admin to reset password back to initial 5-digit code', async () => {
    // 1. นักเรียนเปลี่ยนรหัสผ่านก่อน
    await authService.studentChangePassword('15171', '15171', 'MyCustomPassword');

    // 2. ครูที่ปรึกษารีเซ็ตรหัสผ่าน
    const resetSuccess = await authService.resetStudentPasswordByAdvisor('15171', 'ครูที่ปรึกษา ม.4/4');
    expect(resetSuccess).toBe(true);

    // 3. ตรวจสอบสถานะว่าถูกรีเซ็ต
    const found = studentService.findStudentByCode('15171');
    expect(found?.student.isPasswordChanged).toBe(false);
    expect(found?.student.passwordHash).toBeNull();

    // 4. สามารถล็อกอินด้วยรหัส 5 หลักเดิมได้ทันที
    const user = await authService.loginStudent('15171', '15171');
    expect(user.studentCode).toBe('15171');
  });

  it('allows advisor / admin to reset entire classroom passwords at once', async () => {
    const student2: StudentRecord = {
      id: 'stu-15172',
      no: 2,
      code: '15172',
      name: 'นาย ภัทรพล กิ่งแก้ว',
      attendance: '8/8',
      score: 88,
      status: 'NORMAL',
      gender: 'MALE',
      classroomId: testRoomId,
      isPasswordChanged: true,
      passwordHash: 'hash-abc',
    };
    studentService.saveLocalStudents(testRoomId, [sampleStudent, student2]);

    const res = await authService.resetClassroomPasswords(testRoomId, 'แอดมิน');
    expect(res.count).toBe(2);
    expect(res.studentCodes).toEqual(['15171', '15172']);

    const students = studentService.getLocalStudents(testRoomId);
    expect(students.every((s) => s.isPasswordChanged === false && s.passwordHash === null)).toBe(true);
  });

  it('generates accurate student credential slips for distribution', () => {
    const slip = authService.generateStudentCredentialSlip([
      { no: 1, code: '15171', name: 'น.ส. ณัฐรยาน์ มะลิวงค์' },
    ]);
    expect(slip).toContain('15171');
    expect(slip).toContain('น.ส. ณัฐรยาน์ มะลิวงค์');
    expect(slip).toContain('รหัสผ่านเริ่มต้น');
  });
});
