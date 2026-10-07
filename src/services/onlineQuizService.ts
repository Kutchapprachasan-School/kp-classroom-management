// src/services/onlineQuizService.ts
// ระบบจัดการแบบทดสอบออนไลน์และการสอบซ่อม (Online Quiz & Remedial Retake Engine)
// รองรับ:
// 1. ควิซท้ายบทเก็บคะแนน พร้อมเกณฑ์ผ่าน (Passing Score)
// 2. นักเรียนที่สอบไม่ผ่านสามารถสอบซ่อมได้เรื่อยๆ จนกว่าจะผ่าน (Remedial Retake)
// 3. ครูสามารถเปิด หรือปิดการสอบได้ตลอดเวลา (Toggle Open/Closed)
// 4. ระบบตรวจจับการออกจากหน้าจอ / สลับแท็บ (Focus Guard)
// 5. ตรวจและบันทึกคะแนนเข้าสู่ระบบคะแนน (scoreService) อัตโนมัติ

import { scoreService } from './scoreService';

export interface QuizOptionItem {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuizQuestionItem {
  id: string;
  questionNumber: number;
  questionText: string;
  options: QuizOptionItem[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  points: number;
  explanation?: string;
}

export interface StudentQuizAttemptRecord {
  id: string;
  examId: string;
  studentId?: string;
  studentCode: string;
  studentName: string;
  attemptNo: number;
  score: number;
  maxScore: number;
  passingScore: number;
  isPassed: boolean;
  violationCount: number;
  isAutoSubmitted: boolean;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  submittedAt: string;
}

export interface OnlineQuizConfig {
  id: string;
  examId: string;
  title: string;
  subjectCode: string;
  roomName: string;
  passingScore: number;
  maxScore: number;
  allowRetake: boolean;
  maxRetakeAttempts: number; // 0 = unlimited
  maxBlurWarnings: number; // ค่าเริ่มต้น 3 ครั้ง
  isOpen: boolean;
  questions: QuizQuestionItem[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY_QUIZZES = 'kp_online_quizzes_config_v1';
const STORAGE_KEY_ATTEMPTS = 'kp_student_quiz_attempts_v1';

// ชุดคำถามเริ่มต้นสำหรับแบบทดสอบย่อย (Default Initial Quiz Questions)
export const DEFAULT_SAMPLE_QUESTIONS: QuizQuestionItem[] = [
  {
    id: 'q-1',
    questionNumber: 1,
    questionText: 'คำทักทาย "おはようございます" (Ohayou Gozaimasu) ในภาษาญี่ปุ่นมีความหมายตรงกับข้อใด?',
    options: [
      { key: 'A', text: 'สวัสดีตอนเช้า' },
      { key: 'B', text: 'สวัสดีตอนบ่าย' },
      { key: 'C', text: 'ราตรีสวัสดิ์' },
      { key: 'D', text: 'ขอบคุณมาก' },
    ],
    correctAnswer: 'A',
    points: 2.5,
    explanation: 'おはようございます แปลว่า สวัสดีตอนเช้า ใช้กล่าวทักทายตั้งแต่เช้าจนถึงก่อนเที่ยง',
  },
  {
    id: 'q-2',
    questionNumber: 2,
    questionText: 'ตัวอักษรฮิรางานะ "あ" อ่านออกเสียงว่าอย่างไร?',
    options: [
      { key: 'A', text: 'อิ (I)' },
      { key: 'B', text: 'อะ (A)' },
      { key: 'C', text: 'อุ (U)' },
      { key: 'D', text: 'เอะ (E)' },
    ],
    correctAnswer: 'B',
    points: 2.5,
    explanation: '"あ" คือสระเสียง อะ (A) ตัวแรกในตารางฮิรางานะ 50 เสียง',
  },
  {
    id: 'q-3',
    questionNumber: 3,
    questionText: 'คำศัพท์ "せんせい" (Sensei) มีความหมายว่าอย่างไร?',
    options: [
      { key: 'A', text: 'นักเรียน' },
      { key: 'B', text: 'คุณครู / อาจารย์' },
      { key: 'C', text: 'หมอ' },
      { key: 'D', text: 'เพื่อน' },
    ],
    correctAnswer: 'B',
    points: 2.5,
    explanation: 'せんせい (Sensei) หมายถึง คุณครู หรือ อาจารย์',
  },
  {
    id: 'q-4',
    questionNumber: 4,
    questionText: 'คำกล่าวขอบคุณ "ありがとう" (Arigatou) ควรตอบรับด้วยข้อใดอย่างสุภาพ?',
    options: [
      { key: 'A', text: 'さようなら (Sayounara)' },
      { key: 'B', text: 'どういたしまして (Douitashimashite)' },
      { key: 'C', text: 'すみません (Sumimasen)' },
      { key: 'D', text: 'はい (Hai)' },
    ],
    correctAnswer: 'B',
    points: 2.5,
    explanation: 'どういたしまして แปลว่า ไม่เป็นไร หรือ ด้วยความยินดี',
  },
];

class OnlineQuizService {
  private getLocalQuizzes(): OnlineQuizConfig[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const raw = localStorage.getItem(STORAGE_KEY_QUIZZES);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return [];
  }

  private saveLocalQuizzes(quizzes: OnlineQuizConfig[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(quizzes));
    }
  }

  private getLocalAttempts(): StudentQuizAttemptRecord[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const raw = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // fallback
      }
    }
    return [];
  }

  private saveLocalAttempts(attempts: StudentQuizAttemptRecord[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(attempts));
    }
  }

  /**
   * ดึงแบบทดสอบทั้งหมด
   */
  getAllQuizzes(): OnlineQuizConfig[] {
    return this.getLocalQuizzes();
  }

  /**
   * ค้นหาแบบทดสอบตาม examId (หรือสร้าง initial config หากยังไม่มี)
   */
  getQuizByExamId(examId: string, fallbackMeta?: { title: string; subjectCode: string; roomName: string; maxScore?: number }): OnlineQuizConfig {
    const list = this.getLocalQuizzes();
    const existing = list.find((q) => q.examId === examId);
    if (existing) {
      return existing;
    }

    // สร้าง default config สำหรับ exam นี้
    const newQuiz: OnlineQuizConfig = {
      id: `quiz-${examId}`,
      examId,
      title: fallbackMeta?.title || 'แบบทดสอบออนไลน์ท้ายบท',
      subjectCode: fallbackMeta?.subjectCode || 'ญ31201',
      roomName: fallbackMeta?.roomName || 'ม.3/1',
      passingScore: 5.0,
      maxScore: fallbackMeta?.maxScore || 10.0,
      allowRetake: true,
      maxRetakeAttempts: 0, // 0 = unlimited
      maxBlurWarnings: 3,
      isOpen: true,
      questions: DEFAULT_SAMPLE_QUESTIONS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...list, newQuiz];
    this.saveLocalQuizzes(updated);
    return newQuiz;
  }

  /**
   * บันทึกหรืออัปเดตแบบทดสอบออนไลน์
   */
  saveQuiz(quiz: OnlineQuizConfig): OnlineQuizConfig {
    const list = this.getLocalQuizzes();
    const idx = list.findIndex((q) => q.examId === quiz.examId || q.id === quiz.id);
    const updatedQuiz = {
      ...quiz,
      updatedAt: new Date().toISOString(),
    };

    let nextList: OnlineQuizConfig[];
    if (idx >= 0) {
      nextList = [...list];
      nextList[idx] = updatedQuiz;
    } else {
      nextList = [...list, updatedQuiz];
    }

    this.saveLocalQuizzes(nextList);

    try {
      window.dispatchEvent(
        new CustomEvent('kps-data-sync-event', {
          detail: { type: 'ONLINE_QUIZ_SAVED', examId: quiz.examId },
        })
      );
    } catch {
      // SSR safe fallback
    }

    return updatedQuiz;
  }

  /**
   * ครูเปิด หรือปิดการสอบ (Toggle Open/Closed)
   */
  toggleQuizStatus(examId: string, isOpen: boolean): boolean {
    const quiz = this.getQuizByExamId(examId);
    quiz.isOpen = isOpen;
    this.saveQuiz(quiz);
    return quiz.isOpen;
  }

  /**
   * ดึงประวัติการทำข้อสอบ (Attempts)
   */
  getAttempts(examId: string, studentCode?: string): StudentQuizAttemptRecord[] {
    const list = this.getLocalAttempts();
    return list.filter((a) => {
      if (a.examId !== examId) return false;
      if (studentCode && a.studentCode !== studentCode) return false;
      return true;
    });
  }

  /**
   * ดึงประวัติการสอบครั้งที่ดีที่สุด (Best Attempt) ของนักเรียน
   */
  getBestAttempt(examId: string, studentCode: string): StudentQuizAttemptRecord | undefined {
    const studentAttempts = this.getAttempts(examId, studentCode);
    if (studentAttempts.length === 0) return undefined;
    return studentAttempts.reduce((best, curr) => (curr.score > best.score ? curr : best), studentAttempts[0]);
  }

  /**
   * นักเรียนส่งข้อสอบ พร้อมตรวจอัตโนมัติ (Auto-Grading) และบันทึกลงระบบคะแนน
   */
  async submitQuizAttempt(params: {
    examId: string;
    studentCode: string;
    studentName: string;
    classroomId?: string;
    answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
    violationCount?: number;
    isAutoSubmitted?: boolean;
  }): Promise<{
    attempt: StudentQuizAttemptRecord;
    score: number;
    isPassed: boolean;
    canRetake: boolean;
    remainingRetakes: number;
  }> {
    const quiz = this.getQuizByExamId(params.examId);
    const existingAttempts = this.getAttempts(params.examId, params.studentCode);
    const attemptNo = existingAttempts.length + 1;

    // 1. ตรวจข้อสอบอัตโนมัติ (Auto-grading)
    let calculatedScore = 0;
    quiz.questions.forEach((q) => {
      const studentAns = params.answers[q.id];
      if (studentAns && studentAns === q.correctAnswer) {
        calculatedScore += q.points;
      }
    });

    // ปัดเศษตามเกณฑ์ 0.5 หรือคงทศนิยม 1 ตำแหน่ง
    calculatedScore = Math.min(quiz.maxScore, Math.max(0, Math.round(calculatedScore * 10) / 10));

    // 2. ตรวจเกณฑ์ผ่าน
    const isPassed = calculatedScore >= quiz.passingScore;

    // 3. ตรวจสอบสิทธิ์สอบซ่อม (Remedial Retake Policy)
    let canRetake = false;
    let remainingRetakes = 0;

    if (!isPassed && quiz.allowRetake && quiz.isOpen) {
      if (quiz.maxRetakeAttempts === 0) {
        // สอบซ่อมได้เรื่อยๆ ไม่จำกัดจำนวนครั้ง
        canRetake = true;
        remainingRetakes = 999;
      } else if (attemptNo < quiz.maxRetakeAttempts) {
        canRetake = true;
        remainingRetakes = quiz.maxRetakeAttempts - attemptNo;
      }
    }

    const attempt: StudentQuizAttemptRecord = {
      id: `att-${Date.now()}-${params.studentCode}`,
      examId: params.examId,
      studentCode: params.studentCode,
      studentName: params.studentName,
      attemptNo,
      score: calculatedScore,
      maxScore: quiz.maxScore,
      passingScore: quiz.passingScore,
      isPassed,
      violationCount: params.violationCount || 0,
      isAutoSubmitted: params.isAutoSubmitted || false,
      answers: params.answers,
      submittedAt: new Date().toISOString(),
    };

    // บันทึก attempt
    const allAttempts = this.getLocalAttempts();
    this.saveLocalAttempts([...allAttempts, attempt]);

    // 4. ซิงค์คะแนนตรงเข้า scoreService (Grade Ledger)
    try {
      const classroomId = params.classroomId || quiz.roomName || 'room-3-1';
      await scoreService.upsertScore({
        scoreId: `score-exam-${params.examId}-${params.studentCode}`,
        assignmentId: params.examId,
        enrollmentId: `stu-${params.studentCode}`,
        classroomId,
        score: calculatedScore,
        maxScore: quiz.maxScore,
        changedBy: 'ระบบสอบออนไลน์ (Auto-Grading)',
        reason: `ทำแบบทดสอบครั้งที่ ${attemptNo} ${isPassed ? 'ผ่านเกณฑ์' : 'สอบซ่อม'}`,
      });
    } catch {
      // Safe fallback if scoreService errors
    }

    try {
      window.dispatchEvent(
        new CustomEvent('kps-data-sync-event', {
          detail: {
            type: 'QUIZ_ATTEMPT_SUBMITTED',
            examId: params.examId,
            studentCode: params.studentCode,
            score: calculatedScore,
            isPassed,
          },
        })
      );
    } catch {
      // SSR safe fallback
    }

    return {
      attempt,
      score: calculatedScore,
      isPassed,
      canRetake,
      remainingRetakes,
    };
  }
}

export const onlineQuizService = new OnlineQuizService();
