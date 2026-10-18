import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  gradeService,
  localGradeDb,
  type AssessmentColumn,
  type StudentScore,
} from '../src/services/gradeService.ts';
import { supabase } from '../src/lib/supabase.ts';

describe('gradeService - Local-First + Dirty-Cell Outbox + Zero-Egress Upsert', () => {
  beforeEach(() => {
    vi.useRealTimers();
    gradeService._resetMemoryStoreForTesting();
  });

  afterEach(() => {
    gradeService._resetMemoryStoreForTesting();
    vi.restoreAllMocks();
  });

  describe('1. Cell-Level Staging & Local Immediate Feedback', () => {
    it('stages score updates into local database and outbox immediately', async () => {
      const updated = await gradeService.updateStudentScore('stu-001', 'col-hw-1', 18);

      expect(updated.id).toBe('stu-001_col-hw-1');
      expect(updated.score).toBe(18);

      // Verify staged in scores store
      const scores = await localGradeDb.getScoresByCourse(['col-hw-1']);
      expect(scores.length).toBe(1);
      expect(scores[0].score).toBe(18);

      // Verify staged in outbox
      const outbox = await localGradeDb.getAllOutbox();
      expect(outbox.length).toBe(1);
      expect(outbox[0].id).toBe('stu-001_col-hw-1');
      expect(outbox[0].score).toBe(18);
    });

    it('overwrites previous score and outbox entry on rapid edits', async () => {
      await gradeService.updateStudentScore('stu-001', 'col-hw-1', 15);
      await gradeService.updateStudentScore('stu-001', 'col-hw-1', 20);

      const outbox = await localGradeDb.getAllOutbox();
      expect(outbox.length).toBe(1);
      expect(outbox[0].score).toBe(20);
    });
  });

  describe('2. Concurrency Shield & Optimistic Concurrency Protection', () => {
    it('does NOT delete item from outbox if updatedAt was updated during in-flight flush', async () => {
      // Simulate Item 1 at T1
      const itemT1: StudentScore = {
        id: 'stu-001_col-1',
        studentId: 'stu-001',
        assignmentId: 'col-1',
        score: 5,
        updatedAt: '2026-10-18T10:00:00.000Z',
      };
      await localGradeDb.stageDirtyScore(itemT1);

      // Teacher edits while request is in-flight: new record with T2
      const itemT2: StudentScore = {
        id: 'stu-001_col-1',
        studentId: 'stu-001',
        assignmentId: 'col-1',
        score: 8,
        updatedAt: '2026-10-18T10:00:00.500Z',
      };
      await localGradeDb.stageDirtyScore(itemT2);

      // Flushed batch only completed itemT1
      await localGradeDb.removeSyncedOutbox([itemT1]);

      // Outbox should STILL contain itemT2 because updatedAt did not match itemT1
      const outboxAfter = await localGradeDb.getAllOutbox();
      expect(outboxAfter.length).toBe(1);
      expect(outboxAfter[0].score).toBe(8);
      expect(outboxAfter[0].updatedAt).toBe('2026-10-18T10:00:00.500Z');
    });

    it('removes item from outbox when updatedAt matches synced record', async () => {
      const item: StudentScore = {
        id: 'stu-001_col-1',
        studentId: 'stu-001',
        assignmentId: 'col-1',
        score: 10,
        updatedAt: '2026-10-18T10:00:00.000Z',
      };
      await localGradeDb.stageDirtyScore(item);

      await localGradeDb.removeSyncedOutbox([item]);

      const outboxAfter = await localGradeDb.getAllOutbox();
      expect(outboxAfter.length).toBe(0);
    });
  });

  describe('3. Flush Outbox with Zero-Egress Upsert', () => {
    it('flushes outbox and drains the queue via onConflict upsert', async () => {
      await gradeService.updateStudentScore('stu-001', 'col-hw-1', 9);
      await gradeService.updateStudentScore('stu-002', 'col-hw-1', 10);

      const fromSpy = vi.spyOn(supabase, 'from');

      await gradeService.flushOutbox();

      expect(fromSpy).toHaveBeenCalledWith('StudentScore');
      const outbox = await localGradeDb.getAllOutbox();
      expect(outbox.length).toBe(0);
    });
  });

  describe('4. OBEC / สพฐ. Grade Calculation Engine', () => {
    const baseColumns: AssessmentColumn[] = [
      {
        id: 'col-hw-1',
        courseId: 'math101',
        title: 'แบบฝึกหัดที่ 1',
        maxScore: 20,
        weight: 10,
        category: 'HW',
        updatedAt: '2026-10-18T00:00:00.000Z',
      },
      {
        id: 'col-hw-2',
        courseId: 'math101',
        title: 'แบบฝึกหัดที่ 2',
        maxScore: 20,
        weight: 10,
        category: 'HW',
        updatedAt: '2026-10-18T00:00:00.000Z',
      },
      {
        id: 'col-midterm',
        courseId: 'math101',
        title: 'สอบกลางภาค',
        maxScore: 40,
        weight: 30,
        category: 'MIDTERM',
        updatedAt: '2026-10-18T00:00:00.000Z',
      },
      {
        id: 'col-final',
        courseId: 'math101',
        title: 'สอบปลายภาค',
        maxScore: 50,
        weight: 50,
        category: 'FINAL',
        updatedAt: '2026-10-18T00:00:00.000Z',
      },
    ];

    it('accumulates raw weights rather than dividing by partial weight early in term', () => {
      // Early term: only HW1 and HW2 have columns
      const earlyColumns = baseColumns.slice(0, 2); // 10 + 10 = 20 total weight
      const scoresMap = new Map<string, StudentScore>([
        [
          'stu-001_col-hw-1',
          { id: 'stu-001_col-hw-1', studentId: 'stu-001', assignmentId: 'col-hw-1', score: 20, updatedAt: '' },
        ],
        [
          'stu-001_col-hw-2',
          { id: 'stu-001_col-hw-2', studentId: 'stu-001', assignmentId: 'col-hw-2', score: 20, updatedAt: '' },
        ],
      ]);

      const result = gradeService.calculateFinalGrade('stu-001', earlyColumns, scoresMap);

      // Score = (20/20)*10 + (20/20)*10 = 20 raw weighted points
      // In early term, total points = 20, not normalized to 100% (which would falsely give grade 4)
      expect(result.totalScore).toBe(20);
      expect(result.grade).toBe('0');
      expect(result.isIncomplete).toBe(false);
    });

    it('flags status ร when MIDTERM or FINAL score is missing (null/undefined)', () => {
      const scoresMap = new Map<string, StudentScore>([
        [
          'stu-001_col-hw-1',
          { id: 'stu-001_col-hw-1', studentId: 'stu-001', assignmentId: 'col-hw-1', score: 20, updatedAt: '' },
        ],
        [
          'stu-001_col-hw-2',
          { id: 'stu-001_col-hw-2', studentId: 'stu-001', assignmentId: 'col-hw-2', score: 20, updatedAt: '' },
        ],
        [
          'stu-001_col-midterm',
          { id: 'stu-001_col-midterm', studentId: 'stu-001', assignmentId: 'col-midterm', score: 35, updatedAt: '' },
        ],
        // col-final is missing or null
      ]);

      const result = gradeService.calculateFinalGrade('stu-001', baseColumns, scoresMap);

      expect(result.isIncomplete).toBe(true);
      expect(result.grade).toBe('ร');
    });

    it('computes correct 8-tier OBEC grade when all exams are completed', () => {
      // Test 83% -> grade 4
      const makeScores = (scorePct: number) => {
        return new Map<string, StudentScore>([
          ['stu-1_col-hw-1', { id: 'stu-1_col-hw-1', studentId: 'stu-1', assignmentId: 'col-hw-1', score: 20 * scorePct, updatedAt: '' }],
          ['stu-1_col-hw-2', { id: 'stu-1_col-hw-2', studentId: 'stu-1', assignmentId: 'col-hw-2', score: 20 * scorePct, updatedAt: '' }],
          ['stu-1_col-midterm', { id: 'stu-1_col-midterm', studentId: 'stu-1', assignmentId: 'col-midterm', score: 40 * scorePct, updatedAt: '' }],
          ['stu-1_col-final', { id: 'stu-1_col-final', studentId: 'stu-1', assignmentId: 'col-final', score: 50 * scorePct, updatedAt: '' }],
        ]);
      };

      expect(gradeService.calculateFinalGrade('stu-1', baseColumns, makeScores(0.85)).grade).toBe('4');
      expect(gradeService.calculateFinalGrade('stu-1', baseColumns, makeScores(0.77)).grade).toBe('3.5');
      expect(gradeService.calculateFinalGrade('stu-1', baseColumns, makeScores(0.72)).grade).toBe('3');
      expect(gradeService.calculateFinalGrade('stu-1', baseColumns, makeScores(0.67)).grade).toBe('2.5');
      expect(gradeService.calculateFinalGrade('stu-1', baseColumns, makeScores(0.62)).grade).toBe('2');
      expect(gradeService.calculateFinalGrade('stu-1', baseColumns, makeScores(0.57)).grade).toBe('1.5');
      expect(gradeService.calculateFinalGrade('stu-1', baseColumns, makeScores(0.52)).grade).toBe('1');
      expect(gradeService.calculateFinalGrade('stu-1', baseColumns, makeScores(0.40)).grade).toBe('0');
    });

    it('treats 0 score on exam as valid score (not incomplete / ร)', () => {
      // Student took final exam and scored 0
      const scoresMap = new Map<string, StudentScore>([
        ['stu-1_col-hw-1', { id: 'stu-1_col-hw-1', studentId: 'stu-1', assignmentId: 'col-hw-1', score: 20, updatedAt: '' }],
        ['stu-1_col-hw-2', { id: 'stu-1_col-hw-2', studentId: 'stu-1', assignmentId: 'col-hw-2', score: 20, updatedAt: '' }],
        ['stu-1_col-midterm', { id: 'stu-1_col-midterm', studentId: 'stu-1', assignmentId: 'col-midterm', score: 30, updatedAt: '' }],
        ['stu-1_col-final', { id: 'stu-1_col-final', studentId: 'stu-1', assignmentId: 'col-final', score: 0, updatedAt: '' }],
      ]);

      const result = gradeService.calculateFinalGrade('stu-1', baseColumns, scoresMap);

      expect(result.isIncomplete).toBe(false);
      expect(result.grade).not.toBe('ร');
      // 10 + 10 + (30/40)*30 + 0 = 42.5 -> grade 0
      expect(result.totalScore).toBe(42.5);
      expect(result.grade).toBe('0');
    });

    it('normalizes total score when totalDefinedWeight > 100', () => {
      const extraColumns: AssessmentColumn[] = [
        ...baseColumns,
        {
          id: 'col-extra',
          courseId: 'math101',
          title: 'กิจกรรมเสริม',
          maxScore: 10,
          weight: 20, // Total weight becomes 10 + 10 + 30 + 50 + 20 = 120
          category: 'OTHER',
          updatedAt: '2026-10-18T00:00:00.000Z',
        },
      ];

      const scoresMap = new Map<string, StudentScore>([
        ['stu-1_col-hw-1', { id: 'stu-1_col-hw-1', studentId: 'stu-1', assignmentId: 'col-hw-1', score: 20, updatedAt: '' }], // 10
        ['stu-1_col-hw-2', { id: 'stu-1_col-hw-2', studentId: 'stu-1', assignmentId: 'col-hw-2', score: 20, updatedAt: '' }], // 10
        ['stu-1_col-midterm', { id: 'stu-1_col-midterm', studentId: 'stu-1', assignmentId: 'col-midterm', score: 40, updatedAt: '' }], // 30
        ['stu-1_col-final', { id: 'stu-1_col-final', studentId: 'stu-1', assignmentId: 'col-final', score: 50, updatedAt: '' }], // 50
        ['stu-1_col-extra', { id: 'stu-1_col-extra', studentId: 'stu-1', assignmentId: 'col-extra', score: 10, updatedAt: '' }], // 20
      ]); // Total weighted = 120 / 120 * 100 = 100

      const result = gradeService.calculateFinalGrade('stu-1', extraColumns, scoresMap);
      expect(result.totalScore).toBe(100);
      expect(result.grade).toBe('4');
    });
  });

  describe('5. Delta Sync & Outbox Shield in getCourseGradingData', () => {
    it('shields pending local edits from being overwritten by stale incoming server scores', async () => {
      // Setup columns in local cache
      const cols: AssessmentColumn[] = [
        {
          id: 'col-quiz-1',
          courseId: 'sci101',
          title: 'Quiz 1',
          maxScore: 10,
          weight: 10,
          category: 'HW',
          updatedAt: '2026-10-18T00:00:00.000Z',
        },
      ];
      await localGradeDb.putColumns(cols);

      // Teacher locally edited stu-01 to score 9 (pending in outbox)
      await gradeService.updateStudentScore('stu-01', 'col-quiz-1', 9);

      // Verify that local outbox has this score
      const outbox = await localGradeDb.getAllOutbox();
      expect(outbox.length).toBe(1);
      expect(outbox[0].score).toBe(9);

      // getCourseGradingData should return teacher's edited score (9) and not overwrite it
      const data = await gradeService.getCourseGradingData('sci101');
      expect(data.columns.length).toBe(1);
      expect(data.scores.get('stu-01_col-quiz-1')?.score).toBe(9);
    });
  });
});

