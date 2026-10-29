import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Check,
  BookOpen,
  Search,
  Layers,
  FileSpreadsheet,
  Play,
  RotateCcw,
  Plus,
  HelpCircle,
  Trash2,
  Edit3,
  X,
  ClipboardList,
  Download,
  Sparkles,
  FileText,
  Upload,
  Paperclip,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  MoreVertical,
  BarChart2,
  RefreshCw,
} from 'lucide-react';
import {
  sgsRosterAndSubmissionService,
  formatSubmissionTimestamp,
  type FourScorePart,
  type TermAssignmentConfig,
  type SgsStudentRecord,
  type AssignmentAttachment,
} from '../services/sgsRosterAndSubmissionService';
import { coursesCurriculumService } from '../services/coursesCurriculumService';
import { studentService, formatClassroomLabel } from '../services/studentService';
import { classroomService, getLocalClassrooms } from '../services/classroomService';
import { normalizeClassroomName } from '../services/sgsImportExportService';
import { resolveRoomCandidates } from '../services/masterDataService';
import {
  teacherCourseAssignmentService,
  getDynamicTeachingSubjects,
  getTeacherTaughtClassrooms,
  getAllAvailableClassroomLabels,
  type GradingQueueItem,
} from '../services/teacherCourseAssignmentService';
import { r2StorageService } from '../services/r2StorageService';
import { ArtworkPreviewModal } from '../components/teacher/ArtworkPreviewModal';
import { Submission3ColorMatrixModal } from '../components/teacher/Submission3ColorMatrixModal';
import { GradingWorkspaceModal } from '../components/teacher/GradingWorkspaceModal';
import { SgsClassroomMatrixModal } from '../components/teacher/SgsClassroomMatrixModal';
import { AssignmentBundlesModal } from '../components/teacher/AssignmentBundlesModal';
import {
  getBangkokTodayString,
  formatThaiDateFull,
  formatThaiDateShort,
} from '../utils/timetableDateUtils';
import { academicCalendarService } from '../services/academicCalendarService';
import type { TeacherViewKey } from '../components/layout/TeacherSidebar';

export type QuickFilterMode = 'ALL' | 'MISSING_OR_R' | 'PENDING_REVIEW';

interface AssignmentManagementViewProps {
  initialQuickFilter?: QuickFilterMode;
  initialHighlightBanner?: string | null;
  onNavigate?: (view: TeacherViewKey) => void;
}

const SCORE_PART_LABELS: Record<FourScorePart, { label: string; cls: string }> = {
  PRE_MIDTERM: { label: 'ก่อนกลางภาค', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  MIDTERM: { label: 'กลางภาค', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  POST_MIDTERM: { label: 'หลังกลางภาค', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  FINAL: { label: 'ปลายภาค', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export const AssignmentManagementView: React.FC<AssignmentManagementViewProps> = ({
  initialQuickFilter: _initialQuickFilter = 'ALL',
  initialHighlightBanner: _initialHighlightBanner = null,
  onNavigate,
}) => {
  // 1. Dynamic Subjects & Real Classrooms
  const subjectsList = useMemo(() => getDynamicTeachingSubjects(), []);
  const allSystemClassrooms = useMemo(() => getAllAvailableClassroomLabels(), []);
  const [allClassroomsList, setAllClassroomsList] = useState<any[]>(() => {
    try {
      return getLocalClassrooms();
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let isMounted = true;
    classroomService.getAll().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setAllClassroomsList(data);
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Queue & Filtering State
  const [queueItems, setQueueItems] = useState<GradingQueueItem[]>(() =>
    teacherCourseAssignmentService.getGradingQueue()
  );

  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PENDING' | 'RETURNED' | 'GRADED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSectionTab, setActiveSectionTab] = useState<'ASSIGNED_LIST' | 'SUBMISSIONS' | 'SCORE_MATRIX'>(
    'ASSIGNED_LIST'
  );

  // Modern SaaS Header & Filter States (Design System)
  const activeCalendarTerm = useMemo(() => {
    return academicCalendarService.getActiveTerm();
  }, []);

  const [selectedTerm, setSelectedTerm] = useState<string>(() => {
    return activeCalendarTerm
      ? `${activeCalendarTerm.semesterNo}/${activeCalendarTerm.year}`
      : '2/2569';
  });

  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'PENDING_REVIEW' | 'PENDING_SCORE' | 'IN_PROGRESS' | 'GRADED'>('ALL');
  const [selectedScorePart, setSelectedScorePart] = useState<string>('ALL');
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  const [openMeatballMenuId, setOpenMeatballMenuId] = useState<string | null>(null);
  const [expandedUnitKeys, setExpandedUnitKeys] = useState<Set<string>>(new Set());

  // Auto close meatballs dropdown when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMeatballMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const todayThaiFull = useMemo(() => {
    const full = formatThaiDateFull(new Date());
    return full.replace(/(\d{4})$/, 'พ.ศ. $1');
  }, []);

  // Classrooms available for the selected subject filter (เฉพาะห้องที่สอนจริง)
  const availableFilterRooms = useMemo(() => {
    return getTeacherTaughtClassrooms(selectedSubjectCode);
  }, [selectedSubjectCode]);

  useEffect(() => {
    if (selectedRoom !== 'ALL' && availableFilterRooms.length > 0 && !availableFilterRooms.includes(selectedRoom)) {
      setSelectedRoom('ALL');
    }
  }, [availableFilterRooms, selectedRoom]);

  // Term Assignments List (Linked to ปพ.5)
  const [termAssignments, setTermAssignments] = useState<TermAssignmentConfig[]>(() =>
    sgsRosterAndSubmissionService.getTermAssignments()
  );

  const refreshTermAssignments = useCallback(() => {
    const code = selectedSubjectCode === 'ALL' ? undefined : selectedSubjectCode;
    const room = selectedRoom === 'ALL' ? undefined : selectedRoom;
    setTermAssignments(sgsRosterAndSubmissionService.getTermAssignments(code, room));
  }, [selectedSubjectCode, selectedRoom]);

  useEffect(() => {
    refreshTermAssignments();
  }, [refreshTermAssignments]);

  // 3. Create & Edit Assignment Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TermAssignmentConfig | null>(null);
  const [editScope, setEditScope] = useState<'SUB_TASK' | 'UNIT' | 'STANDALONE' | null>(null);
  const [matrixModalDefaultSubject, setMatrixModalDefaultSubject] = useState<string | undefined>(undefined);
  const [matrixModalDefaultRoom, setMatrixModalDefaultRoom] = useState<string | undefined>(undefined);
  const [formCourseCode, setFormCourseCode] = useState<string>(
    () => subjectsList[0]?.courseCode || 'ท23102'
  );
  const [formTitle, setFormTitle] = useState('');
  const [formScorePart, setFormScorePart] = useState<FourScorePart>('PRE_MIDTERM');
  const [formMaxScore, setFormMaxScore] = useState<number>(10);
  const [formDueDate, setFormDueDate] = useState<string>(() => getBangkokTodayString());
  const [formScopeMode, setFormScopeMode] = useState<'ALL_SUBJECT_ROOMS' | 'SELECTED_ROOMS'>(
    'ALL_SUBJECT_ROOMS'
  );
  const [formSelectedRooms, setFormSelectedRooms] = useState<string[]>([]);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Sub-task deletion confirmation modal state
  const [subTaskToDelete, setSubTaskToDelete] = useState<{
    task: TermAssignmentConfig;
    unitTitle?: string;
  } | null>(null);

  // รองรับการสั่งงานรายจุดประสงค์ / รายหน่วย (Auto-division / Unit Score)
  const [formAssignmentMode, setFormAssignmentMode] = useState<'DIRECT' | 'UNIT_BUNDLE'>('DIRECT');
  const [formUnitTitle, setFormUnitTitle] = useState('');
  const [formUnitMaxScore, setFormUnitMaxScore] = useState<number>(10);
  const [formScoringMethod, setFormScoringMethod] = useState<'SUBMISSION_COUNT_RATIO' | 'RAW_SCORE_AVERAGE'>('SUBMISSION_COUNT_RATIO');
  const [formIsDynamicTasks, setFormIsDynamicTasks] = useState<boolean>(true);
  const [formTotalTasksInUnit, setFormTotalTasksInUnit] = useState<number>(5);
  const [formAutoRoundUp, setFormAutoRoundUp] = useState<boolean>(true);

  // สลับแท็บเลือกหน่วยเดิม หรือสร้างหน่วยใหม่ใน Modal ('EXISTING' | 'NEW')
  const [formUnitTab, setFormUnitTab] = useState<'EXISTING' | 'NEW'>('EXISTING');

  // สั่งงานเพิ่มในหน่วยย่อย (ไม่ต้องแก้รายละเอียดหน่วย) & รายละเอียดงาน & สื่อการสอน
  const [isAddingToExistingUnit, setIsAddingToExistingUnit] = useState<boolean>(false);
  const [formUnitId, setFormUnitId] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formAttachments, setFormAttachments] = useState<AssignmentAttachment[]>([]);

  // Quick Inline Matrix cell editing state
  const [editingCell, setEditingCell] = useState<{
    studentCode: string;
    studentName: string;
    assignmentId: string;
    assignmentTitle: string;
    maxScore: number;
    currentScore: number | null;
  } | null>(null);

  const currentFormSubject = useMemo(
    () =>
      subjectsList.find((s) => s.courseCode === formCourseCode) ||
      subjectsList[0] || {
        courseCode: formCourseCode || 'ท23102',
        courseName: 'รายวิชาหลัก',
        classrooms: allSystemClassrooms,
      },
    [subjectsList, formCourseCode, allSystemClassrooms]
  );

  const currentFormSubjectRooms = useMemo(() => {
    return currentFormSubject.classrooms && currentFormSubject.classrooms.length > 0
      ? currentFormSubject.classrooms
      : allSystemClassrooms;
  }, [currentFormSubject, allSystemClassrooms]);

  const currentFormCourseWeights = useMemo(
    () => sgsRosterAndSubmissionService.getCourseWeights(currentFormSubject.courseCode),
    [currentFormSubject.courseCode]
  );

  // รายละเอียดหน่วยการเรียนรู้ที่มีอยู่เดิมในรายวิชานี้ (สำหรับเลือกใช้ทันทีไม่ต้องตั้งค่าซ้ำ)
  const existingCourseUnitDetails = useMemo(() => {
    const map = new Map<
      string,
      {
        unitId: string;
        unitTitle: string;
        unitMaxScore: number;
        scorePart: FourScorePart;
        scoringMethod: 'SUBMISSION_COUNT_RATIO' | 'RAW_SCORE_AVERAGE';
        totalTasksInUnit?: number;
        isDynamicTasks: boolean;
        autoRoundUp?: boolean;
        taskCount: number;
      }
    >();

    termAssignments
      .filter((a) => a.courseCode === formCourseCode && a.unitTitle)
      .forEach((a) => {
        const title = a.unitTitle!.trim();
        const existing = map.get(title);
        if (!existing) {
          map.set(title, {
            unitId: a.unitId || `unit-${title.toLowerCase().replace(/\s+/g, '-')}`,
            unitTitle: title,
            unitMaxScore: a.unitMaxScore || 10,
            scorePart: a.scorePart || 'PRE_MIDTERM',
            scoringMethod: (a.scoringMethod as any) || 'SUBMISSION_COUNT_RATIO',
            totalTasksInUnit: a.totalTasksInUnit,
            isDynamicTasks: !a.totalTasksInUnit || a.totalTasksInUnit <= 0,
            autoRoundUp: a.autoRoundUp ?? true,
            taskCount: 1,
          });
        } else {
          existing.taskCount += 1;
        }
      });

    return Array.from(map.values());
  }, [termAssignments, formCourseCode]);

  // รายการงานย่อยที่สังกัดหน่วยที่กำลังเลือก/แก้ไขอยู่
  const currentUnitSubTasks = useMemo(() => {
    if (!formUnitTitle) return [];
    return termAssignments.filter(
      (a) =>
        a.courseCode === formCourseCode &&
        (a.unitTitle === formUnitTitle || (formUnitId && a.unitId === formUnitId))
    );
  }, [termAssignments, formCourseCode, formUnitTitle, formUnitId]);

  const handleSelectExistingUnit = (unit: (typeof existingCourseUnitDetails)[0]) => {
    setFormUnitTitle(unit.unitTitle);
    setFormUnitId(unit.unitId);
    setFormUnitMaxScore(unit.unitMaxScore);
    setFormScorePart(unit.scorePart);
    setFormScoringMethod(unit.scoringMethod);
    setFormTotalTasksInUnit(
      unit.totalTasksInUnit && unit.totalTasksInUnit > 0 ? unit.totalTasksInUnit : 5
    );
    setFormIsDynamicTasks(unit.isDynamicTasks);
    setFormAutoRoundUp(unit.autoRoundUp ?? true);
  };

  // สื่อการสอนและแผนการสอนที่มีอยู่ในระบบ (cls_lesson_plans_v1 & coursesCurriculumService)
  const availableLessonPlanFiles = useMemo(() => {
    const list: {
      id: string;
      name: string;
      type: 'PDF' | 'IMAGE' | 'LINK' | 'DOCUMENT';
      size?: string;
      url?: string;
      lessonPlanTitle: string;
      courseCode?: string;
    }[] = [];

    // 1. จากระบบแผนการสอน (cls_lesson_plans_v1)
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('cls_lesson_plans_v1') : null;
      if (raw) {
        const plans = JSON.parse(raw);
        if (Array.isArray(plans)) {
          plans.forEach((p: any) => {
            if (!formCourseCode || p.courseCode === formCourseCode || !p.courseCode) {
              if (Array.isArray(p.files)) {
                p.files.forEach((f: any) => {
                  list.push({
                    id: f.id || `lp-${Math.random()}`,
                    name: f.name || 'เอกสารแผนการสอน',
                    type: f.type === 'PDF' || String(f.name).toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOCUMENT',
                    size: f.size || '',
                    url: f.url,
                    lessonPlanTitle: p.displayTitle || p.titleTh || p.titleJa || 'แผนการสอน',
                    courseCode: p.courseCode,
                  });
                });
              }
            }
          });
        }
      }
    } catch {}

    // 2. จากระบบหลักสูตร (coursesCurriculumService)
    try {
      const allCurricula = coursesCurriculumService.getCourses();
      const targetCourse = allCurricula.find((c) => c.code === formCourseCode);
      if (targetCourse && Array.isArray(targetCourse.units)) {
        targetCourse.units.forEach((u) => {
          if (Array.isArray(u.mediaItems)) {
            u.mediaItems.forEach((m) => {
              list.push({
                id: m.id,
                name: m.title || 'เอกสารประกอบการเรียน',
                type: m.fileType === 'PDF' || String(m.title).toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOCUMENT',
                size: m.fileSize || '',
                url: m.fileUrl || m.externalUrl,
                lessonPlanTitle: u.title,
                courseCode: targetCourse.code,
              });
            });
          }
        });
      }
    } catch {}

    return list;
  }, [formCourseCode]);

  const handleTeacherFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const newAtt: AssignmentAttachment = {
        id: `upload-${Date.now()}`,
        name: file.name,
        type: isPdf ? 'PDF' : isImage ? 'IMAGE' : 'DOCUMENT',
        fileDataUrl: result,
        size: `${Math.round(file.size / 1024)} KB`,
        source: 'UPLOAD',
      };
      setFormAttachments((prev) => [...prev, newAtt]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddLessonPlanAttachment = (lpFile: typeof availableLessonPlanFiles[0]) => {
    if (formAttachments.some((a) => a.name === lpFile.name)) return;
    const newAtt: AssignmentAttachment = {
      id: `lp-${Date.now()}-${lpFile.id}`,
      name: lpFile.name,
      type: lpFile.type,
      url: lpFile.url,
      size: lpFile.size,
      source: 'LESSON_PLAN',
      lessonPlanTitle: lpFile.lessonPlanTitle,
    };
    setFormAttachments((prev) => [...prev, newAtt]);
  };

  const handleOpenCreateModal = (prefill?: {
    courseCode?: string;
    unitTitle?: string;
    unitId?: string;
    unitMaxScore?: number;
    scorePart?: FourScorePart;
    scoringMethod?: 'SUBMISSION_COUNT_RATIO' | 'RAW_SCORE_AVERAGE';
    totalTasksInUnit?: number;
    isDynamicTasks?: boolean;
    targetClassrooms?: string[];
    isAddingToExistingUnit?: boolean;
    forceUnitMode?: boolean;
    isNewUnit?: boolean;
  }) => {
    setEditingAssignment(null);
    setEditScope(null);
    setIsAddingToExistingUnit(prefill?.isAddingToExistingUnit ?? false);
    setFormUnitId(prefill?.unitId || '');
    setFormDescription('');
    setFormAttachments([]);
    const initialCourse =
      prefill?.courseCode ||
      (selectedSubjectCode !== 'ALL'
        ? selectedSubjectCode
        : subjectsList[0]?.courseCode || 'ท23102');
    setFormCourseCode(initialCourse);
    setFormTitle('');
    setFormScorePart(prefill?.scorePart || 'PRE_MIDTERM');
    setFormMaxScore(10);
    setFormDueDate(getBangkokTodayString());
    setFormScopeMode(
      prefill?.targetClassrooms && prefill.targetClassrooms.length > 0
        ? 'SELECTED_ROOMS'
        : selectedRoom !== 'ALL'
          ? 'SELECTED_ROOMS'
          : 'ALL_SUBJECT_ROOMS'
    );
    setFormSelectedRooms(
      prefill?.targetClassrooms ||
      (selectedRoom !== 'ALL'
        ? [selectedRoom]
        : currentFormSubjectRooms[0]
          ? [currentFormSubjectRooms[0]]
          : [])
    );
    if (prefill?.forceUnitMode || prefill?.unitTitle) {
      setFormAssignmentMode('UNIT_BUNDLE');
      setFormUnitTab(prefill?.isNewUnit ? 'NEW' : 'EXISTING');
      setFormUnitTitle(prefill.unitTitle || '');
      setFormUnitMaxScore(prefill.unitMaxScore ?? 10);
      setFormScoringMethod(prefill.scoringMethod || 'SUBMISSION_COUNT_RATIO');
      setFormIsDynamicTasks(prefill.isDynamicTasks ?? true);
      setFormTotalTasksInUnit(prefill.totalTasksInUnit && prefill.totalTasksInUnit > 0 ? prefill.totalTasksInUnit : 5);
    } else {
      setFormAssignmentMode('UNIT_BUNDLE');
      setFormUnitTab('EXISTING');
      setFormUnitTitle('');
      setFormUnitMaxScore(10);
      setFormScoringMethod('SUBMISSION_COUNT_RATIO');
      setFormIsDynamicTasks(true);
      setFormTotalTasksInUnit(5);
    }
    setFormAutoRoundUp(true);
    setIsCreateModalOpen(true);
  };

  // เปิด Modal แก้ไขชิ้นงานย่อยในหน่วย (ไม่แสดงฟอร์มตั้งค่าหน่วยให้เกะกะ)
  const handleOpenEditSubTaskModal = (
    task: TermAssignmentConfig,
    parentUnit?: {
      unitTitle?: string;
      maxScore?: number;
      courseCode?: string;
      scorePart?: FourScorePart;
      targetClassrooms?: string[];
      scoringMethod?: 'SUBMISSION_COUNT_RATIO' | 'RAW_SCORE_AVERAGE';
    }
  ) => {
    setEditingAssignment(task);
    setEditScope('SUB_TASK');
    setIsAddingToExistingUnit(false);
    setFormUnitId(task.unitId || '');
    setFormDescription(task.description || '');
    setFormAttachments(task.attachments || []);
    setFormCourseCode(task.courseCode || parentUnit?.courseCode || subjectsList[0]?.courseCode || 'ท23102');
    setFormTitle(task.title);
    setFormScorePart(task.scorePart || parentUnit?.scorePart || 'PRE_MIDTERM');
    setFormMaxScore(task.maxScore || 10);
    setFormDueDate(task.dueDate || getBangkokTodayString());
    const isTargetSpecific = Boolean(
      task.targetClassrooms &&
      task.targetClassrooms.length > 0 &&
      !task.targetClassrooms.includes('ALL')
    );
    setFormScopeMode(isTargetSpecific ? 'SELECTED_ROOMS' : 'ALL_SUBJECT_ROOMS');
    setFormSelectedRooms(isTargetSpecific ? task.targetClassrooms || [] : []);
    setFormAssignmentMode('UNIT_BUNDLE');
    setFormUnitTab('EXISTING');
    setFormUnitTitle(task.unitTitle || parentUnit?.unitTitle || '');
    setFormUnitMaxScore(task.unitMaxScore ?? parentUnit?.maxScore ?? 10);
    setFormScoringMethod((task.scoringMethod as any) || (parentUnit?.scoringMethod as any) || 'SUBMISSION_COUNT_RATIO');
    setFormIsDynamicTasks(!task.totalTasksInUnit || task.totalTasksInUnit <= 0);
    setFormTotalTasksInUnit(
      task.totalTasksInUnit && task.totalTasksInUnit > 0 ? task.totalTasksInUnit : 5
    );
    setFormAutoRoundUp(task.autoRoundUp ?? true);
    setIsCreateModalOpen(true);
  };

  // เปิด Modal แก้ไขการตั้งค่าหน่วยการเรียนรู้ (อัปเดตเกณฑ์คะแนน/ชื่อหน่วย มีผลกับทุกงานในหน่วย)
  const handleOpenEditUnitModal = (unitItem: typeof enrichedAssignmentCards[0]) => {
    const refAssign = unitItem.rawAssignment || unitItem.subTasks[0];
    if (!refAssign) return;
    setEditingAssignment(refAssign);
    setEditScope('UNIT');
    setIsAddingToExistingUnit(false);
    setFormUnitId(unitItem.unitId || refAssign.unitId || '');
    setFormDescription(refAssign.description || '');
    setFormAttachments(refAssign.attachments || []);
    setFormCourseCode(unitItem.courseCode || refAssign.courseCode || subjectsList[0]?.courseCode || 'ท23102');
    setFormTitle(unitItem.unitTitle || refAssign.unitTitle || refAssign.title);
    setFormScorePart(unitItem.scorePart || refAssign.scorePart || 'PRE_MIDTERM');
    setFormMaxScore(unitItem.maxScore ?? refAssign.unitMaxScore ?? 10);
    setFormDueDate(unitItem.dueDate || refAssign.dueDate || getBangkokTodayString());
    const isTargetSpecific = Boolean(
      unitItem.targetClassrooms &&
      unitItem.targetClassrooms.length > 0 &&
      !unitItem.targetClassrooms.includes('ALL')
    );
    setFormScopeMode(isTargetSpecific ? 'SELECTED_ROOMS' : 'ALL_SUBJECT_ROOMS');
    setFormSelectedRooms(isTargetSpecific ? unitItem.targetClassrooms || [] : []);
    setFormAssignmentMode('UNIT_BUNDLE');
    setFormUnitTab('EXISTING');
    setFormUnitTitle(unitItem.unitTitle || refAssign.unitTitle || '');
    setFormUnitMaxScore(unitItem.maxScore ?? refAssign.unitMaxScore ?? 10);
    setFormScoringMethod((unitItem.scoringMethod as any) || (refAssign.scoringMethod as any) || 'SUBMISSION_COUNT_RATIO');
    setFormIsDynamicTasks(!unitItem.totalTasksInUnit || unitItem.totalTasksInUnit <= 0);
    setFormTotalTasksInUnit(
      unitItem.totalTasksInUnit && unitItem.totalTasksInUnit > 0 ? unitItem.totalTasksInUnit : 5
    );
    setFormAutoRoundUp(refAssign.autoRoundUp ?? true);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (assign: TermAssignmentConfig) => {
    const isUnit = Boolean(
      assign.unitTitle ||
      (assign.scoringMethod && assign.scoringMethod !== 'DIRECT_SCORE')
    );
    if (isUnit) {
      handleOpenEditSubTaskModal(assign);
      return;
    }
    setEditingAssignment(assign);
    setEditScope('STANDALONE');
    setIsAddingToExistingUnit(false);
    setFormUnitId('');
    setFormDescription(assign.description || '');
    setFormAttachments(assign.attachments || []);
    setFormCourseCode(assign.courseCode || subjectsList[0]?.courseCode || 'ท23102');
    setFormTitle(assign.title);
    setFormScorePart(assign.scorePart || 'PRE_MIDTERM');
    setFormMaxScore(assign.maxScore || 10);
    setFormDueDate(assign.dueDate || getBangkokTodayString());
    const isTargetSpecific = Boolean(
      assign.targetClassrooms &&
      assign.targetClassrooms.length > 0 &&
      !assign.targetClassrooms.includes('ALL')
    );
    setFormScopeMode(isTargetSpecific ? 'SELECTED_ROOMS' : 'ALL_SUBJECT_ROOMS');
    setFormSelectedRooms(isTargetSpecific ? assign.targetClassrooms || [] : []);
    setFormAssignmentMode('DIRECT');
    setFormUnitTab('EXISTING');
    setFormUnitTitle('');
    setFormUnitMaxScore(10);
    setFormScoringMethod('SUBMISSION_COUNT_RATIO');
    setFormIsDynamicTasks(true);
    setFormTotalTasksInUnit(5);
    setFormAutoRoundUp(assign.autoRoundUp ?? true);
    setIsCreateModalOpen(true);
  };

  const handleCreateAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const targetRooms =
      formScopeMode === 'ALL_SUBJECT_ROOMS'
        ? (editingAssignment?.targetClassrooms?.includes('ALL') ? ['ALL'] : currentFormSubjectRooms)
        : formSelectedRooms.length > 0
          ? formSelectedRooms
          : currentFormSubjectRooms.slice(0, 1);

    const partToUnitMap: Record<FourScorePart, 'U1' | 'U2' | 'U3' | 'MIDTERM' | 'FINAL'> = {
      PRE_MIDTERM: 'U1',
      MIDTERM: 'MIDTERM',
      POST_MIDTERM: 'U2',
      FINAL: 'FINAL',
    };

    const finalTotalTasks =
      formAssignmentMode === 'UNIT_BUNDLE'
        ? formIsDynamicTasks
          ? 0
          : Math.max(1, Number(formTotalTasksInUnit) || 1)
        : undefined;

    const effectiveCourseCode =
      formCourseCode || editingAssignment?.courseCode || currentFormSubject.courseCode;
    const effectiveCourseName =
      subjectsList.find((s) => s.courseCode === effectiveCourseCode)?.courseName ||
      editingAssignment?.courseName ||
      currentFormSubject.courseName;

    const roomSuffix =
      targetRooms.length === 1 && targetRooms[0] !== 'ALL'
        ? `-${targetRooms[0].replace(/[^a-zA-Z0-9ก-๙]/g, '')}`
        : '';
    const resolvedGeneratedUnitId =
      formUnitId || `unit-${formUnitTitle.trim().toLowerCase().replace(/\s+/g, '-')}${roomSuffix}`;

    const effectiveTaskMaxScore = Math.max(1, Number(formMaxScore) || 10);

    if (editingAssignment) {
      if (editScope === 'UNIT') {
        // อัปเดตข้อมูลระดับหน่วย และกระจายผล (Cascade) ไปยังงานย่อยทุกงานในหน่วย
        sgsRosterAndSubmissionService.updateTermAssignment(editingAssignment.id, {
          unitTitle: formUnitTitle.trim(),
          unitMaxScore: Math.max(1, Number(formUnitMaxScore) || 10),
          scoringMethod: formScoringMethod,
          scorePart: formScorePart,
          unitKey: partToUnitMap[formScorePart],
          indicatorCode: SCORE_PART_LABELS[formScorePart].label,
          totalTasksInUnit: finalTotalTasks,
          autoRoundUp: formAutoRoundUp,
          targetClassrooms: targetRooms,
          courseCode: effectiveCourseCode,
          courseName: effectiveCourseName,
        });

        refreshTermAssignments();
        setIsCreateModalOpen(false);
        setEditingAssignment(null);
        setEditScope(null);
        setIsAddingToExistingUnit(false);
        showToast(`✓ บันทึกการตั้งค่าหน่วย "${formUnitTitle.trim()}" เรียบร้อยแล้ว (อัปเดตทุกงานในหน่วย)`);
        return;
      }

      if (editScope === 'SUB_TASK') {
        // อัปเดตเฉพาะงานย่อยนี้ โดยไม่กระทบโครงสร้างของหน่วย
        sgsRosterAndSubmissionService.updateTermAssignment(editingAssignment.id, {
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          attachments: formAttachments,
          maxScore: Math.max(1, Number(formMaxScore) || 10),
          dueDate: formDueDate || getBangkokTodayString(),
          targetClassrooms: targetRooms,
        });

        refreshTermAssignments();
        setIsCreateModalOpen(false);
        setEditingAssignment(null);
        setEditScope(null);
        setIsAddingToExistingUnit(false);
        showToast(`✓ บันทึกการแก้ไขงานย่อย "${formTitle.trim()}" เรียบร้อยแล้ว`);
        return;
      }

      sgsRosterAndSubmissionService.updateTermAssignment(editingAssignment.id, {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        attachments: formAttachments,
        unitKey: partToUnitMap[formScorePart],
        scorePart: formScorePart,
        maxScore: effectiveTaskMaxScore,
        indicatorCode: SCORE_PART_LABELS[formScorePart].label,
        dueDate: formDueDate || getBangkokTodayString(),
        courseCode: effectiveCourseCode,
        courseName: effectiveCourseName,
        targetClassrooms: targetRooms,
        unitId: undefined,
        unitTitle: undefined,
        unitMaxScore: undefined,
        scoringMethod: 'DIRECT_SCORE',
        totalTasksInUnit: undefined,
        autoRoundUp: formAutoRoundUp,
      });

      refreshTermAssignments();
      setIsCreateModalOpen(false);
      setEditingAssignment(null);
      setEditScope(null);
      setIsAddingToExistingUnit(false);
      showToast(`✓ บันทึกการแก้ไขชิ้นงาน "${formTitle.trim()}" เรียบร้อยแล้ว`);
    } else {
      sgsRosterAndSubmissionService.addTermAssignment({
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        attachments: formAttachments,
        unitKey: partToUnitMap[formScorePart],
        scorePart: formScorePart,
        maxScore: effectiveTaskMaxScore,
        indicatorCode: SCORE_PART_LABELS[formScorePart].label,
        dueDate: formDueDate || getBangkokTodayString(),
        courseCode: currentFormSubject.courseCode,
        courseName: currentFormSubject.courseName,
        targetClassrooms: targetRooms,
        unitId:
          formAssignmentMode === 'UNIT_BUNDLE' && formUnitTitle.trim()
            ? resolvedGeneratedUnitId
            : undefined,
        unitTitle: formAssignmentMode === 'UNIT_BUNDLE' ? formUnitTitle.trim() : undefined,
        unitMaxScore:
          formAssignmentMode === 'UNIT_BUNDLE'
            ? Math.max(1, Number(formUnitMaxScore) || 10)
            : undefined,
        scoringMethod: formAssignmentMode === 'UNIT_BUNDLE' ? formScoringMethod : 'DIRECT_SCORE',
        totalTasksInUnit: finalTotalTasks,
        autoRoundUp: formAutoRoundUp,
      });

      refreshTermAssignments();
      setIsCreateModalOpen(false);
      setIsAddingToExistingUnit(false);
      setActiveSectionTab('ASSIGNED_LIST');
      showToast(
        isAddingToExistingUnit
          ? `✓ เพิ่มงาน "${formTitle.trim()}" ในหน่วย "${formUnitTitle}" เรียบร้อยแล้ว`
          : `✓ สั่งงาน "${formTitle.trim()}" (${SCORE_PART_LABELS[formScorePart].label}) เรียบร้อยแล้ว`
      );
    }
  };

  // 4. Secondary Modals State
  const [gradingModalItem, setGradingModalItem] = useState<GradingQueueItem | null>(null);
  const [isSgsMatrixOpen, setIsSgsMatrixOpen] = useState<boolean>(false);
  const [is3ColorMatrixOpen, setIs3ColorMatrixOpen] = useState<boolean>(false);
  const [isBundlesModalOpen, setIsBundlesModalOpen] = useState<boolean>(false);

  const [previewItem, setPreviewItem] = useState<{
    title: string;
    studentName: string;
    studentCode?: string;
    assignmentId?: string;
    classroom?: string;
    seatNo?: number;
    type?: 'IMAGE' | 'PDF' | 'LINK' | 'TEXT';
    url?: string;
    externalLinkUrl?: string;
    textContent?: string;
    fileName?: string;
    platform?: 'CANVA' | 'GOOGLE_DOCS' | 'GOOGLE_DRIVE' | 'YOUTUBE' | 'FIGMA' | 'OTHER';
  } | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Data for Section C: Assignment Breakdown Matrix (ตารางแจกแจงคะแนนตามงานที่มอบหมาย)
  const matrixClassroom = useMemo(() => {
    if (selectedRoom !== 'ALL') return selectedRoom;
    return availableFilterRooms[0] || '';
  }, [selectedRoom, availableFilterRooms]);

  const [matrixStudents, setMatrixStudents] = useState<SgsStudentRecord[]>([]);

  const refreshMatrixStudents = useCallback(() => {
    const list = sgsRosterAndSubmissionService.getSgsRoster(matrixClassroom);
    setMatrixStudents(
      list
        .filter((s) => s.transferState !== 'TRANSFERRED_OUT')
        .sort((a, b) => Number(a.sgsSeatNo ?? a.no ?? 999) - Number(b.sgsSeatNo ?? b.no ?? 999))
    );
  }, [matrixClassroom]);

  useEffect(() => {
    refreshMatrixStudents();
  }, [refreshMatrixStudents]);

  const [matrixPartFilter, setMatrixPartFilter] = useState<'ALL' | 'PRE_MIDTERM' | 'POST_MIDTERM'>('ALL');

  const matrixCourseWeights = useMemo(
    () => sgsRosterAndSubmissionService.getCourseWeights(selectedSubjectCode === 'ALL' ? undefined : selectedSubjectCode),
    [selectedSubjectCode]
  );

  const matrixAssignmentsRaw = useMemo(() => {
    const code = selectedSubjectCode === 'ALL' ? undefined : selectedSubjectCode;
    return sgsRosterAndSubmissionService.getTermAssignments(code, matrixClassroom);
  }, [selectedSubjectCode, matrixClassroom, termAssignments]);

  const matrixAssignments = useMemo(() => {
    if (matrixPartFilter === 'ALL') return matrixAssignmentsRaw;
    if (matrixPartFilter === 'PRE_MIDTERM') {
      return matrixAssignmentsRaw.filter(
        (a) => !a.scorePart || a.scorePart === 'PRE_MIDTERM'
      );
    }
    if (matrixPartFilter === 'POST_MIDTERM') {
      return matrixAssignmentsRaw.filter(
        (a) => a.scorePart === 'POST_MIDTERM' || a.scorePart === 'FINAL'
      );
    }
    return matrixAssignmentsRaw;
  }, [matrixAssignmentsRaw, matrixPartFilter]);

  const allSubmissions = useMemo(() => {
    return sgsRosterAndSubmissionService.getSubmissions();
  }, [queueItems, termAssignments]);

  const classroomStudentCounts = useMemo(() => {
    const map: Record<string, number> = {};
    allClassroomsList.forEach((c) => {
      const roomKey = c.name || c.id;
      const count = c.studentCount || c.student_count || 0;
      if (roomKey && count > 0) {
        map[roomKey] = count;
        const norm = normalizeClassroomName(roomKey);
        map[norm] = count;
      }
    });

    allSystemClassrooms.forEach((r) => {
      const normR = normalizeClassroomName(r);
      const existing = map[r] || map[normR] || 0;
      if (existing > 0) {
        map[r] = existing;
      } else {
        const fromStudentSvc = studentService.countStudents(r);
        const fromRoster = sgsRosterAndSubmissionService.getSgsRoster(r).length;
        map[r] = fromStudentSvc || fromRoster || 0;
      }
    });
    return map;
  }, [allSystemClassrooms, allClassroomsList]);

  const enrichedAssignmentCards = useMemo(() => {
    const unitMap = new Map<
      string,
      {
        key: string;
        unitId: string;
        unitTitle: string;
        courseCode: string;
        courseName: string;
        scorePart: FourScorePart;
        unitMaxScore: number;
        targetClassrooms: string[];
        academicYearTerm?: string;
        tasks: TermAssignmentConfig[];
      }
    >();

    const standaloneList: TermAssignmentConfig[] = [];

    termAssignments.forEach((assign) => {
      const isUnit = Boolean(
        assign.unitTitle ||
        (assign.scoringMethod && assign.scoringMethod !== 'DIRECT_SCORE')
      );

      if (isUnit && assign.unitTitle) {
        const uKey = assign.unitId || `${assign.courseCode || 'all'}:::${assign.unitTitle}`;
        const existing = unitMap.get(uKey) || {
          key: uKey,
          unitId: assign.unitId || uKey,
          unitTitle: assign.unitTitle,
          courseCode: assign.courseCode || '',
          courseName: assign.courseName || '',
          scorePart: assign.scorePart || 'PRE_MIDTERM',
          unitMaxScore: assign.unitMaxScore ?? 10,
          targetClassrooms: assign.targetClassrooms || [],
          academicYearTerm: assign.academicYearTerm,
          tasks: [],
        };
        existing.tasks.push(assign);
        if (assign.targetClassrooms && assign.targetClassrooms.length > 0 && existing.targetClassrooms.length === 0) {
          existing.targetClassrooms = assign.targetClassrooms;
        }
        unitMap.set(uKey, existing);
      } else {
        standaloneList.push(assign);
      }
    });

    const result: {
      id: string;
      key: string;
      isUnitBundle: boolean;
      unitId?: string;
      unitTitle?: string;
      title: string;
      displayTitle: string;
      courseCode: string;
      courseName: string;
      scorePart: FourScorePart;
      maxScore: number;
      dueDate: string;
      targetClassrooms: string[];
      totalStudents: number;
      submittedCount: number;
      gradedCount: number;
      pendingReviewCount: number;
      displayStatus: 'PENDING_REVIEW' | 'PENDING_SCORE' | 'IN_PROGRESS' | 'GRADED';
      progressCount: number;
      totalTargetCount: number;
      progressUnitLabel: string;
      progressPercent: number;
      subTasks: TermAssignmentConfig[];
      rawAssignment?: TermAssignmentConfig;
      academicYearTerm?: string;
      scoringMethod?: 'SUBMISSION_COUNT_RATIO' | 'RAW_SCORE_AVERAGE';
      totalTasksInUnit?: number;
      autoRoundUp?: boolean;
    }[] = [];

    unitMap.forEach((u) => {
      const targetRooms =
        selectedRoom !== 'ALL'
          ? [selectedRoom]
          : u.targetClassrooms && u.targetClassrooms.length > 0 && !u.targetClassrooms.includes('ALL')
          ? u.targetClassrooms
          : availableFilterRooms;

      const totalStudentsRaw = targetRooms.reduce((sum, r) => {
        if (r === 'ALL') return sum;
        const norm = normalizeClassroomName(r);
        return sum + (classroomStudentCounts[r] || classroomStudentCounts[norm] || 0);
      }, 0);

      const taskIds = new Set(u.tasks.map((t) => t.id));
      const roomCandidates = selectedRoom !== 'ALL' ? resolveRoomCandidates(selectedRoom) : null;
      const roomStudentCodes =
        selectedRoom !== 'ALL'
          ? new Set(sgsRosterAndSubmissionService.getSgsRoster(selectedRoom).map((s) => s.studentCode))
          : null;

      const unitSubs = allSubmissions.filter((s) => {
        if (!taskIds.has(s.assignmentId)) return false;
        if (selectedRoom !== 'ALL') {
          const sRoomNorm = s.classroom ? normalizeClassroomName(s.classroom) : '';
          const selRoomNorm = normalizeClassroomName(selectedRoom);
          const matchesRoomName = !!(
            (sRoomNorm && selRoomNorm && sRoomNorm === selRoomNorm) ||
            (roomCandidates && s.classroom && roomCandidates.includes(s.classroom))
          );
          const matchesRoster = !!(roomStudentCodes && roomStudentCodes.has(s.studentCode));
          if (!matchesRoomName && !matchesRoster) {
            return false;
          }
        }
        return true;
      });

      const studentCodes = new Set(unitSubs.map((s) => s.studentCode));
      let fullyGradedStudents = 0;
      let submittedStudents = 0;

      studentCodes.forEach((stuCode) => {
        const stuSubs = unitSubs.filter((s) => s.studentCode === stuCode);
        const isAnySubmitted = stuSubs.some((s) => s.status !== 'MISSING');
        const isAllGraded =
          u.tasks.length > 0 &&
          u.tasks.every((t) =>
            stuSubs.some(
              (s) => s.assignmentId === t.id && (s.status === 'GRADED' || (s.score !== null && s.score !== undefined))
            )
          );
        if (isAnySubmitted) submittedStudents += 1;
        if (isAllGraded) fullyGradedStudents += 1;
      });

      const totalStudents = Math.max(totalStudentsRaw, submittedStudents, fullyGradedStudents);

      const pendingReviewCount = unitSubs.filter(
        (s) => s.status === 'SUBMITTED_PENDING' || (s.status !== 'GRADED' && s.score === null)
      ).length;

      // Count total submitted works across all sub-tasks in this unit (e.g. 41/48 งาน)
      const totalSubmittedWorks = unitSubs.filter((s) => s.status !== 'MISSING').length;
      const totalExpectedWorks = u.tasks.length > 0 ? u.tasks.length * totalStudents : totalStudents;
      const totalTargetCount = Math.max(totalExpectedWorks, totalSubmittedWorks);
      const progressCount = totalSubmittedWorks;
      const progressUnitLabel = 'งาน';
      const progressPercent =
        totalTargetCount > 0
          ? Math.min(100, Math.round((progressCount / totalTargetCount) * 100))
          : progressCount > 0
          ? 100
          : 0;

      let displayStatus: 'PENDING_REVIEW' | 'PENDING_SCORE' | 'IN_PROGRESS' | 'GRADED' = 'PENDING_SCORE';
      if (pendingReviewCount > 0) {
        displayStatus = 'PENDING_REVIEW';
      } else if (totalStudents > 0) {
        if (fullyGradedStudents >= totalStudents) {
          displayStatus = 'GRADED';
        } else if (fullyGradedStudents > 0 || submittedStudents > 0) {
          displayStatus = 'IN_PROGRESS';
        } else {
          displayStatus = 'PENDING_SCORE';
        }
      } else {
        if (fullyGradedStudents > 0) {
          displayStatus = 'GRADED';
        } else if (submittedStudents > 0) {
          displayStatus = 'IN_PROGRESS';
        } else {
          displayStatus = 'PENDING_SCORE';
        }
      }

      const sortedDueDates = u.tasks
        .map((t) => t.dueDate)
        .filter(Boolean)
        .sort();
      const latestDueDate =
        sortedDueDates[sortedDueDates.length - 1] || u.tasks[0]?.dueDate || getBangkokTodayString();

      const displayTitle =
        u.tasks.length === 1
          ? `${u.unitTitle} เรื่อง ${u.tasks[0].title}`
          : `${u.unitTitle} (รวม ${u.tasks.length} ชิ้นงาน)`;

      result.push({
        id: u.tasks[0]?.id || u.key,
        key: u.key,
        isUnitBundle: true,
        unitId: u.unitId,
        unitTitle: u.unitTitle,
        title: u.unitTitle,
        displayTitle,
        courseCode: u.courseCode,
        courseName: u.courseName,
        scorePart: u.scorePart,
        maxScore: u.unitMaxScore,
        dueDate: latestDueDate,
        targetClassrooms: u.targetClassrooms,
        totalStudents,
        submittedCount: submittedStudents,
        gradedCount: fullyGradedStudents,
        pendingReviewCount,
        displayStatus,
        progressCount,
        totalTargetCount,
        progressUnitLabel,
        progressPercent,
        subTasks: u.tasks,
        rawAssignment: u.tasks[0],
        academicYearTerm: u.academicYearTerm,
        scoringMethod: (u.tasks[0]?.scoringMethod as any) || 'SUBMISSION_COUNT_RATIO',
        totalTasksInUnit: u.tasks[0]?.totalTasksInUnit,
        autoRoundUp: u.tasks[0]?.autoRoundUp ?? true,
      });
    });

    standaloneList.forEach((assign) => {
      const targetRooms =
        selectedRoom !== 'ALL'
          ? [selectedRoom]
          : assign.targetClassrooms && assign.targetClassrooms.length > 0 && !assign.targetClassrooms.includes('ALL')
          ? assign.targetClassrooms
          : availableFilterRooms;

      const totalStudentsRaw = targetRooms.reduce((sum, r) => {
        if (r === 'ALL') return sum;
        const norm = normalizeClassroomName(r);
        return sum + (classroomStudentCounts[r] || classroomStudentCounts[norm] || 0);
      }, 0);

      const roomCandidates = selectedRoom !== 'ALL' ? resolveRoomCandidates(selectedRoom) : null;
      const roomStudentCodes =
        selectedRoom !== 'ALL'
          ? new Set(sgsRosterAndSubmissionService.getSgsRoster(selectedRoom).map((s) => s.studentCode))
          : null;

      const subs = allSubmissions.filter((s) => {
        if (s.assignmentId !== assign.id) return false;
        if (selectedRoom !== 'ALL') {
          const sRoomNorm = s.classroom ? normalizeClassroomName(s.classroom) : '';
          const selRoomNorm = normalizeClassroomName(selectedRoom);
          const matchesRoomName = !!(
            (sRoomNorm && selRoomNorm && sRoomNorm === selRoomNorm) ||
            (roomCandidates && s.classroom && roomCandidates.includes(s.classroom))
          );
          const matchesRoster = !!(roomStudentCodes && roomStudentCodes.has(s.studentCode));
          if (!matchesRoomName && !matchesRoster) {
            return false;
          }
        }
        return true;
      });
      const gradedCount = subs.filter(
        (s) => s.status === 'GRADED' || (s.score !== null && s.score !== undefined)
      ).length;
      const submittedCount = subs.filter(
        (s) => s.status === 'SUBMITTED_PENDING' || s.status === 'GRADED' || (s.score !== null && s.score !== undefined)
      ).length;
      const pendingReviewCount = subs.filter(
        (s) => s.status === 'SUBMITTED_PENDING' || (s.status !== 'GRADED' && s.score === null)
      ).length;

      const totalStudents = Math.max(totalStudentsRaw, submittedCount, gradedCount);

      let displayStatus: 'PENDING_REVIEW' | 'PENDING_SCORE' | 'IN_PROGRESS' | 'GRADED' = 'PENDING_SCORE';
      if (pendingReviewCount > 0) {
        displayStatus = 'PENDING_REVIEW';
      } else if (totalStudents > 0) {
        if (gradedCount >= totalStudents) {
          displayStatus = 'GRADED';
        } else if (gradedCount > 0 || submittedCount > 0) {
          displayStatus = 'IN_PROGRESS';
        } else {
          displayStatus = 'PENDING_SCORE';
        }
      } else {
        if (gradedCount > 0) {
          displayStatus = 'GRADED';
        } else if (submittedCount > 0) {
          displayStatus = 'IN_PROGRESS';
        } else {
          displayStatus = 'PENDING_SCORE';
        }
      }

      const progressCount = Math.max(gradedCount, submittedCount);
      const totalTargetCount = totalStudents;
      const progressUnitLabel = 'คน';
      const progressPercent =
        totalStudents > 0
          ? Math.min(100, Math.round((progressCount / totalStudents) * 100))
          : progressCount > 0
          ? 100
          : 0;

      result.push({
        id: assign.id,
        key: assign.id,
        isUnitBundle: false,
        title: assign.title,
        displayTitle: assign.title,
        courseCode: assign.courseCode || '',
        courseName: assign.courseName || '',
        scorePart: assign.scorePart || 'PRE_MIDTERM',
        maxScore: assign.maxScore || 10,
        dueDate: assign.dueDate || getBangkokTodayString(),
        targetClassrooms: assign.targetClassrooms || [],
        totalStudents,
        submittedCount,
        gradedCount,
        pendingReviewCount,
        displayStatus,
        progressCount,
        totalTargetCount,
        progressUnitLabel,
        progressPercent,
        subTasks: [assign],
        rawAssignment: assign,
        academicYearTerm: assign.academicYearTerm,
      });
    });

    return result;
  }, [termAssignments, allSubmissions, classroomStudentCounts, selectedRoom, availableFilterRooms]);

  const filteredAssignmentCards = useMemo(() => {
    return enrichedAssignmentCards.filter((item) => {
      if (selectedTerm !== 'ALL') {
        if (item.academicYearTerm && item.academicYearTerm !== selectedTerm) {
          return false;
        }
      }

      if (selectedGradeLevel !== 'ALL') {
        const cleanLvl = selectedGradeLevel.replace('ม.', '');
        const matchRoom = item.targetClassrooms.some(
          (r) => r.startsWith(selectedGradeLevel) || r.includes(cleanLvl)
        );
        const matchCode = item.courseCode.includes(cleanLvl);
        if (!matchRoom && !matchCode && item.targetClassrooms.length > 0) {
          return false;
        }
      }

      if (selectedSubjectCode !== 'ALL') {
        if (item.courseCode !== selectedSubjectCode) {
          return false;
        }
      }

      if (selectedRoom !== 'ALL') {
        const normSelected = formatClassroomLabel(selectedRoom);
        const hasRoom = item.targetClassrooms.some(
          (r) => r === selectedRoom || formatClassroomLabel(r) === normSelected
        );
        if (!hasRoom && item.targetClassrooms.length > 0) {
          return false;
        }
      }

      if (selectedScorePart !== 'ALL') {
        if (item.scorePart !== selectedScorePart) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.displayTitle.toLowerCase().includes(q);
        const matchCourse =
          item.courseCode.toLowerCase().includes(q) || item.courseName.toLowerCase().includes(q);
        const matchRooms = item.targetClassrooms.some((r) => r.toLowerCase().includes(q));
        if (!matchTitle && !matchCourse && !matchRooms) {
          return false;
        }
      }

      return true;
    });
  }, [
    enrichedAssignmentCards,
    selectedTerm,
    selectedGradeLevel,
    selectedSubjectCode,
    selectedRoom,
    selectedScorePart,
    searchQuery,
  ]);

  const assignmentSummaryStats = useMemo(() => {
    const total = filteredAssignmentCards.length;
    const pendingReview = filteredAssignmentCards.filter((i) => i.displayStatus === 'PENDING_REVIEW').length;
    const inProgress = filteredAssignmentCards.filter((i) => i.displayStatus === 'IN_PROGRESS').length;
    const graded = filteredAssignmentCards.filter((i) => i.displayStatus === 'GRADED').length;
    const pendingScore = filteredAssignmentCards.filter((i) => i.displayStatus === 'PENDING_SCORE').length;
    return { total, pendingReview, inProgress, graded, pendingScore };
  }, [filteredAssignmentCards]);

  const statusFilteredCards = useMemo(() => {
    if (selectedStatusFilter === 'ALL') return filteredAssignmentCards;
    return filteredAssignmentCards.filter((i) => i.displayStatus === selectedStatusFilter);
  }, [filteredAssignmentCards, selectedStatusFilter]);

  const totalCardPages = Math.max(1, Math.ceil(statusFilteredCards.length / pageSize));
  const displayedAssignmentCards = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return statusFilteredCards.slice(start, start + pageSize);
  }, [statusFilteredCards, currentPage, pageSize]);

  const toggleUnitExpand = (key: string) => {
    setExpandedUnitKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleRowPrimaryAction = (item: typeof enrichedAssignmentCards[0]) => {
    if (item.displayStatus === 'GRADED') {
      handleOpenCheckMatrix(item.courseCode, item.targetClassrooms);
      return;
    }

    const targetId = item.isUnitBundle ? (item.subTasks[0]?.id || item.id) : item.id;
    const pendingQueueItem = queueItems.find(
      (q) => (q.assignmentId === targetId || item.subTasks.some((t) => t.id === q.assignmentId)) && q.status === 'PENDING_REVIEW'
    );

    if (pendingQueueItem) {
      setGradingModalItem(pendingQueueItem);
    } else {
      handleOpenCheckMatrix(item.courseCode, item.targetClassrooms);
    }
  };

  const handleDeleteAssignmentRow = (item: typeof enrichedAssignmentCards[0]) => {
    if (confirm(`คุณต้องการลบชิ้นงาน "${item.displayTitle}" ใช่หรือไม่?`)) {
      if (item.isUnitBundle && item.subTasks.length > 0) {
        item.subTasks.forEach((t) => sgsRosterAndSubmissionService.deleteTermAssignment(t.id));
        if (item.id) {
          sgsRosterAndSubmissionService.deleteTermAssignment(item.id);
        }
        if (item.unitId) {
          sgsRosterAndSubmissionService.deleteTermAssignment(item.unitId);
        }
      } else {
        sgsRosterAndSubmissionService.deleteTermAssignment(item.id);
      }
      setQueueItems([...teacherCourseAssignmentService.getGradingQueue()]);
      refreshTermAssignments();
      showToast(`✓ ลบชิ้นงาน "${item.displayTitle}" เรียบร้อยแล้ว`);
    }
  };

  const handleOpenDeleteSubTaskModal = (
    task: TermAssignmentConfig,
    unitTitle?: string
  ) => {
    setSubTaskToDelete({
      task,
      unitTitle: unitTitle || task.unitTitle || 'หน่วยการเรียนรู้',
    });
  };

  const handleConfirmDeleteSubTask = () => {
    if (!subTaskToDelete) return;
    const { task } = subTaskToDelete;
    sgsRosterAndSubmissionService.deleteTermAssignment(task.id);
    setQueueItems([...teacherCourseAssignmentService.getGradingQueue()]);
    refreshTermAssignments();
    showToast(`✓ ลบงานย่อย "${task.title}" เรียบร้อยแล้ว`);
    setSubTaskToDelete(null);
  };

  const formatDueDateThai = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return formatThaiDateShort(dateStr);
    } catch {
      return dateStr;
    }
  };

  const matrixUnits = useMemo(() => {
    const unitMap = new Map<
      string,
      {
        id: string;
        title: string;
        maxScore: number;
        scoringMethod: 'SUBMISSION_COUNT_RATIO' | 'RAW_SCORE_AVERAGE';
        totalTasks: number;
        autoRoundUp: boolean;
        assignments: TermAssignmentConfig[];
      }
    >();
    const independent: TermAssignmentConfig[] = [];

    matrixAssignments.forEach((asg) => {
      const uKey = asg.unitId || (asg.scoringMethod && asg.scoringMethod !== 'DIRECT_SCORE' ? asg.unitTitle : undefined);
      if (uKey && asg.scoringMethod && asg.scoringMethod !== 'DIRECT_SCORE') {
        const existing = unitMap.get(uKey) || {
          id: asg.unitId || uKey,
          title: asg.unitTitle || uKey,
          maxScore: asg.unitMaxScore ?? 10,
          scoringMethod: (asg.scoringMethod as any) || 'SUBMISSION_COUNT_RATIO',
          totalTasks: asg.totalTasksInUnit || 0,
          autoRoundUp: asg.autoRoundUp ?? true,
          assignments: [] as TermAssignmentConfig[],
        };
        existing.assignments.push(asg);
        if (asg.totalTasksInUnit && asg.totalTasksInUnit > existing.totalTasks) {
          existing.totalTasks = asg.totalTasksInUnit;
        }
        unitMap.set(uKey, existing);
      } else {
        independent.push(asg);
      }
    });

    unitMap.forEach((u) => {
      if (u.totalTasks <= 0) u.totalTasks = u.assignments.length;
    });

    return {
      unitList: Array.from(unitMap.values()),
      independentList: independent,
    };
  }, [matrixAssignments]);

  const handleBulkGradeClassroom = () => {
    sgsRosterAndSubmissionService.bulkGradeAllSubmitted();
    setQueueItems(teacherCourseAssignmentService.getGradingQueue());
    refreshMatrixStudents();
    showToast('⚡ ให้คะแนนเต็มทุกคนที่ส่งงานแล้วในห้องนี้เรียบร้อยแล้ว');
  };

  const handleExportMatrixCsv = () => {
    if (matrixStudents.length === 0) {
      showToast('ไม่มีข้อมูลนักเรียนสำหรับส่งออก');
      return;
    }
    const headers = ['เลขที่', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ห้องเรียน'];
    matrixUnits.unitList.forEach((u) => {
      u.assignments.forEach((asg) => {
        headers.push(`"${u.title} - ${asg.title} (${asg.maxScore} คะแนน)"`);
      });
      headers.push(`"สรุปคะแนน: ${u.title} (เต็ม ${u.maxScore})"`);
    });
    matrixUnits.independentList.forEach((asg) => {
      headers.push(`"${asg.title} (${asg.maxScore} คะแนน)"`);
    });
    headers.push('คะแนนรวมทุกงาน');

    const rows = matrixStudents.map((stu) => {
      const row = [
        stu.sgsSeatNo,
        `"${stu.studentCode}"`,
        `"${stu.studentName}"`,
        `"${stu.classroom || matrixClassroom}"`,
      ];
      let totalEarned = 0;
      matrixUnits.unitList.forEach((u) => {
        let submittedInUnit = 0;
        let earnedInUnit = 0;
        let maxInUnit = 0;
        u.assignments.forEach((asg) => {
          const sub = allSubmissions.find((s) => s.assignmentId === asg.id && s.studentCode === stu.studentCode);
          const score = sub?.score ?? (sub?.status === 'SUBMITTED_PENDING' ? asg.maxScore : 0);
          if (sub && sub.status !== 'MISSING') {
            submittedInUnit += 1;
            earnedInUnit += score;
          }
          maxInUnit += asg.maxScore;
          row.push(sub ? (sub.score !== null ? String(sub.score) : 'รอตรวจ') : 'ยังไม่ส่ง');
        });

        let uScore = 0;
        if (u.scoringMethod === 'SUBMISSION_COUNT_RATIO') {
          const clamped = Math.min(u.totalTasks, Math.max(0, submittedInUnit));
          const raw = u.totalTasks > 0 ? (clamped / u.totalTasks) * u.maxScore : 0;
          uScore = u.autoRoundUp
            ? (Math.round((raw - Math.floor(raw)) * 100) / 100 >= 0.5 ? Math.ceil(raw) : Math.floor(raw))
            : Math.round(raw * 10) / 10;
        } else {
          const ratio = maxInUnit > 0 ? earnedInUnit / maxInUnit : 0;
          const raw = ratio * u.maxScore;
          uScore = u.autoRoundUp
            ? (Math.round((raw - Math.floor(raw)) * 100) / 100 >= 0.5 ? Math.ceil(raw) : Math.floor(raw))
            : Math.round(raw * 10) / 10;
        }
        totalEarned += uScore;
        row.push(String(uScore));
      });

      matrixUnits.independentList.forEach((asg) => {
        const sub = allSubmissions.find((s) => s.assignmentId === asg.id && s.studentCode === stu.studentCode);
        const score = sub?.score ?? 0;
        totalEarned += score;
        row.push(sub ? (sub.score !== null ? String(sub.score) : 'รอตรวจ') : 'ยังไม่ส่ง');
      });

      row.push(String(totalEarned));
      return row.join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ตารางแจกแจงคะแนน_${selectedSubjectCode}_${matrixClassroom}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ ดาวน์โหลดไฟล์ตารางแจกแจงคะแนนสำเร็จ');
  };

  useEffect(() => {
    const handleQueueUpdate = () => {
      setQueueItems([...teacherCourseAssignmentService.getGradingQueue()]);
      refreshTermAssignments();
      refreshMatrixStudents();
    };
    window.addEventListener('kp-grading-queue-updated', handleQueueUpdate);
    window.addEventListener('kp-sgs-roster-updated', handleQueueUpdate);
    window.addEventListener('kps-data-sync-event', handleQueueUpdate);
    return () => {
      window.removeEventListener('kp-grading-queue-updated', handleQueueUpdate);
      window.removeEventListener('kp-sgs-roster-updated', handleQueueUpdate);
      window.removeEventListener('kps-data-sync-event', handleQueueUpdate);
    };
  }, [refreshTermAssignments, refreshMatrixStudents]);

  // กรองคิวส่งงานตามรายวิชาและห้องเรียนที่เลือกใน Dropdown (Scoped Queue)
  const scopedQueue = useMemo(() => {
    return queueItems.filter((item) => {
      if (selectedSubjectCode !== 'ALL') {
        const cleanItemSubj = item.subjectCode?.trim().toUpperCase();
        const cleanSelectedSubj = selectedSubjectCode?.trim().toUpperCase();
        if (cleanItemSubj !== cleanSelectedSubj) {
          return false;
        }
      }
      if (selectedRoom !== 'ALL') {
        const normItemRoom = formatClassroomLabel(item.classroom);
        const normSelectedRoom = formatClassroomLabel(selectedRoom);
        if (normItemRoom !== normSelectedRoom) {
          return false;
        }
      }
      return true;
    });
  }, [queueItems, selectedSubjectCode, selectedRoom]);

  // สถิติยอดงานตามเงื่อนไข Dropdown (ทั้งหมด, รอตรวจ, ส่งกลับแก้ไข, ตรวจแล้ว)
  const stats = useMemo(() => {
    const total = scopedQueue.length;
    const pending = scopedQueue.filter((i) => i.status === 'PENDING_REVIEW').length;
    const returned = scopedQueue.filter((i) => i.status === 'RETURNED' || i.status === 'RETURNED_REVISION').length;
    const graded = scopedQueue.filter((i) => i.status === 'GRADED').length;
    return { total, pending, returned, graded };
  }, [scopedQueue]);

  // Filtered Submissions (ตามแท็บสถานะและคำค้นหา)
  const filteredSubmissions = useMemo(() => {
    return scopedQueue.filter((item) => {
      if (selectedStatus === 'PENDING' && item.status !== 'PENDING_REVIEW') {
        return false;
      }
      if (
        selectedStatus === 'RETURNED' &&
        item.status !== 'RETURNED' &&
        item.status !== 'RETURNED_REVISION'
      ) {
        return false;
      }
      if (selectedStatus === 'GRADED' && item.status !== 'GRADED') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.studentName.toLowerCase().includes(q);
        const matchesCode = item.studentCode.includes(q);
        const matchesTitle = item.assignmentTitle.toLowerCase().includes(q);
        const matchesSeat = String(item.seatNo) === q;
        if (!matchesName && !matchesCode && !matchesTitle && !matchesSeat) {
          return false;
        }
      }
      return true;
    });
  }, [scopedQueue, selectedStatus, searchQuery]);

  const handleSaveGrade = (itemId: string, score: number, feedback: string) => {
    const targetItem = queueItems.find((i) => i.id === itemId);
    if (!targetItem) return;

    const currentQueueIdx = queueItems.findIndex((i) => i.id === itemId);
    const { nextPendingItem } = teacherCourseAssignmentService.submitGrade(itemId, score, feedback, currentQueueIdx);

    sgsRosterAndSubmissionService.gradeSubmission(
      targetItem.assignmentId,
      targetItem.studentCode,
      score,
      'GRADED',
      feedback
    );

    showToast(
      `✓ บันทึกคะแนน ${targetItem.studentName} (${score}/${targetItem.maxScore} คะแนน) เรียบร้อยแล้ว`
    );

    if (nextPendingItem) {
      const nextFiltered = filteredSubmissions.find((i) => i.id === nextPendingItem.id);
      if (nextFiltered) {
        setGradingModalItem(nextFiltered);
        return;
      }
    }

    const currentFilteredIdx = filteredSubmissions.findIndex((i) => i.id === itemId);
    const forwardInFilter = currentFilteredIdx >= 0
      ? filteredSubmissions.slice(currentFilteredIdx + 1).find((i) => i.status === 'PENDING_REVIEW')
      : undefined;
    const nextInFilter = forwardInFilter || filteredSubmissions.find(
      (i) => i.id !== itemId && i.status === 'PENDING_REVIEW'
    );
    if (nextInFilter) {
      setGradingModalItem(nextInFilter);
    } else {
      setGradingModalItem(null);
      showToast('🎉 ตรวจครบทุกชิ้นในคิวนี้เรียบร้อยแล้ว!');
    }
  };

  const handleReturnSubmission = (itemId: string, reason: string, note?: string) => {
    const targetItem = queueItems.find((i) => i.id === itemId);
    if (!targetItem) return;

    teacherCourseAssignmentService.returnSubmission(itemId, reason, note);
    sgsRosterAndSubmissionService.returnSubmissionForRevision(
      targetItem.assignmentId,
      targetItem.studentCode,
      reason,
      note
    );

    setQueueItems(teacherCourseAssignmentService.getGradingQueue());
    showToast(`✓ ส่งงานกลับให้ ${targetItem.studentName} แก้ไขเรียบร้อยแล้ว (${reason})`);

    const currentFilteredIdx = filteredSubmissions.findIndex((i) => i.id === itemId);
    const forwardInFilter = currentFilteredIdx >= 0
      ? filteredSubmissions.slice(currentFilteredIdx + 1).find((i) => i.status === 'PENDING_REVIEW')
      : undefined;
    const nextInFilter = forwardInFilter || filteredSubmissions.find(
      (i) => i.id !== itemId && i.status === 'PENDING_REVIEW'
    );
    if (nextInFilter) {
      setGradingModalItem(nextInFilter);
    } else {
      setGradingModalItem(null);
    }
  };

  const handleOpenCheckMatrix = (courseCode?: string, targetRooms?: string[]) => {
    const courseToUse =
      courseCode ||
      (selectedSubjectCode !== 'ALL' ? selectedSubjectCode : subjectsList[0]?.courseCode || 'ท23102');
    const courseTaughtRooms = courseToUse ? getTeacherTaughtClassrooms(courseToUse) : [];
    const specificTargetRoom = targetRooms?.find((r) => r && r !== 'ALL');
    const roomToUse =
      specificTargetRoom ||
      (selectedRoom !== 'ALL' ? selectedRoom : courseTaughtRooms[0] || availableFilterRooms[0] || 'ม.1/1');

    if (courseToUse) {
      setSelectedSubjectCode(courseToUse);
      setMatrixModalDefaultSubject(courseToUse);
    }
    if (roomToUse) {
      setSelectedRoom(roomToUse);
      setMatrixModalDefaultRoom(roomToUse);
    }
    setIs3ColorMatrixOpen(true);
  };

  const handleStartFirstPending = () => {
    const firstPending =
      filteredSubmissions.find((i) => i.status === 'PENDING_REVIEW') || filteredSubmissions[0];
    if (firstPending) {
      setGradingModalItem(firstPending);
    } else {
      showToast('ไม่มีงานรอตรวจในเงื่อนไขตัวกรองนี้');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 font-['Prompt',sans-serif] text-[#163A66] pb-20">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#163A66] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold border border-blue-400/30">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ====================================================================
          1. HEADER (Design System: Modern SaaS + Date/Term Pill + CTA)
         ==================================================================== */}
      <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 sm:p-5 shadow-[0_4px_16px_rgba(40,90,140,0.06)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Icon + Title + Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#3B82F6] shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#163A66]">
              การสั่งงานและตรวจงาน (เชื่อมสมุดคะแนน ปพ.5)
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7C93] mt-0.5">
              สั่งงานรายห้องหรือทุกห้องในรายวิชา และตรวจให้คะแนนทั้ง 4 ส่วนของ ปพ.5 อัตโนมัติ
            </p>
          </div>
        </div>

        {/* Right: Date & Academic Term Pill + CTA Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-2xl border border-[#E6EEF7] shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0 border border-[#BFDBFE]/60">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-[#163A66]">
                {todayThaiFull}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#6B7C93]">
                <span>ภาคเรียนที่ {selectedTerm}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-blue-50 text-[#3B82F6] text-[10px] font-bold border border-blue-200">
                  Active
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenCreateModal({ forceUnitMode: true, isNewUnit: true })}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-blue-50/70 border border-[#BFDBFE] text-[#3B82F6] text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer"
              title="ตั้งหน่วยการเรียนรู้ / จุดประสงค์ใหม่ ก่อนสั่งงานย่อย"
            >
              <Layers className="w-4 h-4 text-[#3B82F6]" />
              <span>+ ตั้งหน่วยการเรียนรู้</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ สั่งงานใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs + Help Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center bg-[#F2F7FC] p-1 rounded-2xl border border-[#E6EEF7] gap-1">
          <button
            type="button"
            onClick={() => setActiveSectionTab('ASSIGNED_LIST')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSectionTab === 'ASSIGNED_LIST'
                ? 'bg-white text-[#3B82F6] shadow-xs border border-[#BFDBFE]/60'
                : 'text-[#6B7C93] hover:text-[#163A66]'
            }`}
          >
            1. รายการงานสั่งสอน ({enrichedAssignmentCards.length})
          </button>
          <button
            type="button"
            onClick={() => { if (onNavigate) { onNavigate('grading-queue'); } else { setActiveSectionTab('SUBMISSIONS'); } }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSectionTab === 'SUBMISSIONS'
                ? 'bg-white text-[#3B82F6] shadow-xs border border-[#BFDBFE]/60'
                : 'text-[#6B7C93] hover:text-[#163A66]'
            }`}
          >
            2. คิวตรวจงานที่ส่งเข้ามา ({stats.pending} รอตรวจ)
          </button>
          <button
            type="button"
            onClick={() => { if (onNavigate) { onNavigate('score-matrix'); } else { setActiveSectionTab('SCORE_MATRIX'); } }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSectionTab === 'SCORE_MATRIX'
                ? 'bg-white text-[#3B82F6] shadow-xs border border-[#BFDBFE]/60'
                : 'text-[#6B7C93] hover:text-[#163A66]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>3. ตารางแจกแจงคะแนน ปพ.5</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Secondary View Icon Buttons */}
          <button
            type="button"
            onClick={() => setIsSgsMatrixOpen(true)}
            title="ตารางคะแนนรายห้อง"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#163A66] cursor-pointer shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#3B82F6]" />
            <span className="hidden sm:inline">ตารางคะแนนรายห้อง</span>
          </button>

          <button
            type="button"
            onClick={() => setIs3ColorMatrixOpen(true)}
            title="เช็คการส่งงาน 3 สี"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#163A66] cursor-pointer shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">เช็คการส่งงาน 3 สี</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBundlesModalOpen(true)}
            title="รวมคะแนน/หารเฉลี่ย"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#163A66] cursor-pointer shadow-xs transition-colors"
          >
            <Layers className="w-4 h-4 text-purple-500" />
            <span className="hidden sm:inline">รวมคะแนน/หารเฉลี่ย</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHelpModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#6B7C93] hover:text-[#163A66] cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#3B82F6]" />
            <span>วิธีใช้งาน</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          SECTION A: รายการงานสั่งสอน (Modern Premium SaaS View)
         ==================================================================== */}
      {activeSectionTab === 'ASSIGNED_LIST' && (
        <div className="space-y-4">
          {/* Top 5 Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Card 1: งานทั้งหมด */}
            <div
              onClick={() => {
                setSelectedStatusFilter('ALL');
                setCurrentPage(1);
              }}
              className={`p-4 rounded-[18px] border bg-white shadow-[0_4px_16px_rgba(40,90,140,0.06)] flex items-center gap-3.5 cursor-pointer transition-all ${
                selectedStatusFilter === 'ALL'
                  ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/20 bg-blue-50/20'
                  : 'border-[#E6EEF7] hover:border-[#BFDBFE]'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0 border border-[#BFDBFE]/60">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-[#6B7C93] font-medium">งานทั้งหมด</div>
                <div className="text-xl sm:text-2xl font-bold text-[#163A66] leading-tight">
                  {assignmentSummaryStats.total}
                </div>
                <div className="text-[11px] text-[#94A3B8]">รายการ</div>
              </div>
            </div>

            {/* Card 2: รอตรวจงาน (Red Alert) */}
            <div
              onClick={() => {
                setSelectedStatusFilter('PENDING_REVIEW');
                setCurrentPage(1);
              }}
              className={`p-4 rounded-[18px] border bg-white shadow-[0_4px_16px_rgba(40,90,140,0.06)] flex items-center gap-3.5 cursor-pointer transition-all ${
                selectedStatusFilter === 'PENDING_REVIEW'
                  ? 'border-[#EF4444] ring-2 ring-[#EF4444]/20 bg-rose-50/20'
                  : assignmentSummaryStats.pendingReview > 0
                  ? 'border-[#FECACA] hover:border-[#EF4444] bg-[#FEF2F2]/40'
                  : 'border-[#E6EEF7] hover:border-[#BFDBFE]'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                assignmentSummaryStats.pendingReview > 0
                  ? 'bg-[#FEF2F2] text-[#EF4444] border-[#FECACA]'
                  : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}>
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-[#6B7C93] font-medium flex items-center gap-1.5">
                  <span>รอตรวจงาน</span>
                  {assignmentSummaryStats.pendingReview > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                  )}
                </div>
                <div className={`text-xl sm:text-2xl font-bold leading-tight ${
                  assignmentSummaryStats.pendingReview > 0 ? 'text-[#991B1B]' : 'text-[#163A66]'
                }`}>
                  {assignmentSummaryStats.pendingReview}
                </div>
                <div className="text-[11px] text-[#94A3B8]">รายการ</div>
              </div>
            </div>

            {/* Card 3: กำลังตรวจ */}
            <div
              onClick={() => {
                setSelectedStatusFilter('IN_PROGRESS');
                setCurrentPage(1);
              }}
              className={`p-4 rounded-[18px] border bg-white shadow-[0_4px_16px_rgba(40,90,140,0.06)] flex items-center gap-3.5 cursor-pointer transition-all ${
                selectedStatusFilter === 'IN_PROGRESS'
                  ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/20 bg-blue-50/20'
                  : 'border-[#E6EEF7] hover:border-[#BFDBFE]'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0 border border-[#BFDBFE]/60">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-[#6B7C93] font-medium">กำลังดำเนินการ</div>
                <div className="text-xl sm:text-2xl font-bold text-[#163A66] leading-tight">
                  {assignmentSummaryStats.inProgress}
                </div>
                <div className="text-[11px] text-[#94A3B8]">รายการ</div>
              </div>
            </div>

            {/* Card 4: ตรวจแล้ว */}
            <div
              onClick={() => {
                setSelectedStatusFilter('GRADED');
                setCurrentPage(1);
              }}
              className={`p-4 rounded-[18px] border bg-white shadow-[0_4px_16px_rgba(40,90,140,0.06)] flex items-center gap-3.5 cursor-pointer transition-all ${
                selectedStatusFilter === 'GRADED'
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                  : 'border-[#E6EEF7] hover:border-[#A7F3D0]'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center shrink-0 border border-[#A7F3D0]/60">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-[#6B7C93] font-medium">ตรวจแล้ว</div>
                <div className="text-xl sm:text-2xl font-bold text-[#163A66] leading-tight">
                  {assignmentSummaryStats.graded}
                </div>
                <div className="text-[11px] text-[#94A3B8]">รายการ</div>
              </div>
            </div>

            {/* Card 5: รอส่งคะแนน */}
            <div
              onClick={() => {
                setSelectedStatusFilter('PENDING_SCORE');
                setCurrentPage(1);
              }}
              className={`p-4 rounded-[18px] border bg-white shadow-[0_4px_16px_rgba(40,90,140,0.06)] flex items-center gap-3.5 cursor-pointer transition-all ${
                selectedStatusFilter === 'PENDING_SCORE'
                  ? 'border-purple-400 ring-2 ring-purple-400/20 bg-purple-50/20'
                  : 'border-[#E6EEF7] hover:border-[#FECACA]'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] text-[#8B5CF6] flex items-center justify-center shrink-0 border border-[#DDD6FE]/60">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-[#6B7C93] font-medium">รอส่งคะแนน</div>
                <div className="text-xl sm:text-2xl font-bold text-[#163A66] leading-tight">
                  {assignmentSummaryStats.pendingScore}
                </div>
                <div className="text-[11px] text-[#94A3B8]">รายการ</div>
              </div>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedStatusFilter('ALL');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedStatusFilter === 'ALL'
                  ? 'bg-[#3B82F6] text-white shadow-xs'
                  : 'bg-white text-[#6B7C93] hover:text-[#163A66] border border-[#E6EEF7]'
              }`}
            >
              ทั้งหมด ({assignmentSummaryStats.total})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedStatusFilter('PENDING_REVIEW');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedStatusFilter === 'PENDING_REVIEW'
                  ? 'bg-[#EF4444] text-white shadow-xs'
                  : assignmentSummaryStats.pendingReview > 0
                  ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] hover:bg-rose-100'
                  : 'bg-white text-[#6B7C93] hover:text-[#163A66] border border-[#E6EEF7]'
              }`}
            >
              {assignmentSummaryStats.pendingReview > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
              )}
              <span>รอตรวจ ({assignmentSummaryStats.pendingReview})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedStatusFilter('IN_PROGRESS');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedStatusFilter === 'IN_PROGRESS'
                  ? 'bg-[#3B82F6] text-white shadow-xs'
                  : 'bg-white text-[#6B7C93] hover:text-[#163A66] border border-[#E6EEF7]'
              }`}
            >
              กำลังตรวจ ({assignmentSummaryStats.inProgress})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedStatusFilter('GRADED');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedStatusFilter === 'GRADED'
                  ? 'bg-[#10B981] text-white shadow-xs'
                  : 'bg-white text-[#6B7C93] hover:text-[#163A66] border border-[#E6EEF7]'
              }`}
            >
              ตรวจแล้ว ({assignmentSummaryStats.graded})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedStatusFilter('PENDING_SCORE');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedStatusFilter === 'PENDING_SCORE'
                  ? 'bg-[#8B5CF6] text-white shadow-xs'
                  : 'bg-white text-[#6B7C93] hover:text-[#163A66] border border-[#E6EEF7]'
              }`}
            >
              รอส่งคะแนน ({assignmentSummaryStats.pendingScore})
            </button>
          </div>

          {/* Filter Bar (ภาคเรียน, ระดับชั้น, รายวิชา, ค้นหา, ตัวกรองเพิ่มเติม) */}
          <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 shadow-[0_4px_16px_rgba(40,90,140,0.06)] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              {/* Term Filter */}
              <div className="lg:col-span-2">
                <label className="text-[11px] font-semibold text-[#6B7C93] block mb-1">
                  ภาคเรียน
                </label>
                <select
                  value={selectedTerm}
                  onChange={(e) => {
                    setSelectedTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="2/2569">2/2569</option>
                  <option value="1/2569">1/2569</option>
                  <option value="ALL">ทุกภาคเรียน</option>
                </select>
              </div>

              {/* Grade Level Filter */}
              <div className="lg:col-span-2">
                <label className="text-[11px] font-semibold text-[#6B7C93] block mb-1">
                  ระดับชั้น
                </label>
                <select
                  value={selectedGradeLevel}
                  onChange={(e) => {
                    setSelectedGradeLevel(e.target.value);
                    setSelectedRoom('ALL');
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="ALL">ทุกระดับชั้น</option>
                  <option value="ม.1">มัธยมศึกษาปีที่ 1 (ม.1)</option>
                  <option value="ม.2">มัธยมศึกษาปีที่ 2 (ม.2)</option>
                  <option value="ม.3">มัธยมศึกษาปีที่ 3 (ม.3)</option>
                  <option value="ม.4">มัธยมศึกษาปีที่ 4 (ม.4)</option>
                  <option value="ม.5">มัธยมศึกษาปีที่ 5 (ม.5)</option>
                  <option value="ม.6">มัธยมศึกษาปีที่ 6 (ม.6)</option>
                </select>
              </div>

              {/* Subject Filter */}
              <div className="lg:col-span-3">
                <label className="text-[11px] font-semibold text-[#6B7C93] block mb-1">
                  รายวิชา
                </label>
                <select
                  value={selectedSubjectCode}
                  onChange={(e) => {
                    setSelectedSubjectCode(e.target.value);
                    setSelectedRoom('ALL');
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="ALL">ทุกวิชา</option>
                  {subjectsList.map((subj) => (
                    <option key={subj.courseCode} value={subj.courseCode}>
                      {subj.courseCode} — {subj.courseName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="lg:col-span-3">
                <label className="text-[11px] font-semibold text-[#6B7C93] block mb-1">
                  ค้นหาชื่องาน / รายวิชา:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="ค้นหาชื่อหน่วย / รายวิชา / รหัสงาน..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>
              </div>

              {/* More Filters Toggle */}
              <div className="lg:col-span-2">
                <button
                  type="button"
                  onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
                  className={`w-full py-2 px-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    isMoreFiltersOpen || selectedRoom !== 'ALL' || selectedScorePart !== 'ALL'
                      ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#3B82F6]'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-[#6B7C93]'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>ตัวกรองเพิ่มเติม</span>
                  {(selectedRoom !== 'ALL' || selectedScorePart !== 'ALL') && (
                    <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                  )}
                </button>
              </div>
            </div>

            {/* Expandable Extra Filters Row */}
            {isMoreFiltersOpen && (
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
                <div>
                  <label className="text-[11px] font-semibold text-[#6B7C93] block mb-1">
                    ห้องเรียน:
                  </label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => {
                      setSelectedRoom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    <option value="ALL">ทุกห้องเรียน ({availableFilterRooms.length} ห้อง)</option>
                    {availableFilterRooms.map((room) => (
                      <option key={room} value={room}>
                        ห้อง {room}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#6B7C93] block mb-1">
                    ส่วนคะแนน ปพ.5:
                  </label>
                  <select
                    value={selectedScorePart}
                    onChange={(e) => {
                      setSelectedScorePart(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  >
                    <option value="ALL">ทุกส่วนคะแนน (4 ส่วน)</option>
                    <option value="PRE_MIDTERM">คะแนนก่อนกลางภาค</option>
                    <option value="MIDTERM">คะแนนกลางภาค</option>
                    <option value="POST_MIDTERM">คะแนนหลังกลางภาค</option>
                    <option value="FINAL">คะแนนปลายภาค</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubjectCode('ALL');
                      setSelectedRoom('ALL');
                      setSelectedGradeLevel('ALL');
                      setSelectedScorePart('ALL');
                      setSelectedStatusFilter('ALL');
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-[#6B7C93] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ล้างตัวกรองทั้งหมด</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Card Container: รายการงานสั่งสอน */}
          <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 sm:p-5 shadow-[0_4px_16px_rgba(40,90,140,0.06)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0 border border-[#BFDBFE]/60">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#163A66]">
                  รายการงานสั่งสอน ({statusFilteredCards.length} รายการ)
                </h2>
              </div>

              <button
                type="button"
                onClick={() => handleOpenCreateModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ สั่งงานเพิ่ม</span>
              </button>
            </div>

            {/* Empty State */}
            {displayedAssignmentCards.length === 0 ? (
              <div className="py-12 px-4 text-center bg-[#F7FAFF] rounded-2xl border border-dashed border-[#BFDBFE] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#163A66]">ยังไม่มีรายการสั่งงานในเงื่อนไขนี้</p>
                  <p className="text-xs text-[#6B7C93] mt-0.5">
                    {termAssignments.length === 0
                      ? 'กดปุ่ม "+ สั่งงานใหม่" เพื่อมอบหมายงานให้นักเรียนในรายวิชา'
                      : 'ลองปรับเปลี่ยนตัวกรอง หรือกด "ล้างตัวกรอง" เพื่อดูรายการงานทั้งหมด'}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenCreateModal()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>สั่งงานใหม่ทันที</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedAssignmentCards.map((item) => {
                  const partMeta = SCORE_PART_LABELS[item.scorePart] || SCORE_PART_LABELS.PRE_MIDTERM;
                  const roomsText =
                    item.targetClassrooms && item.targetClassrooms.length > 0
                      ? item.targetClassrooms.join(', ')
                      : 'ทุกห้อง';

                  const isMenuOpen = openMeatballMenuId === item.id;
                  const isExpanded = expandedUnitKeys.has(item.key);

                  return (
                    <div
                      key={item.key}
                      className="relative bg-white rounded-2xl border border-[#E6EEF7] hover:border-[#BFDBFE] p-4 sm:p-5 transition-all shadow-2xs space-y-3"
                    >
                      {/* Left indicator bar */}
                      <div
                        className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r ${
                          item.displayStatus === 'PENDING_REVIEW'
                            ? 'bg-rose-500'
                            : item.displayStatus === 'GRADED'
                            ? 'bg-emerald-500'
                            : item.displayStatus === 'IN_PROGRESS'
                            ? 'bg-[#3B82F6]'
                            : 'bg-amber-400'
                        }`}
                      />

                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pl-2">
                        {/* Left Column: Status Badge + Title + Course / Room metadata */}
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          {/* Status Pill Badge */}
                          {item.displayStatus === 'PENDING_REVIEW' && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] flex items-center gap-1.5 shrink-0 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                              <span>รอตรวจ ({item.pendingReviewCount} งาน)</span>
                            </span>
                          )}
                          {item.displayStatus === 'GRADED' && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] flex items-center gap-1.5 shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                              <span>ตรวจแล้ว</span>
                            </span>
                          )}
                          {item.displayStatus === 'IN_PROGRESS' && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] flex items-center gap-1.5 shrink-0">
                              <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
                              <span>กำลังตรวจ</span>
                            </span>
                          )}
                          {item.displayStatus === 'PENDING_SCORE' && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] flex items-center gap-1.5 shrink-0">
                              <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                              <span>{item.submittedCount > 0 || (item.progressCount > 0) ? 'รอส่งคะแนน' : 'รอนักเรียนส่งงาน'}</span>
                            </span>
                          )}

                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  item.displayStatus === 'PENDING_REVIEW'
                                    ? 'bg-rose-500'
                                    : item.displayStatus === 'GRADED'
                                    ? 'bg-emerald-500'
                                    : item.displayStatus === 'IN_PROGRESS'
                                    ? 'bg-[#3B82F6]'
                                    : 'bg-amber-400'
                                }`}
                              />
                              <h3 className="text-sm sm:text-base font-bold text-[#163A66] break-words">
                                {item.displayTitle}
                              </h3>
                              {item.isUnitBundle && item.subTasks.length >= 1 && (
                                <button
                                  type="button"
                                  onClick={() => toggleUnitExpand(item.key)}
                                  className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 text-[#6B7C93] hover:text-[#3B82F6] flex items-center gap-1 cursor-pointer transition-colors"
                                  title={isExpanded ? 'ย่อรายการงานย่อย' : 'ขยายดูรายการงานย่อย'}
                                >
                                  <span>{item.subTasks.length} งานย่อย</span>
                                  <ChevronDown
                                    className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  />
                                </button>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#6B7C93]">
                              <span>
                                วิชา: <strong className="text-[#163A66]">{item.courseCode} {item.courseName}</strong>
                              </span>
                              <span>|</span>
                              <span className="font-medium text-[#163A66]">
                                {roomsText}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${partMeta.cls}`}
                              >
                                {partMeta.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Middle Stats Columns */}
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 shrink-0 text-xs">
                          {/* Due Date */}
                          <div className="min-w-[100px]">
                            <div className="text-[11px] text-[#94A3B8] flex items-center gap-1 mb-0.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>กำหนดส่ง</span>
                            </div>
                            <div className="text-xs sm:text-sm font-semibold text-[#163A66] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{formatDueDateThai(item.dueDate)}</span>
                            </div>
                          </div>

                          {/* Max Score */}
                          <div className="min-w-[80px]">
                            <div className="text-[11px] text-[#94A3B8] mb-0.5">คะแนนเต็ม</div>
                            <div className="text-xs sm:text-sm font-bold text-[#163A66]">
                              {item.maxScore} คะแนน
                            </div>
                          </div>

                          {/* Submission Progress */}
                          <div className="min-w-[120px] sm:min-w-[150px]">
                            <div className="text-[11px] text-[#94A3B8] flex items-center justify-between mb-0.5">
                              <span>
                                {item.pendingReviewCount > 0
                                  ? 'ส่งงานแล้ว'
                                  : item.progressPercent === 100
                                  ? 'ตรวจครบแล้ว'
                                  : 'ส่งงานแล้ว'}
                              </span>
                              <span className="font-bold text-[#163A66]">
                                {item.progressCount}/{item.totalTargetCount} {item.progressUnitLabel}
                                {item.pendingReviewCount > 0 && (
                                  <span className="text-[10px] font-semibold text-rose-500 ml-1">
                                    (รอตรวจ {item.pendingReviewCount})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  item.pendingReviewCount > 0
                                    ? 'bg-[#3B82F6]'
                                    : item.progressPercent === 100
                                    ? 'bg-emerald-500'
                                    : item.progressPercent > 0
                                    ? 'bg-[#3B82F6]'
                                    : 'bg-transparent'
                                }`}
                                style={{ width: `${item.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Right Action & Meatball Menu */}
                        <div className="flex items-center gap-2 self-end lg:self-center shrink-0 relative">
                          {item.displayStatus === 'PENDING_REVIEW' && (
                            <button
                              type="button"
                              onClick={() => handleRowPrimaryAction(item)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>ตรวจงาน ({item.pendingReviewCount})</span>
                            </button>
                          )}

                          {item.displayStatus === 'GRADED' && (
                            <button
                              type="button"
                              onClick={() => handleRowPrimaryAction(item)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[#3B82F6] text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer"
                            >
                              <BarChart2 className="w-4 h-4 text-[#3B82F6]" />
                              <span>ดูผลคะแนน</span>
                            </button>
                          )}

                          {item.displayStatus === 'IN_PROGRESS' && (
                            <button
                              type="button"
                              onClick={() => handleRowPrimaryAction(item)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] text-[#3B82F6] text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer"
                            >
                              <RefreshCw className="w-4 h-4 text-[#3B82F6]" />
                              <span>กำลังตรวจ</span>
                            </button>
                          )}

                          {item.displayStatus === 'PENDING_SCORE' &&
                            (item.submittedCount > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleRowPrimaryAction(item)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                                <span>ตรวจงาน</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRowPrimaryAction(item)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-[#3B82F6] text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer"
                              >
                                <ClipboardList className="w-3.5 h-3.5 text-[#3B82F6]" />
                                <span>รายการส่งงาน</span>
                              </button>
                            ))}

                          {/* ถ้าเป็นงานในหน่วย ให้มีปุ่มลัด "+ สั่งงานย่อยในหน่วยนี้" เด่นชัด เพื่อแยกการสั่งงานหน่วยย่อยไม่สับสน */}
                          {item.isUnitBundle && (
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenCreateModal({
                                  courseCode: item.courseCode,
                                  unitTitle: item.unitTitle,
                                  unitId: item.unitId,
                                  unitMaxScore: item.maxScore,
                                  scorePart: item.scorePart,
                                  targetClassrooms: item.targetClassrooms,
                                  isAddingToExistingUnit: true,
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50/80 hover:bg-blue-100 border border-blue-200 text-[#3B82F6] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                              title={`สั่งงานย่อยเพิ่มในหน่วย "${item.displayTitle}"`}
                            >
                              <Plus className="w-3.5 h-3.5 text-[#3B82F6]" />
                              <span>+ สั่งงานย่อย</span>
                            </button>
                          )}

                          {/* Meatballs menu */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMeatballMenuId(isMenuOpen ? null : item.id);
                              }}
                              className="p-2 rounded-xl text-slate-400 hover:text-[#163A66] hover:bg-slate-100 transition-colors cursor-pointer"
                              title="เมนูเพิ่มเติม"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-10 z-40 w-52 bg-white rounded-2xl border border-[#E6EEF7] shadow-xl py-1.5 text-xs font-semibold animate-scale-in"
                              >
                                {item.isUnitBundle ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMeatballMenuId(null);
                                        handleOpenEditUnitModal(item);
                                      }}
                                      className="w-full px-3.5 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-[#163A66] cursor-pointer font-bold"
                                    >
                                      <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
                                      <span>⚙️ แก้ไขการตั้งค่าหน่วย</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMeatballMenuId(null);
                                        handleOpenCreateModal({
                                          courseCode: item.courseCode,
                                          unitTitle: item.unitTitle,
                                          unitId: item.unitId,
                                          unitMaxScore: item.maxScore,
                                          scorePart: item.scorePart,
                                          targetClassrooms: item.targetClassrooms,
                                          isAddingToExistingUnit: true,
                                        });
                                      }}
                                      className="w-full px-3.5 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-[#163A66] cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5 text-[#3B82F6]" />
                                      <span>➕ สั่งงานย่อยเพิ่มในหน่วยนี้</span>
                                    </button>

                                    {item.subTasks.length === 1 ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMeatballMenuId(null);
                                          handleOpenEditSubTaskModal(item.subTasks[0], item);
                                        }}
                                        className="w-full px-3.5 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-[#163A66] cursor-pointer"
                                      >
                                        <Edit3 className="w-3.5 h-3.5 text-[#3B82F6]" />
                                        <span>✏️ แก้ไขงานย่อย ({item.subTasks[0].title})</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenMeatballMenuId(null);
                                          if (!isExpanded) {
                                            toggleUnitExpand(item.key);
                                          }
                                        }}
                                        className="w-full px-3.5 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-[#163A66] cursor-pointer"
                                      >
                                        <ClipboardList className="w-3.5 h-3.5 text-[#3B82F6]" />
                                        <span>📝 แสดง/แก้ไขงานย่อย ({item.subTasks.length} งาน)</span>
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMeatballMenuId(null);
                                      if (item.rawAssignment) {
                                        handleOpenEditModal(item.rawAssignment);
                                      }
                                    }}
                                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-[#163A66] cursor-pointer font-bold"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-[#3B82F6]" />
                                    <span>แก้ไขชิ้นงาน</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMeatballMenuId(null);
                                    handleOpenCheckMatrix(item.courseCode, item.targetClassrooms);
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-[#163A66] cursor-pointer"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#3B82F6]" />
                                  <span>ดูตารางคะแนน 3 สี ปพ.5</span>
                                </button>

                                <div className="my-1 border-t border-slate-100" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMeatballMenuId(null);
                                    handleDeleteAssignmentRow(item);
                                  }}
                                  className="w-full px-3.5 py-2 text-left hover:bg-rose-50 flex items-center gap-2 text-rose-600 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>ลบงาน</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Sub-tasks (if unit expanded) */}
                      {isExpanded && item.isUnitBundle && item.subTasks.length > 0 && (
                        <div className="mt-3 pl-4 sm:pl-8 pr-2 py-3 bg-[#F7FAFF] rounded-xl border border-blue-100/70 space-y-2">
                          <div className="text-[11px] font-bold text-[#6B7C93] mb-1">
                            รายการงานย่อยในหน่วยนี้ ({item.subTasks.length} งาน):
                          </div>
                          {item.subTasks.map((task, tIdx) => {
                            const taskSubs = allSubmissions.filter((s) => s.assignmentId === task.id);
                            const taskGraded = taskSubs.filter(
                              (s) => s.status === 'GRADED' || (s.score !== null && s.score !== undefined)
                            ).length;
                            const taskSubmitted = taskSubs.filter((s) => s.status !== 'MISSING').length;
                            const taskPending = taskSubs.filter(
                              (s) => s.status === 'SUBMITTED_PENDING' || (s.status !== 'GRADED' && s.score === null && s.status !== 'MISSING')
                            ).length;
                            return (
                              <div
                                key={task.id}
                                className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-blue-50 text-[#3B82F6] font-bold flex items-center justify-center text-[10px]">
                                    {tIdx + 1}
                                  </span>
                                  <span className="font-semibold text-[#163A66]">{task.title}</span>
                                  <span className="text-[11px] text-[#6B7C93]">
                                    (เต็ม {task.maxScore} คะแนน • กำหนดส่ง {formatDueDateThai(task.dueDate)})
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[11px] text-[#6B7C93]">
                                    ส่งแล้ว:{' '}
                                    <strong className="text-[#163A66]">
                                      {taskSubmitted}/{item.totalStudents}
                                    </strong>{' '}
                                    (ตรวจแล้ว {taskGraded})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const pendingQueueItem =
                                        queueItems.find(
                                          (q) =>
                                            q.assignmentId === task.id &&
                                            q.status === 'PENDING_REVIEW'
                                        ) ||
                                        queueItems.find((q) => q.assignmentId === task.id);

                                      if (pendingQueueItem) {
                                        setGradingModalItem(pendingQueueItem);
                                      } else {
                                        handleOpenCheckMatrix(item.courseCode, item.targetClassrooms);
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors ${
                                      taskPending > 0
                                        ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] hover:bg-rose-100 shadow-2xs'
                                        : 'bg-blue-50 text-[#3B82F6] hover:bg-blue-100'
                                    }`}
                                    title={taskPending > 0 ? `มีงานรอตรวจ ${taskPending} รายการ` : 'ตรวจงานย่อยนี้'}
                                  >
                                    {taskPending > 0 ? (
                                      <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
                                        <span>รอตรวจ ({taskPending})</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>ตรวจงานย่อย</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditSubTaskModal(task, item)}
                                    className="px-2.5 py-1 rounded-lg font-semibold text-[11px] text-[#163A66] bg-slate-100 hover:bg-blue-50 hover:text-[#3B82F6] border border-slate-200/80 transition-colors flex items-center gap-1 cursor-pointer"
                                    title={`แก้ไขงานย่อย "${task.title}"`}
                                  >
                                    <Edit3 className="w-3 h-3 text-[#3B82F6]" />
                                    <span>แก้ไขงานย่อย</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDeleteSubTaskModal(task, item.unitTitle || item.title)}
                                    className="px-2.5 py-1 rounded-lg font-semibold text-[11px] text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors flex items-center gap-1 cursor-pointer"
                                    title={`ลบงานย่อย "${task.title}"`}
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-500" />
                                    <span>ลบงานย่อย</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Footer */}
            {statusFilteredCards.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-[#6B7C93]">
                <div>
                  แสดง{' '}
                  {statusFilteredCards.length === 0
                    ? 0
                    : (currentPage - 1) * pageSize + 1}{' '}
                  - {Math.min(currentPage * pageSize, statusFilteredCards.length)} จาก{' '}
                  {statusFilteredCards.length} รายการ
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="หน้าก่อนหน้า"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {Array.from({ length: totalCardPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === i + 1
                          ? 'bg-[#3B82F6] text-white shadow-xs'
                          : 'border border-slate-200 bg-white text-[#6B7C93] hover:text-[#163A66] hover:bg-slate-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentPage >= totalCardPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalCardPages, p + 1))}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="หน้าถัดไป"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ====================================================================
          SECTION B: คิวตรวจงานที่นักเรียนส่งเข้ามา (FIFO Submissions Queue)
         ==================================================================== */}
      {activeSectionTab === 'SUBMISSIONS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleStartFirstPending}
                disabled={stats.pending === 0}
                className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>เริ่มตรวจงานทันที ({stats.pending} งานรอตรวจ)</span>
              </button>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['ALL', 'PENDING', 'RETURNED', 'GRADED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                      selectedStatus === st
                        ? 'bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE]'
                        : 'bg-slate-50 text-[#6B7C93]'
                    }`}
                  >
                    {st === 'ALL'
                      ? `ทั้งหมด (${stats.total})`
                      : st === 'PENDING'
                        ? `รอตรวจ (${stats.pending})`
                        : st === 'RETURNED'
                          ? `ส่งกลับแก้ไข (${stats.returned})`
                          : `ตรวจแล้ว (${stats.graded})`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[18px] border border-[#E6EEF7] overflow-hidden shadow-[0_4px_16px_rgba(40,90,140,0.06)]">
            {filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-[#163A66]">
                  ยังไม่มีผลงานที่นักเรียนส่งเข้ามาในเงื่อนไขนี้
                </h4>
                <p className="text-xs text-[#6B7C93]">
                  เมื่อนักเรียนส่งงานออนไลน์ รายการจะปรากฏที่นี่ตามลำดับเวลาส่งจริง
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredSubmissions.map((item, idx) => {
                  const isGraded = item.status === 'GRADED';
                  const isPdf =
                    item.submissionChannel === 'PDF_UPLOAD' ||
                    (item.fileName || '').endsWith('.pdf');
                  const isDrive = Boolean(
                    item.externalLinkUrl?.includes('drive.google.com') ||
                      item.externalLinkUrl?.includes('docs.google.com') ||
                      item.externalPlatform === 'GOOGLE_DRIVE'
                  );
                  const isLink =
                    item.submissionChannel === 'LINK_URL' || item.externalLinkUrl || isDrive;

                  // ดึงชื่อ ชั้น เลขที่จริงของนักเรียน
                  const resolvedStu = studentService.findStudentByCode(item.studentCode);
                  const displayName =
                    item.studentName && item.studentName !== item.studentCode
                      ? item.studentName
                      : resolvedStu?.student.name || `นักเรียน (${item.studentCode})`;
                  const displayRoom =
                    (item.classroom && item.classroom !== 'all' ? formatClassroomLabel(item.classroom) : '') ||
                    (resolvedStu?.classroomId ? formatClassroomLabel(resolvedStu.classroomId) : '') ||
                    'ไม่ระบุห้อง';
                  const displaySeat = item.seatNo ?? resolvedStu?.student.no ?? '-';

                  // ตรวจสอบข้อมูลคะแนนก่อนกลางภาคของชิ้นงานและนักเรียนคนนี้
                  const matchedAsg = termAssignments.find((a) => a.id === item.assignmentId);
                  const isPreMidterm = !matchedAsg?.scorePart || matchedAsg?.scorePart === 'PRE_MIDTERM';
                  const partBadgeText = matchedAsg?.scorePart
                    ? SCORE_PART_LABELS[matchedAsg.scorePart]?.label
                    : 'ก่อนกลางภาค';

                  const preMidtermAsgs = termAssignments.filter(
                    (a) => !a.scorePart || a.scorePart === 'PRE_MIDTERM'
                  );
                  let preMidtermEarned = 0;
                  let preMidtermMax = 0;
                  preMidtermAsgs.forEach((asg) => {
                    preMidtermMax += asg.maxScore;
                    const sub = allSubmissions.find(
                      (s) => s.assignmentId === asg.id && s.studentCode === item.studentCode
                    );
                    if (sub && sub.status === 'GRADED') {
                      preMidtermEarned += sub.score ?? 0;
                    }
                  });

                  return (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-xl bg-slate-100 text-[#6B7C93] font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-[#163A66]">
                              {displayName}
                            </span>
                            <span className="text-xs text-[#6B7C93] font-medium">
                              (เลขที่ {displaySeat} • ห้อง {displayRoom} • รหัส {item.studentCode})
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <p className="text-xs font-semibold text-[#3B82F6]">
                              {item.subjectCode} • {item.assignmentTitle}
                            </p>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                                isPreMidterm
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}
                            >
                              {partBadgeText} (เต็ม {item.maxScore})
                            </span>
                            {preMidtermMax > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                คะแนนก่อนกลางภาคสะสม: {preMidtermEarned}/{preMidtermMax} คะแนน
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#94A3B8] mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#94A3B8]" />
                            <span>ส่งเมื่อ {formatSubmissionTimestamp(item.submittedAtText || item.submittedTimestamp)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const resolvedR2 = r2StorageService.resolvePublicViewUrl(item.filePreviewUrl);
                            const isR2Available = Boolean(
                              resolvedR2 &&
                                (resolvedR2.startsWith('http://') || resolvedR2.startsWith('https://')) &&
                                !resolvedR2.startsWith('data:')
                            );
                            const cachedFile = sgsRosterAndSubmissionService.getSubmissionFileUrl(
                              item.assignmentId,
                              item.studentCode,
                              item.fileName
                            );
                            const fileUrl = isR2Available ? resolvedR2 : (cachedFile || resolvedR2 || item.filePreviewUrl);
                            const resolvedText =
                              (item as any).textContent ||
                              sgsRosterAndSubmissionService
                                .getSubmissions()
                                .find(
                                  (s) =>
                                    s.assignmentId === item.assignmentId &&
                                    s.studentCode === item.studentCode
                                )?.textContent;

                            setPreviewItem({
                              title: item.assignmentTitle,
                              studentName: displayName,
                              studentCode: item.studentCode,
                              assignmentId: item.assignmentId,
                              classroom: displayRoom,
                              seatNo: typeof displaySeat === 'number' ? displaySeat : item.seatNo,
                              type: isPdf ? 'PDF' : fileUrl ? 'IMAGE' : isLink ? 'LINK' : 'IMAGE',
                              url: fileUrl || item.externalLinkUrl,
                              externalLinkUrl: item.externalLinkUrl,
                              textContent: resolvedText,
                              fileName: item.fileName,
                              platform: isDrive ? 'GOOGLE_DRIVE' : item.externalPlatform,
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#163A66] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#3B82F6]" />
                          <span>ดูไฟล์ที่ส่ง</span>
                        </button>

                        {isGraded ? (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                            ✓ {item.score}/{item.maxScore}
                          </span>
                        ) : item.status === 'RETURNED' || item.status === 'RETURNED_REVISION' ? (
                          <span className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-800 border border-orange-200 text-xs font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                            <span>ส่งกลับแก้ไข (รอนักเรียนส่งใหม่)</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>รอตรวจ</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setGradingModalItem(item)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                            isGraded
                              ? 'bg-slate-100 text-[#163A66] hover:bg-slate-200'
                              : 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                          }`}
                        >
                          {isGraded ? 'แก้ไขคะแนน' : 'ให้คะแนน'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          SECTION C: ตารางแจกแจงคะแนนตามงานที่มอบหมาย (Assignment Score Breakdown Matrix)
         ==================================================================== */}
      {activeSectionTab === 'SCORE_MATRIX' && (
        <div className="bg-white rounded-[18px] border border-[#E6EEF7] p-4 sm:p-5 shadow-[0_4px_16px_rgba(40,90,140,0.06)] space-y-4">
          {/* Top toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#163A66]">
                  ตารางแจกแจงคะแนนตามงานที่มอบหมาย (ห้อง {matrixClassroom})
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE]">
                  {matrixStudents.length} นักเรียน • {matrixAssignments.length} ชิ้นงาน
                </span>
              </div>
              <p className="text-xs text-[#6B7C93] mt-0.5">
                แจกแจงคะแนนรายชิ้นงานและคะแนนรวมตามรายหน่วย/จุดประสงค์ (คลิกที่ช่องคะแนนเพื่อตรวจ/แก้ไขด่วน)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleBulkGradeClassroom}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>ให้คะแนนเต็มทุกคนที่ส่งงานแล้ว</span>
              </button>

              <button
                type="button"
                onClick={handleExportMatrixCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-[#163A66] cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>ส่งออกตาราง (CSV/Excel)</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenCreateModal()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>สั่งงานเพิ่ม</span>
              </button>
            </div>
          </div>

          {/* Sub-filter bar: หมวดคะแนน 4 ส่วน และตัวกรองเจาะจงคะแนนก่อนกลางภาค */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#F8FAFC] rounded-2xl border border-[#E6EEF7]">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#163A66] px-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>แสดงหมวดคะแนน:</span>
              </span>
              <button
                type="button"
                onClick={() => setMatrixPartFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  matrixPartFilter === 'ALL'
                    ? 'bg-white text-[#163A66] shadow-xs border border-slate-200'
                    : 'text-[#6B7C93] hover:text-[#163A66]'
                }`}
              >
                ทุกหมวดงาน ({matrixAssignmentsRaw.length})
              </button>
              <button
                type="button"
                onClick={() => setMatrixPartFilter('PRE_MIDTERM')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  matrixPartFilter === 'PRE_MIDTERM'
                    ? 'bg-[#3B82F6] text-white shadow-xs'
                    : 'text-[#3B82F6] bg-blue-50/70 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <span>📘 เจาะจงคะแนนก่อนกลางภาค</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${matrixPartFilter === 'PRE_MIDTERM' ? 'bg-white/25 text-white' : 'bg-blue-200 text-blue-900'}`}>
                  เต็ม {matrixCourseWeights.preMidterm}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMatrixPartFilter('POST_MIDTERM')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  matrixPartFilter === 'POST_MIDTERM'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-[#6B7C93] hover:text-indigo-700'
                }`}
              >
                หลังกลางภาค
              </button>
            </div>

            <div className="text-xs text-[#6B7C93] px-2 flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>เกณฑ์วิชา: ก่อนกลางภาค {matrixCourseWeights.preMidterm} • กลางภาค {matrixCourseWeights.midterm} • หลังกลางภาค {matrixCourseWeights.postMidterm} • ปลายภาค {matrixCourseWeights.final}</span>
            </div>
          </div>

          {/* If no assignments or students */}
          {matrixStudents.length === 0 ? (
            <div className="py-12 text-center bg-[#F7FAFF] rounded-2xl border border-dashed border-[#BFDBFE] space-y-2">
              <BookOpen className="w-8 h-8 text-[#3B82F6] mx-auto opacity-70" />
              <p className="text-sm font-bold text-[#163A66]">
                ไม่พบรายชื่อนักเรียนในห้อง {matrixClassroom}
              </p>
              <p className="text-xs text-[#6B7C93]">
                กรุณาเลือกห้องเรียนอื่นในตัวกรองด้านบน หรือซิงก์รายชื่อนักเรียน
              </p>
            </div>
          ) : matrixAssignments.length === 0 ? (
            <div className="py-12 text-center bg-[#F7FAFF] rounded-2xl border border-dashed border-[#BFDBFE] space-y-2">
              <BookOpen className="w-8 h-8 text-[#3B82F6] mx-auto opacity-70" />
              <p className="text-sm font-bold text-[#163A66]">
                ยังไม่มีชิ้นงานที่มอบหมายในห้อง {matrixClassroom}
              </p>
              <p className="text-xs text-[#6B7C93]">
                กดปุ่ม "สั่งงานใหม่" เพื่อสร้างภาระงานเดี่ยว หรือภาระงานสะสมรายหน่วย
              </p>
              <button
                type="button"
                onClick={() => handleOpenCreateModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>สั่งงานชิ้นแรก</span>
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Matrix Table (with frozen student columns) */}
              <div className="hidden md:block overflow-x-auto border border-[#E6EEF7] rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    {/* Header Row 1: Groups */}
                    <tr className="bg-[#F2F7FC] text-[#163A66] border-b border-[#E6EEF7]">
                      <th className="p-2.5 font-bold sticky left-0 bg-[#F2F7FC] z-20 w-12 text-center border-r border-[#E6EEF7]">
                        เลขที่
                      </th>
                      <th className="p-2.5 font-bold sticky left-12 bg-[#F2F7FC] z-20 w-24 border-r border-[#E6EEF7]">
                        รหัส
                      </th>
                      <th className="p-2.5 font-bold sticky left-36 bg-[#F2F7FC] z-20 w-48 border-r border-[#E6EEF7]">
                        ชื่อ-สกุล
                      </th>

                      {/* Units Groups */}
                      {matrixUnits.unitList.map((u) => (
                        <th
                          key={u.id}
                          colSpan={u.assignments.length + 1}
                          className="p-2.5 font-bold text-center border-r border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
                            <span>{u.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#1D4ED8] border border-[#BFDBFE]">
                              เต็ม {u.maxScore} คะแนน • {u.totalTasks} งาน
                            </span>
                          </div>
                        </th>
                      ))}

                      {/* Independent Tasks */}
                      {matrixUnits.independentList.length > 0 && (
                        <th
                          colSpan={matrixUnits.independentList.length}
                          className="p-2.5 font-bold text-center border-r border-[#E6EEF7] bg-slate-100 text-[#163A66]"
                        >
                          ชิ้นงานเดี่ยวปกติ ({matrixUnits.independentList.length} ชิ้น)
                        </th>
                      )}

                      {/* Pre-Midterm Column Header */}
                      <th className="p-2.5 font-bold text-center bg-blue-100 text-blue-900 border-r border-blue-200 w-28">
                        <div className="flex flex-col items-center justify-center">
                          <span>รวมก่อนกลางภาค</span>
                          <span className="text-[10px] text-blue-700 font-semibold">(เต็ม {matrixCourseWeights.preMidterm})</span>
                        </div>
                      </th>

                      {/* Grand Total */}
                      <th className="p-2.5 font-bold text-center bg-[#FEF3C7] text-[#92400E] w-24">
                        รวมทุกงาน
                      </th>
                    </tr>

                    {/* Header Row 2: Individual Columns */}
                    <tr className="bg-[#F8FAFC] text-[#6B7C93] border-b border-[#E6EEF7] text-[11px]">
                      <th className="p-2 sticky left-0 bg-[#F8FAFC] z-20 border-r border-[#E6EEF7] text-center">-</th>
                      <th className="p-2 sticky left-12 bg-[#F8FAFC] z-20 border-r border-[#E6EEF7] text-center">-</th>
                      <th className="p-2 sticky left-36 bg-[#F8FAFC] z-20 border-r border-[#E6EEF7]">นักเรียน</th>

                      {/* Unit assignments + unit summary column */}
                      {matrixUnits.unitList.map((u) => (
                        <React.Fragment key={`subcols-${u.id}`}>
                          {u.assignments.map((asg) => (
                            <th
                              key={asg.id}
                              className="p-2 border-r border-slate-200 min-w-[90px] text-center"
                              title={`${asg.title} (เต็ม ${asg.maxScore} คะแนน)`}
                            >
                              <div className="truncate font-semibold text-[#163A66] max-w-[110px] mx-auto">
                                {asg.title}
                              </div>
                              <span className="text-[10px] text-[#94A3B8]">
                                ({asg.maxScore} คะแนน)
                              </span>
                            </th>
                          ))}
                          {/* Unit Total Column */}
                          <th className="p-2 border-r border-[#BFDBFE] bg-[#DBEAFE]/50 font-bold text-center text-[#1D4ED8] min-w-[85px]">
                            สรุป {u.title.split(':')[0] || 'หน่วย'}
                          </th>
                        </React.Fragment>
                      ))}

                      {/* Independent assignments */}
                      {matrixUnits.independentList.map((asg) => (
                        <th
                          key={asg.id}
                          className="p-2 border-r border-slate-200 min-w-[90px] text-center"
                          title={`${asg.title} (เต็ม ${asg.maxScore} คะแนน)`}
                        >
                          <div className="truncate font-semibold text-[#163A66] max-w-[110px] mx-auto">
                            {asg.title}
                          </div>
                          <span className="text-[10px] text-[#94A3B8]">
                            ({asg.maxScore} คะแนน)
                          </span>
                        </th>
                      ))}

                      {/* Pre-Midterm Column Subtitle */}
                      <th className="p-2 text-center font-bold text-blue-800 bg-blue-50/80 border-r border-blue-200">
                        คะแนนเก็บ
                      </th>

                      {/* Grand Total */}
                      <th className="p-2 text-center font-bold text-[#92400E] bg-[#FEF3C7]/60">
                        คะแนนสุทธิ
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E6EEF7]">
                    {matrixStudents.map((stu) => {
                      let grandTotal = 0;
                      let preMidtermEarned = 0;

                      return (
                        <tr
                          key={stu.studentCode}
                          className="hover:bg-blue-50/30 transition-colors"
                        >
                          {/* Seat No */}
                          <td className="p-2.5 font-bold text-center sticky left-0 bg-white z-10 border-r border-[#E6EEF7] text-[#163A66]">
                            {stu.sgsSeatNo}
                          </td>
                          {/* Code */}
                          <td className="p-2.5 sticky left-12 bg-white z-10 border-r border-[#E6EEF7] font-mono text-[11px] text-[#6B7C93]">
                            {stu.studentCode}
                          </td>
                          {/* Name */}
                          <td className="p-2.5 sticky left-36 bg-white z-10 border-r border-[#E6EEF7] font-semibold text-[#163A66]">
                            <div className="truncate max-w-[180px]">{stu.studentName}</div>
                          </td>

                          {/* Unit tasks */}
                          {matrixUnits.unitList.map((u) => {
                            let submittedInUnit = 0;
                            let earnedInUnit = 0;
                            let maxInUnit = 0;

                            const taskCells = u.assignments.map((asg) => {
                              const sub = allSubmissions.find(
                                (s) => s.assignmentId === asg.id && s.studentCode === stu.studentCode
                              );
                              const isSubmitted = sub && sub.status !== 'MISSING';
                              const isGraded = sub?.status === 'GRADED';
                              const score = sub?.score;

                              if (isSubmitted) {
                                submittedInUnit += 1;
                                earnedInUnit += score ?? asg.maxScore;
                              }
                              maxInUnit += asg.maxScore;

                              return (
                                <td
                                  key={`cell-${stu.studentCode}-${asg.id}`}
                                  onClick={() =>
                                    setEditingCell({
                                      studentCode: stu.studentCode,
                                      studentName: stu.studentName,
                                      assignmentId: asg.id,
                                      assignmentTitle: asg.title,
                                      maxScore: asg.maxScore,
                                      currentScore: score ?? null,
                                    })
                                  }
                                  className="p-1.5 border-r border-slate-200 text-center cursor-pointer hover:bg-blue-100/40 transition-colors"
                                >
                                  {isGraded ? (
                                    <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      {score}
                                    </span>
                                  ) : isSubmitted ? (
                                    <span className="inline-block px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      รอตรวจ
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 font-bold hover:text-[#3B82F6]">
                                      -
                                    </span>
                                  )}
                                </td>
                              );
                            });

                            // Calculate Unit score
                            let uScore = 0;
                            if (u.scoringMethod === 'SUBMISSION_COUNT_RATIO') {
                              const clamped = Math.min(u.totalTasks, Math.max(0, submittedInUnit));
                              const raw = u.totalTasks > 0 ? (clamped / u.totalTasks) * u.maxScore : 0;
                              uScore = u.autoRoundUp
                                ? (Math.round((raw - Math.floor(raw)) * 100) / 100 >= 0.5 ? Math.ceil(raw) : Math.floor(raw))
                                : Math.round(raw * 10) / 10;
                            } else {
                              const ratio = maxInUnit > 0 ? earnedInUnit / maxInUnit : 0;
                              const raw = ratio * u.maxScore;
                              uScore = u.autoRoundUp
                                ? (Math.round((raw - Math.floor(raw)) * 100) / 100 >= 0.5 ? Math.ceil(raw) : Math.floor(raw))
                                : Math.round(raw * 10) / 10;
                            }
                            grandTotal += uScore;
                            if (!u.assignments[0]?.scorePart || u.assignments[0]?.scorePart === 'PRE_MIDTERM') {
                              preMidtermEarned += uScore;
                            }

                            return (
                              <React.Fragment key={`cells-group-${stu.studentCode}-${u.id}`}>
                                {taskCells}
                                {/* Unit summary cell */}
                                <td className="p-1.5 border-r border-[#BFDBFE] bg-[#EFF6FF]/60 text-center font-bold text-[#1D4ED8]">
                                  <div className="flex flex-col items-center justify-center">
                                    <span className="text-xs font-extrabold">{uScore}</span>
                                    <span className="text-[9px] text-[#6B7C93]">
                                      ({submittedInUnit}/{u.totalTasks} งาน)
                                    </span>
                                  </div>
                                </td>
                              </React.Fragment>
                            );
                          })}

                          {/* Independent tasks */}
                          {matrixUnits.independentList.map((asg) => {
                            const sub = allSubmissions.find(
                              (s) => s.assignmentId === asg.id && s.studentCode === stu.studentCode
                            );
                            const isSubmitted = sub && sub.status !== 'MISSING';
                            const isGraded = sub?.status === 'GRADED';
                            const score = sub?.score ?? 0;
                            grandTotal += isGraded ? score : 0;
                            if (!asg.scorePart || asg.scorePart === 'PRE_MIDTERM') {
                              preMidtermEarned += isGraded ? score : 0;
                            }

                            return (
                              <td
                                key={`indep-${stu.studentCode}-${asg.id}`}
                                onClick={() =>
                                  setEditingCell({
                                    studentCode: stu.studentCode,
                                    studentName: stu.studentName,
                                    assignmentId: asg.id,
                                    assignmentTitle: asg.title,
                                    maxScore: asg.maxScore,
                                    currentScore: sub?.score ?? null,
                                  })
                                }
                                className="p-1.5 border-r border-slate-200 text-center cursor-pointer hover:bg-blue-100/40 transition-colors"
                              >
                                {isGraded ? (
                                  <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {score}
                                  </span>
                                ) : isSubmitted ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    รอตรวจ
                                  </span>
                                ) : (
                                  <span className="text-slate-300 font-bold hover:text-[#3B82F6]">
                                    -
                                  </span>
                                )}
                              </td>
                            );
                          })}

                          {/* Pre-Midterm Summary Cell */}
                          <td className="p-2 text-center font-bold text-xs bg-blue-50/70 text-blue-900 border-r border-blue-200">
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-black text-blue-800">{preMidtermEarned}</span>
                              <span className="text-[10px] text-blue-600 font-medium">/{matrixCourseWeights.preMidterm}</span>
                            </div>
                          </td>

                          {/* Grand Total */}
                          <td className="p-2 text-center font-bold text-sm bg-[#FEF3C7]/40 text-[#92400E]">
                            {grandTotal}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile View: Cards per student (Pillar 8 & 9: Zero horizontal scroll trap on mobile!) */}
              <div className="md:hidden space-y-3">
                {matrixStudents.map((stu) => {
                  let grandTotal = 0;
                  let preMidtermEarned = 0;

                  // คำนวณคะแนนก่อนกลางภาคของนักเรียนคนนี้ล่วงหน้าเพื่อแสดงในการ์ดด้านบน
                  matrixUnits.unitList.forEach((u) => {
                    if (!u.assignments[0]?.scorePart || u.assignments[0]?.scorePart === 'PRE_MIDTERM') {
                      let subInUnit = 0;
                      let earnInUnit = 0;
                      let maxInUnit = 0;
                      u.assignments.forEach((asg) => {
                        const sub = allSubmissions.find(
                          (s) => s.assignmentId === asg.id && s.studentCode === stu.studentCode
                        );
                        if (sub && sub.status !== 'MISSING') {
                          subInUnit += 1;
                          earnInUnit += sub.score ?? asg.maxScore;
                        }
                        maxInUnit += asg.maxScore;
                      });
                      const raw = u.scoringMethod === 'SUBMISSION_COUNT_RATIO'
                        ? (u.totalTasks > 0 ? (Math.min(u.totalTasks, subInUnit) / u.totalTasks) * u.maxScore : 0)
                        : (maxInUnit > 0 ? (earnInUnit / maxInUnit) * u.maxScore : 0);
                      const uSc = u.autoRoundUp
                        ? (Math.round((raw - Math.floor(raw)) * 100) / 100 >= 0.5 ? Math.ceil(raw) : Math.floor(raw))
                        : Math.round(raw * 10) / 10;
                      preMidtermEarned += uSc;
                    }
                  });

                  matrixUnits.independentList.forEach((asg) => {
                    if (!asg.scorePart || asg.scorePart === 'PRE_MIDTERM') {
                      const sub = allSubmissions.find(
                        (s) => s.assignmentId === asg.id && s.studentCode === stu.studentCode
                      );
                      if (sub && sub.status === 'GRADED') {
                        preMidtermEarned += sub.score ?? 0;
                      }
                    }
                  });

                  return (
                    <div
                      key={`mob-${stu.studentCode}`}
                      className="p-4 rounded-2xl border border-[#E6EEF7] bg-white shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-[#EFF6FF] text-[#3B82F6] font-bold text-xs flex items-center justify-center">
                            {stu.sgsSeatNo}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-[#163A66]">{stu.studentName}</p>
                            <p className="text-[11px] text-[#6B7C93] font-mono">รหัส {stu.studentCode}</p>
                          </div>
                        </div>
                      </div>

                      {/* สรุปคะแนนก่อนกลางภาคบนมือถือ */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50/90 to-sky-50/80 border border-blue-200 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-blue-600" />
                            <span>คะแนนก่อนกลางภาค</span>
                          </span>
                          <p className="text-[10px] text-blue-700">เกณฑ์วิชา: เต็ม {matrixCourseWeights.preMidterm} คะแนน</p>
                        </div>
                        <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-xs">
                          {preMidtermEarned} / {matrixCourseWeights.preMidterm} คะแนน
                        </span>
                      </div>

                      {/* Units in mobile card */}
                      <div className="space-y-2.5">
                        {matrixUnits.unitList.map((u) => {
                          let submittedInUnit = 0;
                          let earnedInUnit = 0;
                          let maxInUnit = 0;

                          const chips = u.assignments.map((asg) => {
                            const sub = allSubmissions.find(
                              (s) => s.assignmentId === asg.id && s.studentCode === stu.studentCode
                            );
                            const isSubmitted = sub && sub.status !== 'MISSING';
                            const isGraded = sub?.status === 'GRADED';
                            const score = sub?.score;
                            if (isSubmitted) {
                              submittedInUnit += 1;
                              earnedInUnit += score ?? asg.maxScore;
                            }
                            maxInUnit += asg.maxScore;

                            return (
                              <button
                                key={`mob-chip-${asg.id}`}
                                type="button"
                                onClick={() =>
                                  setEditingCell({
                                    studentCode: stu.studentCode,
                                    studentName: stu.studentName,
                                    assignmentId: asg.id,
                                    assignmentTitle: asg.title,
                                    maxScore: asg.maxScore,
                                    currentScore: score ?? null,
                                  })
                                }
                                className={`px-2 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer ${
                                  isGraded
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : isSubmitted
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-slate-50 text-slate-400 border-slate-200'
                                }`}
                              >
                                <span>{asg.title}</span>
                                <span className="font-bold">
                                  {isGraded ? `${score}` : isSubmitted ? 'รอตรวจ' : '-'}
                                </span>
                              </button>
                            );
                          });

                          let uScore = 0;
                          if (u.scoringMethod === 'SUBMISSION_COUNT_RATIO') {
                            const clamped = Math.min(u.totalTasks, Math.max(0, submittedInUnit));
                            const raw = u.totalTasks > 0 ? (clamped / u.totalTasks) * u.maxScore : 0;
                            uScore = u.autoRoundUp
                              ? (Math.round((raw - Math.floor(raw)) * 100) / 100 >= 0.5 ? Math.ceil(raw) : Math.floor(raw))
                              : Math.round(raw * 10) / 10;
                          } else {
                            const ratio = maxInUnit > 0 ? earnedInUnit / maxInUnit : 0;
                            const raw = ratio * u.maxScore;
                            uScore = u.autoRoundUp
                              ? (Math.round((raw - Math.floor(raw)) * 100) / 100 >= 0.5 ? Math.ceil(raw) : Math.floor(raw))
                              : Math.round(raw * 10) / 10;
                          }
                          grandTotal += uScore;

                          return (
                            <div
                              key={`mob-unit-${u.id}`}
                              className="p-3 rounded-xl bg-[#F7FAFF] border border-[#E6EEF7] space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-[#163A66]">{u.title}</span>
                                <span className="px-2 py-0.5 rounded-lg font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                                  {uScore} / {u.maxScore} คะแนน (ส่ง {submittedInUnit}/{u.totalTasks})
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">{chips}</div>
                            </div>
                          );
                        })}

                        {/* Independent tasks in mobile */}
                        {matrixUnits.independentList.length > 0 && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <span className="text-xs font-bold text-[#163A66] block">
                              ชิ้นงานเดี่ยว
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {matrixUnits.independentList.map((asg) => {
                                const sub = allSubmissions.find(
                                  (s) => s.assignmentId === asg.id && s.studentCode === stu.studentCode
                                );
                                const isSubmitted = sub && sub.status !== 'MISSING';
                                const isGraded = sub?.status === 'GRADED';
                                const score = sub?.score ?? 0;
                                grandTotal += isGraded ? score : 0;

                                return (
                                  <button
                                    key={`mob-indep-${asg.id}`}
                                    type="button"
                                    onClick={() =>
                                      setEditingCell({
                                        studentCode: stu.studentCode,
                                        studentName: stu.studentName,
                                        assignmentId: asg.id,
                                        assignmentTitle: asg.title,
                                        maxScore: asg.maxScore,
                                        currentScore: sub?.score ?? null,
                                      })
                                    }
                                    className={`px-2 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer ${
                                      isGraded
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : isSubmitted
                                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                                          : 'bg-slate-50 text-slate-400 border-slate-200'
                                    }`}
                                  >
                                    <span>{asg.title}</span>
                                    <span className="font-bold">
                                      {isGraded ? `${score}` : isSubmitted ? 'รอตรวจ' : '-'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="font-semibold text-[#6B7C93]">คะแนนรวมทุกงาน:</span>
                        <span className="text-sm font-bold text-[#92400E] px-2.5 py-0.5 rounded-lg bg-[#FEF3C7] border border-[#FDE68A]">
                          {grandTotal} คะแนน
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ====================================================================
          MODAL 1: สั่งงานใหม่ / แก้ไขชิ้นงาน (โครงสร้างมี Header/Footer ตรึงแน่น และเนื้อหาเลื่อนได้ ไม่ตกขอบจอ)
         ==================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateAssignmentSubmit}
            className="bg-white rounded-[22px] border border-[#E6EEF7] max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl my-auto animate-scale-in"
          >
            {/* Modal Header (ตรึงแน่นอยู่ด้านบน ไม่ถูกเลื่อนหาย) */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white rounded-t-[22px]">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#163A66] flex items-center gap-2">
                  {editScope === 'UNIT' ? (
                    <>
                      <Layers className="w-5 h-5 text-[#3B82F6]" />
                      <span>⚙️ แก้ไขการตั้งค่าหน่วยการเรียนรู้</span>
                    </>
                  ) : editScope === 'SUB_TASK' ? (
                    <>
                      <Edit3 className="w-5 h-5 text-[#3B82F6]" />
                      <span>✏️ แก้ไขชิ้นงานย่อย / ภาระงาน</span>
                    </>
                  ) : editingAssignment ? (
                    <>
                      <Edit3 className="w-5 h-5 text-[#3B82F6]" />
                      <span>แก้ไขชิ้นงาน / ภาระงาน</span>
                    </>
                  ) : isAddingToExistingUnit ? (
                    <>
                      <Layers className="w-5 h-5 text-[#3B82F6]" />
                      <span>สั่งงานเพิ่มในหน่วยการเรียนรู้</span>
                    </>
                  ) : (
                    <>
                      <ClipboardList className="w-5 h-5 text-[#3B82F6]" />
                      <span>สั่งงาน / มอบหมายภาระงานใหม่</span>
                    </>
                  )}
                </h3>
                <p className="text-xs text-[#6B7C93] mt-0.5">
                  {editScope === 'UNIT'
                    ? `ปรับแต่งข้อมูลหน่วย "${formUnitTitle}" (จะมีผลกับทุกงานย่อยในหน่วยนี้)`
                    : editScope === 'SUB_TASK'
                    ? `แก้ไขรายละเอียดงาน "${formTitle}" (สังกัดหน่วย "${formUnitTitle}")`
                    : editingAssignment
                    ? `แก้ไขรายละเอียดของ "${editingAssignment.title}"`
                    : isAddingToExistingUnit
                    ? `เพิ่มชิ้นงานย่อยลงในหน่วย "${formUnitTitle}" (รวมคะแนนตามเกณฑ์ของหน่วยอัตโนมัติ)`
                    : 'เชื่อมคะแนนเข้ากับสมุดคะแนน ปพ.5 อัตโนมัติ'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingAssignment(null);
                  setEditScope(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body (เลื่อนดูข้อมูลได้สะดวก ไม่ตกขอบจอ) */}
            <div className="px-5 sm:px-6 py-4 overflow-y-auto flex-1 space-y-4">
              {/* ====================================================================
                  CASE 1: แก้ไขการตั้งค่าหน่วยการเรียนรู้ (UNIT SETTINGS MODE)
                 ==================================================================== */}
              {editScope === 'UNIT' ? (
                <>
                  {/* กล่องสรุปวิชาและสถานะหน่วย */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-[#F0FDF4] border border-[#BFDBFE] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#163A66]">
                        <Layers className="w-4 h-4 text-[#3B82F6]" />
                        <span>การตั้งค่าหน่วยการเรียนรู้ (Unit Configuration)</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#3B82F6] text-white font-bold">
                        อัปเดตทั้งหน่วย ({currentUnitSubTasks.length} งาน)
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B7C93]">
                      การแก้ไขการตั้งค่าในหน้านี้ จะมีผลกับเกณฑ์คิดคะแนนและส่วนคะแนนของทุกงานย่อยในหน่วยนี้โดยอัตโนมัติ
                    </p>
                  </div>

                  {/* 1. รายวิชา */}
                  <div>
                    <label className="block text-xs font-semibold text-[#163A66] mb-1">
                      1. รายวิชา *
                    </label>
                    <select
                      value={formCourseCode}
                      onChange={(e) => {
                        setFormCourseCode(e.target.value);
                        setFormSelectedRooms([]);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-[#163A66]"
                    >
                      {subjectsList.map((subj) => (
                        <option key={subj.courseCode} value={subj.courseCode}>
                          {subj.courseCode} — {subj.courseName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. ชื่อหน่วยการเรียนรู้ / จุดประสงค์ */}
                  <div>
                    <label className="block text-xs font-semibold text-[#163A66] mb-1">
                      2. ชื่อหน่วยการเรียนรู้ / จุดประสงค์ *
                    </label>
                    <input
                      type="text"
                      required
                      value={formUnitTitle}
                      onChange={(e) => setFormUnitTitle(e.target.value)}
                      placeholder="เช่น บทที่ 8, หน่วยที่ 1 ทัศนธาตุ หรือ จุดประสงค์ที่ 2"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    />
                  </div>

                  {/* 3. ส่วนคะแนน ปพ.5 & คะแนนเต็มประจำหน่วย */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#163A66] mb-1">
                        3. เก็บเข้าส่วนคะแนนใดของ ปพ.5 *
                      </label>
                      <select
                        value={formScorePart}
                        onChange={(e) => setFormScorePart(e.target.value as FourScorePart)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#163A66]"
                      >
                        <option value="PRE_MIDTERM">ก่อนกลางภาค (เต็ม {currentFormCourseWeights.preMidterm})</option>
                        <option value="MIDTERM">กลางภาค (เต็ม {currentFormCourseWeights.midterm})</option>
                        <option value="POST_MIDTERM">หลังกลางภาค (เต็ม {currentFormCourseWeights.postMidterm})</option>
                        <option value="FINAL">ปลายภาค (เต็ม {currentFormCourseWeights.final})</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#163A66] mb-1">
                        คะแนนเต็มประจำหน่วย *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={formUnitMaxScore === 0 ? '' : formUnitMaxScore}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFormUnitMaxScore(v === '' ? 0 : Number(v));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-[#163A66]"
                      />
                    </div>
                  </div>

                  {/* 4. วิธีคิดคะแนนประจำหน่วย */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[#163A66]">
                      4. วิธีคิดคะแนนประจำหน่วย:
                    </label>
                    <div className="space-y-2">
                      <label className={`flex items-start gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                        formScoringMethod === 'SUBMISSION_COUNT_RATIO'
                          ? 'border-[#3B82F6] bg-[#EFF6FF]'
                          : 'border-slate-200 bg-white'
                      }`}>
                        <input
                          type="radio"
                          name="scoringMethodUnitEdit"
                          value="SUBMISSION_COUNT_RATIO"
                          checked={formScoringMethod === 'SUBMISSION_COUNT_RATIO'}
                          onChange={() => setFormScoringMethod('SUBMISSION_COUNT_RATIO')}
                          className="mt-0.5 text-[#3B82F6]"
                        />
                        <div className="space-y-1 text-xs">
                          <span className="font-bold text-[#163A66] block">
                            เก็บสัดส่วนการส่งงาน (คะแนนความรับผิดชอบ)
                          </span>
                          <span className="text-[11px] text-[#6B7C93] block">
                            นับงานที่ส่งจริงเทียบกับงานทั้งหมดที่สั่งในหน่วยนี้ แล้วเทียบเป็นเต็ม {formUnitMaxScore} คะแนนอัตโนมัติ
                          </span>
                          <div className="pt-1.5 flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-xs text-[#163A66] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formIsDynamicTasks}
                                onChange={(e) => setFormIsDynamicTasks(e.target.checked)}
                                className="rounded text-[#3B82F6]"
                              />
                              <span className="font-semibold">ไม่กำหนดจำนวนงานล่วงหน้า (Dynamic Tasks)</span>
                            </label>
                          </div>
                          {!formIsDynamicTasks && (
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-[11px] text-[#6B7C93]">กำหนดจำนวนงาน:</span>
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={formTotalTasksInUnit}
                                onChange={(e) => setFormTotalTasksInUnit(Math.max(1, Number(e.target.value) || 1))}
                                className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-center"
                              />
                              <span className="text-[11px] text-[#6B7C93]">งาน</span>
                            </div>
                          )}
                        </div>
                      </label>

                      <label className={`flex items-start gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                        formScoringMethod === 'RAW_SCORE_AVERAGE'
                          ? 'border-[#3B82F6] bg-[#EFF6FF]'
                          : 'border-slate-200 bg-white'
                      }`}>
                        <input
                          type="radio"
                          name="scoringMethodUnitEdit"
                          value="RAW_SCORE_AVERAGE"
                          checked={formScoringMethod === 'RAW_SCORE_AVERAGE'}
                          onChange={() => setFormScoringMethod('RAW_SCORE_AVERAGE')}
                          className="mt-0.5 text-[#3B82F6]"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-[#163A66] block">
                            หารเฉลี่ยคะแนนดิบของงานทั้งหมดในหน่วย
                          </span>
                          <span className="text-[11px] text-[#6B7C93] block mt-0.5">
                            นำคะแนนที่ได้จากทุกงานในหน่วยมารวมแล้วเทียบเป็นสัดส่วนเต็ม {formUnitMaxScore} คะแนน
                          </span>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs font-semibold text-[#163A66]">
                        ปัดเศษทศนิยม &gt;= 0.5 ขึ้นอัตโนมัติ
                      </span>
                      <input
                        type="checkbox"
                        checked={formAutoRoundUp}
                        onChange={(e) => setFormAutoRoundUp(e.target.checked)}
                        className="w-4 h-4 text-[#3B82F6] rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 5. รายการงานย่อยที่อยู่ในหน่วยนี้ */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#BFDBFE] space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[#163A66] flex items-center gap-1.5">
                        <ClipboardList className="w-4 h-4 text-[#3B82F6]" />
                        <span>รายการงานย่อยในหน่วยนี้ ({currentUnitSubTasks.length} งาน)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateModalOpen(false);
                          handleOpenCreateModal({
                            courseCode: formCourseCode,
                            unitTitle: formUnitTitle,
                            unitId: formUnitId,
                            unitMaxScore: formUnitMaxScore,
                            scorePart: formScorePart,
                            targetClassrooms: formScopeMode === 'ALL_SUBJECT_ROOMS' ? ['ALL'] : formSelectedRooms,
                            isAddingToExistingUnit: true,
                          });
                        }}
                        className="text-[11px] font-bold text-[#3B82F6] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ สั่งงานย่อยเพิ่ม</span>
                      </button>
                    </div>

                    {currentUnitSubTasks.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        ยังไม่มีงานย่อยในหน่วยนี้
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {currentUnitSubTasks.map((t, idx) => (
                          <div
                            key={t.id}
                            className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1D4ED8] font-bold flex items-center justify-center text-[10px] shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-[#163A66] truncate">{t.title}</span>
                              <span className="text-[11px] text-[#6B7C93] shrink-0">
                                (ส่ง {formatDueDateThai(t.dueDate)})
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenEditSubTaskModal(t, {
                                    unitTitle: formUnitTitle,
                                    maxScore: formUnitMaxScore,
                                    courseCode: formCourseCode,
                                    scorePart: formScorePart,
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#3B82F6] bg-white border border-blue-200 hover:bg-blue-50 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>แก้ไขงานย่อย</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenDeleteSubTaskModal(t, formUnitTitle)}
                                className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                                title={`ลบงานย่อย "${t.title}"`}
                              >
                                <Trash2 className="w-3 h-3 text-rose-500" />
                                <span>ลบ</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 6. ห้องเรียนที่ได้รับมอบหมาย */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-[#163A66]">
                      6. ห้องเรียนที่ได้รับมอบหมาย:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormScopeMode('ALL_SUBJECT_ROOMS')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          formScopeMode === 'ALL_SUBJECT_ROOMS'
                            ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#163A66]'
                            : 'border-slate-200 bg-white text-[#6B7C93]'
                        }`}
                      >
                        <p className="text-xs font-bold">
                          สั่งทุกห้องในรายวิชานี้ ({currentFormSubjectRooms.length} ห้อง)
                        </p>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          สั่งครั้งเดียวใช้กับทุกห้องที่เรียนวิชานี้
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormScopeMode('SELECTED_ROOMS');
                          if (formSelectedRooms.length === 0 && currentFormSubjectRooms[0]) {
                            setFormSelectedRooms([currentFormSubjectRooms[0]]);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          formScopeMode === 'SELECTED_ROOMS'
                            ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#163A66]'
                            : 'border-slate-200 bg-white text-[#6B7C93]'
                        }`}
                      >
                        <p className="text-xs font-bold">เลือกเฉพาะห้องเรียน</p>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          ติ๊กเลือกเฉพาะห้องที่ต้องการสั่งงาน
                        </p>
                      </button>
                    </div>

                    {formScopeMode === 'SELECTED_ROOMS' && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {currentFormSubjectRooms.map((room) => {
                          const checked = formSelectedRooms.includes(room);
                          return (
                            <button
                              key={room}
                              type="button"
                              onClick={() => {
                                setFormSelectedRooms((prev) =>
                                  checked ? prev.filter((r) => r !== room) : [...prev, room]
                                );
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                                checked
                                  ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                                  : 'bg-white text-[#6B7C93] border-slate-200'
                              }`}
                            >
                              {checked && <Check className="w-3 h-3" />}
                              <span>{room}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : isAddingToExistingUnit || editScope === 'SUB_TASK' ? (
                <>
                  {/* กล่องสรุปข้อมูลหน่วยการเรียนรู้ (อ่านได้อย่างเดียว พร้อมปุ่มลัดสลับไปแก้หน่วย) */}
                  <div className="p-3.5 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#163A66]">
                        <Layers className="w-4 h-4 text-[#3B82F6]" />
                        <span>หน่วยการเรียนรู้: {formUnitTitle}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {editScope === 'SUB_TASK' && (
                          <button
                            type="button"
                            onClick={() => {
                              const matchingCard = enrichedAssignmentCards.find(
                                (c) => c.isUnitBundle && c.unitTitle === formUnitTitle && c.courseCode === formCourseCode
                              );
                              if (matchingCard) {
                                handleOpenEditUnitModal(matchingCard);
                              }
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-white border border-blue-200 text-[#3B82F6] font-bold hover:bg-blue-50 flex items-center gap-1 cursor-pointer transition-colors"
                            title="สลับไปแก้ไขการตั้งค่าหน่วย"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>แก้ไขการตั้งค่าหน่วย</span>
                          </button>
                        )}
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#3B82F6] text-white font-bold">
                          {editScope === 'SUB_TASK' ? 'แก้ไขงานย่อย' : 'ผูกเข้าหน่วยนี้'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-[#6B7C93] pt-1.5 border-t border-blue-200/60">
                      <div>
                        <span className="block text-slate-400">วิชา:</span>
                        <span className="font-semibold text-[#163A66]">{formCourseCode}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400">ส่วนคะแนน ปพ.5:</span>
                        <span className="font-semibold text-[#163A66]">
                          {SCORE_PART_LABELS[formScorePart]?.label || formScorePart}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400">คะแนนเต็มหน่วย:</span>
                        <span className="font-semibold text-[#163A66]">{formUnitMaxScore} คะแนน</span>
                      </div>
                      <div className="col-span-2 sm:col-span-3">
                        <span className="block text-slate-400">เกณฑ์คิดคะแนน:</span>
                        <span className="font-semibold text-[#163A66]">
                          {formScoringMethod === 'SUBMISSION_COUNT_RATIO'
                            ? formIsDynamicTasks
                              ? 'สัดส่วนการส่งงาน (Dynamic Tasks - คำนวณตามจำนวนงานจริงที่สั่ง)'
                              : `สัดส่วนการส่งงาน (เต็ม ${formTotalTasksInUnit} งาน)`
                            : 'หารเฉลี่ยคะแนนดิบของทุกงานในหน่วย'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1. ชื่องาน / ภาระงานย่อย */}
                  <div>
                    <label className="block text-xs font-semibold text-[#163A66] mb-1">
                      1. ชื่องาน / ภาระงานย่อย *
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="เช่น ใบงานที่ 2 การวิเคราะห์บทละคร, แบบฝึกหัดทัศนธาตุ"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    />
                  </div>

                  {/* 2. รายละเอียดของงาน / คำชี้แจง / โจทย์ */}
                  <div>
                    <label className="block text-xs font-semibold text-[#163A66] mb-1">
                      2. รายละเอียดของงาน / คำชี้แจง / คำสั่งสำหรับนักเรียน
                    </label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="ระบุคำชี้แจง รายละเอียด คำถาม หรือแนวทางการทำชิ้นงานนี้ให้นักเรียนศึกษา..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] leading-relaxed"
                    />
                  </div>

                  {/* 3. สื่อการสอนและเอกสารสำหรับนักเรียน */}
                  <div className="p-3.5 rounded-2xl bg-[#F7FAFF] border border-[#BFDBFE] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#163A66] flex items-center gap-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span>3. สื่อการสอนและเอกสารสำหรับนักเรียน</span>
                      </label>
                      <span className="text-[10px] text-slate-400">
                        ให้นักเรียนศึกษาหรือดูตัวอย่าง
                      </span>
                    </div>

                    {/* เลือกจากแผนการสอนที่มีอยู่ */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6B7C93] mb-1">
                        📁 เลือกไฟล์จากแผนการสอนที่บันทึกไว้ในระบบ:
                      </label>
                      {availableLessonPlanFiles.length > 0 ? (
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const f = availableLessonPlanFiles.find((item) => item.id === e.target.value);
                            if (f) {
                              handleAddLessonPlanAttachment(f);
                              e.target.value = '';
                            }
                          }}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-[#163A66]"
                        >
                          <option value="" disabled>-- เลือกไฟล์จากแผนการสอน ({availableLessonPlanFiles.length} ไฟล์) --</option>
                          {availableLessonPlanFiles.map((f) => (
                            <option key={f.id} value={f.id}>
                              [{f.type}] {f.name} {f.lessonPlanTitle ? `(${f.lessonPlanTitle})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic bg-white p-2 rounded-xl border border-slate-100">
                          ยังไม่มีไฟล์แผนการสอนที่ผูกกับวิชานี้ (สามารถอัปโหลดภาพหรือ PDF ด้านล่างได้โดยตรง)
                        </p>
                      )}
                    </div>

                    {/* อัปโหลดตัวอย่างเป็นภาพ หรือ PDF */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6B7C93] mb-1">
                        🖼️ หรือ อัปโหลดตัวอย่างเป็นภาพ หรือ PDF:
                      </label>
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#3B82F6] bg-white hover:bg-blue-50/50 text-[#3B82F6] text-xs font-semibold cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 text-[#3B82F6]" />
                        <span>คลิกเพื่ออัปโหลดไฟล์ (ภาพ JPG/PNG หรือเอกสาร PDF)</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleTeacherFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* รายการไฟล์แนบที่เลือกแล้ว */}
                    {formAttachments.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-[#163A66] block">
                          ไฟล์ที่แนบแล้ว ({formAttachments.length} รายการ):
                        </span>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {formAttachments.map((att) => (
                            <div
                              key={att.id}
                              className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {att.type === 'PDF' ? (
                                  <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                                ) : att.type === 'IMAGE' ? (
                                  <Eye className="w-4 h-4 text-blue-500 shrink-0" />
                                ) : (
                                  <Paperclip className="w-4 h-4 text-slate-500 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate" title={att.name}>
                                    {att.name}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                    {att.size && <span>{att.size}</span>}
                                    {att.source === 'LESSON_PLAN' ? (
                                      <span className="text-blue-600 font-semibold bg-blue-50 px-1 rounded">จากแผนการสอน</span>
                                    ) : (
                                      <span className="text-emerald-600 font-semibold bg-emerald-50 px-1 rounded">อัปโหลดใหม่</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                title="ลบไฟล์แนบนี้"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. คะแนนเต็มของชิ้นงานนี้ & กำหนดส่ง */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#163A66] mb-1">
                        4. คะแนนเต็มของชิ้นงานนี้
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={formMaxScore === 0 ? '' : formMaxScore}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFormMaxScore(v === '' ? 0 : Number(v));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-[#163A66]"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formScoringMethod === 'SUBMISSION_COUNT_RATIO'
                          ? 'คิดคะแนนตามสัดส่วนการส่งของหน่วย'
                          : 'นำไปเฉลี่ยกับงานอื่นในหน่วย'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#163A66] mb-1">
                        กำหนดส่ง
                      </label>
                      <input
                        type="date"
                        value={formDueDate}
                        onChange={(e) => setFormDueDate(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-[#163A66]"
                      />
                    </div>
                  </div>

                  {/* 5. ห้องเรียนที่ได้รับมอบหมาย */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-[#163A66]">
                      5. ห้องเรียนที่ได้รับมอบหมาย:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormScopeMode('ALL_SUBJECT_ROOMS')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          formScopeMode === 'ALL_SUBJECT_ROOMS'
                            ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#163A66]'
                            : 'border-slate-200 bg-white text-[#6B7C93]'
                        }`}
                      >
                        <p className="text-xs font-bold">
                          สั่งทุกห้องในรายวิชานี้ ({currentFormSubjectRooms.length} ห้อง)
                        </p>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          สั่งครั้งเดียวใช้กับทุกห้องที่เรียนวิชานี้
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormScopeMode('SELECTED_ROOMS');
                          if (formSelectedRooms.length === 0 && currentFormSubjectRooms[0]) {
                            setFormSelectedRooms([currentFormSubjectRooms[0]]);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          formScopeMode === 'SELECTED_ROOMS'
                            ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#163A66]'
                            : 'border-slate-200 bg-white text-[#6B7C93]'
                        }`}
                      >
                        <p className="text-xs font-bold">เลือกเฉพาะห้องเรียน</p>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          ติ๊กเลือกเฉพาะห้องที่ต้องการสั่งงาน
                        </p>
                      </button>
                    </div>

                    {formScopeMode === 'SELECTED_ROOMS' && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {currentFormSubjectRooms.map((room) => {
                          const checked = formSelectedRooms.includes(room);
                          return (
                            <button
                              key={room}
                              type="button"
                              onClick={() => {
                                setFormSelectedRooms((prev) =>
                                  checked ? prev.filter((r) => r !== room) : [...prev, room]
                                );
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                                checked
                                  ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                                  : 'bg-white text-[#6B7C93] border-slate-200'
                              }`}
                            >
                              {checked && <Check className="w-3 h-3" />}
                              <span>{room}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* ====================================================================
                    CASE 2: สั่งงานแบบปกติ หรือ สร้างหน่วยใหม่ (แสดงฟอร์มครบถ้วน)
                   ==================================================================== */
                <>
                  {/* 1. เลือกรายวิชา */}
                  <div>
                    <label className="block text-xs font-semibold text-[#163A66] mb-1">
                      1. รายวิชาที่ต้องการสั่งงาน *
                    </label>
                    <select
                      value={formCourseCode}
                      onChange={(e) => {
                        setFormCourseCode(e.target.value);
                        setFormSelectedRooms([]);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-[#163A66]"
                    >
                      {subjectsList.map((subj) => (
                        <option key={subj.courseCode} value={subj.courseCode}>
                          {subj.courseCode} — {subj.courseName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. รูปแบบการสั่งงาน & การคิดคะแนน (หน่วย vs ชิ้นงานเดี่ยว) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[#163A66]">
                      2. รูปแบบการสั่งงาน & การคิดคะแนน *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormAssignmentMode('UNIT_BUNDLE');
                          if (existingCourseUnitDetails.length > 0 && !formUnitTitle) {
                            handleSelectExistingUnit(existingCourseUnitDetails[0]);
                          }
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          formAssignmentMode === 'UNIT_BUNDLE'
                            ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#163A66] ring-2 ring-[#3B82F6]/20'
                            : 'border-slate-200 bg-white text-[#6B7C93] hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <Layers className="w-4 h-4 text-[#3B82F6]" />
                          <span>งานในหน่วยการเรียนรู้ / จุดประสงค์</span>
                        </div>
                        <p className="text-[11px] opacity-80 mt-1 leading-snug">
                          ตั้งค่าหน่วยก่อน แล้วสั่งงานย่อยด้านล่าง (รวมคะแนนเฉลี่ย/สัดส่วนเข้า ปพ.5)
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormAssignmentMode('DIRECT')}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          formAssignmentMode === 'DIRECT'
                            ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#163A66] ring-2 ring-[#3B82F6]/20'
                            : 'border-slate-200 bg-white text-[#6B7C93] hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <FileText className="w-4 h-4 text-[#3B82F6]" />
                          <span>ชิ้นงานเดี่ยวปกติ</span>
                        </div>
                        <p className="text-[11px] opacity-80 mt-1 leading-snug">
                          สั่ง 1 ชิ้นงาน คิดคะแนนตรงตามชิ้นงานนี้เข้า ปพ.5 ทันที
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* ====================================================================
                      โหมด 1: งานในหน่วยการเรียนรู้ (ตั้งค่าหน่วยด้านบนก่อน แล้วสั่งงานย่อยด้านล่าง)
                     ==================================================================== */}
                  {formAssignmentMode === 'UNIT_BUNDLE' ? (
                    <>
                      {/* ขั้นที่ 1: การตั้งค่าหน่วยการเรียนรู้ (UNIT SETTINGS FIRST!) */}
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-[#F2F7FC] to-[#F7FAFF] border border-[#BFDBFE] space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between pb-1 border-b border-blue-200/60">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#163A66]">
                            <Layers className="w-4 h-4 text-[#3B82F6]" />
                            <span>การตั้งค่าหน่วยการเรียนรู้ (Unit Settings)</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-[#1D4ED8] font-bold">
                            ตั้งค่าหน่วยก่อน
                          </span>
                        </div>

                        {/* แถบเลือก: เลือกหน่วยที่มีอยู่แล้ว หรือ สร้างหน่วยใหม่ */}
                        {!editingAssignment && existingCourseUnitDetails.length > 0 && (
                          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => {
                                setFormUnitTab('EXISTING');
                                if (!formUnitTitle && existingCourseUnitDetails[0]) {
                                  handleSelectExistingUnit(existingCourseUnitDetails[0]);
                                }
                              }}
                              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                formUnitTab === 'EXISTING'
                                  ? 'bg-[#3B82F6] text-white shadow-xs'
                                  : 'text-[#6B7C93] hover:text-[#163A66]'
                              }`}
                            >
                              เลือกหน่วยที่มีอยู่แล้ว ({existingCourseUnitDetails.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormUnitTab('NEW');
                                setFormUnitTitle('');
                              }}
                              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                formUnitTab === 'NEW'
                                  ? 'bg-[#3B82F6] text-white shadow-xs'
                                  : 'text-[#6B7C93] hover:text-[#163A66]'
                              }`}
                            >
                              + สร้างหน่วยใหม่
                            </button>
                          </div>
                        )}

                        {/* กรณีเลือกหน่วยที่มีอยู่เดิม (EXISTING) */}
                        {formUnitTab === 'EXISTING' && existingCourseUnitDetails.length > 0 && !editingAssignment ? (
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap gap-1.5">
                              {existingCourseUnitDetails.map((unit) => {
                                const isSelected = formUnitTitle === unit.unitTitle;
                                return (
                                  <button
                                    key={unit.unitTitle}
                                    type="button"
                                    onClick={() => handleSelectExistingUnit(unit)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#3B82F6] text-white shadow-xs'
                                        : 'bg-white border border-slate-200 text-[#163A66] hover:border-blue-300'
                                    }`}
                                  >
                                    <Layers className="w-3.5 h-3.5 opacity-80" />
                                    <span>{unit.unitTitle}</span>
                                    <span
                                      className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#6B7C93]'
                                      }`}
                                    >
                                      {unit.taskCount} งาน
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* สรุปข้อมูลหน่วยที่เลือก */}
                            <div className="p-3 rounded-xl bg-white border border-blue-200/80 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#163A66] flex items-center gap-1.5">
                                  <span>หน่วยที่เลือก:</span>
                                  <span className="text-[#3B82F6] font-extrabold underline underline-offset-2">
                                    {formUnitTitle || 'กรุณาคลิกเลือกหน่วยด้านบน'}
                                  </span>
                                </span>
                                <span className="text-[11px] font-bold text-slate-500">
                                  เต็ม {formUnitMaxScore} คะแนน
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#6B7C93] pt-1.5 border-t border-slate-100">
                                <div>
                                  ส่วนคะแนน ปพ.5:{' '}
                                  <strong className="text-[#163A66]">
                                    {SCORE_PART_LABELS[formScorePart]?.label || formScorePart}
                                  </strong>
                                </div>
                                <div>
                                  วิธีคิดคะแนน:{' '}
                                  <strong className="text-[#163A66]">
                                    {formScoringMethod === 'SUBMISSION_COUNT_RATIO'
                                      ? formIsDynamicTasks
                                        ? 'สัดส่วนส่งงาน (Dynamic)'
                                        : `สัดส่วนส่งงาน (${formTotalTasksInUnit} งาน)`
                                      : 'หารเฉลี่ยคะแนนดิบ'}
                                  </strong>
                                </div>
                              </div>
                              <div className="pt-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => setFormUnitTab('NEW')}
                                  className="text-[11px] text-[#3B82F6] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>ปรับแต่งการตั้งค่าหน่วยนี้</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* กรณีสร้างหน่วยใหม่ หรือแก้ไขการตั้งค่าหน่วย (NEW หรือ EDIT) */
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-[#163A66] mb-1">
                                ชื่อหน่วยการเรียนรู้ / จุดประสงค์ *
                              </label>
                              <input
                                type="text"
                                required={formAssignmentMode === 'UNIT_BUNDLE'}
                                value={formUnitTitle}
                                onChange={(e) => setFormUnitTitle(e.target.value)}
                                placeholder="เช่น บทที่ 8, หน่วยที่ 1 ทัศนธาตุ หรือ จุดประสงค์ที่ 2"
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-semibold text-[#163A66] mb-1">
                                  เก็บเข้าส่วนคะแนน ปพ.5 ของหน่วย *
                                </label>
                                <select
                                  value={formScorePart}
                                  onChange={(e) => setFormScorePart(e.target.value as FourScorePart)}
                                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#163A66]"
                                >
                                  <option value="PRE_MIDTERM">ก่อนกลางภาค (เต็ม {currentFormCourseWeights.preMidterm})</option>
                                  <option value="MIDTERM">กลางภาค (เต็ม {currentFormCourseWeights.midterm})</option>
                                  <option value="POST_MIDTERM">หลังกลางภาค (เต็ม {currentFormCourseWeights.postMidterm})</option>
                                  <option value="FINAL">ปลายภาค (เต็ม {currentFormCourseWeights.final})</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-[#163A66] mb-1">
                                  คะแนนเต็มประจำหน่วย *
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  value={formUnitMaxScore === 0 ? '' : formUnitMaxScore}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setFormUnitMaxScore(v === '' ? 0 : Number(v));
                                  }}
                                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#163A66]"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-[#163A66] mb-1">
                                วิธีคิดคะแนนประจำหน่วย:
                              </label>
                              <div className="space-y-1.5">
                                <label className="flex items-start gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="scoringMethod"
                                    value="SUBMISSION_COUNT_RATIO"
                                    checked={formScoringMethod === 'SUBMISSION_COUNT_RATIO'}
                                    onChange={() => setFormScoringMethod('SUBMISSION_COUNT_RATIO')}
                                    className="mt-0.5 text-[#3B82F6]"
                                  />
                                  <div>
                                    <span className="font-bold text-[#163A66] block text-xs">
                                      เก็บสัดส่วนการส่งงาน (คะแนนความรับผิดชอบ)
                                    </span>
                                    <span className="text-[10px] text-[#6B7C93]">
                                      {formIsDynamicTasks
                                        ? `นับงานที่ส่งจริงเทียบกับงานทั้งหมดที่สั่งในหน่วยนี้ แล้วเทียบเป็นเต็ม ${formUnitMaxScore} คะแนนอัตโนมัติ`
                                        : `สั่ง ${formTotalTasksInUnit} งาน เต็ม ${formUnitMaxScore} คะแนน`}
                                    </span>
                                  </div>
                                </label>

                                <label className="flex items-start gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="scoringMethod"
                                    value="RAW_SCORE_AVERAGE"
                                    checked={formScoringMethod === 'RAW_SCORE_AVERAGE'}
                                    onChange={() => setFormScoringMethod('RAW_SCORE_AVERAGE')}
                                    className="mt-0.5 text-[#3B82F6]"
                                  />
                                  <div>
                                    <span className="font-bold text-[#163A66] block text-xs">
                                      หารเฉลี่ยคะแนนดิบของงานทั้งหมดในหน่วย
                                    </span>
                                    <span className="text-[10px] text-[#6B7C93]">
                                      นำคะแนนที่ได้จากทุกงานในหน่วยมารวมแล้วเทียบเป็นสัดส่วนเต็ม {formUnitMaxScore} คะแนน
                                    </span>
                                  </div>
                                </label>
                              </div>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                              <span className="text-xs font-semibold text-[#163A66]">
                                ปัดเศษทศนิยม &gt;= 0.5 ขึ้นอัตโนมัติ
                              </span>
                              <input
                                type="checkbox"
                                checked={formAutoRoundUp}
                                onChange={(e) => setFormAutoRoundUp(e.target.checked)}
                                className="w-4 h-4 text-[#3B82F6] rounded cursor-pointer"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ขั้นที่ 2: ข้อมูลชิ้นงานย่อยที่สั่ง (SUB-TASK DETAILS BELOW!) */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-[#163A66] flex items-center gap-1.5">
                            <ClipboardList className="w-4 h-4 text-[#3B82F6]" />
                            <span>ข้อมูลชิ้นงาน / ภาระงานย่อยที่สั่ง *</span>
                          </label>
                          <span className="text-[10px] text-slate-400">
                            {formUnitTitle ? `บันทึกเข้าหน่วย "${formUnitTitle}"` : 'กรุณาระบุหน่วยด้านบนก่อน'}
                          </span>
                        </div>

                        {/* ชื่องานย่อย */}
                        <div>
                          <label className="block text-[11px] font-semibold text-[#6B7C93] mb-1">
                            ชื่อชิ้นงาน / การบ้าน / การสอบย่อย *
                          </label>
                          <input
                            type="text"
                            required
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="เช่น บทที่ 8 ข้อที่ 1-4, ใบงานสรุปคำศัพท์"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                          />
                        </div>

                        {/* รายละเอียดของงาน / คำชี้แจง / โจทย์ */}
                        <div>
                          <label className="block text-[11px] font-semibold text-[#6B7C93] mb-1">
                            รายละเอียดของงาน / คำชี้แจง / คำสั่งสำหรับนักเรียน
                          </label>
                          <textarea
                            rows={3}
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                            placeholder="ระบุคำชี้แจง คำถาม สิ่งที่ต้องทำ หรือแนวทางการทำชิ้นงานนี้ให้นักเรียนศึกษา..."
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] leading-relaxed"
                          />
                        </div>

                        {/* สื่อการสอนและเอกสารสำหรับนักเรียน */}
                        <div className="p-3.5 rounded-2xl bg-[#F7FAFF] border border-[#BFDBFE] space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-[#163A66] flex items-center gap-1.5">
                              <Paperclip className="w-3.5 h-3.5 text-[#3B82F6]" />
                              <span>สื่อการสอนและเอกสารสำหรับนักเรียน</span>
                            </label>
                            <span className="text-[10px] text-slate-400">
                              ให้นักเรียนศึกษาหรือดูตัวอย่าง
                            </span>
                          </div>

                          {/* เลือกจากแผนการสอนที่มีอยู่ */}
                          <div>
                            <label className="block text-[11px] font-semibold text-[#6B7C93] mb-1">
                              📁 เลือกไฟล์จากแผนการสอนที่บันทึกไว้ในระบบ:
                            </label>
                            {availableLessonPlanFiles.length > 0 ? (
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  const f = availableLessonPlanFiles.find((item) => item.id === e.target.value);
                                  if (f) {
                                    handleAddLessonPlanAttachment(f);
                                    e.target.value = '';
                                  }
                                }}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-[#163A66]"
                              >
                                <option value="" disabled>-- เลือกไฟล์จากแผนการสอน ({availableLessonPlanFiles.length} ไฟล์) --</option>
                                {availableLessonPlanFiles.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    [{f.type}] {f.name} {f.lessonPlanTitle ? `(${f.lessonPlanTitle})` : ''}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-[11px] text-slate-400 italic bg-white p-2 rounded-xl border border-slate-100">
                                ยังไม่มีไฟล์แผนการสอนที่ผูกกับวิชานี้ (สามารถอัปโหลดภาพหรือ PDF ด้านล่างได้โดยตรง)
                              </p>
                            )}
                          </div>

                          {/* อัปโหลดตัวอย่างเป็นภาพ หรือ PDF */}
                          <div>
                            <label className="block text-[11px] font-semibold text-[#6B7C93] mb-1">
                              🖼️ หรือ อัปโหลดตัวอย่างเป็นภาพ หรือ PDF:
                            </label>
                            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#3B82F6] bg-white hover:bg-blue-50/50 text-[#3B82F6] text-xs font-semibold cursor-pointer transition-colors">
                              <Upload className="w-4 h-4 text-[#3B82F6]" />
                              <span>คลิกเพื่ออัปโหลดไฟล์ (ภาพ JPG/PNG หรือเอกสาร PDF)</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleTeacherFileUpload}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* รายการไฟล์แนบที่เลือกแล้ว */}
                          {formAttachments.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[11px] font-bold text-[#163A66] block">
                                ไฟล์ที่แนบแล้ว ({formAttachments.length} รายการ):
                              </span>
                              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                {formAttachments.map((att) => (
                                  <div
                                    key={att.id}
                                    className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      {att.type === 'PDF' ? (
                                        <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                                      ) : att.type === 'IMAGE' ? (
                                        <Eye className="w-4 h-4 text-blue-500 shrink-0" />
                                      ) : (
                                        <Paperclip className="w-4 h-4 text-slate-500 shrink-0" />
                                      )}
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate" title={att.name}>
                                          {att.name}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                          {att.size && <span>{att.size}</span>}
                                          {att.source === 'LESSON_PLAN' ? (
                                            <span className="text-blue-600 font-semibold bg-blue-50 px-1 rounded">จากแผนการสอน</span>
                                          ) : (
                                            <span className="text-emerald-600 font-semibold bg-emerald-50 px-1 rounded">อัปโหลดใหม่</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setFormAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                      title="ลบไฟล์แนบนี้"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* กำหนดส่ง & คะแนนดิบ (ถ้าเป็นหารเฉลี่ย) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {formScoringMethod === 'RAW_SCORE_AVERAGE' ? (
                            <div>
                              <label className="block text-xs font-semibold text-[#163A66] mb-1">
                                คะแนนดิบของงานนี้ (นำไปหารเฉลี่ย)
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={formMaxScore === 0 ? '' : formMaxScore}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setFormMaxScore(v === '' ? 0 : Number(v));
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-[#163A66]"
                              />
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70 text-xs flex flex-col justify-center">
                              <span className="font-bold text-[#163A66] text-[11px]">
                                เกณฑ์สัดส่วนการส่งงาน
                              </span>
                              <span className="text-[10px] text-[#6B7C93] mt-0.5">
                                คิดเป็น 1 ชิ้นงานของหน่วย &quot;{formUnitTitle || '...'}&quot; (คะแนนรวมหน่วยเต็ม {formUnitMaxScore})
                              </span>
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-semibold text-[#163A66] mb-1">
                              กำหนดส่ง
                            </label>
                            <input
                              type="date"
                              value={formDueDate}
                              onChange={(e) => setFormDueDate(e.target.value)}
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-[#163A66]"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* ====================================================================
                        โหมด 2: ชิ้นงานเดี่ยวปกติ (SINGLE TASK)
                       ==================================================================== */
                    <div className="space-y-3 pt-1">
                      {/* ชื่องาน */}
                      <div>
                        <label className="block text-xs font-semibold text-[#163A66] mb-1">
                          ชื่อชิ้นงาน / การบ้าน / การสอบย่อย *
                        </label>
                        <input
                          type="text"
                          required
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          placeholder="เช่น สอบเก็บคะแนนก่อนกลางภาค, ใบงานทัศนธาตุ"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                        />
                      </div>

                      {/* ส่วนคะแนน ปพ.5 + คะแนนเต็ม + กำหนดส่ง */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-[#163A66] mb-1">
                            เก็บเข้าส่วนคะแนน ปพ.5 *
                          </label>
                          <select
                            value={formScorePart}
                            onChange={(e) => setFormScorePart(e.target.value as FourScorePart)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#163A66]"
                          >
                            <option value="PRE_MIDTERM">
                              ก่อนกลางภาค (เต็ม {currentFormCourseWeights.preMidterm})
                            </option>
                            <option value="MIDTERM">
                              กลางภาค (เต็ม {currentFormCourseWeights.midterm})
                            </option>
                            <option value="POST_MIDTERM">
                              หลังกลางภาค (เต็ม {currentFormCourseWeights.postMidterm})
                            </option>
                            <option value="FINAL">
                              ปลายภาค (เต็ม {currentFormCourseWeights.final})
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#163A66] mb-1">
                            คะแนนเต็มของงานนี้ *
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={formMaxScore === 0 ? '' : formMaxScore}
                            onChange={(e) => {
                              const v = e.target.value;
                              setFormMaxScore(v === '' ? 0 : Number(v));
                            }}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#163A66]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#163A66] mb-1">
                            กำหนดส่ง
                          </label>
                          <input
                            type="date"
                            value={formDueDate}
                            onChange={(e) => setFormDueDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-[#163A66]"
                          />
                        </div>
                      </div>

                      {/* รายละเอียดของงาน / คำชี้แจง / โจทย์ */}
                      <div>
                        <label className="block text-xs font-semibold text-[#163A66] mb-1">
                          รายละเอียดของงาน / คำชี้แจง / คำสั่งสำหรับนักเรียน
                        </label>
                        <textarea
                          rows={3}
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          placeholder="ระบุคำชี้แจง คำถาม สิ่งที่ต้องทำ หรือแนวทางการทำชิ้นงานนี้ให้นักเรียนศึกษา..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] leading-relaxed"
                        />
                      </div>

                      {/* สื่อการสอนและเอกสารสำหรับนักเรียน */}
                      <div className="p-3.5 rounded-2xl bg-[#F7FAFF] border border-[#BFDBFE] space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-[#163A66] flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-[#3B82F6]" />
                            <span>สื่อการสอนและเอกสารสำหรับนักเรียน</span>
                          </label>
                          <span className="text-[10px] text-slate-400">
                            ให้นักเรียนศึกษาหรือดูตัวอย่าง
                          </span>
                        </div>

                        {/* เลือกจากแผนการสอนที่มีอยู่ */}
                        <div>
                          <label className="block text-[11px] font-semibold text-[#6B7C93] mb-1">
                            📁 เลือกไฟล์จากแผนการสอนที่บันทึกไว้ในระบบ:
                          </label>
                          {availableLessonPlanFiles.length > 0 ? (
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                const f = availableLessonPlanFiles.find((item) => item.id === e.target.value);
                                if (f) {
                                  handleAddLessonPlanAttachment(f);
                                  e.target.value = '';
                                }
                              }}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-[#163A66]"
                            >
                              <option value="" disabled>-- เลือกไฟล์จากแผนการสอน ({availableLessonPlanFiles.length} ไฟล์) --</option>
                              {availableLessonPlanFiles.map((f) => (
                                <option key={f.id} value={f.id}>
                                  [{f.type}] {f.name} {f.lessonPlanTitle ? `(${f.lessonPlanTitle})` : ''}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic bg-white p-2 rounded-xl border border-slate-100">
                              ยังไม่มีไฟล์แผนการสอนที่ผูกกับวิชานี้ (สามารถอัปโหลดภาพหรือ PDF ด้านล่างได้โดยตรง)
                            </p>
                          )}
                        </div>

                        {/* อัปโหลดตัวอย่างเป็นภาพ หรือ PDF */}
                        <div>
                          <label className="block text-[11px] font-semibold text-[#6B7C93] mb-1">
                            🖼️ หรือ อัปโหลดตัวอย่างเป็นภาพ หรือ PDF:
                          </label>
                          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-[#3B82F6] bg-white hover:bg-blue-50/50 text-[#3B82F6] text-xs font-semibold cursor-pointer transition-colors">
                            <Upload className="w-4 h-4 text-[#3B82F6]" />
                            <span>คลิกเพื่ออัปโหลดไฟล์ (ภาพ JPG/PNG หรือเอกสาร PDF)</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              onChange={handleTeacherFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* รายการไฟล์แนบที่เลือกแล้ว */}
                        {formAttachments.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-bold text-[#163A66] block">
                              ไฟล์ที่แนบแล้ว ({formAttachments.length} รายการ):
                            </span>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto">
                              {formAttachments.map((att) => (
                                <div
                                  key={att.id}
                                  className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {att.type === 'PDF' ? (
                                      <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                                    ) : att.type === 'IMAGE' ? (
                                      <Eye className="w-4 h-4 text-blue-500 shrink-0" />
                                    ) : (
                                      <Paperclip className="w-4 h-4 text-slate-500 shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-800 truncate" title={att.name}>
                                        {att.name}
                                      </p>
                                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                        {att.size && <span>{att.size}</span>}
                                        {att.source === 'LESSON_PLAN' ? (
                                          <span className="text-blue-600 font-semibold bg-blue-50 px-1 rounded">จากแผนการสอน</span>
                                        ) : (
                                          <span className="text-emerald-600 font-semibold bg-emerald-50 px-1 rounded">อัปโหลดใหม่</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setFormAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                    title="ลบไฟล์แนบนี้"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. เลือกห้องเรียน: ทุกห้องในรายวิชา หรือ เฉพาะห้องที่เลือก */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-[#163A66]">
                      3. ห้องเรียนที่ได้รับมอบหมาย:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormScopeMode('ALL_SUBJECT_ROOMS')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          formScopeMode === 'ALL_SUBJECT_ROOMS'
                            ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#163A66]'
                            : 'border-slate-200 bg-white text-[#6B7C93]'
                        }`}
                      >
                        <p className="text-xs font-bold">
                          สั่งทุกห้องในรายวิชานี้ ({currentFormSubjectRooms.length} ห้อง)
                        </p>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          สั่งครั้งเดียวใช้กับทุกห้องที่เรียนวิชานี้
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormScopeMode('SELECTED_ROOMS');
                          if (formSelectedRooms.length === 0 && currentFormSubjectRooms[0]) {
                            setFormSelectedRooms([currentFormSubjectRooms[0]]);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          formScopeMode === 'SELECTED_ROOMS'
                            ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#163A66]'
                            : 'border-slate-200 bg-white text-[#6B7C93]'
                        }`}
                      >
                        <p className="text-xs font-bold">เลือกเฉพาะห้องเรียน</p>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          ติ๊กเลือกเฉพาะห้องที่ต้องการสั่งงาน
                        </p>
                      </button>
                    </div>

                    {formScopeMode === 'SELECTED_ROOMS' && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {currentFormSubjectRooms.map((room) => {
                          const checked = formSelectedRooms.includes(room);
                          return (
                            <button
                              key={room}
                              type="button"
                              onClick={() => {
                                setFormSelectedRooms((prev) =>
                                  checked ? prev.filter((r) => r !== room) : [...prev, room]
                                );
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                                checked
                                  ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                                  : 'bg-white text-[#6B7C93] border-slate-200'
                              }`}
                            >
                              {checked && <Check className="w-3 h-3" />}
                              <span>{room}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            {/* End of Scrollable Form Body */}

            {/* Modal Footer (ตรึงแน่นอยู่ด้านล่าง เห็นปุ่มบันทึกและยกเลิกชัดเจนเสมอ) */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 bg-slate-50/80 rounded-b-[22px]">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingAssignment(null);
                  setEditScope(null);
                  setIsAddingToExistingUnit(false);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-[#6B7C93] hover:bg-slate-100 cursor-pointer transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              >
                {editScope === 'UNIT'
                  ? 'บันทึกการตั้งค่าหน่วย'
                  : editScope === 'SUB_TASK'
                  ? 'บันทึกการแก้ไขงานย่อย'
                  : editingAssignment
                  ? 'บันทึกการแก้ไขชิ้นงาน'
                  : isAddingToExistingUnit
                  ? 'บันทึกและสั่งงานเพิ่มในหน่วยนี้'
                  : 'บันทึกและสั่งงาน'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: วิธีใช้งาน (ซ่อนคำอธิบายไว้ในปุ่ม ⓘ)
         ==================================================================== */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[22px] border border-[#E6EEF7] max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#3B82F6]" />
                <h3 className="text-base font-bold text-[#163A66]">วิธีสั่งงานและตรวจงาน</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-[#163A66]">
              <div className="p-3 rounded-xl bg-[#F7FAFF] border border-[#E6EEF7]">
                <p className="font-bold text-[#3B82F6]">1. กดปุ่ม "+ สั่งงานใหม่"</p>
                <p className="text-xs text-[#6B7C93] mt-0.5">
                  เลือกรายวิชา และเลือกส่วนคะแนนที่จะเก็บ (ก่อนกลางภาค / กลางภาค / หลังกลางภาค / ปลายภาค)
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F7FAFF] border border-[#E6EEF7]">
                <p className="font-bold text-[#3B82F6]">2. เลือกสั่งทุกห้อง หรือ เฉพาะห้อง</p>
                <p className="text-xs text-[#6B7C93] mt-0.5">
                  สามารถสั่งครั้งเดียวให้ทุกห้องที่เรียนรายวิชานี้ หรือติ๊กเลือกเฉพาะห้องที่ต้องการได้ทันที
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F7FAFF] border border-[#E6EEF7]">
                <p className="font-bold text-[#3B82F6]">3. คะแนนซิงก์เข้า ปพ.5 อัตโนมัติ</p>
                <p className="text-xs text-[#6B7C93] mt-0.5">
                  เมื่อตรวจให้คะแนนแล้ว ระบบจะคำนวณสัดส่วนเข้าสมุดคะแนน ปพ.5 ให้โดยอัตโนมัติ
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-xs font-semibold cursor-pointer"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: ยืนยันการลบงานย่อย (Delete Sub-Task Confirmation Modal)
         ==================================================================== */}
      {subTaskToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[22px] border border-[#FECACA] max-w-md w-full p-5 sm:p-6 shadow-xl space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#163A66]">ยืนยันการลบงานย่อย</h3>
                  <p className="text-xs text-[#6B7C93]">
                    {subTaskToDelete.unitTitle || 'หน่วยการเรียนรู้'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubTaskToDelete(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-2 text-xs text-[#163A66]">
              <div className="font-semibold text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>คุณต้องการลบงานย่อยนี้ใช่หรือไม่?</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-rose-100 font-bold text-[#163A66] break-words">
                📝 {subTaskToDelete.task.title}
              </div>
              <p className="text-[11px] text-[#6B7C93] leading-relaxed">
                การลบงานย่อยนี้จะลบไฟล์ที่นักเรียนส่งและคะแนนตรวจออกจากระบบทันที (จะไม่กระทบกับงานย่อยอื่นในหน่วยเดียวกัน)
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSubTaskToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#163A66] bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSubTask}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>ยืนยันลบงานย่อย</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Modals */}
      <GradingWorkspaceModal
        isOpen={Boolean(gradingModalItem)}
        onClose={() => setGradingModalItem(null)}
        currentItem={gradingModalItem}
        allItems={filteredSubmissions}
        onSaveGrade={handleSaveGrade}
        onReturnSubmission={handleReturnSubmission}
        onSelectQueueItem={(item) => setGradingModalItem(item)}
      />

      <Submission3ColorMatrixModal
        isOpen={is3ColorMatrixOpen}
        onClose={() => setIs3ColorMatrixOpen(false)}
        defaultSubjectCode={
          matrixModalDefaultSubject ||
          (selectedSubjectCode === 'ALL' ? subjectsList[0]?.courseCode || 'ท23102' : selectedSubjectCode)
        }
        defaultRoom={
          matrixModalDefaultRoom ||
          (selectedRoom === 'ALL' ? availableFilterRooms[0] || 'ม.1/1' : selectedRoom)
        }
        onOpenPreview={(preview) => setPreviewItem(preview)}
        onGradeQuick={(_asgId, _stuCode, _max) => {
          showToast('✓ บันทึกสถานะส่งงานเรียบร้อยแล้ว');
        }}
      />

      <SgsClassroomMatrixModal
        isOpen={isSgsMatrixOpen}
        onClose={() => setIsSgsMatrixOpen(false)}
        defaultSubjectCode={
          matrixModalDefaultSubject ||
          (selectedSubjectCode === 'ALL' ? subjectsList[0]?.courseCode || 'ท23102' : selectedSubjectCode)
        }
        defaultRoom={
          matrixModalDefaultRoom ||
          (selectedRoom === 'ALL' ? availableFilterRooms[0] || 'ม.1/1' : selectedRoom)
        }
      />

      <AssignmentBundlesModal
        isOpen={isBundlesModalOpen}
        onClose={() => setIsBundlesModalOpen(false)}
        onShowToast={(msg) => showToast(msg)}
      />

      <ArtworkPreviewModal
        isOpen={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.title || 'ผลงานนักเรียน'}
        studentName={previewItem?.studentName || ''}
        studentCode={previewItem?.studentCode}
        assignmentId={previewItem?.assignmentId}
        classroom={previewItem?.classroom || availableFilterRooms[0] || 'ม.1/1'}
        seatNo={previewItem?.seatNo}
        type={previewItem?.type || 'IMAGE'}
        url={previewItem?.url}
        externalLinkUrl={previewItem?.externalLinkUrl}
        textContent={previewItem?.textContent}
        fileName={previewItem?.fileName}
        platform={previewItem?.platform}
      />

      {/* Modal Quick Grade Single Cell */}
      {editingCell && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[22px] border border-[#E6EEF7] max-w-sm w-full max-h-[90vh] overflow-y-auto p-5 shadow-xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#163A66]">
                  บันทึกคะแนน: {editingCell.studentName}
                </h3>
                <p className="text-xs text-[#3B82F6] font-semibold">{editingCell.assignmentTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#6B7C93]">
                คะแนนที่ได้ (เต็ม {editingCell.maxScore} คะแนน)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={editingCell.maxScore}
                  defaultValue={editingCell.currentScore ?? editingCell.maxScore}
                  id="cellScoreInput"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-[#163A66] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                />
              </div>

              {/* Quick Score Preset Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('cellScoreInput') as HTMLInputElement;
                    if (el) el.value = String(editingCell.maxScore);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 cursor-pointer"
                >
                  เต็ม ({editingCell.maxScore})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('cellScoreInput') as HTMLInputElement;
                    if (el) el.value = String(Math.round(editingCell.maxScore / 2));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 cursor-pointer"
                >
                  ครึ่ง ({Math.round(editingCell.maxScore / 2)})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('cellScoreInput') as HTMLInputElement;
                    if (el) el.value = '0';
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  0
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#6B7C93] hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('cellScoreInput') as HTMLInputElement;
                  const val = el ? Number(el.value) : editingCell.maxScore;
                  sgsRosterAndSubmissionService.gradeSubmission(
                    editingCell.assignmentId,
                    editingCell.studentCode,
                    val,
                    'GRADED'
                  );
                  teacherCourseAssignmentService.submitGrade(
                    `q_${editingCell.assignmentId}_${editingCell.studentCode}`,
                    val,
                    'บันทึกคะแนนจากตารางแจกแจง'
                  );
                  setEditingCell(null);
                  refreshMatrixStudents();
                  showToast(`✓ บันทึก ${editingCell.studentName}: ${val}/${editingCell.maxScore} คะแนน`);
                }}
                className="px-4 py-1.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                บันทึกคะแนน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
