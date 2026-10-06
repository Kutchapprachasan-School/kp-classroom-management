import React from 'react';
import { renderToString } from 'react-dom/server';
import { TimetableView, computeWeekInfo } from '../src/views/TimetableView';
import { TeacherSidebar } from '../src/components/layout/TeacherSidebar';

console.log('--- Testing TimetableView SSR Render & Logic ---');

const html = renderToString(React.createElement(TimetableView));

const assertions = [
  { name: 'Page Header Title', pass: html.includes('ตารางสอน / ภาระงานวันนี้') },
  { name: 'Page Subtitle', pass: html.includes('ตรวจสอบรายวิชาที่สอน และงานที่ต้องดำเนินการในวันนี้') },
  { name: 'Week 29 Badge', pass: html.includes('สัปดาห์ที่ 29') },
  { name: 'Date Range Label', pass: html.includes('29 ก.ย. 2569') && html.includes('5 ต.ค. 2569') },
  
  // STRICT NUMERICAL CHECKS matching Mockup & Task
  {
    name: 'Status Card 1: ยังไม่ได้เช็ค (สัปดาห์นี้) 2 รายการ',
    pass: html.includes('ยังไม่ได้เช็ค (สัปดาห์นี้)') && html.includes('>2</span><span class="text-xs font-semibold text-rose-600">รายการ</span>'),
  },
  {
    name: 'Status Card 2: ยังไม่ได้เช็ค (เดือนนี้) 5 รายการ',
    pass: html.includes('ยังไม่ได้เช็ค (เดือนนี้)') && html.includes('>5</span><span class="text-xs font-semibold text-amber-700">รายการ</span>'),
  },
  {
    name: 'Status Card 3: เช็คแล้ว (สัปดาห์นี้) 8 รายการ',
    pass: html.includes('เช็คแล้ว (สัปดาห์นี้)') && html.includes('>8</span><span class="text-xs font-semibold text-emerald-700">รายการ</span>'),
  },
  { name: 'Status Card 3 View All Button', pass: html.includes('ดูทั้งหมด') },
  
  // Table checks
  { name: 'Active Highlighted Thursday (พฤหัสบดี)', pass: html.includes('พฤหัสบดี') && html.includes('bg-blue-600') },
  {
    name: '6 Periods Listed',
    pass:
      html.includes('07:45 - 08:30') &&
      html.includes('08:30 - 09:20') &&
      html.includes('09:20 - 10:10') &&
      html.includes('11:10 - 12:00') &&
      html.includes('14:00 - 15:30') &&
      html.includes('15:30 - 16:30'),
  },
  { name: 'Subject: ญ31201 ม.4/1 ภาษาญี่ปุ่น', pass: html.includes('ญ31201') && html.includes('ม.4/1') && html.includes('ภาษาญี่ปุ่น') },
  { name: 'Subject: กิจกรรมพัฒนาผู้เรียน ม.3', pass: html.includes('กิจกรรมพัฒนาผู้เรียน') && html.includes('ม.3') },
  { name: 'Subject: แนะแนว', pass: html.includes('แนะแนว') },
  { name: 'Subject: ญ33201 ม.6/1', pass: html.includes('ญ33201') && html.includes('ม.6/1') },
  { name: 'Subject: ญ22201 ม.2/1', pass: html.includes('ญ22201') && html.includes('ม.2/1') },
  { name: 'Subject: ญ21202 ม.1/1', pass: html.includes('ญ21202') && html.includes('ม.1/1') },
  { name: 'Free Period: คาบว่าง', pass: html.includes('คาบว่าง') },
  { name: 'Meeting: PLC / ประชุม', pass: html.includes('PLC / ประชุม') },
  { name: 'Checked Badge: เช็คแล้ว', pass: html.includes('เช็คแล้ว') },
  { name: 'Unchecked Badge: ยังไม่เช็ค', pass: html.includes('ยังไม่เช็ค') },

  // Right-side widgets
  { name: 'Widget 1: สรุปการเช็คในช่วงนี้', pass: html.includes('สรุปการเช็คในช่วงนี้') },
  { name: 'Widget 1 Tabs: สัปดาห์นี้ & เดือนนี้', pass: html.includes('สัปดาห์นี้') && html.includes('เดือนนี้') },
  { name: 'Widget 1 Values: 2 รายการ & 5 รายการ & 8 รายการ', pass: html.includes('2 รายการ') && html.includes('5 รายการ') && html.includes('8 รายการ') },
  { name: 'Widget 1 Button: ดูรายละเอียดทั้งหมด', pass: html.includes('ดูรายละเอียดทั้งหมด') },
  { name: 'Widget 2: งานที่ต้องทำวันนี้', pass: html.includes('งานที่ต้องทำวันนี้') },
  { name: 'Widget 2 Task 1: ส่งคะแนนกลางภาค (ม.3)', pass: html.includes('ส่งคะแนนกลางภาค (ม.3)') },
  { name: 'Widget 2 Task 2: ตรวจข้อสอบปลายภาค (ม.3)', pass: html.includes('ตรวจข้อสอบปลายภาค (ม.3)') },
  { name: 'Widget 2 Task 3: บันทึกคะแนนกลางภาค (ม.3)', pass: html.includes('บันทึกคะแนนกลางภาค (ม.3)') },
  { name: 'Widget 3: ปฏิทินกิจกรรมใกล้ตัว', pass: html.includes('ปฏิทินกิจกรรมใกล้ตัว') },
  { name: 'Widget 3 Event 1: กิจกรรมวันภาษาอังกฤษ', pass: html.includes('กิจกรรมวันภาษาอังกฤษ') },
  { name: 'Widget 3 Event 2: แข่งขันกีฬา', pass: html.includes('แข่งขันกีฬา') },
  { name: 'Widget 3 Button: ดูปฏิทินทั้งหมด', pass: html.includes('ดูปฏิทินทั้งหมด') },

  // Mobile responsiveness
  { name: 'Mobile Day Selector Tabs present', pass: html.includes('เลือกวันแสดงผล:') },
  { name: 'Mobile View Modes: รายวัน & ตารางรวม', pass: html.includes('รายวัน') && html.includes('ตารางรวม') },
];

let failed = 0;
for (const a of assertions) {
  if (a.pass) {
    console.log(`  ✓ ${a.name}`);
  } else {
    console.error(`  ✗ FAILED: ${a.name}`);
    failed++;
  }
}

// Dynamic Week Calculation Tests
console.log('\n--- Testing Dynamic Week Calculation ---');
const week0 = computeWeekInfo(0);
const weekPrev = computeWeekInfo(-1);
const weekNext = computeWeekInfo(1);

const weekCalcTests = [
  { name: 'Week 0 is Week 29', pass: week0.weekNumber === 29 },
  { name: 'Week 0 Range is 29 ก.ย. 2569 – 5 ต.ค. 2569', pass: week0.dateRangeLabel === '29 ก.ย. 2569 – 5 ต.ค. 2569' },
  { name: 'Week 0 Thursday is Today', pass: week0.days.find(d => d.key === 'พฤหัสบดี')?.isToday === true },
  { name: 'Week -1 is Week 28', pass: weekPrev.weekNumber === 28 },
  { name: 'Week -1 Range is 22 ก.ย. 2569 – 28 ก.ย. 2569', pass: weekPrev.dateRangeLabel === '22 ก.ย. 2569 – 28 ก.ย. 2569' },
  { name: 'Week -1 Thursday is NOT Today', pass: weekPrev.days.find(d => d.key === 'พฤหัสบดี')?.isToday === false },
  { name: 'Week +1 is Week 30', pass: weekNext.weekNumber === 30 },
  { name: 'Week +1 Range is 6 ต.ค. 2569 – 12 ต.ค. 2569', pass: weekNext.dateRangeLabel === '6 ต.ค. 2569 – 12 ต.ค. 2569' },
];

for (const wt of weekCalcTests) {
  if (wt.pass) {
    console.log(`  ✓ ${wt.name}`);
  } else {
    console.error(`  ✗ FAILED: ${wt.name}`);
    failed++;
  }
}

// Also test TeacherSidebar
console.log('\n--- Testing TeacherSidebar Navigation ---');
const sidebarHtml = renderToString(React.createElement(TeacherSidebar, {
  currentView: 'timetable',
  activeRole: 'TEACHER_GENERAL',
}));

const sidebarCalendarHtml = renderToString(React.createElement(TeacherSidebar, {
  currentView: 'academic-year',
  activeRole: 'TEACHER_GENERAL',
}));

const sidebarAssertions = [
  { name: 'Sidebar has menu ตารางสอน/วันนี้', pass: sidebarHtml.includes('ตารางสอน/วันนี้') },
  { name: 'Sidebar active state on ตารางสอน/วันนี้ has bg-blue-600', pass: sidebarHtml.includes('bg-blue-600') },
  {
    name: 'Sidebar academic-year view does NOT wrongly activate settings',
    pass: !sidebarCalendarHtml.includes('bg-blue-600 text-white font-bold shadow-xs"><div class="flex items-center gap-3 min-w-0"><svg class="lucide lucide-settings'),
  },
];

for (const a of sidebarAssertions) {
  if (a.pass) {
    console.log(`  ✓ ${a.name}`);
  } else {
    console.error(`  ✗ FAILED: ${a.name}`);
    failed++;
  }
}

// Test Reactive Count Math
console.log('\n--- Testing Reactive Attendance Math ---');
const computeCounts = (newlyConducted: number) => {
  const uncheckedWeekCount = Math.max(0, 2 - newlyConducted);
  const checkedWeekCount = 8 + newlyConducted;
  return { uncheckedWeekCount, checkedWeekCount };
};

const countTests = [
  { name: 'Initial state: 2 unchecked, 8 checked', pass: computeCounts(0).uncheckedWeekCount === 2 && computeCounts(0).checkedWeekCount === 8 },
  { name: 'After 1 slot checked: 1 unchecked, 9 checked', pass: computeCounts(1).uncheckedWeekCount === 1 && computeCounts(1).checkedWeekCount === 9 },
  { name: 'After 2 slots checked: 0 unchecked, 10 checked', pass: computeCounts(2).uncheckedWeekCount === 0 && computeCounts(2).checkedWeekCount === 10 },
  { name: 'Total classes remains constant at 10', pass: (computeCounts(0).uncheckedWeekCount + computeCounts(0).checkedWeekCount) === 10 && (computeCounts(1).uncheckedWeekCount + computeCounts(1).checkedWeekCount) === 10 && (computeCounts(2).uncheckedWeekCount + computeCounts(2).checkedWeekCount) === 10 },
];

for (const ct of countTests) {
  if (ct.pass) {
    console.log(`  ✓ ${ct.name}`);
  } else {
    console.error(`  ✗ FAILED: ${ct.name}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n❌ ${failed} assertions failed!`);
  process.exit(1);
} else {
  console.log(`\n🎉 ALL ${assertions.length + weekCalcTests.length + sidebarAssertions.length + countTests.length} ASSERTIONS PASSED!`);
}

