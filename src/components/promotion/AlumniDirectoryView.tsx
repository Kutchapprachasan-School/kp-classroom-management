// src/components/promotion/AlumniDirectoryView.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  studentEnrollmentService,
  type AlumniStudentSummary,
  type TermTranscript,
} from '../../services/studentEnrollmentService';
import {
  GraduationCap,
  Search,
  FileText,
  X,
  Award,
  BookOpen,
} from 'lucide-react';

export const AlumniDirectoryView: React.FC = () => {
  const [alumniList, setAlumniList] = useState<AlumniStudentSummary[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // สถานะสำหรับเปิดดู Transcript รายบุคคล
  const [selectedStudent, setSelectedStudent] = useState<AlumniStudentSummary | null>(null);
  const [transcripts, setTranscripts] = useState<TermTranscript[]>([]);
  const [isTranscriptLoading, setIsTranscriptLoading] = useState<boolean>(false);

  const loadAlumni = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await studentEnrollmentService.getAlumniDirectory({
        graduatedYear: selectedYear ? Number(selectedYear) : undefined,
        searchQuery,
      });
      setAlumniList(data);
    } catch (err) {
      console.error('ไม่สามารถดึงข้อมูลทำเนียบศิษย์เก่าได้:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, searchQuery]);

  useEffect(() => {
    void loadAlumni();
  }, [loadAlumni]);

  const handleOpenTranscript = async (student: AlumniStudentSummary) => {
    setSelectedStudent(student);
    setIsTranscriptLoading(true);
    try {
      const history = await studentEnrollmentService.getStudentFullTranscript(student.id);
      setTranscripts(history);
    } catch (err) {
      console.error('ไม่สามารถดึงใบแสดงผลการเรียนได้:', err);
      setTranscripts([]);
    } finally {
      setIsTranscriptLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* แถบค้นหาและตัวกรองรุ่นปีการศึกษา */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-50 via-pink-50 to-sky-50 border border-purple-100 p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-[#163A66]">
              ทำเนียบศิษย์เก่า & ประวัติผลการเรียนถาวร
            </h2>
            <p className="text-xs text-[#6B7C93]">
              ข้อมูลนักเรียนที่สำเร็จการศึกษา (ม.3 / ม.6) พร้อมประวัติคะแนนและเกรดเฉลี่ยย้อนหลังทุกภาคเรียน
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือรหัสนักเรียน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-purple-200 bg-white text-xs md:text-sm text-[#163A66] focus:outline-none focus:ring-2 focus:ring-purple-400 min-w-[200px]"
            />
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-xs md:text-sm text-[#163A66] focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="">ทุกรุ่นปีการศึกษา</option>
            <option value="2569">รุ่นปีการศึกษา 2569</option>
            <option value="2568">รุ่นปีการศึกษา 2568</option>
            <option value="2567">รุ่นปีการศึกษา 2567</option>
          </select>
        </div>
      </div>

      {/* ตารางรายชื่อศิษย์เก่า */}
      <div className="rounded-2xl border border-[#E6EEF7] bg-white overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-[#6B7C93] flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span>กำลังโหลดข้อมูลทำเนียบศิษย์เก่า...</span>
          </div>
        ) : alumniList.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#94A3B8] flex flex-col items-center gap-2">
            <BookOpen className="w-10 h-10 text-slate-300" />
            <span>ไม่พบรายชื่อศิษย์เก่าตามเงื่อนไขที่ระบุ (Zero Mock Data)</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F7FAFF] text-[#163A66] border-b border-[#E6EEF7]">
                <tr>
                  <th className="p-3.5 text-left font-semibold">รหัสนักเรียน</th>
                  <th className="p-3.5 text-left font-semibold">ชื่อ-นามสกุล</th>
                  <th className="p-3.5 text-center font-semibold">ปีการศึกษาที่จบ</th>
                  <th className="p-3.5 text-center font-semibold">สถานะ</th>
                  <th className="p-3.5 text-right font-semibold">ใบแสดงผลการเรียน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EEF7]">
                {alumniList.map((alumni) => (
                  <tr key={alumni.id} className="hover:bg-purple-50/20 transition-colors">
                    <td className="p-3.5 font-mono text-xs text-slate-600">
                      {alumni.student_code || alumni.id}
                    </td>
                    <td className="p-3.5 font-semibold text-[#163A66]">
                      {alumni.prefix ?? ''}
                      {alumni.first_name ?? ''} {alumni.last_name ?? ''}
                    </td>
                    <td className="p-3.5 text-center font-medium text-purple-700">
                      {alumni.graduated_academic_year ?? '-'}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        สำเร็จการศึกษา
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => void handleOpenTranscript(alumni)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-1.5 text-xs font-bold text-purple-800 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        <span>ดูผลการเรียนย้อนหลัง</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ลิ้นชัก (Modal Drawer) แสดง Transcript ย้อนหลังทุกภาคเรียน */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-purple-100 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-4 flex items-center justify-between border-b border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white border border-purple-200 flex items-center justify-center text-purple-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#163A66] text-base">
                    ใบแสดงผลการเรียนสะสม (Academic Transcript)
                  </h3>
                  <p className="text-xs text-[#6B7C93]">
                    {selectedStudent.prefix ?? ''}
                    {selectedStudent.first_name ?? ''} {selectedStudent.last_name ?? ''} (รหัส:{' '}
                    {selectedStudent.student_code || selectedStudent.id})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-full bg-white/80 hover:bg-white p-2 text-slate-600 shadow-sm transition-colors"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {isTranscriptLoading ? (
                <div className="text-center py-12 text-sm text-[#6B7C93] flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังรวบรวมคะแนนและคำนวณผลการเรียนย้อนหลัง...</span>
                </div>
              ) : transcripts.length === 0 ? (
                <div className="text-center py-12 text-sm text-[#94A3B8]">
                  ไม่พบประวัติการลงทะเบียนเรียนในระบบ
                </div>
              ) : (
                transcripts.map((term) => (
                  <div
                    key={term.enrollmentId}
                    className="rounded-2xl border border-[#E6EEF7] overflow-hidden shadow-xs"
                  >
                    <div className="bg-[#F7FAFF] px-4 py-3 border-b border-[#E6EEF7] flex items-center justify-between">
                      <div className="text-sm font-bold text-[#163A66]">
                        ปีการศึกษา {term.academicYear} / ภาคเรียนที่ {term.semester}{' '}
                        <span className="text-xs font-normal text-[#6B7C93]">
                          (ห้อง {term.classroomId} {term.gradeLevel ? `• ${term.gradeLevel}` : ''})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-extrabold text-purple-800">
                          GPA: {term.termGpa.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {term.courses.length === 0 ? (
                      <div className="p-4 text-xs text-slate-400">ไม่มีรายการคะแนนรายวิชาในภาคเรียนนี้</div>
                    ) : (
                      <table className="min-w-full text-xs">
                        <thead className="bg-white text-slate-500 border-b border-slate-100">
                          <tr>
                            <th className="p-2.5 text-left font-semibold">รหัสวิชา</th>
                            <th className="p-2.5 text-center font-semibold">คะแนนรวม (%)</th>
                            <th className="p-2.5 text-center font-semibold">ผลการเรียน</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {term.courses.map((course) => (
                            <tr key={course.courseId} className="hover:bg-slate-50/50">
                              <td className="p-2.5 font-medium text-slate-700">{course.courseId}</td>
                              <td className="p-2.5 text-center text-slate-600">{course.totalScore}</td>
                              <td className="p-2.5 text-center font-bold text-blue-600">{course.grade}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
