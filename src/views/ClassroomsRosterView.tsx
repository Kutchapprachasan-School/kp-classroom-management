import React, { useState, useEffect } from 'react';
import {
  School,
  Upload,
  Plus,
  Search,
  ArrowRight,
  UserCheck,
  AlertCircle,
  FileSpreadsheet,
  Trash2,
  X,
} from 'lucide-react';
import { classroomService } from '../services/classroomService';
import { studentService, type StudentRecord } from '../services/studentService';
import { trashService } from '../services/trashService';
import type { ClassroomRosterItem, AtRiskStudent } from '../types/viewModels';

interface ClassroomsRosterViewProps {
  onSelectStudent: (student: AtRiskStudent) => void;
  onSelectClassroom: (classroomId: string) => void;
}

export const ClassroomsRosterView: React.FC<ClassroomsRosterViewProps> = ({
  onSelectStudent,
  onSelectClassroom,
}) => {
  const [classrooms, setClassrooms] = useState<ClassroomRosterItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassroomRosterItem | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddClassroomOpen, setIsAddClassroomOpen] = useState(false);

  // Add student form state
  const [newStudentNo, setNewStudentNo] = useState<number>(27);
  const [newStudentCode, setNewStudentCode] = useState('');
  const [newStudentName, setNewStudentName] = useState('');

  // Add classroom form state
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('ม.3');
  const [newSubjectCode, setNewSubjectCode] = useState('ศ23101');
  const [newSubjectName, setNewSubjectName] = useState('ศิลปะ');
  const [newAdviser, setNewAdviser] = useState('ครูภาสภูมิ เรืองปราชญ์');

  // Load classrooms on mount
  const loadClassrooms = async () => {
    setIsLoading(true);
    try {
      const cls = await classroomService.getAll();
      setClassrooms(cls);
      if (cls.length > 0 && !selectedClass) {
        setSelectedClass(cls[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  // Load students when selected classroom changes
  useEffect(() => {
    if (selectedClass) {
      studentService.getByClassroom(selectedClass.id).then((stuList) => {
        setStudents(stuList);
        setNewStudentNo(stuList.length + 1);
      });
    }
  }, [selectedClass]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    if (!newStudentName || !newStudentCode) {
      alert('กรุณากรอกรหัสนักเรียนและชื่อ-นามสกุลให้ครบถ้วน');
      return;
    }

    try {
      await studentService.create(selectedClass.id, {
        studentNo: Number(newStudentNo),
        studentCode: newStudentCode,
        name: newStudentName,
        status: 'NORMAL',
      });
      const updated = await studentService.getByClassroom(selectedClass.id);
      setStudents(updated);
      setIsAddStudentOpen(false);
      setNewStudentCode('');
      setNewStudentName('');
      alert(`เพิ่มนักเรียน "${newStudentName}" ในห้อง ${selectedClass.name} เรียบร้อยแล้ว`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเพิ่มนักเรียน';
      alert(errorMsg);
    }
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) {
      alert('กรุณาระบุชื่อชั้นเรียน เช่น ม.3/5');
      return;
    }

    try {
      const created = await classroomService.create({
        name: newClassName,
        level: newClassLevel,
        subjectCode: newSubjectCode,
        subjectName: newSubjectName,
        adviser: newAdviser,
        termId: 'term-1-2569',
      });
      await loadClassrooms();
      setSelectedClass(created);
      setIsAddClassroomOpen(false);
      setNewClassName('');
      alert(`เพิ่มห้องเรียน "${created.name}" เรียบร้อยแล้ว`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างห้องเรียน';
      alert(errorMsg);
    }
  };

  const handleDeleteStudent = async (stu: StudentRecord) => {
    if (!selectedClass) return;
    if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${stu.name}" ออกจากห้องเรียน? รายการจะถูกย้ายไปที่ถังขยะและกู้คืนได้ภายใน 30 วัน`)) {
      await studentService.delete(selectedClass.id, stu.id);
      await trashService.moveToTrash(stu.id, 'นักเรียน', stu.name);
      const updated = await studentService.getByClassroom(selectedClass.id);
      setStudents(updated);
      alert(`ย้าย "${stu.name}" ไปยังถังขยะเรียบร้อยแล้ว`);
    }
  };

  const handleBatchImport = async () => {
    if (!selectedClass) return;
    // Simulate importing 3 students from SGS format
    const batch = [
      { no: 27, code: '45127', name: 'ด.ช. พัทธดนย์ ศรีวิชัย', attendance: '8/8', score: 80, status: 'NORMAL' as const },
      { no: 28, code: '45128', name: 'ด.ญ. กานต์พิชชา ใจมั่น', attendance: '8/8', score: 85, status: 'NORMAL' as const },
      { no: 29, code: '45129', name: 'ด.ญ. ธัญญาภรณ์ แก้วอินทร์', attendance: '8/8', score: 90, status: 'NORMAL' as const },
    ];
    await studentService.batchImport(selectedClass.id, batch);
    const updated = await studentService.getByClassroom(selectedClass.id);
    setStudents(updated);
    setIsImportModalOpen(false);
    alert(`นำเข้าบัญชีรายชื่อนักเรียนจาก SGS Excel สำเร็จ จำนวน ${batch.length} คน!`);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.includes(searchTerm) ||
      s.no.toString() === searchTerm
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans text-slate-800 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                ห้องเรียน / นักเรียน (Classrooms & Roster)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                จัดการบัญชีรายชื่อนักเรียน นำเข้าไฟล์จาก Excel/SGS และวิเคราะห์พัฒนาการรายบุคคล
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsAddClassroomOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ สร้างห้องเรียนใหม่</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>นำเข้ารายชื่อ Excel/SGS</span>
          </button>
          <button
            onClick={() => setIsAddStudentOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มนักเรียน</span>
          </button>
        </div>
      </div>

      {/* Classroom Selector Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {classrooms.map((cls) => {
          const isSelected = selectedClass?.id === cls.id;
          return (
            <div
              key={cls.id}
              onClick={() => setSelectedClass(cls)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-300 shadow-sm'
                  : 'bg-white border-slate-100 shadow-card hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-blue-700">{cls.roomNumber}</span>
                <span className="text-[11px] text-slate-400">{cls.studentCount || students.length} คน</span>
              </div>
              <div className="text-xs font-semibold text-slate-800">{cls.name}</div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">ครูประจำชั้น: {cls.adviser}</div>
            </div>
          );
        })}
      </div>

      {/* Student Roster Table Card */}
      {selectedClass && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                บัญชีรายชื่อนักเรียน: {selectedClass.name}
              </h2>
              <p className="text-xs text-slate-400">
                รวม {students.length} คน • คลิกที่ชื่อนักเรียนเพื่อดู Radar Chart 5 มิติ
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ เลขที่ หรือรหัส..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => onSelectClassroom(selectedClass.id)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors"
              >
                เปิดห้องเรียนนี้ →
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">เลขที่</th>
                  <th className="py-2.5 px-3">รหัสนักเรียน</th>
                  <th className="py-2.5 px-3">ชื่อ-นามสกุล</th>
                  <th className="py-2.5 px-3">การเข้าเรียน</th>
                  <th className="py-2.5 px-3">คะแนนรวม</th>
                  <th className="py-2.5 px-3">สถานะ</th>
                  <th className="py-2.5 px-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">กำลังโหลดข้อมูล...</td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">ไม่พบรายชื่อนักเรียน</td>
                  </tr>
                ) : (
                  filteredStudents.map((stu) => (
                    <tr
                      key={stu.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-3 font-semibold text-slate-600">{stu.no}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{stu.code}</td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() =>
                            onSelectStudent({
                              enrollmentId: stu.id,
                              studentNo: stu.no,
                              name: stu.name,
                              tags:
                                stu.status === 'AT_RISK'
                                  ? [{ text: 'คะแนนต่ำกว่าครึ่ง', type: 'danger' }]
                                  : [],
                              attendanceRatio: stu.attendance,
                              totalScore: stu.score,
                            })
                          }
                          className="font-bold text-slate-800 hover:text-blue-600 transition-colors text-left"
                        >
                          {stu.name}
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <span className="flex items-center gap-1 text-slate-600">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{stu.attendance}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-blue-700">{stu.score}</td>
                      <td className="py-3 px-3">
                        {stu.status === 'AT_RISK' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-md font-semibold text-[11px]">
                            <AlertCircle className="w-3 h-3" />
                            <span>กลุ่มเสี่ยง</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-semibold text-[11px]">
                            ปกติ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              onSelectStudent({
                                enrollmentId: stu.id,
                                studentNo: stu.no,
                                name: stu.name,
                                tags:
                                  stu.status === 'AT_RISK'
                                    ? [{ text: 'คะแนนต่ำกว่าครึ่ง', type: 'danger' }]
                                    : [],
                                attendanceRatio: stu.attendance,
                                totalScore: stu.score,
                              })
                            }
                            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                          >
                            <span>โปรไฟล์</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(stu)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="ย้ายไปถังขยะ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Single Student */}
      {isAddStudentOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleCreateStudent} className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">เพิ่มนักเรียนในห้อง {selectedClass.name}</h3>
              <button
                type="button"
                onClick={() => setIsAddStudentOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">เลขที่</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newStudentNo}
                  onChange={(e) => setNewStudentNo(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">รหัสประจำตัวนักเรียน</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 45127"
                  value={newStudentCode}
                  onChange={(e) => setNewStudentCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อ - นามสกุล</label>
                <input
                  type="text"
                  required
                  placeholder="ด.ช. / ด.ญ. ชื่อ สกุล"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddStudentOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                บันทึกนักเรียน
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add New Classroom */}
      {isAddClassroomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleCreateClassroom} className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">สร้างห้องเรียนใหม่</h3>
              <button
                type="button"
                onClick={() => setIsAddClassroomOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อห้องเรียน</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น มัธยมศึกษาปีที่ 3/5 หรือ ม.3/5"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ระดับชั้น</label>
                  <select
                    value={newClassLevel}
                    onChange={(e) => setNewClassLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none bg-white"
                  >
                    <option value="ม.1">ม.1</option>
                    <option value="ม.2">ม.2</option>
                    <option value="ม.3">ม.3</option>
                    <option value="ม.4">ม.4</option>
                    <option value="ม.5">ม.5</option>
                    <option value="ม.6">ม.6</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">รหัสวิชา</label>
                  <input
                    type="text"
                    required
                    value={newSubjectCode}
                    onChange={(e) => setNewSubjectCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ชื่อวิชา</label>
                <input
                  type="text"
                  required
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ครูประจำชั้น / ที่ปรึกษา</label>
                <input
                  type="text"
                  value={newAdviser}
                  onChange={(e) => setNewAdviser(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddClassroomOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                บันทึกห้องเรียน
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Import Excel / SGS */}
      {isImportModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>นำเข้ารายชื่อนักเรียนจาก Excel / SGS ({selectedClass.name})</span>
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              onClick={handleBatchImport}
              className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50/50 hover:bg-blue-50/30 transition-colors cursor-pointer"
            >
              <Upload className="w-8 h-8 text-blue-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">ลากไฟล์ Excel (.xlsx, .csv) มาวางที่นี่ (คลิกเพื่อทดสอบ)</p>
              <p className="text-[11px] text-slate-400">รองรับโครงสร้างคอลัมน์ระบบ SGS สพฐ. (เลขที่, รหัสนักเรียน, คำนำหน้า, ชื่อ, นามสกุล)</p>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
              💡 ระบบจะทำการตรวจสอบรหัสนักเรียนซ้ำในโรงเรียน และป้องกันการบันทึกข้ามห้องด้วย Composite Key อัตโนมัติ
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleBatchImport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                เริ่มการนำเข้า (3 รายการทดสอบ)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
