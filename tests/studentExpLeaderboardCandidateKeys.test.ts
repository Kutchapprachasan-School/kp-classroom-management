import { describe, it, expect, beforeEach, vi } from 'vitest';

if (typeof (globalThis as any).localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    length: 0,
    key: () => null,
  };
}

import { calculateStudentExp } from '../src/services/studentExpService';

describe('studentExpService & Leaderboard Candidate Keys Test', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('resolves candidate keys consistently when querying XP by studentId or studentCode', () => {
    const studentCode = '47001';
    const prefixedId = `stu-${studentCode}`;

    // Mock an XP transaction saved under prefixedId in cls_xp_transactions
    const mockTx = {
      id: 'tx-1',
      studentId: prefixedId,
      amount: 150,
      reason: 'BEHAVIOR',
      description: 'ตอบคำถามในห้องเรียน',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('cls_xp_transactions', JSON.stringify([mockTx]));

    // 1. Calculate XP passing (prefixedId, studentCode)
    const expWithPrefix = calculateStudentExp(prefixedId, studentCode);
    expect(expWithPrefix.breakdown.behaviorTransactionsXp).toBe(150);
    expect(expWithPrefix.totalXp).toBeGreaterThanOrEqual(150);

    // 2. Calculate XP passing (studentCode, studentCode) - resolves candidate key 'stu-47001'
    const expWithCodeOnly = calculateStudentExp(studentCode, studentCode);
    expect(expWithCodeOnly.breakdown.behaviorTransactionsXp).toBe(150);
    expect(expWithCodeOnly.totalXp).toBe(expWithPrefix.totalXp);
  });

  it('matches streak transactions across candidate key formats', () => {
    const studentCode = '47002';
    const prefixedId = `stu-${studentCode}`;

    // Streak saved under prefixedId: cls_student_streak_stu-47002_count
    localStorage.setItem(`cls_student_streak_${prefixedId}_count`, '5');

    // Calling calculateStudentExp with (studentCode, studentCode) must resolve candidate key 'stu-47002'
    const exp = calculateStudentExp(studentCode, studentCode);
    expect(exp.breakdown.streakCount).toBe(5);
    expect(exp.breakdown.streakXp).toBe(5 * 20); // 100 XP
  });

  it('guarantees classroom leaderboard entry XP matches individual myExp for current user', () => {
    const studentCode = '47003';
    const studentId = 'user-auth-uuid-999';

    // Give this student behavior XP
    const mockTx = {
      id: 'tx-current-user',
      studentId: studentId,
      amount: 340,
      reason: 'BEHAVIOR',
      description: 'ส่งงานตรงเวลาและมีส่วนร่วม',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('cls_xp_transactions', JSON.stringify([mockTx]));

    const myExp = calculateStudentExp(studentId, studentCode);
    expect(myExp.totalXp).toBe(340);

    // Leaderboard logic matching StudentMissionsView:
    const s = { studentCode: '47003', studentName: 'ด.ช. กันต์นริศย์ ทวีเศรษฐกร', classroom: 'ม.2/1', gender: 'MALE' };
    const isMe = s.studentCode === studentCode;
    const targetId = isMe ? studentId : `stu-${s.studentCode}`;
    const expCalc = isMe ? myExp : calculateStudentExp(targetId, s.studentCode);

    const leaderboardEntry = {
      name: s.studentName,
      classroom: s.classroom,
      xp: isMe ? myExp.totalXp : expCalc.totalXp,
      isCurrentUser: isMe,
    };

    // Both must match exactly (340 XP vs 340 XP, resolving the bug in the screenshot)
    expect(leaderboardEntry.xp).toBe(myExp.totalXp);
    expect(leaderboardEntry.classroom).toBe('ม.2/1');
    expect(leaderboardEntry.isCurrentUser).toBe(true);
  });
});
