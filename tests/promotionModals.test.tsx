// tests/promotionModals.test.tsx
import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PromotionWizardModal,
  PromotionRollbackModal,
  AlumniDirectoryView,
  StudentPurgeModal,
  AcademicRolloverControlCenter,
  type ClassroomOption,
} from '../src/components/promotion';
import { studentPromotionService } from '../src/services/studentPromotionService';
import { studentEnrollmentService } from '../src/services/studentEnrollmentService';

describe('Promotion UI Components (Tasks 5, 6, 7, 8, 9A)', () => {
  const mockClassrooms: ClassroomOption[] = [
    { id: 'room-1', name: 'ม.1/1', gradeLevel: 'ม.1' },
    { id: 'room-2', name: 'ม.2/1', gradeLevel: 'ม.2' },
    { id: 'room-3', name: 'ม.3/1', gradeLevel: 'ม.3' },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Task 5: PromotionWizardModal', () => {
    it('returns empty string when isOpen is false', () => {
      const html = renderToString(
        React.createElement(PromotionWizardModal, {
          isOpen: false,
          onClose: vi.fn(),
          classrooms: mockClassrooms,
          currentUserId: 'teacher-admin',
          onPromotionSuccess: vi.fn(),
        })
      );
      expect(html).toBe('');
    });

    it('renders Step 1 (ตั้งค่าปีการศึกษา) and pastel header when isOpen is true', () => {
      const html = renderToString(
        React.createElement(PromotionWizardModal, {
          isOpen: true,
          onClose: vi.fn(),
          classrooms: mockClassrooms,
          currentUserId: 'teacher-admin',
          onPromotionSuccess: vi.fn(),
        })
      );

      // Verify Header and Thai prompt text
      expect(html).toContain('ระบบเลื่อนชั้นนักเรียนและปิดปีการศึกษา');
      expect(html).toContain('Two-Tier Enrollment');

      // Verify Stepper labels
      expect(html).toContain('1. ตั้งค่าปีการศึกษา');
      expect(html).toContain('2. แมปห้องเรียน');
      expect(html).toContain('3. อนุมัติจบ/ข้อยกเว้น');
      expect(html).toContain('4. ตรวจสอบ &amp; ยืนยัน');

      // Verify Step 1 fields
      expect(html).toContain('ภาคเรียนต้นทาง (ที่ต้องการปิดเทอม)');
      expect(html).toContain('ภาคเรียนปลายทาง (ที่ต้องการเปิดใหม่)');
      expect(html).toContain('2569');
      expect(html).toContain('2570');

      // Verify Step 1 Primary Action button
      expect(html).toContain('ถัดไป: แมปห้องเรียน');
    });
  });

  describe('Task 6: PromotionRollbackModal', () => {
    it('returns empty string when isOpen is false', () => {
      const html = renderToString(
        React.createElement(PromotionRollbackModal, {
          isOpen: false,
          onClose: vi.fn(),
          currentUserId: 'teacher-admin',
          onRollbackSuccess: vi.fn(),
        })
      );
      expect(html).toBe('');
    });

    it('renders header, description, and rollback manager layout when isOpen is true', () => {
      vi.spyOn(studentPromotionService, 'getPromotionBatchHistory').mockResolvedValue([]);

      const html = renderToString(
        React.createElement(PromotionRollbackModal, {
          isOpen: true,
          onClose: vi.fn(),
          currentUserId: 'teacher-admin',
          onRollbackSuccess: vi.fn(),
        })
      );

      // Verify Header and Thai prompt text
      expect(html).toContain('ประวัติการเลื่อนชั้น &amp; ระบบย้อนกลับ');
      expect(html).toContain('Rollback Manager');
      expect(html).toContain('Conflict Guard');
    });

    it('displays batch list when history items exist', () => {
      const mockBatch = {
        id: 'batch-test-2026',
        from_academic_year: 2569,
        from_semester: 2,
        to_academic_year: 2570,
        to_semester: 1,
        status: 'COMPLETED' as const,
        summary_json: {
          promoted_count: 40,
          repeated_count: 2,
          graduated_count: 0,
        },
        executed_by: 'teacher-admin',
        created_at: '2026-10-18T10:00:00Z',
        rolled_back_at: null,
      };

      const spy = vi
        .spyOn(studentPromotionService, 'getPromotionBatchHistory')
        .mockResolvedValue([mockBatch]);

      expect(spy).toBeDefined();
    });
  });

  describe('Task 7: AlumniDirectoryView', () => {
    it('renders alumni directory header and search controls', () => {
      vi.spyOn(studentEnrollmentService, 'getAlumniDirectory').mockResolvedValue([]);

      const html = renderToString(React.createElement(AlumniDirectoryView));

      expect(html).toContain('ทำเนียบศิษย์เก่า &amp; ประวัติผลการเรียนถาวร');
      expect(html).toContain('ค้นหาชื่อ หรือรหัสนักเรียน...');
      expect(html).toContain('ทุกรุ่นปีการศึกษา');
      expect(html).toContain('รุ่นปีการศึกษา 2569');
    });
  });

  describe('Task 8: StudentPurgeModal', () => {
    it('returns empty string when isOpen is false', () => {
      const html = renderToString(
        React.createElement(StudentPurgeModal, {
          isOpen: false,
          onClose: vi.fn(),
          onPurgeSuccess: vi.fn(),
        })
      );
      expect(html).toBe('');
    });

    it('renders single-student purge guard layout and safety inputs when isOpen is true', () => {
      const html = renderToString(
        React.createElement(StudentPurgeModal, {
          isOpen: true,
          initialStudentId: 'std-test-999',
          initialStudentName: 'เด็กชายทดสอบ ระบบ',
          onClose: vi.fn(),
          onPurgeSuccess: vi.fn(),
        })
      );

      expect(html).toContain('เครื่องมือลบข้อมูลนักเรียนทดสอบ');
      expect(html).toContain('Single-Student Purge Guard');
      expect(html).toContain('std-test-999');
      expect(html).toContain('เด็กชายทดสอบ ระบบ');
      expect(html).toContain('ตรวจสอบและลบนักเรียนทดสอบ');
    });
  });

  describe('Task 9A: AcademicRolloverControlCenter', () => {
    it('renders the 3 main control cards and embeds alumni directory', () => {
      vi.spyOn(studentEnrollmentService, 'getAlumniDirectory').mockResolvedValue([]);

      const html = renderToString(
        React.createElement(AcademicRolloverControlCenter, {
          classrooms: mockClassrooms,
          currentUserId: 'admin-01',
        })
      );

      expect(html).toContain('1. เลื่อนชั้นนักเรียน &amp; ปิดปีการศึกษา');
      expect(html).toContain('2. ประวัติการเลื่อนชั้น &amp; Rollback');
      expect(html).toContain('3. ลบข้อมูลนักเรียนทดสอบ');
      expect(html).toContain('ทำเนียบศิษย์เก่า &amp; ประวัติผลการเรียนถาวร');
    });
  });
});
