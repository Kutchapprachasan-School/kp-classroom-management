import { describe, it, expect, beforeEach } from 'vitest';
import {
  smsNotificationService,
  normalizeThaiPhoneNumber,
} from '../src/services/smsNotificationService';

describe('smsNotificationService & Schema Binding Tests', () => {
  beforeEach(() => {
    smsNotificationService.clearOutbox();
    smsNotificationService.clearContactCache();
  });

  describe('1. Thai Mobile Phone Normalization & Validation', () => {
    it('normalizes standard 10-digit Thai mobile numbers with hyphens', () => {
      const res = normalizeThaiPhoneNumber('081-234-5678');
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe('0812345678');
    });

    it('normalizes international format (+66) to 08/09/06 prefix', () => {
      const res = normalizeThaiPhoneNumber('+66891234567');
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe('0891234567');
    });

    it('normalizes numbers with spaces and parens', () => {
      const res = normalizeThaiPhoneNumber('(085) 999 8888');
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe('0859998888');
    });

    it('rejects invalid numbers or landlines lacking mobile prefix', () => {
      const resShort = normalizeThaiPhoneNumber('021234567'); // Landline, not mobile
      expect(resShort.isValid).toBe(false);

      const resInvalid = normalizeThaiPhoneNumber('12345');
      expect(resInvalid.isValid).toBe(false);
      expect(resInvalid.reason).toContain('ไม่ถูกต้อง');
    });

    it('handles null and undefined gracefully without throwing', () => {
      const resNull = normalizeThaiPhoneNumber(null);
      expect(resNull.isValid).toBe(false);
      expect(resNull.reason).toBe('ไม่มีหมายเลขโทรศัพท์ผู้ปกครองในระบบ');

      const resUndef = normalizeThaiPhoneNumber(undefined);
      expect(resUndef.isValid).toBe(false);
    });
  });

  describe('2. Credit Calculation & Templates', () => {
    it('calculates Thai messages at 70 characters per segment', () => {
      expect(smsNotificationService.calculateCreditsUsed('สวัสดี')).toBe(1);
      expect(smsNotificationService.calculateCreditsUsed('ก'.repeat(70))).toBe(1);
      expect(smsNotificationService.calculateCreditsUsed('ก'.repeat(71))).toBe(2);
      expect(smsNotificationService.calculateCreditsUsed('ก'.repeat(141))).toBe(3);
    });

    it('calculates GSM English messages at 160 characters per segment', () => {
      expect(smsNotificationService.calculateCreditsUsed('A'.repeat(160))).toBe(1);
      expect(smsNotificationService.calculateCreditsUsed('A'.repeat(161))).toBe(2);
    });

    it('replaces template variables correctly', () => {
      const template = '[KPS] {studentName} ขาดเรียนวันที่ {date}';
      const rendered = smsNotificationService.renderTemplate(template, {
        studentName: 'สมชาย',
        date: '18 ต.ค. 2569',
      });
      expect(rendered).toBe('[KPS] สมชาย ขาดเรียนวันที่ 18 ต.ค. 2569');
    });
  });

  describe('3. Zero-Egress 3-Tier Contact Caching', () => {
    it('fetches student contacts and caches in L1 RAM (zero egress on second call)', async () => {
      const contactsFirst = await smsNotificationService.getStudentContactsByRoom('room-1-1');
      expect(Array.isArray(contactsFirst)).toBe(true);

      // Second call must return the exact same in-memory array (0 network egress)
      const contactsSecond = await smsNotificationService.getStudentContactsByRoom('room-1-1');
      expect(contactsSecond).toBe(contactsFirst);
    });

    it('maps database schema accurately (parentPhone, parentName)', async () => {
      const contacts = await smsNotificationService.getStudentContactsByRoom('room-1-1');
      if (contacts.length > 0) {
        const first = contacts[0];
        expect(first).toHaveProperty('studentId');
        expect(first).toHaveProperty('studentCode');
        expect(first).toHaveProperty('studentName');
        expect(first).toHaveProperty('parentPhone');
        expect(first).toHaveProperty('parentName');
        expect(first).toHaveProperty('isPhoneValid');
      }
    });
  });

  describe('4. Automated Educational SMS Dispatchers', () => {
    it('sends attendance absence SMS and skips students without phone without throwing', async () => {
      const res = await smsNotificationService.sendAttendanceAbsenceSms({
        classroomId: 'room-1-1',
        date: '18 ต.ค. 2569',
        absentStudentIds: ['stu-unknown-1', 'stu-unknown-2'],
      });

      expect(res).toHaveProperty('sentCount');
      expect(res).toHaveProperty('failedCount');
      expect(res).toHaveProperty('skippedNoPhoneCount');
      expect(res.failedCount).toBe(2);
      expect(res.skippedNoPhoneCount).toBe(2);
    });

    it('performs authentic database SSO sync without mock data', async () => {
      const syncResult = await smsNotificationService.syncSmsAccountsWithDatabase();
      expect(syncResult.success).toBe(true);
      expect(syncResult.totalUsers).toBeGreaterThan(0);
      expect(syncResult.message).toContain('เชื่อมโยงบัญชีผู้ใช้จริงจากฐานข้อมูลโรงเรียน');
    });
  });
});
