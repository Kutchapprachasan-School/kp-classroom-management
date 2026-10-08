/**
 * coursesCurriculumService.ts
 * บริการจัดการหลักสูตร รายวิชา สื่อการสอนประจำหน่วย และการคัดลอกโครงสร้างแผนการสอนข้ามปีการศึกษา
 * สอดคล้องกับมาตรฐาน Pastel Anime Education Dashboard
 */

export type MediaType = 'DOCUMENT' | 'WORKSHEET' | 'EXAM_QUIZ' | 'VIDEO' | 'LINK';

export interface UnitMediaItem {
  id: string;
  title: string;
  mediaType: MediaType;
  fileUrl?: string;
  externalUrl?: string;
  fileSize?: string;
  fileType?: string; // e.g. 'PDF', 'PPTX', 'DOCX', 'MP4', 'QUIZ'
  linkedExamId?: string; // เชื่อมโยงกับชุดข้อสอบ
  isPublishedToStudents: boolean;
  allowedClassrooms?: string[]; // ขอบเขตห้องเรียนที่เห็นสื่อนี้ (ถ้าไม่ระบุจะตามห้องของรายวิชา)
  createdAt: string;
}

export interface CurriculumUnit {
  id: string;
  unitNo: number;
  title: string;
  description: string;
  sgsRef: string; // เช่น 'คะแนนเก็บก่อนกลางภาค (หน่วยที่ 1)'
  maxScore: number;
  weekStart?: number;
  weekEnd?: number;
  mediaItems: UnitMediaItem[];
}

export interface CourseCurriculumRecord {
  id: string;
  code: string;
  name: string;
  strand: string; // กลุ่มสาระการเรียนรู้
  level: string; // เช่น 'ม.3'
  credits: number;
  periodsPerWeek: number;
  academicYear: string; // เช่น '2569'
  term: string; // เช่น '1'
  assignedClassrooms: string[]; // เช่น ['ม.3/1', 'ม.3/2']
  teacherName?: string;
  units: CurriculumUnit[];
}

const STORAGE_KEY = 'kp_courses_curriculum';

// ข้อมูลเริ่มต้นสำหรับระบบ
const INITIAL_COURSES: CourseCurriculumRecord[] = [
  {
    id: 'course-art-3',
    code: 'ศ23101',
    name: 'ศิลปะ 3 (ทัศนศิลป์)',
    strand: 'กลุ่มสาระการเรียนรู้ศิลปะ',
    level: 'ม.3',
    credits: 1.5,
    periodsPerWeek: 3,
    academicYear: '2569',
    term: '1',
    assignedClassrooms: ['ม.3/1', 'ม.3/2', 'ม.3/8'],
    teacherName: 'นายภาสภูมิ เรืองปราชญ์',
    units: [
      {
        id: 'u-1',
        unitNo: 1,
        title: 'หน่วยที่ 1: ทัศนธาตุและหลักการออกแบบร่วมสมัย',
        description: 'การนำจุด เส้น สี และน้ำหนักแสงเงามาประยุกต์ในผลงานศิลปะอีสานประยุกต์',
        sgsRef: 'คะแนนเก็บก่อนกลางภาค (หน่วยที่ 1)',
        maxScore: 15,
        weekStart: 1,
        weekEnd: 4,
        mediaItems: [
          {
            id: 'm-1-1',
            title: 'สไลด์ประกอบการสอน_ทัศนธาตุและลายไทย.pdf',
            mediaType: 'DOCUMENT',
            fileUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80',
            fileSize: '4.2 MB',
            fileType: 'PDF',
            isPublishedToStudents: true,
            allowedClassrooms: ['ม.3/1', 'ม.3/2', 'ม.3/8'],
            createdAt: '2026-05-15',
          },
          {
            id: 'm-1-2',
            title: 'ใบงานที่ 1.1: ออกแบบลวดลายประยุกต์ลงบนกระดาษ A4',
            mediaType: 'WORKSHEET',
            fileUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&q=80',
            fileSize: '1.1 MB',
            fileType: 'PDF',
            isPublishedToStudents: true,
            allowedClassrooms: ['ม.3/1', 'ม.3/2', 'ม.3/8'],
            createdAt: '2026-05-18',
          },
          {
            id: 'm-1-3',
            title: 'แบบทดสอบเก็บคะแนนหน่วยที่ 1 (Online Quiz)',
            mediaType: 'EXAM_QUIZ',
            linkedExamId: 'exam-quiz-1',
            fileType: 'QUIZ',
            isPublishedToStudents: true,
            allowedClassrooms: ['ม.3/1', 'ม.3/2', 'ม.3/8'],
            createdAt: '2026-05-25',
          },
        ],
      },
      {
        id: 'u-2',
        unitNo: 2,
        title: 'หน่วยที่ 2: การจัดองค์ประกอบศิลป์และวงจรสี',
        description: 'การใช้สีวรรณะอุ่นและวรรณะเย็นสร้างความขัดแย้งที่กลมกลืน (Harmonious Contrast)',
        sgsRef: 'คะแนนเก็บก่อนกลางภาค (หน่วยที่ 2)',
        maxScore: 15,
        weekStart: 5,
        weekEnd: 8,
        mediaItems: [
          {
            id: 'm-2-1',
            title: 'คู่มือการผสมสีน้ำและเทคนิคเปียกบนเปียก.pdf',
            mediaType: 'DOCUMENT',
            fileUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
            fileSize: '2.8 MB',
            fileType: 'PDF',
            isPublishedToStudents: true,
            createdAt: '2026-06-10',
          },
        ],
      },
      {
        id: 'u-3',
        unitNo: 3,
        title: 'หน่วยที่ 3: สอบกลางภาคเรียน',
        description: 'ประเมินผลสัมฤทธิ์ทางการเรียนรู้กลางภาคเรียนที่ 1',
        sgsRef: 'สอบกลางภาค (หน่วยที่ 3)',
        maxScore: 20,
        weekStart: 9,
        weekEnd: 10,
        mediaItems: [
          {
            id: 'm-3-1',
            title: 'ข้อสอบกลางภาค_ศ23101_ปรนัยและอัตนัย',
            mediaType: 'EXAM_QUIZ',
            linkedExamId: 'exam-midterm-art',
            fileType: 'QUIZ',
            isPublishedToStudents: true,
            createdAt: '2026-07-01',
          },
        ],
      },
    ],
  },
  {
    id: 'course-jp-1',
    code: 'ญ31201',
    name: 'ภาษาญี่ปุ่น 1',
    strand: 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ',
    level: 'ม.3',
    credits: 1.0,
    periodsPerWeek: 2,
    academicYear: '2569',
    term: '1',
    assignedClassrooms: ['ม.3/1', 'ม.3/2'],
    teacherName: 'นายภาสภูมิ เรืองปราชญ์',
    units: [
      {
        id: 'u-jp-1',
        unitNo: 1,
        title: 'หน่วยที่ 1: ตัวอักษรฮิรางานะ 46 ตัวและเสียงควบ',
        description: 'เรียนรู้พยัญชนะ สระ และการประสมเสียงพื้นฐานในภาษาญี่ปุ่น',
        sgsRef: 'คะแนนเก็บก่อนกลางภาค (หน่วยที่ 1)',
        maxScore: 10,
        weekStart: 1,
        weekEnd: 3,
        mediaItems: [
          {
            id: 'm-jp-1-1',
            title: 'ตารางคัดตัวอักษรฮิรางานะ_A4.pdf',
            mediaType: 'WORKSHEET',
            fileSize: '1.8 MB',
            fileType: 'PDF',
            isPublishedToStudents: true,
            createdAt: '2026-05-15',
          },
        ],
      },
    ],
  },
];

class CoursesCurriculumService {
  private cache: CourseCurriculumRecord[] | null = null;

  private load(): CourseCurriculumRecord[] {
    if (this.cache) return this.cache;
    if (typeof window === 'undefined') return INITIAL_COURSES;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.cache = JSON.parse(raw);
        return this.cache!;
      }
    } catch {
      // ignore
    }

    this.cache = [...INITIAL_COURSES];
    this.save();
    return this.cache;
  }

  private save(): void {
    if (typeof window === 'undefined' || !this.cache) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
      window.dispatchEvent(new CustomEvent('kp-courses-curriculum-updated'));
    } catch {
      // ignore
    }
  }

  public getCourses(academicYear?: string, term?: string): CourseCurriculumRecord[] {
    const all = this.load();
    return all.filter((c) => {
      if (academicYear && c.academicYear !== academicYear) return false;
      if (term && c.term !== term) return false;
      return true;
    });
  }

  public getCourseById(id: string): CourseCurriculumRecord | undefined {
    return this.load().find((c) => c.id === id);
  }

  public createCourse(data: Omit<CourseCurriculumRecord, 'id'>): CourseCurriculumRecord {
    const all = this.load();
    const newCourse: CourseCurriculumRecord = {
      ...data,
      id: `course-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      units: data.units || [],
    };
    all.unshift(newCourse);
    this.save();
    return newCourse;
  }

  public updateCourse(id: string, data: Partial<CourseCurriculumRecord>): CourseCurriculumRecord {
    const all = this.load();
    const index = all.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Course not found');

    all[index] = { ...all[index], ...data };
    this.save();
    return all[index];
  }

  public deleteCourse(id: string): boolean {
    const all = this.load();
    const filtered = all.filter((c) => c.id !== id);
    if (filtered.length !== all.length) {
      this.cache = filtered;
      this.save();
      return true;
    }
    return false;
  }

  public addUnit(courseId: string, unitData: Omit<CurriculumUnit, 'id' | 'mediaItems'>): CurriculumUnit {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Course not found');

    const newUnit: CurriculumUnit = {
      ...unitData,
      id: `unit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      mediaItems: [],
    };
    course.units.push(newUnit);
    this.save();
    return newUnit;
  }

  public updateUnit(courseId: string, unitId: string, data: Partial<CurriculumUnit>): CurriculumUnit {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Course not found');

    const unitIndex = course.units.findIndex((u) => u.id === unitId);
    if (unitIndex === -1) throw new Error('Unit not found');

    course.units[unitIndex] = { ...course.units[unitIndex], ...data };
    this.save();
    return course.units[unitIndex];
  }

  public deleteUnit(courseId: string, unitId: string): boolean {
    const course = this.getCourseById(courseId);
    if (!course) return false;

    const initialLen = course.units.length;
    course.units = course.units.filter((u) => u.id !== unitId);
    if (course.units.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public addMediaItem(
    courseId: string,
    unitId: string,
    mediaData: Omit<UnitMediaItem, 'id' | 'createdAt'>
  ): UnitMediaItem {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Course not found');

    const unit = course.units.find((u) => u.id === unitId);
    if (!unit) throw new Error('Unit not found');

    const newMedia: UnitMediaItem = {
      ...mediaData,
      id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0],
      allowedClassrooms: mediaData.allowedClassrooms || course.assignedClassrooms,
    };
    unit.mediaItems.push(newMedia);
    this.save();
    return newMedia;
  }

  public updateMediaItem(
    courseId: string,
    unitId: string,
    mediaId: string,
    data: Partial<UnitMediaItem>
  ): UnitMediaItem {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Course not found');

    const unit = course.units.find((u) => u.id === unitId);
    if (!unit) throw new Error('Unit not found');

    const mediaIndex = unit.mediaItems.findIndex((m) => m.id === mediaId);
    if (mediaIndex === -1) throw new Error('Media item not found');

    unit.mediaItems[mediaIndex] = { ...unit.mediaItems[mediaIndex], ...data };
    this.save();
    return unit.mediaItems[mediaIndex];
  }

  public deleteMediaItem(courseId: string, unitId: string, mediaId: string): boolean {
    const course = this.getCourseById(courseId);
    if (!course) return false;

    const unit = course.units.find((u) => u.id === unitId);
    if (!unit) return false;

    const initialLen = unit.mediaItems.length;
    unit.mediaItems = unit.mediaItems.filter((m) => m.id !== mediaId);
    if (unit.mediaItems.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  /**
   * คัดลอกโครงสร้างแผนการสอนข้ามปีการศึกษา (Copy Curriculum Across Academic Years)
   * ก๊อปปี้ทั้งรายวิชา หน่วยการเรียนรู้ สัดส่วนคะแนน และลิงก์สื่อการสอนไปยังปีการศึกษาเป้าหมาย
   */
  public copyCurriculumToAcademicYear(
    fromYear: string,
    toYear: string,
    targetTerm: string = '1'
  ): { copiedCount: number } {
    const all = this.load();
    const sourceCourses = all.filter((c) => c.academicYear === fromYear);
    if (sourceCourses.length === 0) return { copiedCount: 0 };

    let copiedCount = 0;
    sourceCourses.forEach((src) => {
      // ตรวจสอบว่ามีวิชานี้ในปีเป้าหมายแล้วหรือไม่
      const exists = all.some(
        (c) => c.code === src.code && c.academicYear === toYear && c.term === targetTerm
      );
      if (!exists) {
        const cloned: CourseCurriculumRecord = {
          ...src,
          id: `course-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          academicYear: toYear,
          term: targetTerm,
          units: src.units.map((u) => ({
            ...u,
            id: `unit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            mediaItems: u.mediaItems.map((m) => ({
              ...m,
              id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            })),
          })),
        };
        all.push(cloned);
        copiedCount++;
      }
    });

    if (copiedCount > 0) {
      this.save();
    }
    return { copiedCount };
  }

  /**
   * คัดลอกรายวิชาและแผนการสอนเฉพาะวิชาไปยังภาคเรียน/ปีการศึกษาใหม่
   * รักษาแผนเก่าไว้ 100% เพื่อให้นักเรียนรุ่นเดิมกลับมาดู ส่งงาน แก้งานย้อนหลังได้
   */
  public copyCourseToNewTerm(
    courseId: string,
    targetYear: string,
    targetTerm: string
  ): CourseCurriculumRecord {
    const all = this.load();
    const src = all.find((c) => c.id === courseId);
    if (!src) throw new Error('Course not found');

    const cloned: CourseCurriculumRecord = {
      ...src,
      id: `course-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      academicYear: targetYear,
      term: targetTerm,
      units: src.units.map((u, uIdx) => ({
        ...u,
        id: `unit-${Date.now()}-${uIdx}-${Math.random().toString(36).slice(2, 6)}`,
        mediaItems: u.mediaItems.map((m, mIdx) => ({
          ...m,
          id: `media-${Date.now()}-${uIdx}-${mIdx}-${Math.random().toString(36).slice(2, 6)}`,
        })),
      })),
    };

    all.unshift(cloned);
    this.save();
    return cloned;
  }
}

export const coursesCurriculumService = new CoursesCurriculumService();
