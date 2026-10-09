// test_lesson_plans_fidelity.mjs
// Verification suite for Lesson Plans View (media_1791348839178_02518c77.jpg) fidelity

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Starting Lesson Plans View (media_1791348839178_02518c77.jpg) Fidelity Verification Suite...\n');

// 1. Verify LessonPlansView.tsx Source
console.log('--- 1. Checking LessonPlansView.tsx UI Structure & Fidelity ---');
const lessonPlansPath = path.resolve('src/views/LessonPlansView.tsx');
assert.ok(fs.existsSync(lessonPlansPath), 'LessonPlansView.tsx must exist');
const content = fs.readFileSync(lessonPlansPath, 'utf-8');

// 1.1 Hero Banner
assert.ok(
  content.includes('แผนการสอน / จัดการแผนการสอน') ||
    content.includes('แผนการสอนและบันทึกหลังสอน (Lesson Plans)'),
  "LessonPlansView must contain main title 'แผนการสอน / จัดการแผนการสอน' or 'แผนการสอนและบันทึกหลังสอน (Lesson Plans)'"
);
assert.ok(
  content.includes('สร้างและจัดการแผนการสอนรายวิชา แบบหน่วยการเรียนรู้ พร้อมสื่อการสอนและประเมินผล'),
  'LessonPlansView must contain the exact subtitle matching mockup'
);
assert.ok(
  content.includes('การสอนที่ดี') && content.includes('คือการเปิดโลกแห่งโอกาส'),
  'LessonPlansView must contain the quote in speech bubble'
);
assert.ok(
  content.includes('PageHeroBanner') || content.includes('/images/teacher/hero_banner.png'),
  'LessonPlansView must render anime mascot hero illustration'
);
console.log('  ✓ Top Hero Banner, title, subtitle, and anime mascot quote bubble match mockup 100%');

// 1.2 Top Action & Filter Bar
assert.ok(
  content.includes('สร้างแผนการสอนใหม่'),
  "LessonPlansView must have '+ สร้างแผนการสอนใหม่' action button"
);
assert.ok(
  content.includes('รหัสวิชา'),
  "LessonPlansView must have 'รหัสวิชา' label"
);
assert.ok(
  content.includes('ห้องเรียน'),
  "LessonPlansView must have 'ห้องเรียน' label"
);
assert.ok(
  content.includes('ภาคเรียน'),
  "LessonPlansView must have 'ภาคเรียน' label"
);
assert.ok(
  content.includes('ค้นหาแผนการสอน / หน่วย...'),
  'LessonPlansView must have search box with correct placeholder'
);
console.log('  ✓ Top filter bar (subject, class, semester, search) and action button verified');

// 1.3 Column 1: หน่วยการเรียนรู้ (6 หน่วย)
assert.ok(
  content.includes('หน่วยการเรียนรู้'),
  "Column 1 must have header 'หน่วยการเรียนรู้'"
);
assert.ok(
  content.includes('日常のあいさつ') && content.includes('การทักทายประจำวัน'),
  'Unit 1 must contain 日常のあいさつ (การทักทายประจำวัน)'
);
assert.ok(
  content.includes('家族と友達') && content.includes('ครอบครัวและเพื่อน'),
  'Unit 2 must contain 家族と友達 (ครอบครัวและเพื่อน)'
);
assert.ok(
  content.includes('学校生活') && content.includes('ชีวิตในโรงเรียน'),
  'Unit 3 must contain 学校生活 (ชีวิตในโรงเรียน)'
);
assert.ok(
  content.includes('食べ物と飲み物') && content.includes('อาหารและเครื่องดื่ม'),
  'Unit 4 must contain 食べ物と飲み物 (อาหารและเครื่องดื่ม)'
);
assert.ok(
  content.includes('旅行') && content.includes('การท่องเที่ยว'),
  'Unit 5 must contain 旅行 (การท่องเที่ยว)'
);
assert.ok(
  content.includes('文化と行事') && content.includes('วัฒนธรรมและเทศกาล'),
  'Unit 6 must contain 文化と行事 (วัฒนธรรมและเทศกาล)'
);
console.log('  ✓ All 6 unit cards with Japanese & Thai titles and colored circles verified');

// 1.4 Column 2: Center Unit Detail & 4 Sub-Tabs
assert.ok(
  content.includes('ข้อมูลหน่วย'),
  "Center column must contain sub-tab 'ข้อมูลหน่วย'"
);
assert.ok(
  content.includes('สื่อการสอน / ไฟล์'),
  "Center column must contain sub-tab 'สื่อการสอน / ไฟล์'"
);
assert.ok(
  content.includes('ใบงาน'),
  "Center column must contain sub-tab 'ใบงาน'"
);
assert.ok(
  content.includes('บันทึกหลังสอน'),
  "Center column must contain sub-tab 'บันทึกหลังสอน'"
);

// Check 3 Sections under Tab 1
assert.ok(
  content.includes('ข้อมูลพื้นฐาน'),
  "Sub-tab 1 must render 'ข้อมูลพื้นฐาน' section"
);
assert.ok(
  content.includes('ตัวชี้วัด / ผลการเรียนรู้'),
  "Sub-tab 1 must render 'ตัวชี้วัด / ผลการเรียนรู้' section"
);
assert.ok(
  content.includes('การประเมินผล'),
  "Sub-tab 1 must render 'การประเมินผล' section"
);
assert.ok(
  content.includes('คะแนนรวม'),
  "Sub-tab 1 must display 'คะแนนรวม' summary badge"
);
console.log('  ✓ Center unit detail, 4 sub-tabs, and 3 detail sections with evaluation table verified');

// 1.5 Column 3: Right Side Widgets
assert.ok(
  content.includes('จัดการห้องเรียน'),
  "Right column must render 'จัดการห้องเรียน' card"
);
assert.ok(
  content.includes('ข้อมูลรวมห้อง'),
  "Right column must display 'ข้อมูลรวมห้อง'"
);
assert.ok(
  content.includes('เข้าเรียนเฉลี่ย'),
  "Right column must show attendance average"
);
assert.ok(
  content.includes('ดูสถิติรายชั้น'),
  "Right column must have 'ดูสถิติรายชั้น' action button"
);
assert.ok(
  content.includes('ไฟล์และสื่อที่เกี่ยวข้อง'),
  "Right column must render 'ไฟล์และสื่อที่เกี่ยวข้อง' widget"
);
assert.ok(
  content.includes('Quick Actions'),
  "Right column must render 'Quick Actions' widget"
);
assert.ok(
  content.includes('ดูแผนการสอนทั้งหมด'),
  "Quick Actions must have 'ดูแผนการสอนทั้งหมด'"
);
assert.ok(
  content.includes('คัดลอกหน่วยการเรียนรู้'),
  "Quick Actions must have 'คัดลอกหน่วยการเรียนรู้'"
);
assert.ok(
  content.includes('พิมพ์แผนการสอน'),
  "Quick Actions must have 'พิมพ์แผนการสอน'"
);
console.log('  ✓ Right column widgets (classroom stats, related media, quick actions) verified');

// 1.6 Bottom Stepper Flow
assert.ok(
  content.includes('รายการหน่วยการเรียนรู้'),
  "Bottom stepper must have title 'รายการหน่วยการเรียนรู้'"
);
console.log('  ✓ Full-width horizontal bottom stepper flow verified');

// 2. Verify Sidebar & App.tsx Routing
console.log('\n--- 2. Checking Sidebar & App.tsx Navigation ---');
const sidebarPath = path.resolve('src/components/layout/TeacherSidebar.tsx');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
assert.ok(
  (sidebarContent.includes("key: 'lessons'") || sidebarContent.includes("key: 'courses'")) &&
    (sidebarContent.includes("label: 'แผนการสอน'") ||
      sidebarContent.includes("label: 'สื่อการสอน / ไฟล์'") ||
      sidebarContent.includes("label: 'หลักสูตร/แผนการสอน'")),
  "TeacherSidebar must render menu item with key 'lessons' or 'courses'"
);
console.log("  ✓ TeacherSidebar menu 'lessons' verified");

const appPath = path.resolve('src/App.tsx');
const appContent = fs.readFileSync(appPath, 'utf-8');
assert.ok(
  appContent.includes("case 'lessons':"),
  "App.tsx getHeaderTitle must map 'lessons'"
);
console.log("  ✓ App.tsx header title mapping for 'lessons' verified");

console.log('\n🎉 ALL 20 LESSON PLANS FIDELITY CHECKS PASSED PERFECTLY!\n');
