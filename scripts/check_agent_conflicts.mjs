#!/usr/bin/env node
/**
 * Zero-Token Multi-Agent File Conflict Radar & PreToolUse Hook Guard
 * ------------------------------------------------------------------
 * Prevents two concurrent Antigravity conversations/subagents from editing
 * the same file simultaneously while consuming minimal tokens (~30 tokens in CLI,
 * 0 tokens in PreToolUse Hook mode).
 *
 * Usage:
 *   1. Check active agents & specific target files:
 *      node scripts/check_agent_conflicts.mjs [--self=<convId>] [file1 file2 ...]
 *
 *   2. Claim / release explicit file or glob locks:
 *      node scripts/check_agent_conflicts.mjs --lock <convId> src/views/Teacher*
 *      node scripts/check_agent_conflicts.mjs --unlock <convId>
 *
 *   3. Automatic PreToolUse Hook mode (reads JSON from stdin, outputs decision JSON):
 *      node scripts/check_agent_conflicts.mjs --hook
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const LOCK_FILE = path.join(WORKSPACE_ROOT, '.agent', 'active_locks.json');
const BRAIN_DIR = path.join(os.homedir(), '.gemini', 'antigravity', 'brain');

const LOCK_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL for locks
const HOOK_CONFLICT_WINDOW_MS = 4 * 60 * 1000; // 4 minutes live edit window for hard block
const DEFAULT_SCAN_WINDOW_MIN = 10; // 10 minutes default radar scan
const TAIL_BYTES = 256 * 1024; // Read last 256KB of transcript.jsonl for speed

function unescapeTranscriptString(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw.trim();
  while ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith('\\_"' ) && s.endsWith('"')) ) {
    s = s.slice(1, -1).trim();
  }
  s = s.replace(/^\\+"|\\+"$/g, '').replace(/^"+|"+$/g, '');
  s = s.replace(/\\\\/g, '\\');
  return s.trim();
}

function normalizeRelPath(filePath) {
  const cleaned = unescapeTranscriptString(filePath);
  if (!cleaned) return '';
  const lower = cleaned.replace(/\\/g, '/').toLowerCase();
  if (lower.includes('/.gemini/antigravity/brain/') || lower.includes('/scratch/')) {
    return '';
  }
  try {
    const abs = path.isAbsolute(cleaned)
      ? path.normalize(cleaned)
      : path.resolve(WORKSPACE_ROOT, cleaned);
    const rel = path.relative(WORKSPACE_ROOT, abs).replace(/\\/g, '/');
    // Ignore files outside this workspace
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
      return '';
    }
    return rel;
  } catch {
    return '';
  }
}

function matchesPattern(relFile, pattern) {
  const f = relFile.toLowerCase().replace(/\\/g, '/');
  const p = pattern.toLowerCase().replace(/\\/g, '/');
  if (!f || !p) return false;
  if (p === f) return true;
  if (p.endsWith('*')) {
    const prefix = p.slice(0, -1);
    return f.startsWith(prefix);
  }
  return path.basename(f) === path.basename(p) && !p.includes('/');
}

function loadLocks(now = Date.now()) {
  try {
    if (!fs.existsSync(LOCK_FILE)) return {};
    const raw = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
    const valid = {};
    for (const [convId, entry] of Object.entries(raw || {})) {
      if (entry && typeof entry.updatedAt === 'number' && now - entry.updatedAt < LOCK_TTL_MS) {
        valid[convId] = entry;
      }
    }
    return valid;
  } catch {
    return {};
  }
}

function saveLocks(locks) {
  try {
    const dir = path.dirname(LOCK_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCK_FILE, JSON.stringify(locks, null, 2), 'utf8');
  } catch {
    // Fail silently so hooks never crash
  }
}

/**
 * Reads the last ~128KB of a conversation's transcript.jsonl and extracts:
 * - whether the conversation belongs to this workspace
 * - whether the conversation is currently running a tool or waiting
 * - files edited via replace_file_content / write_to_file / multi_replace_file_content
 */
function inspectConversationTail(convId, transcriptPath, mtimeMs, now) {
  try {
    const stat = fs.statSync(transcriptPath);
    const size = stat.size;
    if (size === 0) return null;

    const readSize = Math.min(size, TAIL_BYTES);
    const fd = fs.openSync(transcriptPath, 'r');
    const buffer = Buffer.alloc(readSize);
    fs.readSync(fd, buffer, 0, readSize, size - readSize);
    fs.closeSync(fd);

    const text = buffer.toString('utf8');
    const lines = text.split('\n').filter((l) => l.trim().startsWith('{'));
    if (lines.length === 0) return null;

    const editedFilesMap = new Map(); // relPath -> lastEditedMs
    const viewedFilesSet = new Set();
    let lastStepHasToolCall = false;
    let lastStepSource = '';

    for (const line of lines) {
      let step;
      try {
        step = JSON.parse(line);
      } catch {
        continue;
      }
      const stepTime = step.created_at ? Date.parse(step.created_at) : mtimeMs;
      lastStepSource = step.source || '';
      lastStepHasToolCall = Array.isArray(step.tool_calls) && step.tool_calls.length > 0;

      if (Array.isArray(step.tool_calls)) {
        for (const tc of step.tool_calls) {
          const name = tc?.name || '';
          const rawTarget = tc?.args?.TargetFile || tc?.args?.AbsolutePath || tc?.args?.Cwd || '';
          const rel = normalizeRelPath(rawTarget);

          if (
            name === 'replace_file_content' ||
            name === 'write_to_file' ||
            name === 'multi_replace_file_content'
          ) {
            if (rel) {
              editedFilesMap.set(rel, stepTime || mtimeMs);
            } else if (typeof line === 'string' && line.includes('TargetFile')) {
              // Fallback regex if args was truncated in compact transcript.jsonl
              const m = line.match(/"TargetFile"\s*:\s*"\\?"([^"']+?)(?:\\?"|")/);
              if (m && m[1]) {
                const fallbackRel = normalizeRelPath(m[1]);
                if (fallbackRel) editedFilesMap.set(fallbackRel, stepTime || mtimeMs);
              }
            }
          } else if (rel) {
            viewedFilesSet.add(rel);
          }
        }
      }

      if (typeof step.content === 'string') {
        const m1 = step.content.match(
          /made by the (?:replace_file_content|write_to_file|multi_replace_file_content) tool to:\s*([^\r\n]+)/
        );
        if (m1 && m1[1]) {
          const rel = normalizeRelPath(m1[1].replace(/\. If relevant.*$/, '').trim());
          if (rel) editedFilesMap.set(rel, stepTime || mtimeMs);
        }
        const m2 = step.content.match(/Created file file:\/\/\/([^\s]+)\s+with requested content/);
        if (m2 && m2[1]) {
          try {
            const decoded = decodeURIComponent(m2[1]);
            const rel = normalizeRelPath(decoded);
            if (rel) editedFilesMap.set(rel, stepTime || mtimeMs);
          } catch {
            // ignore malformed URI
          }
        }
      }
    }

    // Ignore conversations that exclusively belong to a completely different workspace
    if (editedFilesMap.size === 0 && viewedFilesSet.size === 0) {
      return null;
    }

    const ageSec = Math.max(0, Math.round((now - mtimeMs) / 1000));
    const isRunning =
      ageSec < 45 || (ageSec < 180 && (lastStepHasToolCall || lastStepSource === 'USER_EXPLICIT'));

    return {
      convId,
      shortId: convId.slice(0, 8),
      mtimeMs,
      ageSec,
      isRunning,
      editedFiles: Array.from(editedFilesMap.entries()).map(([file, ts]) => ({
        file,
        ageSec: Math.max(0, Math.round((now - ts) / 1000)),
        ts,
      })),
    };
  } catch {
    return null;
  }
}

function scanActiveConversations(windowMs, excludeConvId = '') {
  const now = Date.now();
  if (!fs.existsSync(BRAIN_DIR)) return [];

  let entries = [];
  try {
    entries = fs.readdirSync(BRAIN_DIR, { withFileTypes: true });
  } catch {
    return [];
  }

  const results = [];
  for (const d of entries) {
    if (!d.isDirectory()) continue;
    const convId = d.name;
    if (excludeConvId && (convId === excludeConvId || convId.startsWith(excludeConvId))) {
      continue;
    }

    const transcriptPath = path.join(
      BRAIN_DIR,
      convId,
      '.system_generated',
      'logs',
      'transcript.jsonl'
    );
    if (!fs.existsSync(transcriptPath)) continue;

    let stat;
    try {
      stat = fs.statSync(transcriptPath);
    } catch {
      continue;
    }

    if (now - stat.mtimeMs > windowMs) continue;
    const info = inspectConversationTail(convId, transcriptPath, stat.mtimeMs, now);
    if (info) results.push(info);
  }

  return results.sort((a, b) => b.mtimeMs - a.mtimeMs);
}

async function runHookMode() {
  try {
    let rawInput = '';
    for await (const chunk of process.stdin) {
      rawInput += chunk;
    }
    if (!rawInput.trim()) {
      process.stdout.write(JSON.stringify({ decision: 'allow' }));
      return;
    }

    const payload = JSON.parse(rawInput);
    const convId = payload.conversationId || '';
    const toolName = payload.toolCall?.name || '';
    const args = payload.toolCall?.args || {};
    const rawTarget = args.TargetFile || args.AbsolutePath || '';

    if (
      !rawTarget ||
      (toolName !== 'replace_file_content' &&
        toolName !== 'write_to_file' &&
        toolName !== 'multi_replace_file_content')
    ) {
      process.stdout.write(JSON.stringify({ decision: 'allow' }));
      return;
    }

    const relTarget = normalizeRelPath(rawTarget);
    if (!relTarget) {
      process.stdout.write(JSON.stringify({ decision: 'allow' }));
      return;
    }

    const now = Date.now();
    const locks = loadLocks(now);

    // 1. Check explicit locks from other conversations
    for (const [otherId, lockEntry] of Object.entries(locks)) {
      if (convId && (otherId === convId || convId.startsWith(otherId) || otherId.startsWith(convId))) {
        continue;
      }
      const lockedFiles = Array.isArray(lockEntry.files) ? lockEntry.files : [];
      const lockAgeSec = Math.round((now - lockEntry.updatedAt) / 1000);
      if (lockAgeSec <= 240 && lockedFiles.some((pat) => matchesPattern(relTarget, pat))) {
        process.stdout.write(
          JSON.stringify({
            decision: 'deny',
            reason: `⛔ [Multi-Agent Conflict Guard] ไฟล์ "${relTarget}" ถูกล็อก/กำลังแก้ไขโดย Conversation ${otherId.slice(0, 8)} (เมื่อ ${lockAgeSec} วินาทีที่แล้ว) ระบบบล็อกการเขียนทับอัตโนมัติเพื่อป้องกันโค้ดพัง กรุณารอหรือแยกไฟล์ทำงาน`,
          })
        );
        return;
      }
    }

    // 2. Check live transcript tail of other active conversations (last 4 minutes)
    const activeConvs = scanActiveConversations(HOOK_CONFLICT_WINDOW_MS, convId);
    for (const other of activeConvs) {
      const hit = other.editedFiles.find(
        (ef) =>
          ef.file.toLowerCase() === relTarget.toLowerCase() &&
          (ef.ageSec <= 180 || (other.isRunning && ef.ageSec <= 240))
      );
      if (hit) {
        process.stdout.write(
          JSON.stringify({
            decision: 'deny',
            reason: `⛔ [Multi-Agent Conflict Guard] ไฟล์ "${relTarget}" เพิ่งถูกแก้ไขโดย Conversation ${other.shortId} เมื่อ ${hit.ageSec} วินาทีที่แล้ว (${other.isRunning ? 'กำลังทำงานอยู่' : 'เพิ่งแก้ไข'}) ระบบบล็อกการเขียนทับเพื่อป้องกันโค้ดชนกัน`,
          })
        );
        return;
      }
    }

    // 3. No conflict -> record/refresh our own lock on this file and allow!
    if (convId) {
      const existing = locks[convId] || { files: [], updatedAt: now };
      const fileSet = new Set(Array.isArray(existing.files) ? existing.files : []);
      fileSet.add(relTarget);
      locks[convId] = {
        updatedAt: now,
        files: Array.from(fileSet).slice(-25),
      };
      saveLocks(locks);
    }

    process.stdout.write(JSON.stringify({ decision: 'allow' }));
  } catch {
    // Always fail-open on unexpected hook parse errors so IDE never hangs
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
  }
}

function runCliMode(argv) {
  const now = Date.now();
  const locks = loadLocks(now);

  const lockIdx = argv.indexOf('--lock');
  if (lockIdx !== -1) {
    const convId = argv[lockIdx + 1];
    const files = argv
      .slice(lockIdx + 2)
      .map((f) => f.replace(/\\/g, '/').trim())
      .filter(Boolean);
    if (!convId || files.length === 0) {
      console.log('Usage: node scripts/check_agent_conflicts.mjs --lock <convId> <file1> [file2...]');
      process.exit(1);
    }
    const existing = locks[convId] || { files: [], updatedAt: now };
    const merged = Array.from(new Set([...(existing.files || []), ...files]));
    locks[convId] = { updatedAt: now, files: merged };
    saveLocks(locks);
    console.log(`🔒 Locked [${merged.join(', ')}] for ${convId.slice(0, 8)} (TTL 10m)`);
    return;
  }

  const unlockIdx = argv.indexOf('--unlock');
  if (unlockIdx !== -1) {
    const convId = argv[unlockIdx + 1];
    if (convId) {
      for (const k of Object.keys(locks)) {
        if (k === convId || k.startsWith(convId)) delete locks[k];
      }
      saveLocks(locks);
      console.log(`🔓 Unlocked all files for ${convId.slice(0, 8)}`);
    }
    return;
  }

  let selfId = '';
  let windowMin = DEFAULT_SCAN_WINDOW_MIN;
  const targetFiles = [];

  for (const arg of argv) {
    if (arg.startsWith('--self=')) {
      selfId = arg.slice('--self='.length).trim();
    } else if (arg.startsWith('--window=')) {
      windowMin = Math.max(1, parseInt(arg.slice('--window='.length), 10) || DEFAULT_SCAN_WINDOW_MIN);
    } else if (!arg.startsWith('--')) {
      const norm = normalizeRelPath(arg);
      if (norm) targetFiles.push(norm);
    }
  }

  const activeConvs = scanActiveConversations(windowMin * 60 * 1000, selfId);

  if (activeConvs.length === 0 && Object.keys(locks).length === 0) {
    console.log(`✅ CLEAR: No other active agents in this workspace (last ${windowMin}m).`);
    return;
  }

  for (const c of activeConvs) {
    const stateTag = c.isRunning ? '🟢 RUNNING' : '⚪ IDLE';
    const recentFiles = c.editedFiles
      .slice(-6)
      .map((f) => `${path.basename(f.file)}(${f.ageSec}s)`)
      .join(', ');
    console.log(
      `${stateTag} [${c.shortId} | ${c.ageSec}s ago] files: ${recentFiles || '(read-only / no code edits)'}`
    );
  }

  if (targetFiles.length > 0) {
    const conflicts = [];
    for (const tf of targetFiles) {
      for (const c of activeConvs) {
        const hit = c.editedFiles.find((ef) => matchesPattern(tf, ef.file));
        if (hit) {
          conflicts.push(`${tf} (edited by ${c.shortId} ${hit.ageSec}s ago)`);
        }
      }
      for (const [otherId, entry] of Object.entries(locks)) {
        if (selfId && (otherId === selfId || otherId.startsWith(selfId))) continue;
        if ((entry.files || []).some((pat) => matchesPattern(tf, pat))) {
          conflicts.push(`${tf} (locked by ${otherId.slice(0, 8)})`);
        }
      }
    }

    if (conflicts.length > 0) {
      console.log(`⛔ CONFLICT: ${conflicts.join(' | ')}`);
      process.exitCode = 1;
    } else {
      console.log(`✅ SAFE TO EDIT: ${targetFiles.map((f) => path.basename(f)).join(', ')}`);
    }
  }
}

const args = process.argv.slice(2);
if (args.includes('--hook')) {
  runHookMode();
} else {
  runCliMode(args);
}
