// test_teacher_mobile_screens_fidelity.mjs
// Automated verification for the 10-Screen Teacher Mobile Experience

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Starting 10-Screen Teacher Mobile Fidelity Verification...\n');

const mobileDir = path.resolve('src/components/mobile');

// 1. Verify existence of all 11 files
const expectedFiles = [
  'TeacherMobileBottomNav.tsx',
  'TeacherMobileHomeScreen.tsx',
  'TeacherMobileGradingListScreen.tsx',
  'TeacherMobileClassSubmissionsScreen.tsx',
  'TeacherMobileSubmissionDetailScreen.tsx',
  'TeacherMobileCreateAssignmentScreen.tsx',
  'TeacherMobileCalendarScreen.tsx',
  'TeacherMobileGradingSummaryScreen.tsx',
  'TeacherMobileRoomScoresScreen.tsx',
  'TeacherMobileSchoolInfoScreen.tsx',
  'TeacherMobileMoreMenuScreen.tsx',
  'index.ts',
];

for (const file of expectedFiles) {
  const filePath = path.join(mobileDir, file);
  assert(fs.existsSync(filePath), `❌ File missing: ${file}`);
  console.log(`✅ File exists: ${file}`);
}

// 2. Verify Screen 1 (HomeScreen)
const homeContent = fs.readFileSync(path.join(mobileDir, 'TeacherMobileHomeScreen.tsx'), 'utf-8');
assert(homeContent.includes('teacherName'), 'Screen 1 missing teacher name');
assert(homeContent.includes('งานที่ต้องดำเนินการด่วน'), 'Screen 1 missing urgent tasks header');
assert(homeContent.includes('ตรวจงานนักเรียน'), 'Screen 1 missing grading task');
console.log('✅ Screen 1 (Home Dashboard) passed checks');

// 3. Verify Screen 2 (GradingListScreen)
const gradingContent = fs.readFileSync(path.join(mobileDir, 'TeacherMobileGradingListScreen.tsx'), 'utf-8');
assert(gradingContent.includes('ตรวจงานนักเรียน'), 'Screen 2 missing title');
assert(gradingContent.includes('ยังไม่ตรวจ 8'), 'Screen 2 missing pending count');
assert(gradingContent.includes('ตรวจแล้ว 4'), 'Screen 2 missing graded count');
assert(gradingContent.includes('ญ31201') && gradingContent.includes('ภาษาญี่ปุ่น'), 'Screen 2 missing assignment card ญ31201');
console.log('✅ Screen 2 (Grading List) passed checks');

// 4. Verify Screen 3 (ClassSubmissionsScreen)
const classSubContent = fs.readFileSync(path.join(mobileDir, 'TeacherMobileClassSubmissionsScreen.tsx'), 'utf-8');
assert(classSubContent.includes('ม.3/1'), 'Screen 3 missing classroom title');
assert(classSubContent.includes('ตรวจงานทั้งหมด (8 รายการ)'), 'Screen 3 missing bottom batch button');
assert(classSubContent.includes('ด.ญ.กมลวรรณ แก้วใส'), 'Screen 3 missing student row');
console.log('✅ Screen 3 (Class Submissions) passed checks');

// 5. Verify Screen 4 (SubmissionDetailScreen)
const detailContent = fs.readFileSync(path.join(mobileDir, 'TeacherMobileSubmissionDetailScreen.tsx'), 'utf-8');
assert(detailContent.includes('ด.ญ.กมลวรรณ แก้วใส'), 'Screen 4 missing student profile');
assert(detailContent.includes('{currentScore}/{fullScore}') && detailContent.includes('คะแนน'), 'Screen 4 missing score display');
assert(detailContent.includes('ความคิดเห็น / ข้อเสนอแนะ'), 'Screen 4 missing feedback section');
assert(detailContent.includes('งานที่5_กมลวรรณ.pdf'), 'Screen 4 missing PDF file');
console.log('✅ Screen 4 (Submission Detail) passed checks');

// 6. Verify Screen 5 (CreateAssignmentScreen)
const createContent = fs.readFileSync(path.join(mobileDir, 'TeacherMobileCreateAssignmentScreen.tsx'), 'utf-8');
assert(createContent.includes('มอบหมายงานใหม่'), 'Screen 5 missing title');
assert(createContent.includes('ใบงาน'), 'Screen 5 missing segmented button ใบงาน');
assert(createContent.includes('การบ้าน'), 'Screen 5 missing segmented button การบ้าน');
assert(createContent.includes('แบบทดสอบ'), 'Screen 5 missing segmented button แบบทดสอบ');
assert(createContent.includes('มอบหมายงาน') && createContent.includes('Send'), 'Screen 5 missing submit button');
console.log('✅ Screen 5 (Create Assignment) passed checks');

// 7. Verify Screen 6 (CalendarScreen)
const calContent = fs.readFileSync(path.join(mobileDir, 'TeacherMobileCalendarScreen.tsx'), 'utf-8');
assert(calContent.includes('กันยายน 2569'), 'Screen 6 missing month selector');
assert(calContent.includes('24'), 'Screen 6 missing active day 24');
assert(calContent.includes('วันนี้ {selectedDay} ก.ย. 2569') && calContent.includes('ตรวจงาน ม.3/1'), 'Screen 6 missing today tasks section');
console.log('✅ Screen 6 (Calendar & Schedule) passed checks');

// 8. Verify Screen 7 (GradingSummaryScreen)
const summaryContent = fs.readFileSync(path.join(mobileDir, 'TeacherMobileGradingSummaryScreen.tsx'), 'utf-8');
assert(summaryContent.includes('สรุปการตรวจงาน'), 'Screen 7 missing title');
assert(summaryContent.includes('68%'), 'Screen 7 missing 68% stat');
assert(summaryContent.includes('ตรวจงานแล้ว') && summaryContent.includes('/ 40 รายการ'), 'Screen 7 missing completed counter');
assert(summaryContent.includes('รายวิชาที่ต้องตรวจมากที่สุด'), 'Screen 7 missing top subjects section');
console.log('✅ Screen 7 (Grading Analytics) passed checks');

// 9. Verify Screen 8 (RoomScoresScreen)
const roomScoresContent = fs.readFileSync(path.join(mobileDir, 'TeacherMobileRoomScoresScreen.tsx'), 'utf-8');
assert(roomScoresContent.includes('คะแนนรายห้องเรียน'), 'Screen 8 missing title');
assert(roomScoresContent.includes('82') && roomScoresContent.includes('76') && roomScoresContent.includes('90') && roomScoresContent.includes('{percentage}%'), 'Screen 8 missing percentage gauges');
assert(roomScoresContent.includes('16.4') && roomScoresContent.includes('เฉลี่ย') && roomScoresContent.includes('maxScore'), 'Screen 8 missing average score');
assert(roomScoresContent.includes('passCount: 18') && roomScoresContent.includes('failCount: 2') && roomScoresContent.includes('ผ่าน {item.passCount} คน | ไม่ผ่าน {item.failCount} คน'), 'Screen 8 missing pass/fail counts');
console.log('✅ Screen 8 (Classroom Scores) passed checks');

// 10. Verify Screen 9 (SchoolInfoScreen)
const schoolInfoContent = fs.readFileSync(path.join(mobileDir, 'TeacherMobileSchoolInfoScreen.tsx'), 'utf-8');
assert(schoolInfoContent.includes('ข้อมูลโรงเรียน'), 'Screen 9 missing title');
assert(schoolInfoContent.includes('โรงเรียนคำยางพิทยา'), 'Screen 9 missing school name');
assert(schoolInfoContent.includes('ต.ผาสุก อ.วังสามหมอ จ.อุดรธานี'), 'Screen 9 missing location');
assert(schoolInfoContent.includes('แก้ไขข้อมูลโรงเรียน'), 'Screen 9 missing edit button');
console.log('✅ Screen 9 (School Info) passed checks');

// 11. Verify Screen 10 (MoreMenuScreen)
const moreMenuContent = fs.readFileSync(path.join(mobileDir, 'TeacherMobileMoreMenuScreen.tsx'), 'utf-8');
assert(moreMenuContent.includes('teacherName'), 'Screen 10 missing teacher name');
assert(moreMenuContent.includes('ตรวจงาน / สอน'), 'Screen 10 missing grading item');
assert(moreMenuContent.includes('ออกจากระบบ'), 'Screen 10 missing logout button');
console.log('✅ Screen 10 (More Menu) passed checks');

// 12. Verify TeacherMobileBottomNav.tsx
const bottomNavContent = fs.readFileSync(path.join(mobileDir, 'TeacherMobileBottomNav.tsx'), 'utf-8');
assert(bottomNavContent.includes('หน้าหลัก'), 'BottomNav missing หน้าหลัก');
assert(bottomNavContent.includes('งาน'), 'BottomNav missing งาน');
assert(bottomNavContent.includes('ข้อความ'), 'BottomNav missing ข้อความ');
assert(bottomNavContent.includes('เพิ่มเติม'), 'BottomNav missing เพิ่มเติม');
assert(bottomNavContent.includes('mobile-create-assignment'), 'BottomNav missing center action button');
console.log('✅ TeacherMobileBottomNav passed checks');

// 13. Verify App.tsx routing
const appContent = fs.readFileSync(path.resolve('src/App.tsx'), 'utf-8');
assert(appContent.includes('TeacherMobileHomeScreen'), 'App.tsx missing TeacherMobileHomeScreen');
assert(appContent.includes('TeacherMobileGradingListScreen'), 'App.tsx missing TeacherMobileGradingListScreen');
assert(appContent.includes('TeacherMobileClassSubmissionsScreen'), 'App.tsx missing TeacherMobileClassSubmissionsScreen');
assert(appContent.includes('TeacherMobileSubmissionDetailScreen'), 'App.tsx missing TeacherMobileSubmissionDetailScreen');
assert(appContent.includes('TeacherMobileCreateAssignmentScreen'), 'App.tsx missing TeacherMobileCreateAssignmentScreen');
assert(appContent.includes('TeacherMobileCalendarScreen'), 'App.tsx missing TeacherMobileCalendarScreen');
assert(appContent.includes('TeacherMobileGradingSummaryScreen'), 'App.tsx missing TeacherMobileGradingSummaryScreen');
assert(appContent.includes('TeacherMobileRoomScoresScreen'), 'App.tsx missing TeacherMobileRoomScoresScreen');
assert(appContent.includes('TeacherMobileSchoolInfoScreen'), 'App.tsx missing TeacherMobileSchoolInfoScreen');
assert(appContent.includes('TeacherMobileMoreMenuScreen'), 'App.tsx missing TeacherMobileMoreMenuScreen');
assert(appContent.includes('TeacherMobileBottomNav'), 'App.tsx missing TeacherMobileBottomNav');
console.log('✅ App.tsx routing & integration passed checks');

console.log('\n🎉 ALL 10 TEACHER MOBILE SCREENS VERIFIED SUCCESSFULLY WITH 100% FIDELITY! 🎉');
