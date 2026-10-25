// src/components/live-classroom/RandomTextSubTab.tsx
// แท็บสุ่มข้อความ / คำศัพท์ / คำถามชวนคิด (Random Text & Vocab Picker)
// พร้อมระบบสร้างและเซฟชุดคำศัพท์ (Word Decks) แยกรายวิชาและครูผู้สอน, ตัวเลือกลุ้นระทึก, และโหมดสุ่มคู่นักเรียนตอบ

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import SparklesRegular from '@mingcute/react/core-regular/sparkles';
import RandomRegular from '@mingcute/react/core-regular/random';
import Refresh1Regular from '@mingcute/react/core-regular/refresh-1';
import Coin2Regular from '@mingcute/react/core-regular/coin-2';
import TicketRegular from '@mingcute/react/core-regular/ticket';
import CheckCircleRegular from '@mingcute/react/core-regular/check-circle';
import CloseRegular from '@mingcute/react/core-regular/close';
import TrophyRegular from '@mingcute/react/core-regular/trophy';
import {
  BookOpen,
  FolderOpen,
  Plus,
  Trash2,
  Save,
  Users,
  Edit3,
  HelpCircle,
  Volume2,
} from 'lucide-react';
import type { LiveStudent, WordDeckItem } from '../../services/liveClassroomService';
import { liveClassroomService } from '../../services/liveClassroomService';
import { tts } from '../../utils/speechTTS';

export type SpinSpeed = 'fast' | 'normal' | 'dramatic';

export interface RandomTextSubTabProps {
  students: LiveStudent[];
  classroomId: string;
  isProjectorMode: boolean;
  currentTeacherId?: string;
  currentTeacherName?: string;
  subjectName?: string;
  onGiveReward: (
    studentIds: string[],
    rewardType: 'coin' | 'ticket',
    amount: number,
    description: string
  ) => void;
  onPlaySound?: (type: 'tick' | 'coin' | 'fanfare' | 'buzzer', freq?: number) => void;
  onNotifyToast?: (message: string) => void;
  isActive?: boolean;
}

export const RandomTextSubTab: React.FC<RandomTextSubTabProps> = ({
  students,
  classroomId,
  isProjectorMode,
  currentTeacherId,
  currentTeacherName,
  subjectName,
  onGiveReward,
  onPlaySound,
  onNotifyToast,
  isActive = true,
}) => {
  // Decks state
  const [decks, setDecks] = useState<WordDeckItem[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');

  // Random word states
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [rollingWord, setRollingWord] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinSpeed, setSpinSpeed] = useState<SpinSpeed>('normal');
  const [noRepeat, setNoRepeat] = useState<boolean>(true);
  const [pickedWords, setPickedWords] = useState<string[]>([]);
  const [historyWords, setHistoryWords] = useState<{ word: string; timestamp: string }[]>([]);

  // Pair with student states
  const [isPairStudent, setIsPairStudent] = useState<boolean>(true);
  const [pairedStudent, setPairedStudent] = useState<LiveStudent | null>(null);
  const [rollingStudent, setRollingStudent] = useState<LiveStudent | null>(null);
  const [rewardGranted, setRewardGranted] = useState<boolean>(false);

  // Voice & Speech TTS settings (Thai, English, Japanese, Chinese)
  const [speakStudentName, setSpeakStudentName] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('cls_speak_student_name_vocab');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [speakVocabWord, setSpeakVocabWord] = useState<boolean>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('cls_speak_vocab_word');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [vocabSpeechLang, setVocabSpeechLang] = useState<'th-TH' | 'en-US' | 'ja-JP' | 'zh-CN'>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('cls_vocab_speech_lang');
      if (saved) return saved as any;
    }
    return 'th-TH';
  });

  // Deck Management Modal State
  const [isDeckModalOpen, setIsDeckModalOpen] = useState<boolean>(false);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [deckNameInput, setDeckNameInput] = useState<string>('');
  const [deckWordsInput, setDeckWordsInput] = useState<string>('');

  const spinTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const cancelSpinTimers = useCallback(() => {
    spinTimersRef.current.forEach(clearTimeout);
    spinTimersRef.current = [];
    setIsSpinning(false);
  }, []);

  useEffect(() => {
    return () => cancelSpinTimers();
  }, [cancelSpinTimers]);

  // โหลดชุดคำศัพท์ที่บันทึกไว้ของครูและวิชานี้
  const loadDecks = useCallback(() => {
    if (!classroomId) return;
    const loaded = liveClassroomService.getWordDecks(classroomId, currentTeacherId, subjectName);
    setDecks(loaded);
    if (loaded.length > 0 && (!selectedDeckId || !loaded.some((d) => d.id === selectedDeckId))) {
      setSelectedDeckId(loaded[0].id);
    }
  }, [classroomId, currentTeacherId, subjectName, selectedDeckId]);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  const activeDeck = useMemo(() => {
    return decks.find((d) => d.id === selectedDeckId) || null;
  }, [decks, selectedDeckId]);

  const presentStudents = useMemo(() => {
    return students.filter((s) => s.present);
  }, [students]);

  // กองคำศัพท์ที่พร้อมให้สุ่ม (ไม่ซ้ำคำเดิมที่สุ่มไปแล้วในรอบนี้)
  const availableWords = useMemo(() => {
    if (!activeDeck || !activeDeck.words) return [];
    if (!noRepeat) return activeDeck.words;
    return activeDeck.words.filter((w) => !pickedWords.includes(w));
  }, [activeDeck, pickedWords, noRepeat]);

  // ล้างสถานะเมื่อเปลี่ยนชุดคำศัพท์
  const handleSelectDeck = (deckId: string) => {
    cancelSpinTimers();
    setSelectedDeckId(deckId);
    setCurrentWord(null);
    setRollingWord(null);
    setPairedStudent(null);
    setRollingStudent(null);
    setPickedWords([]);
    setRewardGranted(false);
  };

  // รีเซ็ตกองคำศัพท์ที่สุ่มไปแล้ว
  const handleResetPool = () => {
    cancelSpinTimers();
    setPickedWords([]);
    setCurrentWord(null);
    setRollingWord(null);
    setPairedStudent(null);
    setRollingStudent(null);
    setRewardGranted(false);
    onPlaySound?.('tick', 600);
    onNotifyToast?.('🔄 รีเซ็ตกองคำศัพท์ให้พร้อมสุ่มใหม่ทั้งหมดแล้ว');
  };

  // เริ่มสุ่มคำศัพท์ (พร้อมระบบจับเวลาแม่นยำ True-Time Scheduler)
  const handleSpinWord = useCallback(() => {
    if (isSpinning || availableWords.length === 0) return;

    cancelSpinTimers();
    setIsSpinning(true);
    setRewardGranted(false);

    // เลือกล่วงหน้าแบบสุ่ม
    const targetWord = availableWords[Math.floor(Math.random() * availableWords.length)];

    let targetStudent: LiveStudent | null = null;
    if (isPairStudent && presentStudents.length > 0) {
      targetStudent = presentStudents[Math.floor(Math.random() * presentStudents.length)];
    }

    // กำหนดระยะเวลาการหมุน
    const targetDurationMs =
      spinSpeed === 'fast' ? 1500 : spinSpeed === 'normal' ? 3000 : 5000;

    const baseMinIntervalMs = 45;
    const baseMaxIntervalMs = 420;
    const scheduledSteps: number[] = [];
    let accumulatedTime = 0;

    while (accumulatedTime < targetDurationMs) {
      const progress = Math.min(1, accumulatedTime / targetDurationMs);
      const easeCurvature = Math.pow(progress, 1.9);
      const currentInterval =
        baseMinIntervalMs + easeCurvature * (baseMaxIntervalMs - baseMinIntervalMs);
      accumulatedTime += currentInterval;
      if (accumulatedTime <= targetDurationMs) {
        scheduledSteps.push(accumulatedTime);
      }
    }

    if (
      scheduledSteps.length === 0 ||
      scheduledSteps[scheduledSteps.length - 1] < targetDurationMs
    ) {
      scheduledSteps.push(targetDurationMs);
    }

    const totalSteps = scheduledSteps.length;

    scheduledSteps.forEach((stepTimeMs, index) => {
      const isFinalStep = index === totalSteps - 1;
      const progress = index / Math.max(1, totalSteps - 1);

      const timerId = setTimeout(() => {
        if (!isFinalStep) {
          // สุ่มคำระหว่างหมุน
          const randomRollingWord =
            availableWords[Math.floor(Math.random() * availableWords.length)];
          setRollingWord(randomRollingWord);

          if (isPairStudent && presentStudents.length > 0) {
            const randomRollingStudent =
              presentStudents[Math.floor(Math.random() * presentStudents.length)];
            setRollingStudent(randomRollingStudent);
          }

          const pitch = 500 + Math.round(progress * 450);
          onPlaySound?.('tick', pitch);
        } else {
          // คำสุดท้ายที่หยุดลง
          setCurrentWord(targetWord);
          setRollingWord(targetWord);
          setPairedStudent(targetStudent);
          setRollingStudent(targetStudent);
          setIsSpinning(false);

          setPickedWords((prev) => (prev.includes(targetWord) ? prev : [...prev, targetWord]));
          setHistoryWords((prev) => [
            { word: targetWord, timestamp: new Date().toLocaleTimeString('th-TH') },
            ...prev,
          ]);

          onPlaySound?.('fanfare');

          // 🔊 อ่านออกเสียงเมื่อสุ่มเสร็จสิ้น (แยกการควบคุมเสียงเรียกชื่อนักเรียนและเสียงอ่านคำศัพท์ออกจากกัน)
          let delayMs = 0;
          if (targetStudent && isPairStudent && speakStudentName) {
            tts.speakStudentName(targetStudent.number, targetStudent.name, true);
            delayMs = 1200;
          }

          if (speakVocabWord) {
            if (delayMs > 0) {
              const wordTimer = setTimeout(() => {
                tts.speakText(targetWord, vocabSpeechLang, true);
              }, delayMs);
              spinTimersRef.current.push(wordTimer);
            } else {
              tts.speakText(targetWord, vocabSpeechLang, true);
            }
          }
        }
      }, stepTimeMs);

      spinTimersRef.current.push(timerId);
    });
  }, [
    isSpinning,
    availableWords,
    cancelSpinTimers,
    isPairStudent,
    speakStudentName,
    speakVocabWord,
    vocabSpeechLang,
    presentStudents,
    spinSpeed,
    onPlaySound,
  ]);

  // คีย์ลัด Spacebar สำหรับสุ่มคำศัพท์
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleSpinWord();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleSpinWord]);

  // สลับนักเรียนคนอื่น (กรณีสุ่มคำศัพท์เดิมแต่นักเรียนขอผ่าน)
  const handleRerollStudent = () => {
    if (presentStudents.length <= 1) return;
    const candidates = presentStudents.filter((s) => s.id !== pairedStudent?.id);
    const nextStudent = candidates[Math.floor(Math.random() * candidates.length)];
    setPairedStudent(nextStudent);
    setRollingStudent(nextStudent);
    setRewardGranted(false);
    onPlaySound?.('tick', 750);
  };

  // ให้รางวัลนักเรียนที่ตอบถูก
  const handleAwardStudent = (type: 'coin' | 'ticket', amount: number) => {
    if (!pairedStudent || rewardGranted) return;
    onGiveReward(
      [pairedStudent.id],
      type,
      amount,
      `ตอบคำถามคำศัพท์: "${currentWord}"`
    );
    setRewardGranted(true);
    onPlaySound?.(type === 'coin' ? 'coin' : 'fanfare');
  };

  // เปิดหน้าต่างสร้าง / แก้ไขชุดคำศัพท์
  const handleOpenCreateDeck = () => {
    setEditingDeckId(null);
    setDeckNameInput('');
    setDeckWordsInput('');
    setIsDeckModalOpen(true);
  };

  const handleOpenEditDeck = () => {
    if (!activeDeck) return;
    setEditingDeckId(activeDeck.id);
    setDeckNameInput(activeDeck.name);
    setDeckWordsInput(activeDeck.words.join('\n'));
    setIsDeckModalOpen(true);
  };

  const handleSaveDeck = () => {
    const name = deckNameInput.trim() || `ชุดคำศัพท์ ${new Date().toLocaleDateString('th-TH')}`;
    const parsedWords = deckWordsInput
      .split(/[\n,]/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (parsedWords.length === 0) {
      alert('กรุณากรอกคำศัพท์อย่างน้อย 1 คำ');
      return;
    }

    const saved = liveClassroomService.saveWordDeck(
      classroomId,
      name,
      parsedWords,
      currentTeacherId,
      currentTeacherName,
      subjectName,
      editingDeckId || undefined
    );

    loadDecks();
    setSelectedDeckId(saved.id);
    setIsDeckModalOpen(false);
    onNotifyToast?.(`💾 บันทึกชุดคำศัพท์ "${name}" (${saved.words.length} คำ) สำเร็จ!`);
  };

  const handleDeleteDeck = (deckId: string) => {
    const deck = decks.find((d) => d.id === deckId);
    if (!deck) return;
    if (window.confirm(`คุณต้องการลบชุดคำศัพท์ "${deck.name}" ใช่หรือไม่?`)) {
      liveClassroomService.deleteWordDeck(classroomId, deckId, currentTeacherId, subjectName);
      loadDecks();
      if (selectedDeckId === deckId) {
        setSelectedDeckId('');
        setCurrentWord(null);
        setRollingWord(null);
      }
      onNotifyToast?.('🗑️ ลบชุดคำศัพท์เรียบร้อยแล้ว');
    }
  };

  const displayWord = isSpinning ? rollingWord : currentWord;
  const displayStudent = isSpinning ? rollingStudent : pairedStudent;

  return (
    <div className="flex-1 flex flex-col gap-5">
      {/* Top Setting & Deck Bar */}
      <div
        className={`rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border transition-colors ${
          isProjectorMode
            ? 'bg-slate-900 border-slate-800'
            : 'bg-white border-[#E6EEF7] shadow-sm'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Deck Selector */}
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
            <span
              className={`text-xs font-semibold ${
                isProjectorMode ? 'text-slate-400' : 'text-[#6B7C93]'
              }`}
            >
              ชุดคำศัพท์:
            </span>
            <select
              value={selectedDeckId}
              onChange={(e) => handleSelectDeck(e.target.value)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold border transition-colors ${
                isProjectorMode
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-[#F7FAFF] border-[#E2E8F0] text-[#163A66]'
              }`}
            >
              {decks.length === 0 ? (
                <option value="" disabled>
                  -- ยังไม่มีชุดคำศัพท์ --
                </option>
              ) : (
                decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    📚 {deck.name} ({deck.words.length} คำ)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Create & Edit Deck Buttons */}
          <button
            onClick={handleOpenCreateDeck}
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95"
            title="เพิ่มชุดคำศัพท์หรือคลังข้อความใหม่"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>สร้างชุดคำศัพท์</span>
          </button>

          {activeDeck && (
            <button
              onClick={handleOpenEditDeck}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isProjectorMode
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  : 'bg-slate-50 hover:bg-slate-100 border-[#E2E8F0] text-slate-600'
              }`}
              title="แก้ไขชุดคำศัพท์นี้"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>แก้ไขคำ</span>
            </button>
          )}

          {activeDeck && (
            <button
              onClick={() => handleDeleteDeck(activeDeck.id)}
              className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition"
              title="ลบชุดคำศัพท์นี้"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Options: Speed, No-repeat, Pair Student */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
            <input
              type="checkbox"
              checked={noRepeat}
              onChange={(e) => setNoRepeat(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className={isProjectorMode ? 'text-slate-200' : 'text-[#163A66]'}>
              ไม่สุ่มคำซ้ำ
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
            <input
              type="checkbox"
              checked={isPairStudent}
              onChange={(e) => setIsPairStudent(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className={isProjectorMode ? 'text-slate-200' : 'text-[#163A66]'}>
              🎯 สุ่มคู่กับนักเรียนตอบ
            </span>
          </label>

          {isPairStudent && (
            <label
              className={`flex items-center gap-1.5 cursor-pointer text-xs font-semibold select-none px-2.5 py-1 rounded-xl border transition ${
                isProjectorMode
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-blue-50/80 border-blue-200 text-[#163A66]'
              }`}
            >
              <input
                type="checkbox"
                checked={speakStudentName}
                onChange={(e) => {
                  setSpeakStudentName(e.target.checked);
                  localStorage.setItem('cls_speak_student_name_vocab', String(e.target.checked));
                }}
                className="w-3.5 h-3.5 rounded accent-blue-600"
              />
              <Volume2 className="w-3.5 h-3.5 text-blue-500" />
              <span>เรียกชื่อนักเรียน</span>
            </label>
          )}

          {/* สวิตช์เลือกว่าจะให้อ่านออกเสียงคำศัพท์หรือไม่ */}
          <label
            className={`flex items-center gap-1.5 cursor-pointer text-xs font-semibold select-none px-2.5 py-1 rounded-xl border transition ${
              isProjectorMode
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-indigo-50/80 border-indigo-200 text-[#163A66]'
            }`}
            title="เปิด/ปิดการอ่านออกเสียงคำศัพท์ (หากต้องการให้นักเรียนอ่านหรืออธิบายเอง ให้ปิดตัวเลือกนี้)"
          >
            <input
              type="checkbox"
              checked={speakVocabWord}
              onChange={(e) => {
                setSpeakVocabWord(e.target.checked);
                localStorage.setItem('cls_speak_vocab_word', String(e.target.checked));
              }}
              className="w-3.5 h-3.5 rounded accent-indigo-600"
            />
            <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>อ่านออกเสียงคำศัพท์</span>
          </label>

          {/* ตัวเลือกภาษาสำหรับอ่านออกเสียงคำศัพท์ (ไทย, อังกฤษ, ญี่ปุ่น, จีน) */}
          {speakVocabWord && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition ${
                isProjectorMode
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-white border-[#BFDBFE] text-[#163A66] shadow-xs'
              }`}
            >
              <span className={`text-[11px] font-bold ${isProjectorMode ? 'text-slate-400' : 'text-[#6B7C93]'}`}>
                ภาษาเสียง:
              </span>
              <select
                value={vocabSpeechLang}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setVocabSpeechLang(val);
                  localStorage.setItem('cls_vocab_speech_lang', val);
                }}
                className={`text-xs font-bold bg-transparent focus:outline-none cursor-pointer ${
                  isProjectorMode ? 'text-slate-100' : 'text-[#163A66]'
                }`}
              >
                <option value="th-TH">🇹🇭 ไทย</option>
                <option value="en-US">🇬🇧 English</option>
                <option value="ja-JP">🇯🇵 日本語</option>
                <option value="zh-CN">🇨🇳 中文</option>
              </select>
            </div>
          )}

          <div
            className={`flex items-center p-0.5 rounded-xl border transition ${
              isProjectorMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {(['fast', 'normal', 'dramatic'] as SpinSpeed[]).map((spd) => (
              <button
                key={spd}
                onClick={() => setSpinSpeed(spd)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  spinSpeed === spd
                    ? isProjectorMode
                      ? 'bg-slate-700 text-blue-300 shadow-xs'
                      : 'bg-white text-blue-600 shadow-xs'
                    : isProjectorMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {spd === 'fast' ? '⚡ 1.5s' : spd === 'normal' ? '⏱️ 3s' : '🔥 5s'}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetPool}
            className={`p-2 rounded-xl border transition ${
              isProjectorMode
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                : 'bg-white hover:bg-slate-50 border-[#E6EEF7] text-slate-600'
            }`}
            title="รีเซ็ตกองคำศัพท์ให้พร้อมสุ่มใหม่ทั้งหมด"
          >
            <Refresh1Regular className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Flashcard Stage */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Giant Word Stage (Span 2 cols on desktop) */}
        <div
          className={`lg:col-span-2 rounded-3xl p-8 flex flex-col justify-between items-center text-center border relative overflow-hidden transition-all ${
            isProjectorMode
              ? 'bg-slate-900 border-slate-800 shadow-2xl'
              : 'bg-white border-[#E6EEF7] shadow-sm'
          }`}
        >
          {/* Deck Status Bar */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400 font-semibold mb-4">
            <span className="flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-blue-500" />
              <span>{activeDeck ? activeDeck.name : 'กรุณาเลือกชุดคำศัพท์'}</span>
            </span>

            {activeDeck && (
              <span className="bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold">
                เหลือ {availableWords.length} / {activeDeck.words.length} คำ
              </span>
            )}
          </div>

          {/* Giant Word Display Area */}
          <div className="my-auto py-8 w-full max-w-2xl flex flex-col items-center justify-center min-h-[220px]">
            {activeDeck && activeDeck.words.length > 0 ? (
              displayWord ? (
                <div className="animate-in zoom-in-95 duration-200 flex flex-col items-center">
                  <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full mb-4">
                    <SparklesRegular className="w-3.5 h-3.5" />
                    <span>คำศัพท์ที่สุ่มได้</span>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <h1
                      className={`font-black tracking-wide leading-tight break-words px-4 transition-all ${
                        isProjectorMode
                          ? 'text-5xl md:text-7xl lg:text-8xl text-white drop-shadow-md'
                          : 'text-4xl md:text-6xl lg:text-7xl text-[#163A66]'
                      } ${isSpinning ? 'opacity-80 scale-95 blur-[0.5px]' : 'scale-100'}`}
                    >
                      {displayWord}
                    </h1>
                    {!isSpinning && displayWord && (
                      <button
                        type="button"
                        onClick={() => tts.speakText(displayWord, vocabSpeechLang, true)}
                        className={`p-3 rounded-2xl transition active:scale-90 shadow-sm shrink-0 ${
                          isProjectorMode
                            ? 'bg-slate-800 hover:bg-slate-700 text-blue-300'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                        }`}
                        title="กดเพื่อฟังเสียงอ่านคำศัพท์นี้"
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <HelpCircle className="w-16 h-16 opacity-30 text-blue-500 mb-3" />
                  <p className="text-xl font-bold text-slate-600 dark:text-slate-300">
                    พร้อมสุ่มคำศัพท์แล้ว
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    กดปุ่ม &ldquo;สุ่มคำศัพท์ทันที&rdquo; ด้านล่างเพื่อเริ่มการสุ่ม
                  </p>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <BookOpen className="w-16 h-16 opacity-30 text-blue-500 mb-3" />
                <p className="text-lg font-bold text-slate-600 dark:text-slate-300">
                  ยังไม่มีคำศัพท์ในชุดนี้
                </p>
                <button
                  onClick={handleOpenCreateDeck}
                  className="mt-3 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>สร้างชุดคำศัพท์ใหม่</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          <div className="w-full flex items-center justify-center pt-4">
            <button
              onClick={handleSpinWord}
              disabled={isSpinning || availableWords.length === 0}
              className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-black px-10 py-4 rounded-2xl text-lg shadow-xl shadow-blue-500/25 transition active:scale-95"
            >
              <RandomRegular className={`w-6 h-6 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'กำลังสุ่มคำศัพท์...' : 'สุ่มคำศัพท์ทันที'}</span>
            </button>
          </div>
        </div>

        {/* Right: Paired Student Card & Word History */}
        <div className="flex flex-col gap-6">
          {/* Lucky Student Card (if paired) */}
          {isPairStudent && (
            <div
              className={`rounded-3xl p-6 border transition-all ${
                isProjectorMode
                  ? 'bg-slate-900 border-slate-800'
                  : 'bg-white border-[#E6EEF7] shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <h3
                  className={`text-sm font-bold flex items-center gap-2 ${
                    isProjectorMode ? 'text-slate-200' : 'text-[#163A66]'
                  }`}
                >
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>นักเรียนผู้ตอบคำถาม</span>
                </h3>

                {displayStudent && !isSpinning && (
                  <button
                    onClick={handleRerollStudent}
                    className="text-xs text-blue-600 hover:underline font-bold"
                    title="สลับนักเรียนคนอื่น"
                  >
                    สลับคนตอบ
                  </button>
                )}
              </div>

              {displayStudent ? (
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-2xl font-black text-blue-600 dark:text-blue-300 shadow-sm mb-3">
                    {displayStudent.name.charAt(0)}
                  </div>
                  <h4
                    className={`font-black text-base ${
                      isProjectorMode ? 'text-white' : 'text-[#163A66]'
                    }`}
                  >
                    {displayStudent.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    เลขประจำตัว #{displayStudent.studentCode}
                  </p>

                  {/* Reward Action Buttons */}
                  {!isSpinning && currentWord && (
                    <div className="w-full mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      {!rewardGranted ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleAwardStudent('coin', 1)}
                            className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 rounded-xl text-xs transition active:scale-95 shadow-sm"
                            title="มอบเหรียญสะสม 1 เหรียญให้นักเรียนที่ตอบถูก"
                          >
                            <Coin2Regular className="w-4 h-4" />
                            <span>+1 ตอบถูก</span>
                          </button>

                          <button
                            onClick={() => handleAwardStudent('ticket', 1)}
                            className="flex items-center justify-center gap-1.5 bg-pink-500 hover:bg-pink-400 text-white font-black py-2 rounded-xl text-xs transition active:scale-95 shadow-sm"
                            title="มอบตั๋วสุ่มสำหรับหมุนชิงโชคท้ายคาบ 1 ใบ"
                          >
                            <TicketRegular className="w-4 h-4" />
                            <span>+1 ให้ตั๋วสุ่ม</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 text-emerald-500 font-bold text-xs py-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
                          <CheckCircleRegular className="w-4 h-4" />
                          <span>บันทึกรางวัลตอบถูกเรียบร้อย!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  เมื่อกดสุ่มคำศัพท์ ระบบจะสุ่มนักเรียนในห้องขึ้นมาคู่กันโดยอัตโนมัติ
                </div>
              )}
            </div>
          )}

          {/* History of rolled words in this session */}
          <div
            className={`rounded-3xl p-6 border flex-1 flex flex-col transition-all ${
              isProjectorMode
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-[#E6EEF7] shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <h3
                className={`text-sm font-bold flex items-center gap-2 ${
                  isProjectorMode ? 'text-slate-200' : 'text-[#163A66]'
                }`}
              >
                <TrophyRegular className="w-4 h-4 text-amber-500" />
                <span>ประวัติคำศัพท์คาบนี้</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {historyWords.length} คำ
              </span>
            </div>

            {historyWords.length > 0 ? (
              <div className="flex-1 overflow-y-auto max-h-56 space-y-1.5 pr-1">
                {historyWords.map((item, idx) => (
                  <div
                    key={`${item.word}-${idx}`}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                      isProjectorMode
                        ? 'bg-slate-800/60 text-slate-200'
                        : 'bg-[#F7FAFF] text-[#163A66]'
                    }`}
                  >
                    <span className="font-bold">{item.word}</span>
                    <span className="text-slate-400 text-[11px] font-mono">
                      {item.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                ยังไม่มีประวัติการสุ่มคำศัพท์ในคาบนี้
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deck Creation & Editing Modal */}
      {isDeckModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-150 ${
              isProjectorMode
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-white border-[#E6EEF7] text-[#163A66]'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <span>{editingDeckId ? 'แก้ไขชุดคำศัพท์' : 'สร้างชุดคำศัพท์ใหม่'}</span>
              </h3>
              <button
                onClick={() => setIsDeckModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
              >
                <CloseRegular className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                  ชื่อชุดคำศัพท์ / คลังคำถาม:
                </label>
                <input
                  type="text"
                  placeholder="เช่น คำศัพท์ภาษาอังกฤษ Unit 1, สูตรฟิสิกส์ ม.4..."
                  value={deckNameInput}
                  onChange={(e) => setDeckNameInput(e.target.value)}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    isProjectorMode
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-[#F7FAFF] border-[#E2E8F0] text-[#163A66]'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    รายการคำศัพท์ / ข้อความ (1 คำ/ข้อความ ต่อ 1 บรรทัด หรือคั่นด้วยจุลภาค):
                  </label>
                  <span className="text-[11px] text-blue-600 font-bold">
                    พบ{' '}
                    {
                      deckWordsInput
                        .split(/[\n,]/)
                        .map((w) => w.trim())
                        .filter((w) => w.length > 0).length
                    }{' '}
                    คำ
                  </span>
                </div>
                <textarea
                  rows={8}
                  placeholder={`ตัวอย่างเช่น:\nPhotosynthesis\nChloroplast\nCell Membrane\nMitochondria\nCytoplasm`}
                  value={deckWordsInput}
                  onChange={(e) => setDeckWordsInput(e.target.value)}
                  className={`w-full rounded-2xl p-4 text-xs font-mono leading-relaxed border focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none ${
                    isProjectorMode
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-[#F7FAFF] border-[#E2E8F0] text-[#163A66] placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeckModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleSaveDeck}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md shadow-blue-500/20 transition active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกชุดคำศัพท์</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
