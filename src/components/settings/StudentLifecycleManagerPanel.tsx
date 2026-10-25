// src/components/settings/StudentLifecycleManagerPanel.tsx
// ศูนย์บริหารจัดการบัญชีและสถานะทะเบียนนักเรียนครบวงจร (Student User & Lifecycle Control Center)
// ครอบคลุม: กำลังศึกษา, ย้ายเข้า/ย้ายห้อง, ย้ายออกต่างโรงเรียน, จบการศึกษา, ลาออก, พักการเรียน, จำหน่ายออก (พ้นสภาพ), คืนสภาพ และจัดการรหัสผ่าน/สิทธิ์ล็อกอิน

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  GraduationCap,
  ArrowRightLeft,
  Search,
  KeyRound,
  Lock,
  Unlock,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Building2,
  X,
  Rocket,
  History,
} from 'lucide-react';
import {
  studentLifecycleService,
  LIFECYCLE_STATUS_CONFIG,
  LIFECYCLE_REASON_OPTIONS,
  canManageStudentLifecycle,
  STUDENT_LIFECYCLE_UPDATED_EVENT,
  type StudentLifecycleStatus,
  type StudentLifecycleReasonCode,
  type UnifiedStudentUserRecord,
} from '../../services/studentLifecycleService';
import { CANONICAL_TIMESTAMP_ROOM_MAP } from '../../services/masterDataService';
import { formatClassroomLabel } from '../../services/studentService';
import { activityAuditLogService, AUDIT_LOG_SYNC_EVENT, type AuditLogEntry } from '../../services/activityAuditLogService';
import { AcademicRolloverControlCenter } from '../promotion/AcademicRolloverControlCenter';
import type { SchoolUserRole } from '../../config/schoolRoles';
import { authService } from '../../services/authService';

interface StudentLifecycleManagerPanelProps {
  activeRole?: SchoolUserRole;
}

type PanelSubTab = 'DIRECTORY' | 'TRANSFER_IN' | 'ROLLOVER_AND_LOGS';

export const StudentLifecycleManagerPanel: React.FC<StudentLifecycleManagerPanelProps> = ({
  activeRole = 'ACADEMIC_ADMIN',
}) => {
  const currentUser = authService.getCurrentUser();
  const canEditLifecycle = canManageStudentLifecycle(activeRole) || currentUser?.role === 'ADMIN';

  const [subTab, setSubTab] = useState<PanelSubTab>('DIRECTORY');
  const [students, setStudents] = useState<UnifiedStudentUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | StudentLifecycleStatus>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal สำหรับเปลี่ยนสถานะรายบุคคล (ย้ายห้อง, ย้ายออก, จบการศึกษา, ลาออก, พักการเรียน, จำหน่ายออก, คืนสภาพ)
  const [editingStudent, setEditingStudent] = useState<UnifiedStudentUserRecord | null>(null);
  const [modalStatus, setModalStatus] = useState<StudentLifecycleStatus>('TRANSFERRED_OUT');
  const [modalReasonCode, setModalReasonCode] = useState<StudentLifecycleReasonCode>('TRANSFER_SCHOOL');
  const [modalTargetRoom, setModalTargetRoom] = useState<string>('ม.1/1');
  const [modalDocOrderNo, setModalDocOrderNo] = useState<string>('');
  const [modalEffectiveDate, setModalEffectiveDate] = useState<string>(() =>
    new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
  );
  const [modalReturnDate, setModalReturnDate] = useState<string>('');
  const [modalSchoolName, setModalSchoolName] = useState<string>('');
  const [modalGradYear, setModalGradYear] = useState<number>(2569);
  const [modalRemarks, setModalRemarks] = useState<string>('');
  const [isSubmittingModal, setIsSubmittingModal] = useState<boolean>(false);

  // ฟอร์มรับนักเรียนย้ายเข้าใหม่ (Tab 2)
  const [newStuCode, setNewStuCode] = useState<string>('');
  const [newStuPrefix, setNewStuPrefix] = useState<string>('นาย');
  const [newStuFirstName, setNewStuFirstName] = useState<string>('');
  const [newStuLastName, setNewStuLastName] = useState<string>('');
  const [newStuGender, setNewStuGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [newStuRoom, setNewStuRoom] = useState<string>('ม.1/1');
  const [newStuFromSchool, setNewStuFromSchool] = useState<string>('');
  const [newStuDocNo, setNewStuDocNo] = useState<string>('');
  const [newStuRemarks, setNewStuRemarks] = useState<string>('');
  const [isSubmittingNewStu, setIsSubmittingNewStu] = useState<boolean>(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    activityAuditLogService.getLogs({ entityType: 'นักเรียน' }).slice(0, 30)
  );

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const list = await studentLifecycleService.loadAllStudentsWithLifecycle();
      setStudents(list);
      setAuditLogs(activityAuditLogService.getLogs({ entityType: 'นักเรียน' }).slice(0, 30));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => {
      loadData();
    };
    window.addEventListener(STUDENT_LIFECYCLE_UPDATED_EVENT, handleRefresh);
    window.addEventListener(AUDIT_LOG_SYNC_EVENT, handleRefresh);
    window.addEventListener('kp-sgs-roster-updated', handleRefresh);
    return () => {
      window.removeEventListener(STUDENT_LIFECYCLE_UPDATED_EVENT, handleRefresh);
      window.removeEventListener(AUDIT_LOG_SYNC_EVENT, handleRefresh);
      window.removeEventListener('kp-sgs-roster-updated', handleRefresh);
    };
  }, []);

  const availableRooms = useMemo(() => {
    const roomSet = new Set<string>(Object.values(CANONICAL_TIMESTAMP_ROOM_MAP));
    students.forEach((s) => {
      if (s.classroom && s.classroom !== 'ไม่ระบุห้อง') {
        roomSet.add(formatClassroomLabel(s.classroom));
      }
    });
    return Array.from(roomSet).sort((a, b) => a.localeCompare(b, 'th', { numeric: true }));
  }, [students]);

  const classroomOptionsForWizard = useMemo(() => {
    return availableRooms.map((roomName) => {
      const m = roomName.match(/ม\.(\d+)\/(\d+)/);
      const grade = m ? `ม.${m[1]}` : 'ม.1';
      return {
        id: roomName,
        name: roomName,
        gradeLevel: grade,
        grade_level: grade,
      };
    });
  }, [availableRooms]);

  // สรุปยอดสถิติ KPI ทะเบียนนักเรียน
  const kpiStats = useMemo(() => {
    let studying = 0;
    let transferredIn = 0;
    let transferredOut = 0;
    let graduated = 0;
    let dismissedOrDropped = 0;
    let lockedAccounts = 0;

    for (const s of students) {
      if (s.lifecycleStatus === 'STUDYING' || s.lifecycleStatus === 'REPEATED') studying++;
      else if (s.lifecycleStatus === 'TRANSFERRED_IN') {
        studying++;
        transferredIn++;
      } else if (s.lifecycleStatus === 'TRANSFERRED_OUT') transferredOut++;
      else if (s.lifecycleStatus === 'GRADUATED') graduated++;
      else if (
        s.lifecycleStatus === 'DROPPED_OUT' ||
        s.lifecycleStatus === 'SUSPENDED' ||
        s.lifecycleStatus === 'DISMISSED'
      ) {
        dismissedOrDropped++;
      }

      if (s.accountStatus !== 'ACTIVE') {
        lockedAccounts++;
      }
    }

    return {
      total: students.length,
      studying,
      transferredIn,
      transferredOut,
      graduated,
      dismissedOrDropped,
      lockedAccounts,
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedRoom !== 'ALL' && formatClassroomLabel(s.classroom) !== formatClassroomLabel(selectedRoom)) {
        return false;
      }
      if (selectedStatus !== 'ALL' && s.lifecycleStatus !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = s.studentCode.toLowerCase().includes(q);
        const matchName = s.name.toLowerCase().includes(q);
        const matchRoom = s.classroom.toLowerCase().includes(q);
        const matchReason = (s.reasonLabel || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchRoom && !matchReason) return false;
      }
      return true;
    });
  }, [students, selectedRoom, selectedStatus, searchQuery]);

  const openTransitionModal = (stu: UnifiedStudentUserRecord, initialStatus?: StudentLifecycleStatus) => {
    setEditingStudent(stu);
    const nextStatus = initialStatus || (stu.lifecycleStatus === 'STUDYING' ? 'TRANSFERRED_OUT' : stu.lifecycleStatus);
    setModalStatus(nextStatus);
    const matchingReasons = LIFECYCLE_REASON_OPTIONS.filter((r) => r.forStatuses.includes(nextStatus));
    setModalReasonCode(matchingReasons[0]?.code || 'TRANSFER_SCHOOL');
    setModalTargetRoom(stu.classroom || 'ม.1/1');
    setModalDocOrderNo(stu.documentOrderNo || '');
    setModalEffectiveDate(
      stu.effectiveDate ||
        new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
    );
    setModalReturnDate('');
    setModalSchoolName(stu.sourceOrTargetSchool || '');
    setModalGradYear(stu.graduatedAcademicYear || 2569);
    setModalRemarks(stu.remarks || '');
  };

  const handleStatusChangeInModal = (nextStatus: StudentLifecycleStatus) => {
    setModalStatus(nextStatus);
    const matchingReasons = LIFECYCLE_REASON_OPTIONS.filter((r) => r.forStatuses.includes(nextStatus));
    if (matchingReasons.length > 0) {
      setModalReasonCode(matchingReasons[0].code);
    }
  };

  const handleExecuteTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsSubmittingModal(true);
    try {
      await studentLifecycleService.executeLifecycleTransition({
        studentCode: editingStudent.studentCode,
        studentId: editingStudent.id,
        studentName: editingStudent.name,
        currentClassroom: editingStudent.classroom,
        targetClassroom:
          modalStatus === 'TRANSFERRED_IN' || modalStatus === 'STUDYING'
            ? modalTargetRoom
            : editingStudent.classroom,
        seatNo: editingStudent.seatNo,
        gender: editingStudent.gender,
        lifecycleStatus: modalStatus,
        reasonCode: modalReasonCode,
        documentOrderNo: modalDocOrderNo,
        effectiveDate: modalEffectiveDate,
        returnDate: modalReturnDate,
        sourceOrTargetSchool: modalSchoolName,
        graduatedAcademicYear: modalStatus === 'GRADUATED' ? modalGradYear : undefined,
        remarks: modalRemarks,
        actorName: currentUser?.name || (activeRole === 'ACADEMIC_ADMIN' ? 'แอดมินฝ่ายวิชาการ' : 'ฝ่ายทะเบียน/กิจการนักเรียน'),
        actorRole: activeRole,
      });

      const cfg = LIFECYCLE_STATUS_CONFIG[modalStatus];
      showToast(`✓ บันทึกสถานะ "${cfg.label}" ของ ${editingStudent.name} (${editingStudent.studentCode}) เรียบร้อยแล้ว`);
      setEditingStudent(null);
      await loadData();
    } catch (err: any) {
      showToast(`❌ เกิดข้อผิดพลาด: ${err?.message || 'ไม่สามารถบันทึกสถานะได้'}`);
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const handleRegisterTransferInStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newStuCode.trim();
    const fullName = `${newStuPrefix}${newStuFirstName.trim()} ${newStuLastName.trim()}`.trim();
    if (!cleanCode || !newStuFirstName.trim()) {
      showToast('⚠️ กรุณากรอกรหัสประจำตัวนักเรียนและชื่อ-นามสกุลให้ครบถ้วน');
      return;
    }

    setIsSubmittingNewStu(true);
    try {
      await studentLifecycleService.executeLifecycleTransition({
        studentCode: cleanCode,
        studentName: fullName,
        currentClassroom: newStuRoom,
        targetClassroom: newStuRoom,
        gender: newStuGender,
        lifecycleStatus: 'TRANSFERRED_IN',
        reasonCode: 'NEW_ADMISSION_TRANSFER_IN',
        documentOrderNo: newStuDocNo.trim() || undefined,
        sourceOrTargetSchool: newStuFromSchool.trim() || undefined,
        remarks: newStuRemarks.trim() || undefined,
        actorName: currentUser?.name || 'แอดมินฝ่ายทะเบียนนักเรียน',
        actorRole: activeRole,
      });

      showToast(`✓ รับนักเรียนย้ายเข้าใหม่ ${fullName} (${cleanCode}) เข้าห้อง ${newStuRoom} สำเร็จ`);
      setNewStuCode('');
      setNewStuFirstName('');
      setNewStuLastName('');
      setNewStuFromSchool('');
      setNewStuDocNo('');
      setNewStuRemarks('');
      setSubTab('DIRECTORY');
      await loadData();
    } catch (err: any) {
      showToast(`❌ ไม่สามารถลงทะเบียนย้ายเข้าได้: ${err?.message || 'เกิดข้อผิดพลาด'}`);
    } finally {
      setIsSubmittingNewStu(false);
    }
  };

  const handleResetPassword = async (stu: UnifiedStudentUserRecord) => {
    await studentLifecycleService.resetStudentPasswordToDefault(
      stu.studentCode,
      stu.name,
      stu.classroom,
      currentUser?.name || 'ผู้ดูแลระบบ'
    );
    showToast(`✓ รีเซ็ตรหัสผ่านของ ${stu.name} กลับเป็นรหัสประจำตัว 5 หลัก (${stu.studentCode}) แล้ว`);
    await loadData();
  };

  const handleToggleAccountAccess = async (stu: UnifiedStudentUserRecord) => {
    if (!canEditLifecycle) return;
    const nextStatus = stu.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await studentLifecycleService.setStudentAccountAccess(
      stu.studentCode,
      stu.name,
      stu.classroom,
      nextStatus,
      currentUser?.name || 'ผู้ดูแลระบบ'
    );
    showToast(
      nextStatus === 'ACTIVE'
        ? `✓ เปิดสิทธิ์การเข้าสู่ระบบของ ${stu.name} (${stu.studentCode}) แล้ว`
        : `🔒 ระงับสิทธิ์การเข้าสู่ระบบของ ${stu.name} (${stu.studentCode}) แล้ว`
    );
    await loadData();
  };

  return (
    <div className="space-y-4 font-sans text-[#163A66]">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#163A66] text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 text-xs font-bold border border-blue-400/30">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Role Permission Banner */}
      <div
        className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          canEditLifecycle
            ? 'bg-[#EFF6FF] border-[#BFDBFE]'
            : 'bg-[#FFFBEB] border-[#FDE68A]'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              canEditLifecycle ? 'bg-[#3B82F6] text-white' : 'bg-amber-500 text-white'
            }`}
          >
            {canEditLifecycle ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold text-[#163A66]">
                {canEditLifecycle
                  ? 'สิทธิ์ผู้ดูแลระบบทะเบียนนักเรียน & จัดการ User นักเรียน (Full Lifecycle Control)'
                  : 'โหมดครูผู้สอน (ตรวจสอบสถานะทะเบียนนักเรียน & รีเซ็ตรหัสผ่าน)'}
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  canEditLifecycle
                    ? 'bg-white text-blue-700 border-blue-200'
                    : 'bg-white text-amber-800 border-amber-200'
                }`}
              >
                {activeRole === 'ACADEMIC_ADMIN'
                  ? 'แอดมินฝ่ายวิชาการ/นายทะเบียน'
                  : activeRole === 'STUDENT_AFFAIRS'
                    ? 'ฝ่ายกิจการนักเรียน'
                    : 'ครูผู้สอนทั่วไป'}
              </span>
            </div>
            <p className="text-[11px] text-[#6B7C93] mt-0.5">
              {canEditLifecycle
                ? 'สามารถดำเนินการย้ายเข้า, ย้ายห้อง, ย้ายออกต่างโรงเรียน, อนุมัติจบการศึกษา, ลาออก, พักการเรียน, จำหน่ายชื่อออก และเปิด/ระงับบัญชีล็อกอินของนักเรียนได้ครบวงจร'
                : 'ครูผู้สอนสามารถตรวจสอบสถานะการย้ายเข้า-ออก และช่วยรีเซ็ตรหัสผ่านให้นักเรียนได้ • การจำหน่ายชื่อออก/ย้ายออก/จบการศึกษา สงวนสิทธิ์เฉพาะแอดมินและนายทะเบียน'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="px-3 py-2 rounded-xl bg-white border border-[#E6EEF7] hover:border-[#BFDBFE] text-xs font-bold text-[#163A66] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer shrink-0 min-h-[40px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#3B82F6] ${isLoading ? 'animate-spin' : ''}`} />
          <span>ซิงค์ข้อมูลล่าสุด</span>
        </button>
      </div>

      {/* Summary KPI Cards (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          type="button"
          onClick={() => setSelectedStatus('ALL')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'ALL'
              ? 'bg-[#EFF6FF] border-[#3B82F6] shadow-2xs'
              : 'bg-white border-[#E6EEF7] hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#6B7C93]">ทั้งหมดในทะเบียน</span>
            <Users className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="text-lg font-extrabold text-[#163A66] mt-1">{kpiStats.total} คน</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('STUDYING')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'STUDYING'
              ? 'bg-[#ECFDF5] border-[#10B981] shadow-2xs'
              : 'bg-white border-[#E6EEF7] hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#065F46]">กำลังศึกษา</span>
            <UserCheck className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="text-lg font-extrabold text-[#065F46] mt-1">{kpiStats.studying} คน</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('TRANSFERRED_IN')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'TRANSFERRED_IN'
              ? 'bg-[#EFF6FF] border-[#3B82F6] shadow-2xs'
              : 'bg-white border-[#E6EEF7] hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700">ย้ายเข้า/ย้ายห้อง</span>
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-extrabold text-blue-800 mt-1">{kpiStats.transferredIn} คน</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('TRANSFERRED_OUT')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'TRANSFERRED_OUT'
              ? 'bg-[#FFFBEB] border-[#F59E0B] shadow-2xs'
              : 'bg-white border-[#E6EEF7] hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#92400E]">ย้ายออก</span>
            <Building2 className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-lg font-extrabold text-[#92400E] mt-1">{kpiStats.transferredOut} คน</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('GRADUATED')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'GRADUATED'
              ? 'bg-[#F5F3FF] border-[#8B5CF6] shadow-2xs'
              : 'bg-white border-[#E6EEF7] hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5B21B6]">จบการศึกษา</span>
            <GraduationCap className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="text-lg font-extrabold text-[#5B21B6] mt-1">{kpiStats.graduated} คน</div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('DISMISSED')}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStatus === 'DISMISSED' || selectedStatus === 'DROPPED_OUT' || selectedStatus === 'SUSPENDED'
              ? 'bg-[#FEF2F2] border-[#EF4444] shadow-2xs'
              : 'bg-white border-[#E6EEF7] hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#991B1B]">จำหน่าย/ลาออก/พัก</span>
            <UserX className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div className="text-lg font-extrabold text-[#991B1B] mt-1">{kpiStats.dismissedOrDropped} คน</div>
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#E6EEF7]">
        <button
          type="button"
          onClick={() => setSubTab('DIRECTORY')}
          className={`flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px] ${
            subTab === 'DIRECTORY'
              ? 'bg-[#3B82F6] text-white shadow-xs'
              : 'text-[#6B7C93] hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>ทะเบียนสถานะ & บัญชีนักเรียน ({filteredStudents.length})</span>
        </button>

        {canEditLifecycle && (
          <button
            type="button"
            onClick={() => setSubTab('TRANSFER_IN')}
            className={`flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px] ${
              subTab === 'TRANSFER_IN'
                ? 'bg-[#3B82F6] text-white shadow-xs'
                : 'text-[#6B7C93] hover:bg-slate-50'
            }`}
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>รับนักเรียนย้ายเข้าใหม่</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setSubTab('ROLLOVER_AND_LOGS')}
          className={`flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px] ${
            subTab === 'ROLLOVER_AND_LOGS'
              ? 'bg-[#3B82F6] text-white shadow-xs'
              : 'text-[#6B7C93] hover:bg-slate-50'
          }`}
        >
          <Rocket className="w-4 h-4 shrink-0" />
          <span>เลื่อนชั้นปลายปี / ศิษย์เก่า & ประวัติคำสั่ง</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: STUDENT LIFECYCLE & USER ACCOUNT DIRECTORY */}
      {/* ==================================================================== */}
      {subTab === 'DIRECTORY' && (
        <div className="space-y-3.5">
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-2xl border border-[#E6EEF7] p-3.5 flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัสประจำตัว 5 หลัก, ชื่อ-นามสกุล, ห้องเรียน หรือสาเหตุ..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-[#163A66] focus:outline-none focus:border-[#3B82F6] min-h-[42px]"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#163A66] cursor-pointer min-h-[42px]"
              >
                <option value="ALL">ทุกห้องเรียน ({availableRooms.length} ห้อง)</option>
                {availableRooms.map((r) => (
                  <option key={r} value={r}>
                    ห้อง {r}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | StudentLifecycleStatus)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#163A66] cursor-pointer min-h-[42px]"
              >
                <option value="ALL">ทุกสถานะทะเบียน</option>
                <option value="STUDYING">🟢 กำลังศึกษาปกติ</option>
                <option value="TRANSFERRED_IN">🔵 ย้ายเข้าใหม่ / ย้ายห้อง</option>
                <option value="TRANSFERRED_OUT">🟡 ย้ายออกต่างโรงเรียน</option>
                <option value="GRADUATED">🟣 จบการศึกษา (ศิษย์เก่า)</option>
                <option value="DROPPED_OUT">🟠 ลาออกตามคำร้อง</option>
                <option value="SUSPENDED">⏸️ พักการเรียนชั่วคราว</option>
                <option value="DISMISSED">🔴 จำหน่ายชื่อออก (พ้นสภาพ)</option>
                <option value="REPEATED">⚠️ ซ้ำชั้น / รอซ่อม ร-มส.</option>
              </select>
            </div>
          </div>

          {/* Desktop Table (hidden on mobile) */}
          <div className="hidden md:block bg-white rounded-2xl border border-[#E6EEF7] overflow-hidden shadow-2xs">
            <div className="max-h-[58vh] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-[#E6EEF7] sticky top-0 z-10">
                  <tr className="text-[11px] font-bold text-[#6B7C93]">
                    <th className="py-3 px-4">ข้อมูลนักเรียน (Identity)</th>
                    <th className="py-3 px-3">ห้อง / เลขที่</th>
                    <th className="py-3 px-3">สถานะทะเบียนนักเรียน</th>
                    <th className="py-3 px-3">สถานะบัญชี User</th>
                    <th className="py-3 px-4 text-right">การจัดการ (Primary Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-[#94A3B8] font-medium">
                        ไม่พบรายชื่อนักเรียนตามเงื่อนไขที่ค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.slice(0, 120).map((stu) => {
                      const statusCfg =
                        LIFECYCLE_STATUS_CONFIG[stu.lifecycleStatus] || LIFECYCLE_STATUS_CONFIG.STUDYING;
                      const isInactive = stu.accountStatus !== 'ACTIVE';

                      return (
                        <tr
                          key={`${stu.studentCode}_${stu.classroom}`}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isInactive ? 'bg-slate-50/40' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-[11px] border border-blue-200">
                                {stu.studentCode}
                              </span>
                              <div>
                                <div className="font-bold text-[#163A66]">{stu.name}</div>
                                {stu.documentOrderNo || stu.sourceOrTargetSchool ? (
                                  <div className="text-[10px] text-[#6B7C93] mt-0.5">
                                    {stu.documentOrderNo && `คำสั่ง/เอกสาร: ${stu.documentOrderNo} `}
                                    {stu.sourceOrTargetSchool && `• รร.: ${stu.sourceOrTargetSchool}`}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-bold text-[#163A66]">{formatClassroomLabel(stu.classroom)}</span>
                            <span className="text-[#6B7C93] ml-1.5 text-[11px]">เลขที่ {stu.seatNo}</span>
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder}`}
                            >
                              <span>{statusCfg.label}</span>
                            </span>
                            {stu.effectiveDate && (
                              <div className="text-[10px] text-[#94A3B8] mt-0.5">
                                มีผล: {stu.effectiveDate}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            {stu.accountStatus === 'ACTIVE' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                ใช้งานปกติ
                              </span>
                            ) : stu.accountStatus === 'REVOKED' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                ปิดบัญชีถาวร
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                ระงับการล็อกอิน
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                              {canEditLifecycle && (
                                <button
                                  type="button"
                                  onClick={() => openTransitionModal(stu)}
                                  className="px-2.5 py-1.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  จัดการสถานะ/ย้าย/จำหน่าย
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleResetPassword(stu)}
                                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-[#163A66] border border-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                title="รีเซ็ตรหัสผ่านกลับเป็นรหัสประจำตัวนักเรียน 5 หลัก"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                                <span>รีเซ็ต PIN</span>
                              </button>

                              {canEditLifecycle && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleAccountAccess(stu)}
                                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                                    stu.accountStatus === 'ACTIVE'
                                      ? 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                  }`}
                                  title={
                                    stu.accountStatus === 'ACTIVE'
                                      ? 'ระงับสิทธิ์การเข้าสู่ระบบของนักเรียน'
                                      : 'ปลดล็อกให้เข้าสู่ระบบได้อีกครั้ง'
                                  }
                                >
                                  {stu.accountStatus === 'ACTIVE' ? (
                                    <>
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>ระงับ</span>
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="w-3.5 h-3.5" />
                                      <span>ปลดล็อก</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Cards (md:hidden) — ป้องกันการเลื่อนแนวนอน 100% */}
          <div className="md:hidden space-y-2.5">
            {filteredStudents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#E6EEF7] p-6 text-center text-xs text-[#94A3B8] font-medium">
                ไม่พบรายชื่อนักเรียนตามเงื่อนไขที่ค้นหา
              </div>
            ) : (
              filteredStudents.slice(0, 60).map((stu) => {
                const statusCfg =
                  LIFECYCLE_STATUS_CONFIG[stu.lifecycleStatus] || LIFECYCLE_STATUS_CONFIG.STUDYING;
                return (
                  <div
                    key={`mob_${stu.studentCode}_${stu.classroom}`}
                    className="bg-white rounded-2xl border border-[#E6EEF7] p-3.5 space-y-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200">
                            {stu.studentCode}
                          </span>
                          <span className="text-xs font-bold text-[#6B7C93]">
                            {formatClassroomLabel(stu.classroom)} • เลขที่ {stu.seatNo}
                          </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-[#163A66] mt-1">{stu.name}</h4>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder}`}
                      >
                        {statusCfg.shortLabel}
                      </span>
                    </div>

                    {(stu.documentOrderNo || stu.sourceOrTargetSchool || stu.effectiveDate) && (
                      <div className="text-[11px] text-[#6B7C93] bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-0.5">
                        {stu.reasonLabel && <div>สาเหตุ: {stu.reasonLabel}</div>}
                        {stu.documentOrderNo && <div>เลขที่คำสั่ง/เอกสาร: {stu.documentOrderNo}</div>}
                        {stu.sourceOrTargetSchool && <div>สถานศึกษา: {stu.sourceOrTargetSchool}</div>}
                        {stu.effectiveDate && <div>วันที่มีผล: {stu.effectiveDate}</div>}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                      {canEditLifecycle && (
                        <button
                          type="button"
                          onClick={() => openTransitionModal(stu)}
                          className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-[#3B82F6] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                          <span>จัดการสถานะ / ย้าย / จำหน่าย</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleResetPassword(stu)}
                        className="min-h-[44px] px-3 py-2 rounded-xl bg-white border border-slate-200 text-[#163A66] text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4 text-blue-600" />
                        <span>รีเซ็ต PIN</span>
                      </button>
                      {canEditLifecycle && (
                        <button
                          type="button"
                          onClick={() => handleToggleAccountAccess(stu)}
                          className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                            stu.accountStatus === 'ACTIVE'
                              ? 'bg-white text-rose-600 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {stu.accountStatus === 'ACTIVE' ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: REGISTER NEW TRANSFER-IN STUDENT */}
      {/* ==================================================================== */}
      {subTab === 'TRANSFER_IN' && canEditLifecycle && (
        <form
          onSubmit={handleRegisterTransferInStudent}
          className="bg-white rounded-2xl border border-[#E6EEF7] p-4 sm:p-5 space-y-4 shadow-2xs"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#163A66]">
                รับนักเรียนย้ายเข้าใหม่กลางปีการศึกษา (New Transfer-In Registration)
              </h3>
              <p className="text-xs text-[#6B7C93]">
                สร้างบัญชีนักเรียนรหัส 5 หลัก จัดเข้าห้องเรียนตามลำดับเพศในใบรายชื่อ SGS และเปิดสิทธิ์ล็อกอินอัตโนมัติ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div>
              <label className="text-xs font-bold text-[#163A66] block mb-1">
                รหัสประจำตัวนักเรียน (5 หลัก) *
              </label>
              <input
                type="text"
                required
                value={newStuCode}
                onChange={(e) => setNewStuCode(e.target.value)}
                placeholder="เช่น 16025"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold font-mono focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#163A66] block mb-1">คำนำหน้า & เพศ *</label>
              <div className="flex gap-2">
                <select
                  value={newStuPrefix}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewStuPrefix(val);
                    if (val === 'ด.ช.' || val === 'นาย') setNewStuGender('MALE');
                    else setNewStuGender('FEMALE');
                  }}
                  className="flex-1 px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="ด.ช.">ด.ช.</option>
                  <option value="ด.ญ.">ด.ญ.</option>
                  <option value="นาย">นาย</option>
                  <option value="น.ส.">น.ส.</option>
                </select>
                <select
                  value={newStuGender}
                  onChange={(e) => setNewStuGender(e.target.value as 'MALE' | 'FEMALE')}
                  className="px-2.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="MALE">ชาย</option>
                  <option value="FEMALE">หญิง</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#163A66] block mb-1">ชื่อจริง *</label>
              <input
                type="text"
                required
                value={newStuFirstName}
                onChange={(e) => setNewStuFirstName(e.target.value)}
                placeholder="ชื่อจริงภาษาไทย"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#163A66] block mb-1">นามสกุล *</label>
              <input
                type="text"
                required
                value={newStuLastName}
                onChange={(e) => setNewStuLastName(e.target.value)}
                placeholder="นามสกุลภาษาไทย"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#3B82F6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs font-bold text-[#163A66] block mb-1">
                ห้องเรียนที่รับเข้าศึกษา *
              </label>
              <select
                value={newStuRoom}
                onChange={(e) => setNewStuRoom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                {availableRooms.map((r) => (
                  <option key={r} value={r}>
                    ห้อง {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#163A66] block mb-1">
                ย้ายมาจากโรงเรียนเดิม
              </label>
              <input
                type="text"
                value={newStuFromSchool}
                onChange={(e) => setNewStuFromSchool(e.target.value)}
                placeholder="ระบุชื่อโรงเรียนเดิม (ถ้ามี)"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#163A66] block mb-1">
                เลขที่หนังสือรับย้าย / ปพ.1
              </label>
              <input
                type="text"
                value={newStuDocNo}
                onChange={(e) => setNewStuDocNo(e.target.value)}
                placeholder="เช่น ศธ 04235/รับย้าย-2569"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#163A66] block mb-1">
              หมายเหตุการเทียบโอนคะแนน / ข้อมูลเพิ่มเติม
            </label>
            <input
              type="text"
              value={newStuRemarks}
              onChange={(e) => setNewStuRemarks(e.target.value)}
              placeholder="เช่น มีคะแนนเก็บเทียบโอนจากโรงเรียนเดิม หรือรับเข้ากลางภาคเรียนที่ 2"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSubTab('DIRECTORY')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#6B7C93] hover:bg-slate-50 cursor-pointer min-h-[44px]"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmittingNewStu}
              className="px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmittingNewStu ? 'กำลังบันทึก...' : 'ลงทะเบียนรับนักเรียนย้ายเข้า'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: YEAR-END PROMOTION WIZARD, ALUMNI & AUDIT LOGS */}
      {/* ==================================================================== */}
      {subTab === 'ROLLOVER_AND_LOGS' && (
        <div className="space-y-5">
          {canEditLifecycle && (
            <div className="bg-white rounded-2xl border border-[#E6EEF7] overflow-hidden shadow-2xs">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#163A66]">
                    ศูนย์ควบคุมการเลื่อนชั้นปลายปีการศึกษา & ทำเนียบศิษย์เก่า (Academic Rollover & Alumni)
                  </h3>
                  <p className="text-xs text-[#6B7C93]">
                    เลื่อนชั้นนักเรียนทั้งสายชั้น (ม.1–ม.6), อนุมัติจบการศึกษา ม.3/ม.6, ย้อนกลับ (Rollback) และดูระเบียนศิษย์เก่า
                  </p>
                </div>
              </div>
              <AcademicRolloverControlCenter
                classrooms={classroomOptionsForWizard}
                currentUserId={currentUser?.id || 'admin'}
              />
            </div>
          )}

          {/* Lifecycle Audit Trail */}
          <div className="bg-white rounded-2xl border border-[#E6EEF7] p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#3B82F6]" />
                <h3 className="text-sm font-extrabold text-[#163A66]">
                  บันทึกประวัติคำสั่งเปลี่ยนแปลงสถานะทะเบียนและบัญชีนักเรียน (Lifecycle Audit Trail)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-[#6B7C93]">
                ล่าสุด {auditLogs.length} รายการ
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#94A3B8]">
                ยังไม่มีประวัติการเปลี่ยนแปลงสถานะนักเรียนในเครื่องนี้
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#163A66]">{log.title}</div>
                      <div className="text-[11px] text-[#6B7C93] mt-0.5">{log.summary}</div>
                    </div>
                    <div className="text-right shrink-0 text-[11px] text-[#94A3B8]">
                      <div className="font-semibold text-[#6B7C93]">ผู้ดำเนินการ: {log.actor}</div>
                      <div>{log.formattedDate}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CHANGE STUDENT LIFECYCLE STATUS (ย้าย/จบ/ลาออก/พัก/จำหน่าย/คืนสภาพ) */}
      {/* ==================================================================== */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E6EEF7] shadow-2xl w-full max-w-xl overflow-hidden my-auto">
            <div className="p-4 sm:p-5 bg-[#F7FAFF] border-b border-[#E6EEF7] flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-mono font-bold text-xs">
                    {editingStudent.studentCode}
                  </span>
                  <h3 className="text-base font-extrabold text-[#163A66]">
                    {editingStudent.name}
                  </h3>
                </div>
                <p className="text-xs text-[#6B7C93] mt-1">
                  สังกัดปัจจุบัน: ห้อง {formatClassroomLabel(editingStudent.classroom)} (เลขที่ {editingStudent.seatNo})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-2 rounded-xl hover:bg-slate-200/60 text-[#6B7C93] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransition} className="p-4 sm:p-5 space-y-4">
              {/* 1. เลือกประเภทสถานะทะเบียนนักเรียน */}
              <div>
                <label className="text-xs font-bold text-[#163A66] block mb-2">
                  1. เลือกการดำเนินการทางทะเบียนนักเรียน *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      'STUDYING',
                      'TRANSFERRED_IN',
                      'TRANSFERRED_OUT',
                      'GRADUATED',
                      'DROPPED_OUT',
                      'SUSPENDED',
                      'DISMISSED',
                      'REPEATED',
                    ] as StudentLifecycleStatus[]
                  ).map((stKey) => {
                    const cfg = LIFECYCLE_STATUS_CONFIG[stKey];
                    const isSelected = modalStatus === stKey;
                    return (
                      <button
                        key={stKey}
                        type="button"
                        onClick={() => handleStatusChangeInModal(stKey)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#EFF6FF] border-[#3B82F6] ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-blue-200'
                        }`}
                      >
                        <div className="text-xs font-extrabold text-[#163A66]">{cfg.shortLabel}</div>
                        <div className="text-[10px] text-[#6B7C93] truncate mt-0.5">
                          {cfg.defaultAccountStatus === 'ACTIVE' ? '🟢 บัญชีปกติ' : '🔒 ระงับบัญชี'}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[#6B7C93] mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  ℹ️ {LIFECYCLE_STATUS_CONFIG[modalStatus]?.description}
                </p>
              </div>

              {/* 2. สาเหตุย่อยตามระเบียบทะเบียนนักเรียน */}
              <div>
                <label className="text-xs font-bold text-[#163A66] block mb-1">
                  2. สาเหตุ / รายละเอียดตามระเบียบงานทะเบียน *
                </label>
                <select
                  value={modalReasonCode}
                  onChange={(e) => setModalReasonCode(e.target.value as StudentLifecycleReasonCode)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#163A66] bg-white"
                >
                  {LIFECYCLE_REASON_OPTIONS.filter((r) => r.forStatuses.includes(modalStatus)).map(
                    (opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* 3. ฟิลด์เฉพาะตามสถานะ */}
              {(modalStatus === 'TRANSFERRED_IN' || modalStatus === 'STUDYING') && (
                <div>
                  <label className="text-xs font-bold text-[#163A66] block mb-1">
                    ห้องเรียนสังกัด (กรณีต้องการย้ายห้องเรียนภายใน หรือคืนสภาพเข้าห้องเรียน)
                  </label>
                  <select
                    value={modalTargetRoom}
                    onChange={(e) => setModalTargetRoom(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    {availableRooms.map((r) => (
                      <option key={r} value={r}>
                        ห้อง {r} {r === formatClassroomLabel(editingStudent.classroom) ? '(ห้องปัจจุบัน)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(modalStatus === 'TRANSFERRED_OUT' || modalStatus === 'TRANSFERRED_IN') && (
                <div>
                  <label className="text-xs font-bold text-[#163A66] block mb-1">
                    {modalStatus === 'TRANSFERRED_OUT'
                      ? 'ชื่อสถานศึกษาปลายทางที่ย้ายไป *'
                      : 'ชื่อสถานศึกษาเดิม (กรณีรับย้ายเข้า)'}
                  </label>
                  <input
                    type="text"
                    required={modalStatus === 'TRANSFERRED_OUT'}
                    value={modalSchoolName}
                    onChange={(e) => setModalSchoolName(e.target.value)}
                    placeholder="เช่น โรงเรียนอุดรพิทยานุกูล จ.อุดรธานี"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
              )}

              {modalStatus === 'GRADUATED' && (
                <div>
                  <label className="text-xs font-bold text-[#163A66] block mb-1">
                    ปีการศึกษาที่สำเร็จการศึกษา (พ.ศ.) *
                  </label>
                  <input
                    type="number"
                    required
                    value={modalGradYear}
                    onChange={(e) => setModalGradYear(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#163A66] block mb-1">
                    เลขที่คำสั่งโรงเรียน / เลขที่หนังสือ ปพ.1
                  </label>
                  <input
                    type="text"
                    value={modalDocOrderNo}
                    onChange={(e) => setModalDocOrderNo(e.target.value)}
                    placeholder="เช่น คำสั่ง รร. ที่ 142/2569"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#163A66] block mb-1">
                    วันที่อนุมัติ / วันที่มีผล *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalEffectiveDate}
                    onChange={(e) => setModalEffectiveDate(e.target.value)}
                    placeholder="เช่น 26 ต.ค. 2569"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              {modalStatus === 'SUSPENDED' && (
                <div>
                  <label className="text-xs font-bold text-[#163A66] block mb-1">
                    กำหนดวันกลับเข้าศึกษาต่อ (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={modalReturnDate}
                    onChange={(e) => setModalReturnDate(e.target.value)}
                    placeholder="เช่น 1 พ.ย. 2569 (เปิดภาคเรียนที่ 2)"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[#163A66] block mb-1">
                  หมายเหตุเพิ่มเติม (บันทึกในระเบียนสะสมและ Audit Log)
                </label>
                <input
                  type="text"
                  value={modalRemarks}
                  onChange={(e) => setModalRemarks(e.target.value)}
                  placeholder="ระบุรายละเอียดเพิ่มเติม..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#6B7C93] hover:bg-slate-50 cursor-pointer min-h-[44px]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingModal}
                  className="px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 min-h-[44px]"
                >
                  {isSubmittingModal ? 'กำลังบันทึก...' : '💾 ยืนยันการเปลี่ยนสถานะนักเรียน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
