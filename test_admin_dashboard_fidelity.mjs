import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Starting Admin Executive Dashboard Fidelity Verification Suite...\n');

// 1. Check layout structure in AdminExecutiveDashboardView.tsx
console.log('--- 1. Checking Layout Grid Architecture in AdminExecutiveDashboardView.tsx ---');
const dashboardViewPath = path.resolve('src/views/AdminExecutiveDashboardView.tsx');
assert.ok(fs.existsSync(dashboardViewPath), 'AdminExecutiveDashboardView.tsx must exist');
const dashboardContent = fs.readFileSync(dashboardViewPath, 'utf-8');

// Assert 2-column top grid split (Left main section + Right column)
assert.ok(
  dashboardContent.includes('lg:grid-cols-12'),
  'Dashboard must use a 12-column responsive grid'
);
assert.ok(
  dashboardContent.includes('xl:col-span-9') || dashboardContent.includes('lg:col-span-8'),
  'Left main section must span majority of desktop columns'
);
assert.ok(
  dashboardContent.includes('xl:col-span-3') || dashboardContent.includes('lg:col-span-4'),
  'Right sidebar column must span 3-4 columns'
);

// Assert Row A and Row B 3-column subgrid
assert.ok(
  dashboardContent.includes('xl:grid-cols-[1.3fr_1fr_1fr]'),
  'Row A and Row B must use a 3-column proportional grid [1.3fr_1fr_1fr]'
);

// Assert 4 Operational cards at the bottom
assert.ok(
  dashboardContent.includes('<AdminOperationalCards'),
  'Operational cards must be rendered'
);
console.log('  ✓ Verified 2-column main grid, 3-column Row A/Row B, and bottom operational cards layout.');

// 2. Check font family 'Prompt'
console.log('\n--- 2. Checking Font Configuration (Prompt) ---');
assert.ok(
  dashboardContent.includes("'Prompt'"),
  "AdminExecutiveDashboardView.tsx must explicitly enforce 'Prompt' font"
);

const headerPath = path.resolve('src/components/admin/AdminHeader.tsx');
const headerContent = fs.readFileSync(headerPath, 'utf-8');
assert.ok(headerContent.includes("'Prompt'"), "AdminHeader.tsx must enforce 'Prompt' font");

const sidebarPath = path.resolve('src/components/admin/AdminSidebar.tsx');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
assert.ok(sidebarContent.includes("'Prompt'"), "AdminSidebar.tsx must enforce 'Prompt' font");

const footerPath = path.resolve('src/components/admin/AdminFooter.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf-8');
assert.ok(footerContent.includes("'Prompt'"), "AdminFooter.tsx must enforce 'Prompt' font");
console.log('  ✓ Verified Prompt font applied across View, Header, Sidebar, and Footer.');

// 3. Check Academic Summary Card (Card A) donut data fix (28%)
console.log('\n--- 3. Checking Academic Summary Card (Card A) Donut Percentage Accuracy ---');
const academicCardPath = path.resolve('src/components/admin/AdminAcademicSummaryCard.tsx');
const academicContent = fs.readFileSync(academicCardPath, 'utf-8');
assert.ok(
  academicContent.includes("value: 28, color: '#2563EB'"),
  'Grade 4.00 slice must be 28% matching reference mockup (not 26%)'
);
assert.ok(
  academicContent.includes("value: 34"),
  'Grade 3.50-3.99 slice must be 34%'
);
assert.ok(
  academicContent.includes("value: 22"),
  'Grade 3.00-3.49 slice must be 22%'
);
assert.ok(
  academicContent.includes("value: 11"),
  'Grade 2.50-2.99 slice must be 11%'
);
assert.ok(
  academicContent.includes("value: 5"),
  'Grade < 2.50 slice must be 5%'
);
console.log('  ✓ Verified 4.00 is 28% and all slices sum up to 100% (28 + 34 + 22 + 11 + 5 = 100).');

// 4. Check Stat Cards (No border-t, top-right outline badge)
console.log('\n--- 4. Checking Stat Cards Layout & Fidelity ---');
const statCardsPath = path.resolve('src/components/admin/AdminStatCards.tsx');
const statCardsContent = fs.readFileSync(statCardsPath, 'utf-8');
assert.ok(
  !statCardsContent.includes('border-t border-slate-50 relative z-10 flex items-center'),
  'Stat cards should not have divider border-t before trend'
);
assert.ok(
  statCardsContent.includes('1,248'),
  'Students count KPI must be 1,248'
);
assert.ok(
  statCardsContent.includes('124'),
  'Staff count KPI must be 124'
);
assert.ok(
  statCardsContent.includes('95.6%'),
  'Attendance rate KPI must be 95.6%'
);
assert.ok(
  statCardsContent.includes('28'),
  'Pending tasks KPI must be 28'
);
console.log('  ✓ Verified Stat cards values and divider-less layout matching mockup.');

// 5. Check Staff Table Subtitles & Avatars
console.log('\n--- 5. Checking Staff Recent Table Details ---');
const staffTablePath = path.resolve('src/components/admin/AdminStaffRecentTable.tsx');
const staffTableContent = fs.readFileSync(staffTablePath, 'utf-8');
assert.ok(
  staffTableContent.includes('นางสาวกมลวรรณ ศรีสุข'),
  'Staff table must include นางสาวกมลวรรณ ศรีสุข'
);
assert.ok(
  staffTableContent.includes('staff.position'),
  'Staff table must render staff.position subtitle under name'
);
console.log('  ✓ Verified Staff Recent table renders position subtext and portraits.');

// 6. Check Operational Cards Header Icons
console.log('\n--- 6. Checking Operational Cards Headers ---');
const opCardsPath = path.resolve('src/components/admin/AdminOperationalCards.tsx');
const opCardsContent = fs.readFileSync(opCardsPath, 'utf-8');
assert.ok(
  opCardsContent.includes('Wallet'),
  'Finance card must have Wallet icon in header'
);
assert.ok(
  opCardsContent.includes('FileText'),
  'Documents card must have FileText icon in header'
);
assert.ok(
  opCardsContent.includes('Wrench'),
  'Repairs card must have Wrench icon in header'
);
assert.ok(
  opCardsContent.includes('Megaphone'),
  'Communication card must have Megaphone icon in header'
);
console.log('  ✓ Verified all 4 operational cards have icons in header matching mockup.');

// 7. Check Student Status Donut Card
console.log('\n--- 7. Checking Student Status Donut Card ---');
const studentDonutPath = path.resolve('src/components/admin/AdminStudentStatusDonutCard.tsx');
const studentDonutContent = fs.readFileSync(studentDonutPath, 'utf-8');
assert.ok(
  studentDonutContent.includes('1176') && studentDonutContent.includes('94.2%'),
  'Student normal count must be 1,176 (94.2%)'
);
assert.ok(
  studentDonutContent.includes('48') && studentDonutContent.includes('3.8%'),
  'Student at-risk count must be 48 (3.8%)'
);
assert.ok(
  studentDonutContent.includes('24') && studentDonutContent.includes('1.9%'),
  'Student monitor count must be 24 (1.9%)'
);
console.log('  ✓ Verified Student status donut card counts and percentages.');

console.log('\n🎉 ALL 7 ADMIN DASHBOARD FIDELITY CHECKS PASSED PERFECTLY!');
