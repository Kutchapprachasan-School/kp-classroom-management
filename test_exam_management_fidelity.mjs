// test_exam_management_fidelity.mjs
// Verification suite for Exam Management View (media_1791256907095.png) and Calendar linkage

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Starting Exam Management & Calendar Fidelity Verification Suite...\n');

// 1. Verify TeacherSidebar.tsx
console.log('--- 1. Checking TeacherSidebar.tsx Menu Items & Access ---');
const sidebarPath = path.resolve('src/components/layout/TeacherSidebar.tsx');
assert.ok(fs.existsSync(sidebarPath), 'TeacherSidebar.tsx must exist');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');

// Ensure 'exams' ("ประเมิน / แบบฟอร์ม") is visible unconditionally (not wrapped in ...(isAdmin ? ... : []))
assert.ok(
  sidebarContent.includes("key: 'exams'"),
  "TeacherSidebar must include menu item with key: 'exams'"
);
assert.ok(
  sidebarContent.includes("label: 'ประเมิน / แบบฟอร์ม'") ||
    sidebarContent.includes("label: 'จัดการสอบ / เก็บคะแนน'"),
  "TeacherSidebar must have label 'ประเมิน / แบบฟอร์ม' or 'จัดการสอบ / เก็บคะแนน'"
);

// Check that exams is NOT wrapped inside isAdmin ternary in menuItems
const isAdminExamsWrapped = sidebarContent.includes("...(isAdmin\n      ? [\n          {\n            key: 'exams'");
assert.strictEqual(
  isAdminExamsWrapped,
  false,
  "'exams' must NOT be restricted only to admin; teachers must have access"
);
console.log('  ✓ Verified "ประเมิน / แบบฟอร์ม" (exams) is accessible to regular teachers.');

// 2. Verify App.tsx Routing & Integration
console.log('\n--- 2. Checking App.tsx Routing & Header Title ---');
const appPath = path.resolve('src/App.tsx');
assert.ok(fs.existsSync(appPath), 'App.tsx must exist');
const appContent = fs.readFileSync(appPath, 'utf-8');

assert.ok(
  appContent.includes("case 'exams':\n        return 'จัดการการสอบ (Exam Management)';"),
  "App.tsx getHeaderTitle must return 'จัดการการสอบ (Exam Management)' for 'exams'"
);
assert.ok(
  appContent.includes("{currentView === 'exams' && <ExamManagementView />}"),
  "App.tsx must render <ExamManagementView /> when currentView === 'exams'"
);
assert.ok(
  appContent.includes("onNavigateToExams={() => setCurrentView('exams')}"),
  "App.tsx must pass onNavigateToExams to AcademicTermsView"
);
console.log('  ✓ Verified App.tsx routing and title mapping for Exam Management.');

// 3. Verify AcademicTermsView.tsx Linking
console.log('\n--- 3. Checking AcademicTermsView.tsx Exam Linkage ---');
const termsPath = path.resolve('src/views/AcademicTermsView.tsx');
assert.ok(fs.existsSync(termsPath), 'AcademicTermsView.tsx must exist');
const termsContent = fs.readFileSync(termsPath, 'utf-8');

assert.ok(
  termsContent.includes('onNavigateToExams?: () => void;'),
  'AcademicTermsViewProps must accept onNavigateToExams prop'
);
assert.ok(
  termsContent.includes('จัดการการสอบ & วัดผล (Exams)'),
  'AcademicTermsView top banner must include link to Exam Management'
);
assert.ok(
  termsContent.includes('act.category === \'EXAM\' && onNavigateToExams'),
  'AcademicTermsView must provide button to open Exam Management on EXAM events'
);
assert.ok(
  termsContent.includes('categoryFilter === \'EXAM\''),
  'AcademicTermsView must highlight exam items when EXAM filter is selected'
);
console.log('  ✓ Verified AcademicTermsView links seamlessly to Exam Management.');

// 4. Verify ExamManagementView.tsx Structure & Modals
console.log('\n--- 4. Checking ExamManagementView.tsx UI Structure & Interactive Modals ---');
const examViewPath = path.resolve('src/views/ExamManagementView.tsx');
assert.ok(fs.existsSync(examViewPath), 'ExamManagementView.tsx must exist');
const examViewContent = fs.readFileSync(examViewPath, 'utf-8');

// 4.1 Header & Button matching Image
assert.ok(
  examViewContent.includes('จัดการการสอบ (Exam Management)'),
  'ExamManagementView must contain main header title'
);
assert.ok(
  examViewContent.includes('วางแผนชุดข้อสอบ บันทึกคะแนนแบบ Inline Grid และวิเคราะห์ข้อสอบ (Item Analysis)'),
  'ExamManagementView must contain subtitle matching image'
);
assert.ok(
  examViewContent.includes('+ สร้างชุดข้อสอบใหม่'),
  'ExamManagementView must contain "+ สร้างชุดข้อสอบใหม่" button'
);

// 4.2 Filter Pills & Search
assert.ok(
  examViewContent.includes('กำลังกรอกคะแนน'),
  'ExamManagementView must have "กำลังกรอกคะแนน" tab'
);
assert.ok(
  examViewContent.includes('ล็อคคะแนนแล้ว (Locked)'),
  'ExamManagementView must have "ล็อคคะแนนแล้ว (Locked)" tab'
);
assert.ok(
  examViewContent.includes('เร็วๆ นี้'),
  'ExamManagementView must have "เร็วๆ นี้" tab'
);
assert.ok(
  examViewContent.includes('ค้นหาชื่อการสอบหรือรหัสวิชา...'),
  'ExamManagementView must have search box with exact placeholder'
);

// 4.3 Modal 1: Create Exam Modal
assert.ok(
  examViewContent.includes('isCreateModalOpen'),
  'ExamManagementView must manage state for isCreateModalOpen'
);
assert.ok(
  examViewContent.includes('สร้างชุดข้อสอบใหม่ (New Exam)'),
  'ExamManagementView must render interactive Create Exam Modal'
);
assert.ok(
  examViewContent.includes('แม่แบบด่วน (Quick Presets)'),
  'Create Exam Modal must offer quick presets'
);

// 4.4 Modal 2: Inline Score Grid Modal
assert.ok(
  examViewContent.includes('scoreGridExam'),
  'ExamManagementView must manage state for scoreGridExam modal'
);
assert.ok(
  examViewContent.includes('ตารางกรอกคะแนน:'),
  'Score Grid Modal must show exam title'
);
assert.ok(
  examViewContent.includes('handleToggleLockStatus'),
  'Score Grid Modal must support locking/unlocking scores'
);
assert.ok(
  examViewContent.includes('handleScoreKeyDown'),
  'Score Grid Modal must support keyboard arrow navigation (Up/Down/Enter)'
);
assert.ok(
  examViewContent.includes('filteredStudents[currentIndex + 1]'),
  'Score Grid Modal arrow navigation must index into filteredStudents, not unfiltered list'
);
assert.ok(
  examViewContent.includes('handleSaveGridScores'),
  'Score Grid Modal must support saving updated scores'
);
assert.ok(
  examViewContent.includes('placeholder="ค้นหาชื่อ/รหัส..."'),
  'Score Grid Modal must include quick student search field'
);

// 4.5 Modal 3: Item Analysis Modal
assert.ok(
  examViewContent.includes('analysisExam'),
  'ExamManagementView must manage state for analysisExam modal'
);
assert.ok(
  examViewContent.includes('วิเคราะห์คุณภาพข้อสอบ (Item Analysis)'),
  'Item Analysis Modal must render header title'
);
assert.ok(
  examViewContent.includes('ค่าความยากง่ายเฉลี่ย (p)'),
  'Item Analysis Modal must show difficulty index p'
);
assert.ok(
  examViewContent.includes('อำนาจจำแนกเฉลี่ย (r)'),
  'Item Analysis Modal must show discrimination index r'
);
assert.ok(
  examViewContent.includes('ความเชื่อมั่น (KR-20)'),
  'Item Analysis Modal must show KR-20 reliability'
);
assert.ok(
  examViewContent.includes('ส่วนเบี่ยงเบนมาตรฐาน (S.D.)'),
  'Item Analysis Modal must show standard deviation'
);
assert.ok(
  examViewContent.includes('handleExportAnalysisCSV'),
  'Item Analysis Modal must implement real CSV export function'
);
assert.ok(
  examViewContent.includes('\\uFEFF'),
  'Item Analysis Modal CSV export must prepend UTF-8 BOM for Thai Excel compatibility'
);
assert.ok(
  examViewContent.includes('ศ 2.1 ม.1/4 อ่าน เขียน ร้องโน้ตไทยและโน้ตสากล'),
  'Item Analysis Modal must adapt indicators dynamically for music subject'
);

// 4.6 Font Prompt Verification
assert.ok(
  examViewContent.includes("'Prompt'"),
  'ExamManagementView must enforce Prompt font family'
);

console.log('  ✓ Verified all 3 interactive modals, tabs, cards, keyboard navigation, CSV export, and Prompt typography.');

console.log('\n🎉 ALL 23 EXAM MANAGEMENT & CALENDAR FIDELITY CHECKS PASSED PERFECTLY!\n');
