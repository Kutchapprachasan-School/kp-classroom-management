import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService, verifyScryptPassword } from '../src/services/authService';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { supabase } from '../src/lib/supabase';

// Helper to generate real better-auth format scrypt hashes for testing
async function generateTestScryptHash(plainPassword: string, customSaltHex?: string): Promise<string> {
  const salt = customSaltHex || 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const derived = await scryptAsync(plainPassword.normalize('NFKC'), salt, {
    N: 16384,
    r: 16,
    p: 1,
    dkLen: 64,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${bytesToHex(derived)}`;
}

describe('authService - Real Neon Database Password Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('verifyScryptPassword', () => {
    it('accurately verifies passwords against scrypt hashes in better-auth format', async () => {
      const hash = await generateTestScryptHash('TeacherSecret#2026');
      
      const isValid = await verifyScryptPassword(hash, 'TeacherSecret#2026');
      expect(isValid).toBe(true);

      const isInvalid = await verifyScryptPassword(hash, 'WrongPassword');
      expect(isInvalid).toBe(false);
    });

    it('strictly rejects 12345678 when user password in Neon is different', async () => {
      const hash = await generateTestScryptHash('myRealNeonPassword');

      const isMatch12345678 = await verifyScryptPassword(hash, '12345678');
      expect(isMatch12345678).toBe(false);
    });
  });

  describe('loginTeacher with Neon database integration', () => {
    it('strictly rejects login with 12345678 when teacher has changed their password in Neon', async () => {
      const realNeonHash = await generateTestScryptHash('KpsTeacher@Pass2026');

      // Mock User lookup in Neon
      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'User') {
          return {
            select: () => ({
              or: () => Promise.resolve({
                data: [
                  {
                    id: 'usr-teacher-real-001',
                    name: 'ครูสมศรี มะณีรัตน์',
                    email: 'somsri@school.ac.th',
                    username: 'T008',
                    role: 'TEACHER',
                    position: 'ครูชำนาญการพิเศษ',
                    subjectGroup: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
                  },
                ],
                error: null,
              }),
            }),
          } as any;
        }

        if (table === 'Account') {
          return {
            select: () => ({
              eq: () => Promise.resolve({
                data: [
                  {
                    providerId: 'credential',
                    password: realNeonHash,
                  },
                ],
                error: null,
              }),
            }),
          } as any;
        }

        return {} as any;
      });

      // Attempting to log in with 12345678 must throw an error!
      await expect(
        authService.loginTeacher('T008', '12345678')
      ).rejects.toThrow('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านของคุณอีกครั้ง');
    });

    it('successfully logs in when the provided password matches the real scrypt hash in Neon', async () => {
      const realNeonHash = await generateTestScryptHash('KpsTeacher@Pass2026');

      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'User') {
          return {
            select: () => ({
              or: () => Promise.resolve({
                data: [
                  {
                    id: 'usr-teacher-real-001',
                    name: 'ครูสมศรี มะณีรัตน์',
                    email: 'somsri@school.ac.th',
                    username: 'T008',
                    role: 'TEACHER',
                    position: 'ครูชำนาญการพิเศษ',
                    subjectGroup: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
                  },
                ],
                error: null,
              }),
            }),
          } as any;
        }

        if (table === 'Account') {
          return {
            select: () => ({
              eq: () => Promise.resolve({
                data: [
                  {
                    providerId: 'credential',
                    password: realNeonHash,
                  },
                ],
                error: null,
              }),
            }),
          } as any;
        }

        return {} as any;
      });

      const user = await authService.loginTeacher('T008', 'KpsTeacher@Pass2026');
      expect(user).toBeDefined();
      expect(user.id).toBe('usr-teacher-real-001');
      expect(user.username).toBe('T008');
      expect(user.name).toBe('ครูสมศรี มะณีรัตน์');
      expect(user.role).toBe('TEACHER');
    });

    it('rejects login when no credential password account is found in Neon', async () => {
      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'User') {
          return {
            select: () => ({
              or: () => Promise.resolve({
                data: [
                  {
                    id: 'usr-no-pass',
                    name: 'ครูไม่มีรหัสผ่าน',
                    email: 'nopass@school.ac.th',
                    username: 'T999',
                    role: 'TEACHER',
                  },
                ],
                error: null,
              }),
            }),
          } as any;
        }

        if (table === 'Account') {
          return {
            select: () => ({
              eq: () => Promise.resolve({
                data: [],
                error: null,
              }),
            }),
          } as any;
        }

        return {} as any;
      });

      await expect(
        authService.loginTeacher('T999', 'anypassword')
      ).rejects.toThrow('ไม่พบข้อมูลการตั้งรหัสผ่านของบัญชีนี้ในฐานข้อมูล');
    });
  });
});
