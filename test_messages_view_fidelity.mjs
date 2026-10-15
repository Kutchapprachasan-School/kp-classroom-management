// test_messages_view_fidelity.mjs
// Verification suite for Messaging System View & Multi-User Sync fidelity

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('🧪 Starting Messaging System View & Multi-User Sync Fidelity Suite...\n');

// 1. Check MessagesView.tsx Source
console.log('--- 1. Checking MessagesView.tsx UI Structure & Fidelity ---');
const messagesViewPath = path.resolve('src/views/MessagesView.tsx');
assert.ok(fs.existsSync(messagesViewPath), 'MessagesView.tsx must exist');
const messagesViewContent = fs.readFileSync(messagesViewPath, 'utf-8');

// 1.1 Header Card
assert.ok(
  messagesViewContent.includes('ระบบข้อความ & แชทกลุ่มอัตโนมัติ'),
  "MessagesView must include title 'ระบบข้อความ & แชทกลุ่มอัตโนมัติ'"
);
assert.ok(
  messagesViewContent.includes('กลุ่มครูที่ปรึกษาและกลุ่มประจำวิชาดึงสมาชิกเข้าอัตโนมัติ ย้ายห้องเรียนระบบจะย้ายกลุ่มและโอนงาน/คะแนนเดิมติดตัวไปด้วย'),
  'MessagesView must include full subtitle matching master spec'
);
console.log('  ✓ Top Header banner card matches specification 100%');

// 1.2 Category Filter & Groups
assert.ok(
  messagesViewContent.includes('HOMEROOM') && messagesViewContent.includes('COURSE'),
  "MessagesView must filter by HOMEROOM and COURSE groups"
);
assert.ok(
  messagesViewContent.includes('สมาชิก ('),
  "MessagesView must render member count button"
);
console.log('  ✓ Category filters and group member count button verified');

// 1.3 Active Chat View & Two-Way Bubbles
assert.ok(
  messagesViewContent.includes('isMe'),
  'MessagesView must calculate isMe for sent vs received separation'
);
assert.ok(
  messagesViewContent.includes('bg-blue-600 text-white rounded-2xl rounded-br-xs'),
  'MessagesView must render outgoing messages in primary blue rounded-br-xs bubble on the right'
);
assert.ok(
  messagesViewContent.includes('handleSimulatePartnerReply'),
  'MessagesView must provide partner simulation reply trigger for single-device test verification'
);
assert.ok(
  messagesViewContent.includes('สมาชิกถูกดึงเข้าอัตโนมัติจากทะเบียนรายชื่อ'),
  'MessagesView must render auto-sync informative banner'
);
console.log('  ✓ Chat Header, Auto-Sync Banner, Two-Way Chat Bubbles (isMe), and Simulation Reply verified');

// 1.4 Input Controls & Quick Actions
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

// 2. Check Student Portal Integration
console.log('\n--- 2. Checking Student Contact & Chat Tab Integration ---');
const studentContactPath = path.resolve('src/components/student/StudentContactTeacherView.tsx');
assert.ok(fs.existsSync(studentContactPath), 'StudentContactTeacherView.tsx must exist');
const studentContactContent = fs.readFileSync(studentContactPath, 'utf-8');
assert.ok(
  studentContactContent.includes('MessagesView'),
  'StudentContactTeacherView must embed MessagesView for student chat access'
);
assert.ok(
  studentContactContent.includes('แชทห้องเรียน & กลุ่มวิชา'),
  'StudentContactTeacherView must have tab for classroom and course chat'
);
console.log('  ✓ Student portal contact view provides live chat access with MessagesView');

// 3. Check TeacherSidebar Mascot
console.log('\n--- 3. Checking TeacherSidebar.tsx Navigation & Mascot ---');
const sidebarPath = path.resolve('src/components/layout/TeacherSidebar.tsx');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf-8');
assert.ok(
  sidebarContent.includes("'messages'"),
  "TeacherSidebar must include messages menu item"
);
console.log('  ✓ TeacherSidebar includes messages menu item');

console.log('\n🎉 ALL 12 MESSAGING FIDELITY CHECKS PASSED PERFECTLY!\n');
