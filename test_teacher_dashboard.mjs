// test_teacher_dashboard.mjs
// Test suite for Teacher Dashboard, 3-Part Banners, RBAC access control, Prompt font, and assets

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Starting Teacher Dashboard & Banner Service Verification Suite...\n');

// 1. Verify Assets
console.log('--- 1. Checking Asset Files ---');
const requiredAssets = [
  'public/images/teacher/hero_banner.png',
  'public/images/teacher/sidebar_banner.png',
  'public/images/teacher/bottom_banner.png',
  'public/images/teacher/teacher_avatar.png',
  'public/images/teacher/school_logo.png',
];

for (const asset of requiredAssets) {
  const exists = fs.existsSync(asset);
  assert.ok(exists, `Required asset missing: ${asset}`);
  const stats = fs.statSync(asset);
  assert.ok(stats.size > 0, `Asset is empty: ${asset}`);
  console.log(`  ✓ Asset verified: ${asset} (${stats.size} bytes)`);
}

// 2. Verify Font Setup
console.log('\n--- 2. Checking Font Configuration (Prompt) ---');
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert.ok(indexHtml.includes('family=Prompt'), 'index.html must load Google Font Prompt');
console.log('  ✓ index.html links Google Font Prompt');

const tailwindConfig = fs.readFileSync('tailwind.config.js', 'utf8');
assert.ok(tailwindConfig.includes("'Prompt'"), "tailwind.config.js must include 'Prompt' in fontFamily.sans");
console.log('  ✓ tailwind.config.js configures Prompt font');

const indexCss = fs.readFileSync('src/index.css', 'utf8');
assert.ok(indexCss.includes("'Prompt'"), "src/index.css must include 'Prompt' in --kps-font-family");
console.log('  ✓ src/index.css specifies Prompt as primary font family');

const schoolRolesCode = fs.readFileSync('src/config/schoolRoles.ts', 'utf8');
assert.ok(schoolRolesCode.includes("fontFamily: 'Prompt'"), 'schoolRoles.ts must set Prompt as default in KUTCHAP_SCHOOL_INFO');
assert.ok(schoolRolesCode.includes("parsed.fontFamily || 'Prompt'"), 'schoolRoles.ts getSchoolSettings must fall back to Prompt');
console.log('  ✓ src/config/schoolRoles.ts defaults to Prompt font fallback');

// 3. Test Teacher Banner Service Logic in Node Environment
console.log('\n--- 3. Testing Banner Service Logic & RBAC Security ---');

// Mock localStorage and window
const store = new Map();
global.window = {
  localStorage: {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
  dispatchEvent: () => {},
};
global.CustomEvent = class CustomEvent {
  constructor(name, opts) {
    this.name = name;
    this.opts = opts;
  }
};

// Import teacherBannerService dynamically
const { teacherBannerService, DEFAULT_TEACHER_BANNERS } = await import('./src/services/teacherBannerService.ts');

// Test 3.1: Check Default Banners
console.log('  Testing 3.1: Default banners initialization...');
const defaultBanners = teacherBannerService.getBanners();
assert.strictEqual(defaultBanners.hero.id, 'hero');
assert.strictEqual(defaultBanners.sidebar.id, 'sidebar');
assert.strictEqual(defaultBanners.bottom.id, 'bottom');
assert.ok(
  defaultBanners.hero.quoteText.includes('การศึกษาคือการลงทุน') ||
  defaultBanners.hero.quoteText.includes('การตั้งใจทำทุกครั้ง'),
  'Hero quote text matches mockup'
);
assert.ok(defaultBanners.sidebar.quoteText.includes('สอนภาษาญี่ปุ่น'), 'Sidebar quote text matches mockup');
assert.ok(defaultBanners.bottom.quoteText.includes('ภาษา...คือกุญแจสู่โลกกว้าง'), 'Bottom quote text matches mockup');
console.log('  ✓ Default banners verified matching Reference Image 1');

// Test 3.2: RBAC Security Guard (Non-admin rejection)
console.log('  Testing 3.2: RBAC Security Guard for non-admin roles...');
const nonAdminRoles = ['TEACHER_GENERAL', 'STUDENT_GENERAL', 'STUDENT_AFFAIRS', 'STUDENT_COUNCIL', undefined, ''];
for (const role of nonAdminRoles) {
  const canManage = teacherBannerService.canManageBanners(role);
  assert.strictEqual(canManage, false, `Role ${role} must NOT have banner management permission`);

  const updateRes = teacherBannerService.updateBanner('hero', { quoteText: 'Hacked' }, role);
  assert.strictEqual(updateRes.success, false, `updateBanner must fail for non-admin ${role}`);
  assert.ok(updateRes.message.includes('ปฏิเสธการเข้าถึง'), 'Failure message must state access denied');

  const resetRes = teacherBannerService.resetBanner('hero', role);
  assert.strictEqual(resetRes.success, false, `resetBanner must fail for non-admin ${role}`);

  const resetAllRes = teacherBannerService.resetAllBanners(role);
  assert.strictEqual(resetAllRes.success, false, `resetAllBanners must fail for non-admin ${role}`);
}
console.log('  ✓ RBAC correctly rejects all unauthorized roles');

// Test 3.3: Admin Permitted Updates for both ACADEMIC_ADMIN and ADMIN
console.log('  Testing 3.3: Admin permission for ACADEMIC_ADMIN and ADMIN...');
assert.strictEqual(teacherBannerService.canManageBanners('ACADEMIC_ADMIN'), true);
assert.strictEqual(teacherBannerService.canManageBanners('ADMIN'), true);

const updateRes = teacherBannerService.updateBanner(
  'hero',
  {
    quoteText: '“คำคมใหม่เพื่อการศึกษา”',
    subText: 'ทดสอบระบบแบนเนอร์วิชาการ',
    customUrl: 'data:image/png;base64,mockCustomHeroData',
  },
  'ACADEMIC_ADMIN',
  'ผู้ดูแลระบบทดสอบ'
);
assert.strictEqual(updateRes.success, true);
assert.strictEqual(updateRes.data.quoteText, '“คำคมใหม่เพื่อการศึกษา”');

const updateSidebarRes = teacherBannerService.updateBanner(
  'sidebar',
  {
    quoteText: 'สอนภาษาญี่ปุ่นขั้นสูง',
    customUrl: 'data:image/png;base64,mockCustomSidebarData',
  },
  'ADMIN',
  'Super Admin'
);
assert.strictEqual(updateSidebarRes.success, true);
assert.strictEqual(updateSidebarRes.data.quoteText, 'สอนภาษาญี่ปุ่นขั้นสูง');

const updateBottomRes = teacherBannerService.updateBanner(
  'bottom',
  {
    quoteText: '“ภาษาญี่ปุ่นเพื่ออนาคต”',
    customUrl: 'data:image/png;base64,mockCustomBottomData',
  },
  'ACADEMIC_ADMIN',
  'หัวหน้าวิชาการ'
);
assert.strictEqual(updateBottomRes.success, true);

const effectiveHero = teacherBannerService.getEffectiveBanner('hero');
assert.strictEqual(effectiveHero.customUrl, 'data:image/png;base64,mockCustomHeroData');
assert.strictEqual(effectiveHero.quoteText, '“คำคมใหม่เพื่อการศึกษา”');
assert.strictEqual(teacherBannerService.getEffectiveBannerUrl('hero'), 'data:image/png;base64,mockCustomHeroData');
console.log('  ✓ Both ACADEMIC_ADMIN and ADMIN successfully updated banners');

// Test 3.4: Single Banner Reset
console.log('  Testing 3.4: Single banner reset...');
const resetRes = teacherBannerService.resetBanner('hero', 'ACADEMIC_ADMIN');
assert.strictEqual(resetRes.success, true);
const heroAfterReset = teacherBannerService.getEffectiveBanner('hero');
assert.strictEqual(heroAfterReset.customUrl, null);
assert.strictEqual(heroAfterReset.defaultUrl, DEFAULT_TEACHER_BANNERS.hero.defaultUrl);
console.log('  ✓ Single banner reset works correctly');

// Test 3.5: Reset All Banners
console.log('  Testing 3.5: Reset all banners...');
assert.ok(teacherBannerService.getEffectiveBanner('sidebar').customUrl !== null);
assert.ok(teacherBannerService.getEffectiveBanner('bottom').customUrl !== null);

const resetAllRes = teacherBannerService.resetAllBanners('ACADEMIC_ADMIN');
assert.strictEqual(resetAllRes.success, true);
assert.strictEqual(teacherBannerService.getEffectiveBanner('sidebar').customUrl, null);
assert.strictEqual(teacherBannerService.getEffectiveBanner('bottom').customUrl, null);
console.log('  ✓ Reset all banners restores all 3 banners to default');

// 4. Verify Component Header and Timetable Card Rendering
console.log('\n--- 4. Checking Code Implementations ---');
const teacherHeaderCode = fs.readFileSync('src/components/layout/TeacherHeader.tsx', 'utf8');
assert.ok(teacherHeaderCode.includes('นายปัญจพล เกษรัตน์'), 'Header must contain teacher name');
assert.ok(teacherHeaderCode.includes('วันพฤหัสบดีที่ 2 ตุลาคม 2569'), 'Header must contain Thai date');
assert.ok(teacherHeaderCode.includes('lg:hidden'), 'Header must support dedicated mobile view');
console.log('  ✓ TeacherHeader supports dual desktop and mobile header');

const timetableCode = fs.readFileSync('src/components/dashboard/TeacherTodayTimetableCard.tsx', 'utf8');
assert.ok(timetableCode.includes('วันนี้ - 2 ตุลาคม 2569'), 'Timetable must support mobile date title');
assert.ok(timetableCode.includes('ญ31201'), 'Timetable has course code ญ31201');
console.log('  ✓ TeacherTodayTimetableCard has responsive headers and periods');

console.log('\n🎉 ALL 20 VERIFICATION CHECKS PASSED SUCCESSFULLY!\n');
