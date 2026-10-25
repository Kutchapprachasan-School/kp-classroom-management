/**
 * coursesCurriculumService.ts
 * บริการจัดการหลักสูตร รายวิชา สื่อการสอนประจำหน่วย และการคัดลอกโครงสร้างแผนการสอนข้ามปีการศึกษา
 * สอดคล้องกับมาตรฐาน Pastel Anime Education Dashboard
 */

import { academicCalendarService } from './academicCalendarService.ts';
import { activityAuditLogService } from './activityAuditLogService.ts';
import { authService } from './authService.ts';
import { sgsRosterAndSubmissionService } from './sgsRosterAndSubmissionService.ts';

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
  teacherId?: string;
  teacherUsername?: string;
  units: CurriculumUnit[];
}

export interface TrashMediaItem extends UnitMediaItem {
  deletedAt: string;
  originalCourseId: string;
  originalCourseCode: string;
  originalCourseName: string;
  originalUnitId: string;
  originalUnitTitle: string;
}

const STORAGE_KEY = 'kp_courses_curriculum';
const TRASH_STORAGE_KEY = 'kp_curriculum_trash';

/**
 * คำนวณจำนวนคาบต่อสัปดาห์ตามหน่วยกิตและจำนวนห้องเรียน
 * 0.5 หน่วยกิต = 1 คาบ/ห้อง
 * 1.0 หน่วยกิต = 2 คาบ/ห้อง
 * 1.5 หน่วยกิต = 3 คาบ/ห้อง
 * 2.0 หน่วยกิต = 4 คาบ/ห้อง
 */
export const calculatePeriodsPerWeek = (
  credits: number,
  roomCount: number = 1
): {
  periodsPerRoom: number;
  totalPeriodsPerWeek: number;
} => {
  const periodsPerRoom = Math.max(1, Math.round((Number(credits) || 1) * 2));
  const safeRooms = Math.max(1, roomCount);
  return {
    periodsPerRoom,
    totalPeriodsPerWeek: periodsPerRoom * safeRooms,
  };
};

/**
 * ตรวจสอบและดึงระดับชั้นจริงจากรหัสวิชาตามมาตรฐานกระทรวงศึกษาธิการ
 * เช่น ญ21202 -> ม.1, ญ22xxx -> ม.2, ญ23xxx -> ม.3, ญ31202 -> ม.4, ญ32202 -> ม.5, ญ33xxx / ส30xxx / ญ30xxx -> ม.6
 */
export function inferGradeLevelFromCourseCode(code: string): string | null {
  if (!code) return null;
  const clean = code.trim().toUpperCase();
  const m = clean.match(/^[^\d]*([123])([0-9])/);
  if (m) {
    const tier = m[1];
    const gradeDigit = m[2];
    if (tier === '1' || tier === '2') {
      if (gradeDigit === '1') return 'ม.1';
      if (gradeDigit === '2') return 'ม.2';
      if (gradeDigit === '3') return 'ม.3';
    } else if (tier === '3') {
      if (gradeDigit === '1') return 'ม.4';
      if (gradeDigit === '2') return 'ม.5';
      if (gradeDigit === '3' || gradeDigit === '0') return 'ม.6';
    }
  }
  return null;
}

// ข้อมูลเริ่มต้นสำหรับระบบ (Zero Mock Data)
const INITIAL_COURSES: CourseCurriculumRecord[] = [];
class CoursesCurriculumService {
  private cache: CourseCurriculumRecord[] | null = null;

  private load(): CourseCurriculumRecord[] {
    if (this.cache) return this.cache;
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            // Auto-heal any courses that have mismatched assignedClassrooms for their level (e.g. ม.3 having ม.1/1)
            let modified = false;
            parsed.forEach((c: CourseCurriculumRecord) => {
              const inferred = inferGradeLevelFromCourseCode(c.code);
              // หากรหัสวิชาระบุชั้นชัดเจน (เช่น ญ21202 คือ ม.1) ให้ปรับ level ให้ตรงกับรหัสวิชาเสมอ
              if (inferred && c.level !== inferred) {
                c.level = inferred;
                modified = true;
              }

              // ตรวจสอบห้องเรียนเฉพาะทางของวิชา ญ21202 ตามตารางสอนจริงของโรงเรียน (ม.1/1 - ม.1/6)
              if (c.code === 'ญ21202') {
                const targetM1Rooms = ['ม.1/1', 'ม.1/2', 'ม.1/3', 'ม.1/4', 'ม.1/5', 'ม.1/6'];
                if (
                  !Array.isArray(c.assignedClassrooms) ||
                  c.assignedClassrooms.some((r) => r.startsWith('ม.3')) ||
                  c.assignedClassrooms.length < 6
                ) {
                  c.assignedClassrooms = targetM1Rooms;
                  c.level = 'ม.1';
                  c.periodsPerWeek = 6;
                  modified = true;
                }
              }

              if (c.level && Array.isArray(c.assignedClassrooms) && c.assignedClassrooms.length > 0) {
                const levelMatching = c.assignedClassrooms.filter((r) => r.startsWith(c.level));
                if (levelMatching.length > 0 && levelMatching.length < c.assignedClassrooms.length) {
                  c.assignedClassrooms = levelMatching;
                  modified = true;
                } else if (levelMatching.length === 0) {
                  // Assigned rooms were completely from wrong grade (e.g. all ม.1 on a ม.3 course)
                  const fallbackByLevel: Record<string, string[]> = {
                    'ม.1': ['ม.1/1', 'ม.1/2', 'ม.1/3', 'ม.1/4', 'ม.1/5', 'ม.1/6'],
                    'ม.2': ['ม.2/1'],
                    'ม.3': ['ม.3/1', 'ม.3/2'],
                    'ม.4': ['ม.4/4'],
                    'ม.5': ['ม.5/4'],
                    'ม.6': ['ม.6/1', 'ม.6/2', 'ม.6/3'],
                  };
                  c.assignedClassrooms = fallbackByLevel[c.level] || [`${c.level}/1`];
                  modified = true;
                }
              }
            });
            this.cache = parsed;
            if (modified) {
              this.save();
            }
            return this.cache!;
          }
        }
      } catch {
        // ignore
      }
    }

    this.cache = [...INITIAL_COURSES];
    return this.cache;
  }

  private save(): void {
    if (!this.cache) return;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('kp-courses-curriculum-updated'));
      } catch {
        // ignore
      }
    }
  }

  public saveCourses(courses: CourseCurriculumRecord[]): void {
    this.cache = [...courses];
    this.save();
  }

  public getCourses(
    academicYear?: string,
    term?: string,
    teacherIdOrName?: string
  ): CourseCurriculumRecord[] {
    const all = this.load();
    return all.filter((c) => {
      if (academicYear && c.academicYear !== academicYear) return false;
      if (term && c.term !== term) return false;
      if (teacherIdOrName) {
        const matchesTeacher =
          c.teacherId === teacherIdOrName ||
          c.teacherName === teacherIdOrName ||
          c.teacherUsername === teacherIdOrName ||
          (!c.teacherId && !c.teacherName); // Fallback สำหรับวิชาเดิมที่บันทึกก่อนหน้า
        if (!matchesTeacher) return false;
      }
      return true;
    });
  }

  public getCourseById(id: string): CourseCurriculumRecord | undefined {
    return this.load().find((c) => c.id === id);
  }

  public createCourse(data: Omit<CourseCurriculumRecord, 'id'>): CourseCurriculumRecord {
    const all = this.load();
    const currentUser = authService.getCurrentUser();
    const newCourse: CourseCurriculumRecord = {
      ...data,
      teacherId: data.teacherId || currentUser?.id,
      teacherName: data.teacherName || currentUser?.name || 'ครูผู้สอน',
      teacherUsername: data.teacherUsername || currentUser?.username,
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

    const previous = { ...all[index] };
    all[index] = { ...all[index], ...data };
    this.save();

    // Cascade course code/name updates to all term assignments and grading queues
    if (
      (data.code && data.code !== previous.code) ||
      (data.name && data.name !== previous.name)
    ) {
      try {
        sgsRosterAndSubmissionService.cascadeCourseUpdate(
          previous.code,
          data.code || previous.code,
          data.name || previous.name
        );
      } catch (err) {
        console.warn('[coursesCurriculumService] Cascade course update warning:', err);
      }
    }

    try {
      const changedFields: string[] = [];
      if (data.name && data.name !== previous.name) changedFields.push(`ชื่อวิชา (${data.name})`);
      if (data.code && data.code !== previous.code) changedFields.push(`รหัสวิชา (${data.code})`);
      if (data.credits !== undefined && data.credits !== previous.credits) changedFields.push(`หน่วยกิต (${data.credits})`);
      if (data.periodsPerWeek !== undefined && data.periodsPerWeek !== previous.periodsPerWeek) changedFields.push(`คาบ/สัปดาห์ (${data.periodsPerWeek})`);
      if (data.strand && data.strand !== previous.strand) changedFields.push(`กลุ่มสาระ (${data.strand})`);

      const summaryText = changedFields.length > 0
        ? `แก้ไขข้อมูลวิชา ${all[index].code} ${all[index].name}: ${changedFields.join(', ')}`
        : `แก้ไขข้อมูลรายวิชา ${all[index].code} ${all[index].name}`;

      activityAuditLogService.logUpdate(
        'หลักสูตร/วิชา',
        `แก้ไขรายวิชา ${all[index].code}`,
        summaryText,
        1,
        undefined,
        'ครูผู้สอน',
        { courseId: id, code: all[index].code, name: all[index].name }
      ).catch(() => {});
    } catch {
      // safe
    }

    return all[index];
  }

  public deleteCourse(id: string): boolean {
    const all = this.load();
    const courseToDelete = all.find((c) => c.id === id);
    const filtered = all.filter((c) => c.id !== id);
    if (filtered.length !== all.length) {
      this.cache = filtered;
      this.save();

      if (courseToDelete) {
        try {
          activityAuditLogService.logDelete(
            'หลักสูตร/วิชา',
            `ลบรายวิชา ${courseToDelete.code}`,
            `ลบรายวิชา ${courseToDelete.code} ${courseToDelete.name} (ระดับ ${courseToDelete.level}, ${courseToDelete.credits} หน่วยกิต)`,
            1,
            'ครูผู้สอน',
            { courseId: id, code: courseToDelete.code, name: courseToDelete.name }
          ).catch(() => {});
        } catch {
          // safe
        }
      }

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

  // -------------------------------------------------------------
  // ถังขยะสื่อการสอน (Trash / Recycle Bin for Media Items)
  // -------------------------------------------------------------
  private trashCache: TrashMediaItem[] | null = null;

  private loadTrash(): TrashMediaItem[] {
    if (this.trashCache) return this.trashCache;
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(TRASH_STORAGE_KEY);
      if (raw) {
        this.trashCache = JSON.parse(raw);
        return this.trashCache!;
      }
    } catch {
      // ignore
    }
    this.trashCache = [];
    return this.trashCache;
  }

  private saveTrash(): void {
    if (typeof window === 'undefined' || !this.trashCache) return;
    try {
      localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(this.trashCache));
      window.dispatchEvent(new CustomEvent('kp-curriculum-trash-updated'));
    } catch {
      // ignore
    }
  }

  public getTrashMediaItems(): TrashMediaItem[] {
    return this.loadTrash();
  }

  public softDeleteMediaItem(courseId: string, unitId: string, mediaId: string): boolean {
    const course = this.getCourseById(courseId);
    if (!course) return false;

    const unit = course.units.find((u) => u.id === unitId);
    if (!unit) return false;

    const item = unit.mediaItems.find((m) => m.id === mediaId);
    if (!item) return false;

    // Remove from unit
    unit.mediaItems = unit.mediaItems.filter((m) => m.id !== mediaId);
    this.save();

    // Add to trash
    const trash = this.loadTrash();
    const trashItem: TrashMediaItem = {
      ...item,
      deletedAt: new Date().toISOString(),
      originalCourseId: course.id,
      originalCourseCode: course.code,
      originalCourseName: course.name,
      originalUnitId: unit.id,
      originalUnitTitle: unit.title,
    };
    trash.unshift(trashItem);
    this.saveTrash();
    return true;
  }

  public restoreMediaItem(trashMediaId: string): boolean {
    const trash = this.loadTrash();
    const itemIndex = trash.findIndex((t) => t.id === trashMediaId);
    if (itemIndex === -1) return false;

    const item = trash[itemIndex];
    const course = this.getCourseById(item.originalCourseId);
    if (!course) return false;

    let unit = course.units.find((u) => u.id === item.originalUnitId);
    if (!unit && course.units.length > 0) {
      unit = course.units[0];
    }
    if (!unit) return false;

    const {
      deletedAt: _deletedAt,
      originalCourseId: _originalCourseId,
      originalCourseCode: _originalCourseCode,
      originalCourseName: _originalCourseName,
      originalUnitId: _originalUnitId,
      originalUnitTitle: _originalUnitTitle,
      ...restoredMedia
    } = item;

    unit.mediaItems.push(restoredMedia);
    this.save();

    trash.splice(itemIndex, 1);
    this.saveTrash();
    return true;
  }

  public permanentDeleteMediaItem(trashMediaId: string): boolean {
    const trash = this.loadTrash();
    const len = trash.length;
    this.trashCache = trash.filter((t) => t.id !== trashMediaId);
    if (this.trashCache.length !== len) {
      this.saveTrash();
      return true;
    }
    return false;
  }

  public emptyTrash(): void {
    this.trashCache = [];
    this.saveTrash();
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

  /**
   * ตรวจสอบว่าสามารถลงคาบเรียนนี้ได้หรือไม่ โดยไม่เกินโควตาตามหน่วยกิต
   * 0.5 หน่วยกิต = 1 คาบ/ห้อง
   * 1.0 หน่วยกิต = 2 คาบ/ห้อง
   * 1.5 หน่วยกิต = 3 คาบ/ห้อง
   * 2.0 หน่วยกิต = 4 คาบ/ห้อง
   */
  public canAssignPeriod(
    matrixSlots: Array<{
      id?: string;
      subjectCode?: string;
      room?: string;
      isFreePeriod?: boolean;
      isLunchSlot?: boolean;
      status?: string;
    }>,
    courseCode: string,
    room: string,
    excludeSlotId?: string,
    academicYear?: string,
    term?: string
  ): {
    allowed: boolean;
    currentCount: number;
    maxPeriods: number;
    reason?: string;
    course?: CourseCurriculumRecord;
  } {
    const activeTerm = academicCalendarService.getActiveTerm();
    const targetYear = academicYear || (activeTerm ? String(activeTerm.year) : '2569');
    const targetTerm = term || (activeTerm ? String(activeTerm.semesterNo) : '1');

    // 1. ค้นหารายวิชาในเทอมเป้าหมายก่อน
    let course = this.getCourses(targetYear, targetTerm).find(
      (c) => c.code.trim() === courseCode.trim()
    );

    // 2. หากไม่พบในเทอมเป้าหมาย ให้ค้นหาจากหลักสูตรทั้งหมดของโรงเรียน (รองรับวิชาที่บันทึกข้ามเทอม หรือจัดตารางล่วงหน้า)
    if (!course) {
      course = this.load().find((c) => c.code.trim() === courseCode.trim());
    }

    if (!course) {
      return {
        allowed: false,
        currentCount: 0,
        maxPeriods: 0,
        reason: `ไม่พบรายวิชารหัส "${courseCode}" ในหลักสูตรที่เลือกใช้ (กรุณาเพิ่มวิชานี้ในเมนูหลักสูตรก่อน)`,
      };
    }

    const normalizedTargetRoom = (room || '').split('•')[0].trim();
    const maxPeriods = Math.max(1, Math.round((Number(course.credits) || 1) * 2));

    const currentCount = matrixSlots.filter((s) => {
      if (s.id && excludeSlotId && s.id === excludeSlotId) return false;
      if (s.isFreePeriod || s.isLunchSlot || s.status === 'LUNCH' || !s.subjectCode) return false;
      if (s.subjectCode.trim() !== course.code.trim()) return false;
      const slotRoom = (s.room || '').split('•')[0].trim();
      return (
        slotRoom === normalizedTargetRoom ||
        slotRoom.includes(normalizedTargetRoom) ||
        normalizedTargetRoom.includes(slotRoom)
      );
    }).length;

    if (currentCount >= maxPeriods) {
      return {
        allowed: false,
        currentCount,
        maxPeriods,
        course,
        reason: `วิชา ${course.code} ${course.name} มีภาระการสอน ${course.credits} หน่วยกิต (${maxPeriods} คาบ/ห้อง) สำหรับห้อง ${normalizedTargetRoom} ซึ่งลงครบโควตาแล้ว (${currentCount}/${maxPeriods} คาบ) ไม่สามารถลงเกินได้`,
      };
    }

    return {
      allowed: true,
      currentCount,
      maxPeriods,
      course,
    };
  }

  /**
   * ดึงรายการคาบที่รอจัดตาราง (Waiting Pool) เฉพาะที่มีในหลักสูตรที่เลือกใช้
   * คำนวณจาก (โควตาสูงสุดตามหน่วยกิต - จำนวนคาบที่ลงตารางแล้ว)
   */
  public getCurriculumWaitingPoolSlots(
    matrixSlots: Array<{
      id?: string;
      subjectCode?: string;
      room?: string;
      isFreePeriod?: boolean;
      isLunchSlot?: boolean;
      status?: string;
      teacherId?: string;
    }>,
    academicYear?: string,
    term?: string,
    teacherIdOrName?: string
  ): Array<{
    id: string;
    day: 'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์';
    period: number;
    subjectCode: string;
    subjectName: string;
    room: string;
    credits: string;
    totalPeriods: string;
    colorTheme: 'blue' | 'teal' | 'purple' | 'green' | 'pink' | 'amber';
    category: 'subject';
    isFreePeriod: boolean;
    status: 'UNCHECKED';
    subjectIcon?: string;
    teacherId?: string;
    teacherName?: string;
  }> {
    const activeTerm = academicCalendarService.getActiveTerm();
    const targetYear = academicYear || (activeTerm ? String(activeTerm.year) : '2569');
    const targetTerm = term || (activeTerm ? String(activeTerm.semesterNo) : '1');

    let courses = this.getCourses(targetYear, targetTerm, teacherIdOrName);
    if (courses.length === 0 && !teacherIdOrName) {
      courses = this.load();
    }
    const waitingSlots: Array<any> = [];

    courses.forEach((course) => {
      const maxPeriodsPerRoom = Math.max(1, Math.round((Number(course.credits) || 1) * 2));
      const classrooms =
        course.assignedClassrooms && course.assignedClassrooms.length > 0
          ? course.assignedClassrooms
          : ['ม.3/1'];

      classrooms.forEach((cls) => {
        const normalizedRoom = cls.split('•')[0].trim();
        const scheduledCount = matrixSlots.filter((s) => {
          if (s.isFreePeriod || s.isLunchSlot || s.status === 'LUNCH' || !s.subjectCode) return false;
          if (s.subjectCode.trim() !== course.code.trim()) return false;
          const slotRoom = (s.room || '').split('•')[0].trim();
          return (
            slotRoom === normalizedRoom ||
            slotRoom.includes(normalizedRoom) ||
            normalizedRoom.includes(slotRoom)
          );
        }).length;

        const remainingCount = Math.max(0, maxPeriodsPerRoom - scheduledCount);
        for (let i = 1; i <= remainingCount; i++) {
          const periodIndex = scheduledCount + i;
          waitingSlots.push({
            id: `waiting-${course.code}-${normalizedRoom.replace(/[^a-zA-Z0-9ก-๙]/g, '-')}-${i}`,
            day: 'จันทร์',
            period: 1,
            subjectCode: course.code,
            subjectName: course.name,
            room: `ห้อง ${normalizedRoom}`,
            credits: `${course.credits} หน่วยกิต`,
            totalPeriods: `คาบที่ ${periodIndex}/${maxPeriodsPerRoom} (${course.credits} นก.)`,
            colorTheme: course.code.startsWith('ศ') ? 'pink' : 'blue',
            category: 'subject',
            isFreePeriod: false,
            status: 'UNCHECKED',
            teacherId: course.teacherId,
            teacherName: course.teacherName,
          });
        }
      });
    });

    return waitingSlots;
  }

  /**
   * คัดกรองและปรับแก้ Matrix Slots ให้สอดคล้องกับหลักสูตรที่เลือกใช้:
   * 1. กำจัด mock data หรือวิชานอกหลักสูตร ให้กลายเป็นคาบว่าง
   * 2. จำกัดจำนวนคาบไม่ให้เกินโควตาตามหน่วยกิต (เช่น 1.5 หน่วยกิต = สูงสุด 3 คาบ/ห้อง)
   */
  public sanitizeMatrixSlotsWithCurriculum(
    slots: Array<any>,
    _academicYear?: string,
    _term?: string
  ): Array<any> {
    const courseMap = new Map<string, CourseCurriculumRecord>();
    // เติมวิชาหลักสูตรทั้งหมด เพื่อป้องกันการลบวิชาต่างเทอมทิ้งโดยไม่ได้ตั้งใจ
    this.load().forEach((c) => {
      courseMap.set(c.code.trim(), c);
    });

    const roomCounts: Record<string, number> = {};

    return slots.map((slot) => {
      if (slot.isLunchSlot || slot.status === 'LUNCH') {
        return slot;
      }
      if (slot.isFreePeriod || !slot.subjectCode) {
        return {
          ...slot,
          isFreePeriod: true,
          category: 'free',
          subjectCode: '',
          subjectName: '',
        };
      }

      const code = slot.subjectCode.trim();
      const course = courseMap.get(code);

      // หากไม่อยู่ในหลักสูตรที่เลือกใช้ ให้แปลงเป็นคาบว่างทันที
      if (!course) {
        return {
          ...slot,
          isFreePeriod: true,
          category: 'free',
          subjectCode: '',
          subjectName: '',
        };
      }

      const maxPeriods = Math.max(1, Math.round((Number(course.credits) || 1) * 2));
      const normalizedRoom = (slot.room || 'ม.3/1').split('•')[0].trim();
      const key = `${course.code}::${normalizedRoom}`;
      const countSoFar = roomCounts[key] || 0;

      // หากเกินโควตาตามหน่วยกิต ให้ตัดทิ้งเป็นคาบว่าง
      if (countSoFar >= maxPeriods) {
        return {
          ...slot,
          isFreePeriod: true,
          category: 'free',
          subjectCode: '',
          subjectName: '',
        };
      }

      roomCounts[key] = countSoFar + 1;
      return {
        ...slot,
        subjectName: course.name,
        isFreePeriod: false,
      };
    });
  }
}

export const coursesCurriculumService = new CoursesCurriculumService();

