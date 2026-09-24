import React, { useState } from 'react';
import {
  Zap,
  Flame,
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { QuizQuestion, StudentLeaderboardEntry } from '../types/viewModels';

const arenaQuestions: QuizQuestion[] = [
  {
    id: 'q-1',
    question: 'สัญลักษณ์ใดบอกระดับเสียงของตัวโน้ตบนบรรทัด 5 เส้น?',
    options: ['ก. กุญแจซอล (G Clef)', 'ข. ตัวหยุดเบ็ดเสร็จ', 'ค. เครื่องหมายชาร์ป (#)', 'ง. เส้นกั้นห้อง (Bar Line)'],
    correctIndex: 0,
    explanation: 'กุญแจซอล (G Clef) เป็นสัญลักษณ์กำหนดว่าโน้ตบนเส้นที่ 2 คือเสียง ซอล (G) ซึ่งใช้กำหนดระดับเสียงของโน้ตตัวอื่นๆ',
  },
  {
    id: 'q-2',
    question: 'โน้ตตัวดำ (Quarter Note) มีค่าเท่ากับกี่จังหวะในอัตราจังหวะ 4/4?',
    options: ['ก. 1/2 จังหวะ', 'ข. 1 จังหวะ', 'ค. 2 จังหวะ', 'ง. 4 จังหวะ'],
    correctIndex: 1,
    explanation: 'ในอัตราจังหวะ 4/4 โน้ตตัวกลมมี 4 จังหวะ ตัวขาวมี 2 จังหวะ และตัวดำมีค่าเท่ากับ 1 จังหวะ',
  },
  {
    id: 'q-3',
    question: 'แม่สีขั้นที่ 1 ในทางทัศนศิลป์ประกอบด้วยสีใดบ้าง?',
    options: ['ก. แดง เหลือง เขียว', 'ข. แดง เขียว น้ำเงิน', 'ค. แดง เหลือง น้ำเงิน', 'ง. ส้ม เขียว ม่วง'],
    correctIndex: 2,
    explanation: 'แม่สีขั้นที่ 1 คือ แดง เหลือง น้ำเงิน ซึ่งเป็นสีตั้งต้นที่ไม่สามารถผสมขึ้นมาจากสีอื่นได้',
  },
];

const mockLeaderboard: StudentLeaderboardEntry[] = [
  { rank: 1, name: 'ด.ญ. ปรียาภรณ์ ชัยแก้ว', classroom: 'ม.3/8', xp: 1240, streakDays: 12, avatarText: 'ป' },
  { rank: 2, name: 'ด.ช. กฤษณะ ศรีสมบูรณ์', classroom: 'ม.3/8', xp: 1120, streakDays: 9, avatarText: 'ก' },
  { rank: 3, name: 'ด.ช. ชัยมงคล วงศ์บุตร', classroom: 'ม.3/8', xp: 980, streakDays: 7, avatarText: 'ช' },
  { rank: 4, name: 'ด.ช. ทัตธน คำฝั้น', classroom: 'ม.3/8', xp: 850, streakDays: 5, avatarText: 'ท' },
  { rank: 5, name: 'ด.ญ. อคิราห์ วิรากร', classroom: 'ม.3/8', xp: 720, streakDays: 3, avatarText: 'อ' },
  { rank: 6, name: 'ด.ช. อัศวิน วนเกษตรกุล', classroom: 'ม.3/8', xp: 690, streakDays: 2, avatarText: 'อ' },
  { rank: 7, name: 'ด.ช. ภูรินท์ บัณฑิต', classroom: 'ม.3/8', xp: 670, streakDays: 4, avatarText: 'ภ' },
  { rank: 8, name: 'ด.ช. จิรายุ เดชปันคำ (คุณ)', classroom: 'ม.3/8', xp: 650, streakDays: 4, avatarText: 'จ', isCurrentUser: true },
];

export const StudentArenaView: React.FC = () => {
  const [quizState, setQuizState] = useState<'IDLE' | 'PLAYING' | 'RESULT'>('IDLE');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
  const [score, setScore] = useState(0);
  const [xpGained, setXpGained] = useState(0);

  const startQuiz = () => {
    setQuizState('PLAYING');
    setCurrentQIndex(0);
    setSelectedOption(null);
    setHasAnsweredCurrent(false);
    setScore(0);
    setXpGained(0);
  };

  const handleSelectOption = (index: number) => {
    if (hasAnsweredCurrent) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;
    const isCorrect = selectedOption === arenaQuestions[currentQIndex].correctIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    setHasAnsweredCurrent(true);
  };

  const handleNextQuestion = () => {
    if (currentQIndex + 1 < arenaQuestions.length) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setHasAnsweredCurrent(false);
    } else {
      // Finished
      const finalScore = score + (selectedOption === arenaQuestions[currentQIndex].correctIndex ? 0 : 0);
      const calculatedXp = finalScore * 50 + 50; // 50 per correct + 50 streak bonus
      setXpGained(calculatedXp);
      setQuizState('RESULT');
    }
  };

  const currentQ = arenaQuestions[currentQIndex];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Background sparkles decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-12 translate-x-12 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-yellow-200 fill-yellow-200" />
              <span>สนามท้าทายประจำสัปดาห์ (Weekly Battle Arena)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              มินิควิซสัปดาห์ที่ 8: ทฤษฎีดนตรีและทัศนศิลป์
            </h1>
            <p className="text-white/80 text-xs sm:text-sm max-w-xl">
              ตอบคำถาม 3 ข้อเพื่อทดสอบความรู้และสะสมแต้ม XP ให้สัตว์เลี้ยงโมจิ เลเวลอัปได้ไวยิ่งขึ้น!
            </p>
          </div>

          {/* Quick Badges in Header */}
          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 text-center min-w-[90px]">
              <div className="flex items-center justify-center gap-1 text-yellow-300">
                <Flame className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-black">4</span>
              </div>
              <div className="text-[11px] text-white/80 font-medium">สตรีก (วัน)</div>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 text-center min-w-[100px]">
              <div className="flex items-center justify-center gap-1 text-yellow-300">
                <Sparkles className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-black">+150</span>
              </div>
              <div className="text-[11px] text-white/80 font-medium">XP รางวัล</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Arena Game (Left 7) + Leaderboard (Right 5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Battle Arena Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            {/* IDLE STATE */}
            {quizState === 'IDLE' && (
              <div className="text-center py-8 space-y-6">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-inner">
                  <Trophy className="w-10 h-10 text-amber-500" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h2 className="text-xl font-bold text-slate-800">
                    พร้อมประลองความรู้ประจำสัปดาห์หรือยัง?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    มีคำถาม 3 ข้อ ข้อละ 50 XP พร้อมโบนัสสตรีก 4 วันต่อเนื่องอีก 50 XP รวมสูงสุด <span className="font-semibold text-amber-600">200 XP</span>!
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-left">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[11px] text-slate-400">จำนวนข้อ</div>
                    <div className="font-bold text-sm text-slate-700">3 ข้อ</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[11px] text-slate-400">เวลาต่อข้อ</div>
                    <div className="font-bold text-sm text-slate-700">ไม่จำกัด</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[11px] text-slate-400">โอกาสทำ</div>
                    <div className="font-bold text-sm text-slate-700">ไม่จำกัดรอบ</div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={startQuiz}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all transform active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>เริ่มทำชาเลนจ์เลย!</span>
                  </button>
                </div>
              </div>
            )}

            {/* PLAYING STATE */}
            {quizState === 'PLAYING' && (
              <div className="space-y-6">
                {/* Progress bar & Question Counter */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pb-2 border-b border-slate-100">
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <HelpCircle className="w-4 h-4" />
                    คำถามข้อที่ {currentQIndex + 1} จาก {arenaQuestions.length}
                  </span>
                  <span className="text-slate-400">คะแนนปัจจุบัน: {score} ข้อ</span>
                </div>

                {/* Progress pill indicator */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentQIndex + 1) / arenaQuestions.length) * 100}%` }}
                  />
                </div>

                {/* Question */}
                <div className="py-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">
                    {currentQ.question}
                  </h3>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {currentQ.options.map((option, idx) => {
                    let optionStyle = 'border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-slate-700';

                    if (selectedOption === idx) {
                      optionStyle = 'border-amber-500 bg-amber-50 text-amber-900 font-semibold ring-2 ring-amber-400/30';
                    }

                    if (hasAnsweredCurrent) {
                      if (idx === currentQ.correctIndex) {
                        optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-400/30';
                      } else if (selectedOption === idx) {
                        optionStyle = 'border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-400/30';
                      } else {
                        optionStyle = 'opacity-50 border-slate-200 text-slate-400';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={hasAnsweredCurrent}
                        className={`w-full p-4 rounded-2xl border text-left text-sm transition-all flex items-center justify-between ${optionStyle}`}
                      >
                        <span>{option}</span>
                        {hasAnsweredCurrent && idx === currentQ.correctIndex && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                        {hasAnsweredCurrent && selectedOption === idx && idx !== currentQ.correctIndex && (
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Box if answered */}
                {hasAnsweredCurrent && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1 animate-fade-in">
                    <span className="font-bold text-slate-700">💡 เฉลยและคำอธิบาย:</span>
                    <p className="text-slate-600 leading-relaxed">{currentQ.explanation}</p>
                  </div>
                )}

                {/* Control Actions */}
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  {!hasAnsweredCurrent ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={selectedOption === null}
                      className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                    >
                      ตรวจคำตอบ
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-6 py-2.5 bg-[#0f2e5c] hover:bg-[#164282] text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <span>{currentQIndex + 1 < arenaQuestions.length ? 'ข้อถัดไป' : 'ดูผลคะแนนสรุป'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* RESULT STATE */}
            {quizState === 'RESULT' && (
              <div className="text-center py-8 space-y-6 animate-fade-in">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-10 h-10 text-emerald-500" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                    ภารกิจสำเร็จ!
                  </span>
                  <h2 className="text-2xl font-black text-slate-800">
                    ตอบถูก {score} / {arenaQuestions.length} ข้อ
                  </h2>
                  <p className="text-xs text-slate-500">
                    ยอดเยี่ยมมาก! ได้รับคะแนนสะสมและอัปสตรีกต่อเนื่องเรียบร้อยแล้ว
                  </p>
                </div>

                {/* Reward Card */}
                <div className="max-w-sm mx-auto p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-around shadow-inner">
                  <div className="text-center">
                    <div className="text-xs text-amber-700 font-medium">XP ที่ได้รับ</div>
                    <div className="text-2xl font-black text-amber-600">+{xpGained} XP</div>
                  </div>
                  <div className="h-8 w-px bg-amber-200" />
                  <div className="text-center">
                    <div className="text-xs text-amber-700 font-medium">สตรีกต่อเนื่อง</div>
                    <div className="text-2xl font-black text-orange-600">5 วัน 🔥</div>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-4">
                  <button
                    onClick={startQuiz}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ลองทำใหม่อีกครั้ง</span>
                  </button>
                  <button
                    onClick={() => setQuizState('IDLE')}
                    className="px-6 py-2.5 bg-[#0f2e5c] text-white rounded-xl text-xs font-bold shadow-sm hover:bg-[#164282] transition-colors"
                  >
                    เสร็จสิ้น
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Buff / Booster Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                Active Buff: สมองแล่น (XP Multiplier 1.2x)
              </h4>
              <p className="text-xs text-indigo-700 leading-relaxed">
                คุณเข้าเรียนตรงเวลาครบ 5 คาบล่าสุด ระบบเพิ่มอัตราการคูณ XP ชาเลนจ์ 20% อัตโนมัติ!
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Classroom Leaderboard */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">
                  อันดับสนามประลอง ม.3/8
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                สัปดาห์ที่ 8
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {mockLeaderboard.map((item) => (
                <div
                  key={item.rank}
                  className={`py-3 px-2 flex items-center justify-between rounded-xl transition-colors ${
                    item.isCurrentUser
                      ? 'bg-amber-50/80 border border-amber-200 font-semibold'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Number / Medal */}
                    <div className="w-6 text-center font-black text-xs shrink-0">
                      {item.rank === 1 && <span className="text-base">🥇</span>}
                      {item.rank === 2 && <span className="text-base">🥈</span>}
                      {item.rank === 3 && <span className="text-base">🥉</span>}
                      {item.rank > 3 && <span className="text-slate-400">#{item.rank}</span>}
                    </div>

                    {/* Avatar circle */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      item.isCurrentUser ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.avatarText}
                    </div>

                    <div>
                      <div className={`text-xs ${item.isCurrentUser ? 'text-amber-900 font-bold' : 'text-slate-800'}`}>
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5 text-orange-500 fill-orange-500" />
                        <span>สตรีก {item.streakDays} วัน</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-bold ${item.isCurrentUser ? 'text-amber-700' : 'text-slate-700'}`}>
                      {item.xp.toLocaleString()} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 text-center border-t border-slate-100 mt-2">
              <span className="text-[11px] text-slate-400">
                อันดับจะรีเซ็ตทุกวันอาทิตย์ เวลา 23:59 น.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
