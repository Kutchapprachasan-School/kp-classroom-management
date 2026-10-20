import { describe, it, expect } from 'vitest';
import { attendanceCorrelationService } from '../src/services/attendanceCorrelationService';

// Function matching ClassroomAttendanceView parseStudentNameParts
const parseStudentNameParts = (fullName: string): { title: string; name: string } => {
  if (!fullName) return { title: '-', name: '-' };
  const trimmed = fullName.trim();
  const match = trimmed.match(/^(นางสาว|น\.ส\.|เด็กหญิง|ด\.ญ\.|เด็กชาย|ด\.ช\.|นาย|นาง)\s*(.*)$/);
  if (match) {
    return { title: match[1], name: match[2].trim() };
  }
  return { title: '-', name: trimmed };
};

describe('Classroom Attendance - Student Title Parsing & 80% Attendance Stats', () => {
  describe('1. Student Title / Prefix Parsing', () => {
    it('correctly extracts "นางสาว" and separates the student name', () => {
      const res1 = parseStudentNameParts('นางสาวนงนภัส แสงจันทร์');
      expect(res1.title).toBe('นางสาว');
      expect(res1.name).toBe('นงนภัส แสงจันทร์');

      const res2 = parseStudentNameParts('นางสาวจารุวรรณ หงทอง');
      expect(res2.title).toBe('นางสาว');
      expect(res2.name).toBe('จารุวรรณ หงทอง');
    });

    it('correctly extracts "นาย", "เด็กชาย", "ด.ช.", "เด็กหญิง", "ด.ญ.", "น.ส."', () => {
      expect(parseStudentNameParts('นายธนภัทร คงเกิด')).toEqual({
        title: 'นาย',
        name: 'ธนภัทร คงเกิด',
      });
      expect(parseStudentNameParts('น.ส.กนกพร สุขเกษม')).toEqual({
        title: 'น.ส.',
        name: 'กนกพร สุขเกษม',
      });
      expect(parseStudentNameParts('ด.ช.สมชาย ใจดี')).toEqual({
        title: 'ด.ช.',
        name: 'สมชาย ใจดี',
      });
      expect(parseStudentNameParts('เด็กชายวิชัย เก่งกาจ')).toEqual({
        title: 'เด็กชาย',
        name: 'วิชัย เก่งกาจ',
      });
      expect(parseStudentNameParts('ด.ญ.พรพิมล มีสุข')).toEqual({
        title: 'ด.ญ.',
        name: 'พรพิมล มีสุข',
      });
      expect(parseStudentNameParts('เด็กหญิงวันทนา แจ่มใส')).toEqual({
        title: 'เด็กหญิง',
        name: 'วันทนา แจ่มใส',
      });
      expect(parseStudentNameParts('นางสมศรี ดวงดาว')).toEqual({
        title: 'นาง',
        name: 'สมศรี ดวงดาว',
      });
    });

    it('falls back cleanly for names without explicit prefix', () => {
      expect(parseStudentNameParts('สมศักดิ์ นิมิตมงคล')).toEqual({
        title: '-',
        name: 'สมศักดิ์ นิมิตมงคล',
      });
      expect(parseStudentNameParts('')).toEqual({
        title: '-',
        name: '-',
      });
    });
  });

  describe('2. 80% Rule Attendance Statistics (Zero Mock Policy)', () => {
    it('returns 0 periods recorded and 100% eligibility when no attendance has been recorded yet', () => {
      const result = attendanceCorrelationService.compute80RuleFromRecords(
        '18118',
        'ค33101',
        [] // zero records recorded yet
      );

      expect(result.totalScheduledPeriods).toBe(0);
      expect(result.earnedPeriods).toBe(0);
      expect(result.attendanceRate).toBe(100.0);
      expect(result.isEligibleForExam).toBe(true);
      expect(result.isAtRisk).toBe(false);
    });

    it('accurately calculates attendance rate when records exist', () => {
      const records = [
        { status: 'PRESENT' as const },
        { status: 'PRESENT' as const },
        { status: 'LATE' as const },
        { status: 'ABSENT' as const },
      ];

      const result = attendanceCorrelationService.compute80RuleFromRecords(
        '18118',
        'ค33101',
        records
      );

      expect(result.totalScheduledPeriods).toBe(4);
      expect(result.earnedPeriods).toBe(3); // 2 PRESENT + 1 LATE
      expect(result.attendanceRate).toBe(75.0); // 3 / 4 = 75%
      expect(result.isEligibleForExam).toBe(false);
      expect(result.isAtRisk).toBe(true);
    });
  });
});
