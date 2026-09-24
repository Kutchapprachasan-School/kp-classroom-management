import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Calendar,
  Sparkles,
  Search,
  ExternalLink,
} from 'lucide-react';
import { teacherAssignmentsData } from '../data/mockData';
import type { TeacherAssignment } from '../types/viewModels';

export const AssignmentManagementView: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'GRADED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsg, setSelectedAsg] = useState<TeacherAssignment | null>(null);

  const filtered = teacherAssignmentsData.filter((item) => {
    const matchesFilter = filter === 'ALL' || item.status === filter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                จัดการงาน / การบ้าน (Assignments)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                มอบหมายงาน ตรวจผลงาน มอบแต้ม XP และติดตามสถานะการส่งงานรายห้อง
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => alert('เปิดฟอร์มสร้างและมอบหมายงานใหม่')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ มอบหมายงานใหม่</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-card">
        <div className="flex items-center gap-1 text-xs w-full sm:w-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            ทั้งหมด ({teacherAssignmentsData.length})
          </button>
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              filter === 'ACTIVE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            กำลังเปิดรับส่ง
          </button>
          <button
            onClick={() => setFilter('GRADED')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
              filter === 'GRADED'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            ตรวจเสร็จแล้ว
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่องานหรือวิชา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Assignment List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((asg) => {
          const submissionPercent = Math.round(
            (asg.submittedCount / asg.totalStudents) * 100
          );
          const gradedPercent = Math.round(
            (asg.gradedCount / asg.submittedCount) * 100
          );

          return (
            <div
              key={asg.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                    {asg.subjectCode} • {asg.roomName}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                    +{asg.xpReward} XP
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                  {asg.title}
                </h3>

                <div className="text-xs text-slate-400 space-y-1">
                  <div>หน่วย SGS: {asg.sgsUnit} • เต็ม {asg.maxScore} คะแนน</div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>ครบกำหนด: {asg.dueDate}</span>
                  </div>
                </div>
              </div>

              {/* Progress: Submission & Grading */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <div className="flex justify-between text-slate-500 mb-1">
                    <span>ส่งแล้ว</span>
                    <span className="font-medium text-slate-700">
                      {asg.submittedCount} / {asg.totalStudents} คน ({submissionPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${submissionPercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-500 mb-1">
                    <span>ตรวจแล้ว</span>
                    <span className="font-medium text-slate-700">
                      {asg.gradedCount} / {asg.submittedCount} คน ({gradedPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full"
                      style={{ width: `${gradedPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedAsg(asg)}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition-colors text-center"
                >
                  เปิดหน้ารับตรวจผลงาน (Grading Canvas)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grading Canvas Modal */}
      {selectedAsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  ห้องตรวจผลงาน (Grading Canvas): {selectedAsg.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedAsg.subjectCode} • {selectedAsg.roomName} • เต็ม {selectedAsg.maxScore} คะแนน • รางวัล +{selectedAsg.xpReward} XP
                </p>
              </div>
              <button
                onClick={() => setSelectedAsg(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 text-xs font-semibold"
              >
                ✕ ปิด
              </button>
            </div>

            {/* Split Screen Grading Demo */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left 7 cols: Submission File Preview */}
              <div className="md:col-span-7 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>ผู้ส่ง: ด.ช. จิรายุ เดชปันคำ (เลขที่ 1)</span>
                  <span className="text-emerald-700">ส่งตรงเวลา</span>
                </div>
                <div className="h-64 bg-slate-800 text-white rounded-xl flex flex-col items-center justify-center text-center p-4">
                  <ExternalLink className="w-8 h-8 text-blue-400 mb-2" />
                  <p className="font-semibold text-xs">คลิปวิดีโอ: วงดนตรีไทยสมัยอยุธยา.mp4</p>
                  <p className="text-[11px] text-slate-400 mt-1">ขนาด 24 MB • ส่งเมื่อ 22 ก.ย. 2569</p>
                </div>
              </div>

              {/* Right 5 cols: Grading Controls */}
              <div className="md:col-span-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    คะแนนที่ให้ (เต็ม {selectedAsg.maxScore})
                  </label>
                  <input
                    type="number"
                    defaultValue={10}
                    max={selectedAsg.maxScore}
                    min={0}
                    className="w-full text-center text-lg font-bold py-2 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="exemptCheck"
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <label htmlFor="exemptCheck" className="text-xs text-slate-600 cursor-pointer">
                    ยกเว้นคะแนนให้นักเรียนคนนี้ (isExempt)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ข้อเสนอแนะและ Feedback
                  </label>
                  <textarea
                    rows={3}
                    defaultValue="เนื้อหาค้นคว้าได้ละเอียด มีภาพประกอบสวยงาม ออกเสียงชื่อเครื่องดนตรีได้ถูกต้องมากครับ"
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>เมื่อกดบันทึก ระบบจะลงบัญชี XpLedger +{selectedAsg.xpReward} XP ให้สัตว์เลี้ยงทันที</span>
                </div>

                <button
                  onClick={() => {
                    alert('ตรวจและให้คะแนนสำเร็จ! แต้ม XP ถูกส่งไปยังโมจิคู่หูของนักเรียนเรียบร้อย');
                    setSelectedAsg(null);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  บันทึกผลการตรวจและมอบ XP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
