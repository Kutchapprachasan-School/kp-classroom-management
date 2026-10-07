import { supabase, isSupabaseConfigured, logDbOperation } from '../lib/supabase.ts';
import { StudentCreateSchema, type StudentCreateInput } from './types.ts';

export interface StudentRecord {
  id: string;
  no: number;
  code: string;
  name: string;
  attendance: string;
  score: number;
  status: 'NORMAL' | 'AT_RISK';
  avatarUrl?: string;
  gender?: 'MALE' | 'FEMALE';
  classroomId?: string;
  studentCode?: string;
  passwordHash?: string | null;
  isPasswordChanged?: boolean;
  lastLoginAt?: string;
}

const STORAGE_PREFIX = 'cls_students_';

export const defaultStudents: StudentRecord[] = [
  { id: 'stu-1', no: 1, code: '45101', name: 'ด.ช. กฤษณะ ศรีสมบูรณ์', attendance: '8/8', score: 88.5, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
  { id: 'stu-2', no: 2, code: '45102', name: 'ด.ช. ธีรานุ เดชปันคำ', attendance: '8/8', score: 92.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
  { id: 'stu-7', no: 7, code: '45107', name: 'ด.ช. ภูรินท์ บัณฑิต', attendance: '4/8', score: 28.3, status: 'AT_RISK', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
  { id: 'stu-10', no: 10, code: '45110', name: 'ด.ช. อัศวิน วนเกษตรกุล', attendance: '8/8', score: 34.3, status: 'AT_RISK', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
  { id: 'stu-12', no: 12, code: '45112', name: 'ด.ช. ชัยมงคล วงศ์บุตร', attendance: '8/8', score: 35.0, status: 'AT_RISK', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
  { id: 'stu-15', no: 15, code: '45115', name: 'ด.ช. หัตเธน คำฝั้น', attendance: '8/8', score: 78.5, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
  { id: 'stu-22', no: 22, code: '45122', name: 'ด.ญ. อดาราน์ จิรากร', attendance: '6/8', score: 39.0, status: 'AT_RISK', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  { id: 'stu-23', no: 23, code: '45123', name: 'ด.ญ. ปริยาภรณ์ ชัยแก้ว', attendance: '8/8', score: 95.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
];

export const mockStudentsByRoom: Record<string, StudentRecord[]> = {
  'room-3-1': defaultStudents,
  'ม.3/1': defaultStudents,
  'room-3-2': [
    { id: 'stu-32-1', no: 1, code: '45201', name: 'ด.ช. ธนกร วัฒนศิลป์', attendance: '8/8', score: 86.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-32-2', no: 2, code: '45202', name: 'ด.ช. ภัทรดนัย บุญยัง', attendance: '7/8', score: 81.5, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-32-3', no: 3, code: '45203', name: 'ด.ช. นรวิชญ์ เกษมศรี', attendance: '8/8', score: 90.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-32-4', no: 4, code: '45204', name: 'ด.ช. วรัญญู รุ่งโรจน์', attendance: '5/8', score: 42.0, status: 'AT_RISK', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-32-5', no: 5, code: '45205', name: 'ด.ญ. กัญญารัตน์ โพธิ์ทอง', attendance: '8/8', score: 94.5, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
    { id: 'stu-32-6', no: 6, code: '45206', name: 'ด.ญ. พิชญาภา สุขสมบูรณ์', attendance: '8/8', score: 88.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'ม.3/2': [
    { id: 'stu-32-1', no: 1, code: '45201', name: 'ด.ช. ธนกร วัฒนศิลป์', attendance: '8/8', score: 86.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-32-2', no: 2, code: '45202', name: 'ด.ช. ภัทรดนัย บุญยัง', attendance: '7/8', score: 81.5, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-32-3', no: 3, code: '45203', name: 'ด.ช. นรวิชญ์ เกษมศรี', attendance: '8/8', score: 90.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-32-4', no: 4, code: '45204', name: 'ด.ช. วรัญญู รุ่งโรจน์', attendance: '5/8', score: 42.0, status: 'AT_RISK', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-32-5', no: 5, code: '45205', name: 'ด.ญ. กัญญารัตน์ โพธิ์ทอง', attendance: '8/8', score: 94.5, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
    { id: 'stu-32-6', no: 6, code: '45206', name: 'ด.ญ. พิชญาภา สุขสมบูรณ์', attendance: '8/8', score: 88.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'room-1-8': [
    { id: 'stu-18-1', no: 1, code: '47101', name: 'ด.ช. กฤษดา ศรีนคร', attendance: '8/8', score: 75.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-18-2', no: 2, code: '47102', name: 'ด.ช. จิรภัทร ชาญวิทย์', attendance: '6/8', score: 68.5, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-18-3', no: 3, code: '47103', name: 'ด.ช. ธนพล มณีโชติ', attendance: '3/8', score: 32.0, status: 'AT_RISK', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-18-4', no: 4, code: '47104', name: 'ด.ญ. นลินทิพย์ วงศ์ใหญ่', attendance: '8/8', score: 89.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
    { id: 'stu-18-5', no: 5, code: '47105', name: 'ด.ญ. วรินทร อักษรศรี', attendance: '8/8', score: 82.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'ม.1/8': [
    { id: 'stu-18-1', no: 1, code: '47101', name: 'ด.ช. กฤษดา ศรีนคร', attendance: '8/8', score: 75.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-18-2', no: 2, code: '47102', name: 'ด.ช. จิรภัทร ชาญวิทย์', attendance: '6/8', score: 68.5, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-18-3', no: 3, code: '47103', name: 'ด.ช. ธนพล มณีโชติ', attendance: '3/8', score: 32.0, status: 'AT_RISK', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-18-4', no: 4, code: '47104', name: 'ด.ญ. นลินทิพย์ วงศ์ใหญ่', attendance: '8/8', score: 89.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
    { id: 'stu-18-5', no: 5, code: '47105', name: 'ด.ญ. วรินทร อักษรศรี', attendance: '8/8', score: 82.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'room-2-8': [
    { id: 'stu-28-1', no: 1, code: '46201', name: 'ด.ช. ภาณุวัฒน์ ใจดี', attendance: '8/8', score: 92.5, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-28-2', no: 2, code: '46202', name: 'ด.ช. ธีรเมธ ศิริชัย', attendance: '8/8', score: 87.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-28-3', no: 3, code: '46203', name: 'ด.ญ. ชนกนันท์ เลิศวิมล', attendance: '8/8', score: 95.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
    { id: 'stu-28-4', no: 4, code: '46204', name: 'ด.ญ. ปรียานุช รุ่งอรุณ', attendance: '8/8', score: 85.5, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'ม.2/8': [
    { id: 'stu-28-1', no: 1, code: '46201', name: 'ด.ช. ภาณุวัฒน์ ใจดี', attendance: '8/8', score: 92.5, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-28-2', no: 2, code: '46202', name: 'ด.ช. ธีรเมธ ศิริชัย', attendance: '8/8', score: 87.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-28-3', no: 3, code: '46203', name: 'ด.ญ. ชนกนันท์ เลิศวิมล', attendance: '8/8', score: 95.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
    { id: 'stu-28-4', no: 4, code: '46204', name: 'ด.ญ. ปรียานุช รุ่งอรุณ', attendance: '8/8', score: 85.5, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'room-3-8': [
    { id: 'stu-38-1', no: 1, code: '45801', name: 'ด.ช. กรณ์พัฒน์ สุริยะ', attendance: '8/8', score: 96.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-38-2', no: 2, code: '45802', name: 'ด.ช. ชนสรณ์ เลิศศิลป์', attendance: '8/8', score: 91.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-38-3', no: 3, code: '45803', name: 'ด.ญ. พัทธนันท์ วีระกุล', attendance: '8/8', score: 94.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'ม.3/8': [
    { id: 'stu-38-1', no: 1, code: '45801', name: 'ด.ช. กรณ์พัฒน์ สุริยะ', attendance: '8/8', score: 96.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-38-2', no: 2, code: '45802', name: 'ด.ช. ชนสรณ์ เลิศศิลป์', attendance: '8/8', score: 91.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-38-3', no: 3, code: '45803', name: 'ด.ญ. พัทธนันท์ วีระกุล', attendance: '8/8', score: 94.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'room-1-1': [
    { id: 'stu-11-1', no: 1, code: '47001', name: 'ด.ช. ชนะภัย ยอดสิงห์', attendance: '8/8', score: 85.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-11-2', no: 2, code: '47002', name: 'ด.ช. ธีรานุ เดชปันคำ', attendance: '7/8', score: 79.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-11-3', no: 3, code: '47003', name: 'ด.ญ. กัญญาวีร์ สิทธิโชค', attendance: '8/8', score: 91.5, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
    { id: 'stu-11-4', no: 4, code: '47004', name: 'ด.ญ. ปานวาด ประเสริฐยิ่ง', attendance: '5/8', score: 45.0, status: 'AT_RISK', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'ม.1/1': [
    { id: 'stu-11-1', no: 1, code: '47001', name: 'ด.ช. ชนะภัย ยอดสิงห์', attendance: '8/8', score: 85.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-11-2', no: 2, code: '47002', name: 'ด.ช. ธีรานุ เดชปันคำ', attendance: '7/8', score: 79.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-11-3', no: 3, code: '47003', name: 'ด.ญ. กัญญาวีร์ สิทธิโชค', attendance: '8/8', score: 91.5, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
    { id: 'stu-11-4', no: 4, code: '47004', name: 'ด.ญ. ปานวาด ประเสริฐยิ่ง', attendance: '5/8', score: 45.0, status: 'AT_RISK', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'room-1-2': [
    { id: 'stu-12-1', no: 1, code: '47101', name: 'ด.ช. ภัทรพล สิทธิเดช', attendance: '8/8', score: 88.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-12-2', no: 2, code: '47102', name: 'ด.ช. ณัฐวุฒิ บุญช่วย', attendance: '8/8', score: 82.5, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-12-3', no: 3, code: '47103', name: 'ด.ญ. พรประภา ศิริพร', attendance: '8/8', score: 94.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
    { id: 'stu-12-4', no: 4, code: '47104', name: 'ด.ญ. กัญญารัตน์ ชาญศิลป์', attendance: '7/8', score: 76.5, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'ม.1/2': [
    { id: 'stu-12-1', no: 1, code: '47101', name: 'ด.ช. ภัทรพล สิทธิเดช', attendance: '8/8', score: 88.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-12-2', no: 2, code: '47102', name: 'ด.ช. ณัฐวุฒิ บุญช่วย', attendance: '8/8', score: 82.5, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-12-3', no: 3, code: '47103', name: 'ด.ญ. พรประภา ศิริพร', attendance: '8/8', score: 94.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
    { id: 'stu-12-4', no: 4, code: '47104', name: 'ด.ญ. กัญญารัตน์ ชาญศิลป์', attendance: '7/8', score: 76.5, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'room-2-1': [
    { id: 'stu-21-1', no: 1, code: '46001', name: 'ด.ช. กันต์ริศย์ ทวีเศรษฐกร', attendance: '8/8', score: 88.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-21-2', no: 2, code: '46002', name: 'ด.ช. พงศกร มหาวงศ์', attendance: '8/8', score: 84.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-21-3', no: 3, code: '46003', name: 'ด.ญ. ศุภิสรา รัตนโกสินทร์', attendance: '8/8', score: 93.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'ม.2/1': [
    { id: 'stu-21-1', no: 1, code: '46001', name: 'ด.ช. กันต์ริศย์ ทวีเศรษฐกร', attendance: '8/8', score: 88.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-21-2', no: 2, code: '46002', name: 'ด.ช. พงศกร มหาวงศ์', attendance: '8/8', score: 84.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-21-3', no: 3, code: '46003', name: 'ด.ญ. ศุภิสรา รัตนโกสินทร์', attendance: '8/8', score: 93.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'room-4-1': [
    { id: 'stu-41-1', no: 1, code: '44101', name: 'นาย ณภัทร เกษมศานติ์', attendance: '8/8', score: 87.5, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-41-2', no: 2, code: '44102', name: 'น.ส. ธัญชนก รักษ์มณี', attendance: '8/8', score: 92.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'ม.4/1': [
    { id: 'stu-41-1', no: 1, code: '44101', name: 'นาย ณภัทร เกษมศานติ์', attendance: '8/8', score: 87.5, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-41-2', no: 2, code: '44102', name: 'น.ส. ธัญชนก รักษ์มณี', attendance: '8/8', score: 92.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'room-5-1': [
    { id: 'stu-51-1', no: 1, code: '42018', name: 'น.ส. พิมพ์ชนก วงศ์สวัสดิ์', attendance: '8/8', score: 95.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
    { id: 'stu-51-2', no: 2, code: '43102', name: 'นาย วรรณพงศ์ ศิริชัย', attendance: '7/8', score: 82.5, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
  ],
  'ม.5/1': [
    { id: 'stu-51-1', no: 1, code: '42018', name: 'น.ส. พิมพ์ชนก วงศ์สวัสดิ์', attendance: '8/8', score: 95.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
    { id: 'stu-51-2', no: 2, code: '43102', name: 'นาย วรรณพงศ์ ศิริชัย', attendance: '7/8', score: 82.5, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
  ],
  'room-6-1': [
    { id: 'stu-61-1', no: 1, code: '42101', name: 'นาย ธีรภัทร อภิบาล', attendance: '8/8', score: 91.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-61-2', no: 2, code: '42102', name: 'น.ส. ชนิกานต์ สุวรรณฉัตร', attendance: '8/8', score: 96.5, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'ม.6/1': [
    { id: 'stu-61-1', no: 1, code: '42101', name: 'นาย ธีรภัทร อภิบาล', attendance: '8/8', score: 91.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-61-2', no: 2, code: '42102', name: 'น.ส. ชนิกานต์ สุวรรณฉัตร', attendance: '8/8', score: 96.5, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'room-3-5': [
    { id: 'stu-35-1', no: 1, code: '45501', name: 'ด.ช. พงศ์สิริ ธาราทิพย์', attendance: '8/8', score: 85.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-35-2', no: 2, code: '45502', name: 'ด.ญ. สุทธิดา ทวีโชค', attendance: '8/8', score: 90.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'ม.3/5': [
    { id: 'stu-35-1', no: 1, code: '45501', name: 'ด.ช. พงศ์สิริ ธาราทิพย์', attendance: '8/8', score: 85.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-35-2', no: 2, code: '45502', name: 'ด.ญ. สุทธิดา ทวีโชค', attendance: '8/8', score: 90.0, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'room-3-6': [
    { id: 'stu-36-1', no: 1, code: '45601', name: 'ด.ช. รชต วรพงศ์', attendance: '8/8', score: 82.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-36-2', no: 2, code: '45602', name: 'ด.ญ. วรัญญา พิพัฒน์', attendance: '7/8', score: 79.5, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'ม.3/6': [
    { id: 'stu-36-1', no: 1, code: '45601', name: 'ด.ช. รชต วรพงศ์', attendance: '8/8', score: 82.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-36-2', no: 2, code: '45602', name: 'ด.ญ. วรัญญา พิพัฒน์', attendance: '7/8', score: 79.5, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'room-3-7': [
    { id: 'stu-37-1', no: 1, code: '45701', name: 'ด.ช. อนุชา วิเศษศิลป์', attendance: '8/8', score: 88.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-37-2', no: 2, code: '45702', name: 'ด.ญ. กัญญ์ณพัชญ์ ศิริพร', attendance: '8/8', score: 93.5, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
  'ม.3/7': [
    { id: 'stu-37-1', no: 1, code: '45701', name: 'ด.ช. อนุชา วิเศษศิลป์', attendance: '8/8', score: 88.0, status: 'NORMAL', gender: 'MALE', avatarUrl: '/images/banners/student-avatar.png' },
    { id: 'stu-37-2', no: 2, code: '45702', name: 'ด.ญ. กัญญ์ณพัชญ์ ศิริพร', attendance: '8/8', score: 93.5, status: 'NORMAL', gender: 'FEMALE', avatarUrl: '/images/banners/student-avatar-girl.png' },
  ],
};

const getLocalStudents = (classroomId: string): StudentRecord[] => {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${classroomId}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
  }
  if (mockStudentsByRoom[classroomId]) {
    return mockStudentsByRoom[classroomId];
  }
  if (classroomId === 'room-3-1' || classroomId === 'ม.3/1') {
    return defaultStudents;
  }
  return [];
};

const saveLocalStudents = (classroomId: string, items: StudentRecord[]) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`${STORAGE_PREFIX}${classroomId}`, JSON.stringify(items));
  }
};

export const studentService = {
  getLocalStudents,
  saveLocalStudents,
  mockStudentsByRoom,

  // ดึงรายชื่อนักเรียนในห้อง
  getStudents(classroomId: string): StudentRecord[] {
    return getLocalStudents(classroomId);
  },

  // ค้นหานักเรียนและห้องเรียนปัจจุบันจากรหัส
  findStudentByCode(code: string): { student: StudentRecord; classroomId: string } | null {
    // 1. ตรวจสอบ keys ทั้งหมดใน localStorage ก่อน
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(STORAGE_PREFIX)) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                const match = list.find((s: StudentRecord) => s.code === code || s.id === code);
                if (match) {
                  return { student: match, classroomId: k.slice(STORAGE_PREFIX.length) };
                }
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // 2. Fallback ค้นหาจากห้องที่มีข้อมูล mock
    for (const key of Object.keys(mockStudentsByRoom)) {
      const list = getLocalStudents(key);
      const match = list.find((s) => s.code === code || s.id === code);
      if (match) {
        return { student: match, classroomId: key };
      }
    }
    return null;
  },

  // อัปเดตรหัสผ่านนักเรียน (บันทึกลง local storage ประจำห้องเรียน)
  updateStudentPassword(code: string, passwordHash: string): boolean {
    const found = this.findStudentByCode(code);
    if (!found) return false;
    const { student, classroomId } = found;
    const list = getLocalStudents(classroomId);
    const updated = list.map((s) =>
      s.code === student.code || s.id === student.id
        ? { ...s, passwordHash, isPasswordChanged: true, lastLoginAt: new Date().toISOString() }
        : s
    );
    saveLocalStudents(classroomId, updated);
    return true;
  },

  // รีเซ็ตรหัสผ่านนักเรียนกลับเป็นค่าเริ่มต้น (5 หลัก) โดยครูที่ปรึกษา / แอดมิน
  resetStudentPassword(code: string): boolean {
    const found = this.findStudentByCode(code);
    if (!found) return false;
    const { student, classroomId } = found;
    const list = getLocalStudents(classroomId);
    const updated = list.map((s) =>
      s.code === student.code || s.id === student.id
        ? { ...s, passwordHash: null, isPasswordChanged: false }
        : s
    );
    saveLocalStudents(classroomId, updated);
    return true;
  },

  // READ: List students in classroom
  async getByClassroom(classroomId: string): Promise<StudentRecord[]> {
    if (isSupabaseConfigured) {
      logDbOperation(`SELECT * FROM Enrollment WHERE classroomId = ${classroomId}`);
      const { data, error } = await supabase
        .from('Enrollment')
        .select('*, membership:SchoolMembership(*)')
        .eq('classroomId', classroomId)
        .eq('status', 'ACTIVE')
        .order('studentNo', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((item) => ({
          id: item.id,
          no: item.studentNo,
          code: item.membership?.studentCode || 'N/A',
          name: item.membership?.user?.name || `นักเรียนเลขที่ ${item.studentNo}`,
          attendance: '8/8',
          score: 80,
          status: 'NORMAL',
        }));
      }
    }
    return getLocalStudents(classroomId);
  },

  // CREATE: Add new student
  async create(classroomId: string, input: StudentCreateInput): Promise<StudentRecord> {
    const validated = StudentCreateSchema.parse(input);
    const newStudent: StudentRecord = {
      id: `stu-${Date.now()}`,
      no: validated.studentNo,
      code: validated.studentCode,
      name: validated.name,
      attendance: '0/0',
      score: 0,
      status: validated.status,
    };

    if (isSupabaseConfigured) {
      logDbOperation('INSERT INTO Enrollment', { classroomId, ...newStudent });
      await supabase.from('Enrollment').insert({
        id: newStudent.id,
        classroomId,
        studentNo: newStudent.no,
        status: 'ACTIVE',
      });
    }

    const current = getLocalStudents(classroomId);
    const updated = [...current, newStudent].sort((a, b) => a.no - b.no);
    saveLocalStudents(classroomId, updated);

    return newStudent;
  },

  // UPDATE: Update student info
  async update(classroomId: string, id: string, updates: Partial<StudentRecord>): Promise<StudentRecord> {
    const current = getLocalStudents(classroomId);
    const index = current.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('ไม่พบข้อมูลนักเรียน');

    const updated = { ...current[index], ...updates };
    current[index] = updated;
    saveLocalStudents(classroomId, current);

    if (isSupabaseConfigured) {
      logDbOperation(`UPDATE Enrollment WHERE id = ${id}`, updates);
      await supabase.from('Enrollment').update(updates).eq('id', id);
    }

    return updated;
  },

  // DELETE: Soft delete student
  async delete(classroomId: string, id: string): Promise<boolean> {
    const current = getLocalStudents(classroomId);
    const target = current.find((s) => s.id === id);
    if (!target) return false;

    const filtered = current.filter((s) => s.id !== id);
    saveLocalStudents(classroomId, filtered);

    if (isSupabaseConfigured) {
      logDbOperation(`UPDATE Enrollment SET status = DELETED WHERE id = ${id}`);
      await supabase.from('Enrollment').update({ status: 'DELETED' }).eq('id', id);
    }

    return true;
  },

  // BATCH IMPORT: Import from SGS Excel
  async batchImport(classroomId: string, students: Array<Omit<StudentRecord, 'id'>>): Promise<number> {
    const current = getLocalStudents(classroomId);
    const newItems: StudentRecord[] = students.map((s, idx) => ({
      ...s,
      id: `stu-${Date.now()}-${idx}`,
    }));

    const combined = [...current, ...newItems].sort((a, b) => a.no - b.no);
    saveLocalStudents(classroomId, combined);

    if (isSupabaseConfigured) {
      logDbOperation('BATCH INSERT INTO Enrollment', { count: newItems.length });
    }

    return newItems.length;
  },

  // Alias for compatibility
  async importBatch(classroomId: string, students: Array<Omit<StudentRecord, 'id'>>): Promise<number> {
    return this.batchImport(classroomId, students);
  },
};

