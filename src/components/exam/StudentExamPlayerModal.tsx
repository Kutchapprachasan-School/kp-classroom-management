// src/components/exam/StudentExamPlayerModal.tsx
// ระบบห้องสอบออนไลน์สำหรับนักเรียน (Student Online Exam & Remedial Player)
// - ตรวจจับการสลับหน้าจอ / ย่อแท็บ (Real-time Focus Guard)
// - ป้องกันคลิกขวา และคัดลอกข้อสอบ
// - ตรวจข้อสอบอัตโนมัติ (Auto-Grading)
// - รองรับการสอบซ่อมเรื่อยๆ จนกว่าจะผ่าน (Remedial Retakes)
// - ซิงค์คะแนนตรงเข้าตารางคะแนน (scoreService)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  X,
  Send,
  BookOpen,
} from 'lucide-react';
import {
  onlineQuizService,
  type OnlineQuizConfig,
  type QuizQuestionItem,
  type StudentQuizAttemptRecord,
} from '../../services/onlineQuizService';

interface StudentExamPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  studentCode?: string;
  studentName?: string;
  classroomId?: string;
  onGraded?: (score: number, isPassed: boolean) => void;
}

export const StudentExamPlayerModal: React.FC<StudentExamPlayerModalProps> = ({
  isOpen,
  onClose,
  examId,
  studentCode = '45101',
  studentName = 'ด.ช. กฤษณะ ศรีสมบูรณ์',
  classroomId = 'room-3-1',
  onGraded,
}) => {
  const [quiz, setQuiz] = useState<OnlineQuizConfig | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [violationCount, setViolationCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState<{
    attempt: StudentQuizAttemptRecord;
    score: number;
    isPassed: boolean;
    canRetake: boolean;
    remainingRetakes: number;
  } | null>(null);

  // Focus lock & safety ref
  const hasAutoSubmittedRef = useRef(false);
  const isFinishedRef = useRef(false);

  // โหลดข้อมูลแบบทดสอบ
  useEffect(() => {
    if (isOpen && examId) {
      const q = onlineQuizService.getQuizByExamId(examId);
      setQuiz(q);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setViolationCount(0);
      setShowWarningModal(false);
      setAttemptResult(null);
      hasAutoSubmittedRef.current = false;
      isFinishedRef.current = false;
    }
  }, [isOpen, examId]);

  // ฟังก์ชันส่งข้อสอบ
  const handleSubmit = useCallback(
    async (isAutoViolated = false) => {
      if (!quiz || isSubmitting || isFinishedRef.current) return;
      setIsSubmitting(true);
      isFinishedRef.current = true;

      try {
        const result = await onlineQuizService.submitQuizAttempt({
          examId: quiz.examId,
          studentCode,
          studentName,
          classroomId,
          answers,
          violationCount: isAutoViolated ? violationCount + 1 : violationCount,
          isAutoSubmitted: isAutoViolated,
        });

        setAttemptResult(result);
        onGraded?.(result.score, result.isPassed);
      } catch (err) {
        console.error('Error submitting quiz attempt:', err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [quiz, isSubmitting, studentCode, studentName, classroomId, answers, violationCount, onGraded]
  );

  // --------------------------------------------------------------------------
  // ANTI-CHEAT FOCUS GUARD LISTENERS
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !quiz || isFinishedRef.current || attemptResult !== null) return;

    const maxWarnings = quiz.maxBlurWarnings || 3;

    const handleFocusLoss = () => {
      if (isFinishedRef.current || hasAutoSubmittedRef.current) return;

      setViolationCount((prev) => {
        const nextCount = prev + 1;
        if (nextCount >= maxWarnings) {
          hasAutoSubmittedRef.current = true;
          setShowWarningModal(false);
          // ส่งข้อสอบอัตโนมัติทันที
          handleSubmit(true);
        } else {
          setShowWarningModal(true);
        }
        return nextCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleFocusLoss();
      }
    };

    const handleWindowBlur = () => {
      handleFocusLoss();
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // ป้องกันการคลิกขวา
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault(); // ป้องกันการคัดลอกข้อสอบ
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
    };
  }, [isOpen, quiz, attemptResult, handleSubmit]);

  // ฟังก์ชันเริ่มสอบซ่อม (Remedial Retake)
  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setViolationCount(0);
    setShowWarningModal(false);
    setAttemptResult(null);
    hasAutoSubmittedRef.current = false;
    isFinishedRef.current = false;
  };

  if (!isOpen || !quiz) return null;

  const currentQuestion: QuizQuestionItem | undefined = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs select-none">
      {/* ------------------------------------------------------------------ */}
      {/* MODAL CONTAINER */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER BAR */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">{quiz.title}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  {quiz.subjectCode} • {quiz.roomName}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                ผู้สอบ: {studentName} ({studentCode}) • เกณฑ์ผ่าน: {quiz.passingScore}/{quiz.maxScore} คะแนน
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Anti-cheat status badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                violationCount === 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>
                สลับหน้าจอ: {violationCount}/{quiz.maxBlurWarnings}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* POST-EXAM RESULT SCREEN (หน้าแสดงผลคะแนน & สอบซ่อม) */}
        {/* ------------------------------------------------------------------ */}
        {attemptResult ? (
          <div className="p-6 overflow-y-auto space-y-6 text-center my-auto">
            <div className="max-w-md mx-auto space-y-4">
              {/* Status Icon */}
              <div
                className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-lg ${
                  attemptResult.isPassed
                    ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-300'
                    : 'bg-amber-100 text-amber-600 border-2 border-amber-300'
                }`}
              >
                {attemptResult.isPassed ? (
                  <CheckCircle2 className="w-10 h-10" />
                ) : (
                  <AlertTriangle className="w-10 h-10" />
                )}
              </div>

              {/* Title & Score */}
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {attemptResult.isPassed ? '🎉 ยินดีด้วย! คุณสอบผ่านเกณฑ์' : '⚠️ ยังไม่ผ่านเกณฑ์การประเมิน'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  การสอบครั้งที่ {attemptResult.attempt.attemptNo} • บันทึกคะแนนเข้าสู่ระบบเรียบร้อยแล้ว
                </p>
              </div>

              {/* Score Display Card */}
              <div
                className={`p-5 rounded-2xl border text-center ${
                  attemptResult.isPassed
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-amber-50/60 border-amber-200'
                }`}
              >
                <span className="text-xs font-bold text-slate-500 block">คะแนนที่คุณทำได้:</span>
                <span className="text-4xl font-black text-slate-900 my-1 block">
                  {attemptResult.score}{' '}
                  <span className="text-lg font-bold text-slate-500">/ {quiz.maxScore}</span>
                </span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${
                    attemptResult.isPassed
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {attemptResult.isPassed
                    ? `✓ ผ่านเกณฑ์ (เกณฑ์ผ่าน ${quiz.passingScore} คะแนน)`
                    : `ขาดอีก ${(quiz.passingScore - attemptResult.score).toFixed(1)} คะแนนจึงจะผ่านเกณฑ์`}
                </span>
              </div>

              {/* Violation Notice if any */}
              {attemptResult.attempt.isAutoSubmitted && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 text-left">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>ระบบส่งข้อสอบอัตโนมัติเนื่องจากตรวจพบการออกจากหน้าจอเกินกำหนด</span>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {!attemptResult.isPassed && attemptResult.canRetake && (
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>สอบซ่อม (ทำใหม่อีกครั้ง)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  เสร็จสิ้น / ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------------ */
          /* QUESTION IN PROGRESS SCREEN */
          /* ------------------------------------------------------------------ */
          <>
            {/* PROGRESS BAR & NAVIGATION TABS */}
            <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs font-bold text-slate-600 shrink-0">
                ข้อที่ {currentQuestionIndex + 1} จาก {totalQuestions}
              </span>
              <div className="flex-1 max-w-xs bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-200"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 font-medium shrink-0">
                ตอบแล้ว {answeredCount}/{totalQuestions}
              </span>
            </div>

            {/* QUESTION & CHOICES BODY */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {currentQuestion && (
                <div className="space-y-4">
                  {/* Question Text */}
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1">
                    <span className="text-[11px] font-bold text-blue-600 block">
                      คำถามข้อที่ {currentQuestion.questionNumber} ({currentQuestion.points} คะแนน)
                    </span>
                    <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                      {currentQuestion.questionText}
                    </p>
                  </div>

                  {/* 4 Choices (A, B, C, D) */}
                  <div className="space-y-2.5">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = answers[currentQuestion.id] === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setAnswers((prev) => ({
                              ...prev,
                              [currentQuestion.id]: opt.key,
                            }));
                          }}
                          className={`w-full p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-500 shadow-xs'
                              : 'bg-white border-slate-200 hover:bg-slate-50/80'
                          }`}
                        >
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span
                            className={`text-xs sm:text-sm font-medium ${
                              isSelected ? 'text-blue-950 font-bold' : 'text-slate-700'
                            }`}
                          >
                            {opt.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER BAR */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>ย้อนกลับ</span>
              </button>

              <div className="flex items-center gap-2">
                {currentQuestionIndex < totalQuestions - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <span>ข้อถัดไป</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      if (answeredCount < totalQuestions) {
                        if (!window.confirm(`คุณยังตอบไม่ครบ (ตอบแล้ว ${answeredCount}/${totalQuestions}) ยืนยันการส่งข้อสอบหรือไม่?`)) {
                          return;
                        }
                      }
                      handleSubmit(false);
                    }}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'กำลังส่ง...' : 'ส่งข้อสอบ'}</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* FOCUS LOSS WARNING MODAL */}
        {/* ------------------------------------------------------------------ */}
        {showWarningModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-100">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-rose-200 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">
                ตรวจพบการสลับหน้าจอหรือย่อแท็บ!
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                ระบบตรวจพบว่าคุณสลับออกจากหน้าจอการสอบเป็นครั้งที่{' '}
                <span className="font-bold text-rose-600">{violationCount}</span> จากสูงสุด{' '}
                <span className="font-bold">{quiz.maxBlurWarnings}</span> ครั้ง
              </p>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 font-medium">
                ⚠️ หากสลับหน้าจออีก{' '}
                {Math.max(0, quiz.maxBlurWarnings - violationCount)} ครั้ง ระบบจะทำการส่งข้อสอบอัตโนมัติทันที
              </div>
              <button
                type="button"
                onClick={() => setShowWarningModal(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                รับทราบและทำข้อสอบต่อ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
