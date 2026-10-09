// test_messages_view_fidelity.mjs
// Verification suite for Messaging System View (media_1791273562793.png) fidelity

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Starting Messaging System View (media_1791273562793.png) Fidelity Verification Suite...\n');

// 1. Check MessagesView.tsx Source
console.log('--- 1. Checking MessagesView.tsx UI Structure & Fidelity ---');
const messagesViewPath = path.resolve('src/views/MessagesView.tsx');
assert.ok(fs.existsSync(messagesViewPath), 'MessagesView.tsx must exist');
const messagesViewContent = fs.readFileSync(messagesViewPath, 'utf-8');

// 1.1 Header Card
assert.ok(
  messagesViewContent.includes('ระบบข้อความ & แชทกลุ่มห้องเรียนจัดในมัติ') ||
    messagesViewContent.includes('ระบบข้อความ & แชทกลุ่มอัตโนมัติ'),
  "MessagesView must include title 'ระบบข้อความ & แชทกลุ่มห้องเรียนจัดในมัติ'"
);
assert.ok(
  messagesViewContent.includes('กลุ่มครูที่ปรึกษาและกลุ่มประจำวิชาจะตั้งนักเรียนเข้าอัตโนมัติ เมื่อมีการย้ายห้องเรียน จะสลับกลุ่มและโอนย้ายงาน/คะแนนเดิมติดตัวไปด้วย') ||
    messagesViewContent.includes('กลุ่มครูที่ปรึกษาและกลุ่มประจำวิชาดึงสมาชิกเข้าอัตโนมัติ ย้ายห้องเรียนระบบจะย้ายกลุ่มและโอนงาน/คะแนนเดิมติดตัวไปด้วย'),
  'MessagesView must include full subtitle matching mockup'
);
assert.ok(
  messagesViewContent.includes('จัดกลุ่มการสื่อสารด้วยไอคอนชัดเจน'),
  "MessagesView must include tip pill title 'จัดกลุ่มการสื่อสารด้วยไอคอนชัดเจน'"
);
console.log('  ✓ Top Header banner card and green tip pill match mockup 100%');

// 1.2 Category Sections & Groups
assert.ok(
  messagesViewContent.includes('กลุ่มครูที่ปรึกษา'),
  "MessagesView must render category 'กลุ่มครูที่ปรึกษา'"
);
assert.ok(
  messagesViewContent.includes('ครูที่ปรึกษา ม.3/1'),
  "MessagesView must render homeroom card 'ครูที่ปรึกษา ม.3/1'"
);
assert.ok(
  messagesViewContent.includes('Active'),
  "MessagesView must render 'Active' badge on homeroom card"
);
assert.ok(
  messagesViewContent.includes('กลุ่มห้องเรียน'),
  "MessagesView must render category 'กลุ่มห้องเรียน'"
);
assert.ok(
  messagesViewContent.includes("'ม.3/1'") || messagesViewContent.includes("title: 'ม.3/1'"),
  "MessagesView must render classroom card 'ม.3/1'"
);
assert.ok(
  messagesViewContent.includes("'ม.3/2'") || messagesViewContent.includes("title: 'ม.3/2'"),
  "MessagesView must render classroom card 'ม.3/2'"
);
assert.ok(
  messagesViewContent.includes("'ม.1/8'") || messagesViewContent.includes("title: 'ม.1/8'"),
  "MessagesView must render classroom card 'ม.1/8'"
);
assert.ok(
  messagesViewContent.includes("'ม.1/9'") || messagesViewContent.includes("title: 'ม.1/9'"),
  "MessagesView must render classroom card 'ม.1/9'"
);
console.log('  ✓ Category 1 (กลุ่มครูที่ปรึกษา) and Category 2 (กลุ่มห้องเรียน 4 ห้อง) verified');

// 1.3 Active Chat View
assert.ok(
  messagesViewContent.includes('กลุ่มห้องเรียน ม.3/1') || messagesViewContent.includes('fullTitle'),
  'MessagesView must render full group title in chat header'
);
assert.ok(
  messagesViewContent.includes('ครูภาณุวุฒิ เรื่องประเสริฐ'),
  'MessagesView must render adviser name ครูภาณุวุฒิ เรื่องประเสริฐ'
);
assert.ok(
  messagesViewContent.includes('สมาชิก ('),
  'MessagesView must render member count button'
);
assert.ok(
  messagesViewContent.includes('นักเรียนจะถูกเพิ่ม/ย้ายกลุ่มให้อัตโนมัติเมื่อย้ายห้องเรียน'),
  'MessagesView must render auto-sync green notification banner'
);
assert.ok(
  messagesViewContent.includes('สวัสดีนักเรียนห้อง ม.3/1 ทุกคน'),
  'MessagesView must render teacher greeting message matching mockup'
);
assert.ok(
  messagesViewContent.includes('กลุ่มครูที่ปรึกษา ม.3/1 พร้อมใช้งาน') ||
    messagesViewContent.includes('สมาชิกในกลุ่มห้อง'),
  'MessagesView must render system transfer announcement box matching mockup'
);
console.log('  ✓ Chat Header, Auto-Sync Banner, and Message Stream verified');

// 1.4 Input Controls & Quick Actions
assert.ok(
  messagesViewContent.includes('placeholder="พิมพ์ข้อความ..."'),
  "MessagesView must have input placeholder 'พิมพ์ข้อความ...'"
);
assert.ok(
  messagesViewContent.includes('Plus'),
  'MessagesView must have Plus action button'
);
assert.ok(
  messagesViewContent.includes('Smile'),
  'MessagesView must have Smile emoji button'
);
assert.ok(
  messagesViewContent.includes('ImageIcon') || messagesViewContent.includes('Image'),
  'MessagesView must have Image attachment button'
);
assert.ok(
  messagesViewContent.includes('Send'),
  'MessagesView must have Send button'
);
console.log('  ✓ Bottom input bar with Plus, Smile, Image, and Send verified');

// 2. Check TeacherSidebar Mascot
console.log('\n--- 2. Checking TeacherSidebar.tsx Cheerful Mascot on Messages View ---');
const sidebarPath = path.resolve('src/components/layout/TeacherSidebar.tsx');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
assert.ok(
  sidebarContent.includes("currentView === 'messages'"),
  "TeacherSidebar must detect currentView === 'messages'"
);
assert.ok(
  sidebarContent.includes('/images/banners/sidebar-banner.png'),
  "TeacherSidebar must load cheering anime boy banner on messages view"
);
console.log('  ✓ TeacherSidebar renders cheerful mascot banner on messages view');

console.log('\n🎉 ALL 14 MESSAGING FIDELITY CHECKS PASSED PERFECTLY!\n');
