/**
 * Fuzzy Teacher Name Matcher & Normalizer
 *
 * Handles spacing variations (e.g. "นายภาสภูมิ  เรืองปราชญ์" vs "นายภาสภูมิ เรืองปราชญ์"),
 * title prefixes (ครู, นาย, นาง, นางสาว), and Levenshtein similarity scoring
 * to recommend the closest matched teacher in database.
 */

import type { TeacherAccountItem } from '../services/classroomService';

/**
 * Collapse multiple spaces and trim
 */
export const normalizeWhitespace = (str: string): string => {
  return (str || '').replace(/\s+/g, ' ').trim();
};

/**
 * Strip common Thai teacher/honorific prefixes
 */
export const stripHonorificPrefix = (str: string): string => {
  const normalized = normalizeWhitespace(str);
  return normalized.replace(/^(ครู|นาย|นางสาว|นาง|น\.ส\.|อาจารย์|อ\.|ผอ\.|ด\.ช\.|ด\.ญ\.)\s*/i, '').trim();
};

/**
 * Standard Levenshtein distance
 */
export const levenshteinDistance = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
};

/**
 * Similarity ratio between 0.0 and 1.0
 */
export const calculateNameSimilarity = (a: string, b: string): number => {
  const normA = normalizeWhitespace(a);
  const normB = normalizeWhitespace(b);

  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const strippedA = stripHonorificPrefix(normA);
  const strippedB = stripHonorificPrefix(normB);
  if (strippedA === strippedB && strippedA.length > 0) return 0.98;

  const maxLen = Math.max(normA.length, normB.length);
  const dist = levenshteinDistance(normA, normB);
  const rawRatio = 1.0 - dist / maxLen;

  // Also check stripped distance
  const strippedMax = Math.max(strippedA.length, strippedB.length);
  const strippedDist = levenshteinDistance(strippedA, strippedB);
  const strippedRatio = strippedMax > 0 ? 1.0 - strippedDist / strippedMax : 0;

  return Math.max(rawRatio, strippedRatio);
};

export interface TeacherMatchResult {
  queryName: string;
  matchedTeacher: TeacherAccountItem | null;
  similarity: number;
  matchType: 'EXACT' | 'FUZZY_SUGGESTED' | 'NOT_FOUND';
  confidenceLabel: string;
}

/**
 * Verify advisor name against database teacher accounts with fuzzy recommendation
 */
export const matchTeacherWithDatabase = (
  rawName: string,
  teachers: TeacherAccountItem[],
  similarityThreshold = 0.6
): TeacherMatchResult => {
  const cleanName = normalizeWhitespace(rawName);

  if (!cleanName || cleanName === '-' || cleanName === 'ยังไม่ได้กำหนด') {
    return {
      queryName: rawName,
      matchedTeacher: null,
      similarity: 0,
      matchType: 'NOT_FOUND',
      confidenceLabel: 'ยังไม่ได้ระบุ',
    };
  }

  // 1. Direct Exact Match (Normalized Whitespace)
  const exactMatch = teachers.find(
    (t) => normalizeWhitespace(t.name) === cleanName
  );
  if (exactMatch) {
    return {
      queryName: rawName,
      matchedTeacher: exactMatch,
      similarity: 1.0,
      matchType: 'EXACT',
      confidenceLabel: 'ตรงกับฐานข้อมูล 100%',
    };
  }

  // 2. Exact match after stripping honorific prefix (e.g. "ภาสภูมิ เรืองปราชญ์" vs "ครูภาสภูมิ เรืองปราชญ์")
  const strippedClean = stripHonorificPrefix(cleanName);
  const strippedMatch = teachers.find(
    (t) => stripHonorificPrefix(t.name) === strippedClean
  );
  if (strippedMatch) {
    return {
      queryName: rawName,
      matchedTeacher: strippedMatch,
      similarity: 0.98,
      matchType: 'EXACT',
      confidenceLabel: `ตรงกับฐานข้อมูล (${strippedMatch.name})`,
    };
  }

  // 3. Fuzzy search for closest teacher in database
  let bestTeacher: TeacherAccountItem | null = null;
  let bestScore = 0;

  for (const t of teachers) {
    const score = calculateNameSimilarity(cleanName, t.name);
    if (score > bestScore) {
      bestScore = score;
      bestTeacher = t;
    }
  }

  if (bestScore >= similarityThreshold && bestTeacher) {
    const pct = Math.round(bestScore * 100);
    return {
      queryName: rawName,
      matchedTeacher: bestTeacher,
      similarity: bestScore,
      matchType: 'FUZZY_SUGGESTED',
      confidenceLabel: `ชื่อใกล้เคียง: ${bestTeacher.name} (${pct}%)`,
    };
  }

  return {
    queryName: rawName,
    matchedTeacher: null,
    similarity: bestScore,
    matchType: 'NOT_FOUND',
    confidenceLabel: 'ไม่พบในฐานข้อมูล (จะใช้ชื่อตามที่ระบุ)',
  };
};
