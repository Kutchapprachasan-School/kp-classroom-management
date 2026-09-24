import React, { useState } from 'react';
import { Bookmark, Plus, X, MessageSquare } from 'lucide-react';

interface NoteItem {
  id: string;
  date: string;
  text: string;
  author: string;
}

export const StudentNotesCard: React.FC = () => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      date: new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      text: newNoteText.trim(),
      author: 'ครูภาสภูมิ',
    };

    setNotes([newNote, ...notes]);
    setNewNoteText('');
    setIsAdding(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-slate-800 text-[14px]">
            ข้อมูลพิเศษ / สาเหตุที่ควรรู้
          </h2>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{isAdding ? 'ยกเลิก' : '+ เพิ่มบันทึก'}</span>
        </button>
      </div>

      {/* Adding Note Inline Form */}
      {isAdding && (
        <form onSubmit={handleAddNote} className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 animate-fade-in">
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            บันทึกบริบทเชิงคุณภาพ (เช่น สุขภาพ, ความจำเป็นทางบ้าน, ปัญหาการเดินทาง)
          </label>
          <textarea
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            placeholder="พิมพ์รายละเอียดที่ต้องการบันทึก..."
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 bg-white min-h-[70px]"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-200/60 rounded-md"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700"
            >
              บันทึกข้อมูล
            </button>
          </div>
        </form>
      )}

      {/* Note List or Empty state */}
      {notes.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          <p>
            ยังไม่มีบันทึก — ใช้เก็บสาเหตุที่อยู่เบื้องหลังพฤติกรรมหรือผลการเรียน เช่น
            ปัญหาที่บ้าน สุขภาพ การเดินทาง เพื่อให้ครูคนอื่นและที่ประชุมเห็นภาพเดียวกัน
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span className="flex items-center gap-1 font-medium text-amber-900">
                  <MessageSquare className="w-3 h-3 text-amber-600" />
                  {note.author}
                </span>
                <span>{note.date}</span>
              </div>
              <p className="text-slate-700 leading-relaxed">{note.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
