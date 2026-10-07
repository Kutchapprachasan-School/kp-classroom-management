import React, { useState } from 'react';
import {
  Bot,
  Send,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { getSchoolSettings } from '../../config/schoolRoles';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  summaryCard?: {
    title: string;
    items: string[];
    actionLabel?: string;
  };
}

export const AdminAiCopilotWidget: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'user',
      text: 'สรุปภาพรวมการเข้าเรียนของนักเรียนเดือนนี้หน่อยครับ',
    },
    {
      id: 'm2',
      sender: 'ai',
      summaryCard: {
        title: 'สรุปภาพรวมการเข้าเรียน เดือนสิงหาคม 2568',
        items: [
          'อัตราการมาเรียนเฉลี่ย 95.6% (↑ 2.3% จากเดือนก่อน)',
          'นักเรียนขาดเรียน 42 คน (3.4%)',
          'นักเรียนลา 18 คน (1.4%)',
          'นักเรียนที่ต้องติดตามพิเศษ 6 คน',
        ],
        actionLabel: 'ดูรายละเอียดรายงาน',
      },
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || inputQuestion).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setIsTyping(true);

    setTimeout(() => {
      let aiResponse: ChatMessage;

      if (q.includes('ผลการเรียน') || q.includes('เกรด') || q.includes('วิชาการ')) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          summaryCard: {
            title: 'สรุปผลสัมฤทธิ์ทางการเรียนทุกระดับชั้น',
            items: [
              'เกรดเฉลี่ยรวมทุกสายชั้นอยู่ที่ 3.52 (เพิ่มขึ้น 0.18)',
              'กลุ่มสาระสุขศึกษาได้คะแนนสูงสุด 95.2%',
              'กลุ่มสาระวิทยาศาสตร์และคณิตศาสตร์พัฒนาขึ้น 4.2%',
              'นักเรียนได้เกรด 4.00 คิดเป็น 26% (324 คน)',
            ],
            actionLabel: 'เปิดดูรายงานวิชาการ SGS',
          },
        };
      } else if (q.includes('งบประมาณ') || q.includes('การเงิน') || q.includes('พัสดุ')) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          summaryCard: {
            title: 'สรุปสถานะการเงิน & งบประมาณ ปี 2568',
            items: [
              'รายรับรวม 8,450,000 บาท (+12% จากปีก่อน)',
              'รายจ่ายรวม 5,320,000 บาท (+8% จากปีก่อน)',
              'เบิกจ่ายงบสำเร็จ 126 รายการ คงเหลือ 3,130,000 บาท',
              'โครงการจัดซื้อจัดจ้าง 8 รายการ รอส่งมอบ 5 รายการ',
            ],
            actionLabel: 'ดูสมุดบัญชีงบประมาณ',
          },
        };
      } else {
        aiResponse = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          summaryCard: {
            title: 'วิเคราะห์ข้อมูลตามคำสั่งของผู้บริหาร',
            items: [
              `${getSchoolSettings().nameTh} มีนักเรียนรวม 1,248 คน บุคลากร 124 คน`,
              'อัตราการเข้าเรียนเฉลี่ยสัปดาห์นี้ 95.6% เกณฑ์ปกติ',
              'งานเอกสารและงานรอดำเนินการ 28 รายการ ลดลง 15%',
              'ระบบพร้อมเชื่อมต่อระบบ SGS และ CCT ของกระทรวงฯ',
            ],
            actionLabel: 'ดูแดชบอร์ดภาพรวม',
          },
        };
      }

      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 select-none flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight flex items-center gap-1">
              <span>AI ผู้ช่วยผู้บริหาร</span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">ถามได้เลย...</span>
          </div>
        </div>

        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>

      {/* Chat Messages Body */}
      <div className="my-3 space-y-3 max-h-72 overflow-y-auto pr-1">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            {msg.sender === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-blue-50 text-blue-900 text-xs font-medium px-3.5 py-2 rounded-2xl rounded-tr-xs max-w-[85%] border border-blue-100/80 leading-relaxed shadow-2xs">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                {msg.summaryCard && (
                  <div className="w-full bg-[#F0FDF4] border border-emerald-200/80 rounded-2xl p-3 text-xs space-y-2 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px] sm:text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{msg.summaryCard.title}</span>
                    </div>

                    <ul className="space-y-1 text-slate-700 text-[11px] pl-5 list-disc font-medium">
                      {msg.summaryCard.items.map((bullet, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {bullet}
                        </li>
                      ))}
                    </ul>

                    {msg.summaryCard.actionLabel && (
                      <button
                        type="button"
                        onClick={() => alert(`เปิดดูรายงาน: ${msg.summaryCard?.title}`)}
                        className="mt-1 w-full py-1.5 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 font-bold border border-emerald-300 text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <span>{msg.summaryCard.actionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400 italic">
            <span className="animate-pulse">AI กำลังวิเคราะห์ข้อมูลโรงเรียน...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="relative mt-2">
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="พิมพ์คำถามของคุณ..."
          className="w-full pl-3.5 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
        />
        <button
          type="button"
          onClick={() => handleSend()}
          className="absolute right-1 top-1 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
          title="ส่งคำถาม"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
