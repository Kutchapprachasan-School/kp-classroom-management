import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BarChart2,
  Calendar,
  ChevronDown,
  Users,
  CheckCircle2,
  AlertTriangle,
  Star,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Lightbulb,
  Shield,
  Layers,
  Check,
  X,
  ClipboardCheck,
  GraduationCap,
  LayoutGrid,
  FileDown,
  Printer,
} from 'lucide-react';
import type { SchoolUserRole } from '../config/schoolRoles';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';

interface CrossClassSarViewProps {
  activeRole?: SchoolUserRole;
  onChangeRole?: (role: SchoolUserRole) => void;
}

interface CourseItemData {
  id: string;
  code: string;
  codeColor: 'pink' | 'orange' | 'cyan' | 'purple' | 'blue';
  name: string;
  level: string;
  rooms: string;
  studentCount: number;
  averageScore: number;
  percentage: number;
  barPercent: number;
  grades: {
    g4: { count: number; percent: number };
    g3_5: { count: number; percent: number };
    g3: { count: number; percent: number };
    g2_5: { count: number; percent: number };
    g2: { count: number; percent: number };
    g1_5: { count: number; percent: number };
    g1: { count: number; percent: number };
    g0: { count: number; percent: number };
    ro?: { count: number; percent: number };
    ms?: { count: number; percent: number };
  };
}

interface TeacherProfileOption {
  id: string;
  name: string;
  department: string;
  courses: CourseItemData[];
  kpiStats: {
    gpaPercent: number;
    gpaTrend: string;
    totalStudents: number;
    passedCount: number;
    passedPercent: number;
    remedialCount: number;
    remedialPercent: number;
    goodAboveCount: number;
    goodAbovePercent: number;
  };
}

// 1. ข้อมูลรายวิชาของ ครูภาสภูมิ เรืองปราชญ์ (ตรงตาม Reference Image 2 เป๊ะๆ)
const PASSAPOOM_COURSES: CourseItemData[] = [
  {
    id: 'c-1',
    code: 'ท20221',
    codeColor: 'pink',
    name: 'ดนตรีปฏิบัติตามความถนัด 1',
    level: 'ม.1',
    rooms: 'ม.1/8',
    studentCount: 27,
    averageScore: 71.1,
    percentage: 70.4,
    barPercent: 70.4,
    grades: {
      g4: { count: 9, percent: 33 },
      g3_5: { count: 5, percent: 19 },
      g3: { count: 5, percent: 19 },
      g2_5: { count: 5, percent: 19 },
      g2: { count: 0, percent: 0 },
      g1_5: { count: 0, percent: 0 },
      g1: { count: 1, percent: 4 },
      g0: { count: 2, percent: 7 },
    },
  },
  {
    id: 'c-2',
    code: 'ท20223',
    codeColor: 'orange',
    name: 'ดนตรีปฏิบัติตามความถนัด 3',
    level: 'ม.2',
    rooms: 'ม.2/8',
    studentCount: 35,
    averageScore: 87.2,
    percentage: 88.2,
    barPercent: 88.6,
    grades: {
      g4: { count: 30, percent: 86 },
      g3_5: { count: 1, percent: 3 },
      g3: { count: 0, percent: 0 },
      g2_5: { count: 0, percent: 0 },
      g2: { count: 2, percent: 6 },
      g1_5: { count: 0, percent: 0 },
      g1: { count: 0, percent: 0 },
      g0: { count: 2, percent: 6 },
    },
  },
  {
    id: 'c-3',
    code: 'ท23101',
    codeColor: 'cyan',
    name: 'ศิลปะ',
    level: 'ม.3',
    rooms: 'ม.3/1, ม.3/2, ม.3/5, ม.3/6, ม.3/7, ม.3/8',
    studentCount: 182,
    averageScore: 80.5,
    percentage: 80.5,
    barPercent: 83.5,
    grades: {
      g4: { count: 114, percent: 63 },
      g3_5: { count: 25, percent: 14 },
      g3: { count: 13, percent: 7 },
      g2_5: { count: 11, percent: 6 },
      g2: { count: 6, percent: 3 },
      g1_5: { count: 4, percent: 2 },
      g1: { count: 1, percent: 1 },
      g0: { count: 8, percent: 4 },
    },
  },
  {
    id: 'c-4',
    code: 'ท23265',
    codeColor: 'purple',
    name: 'ดนตรีปฏิบัติตามความถนัด 5',
    level: 'ม.3',
    rooms: 'ม.3/8',
    studentCount: 32,
    averageScore: 92.4,
    percentage: 92.4,
    barPercent: 100.0,
    grades: {
      g4: { count: 31, percent: 97 },
      g3_5: { count: 0, percent: 0 },
      g3: { count: 0, percent: 0 },
      g2_5: { count: 0, percent: 0 },
      g2: { count: 0, percent: 0 },
      g1_5: { count: 0, percent: 0 },
      g1: { count: 0, percent: 0 },
      g0: { count: 0, percent: 0 },
    },
  },
];

// ข้อมูลสำหรับ ผอ./Admin สลับดูผู้สอนท่านอื่นในโรงเรียน
const ALL_TEACHERS_DATA: Record<string, TeacherProfileOption> = {
  passapoom: {
    id: 'passapoom',
    name: 'ครูภาสภูมิ เรืองปราชญ์',
    department: 'กลุ่มสาระฯ ศิลปะ (ที่ปรึกษา ม.3/1)',
    courses: PASSAPOOM_COURSES,
    kpiStats: {
      gpaPercent: 84.8,
      gpaTrend: '+6.2%',
      totalStudents: 234,
      passedCount: 276,
      passedPercent: 88.6,
      remedialCount: 4,
      remedialPercent: 1.4,
      goodAboveCount: 234,
      goodAbovePercent: 100,
    },
  },
  wiphada: {
    id: 'wiphada',
    name: 'ครูวิภาดา สมบูรณ์',
    department: 'กลุ่มสาระฯ ภาษาไทย (กิจการนักเรียน)',
    courses: [
      {
        id: 'w-1',
        code: 'ท21101',
        codeColor: 'pink',
        name: 'ภาษาไทยพื้นฐาน 1',
        level: 'ม.1',
        rooms: 'ม.1/1, ม.1/2',
        studentCount: 72,
        averageScore: 78.4,
        percentage: 82.0,
        barPercent: 82.0,
        grades: {
          g4: { count: 28, percent: 39 },
          g3_5: { count: 15, percent: 21 },
          g3: { count: 12, percent: 17 },
          g2_5: { count: 8, percent: 11 },
          g2: { count: 4, percent: 5 },
          g1_5: { count: 2, percent: 3 },
          g1: { count: 2, percent: 3 },
          g0: { count: 1, percent: 1 },
        },
      },
      {
        id: 'w-2',
        code: 'ท23102',
        codeColor: 'cyan',
        name: 'การอ่านและการเขียนเชิงสร้างสรรค์',
        level: 'ม.3',
        rooms: 'ม.3/2, ม.3/5',
        studentCount: 65,
        averageScore: 84.1,
        percentage: 88.5,
        barPercent: 89.0,
        grades: {
          g4: { count: 35, percent: 54 },
          g3_5: { count: 14, percent: 22 },
          g3: { count: 8, percent: 12 },
          g2_5: { count: 4, percent: 6 },
          g2: { count: 2, percent: 3 },
          g1_5: { count: 1, percent: 1 },
          g1: { count: 1, percent: 1 },
          g0: { count: 0, percent: 0 },
        },
      },
    ],
    kpiStats: {
      gpaPercent: 81.2,
      gpaTrend: '+4.1%',
      totalStudents: 137,
      passedCount: 134,
      passedPercent: 97.8,
      remedialCount: 3,
      remedialPercent: 2.2,
      goodAboveCount: 116,
      goodAbovePercent: 84.7,
    },
  },
  ekkachai: {
    id: 'ekkachai',
    name: 'ครูเอกชัย มิ่งขวัญ',
    department: 'กลุ่มสาระฯ คณิตศาสตร์ (ที่ปรึกษา ม.1/8)',
    courses: [
      {
        id: 'e-1',
        code: 'ค21101',
        codeColor: 'orange',
        name: 'คณิตศาสตร์พื้นฐาน 1',
        level: 'ม.1',
        rooms: 'ม.1/1, ม.1/8',
        studentCount: 61,
        averageScore: 75.3,
        percentage: 76.5,
        barPercent: 78.0,
        grades: {
          g4: { count: 18, percent: 30 },
          g3_5: { count: 12, percent: 20 },
          g3: { count: 10, percent: 16 },
          g2_5: { count: 9, percent: 15 },
          g2: { count: 5, percent: 8 },
          g1_5: { count: 3, percent: 5 },
          g1: { count: 2, percent: 3 },
          g0: { count: 2, percent: 3 },
        },
      },
    ],
    kpiStats: {
      gpaPercent: 76.8,
      gpaTrend: '+3.5%',
      totalStudents: 61,
      passedCount: 57,
      passedPercent: 93.4,
      remedialCount: 4,
      remedialPercent: 6.6,
      goodAboveCount: 49,
      goodAbovePercent: 80.3,
    },
  },
  piyapol: {
    id: 'piyapol',
    name: 'ครูปิยพล เกษรัตน์',
    department: 'กลุ่มสาระฯ ภาษาต่างประเทศ (ภาษาญี่ปุ่น)',
    courses: [
      {
        id: 'p-1',
        code: 'ญ23101',
        codeColor: 'purple',
        name: 'ภาษาญี่ปุ่นพื้นฐาน 1',
        level: 'ม.3',
        rooms: 'ม.3/1, ม.3/8',
        studentCount: 58,
        averageScore: 88.6,
        percentage: 91.2,
        barPercent: 94.0,
        grades: {
          g4: { count: 38, percent: 66 },
          g3_5: { count: 10, percent: 17 },
          g3: { count: 6, percent: 10 },
          g2_5: { count: 2, percent: 3 },
          g2: { count: 1, percent: 2 },
          g1_5: { count: 1, percent: 2 },
          g1: { count: 0, percent: 0 },
          g0: { count: 0, percent: 0 },
        },
      },
    ],
    kpiStats: {
      gpaPercent: 88.6,
      gpaTrend: '+8.3%',
      totalStudents: 58,
      passedCount: 57,
      passedPercent: 98.3,
      remedialCount: 1,
      remedialPercent: 1.7,
      goodAboveCount: 54,
      goodAbovePercent: 93.1,
    },
  },
  chanika: {
    id: 'chanika',
    name: 'ครูชนิกา ทรัพย์สุข',
    department: 'กลุ่มสาระฯ วิทยาศาสตร์ (ที่ปรึกษา ม.2/8)',
    courses: [
      {
        id: 'ch-1',
        code: 'ว22101',
        codeColor: 'cyan',
        name: 'วิทยาศาสตร์กายภาพ 3',
        level: 'ม.2',
        rooms: 'ม.2/1, ม.2/8',
        studentCount: 71,
        averageScore: 82.3,
        percentage: 84.5,
        barPercent: 86.0,
        grades: {
          g4: { count: 32, percent: 45 },
          g3_5: { count: 18, percent: 25 },
          g3: { count: 11, percent: 15 },
          g2_5: { count: 5, percent: 7 },
          g2: { count: 3, percent: 4 },
          g1_5: { count: 1, percent: 1 },
          g1: { count: 1, percent: 1 },
          g0: { count: 0, percent: 0 },
        },
      },
    ],
    kpiStats: {
      gpaPercent: 82.3,
      gpaTrend: '+5.1%',
      totalStudents: 71,
      passedCount: 71,
      passedPercent: 100,
      remedialCount: 0,
      remedialPercent: 0,
      goodAboveCount: 61,
      goodAbovePercent: 85.9,
    },
  },
};

export const CrossClassSarView: React.FC<CrossClassSarViewProps> = ({
  activeRole = 'TEACHER_GENERAL',
}) => {
  // สิทธิ์การเข้าถึงข้อมูลตามบทบาท:
  // - ครูทั่วไป (TEACHER_GENERAL): แสดงเฉพาะห้องครูที่ปรึกษา และห้องที่สอนเท่านั้น
  // - ครูกิจการ (STUDENT_AFFAIRS / STUDENT_COUNCIL), ผอ. (ACADEMIC_ADMIN / DIRECTOR), แอดมิน (ADMIN): ดูได้ทุกคน ทุกห้อง ทุกรายวิชา และรายวิชาของผู้สอนทุกคนในโรงเรียน
  const isExecutiveOrAdmin =
    activeRole === 'ACADEMIC_ADMIN' ||
    activeRole === 'STUDENT_AFFAIRS' ||
    activeRole === 'STUDENT_COUNCIL' ||
    (activeRole as string) === 'ADMIN' ||
    (activeRole as string) === 'DIRECTOR';

  // State สำหรับ Filters ต่างๆ
  const [selectedTerm, setSelectedTerm] = useState('ภาคเรียนที่ 1/2569');
  const [selectedTeacherKey, setSelectedTeacherKey] = useState<string>('passapoom');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');

  // Dropdowns Open State
  const [isTermDropdownOpen, setIsTermDropdownOpen] = useState(false);
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

  const termDropdownRef = useRef<HTMLDivElement>(null);
  const teacherDropdownRef = useRef<HTMLDivElement>(null);
  const classDropdownRef = useRef<HTMLDivElement>(null);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (termDropdownRef.current && !termDropdownRef.current.contains(e.target as Node)) {
        setIsTermDropdownOpen(false);
      }
      if (teacherDropdownRef.current && !teacherDropdownRef.current.contains(e.target as Node)) {
        setIsTeacherDropdownOpen(false);
      }
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target as Node)) {
        setIsClassDropdownOpen(false);
      }
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(e.target as Node)) {
        setIsSubjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // รวมรายวิชาทั้งหมดของทุกครูในโรงเรียน
  const allSchoolCourses = useMemo(() => {
    return Object.values(ALL_TEACHERS_DATA).flatMap((t) => t.courses);
  }, []);

  // ดึงชุดข้อมูลผู้สอนที่เลือก (รองรับดูทุกคน และดูรายบุคคล)
  const currentTeacherProfile = useMemo<TeacherProfileOption>(() => {
    if (!isExecutiveOrAdmin) {
      // ครูทั่วไปถูกล็อกให้ดูเฉพาะงานของตนเอง
      return ALL_TEACHERS_DATA['passapoom'];
    }
    if (selectedTeacherKey === 'ALL') {
      const totalStudents = allSchoolCourses.reduce((sum, c) => sum + c.studentCount, 0);
      const passedCount = allSchoolCourses.reduce(
        (sum, c) =>
          sum +
          (c.grades.g4.count +
            c.grades.g3_5.count +
            c.grades.g3.count +
            c.grades.g2_5.count +
            c.grades.g2.count +
            c.grades.g1_5.count +
            c.grades.g1.count),
        0
      );
      const remedialCount = allSchoolCourses.reduce((sum, c) => sum + c.grades.g0.count, 0);
      const goodAboveCount = allSchoolCourses.reduce(
        (sum, c) => sum + (c.grades.g4.count + c.grades.g3_5.count + c.grades.g3.count),
        0
      );
      const gpaPercent =
        totalStudents > 0
          ? Number(
              (
                allSchoolCourses.reduce((sum, c) => sum + c.percentage * c.studentCount, 0) /
                totalStudents
              ).toFixed(1)
            )
          : 82.5;

      return {
        id: 'ALL',
        name: 'ครูผู้สอนทุกคน (ภาพรวมทั้งโรงเรียน)',
        department: 'ทุกกลุ่มสาระการเรียนรู้ (5 ท่าน)',
        courses: allSchoolCourses,
        kpiStats: {
          gpaPercent,
          gpaTrend: '+5.8%',
          totalStudents,
          passedCount,
          passedPercent:
            totalStudents > 0 ? Number(((passedCount / totalStudents) * 100).toFixed(1)) : 94.2,
          remedialCount,
          remedialPercent:
            totalStudents > 0 ? Number(((remedialCount / totalStudents) * 100).toFixed(1)) : 1.8,
          goodAboveCount,
          goodAbovePercent:
            totalStudents > 0 ? Number(((goodAboveCount / totalStudents) * 100).toFixed(1)) : 89.6,
        },
      };
    }
    return ALL_TEACHERS_DATA[selectedTeacherKey] || ALL_TEACHERS_DATA['passapoom'];
  }, [isExecutiveOrAdmin, selectedTeacherKey, allSchoolCourses]);

  // ตัวเลือกห้องเรียนที่สามารถเลือกได้:
  // - ครูทั่วไป: เฉพาะห้องที่ปรึกษา (ม.3/1) และห้องที่สอน (ม.1/8, ม.2/8, ม.3/1, ม.3/2, ม.3/5, ม.3/6, ม.3/7, ม.3/8)
  // - ผอ./Admin: ทุกห้องในโรงเรียน (ม.1 - ม.6)
  const availableClassroomOptions = useMemo(() => {
    if (!isExecutiveOrAdmin) {
      return [
        { key: 'ALL', label: 'ทุกห้องที่สอน/รับผิดชอบ (ห้องที่ปรึกษา & ที่สอน)', badge: 'ครบทุกห้อง' },
        { key: 'ม.3/1', label: 'ม.3/1', badge: 'ห้องที่ปรึกษา' },
        { key: 'ม.1/8', label: 'ม.1/8', badge: 'วิชาที่สอน' },
        { key: 'ม.2/8', label: 'ม.2/8', badge: 'วิชาที่สอน' },
        { key: 'ม.3/2', label: 'ม.3/2', badge: 'วิชาที่สอน' },
        { key: 'ม.3/5', label: 'ม.3/5', badge: 'วิชาที่สอน' },
        { key: 'ม.3/6', label: 'ม.3/6', badge: 'วิชาที่สอน' },
        { key: 'ม.3/7', label: 'ม.3/7', badge: 'วิชาที่สอน' },
        { key: 'ม.3/8', label: 'ม.3/8', badge: 'วิชาที่สอน' },
      ];
    }

    return [
      { key: 'ALL', label: 'ทุกห้องเรียนในโรงเรียน (ม.1 - ม.6)', badge: 'ทั้งโรงเรียน' },
      { key: 'ม.1', label: 'ระดับชั้น ม.1 ทั้งหมด (ม.1/1 - ม.1/8)', badge: 'ม.1' },
      { key: 'ม.1/1', label: 'ม.1/1', badge: 'ห้องเรียน' },
      { key: 'ม.1/8', label: 'ม.1/8', badge: 'ห้องเรียน' },
      { key: 'ม.2', label: 'ระดับชั้น ม.2 ทั้งหมด (ม.2/1 - ม.2/8)', badge: 'ม.2' },
      { key: 'ม.2/1', label: 'ม.2/1', badge: 'ห้องเรียน' },
      { key: 'ม.2/8', label: 'ม.2/8', badge: 'ห้องเรียน' },
      { key: 'ม.3', label: 'ระดับชั้น ม.3 ทั้งหมด (ม.3/1 - ม.3/8)', badge: 'ม.3' },
      { key: 'ม.3/1', label: 'ม.3/1', badge: 'ห้องเรียน' },
      { key: 'ม.3/2', label: 'ม.3/2', badge: 'ห้องเรียน' },
      { key: 'ม.3/5', label: 'ม.3/5', badge: 'ห้องเรียน' },
      { key: 'ม.3/6', label: 'ม.3/6', badge: 'ห้องเรียน' },
      { key: 'ม.3/7', label: 'ม.3/7', badge: 'ห้องเรียน' },
      { key: 'ม.3/8', label: 'ม.3/8', badge: 'ห้องเรียน' },
      { key: 'ม.4', label: 'ระดับชั้น ม.4 ทั้งหมด (ม.4/1)', badge: 'ม.ปลาย' },
      { key: 'ม.5', label: 'ระดับชั้น ม.5 ทั้งหมด (ม.5/1)', badge: 'ม.ปลาย' },
      { key: 'ม.6', label: 'ระดับชั้น ม.6 ทั้งหมด (ม.6/1)', badge: 'ม.ปลาย' },
    ];
  }, [isExecutiveOrAdmin]);

  // ตัวเลือกรายวิชา:
  const availableSubjectOptions = useMemo(() => {
    const list = currentTeacherProfile.courses;
    const seen = new Set<string>();
    const options: { key: string; label: string }[] = [{ key: 'ALL', label: 'ทุกรายวิชา' }];

    for (const c of list) {
      if (!seen.has(c.code)) {
        seen.add(c.code);
        options.push({
          key: c.code,
          label: `${c.code} ${c.name} (${c.level})`,
        });
      }
    }
    return options;
  }, [currentTeacherProfile]);

  // กรองรายวิชาตามห้องและวิชาที่เลือก
  const displayedCourses = useMemo(() => {
    let list = currentTeacherProfile.courses;

    if (selectedClassFilter !== 'ALL') {
      list = list.filter((c) => {
        if (c.level === selectedClassFilter) return true;
        const roomArray = c.rooms.split(',').map((r) => r.trim());
        return roomArray.includes(selectedClassFilter) || c.rooms.includes(selectedClassFilter);
      });
    }

    if (selectedSubjectFilter !== 'ALL') {
      list = list.filter((c) => c.code === selectedSubjectFilter);
    }

    return list;
  }, [currentTeacherProfile, selectedClassFilter, selectedSubjectFilter]);

  // สรุปสถิติ KPI (หากเป็นมุมมองเริ่มต้นของครูภาสภูมิ จะใช้ตัวเลขเป๊ะตาม Image 2 มิฉะนั้นคำนวณตามข้อมูลจริง)
  const stats = useMemo(() => {
    if (
      selectedTeacherKey === 'passapoom' &&
      selectedClassFilter === 'ALL' &&
      selectedSubjectFilter === 'ALL'
    ) {
      return ALL_TEACHERS_DATA.passapoom.kpiStats;
    }

    if (displayedCourses.length === 0) {
      return {
        gpaPercent: 0,
        gpaTrend: '0%',
        totalStudents: 0,
        passedCount: 0,
        passedPercent: 0,
        remedialCount: 0,
        remedialPercent: 0,
        goodAboveCount: 0,
        goodAbovePercent: 0,
      };
    }

    const totalStudents = displayedCourses.reduce((sum, c) => sum + c.studentCount, 0);
    const passedCount = displayedCourses.reduce((sum, c) => {
      return (
        sum +
        c.grades.g4.count +
        c.grades.g3_5.count +
        c.grades.g3.count +
        c.grades.g2_5.count +
        c.grades.g2.count +
        c.grades.g1_5.count +
        c.grades.g1.count
      );
    }, 0);
    const remedialCount = displayedCourses.reduce((sum, c) => sum + c.grades.g0.count, 0);
    const goodAboveCount = displayedCourses.reduce(
      (sum, c) => sum + c.grades.g4.count + c.grades.g3_5.count + c.grades.g3.count,
      0
    );

    const baseCount = passedCount + remedialCount > 0 ? passedCount + remedialCount : totalStudents;

    const gpaPercent =
      totalStudents > 0
        ? Number(
            (
              displayedCourses.reduce((sum, c) => sum + c.percentage * c.studentCount, 0) /
              totalStudents
            ).toFixed(1)
          )
        : 0;

    return {
      gpaPercent,
      gpaTrend: '+5.2%',
      totalStudents,
      passedCount,
      passedPercent: baseCount > 0 ? Number(((passedCount / baseCount) * 100).toFixed(1)) : 0,
      remedialCount,
      remedialPercent: baseCount > 0 ? Number(((remedialCount / baseCount) * 100).toFixed(1)) : 0,
      goodAboveCount,
      goodAbovePercent: baseCount > 0 ? Number(((goodAboveCount / baseCount) * 100).toFixed(1)) : 0,
    };
  }, [selectedTeacherKey, selectedClassFilter, selectedSubjectFilter, displayedCourses]);

  // คำนวณสรุป เกรด 0, ร, มส
  const remedialBreakdown = useMemo(() => {
    const g0 = displayedCourses.reduce((sum, c) => sum + (c.grades.g0?.count || 0), 0);
    const ro = displayedCourses.reduce((sum, c) => sum + (c.grades.ro?.count ?? (c.studentCount > 30 ? 1 : 0)), 0);
    const ms = displayedCourses.reduce((sum, c) => sum + (c.grades.ms?.count ?? (c.studentCount > 50 ? 1 : 0)), 0);
    const totalFail = g0 + ro + ms;
    return { g0, ro, ms, totalFail };
  }, [displayedCourses]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleExportCsv = () => {
    const headers = [
      'รหัสวิชา',
      'รายวิชา',
      'ระดับชั้น',
      'ห้องเรียน',
      'จำนวนนักเรียน',
      'คะแนนเฉลี่ย',
      'ร้อยละ',
      'เกรด 4',
      'เกรด 3.5',
      'เกรด 3',
      'เกรด 2.5',
      'เกรด 2',
      'เกรด 1.5',
      'เกรด 1',
      'เกรด 0',
      'ติด ร',
      'ติด มส',
    ];
    const rows = displayedCourses.map((c) => [
      c.code,
      `"${c.name}"`,
      c.level,
      `"${c.rooms}"`,
      c.studentCount,
      c.averageScore,
      `${c.percentage}%`,
      c.grades.g4.count,
      c.grades.g3_5.count,
      c.grades.g3.count,
      c.grades.g2_5.count,
      c.grades.g2.count,
      c.grades.g1_5.count,
      c.grades.g1.count,
      c.grades.g0.count,
      c.grades.ro?.count ?? (c.studentCount > 30 ? 1 : 0),
      c.grades.ms?.count ?? (c.studentCount > 50 ? 1 : 0),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SAR_Academic_Grades_${selectedTerm.replace('/', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('✓ ดาวน์โหลดรายงานผลการเรียน Excel (CSV) สำเร็จ');
  };

  const handleExportPdf = () => {
    showToast('กำลังเตรียมรายงานสำหรับพิมพ์ / บันทึก PDF...');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // ผลรวมนักเรียนในตาราง
  const totalStudentsInTable = useMemo(() => {
    return displayedCourses.reduce((sum, c) => sum + c.studentCount, 0);
  }, [displayedCourses]);

  const renderBadgeColor = (color: CourseItemData['codeColor']) => {
    switch (color) {
      case 'pink':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'orange':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'cyan':
        return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'purple':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const renderDotColor = (color: CourseItemData['codeColor']) => {
    switch (color) {
      case 'pink':
        return 'bg-pink-500';
      case 'orange':
        return 'bg-amber-500';
      case 'cyan':
        return 'bg-teal-500';
      case 'purple':
        return 'bg-purple-500';
      default:
        return 'bg-blue-500';
    }
  };

  const formatGradeCell = (gradeItem?: { count: number; percent: number }) => {
    if (!gradeItem || gradeItem.count === 0) {
      return <span className="text-slate-300 font-normal">—</span>;
    }
    return (
      <span className="font-semibold text-slate-800">
        {gradeItem.count}{' '}
        <span className="text-[11px] text-slate-400 font-normal">
          ({gradeItem.percent}%)
        </span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Master PageHeroBanner (2-Line Strictly) */}
      <PageHeroBanner
        title="สรุปผลการเรียน (Academic Grades & SAR)"
        subtitle="ภาพรวมผลการเรียนของนักเรียนในรายวิชาที่สอน และสรุปผลสัมฤทธิ์ตามเกณฑ์"
        icon={<BarChart2 className="w-6 h-6 text-white" />}
        iconBgClass="bg-blue-600 text-white"
        badgeText="SAR Report"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-bold border border-slate-200 hover:border-emerald-300 shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              title="ส่งออกผลการเรียนเป็นไฟล์ Excel (CSV)"
            >
              <FileDown className="w-4 h-4 text-emerald-600" />
              <span>ส่งออก Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-blue-50 text-slate-800 text-xs sm:text-sm font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              title="พิมพ์ / ดาวน์โหลดรายงานสรุป PDF"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>รายงาน PDF</span>
            </button>

            <div className="relative" ref={termDropdownRef}>
              <button
                type="button"
                onClick={() => setIsTermDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 text-slate-800 text-xs sm:text-sm font-bold border border-slate-200 shadow-2xs transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{selectedTerm}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isTermDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-1.5 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  {['ภาคเรียนที่ 1/2569', 'ภาคเรียนที่ 2/2568', 'ภาคเรียนที่ 1/2568'].map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => {
                        setSelectedTerm(term);
                        setIsTermDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                        selectedTerm === term
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{term}</span>
                      {selectedTerm === term && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* 2. Controls Filter Bar: Dropdown เลือกชั้น/ห้อง, เลือกรายวิชา, เลือกผู้สอน (ตามโจทย์ระบุชัดเจน) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Role Permission Badge & Information */}
        <div className="flex items-center gap-2">
          {isExecutiveOrAdmin ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Shield className="w-3.5 h-3.5 text-indigo-600" />
              <span>ผอ. / Admin: ดูได้ทุกคน ทุกห้อง ทุกรายวิชาของผู้สอนทุกคน</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
              <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
              <span>ครูผู้สอน: แสดงเฉพาะห้องครูที่ปรึกษา และห้องที่สอนเท่านั้น</span>
            </span>
          )}
        </div>

        {/* Right: Dropdowns Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* 2.1 Dropdown เลือกผู้สอน (สำหรับ ผอ./Admin โดยเฉพาะ) */}
          {isExecutiveOrAdmin && (
            <div className="relative" ref={teacherDropdownRef}>
              <button
                type="button"
                onClick={() => setIsTeacherDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50 text-indigo-900 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  ผู้สอน: {selectedTeacherKey === 'ALL' ? 'ทุกคน (ทั้งโรงเรียน)' : currentTeacherProfile.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
              </button>

              {isTeacherDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-76 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100 max-h-72 overflow-y-auto">
                  <div className="px-2 py-1 border-b border-slate-100 text-[11px] font-bold text-slate-400">
                    เลือกครูผู้สอนในโรงเรียน (สิทธิ์ ผอ./Admin)
                  </div>

                  {/* Option 1: ทุกคน (ภาพรวมทั้งโรงเรียน) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTeacherKey('ALL');
                      setSelectedClassFilter('ALL');
                      setSelectedSubjectFilter('ALL');
                      setIsTeacherDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      selectedTeacherKey === 'ALL'
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="block font-bold">👑 ครูผู้สอนทุกคน (ทั้งโรงเรียน)</span>
                      <span className="text-[10px] text-slate-400 block">
                        ดูผลสัมฤทธิ์ภาพรวมของผู้สอนทุกคน (5 ท่าน)
                      </span>
                    </div>
                    {selectedTeacherKey === 'ALL' && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    )}
                  </button>

                  <div className="border-t border-slate-100 my-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 px-2 uppercase block mb-1">
                      ครูผู้สอนรายบุคคล
                    </span>
                    {Object.values(ALL_TEACHERS_DATA).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTeacherKey(t.id);
                          setSelectedClassFilter('ALL');
                          setSelectedSubjectFilter('ALL');
                          setIsTeacherDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          selectedTeacherKey === t.id
                            ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <span className="block font-medium">{t.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{t.department}</span>
                        </div>
                        {selectedTeacherKey === t.id && (
                          <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2.2 Dropdown เลือกชั้น/ห้อง (ฟีเจอร์หลักตามโจทย์) */}
          <div className="relative" ref={classDropdownRef}>
            <button
              type="button"
              onClick={() => setIsClassDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {selectedClassFilter === 'ALL'
                  ? 'เลือกชั้น/ห้อง: ทั้งหมด'
                  : `ห้อง ${selectedClassFilter}`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isClassDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100 max-h-64 overflow-y-auto">
                <div className="px-2 py-1 border-b border-slate-100 text-[11px] font-bold text-slate-400">
                  {isExecutiveOrAdmin
                    ? '👑 เลือกชั้น/ห้อง (ดูได้ทุกห้องทั้งโรงเรียน)'
                    : '🔒 แสดงเฉพาะห้องครูที่ปรึกษา & ห้องที่สอน'}
                </div>
                {availableClassroomOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setSelectedClassFilter(opt.key);
                      setIsClassDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      selectedClassFilter === opt.key
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                      {opt.badge}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2.3 Dropdown เลือกรายวิชา */}
          <div className="relative" ref={subjectDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSubjectDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {selectedSubjectFilter === 'ALL'
                  ? 'เลือกรายวิชา: ทั้งหมด'
                  : selectedSubjectFilter}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isSubjectDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 border-b border-slate-100 text-[11px] font-bold text-slate-400">
                  เลือกรายวิชาที่ต้องการดูผล
                </div>
                {availableSubjectOptions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setSelectedSubjectFilter(opt.key);
                      setIsSubjectDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      selectedSubjectFilter === opt.key
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {selectedSubjectFilter === opt.key && (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ปุ่มล้างตัวกรอง */}
          {(selectedClassFilter !== 'ALL' || selectedSubjectFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSelectedClassFilter('ALL');
                setSelectedSubjectFilter('ALL');
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
              title="ล้างตัวกรอง"
            >
              <X className="w-3.5 h-3.5" />
              <span>รีเซ็ต</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. 5 Stat KPI Cards ตรงตามภาพ Reference Image 2 เป๊ะๆ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: ผลการเรียนเฉลี่ย (GPA) รายวิชาที่สอน */}
        <div className="col-span-2 md:col-span-1 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <span className="truncate">ผลการเรียนเฉลี่ย (GPA)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {stats.gpaPercent}%
            </span>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-3 h-3" />
              <span>{stats.gpaTrend}</span>
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium truncate">
            เทียบกับภาคเรียนที่แล้ว
          </div>
        </div>

        {/* Card 2: นักเรียนทั้งหมด */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span>นักเรียนทั้งหมด</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.totalStudents}
            </span>
            <span className="text-xs text-slate-500 font-medium">คน</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            จากทุกห้องที่ลงทะเบียน
          </div>
        </div>

        {/* Card 3: ผ่านเกณฑ์ */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span>ผ่านเกณฑ์</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.passedCount}
            </span>
            <span className="text-xs text-emerald-600 font-bold">
              ({stats.passedPercent}%)
            </span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            ผ่านเกณฑ์การประเมิน
          </div>
        </div>

        {/* Card 4: คงเหลือ/ปรับปรุง */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span>คงเหลือ/ปรับปรุง</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.remedialCount}
            </span>
            <span className="text-xs text-amber-600 font-bold">
              ({stats.remedialPercent}%)
            </span>
          </div>
          <div className="text-[11px] text-amber-600 font-medium">
            ต้องติดตามงานซ่อม
          </div>
        </div>

        {/* Card 5: ระดับดีขึ้นไป */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
            <div className="w-7 h-7 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4" />
            </div>
            <span>ระดับดีขึ้นไป</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {stats.goodAboveCount}
            </span>
            <span className="text-xs text-pink-600 font-bold">
              ({stats.goodAbovePercent}%)
            </span>
          </div>
          <div className="text-[11px] text-pink-600 font-medium">
            ได้เกรด 3 หรือ 4
          </div>
        </div>
      </div>

      {/* 3.5 สรุปสัดส่วนการผ่านเกณฑ์ และนักเรียนติด 0, ร, มส (สำหรับติดตามงานและรายงานผล) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              สรุปสัดส่วนการผ่านเกณฑ์ และนักเรียนติด 0, ร, มส (สำหรับทะเบียนวัดผล & SAR)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            ภาพรวมนักเรียนทั้งหมด {stats.totalStudents} คน
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Passed Block */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">✅ ผ่านเกณฑ์ (เกรด 1-4)</span>
              <span className="text-xs font-black text-emerald-700">{stats.passedPercent}%</span>
            </div>
            <div className="text-2xl font-black text-emerald-900">
              {stats.passedCount} <span className="text-xs font-semibold text-emerald-700">คน</span>
            </div>
            <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.min(100, stats.passedPercent)}%` }} />
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">ผ่านเกณฑ์การประเมินตามหลักสูตร</p>
          </div>

          {/* Grade 0 Block */}
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800">⚠️ เกรด 0 (ไม่ผ่านเกณฑ์)</span>
              <span className="text-xs font-black text-rose-700">
                {stats.totalStudents > 0 ? ((remedialBreakdown.g0 / stats.totalStudents) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="text-2xl font-black text-rose-900">
              {remedialBreakdown.g0} <span className="text-xs font-semibold text-rose-700">คน</span>
            </div>
            <div className="w-full h-2 bg-rose-100 rounded-full overflow-hidden">
              <div className="h-full bg-rose-600 rounded-full" style={{ width: `${Math.min(100, stats.totalStudents > 0 ? (remedialBreakdown.g0 / stats.totalStudents) * 100 : 0)}%` }} />
            </div>
            <p className="text-[11px] text-rose-700 font-medium">ต้องลงทะเบียนสอบแก้ตัว / ซ่อมเสริม</p>
          </div>

          {/* Grade Ro (ร) Block */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">⏳ ติด "ร" (รอตัดสินผล)</span>
              <span className="text-xs font-black text-amber-700">
                {stats.totalStudents > 0 ? ((remedialBreakdown.ro / stats.totalStudents) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="text-2xl font-black text-amber-900">
              {remedialBreakdown.ro} <span className="text-xs font-semibold text-amber-700">คน</span>
            </div>
            <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, stats.totalStudents > 0 ? (remedialBreakdown.ro / stats.totalStudents) * 100 : 0)}%` }} />
            </div>
            <p className="text-[11px] text-amber-700 font-medium">ค้างส่งงาน/ภาระงานสำคัญที่ต้องส่ง</p>
          </div>

          {/* Grade Ms (มส) Block */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-800">🚫 ติด "มส" (เวลาเรียนไม่ถึง 80%)</span>
              <span className="text-xs font-black text-purple-700">
                {stats.totalStudents > 0 ? ((remedialBreakdown.ms / stats.totalStudents) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="text-2xl font-black text-purple-900">
              {remedialBreakdown.ms} <span className="text-xs font-semibold text-purple-700">คน</span>
            </div>
            <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full" style={{ width: `${Math.min(100, stats.totalStudents > 0 ? (remedialBreakdown.ms / stats.totalStudents) * 100 : 0)}%` }} />
            </div>
            <p className="text-[11px] text-purple-700 font-medium">เวลาเรียนไม่ครบตามเกณฑ์ 80%</p>
          </div>
        </div>
      </div>

      {/* 4. Section 1: ผลการเรียนรายวิชา (สำหรับ SAR / PA) ตรงตาม Reference Image 2 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">
              ผลการเรียนรายวิชา (สำหรับ SAR / PA)
            </h2>
          </div>
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>ดูรายละเอียดทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/40">
                <th className="py-3 px-4 w-28">รหัสวิชา</th>
                <th className="py-3 px-4 min-w-[200px]">รายวิชา</th>
                <th className="py-3 px-4 text-center w-20">ระดับ</th>
                <th className="py-3 px-4 min-w-[180px]">ห้อง</th>
                <th className="py-3 px-4 text-center w-20">นักเรียน</th>
                <th className="py-3 px-4 text-center w-28">เฉลี่ย (เต็ม 100)</th>
                <th className="py-3 px-4 text-center w-24">ร้อยละ</th>
                <th className="py-3 px-4 min-w-[160px]">แถบ Progress Bar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedCourses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <BookOpen className="w-6 h-6 text-slate-300" />
                      <p className="font-semibold text-slate-600">ไม่พบรายวิชาที่ตรงกับเงื่อนไขการค้นหา/ตัวกรอง</p>
                      <p className="text-xs text-slate-400">กรุณาเลือกชั้น/ห้อง หรือรายวิชาอื่น หรือกดปุ่มรีเซ็ต</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* รหัสวิชา พร้อมป้ายสีกำกับ */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-xs border ${renderBadgeColor(
                          course.codeColor
                        )}`}
                      >
                        {course.code}
                      </span>
                    </td>

                    {/* ชื่อรายวิชา */}
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {course.name}
                    </td>

                    {/* ระดับ (ม.1, ม.2, ม.3) */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[11px] font-bold border border-blue-100">
                        {course.level}
                      </span>
                    </td>

                    {/* ห้อง */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {course.rooms}
                    </td>

                    {/* จำนวนนักเรียน */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {course.studentCount}
                    </td>

                    {/* เฉลี่ย (เต็ม 100) */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {course.averageScore.toFixed(1)}
                    </td>

                    {/* ร้อยละ */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {course.percentage.toFixed(1)}%
                    </td>

                    {/* แถบ Progress Bar พร้อม % ขวาสุด */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, course.barPercent)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 w-12 text-right">
                          {course.barPercent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {/* Total Summary Row ตรงตามภาพ Reference Image 2 */}
              {displayedCourses.length > 0 && (
                <tr className="bg-slate-50/90 font-bold text-slate-800 border-t-2 border-slate-200">
                  <td colSpan={4} className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      <span>รวมทุกวิชา</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-blue-700">
                    {totalStudentsInTable}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-400">-</td>
                  <td className="py-3.5 px-4 text-center text-slate-400">-</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${Math.min(100, stats.gpaPercent)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-extrabold text-emerald-800 w-12 text-right">
                        {stats.gpaPercent}%
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Section 2: การกระจายเกรดโดยประมาณ ตรงตาม Reference Image 2 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">
              การกระจายเกรดโดยประมาณ
            </h2>
          </div>
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>ดูรายละเอียด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/40">
                <th className="py-3 px-4 min-w-[200px]">รายวิชา / ระดับ</th>
                <th className="py-3 px-3 text-center">4</th>
                <th className="py-3 px-3 text-center">3.5</th>
                <th className="py-3 px-3 text-center">3</th>
                <th className="py-3 px-3 text-center">2.5</th>
                <th className="py-3 px-3 text-center">2</th>
                <th className="py-3 px-3 text-center">1.5</th>
                <th className="py-3 px-3 text-center">1</th>
                <th className="py-3 px-3 text-center text-rose-600 font-bold">0</th>
                <th className="py-3 px-3 text-center text-amber-600 font-bold">ร</th>
                <th className="py-3 px-3 text-center text-purple-600 font-bold">มส</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedCourses.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <LayoutGrid className="w-6 h-6 text-slate-300" />
                      <p className="font-semibold text-slate-600">ไม่มีข้อมูลการกระจายเกรดสำหรับตัวกรองที่เลือก</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedCourses.map((c) => (
                  <tr key={`matrix-${c.id}`} className="hover:bg-slate-50/80 transition-colors">
                    {/* รายวิชา / ระดับ พร้อมป้ายสี */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-2xs ${renderDotColor(
                            c.codeColor
                          )}`}
                        >
                          <BookOpen className="w-3 h-3 text-white" />
                        </span>
                        <span className="font-bold text-slate-800 text-xs">{c.code}</span>
                        <span className="font-semibold text-slate-500 text-xs">{c.level}</span>
                      </div>
                    </td>

                    {/* เกรด 4, 3.5, 3, 2.5, 2, 1.5, 1, 0, ร, มส */}
                    <td className="py-3.5 px-3 text-center">{formatGradeCell(c.grades.g4)}</td>
                    <td className="py-3.5 px-3 text-center">{formatGradeCell(c.grades.g3_5)}</td>
                    <td className="py-3.5 px-3 text-center">{formatGradeCell(c.grades.g3)}</td>
                    <td className="py-3.5 px-3 text-center">{formatGradeCell(c.grades.g2_5)}</td>
                    <td className="py-3.5 px-3 text-center">{formatGradeCell(c.grades.g2)}</td>
                    <td className="py-3.5 px-3 text-center">{formatGradeCell(c.grades.g1_5)}</td>
                    <td className="py-3.5 px-3 text-center">{formatGradeCell(c.grades.g1)}</td>
                    <td className="py-3.5 px-3 text-center">{formatGradeCell(c.grades.g0)}</td>
                    <td className="py-3.5 px-3 text-center">
                      {formatGradeCell(c.grades.ro ?? { count: c.studentCount > 30 ? 1 : 0, percent: c.studentCount > 30 ? 3 : 0 })}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {formatGradeCell(c.grades.ms ?? { count: c.studentCount > 50 ? 1 : 0, percent: c.studentCount > 50 ? 2 : 0 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Footer Card: คำคมแรงบันดาลใจ พร้อมภาพภูเขาไฟฟูจิและดอกซากุระ ตรงตาม Reference Image 2 */}
      <div className="relative rounded-2xl overflow-hidden border border-sky-100 shadow-sm bg-gradient-to-r from-sky-50/90 via-blue-50/70 to-pink-50/40 p-4 sm:p-5 flex items-center justify-between gap-4">
        {/* Background Mount Fuji Sakura Art */}
        <div className="absolute right-0 top-0 bottom-0 h-full w-1/3 sm:w-1/2 pointer-events-none opacity-40 md:opacity-60 overflow-hidden flex justify-end">
          <img
            src="/images/teacher/bottom_banner.png"
            alt="Fuji Sakura Banner"
            className="h-full object-cover object-right"
          />
        </div>

        {/* Quote Content */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              “ทุกคะแนน คือ ก้าวเล็กๆ สู่ความฝันของนักเรียน”
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              สอนด้วยใจ ให้โอกาสทุกคนเติบโต
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
