import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  academicCalendarService,
  calculate20WeeksEndDate,
} from '../src/services/academicCalendarService';
import { computeWeekInfo } from '../src/utils/timetableDateUtils';

describe('Timetable Week Calculation & 20-Week Auto End Date', () => {
  describe('1. calculate20WeeksEndDate (Auto 20-week end date calculation)', () => {
    it('calculates the 20th week Friday date from semester start date (19 ต.ค. 2569 -> 5 มี.ค. 2570)', () => {
      const endDateFriday = calculate20WeeksEndDate('19 ต.ค. 2569', 'FRIDAY');
      expect(endDateFriday).toBe('5 มี.ค. 2570');
    });

    it('calculates the 20th week Sunday date when mode is SUNDAY (19 ต.ค. 2569 -> 7 มี.ค. 2570)', () => {
      const endDateSunday = calculate20WeeksEndDate('19 ต.ค. 2569', 'SUNDAY');
      expect(endDateSunday).toBe('7 มี.ค. 2570');
    });

    it('calculates the 20th week Friday for term 1 (15 พ.ค. 2569 -> 25 ก.ย. 2569)', () => {
      const endDate = calculate20WeeksEndDate('15 พ.ค. 2569', 'FRIDAY');
      expect(endDate).toBe('25 ก.ย. 2569');
    });

    it('returns empty string for invalid dates', () => {
      expect(calculate20WeeksEndDate('')).toBe('');
      expect(calculate20WeeksEndDate('invalid-date')).toBe('');
    });
  });

  describe('2. computeWeekInfo (Dynamic Week Number & Dates Aligned with Active Term)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-20T10:00:00'));

      // Set active term to Term 2 (starts 19 ต.ค. 2569)
      const config = academicCalendarService.getConfig();
      const updatedTerms = config.terms.map((t) => ({
        ...t,
        isActive: t.year === 2569 && t.semesterNo === 2,
        startDate: '19 ต.ค. 2569',
        endDate: '26 มี.ค. 2570',
      }));
      academicCalendarService.saveConfig({ terms: updatedTerms });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('correctly calculates Week 1 for Term 2 starting 19 ต.ค. 2569', () => {
      const activeTerm = academicCalendarService.getActiveTerm();
      expect(activeTerm.semesterNo).toBe(2);
      expect(activeTerm.startDate).toBe('19 ต.ค. 2569');

      const weekInfo = computeWeekInfo(0, activeTerm);
      // Since current simulated time is 20 Oct 2026 (Day 2 of Term 2), weekNumber MUST be 1
      expect(weekInfo.weekNumber).toBe(1);
      expect(weekInfo.totalWeeks).toBe(20);
      expect(weekInfo.dateRangeLabel).toBe('19 ต.ค. 2569 – 25 ต.ค. 2569');
      expect(weekInfo.canPrev).toBe(false);
      expect(weekInfo.canNext).toBe(true);

      // Verify the 5 week days
      expect(weekInfo.days.length).toBe(5);
      expect(weekInfo.days[0].key).toBe('จันทร์');
      expect(weekInfo.days[0].dateLabel).toBe('19 ต.ค. 2569');
      expect(weekInfo.days[1].key).toBe('อังคาร');
      expect(weekInfo.days[1].dateLabel).toBe('20 ต.ค. 2569');
      expect(weekInfo.days[1].isToday).toBe(true);
      expect(weekInfo.days[2].key).toBe('พุธ');
      expect(weekInfo.days[2].dateLabel).toBe('21 ต.ค. 2569');
      expect(weekInfo.days[3].key).toBe('พฤหัสบดี');
      expect(weekInfo.days[3].dateLabel).toBe('22 ต.ค. 2569');
      expect(weekInfo.days[4].key).toBe('ศุกร์');
      expect(weekInfo.days[4].dateLabel).toBe('23 ต.ค. 2569');
    });

    it('navigates to Week 2 when offset is +1', () => {
      const activeTerm = academicCalendarService.getActiveTerm();
      const weekInfo = computeWeekInfo(1, activeTerm);

      expect(weekInfo.weekNumber).toBe(2);
      expect(weekInfo.dateRangeLabel).toBe('26 ต.ค. 2569 – 1 พ.ย. 2569');
      expect(weekInfo.canPrev).toBe(true);
      expect(weekInfo.canNext).toBe(true);
      expect(weekInfo.days[0].dateLabel).toBe('26 ต.ค. 2569');
      expect(weekInfo.days[4].dateLabel).toBe('30 ต.ค. 2569');
    });
  });

  describe('3. Term Break Recognition in Calendar Days', () => {
    it('correctly identifies days before Term 2 start as outside active term (term break)', () => {
      // Term 2 starts 19 Oct 2026
      expect(academicCalendarService.isDateInActiveTerm('2026-10-01')).toBe(false);
      expect(academicCalendarService.isDateInActiveTerm('2026-10-16')).toBe(false);
      expect(academicCalendarService.isDateInActiveTerm('2026-10-18')).toBe(false);

      // Term 2 instructional days
      expect(academicCalendarService.isDateInActiveTerm('2026-10-19')).toBe(true);
      expect(academicCalendarService.isDateInActiveTerm('2026-10-20')).toBe(true);
      expect(academicCalendarService.isDateInActiveTerm('2026-10-31')).toBe(true);
    });
  });
});
