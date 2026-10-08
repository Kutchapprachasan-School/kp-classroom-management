// src/services/qrAttendanceService.ts
// ระบบสร้างและตรวจสอบ Dynamic Rotating QR Code สำหรับเช็คชื่อเข้าแถวและเช็คชื่อรายคาบ
// คุณสมบัติเด่น:
// 1. หมุนเวียน QR Code ทุก 15 วินาที (Time-based Rolling Seed) ป้องกันการแคปหน้าจอส่งต่อให้เพื่อน
// 2. รองรับโหมดนักเรียนสแกนจากจอครู (Projector/Screen Mode) พร้อมรหัส OTP คู่ขนาน
// 3. รองรับโหมดครูสแกนบัตรนักเรียน (Student ID Card Continuous Scanner)
// 4. สังเคราะห์เสียงตอบรับ (Audio Chime) ด้วย Web Audio API สำหรับยืนยันการสแกนสำเร็จ

import QRCode from 'qrcode';

export interface DynamicQrPayload {
  action: 'KPS_ATTENDANCE_CHECKIN';
  type: 'MORNING_ASSEMBLY' | 'CLASSROOM_PERIOD';
  roomId: string;
  courseCode?: string;
  date: string;
  periodNo?: number;
  timeWindow: number; // Math.floor(Date.now() / 15000)
  token: string;
  otp: string; // 4-digit human readable OTP
  expiresAt: number; // Timestamp ms
}

export interface StudentCardQrPayload {
  action: 'KPS_STUDENT_ID_CARD';
  studentCode: string;
  studentName: string;
  classroomId: string;
  roomNumber?: string;
}

export interface QrVerificationResult {
  valid: boolean;
  message: string;
  payload?: DynamicQrPayload;
  isExpired?: boolean;
}

// 15 seconds rotation window
export const QR_ROTATION_INTERVAL_SECONDS = 15;

class QrAttendanceService {
  private audioContext: AudioContext | null = null;

  /**
   * สร้าง AudioContext สำหรับเล่นเสียงตอบรับ
   */
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  /**
   * เล่นเสียงสัญญาณสแกนสำเร็จ (Dual-Tone Positive Chime)
   */
  public playSuccessSound(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // First chime tone: 880Hz (A5), then 1320Hz (E6)
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Cannot play audio chime:', e);
    }
  }

  /**
   * เล่นเสียงสัญญาณสแกนไม่สำเร็จ (Low Buzz Warning)
   */
  public playErrorSound(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn('Cannot play audio error:', e);
    }
  }

  /**
   * คำนวณหน้าต่างเวลาปัจจุบัน (Time Window)
   */
  public getCurrentTimeWindow(): number {
    return Math.floor(Date.now() / (QR_ROTATION_INTERVAL_SECONDS * 1000));
  }

  /**
   * คำนวณเวลาที่เหลือของหน้าต่างปัจจุบัน (หน่วยวินาที)
   */
  public getSecondsRemainingInWindow(): number {
    const now = Date.now();
    const windowStart = Math.floor(now / (QR_ROTATION_INTERVAL_SECONDS * 1000)) * (QR_ROTATION_INTERVAL_SECONDS * 1000);
    const elapsed = (now - windowStart) / 1000;
    return Math.max(1, Math.ceil(QR_ROTATION_INTERVAL_SECONDS - elapsed));
  }

  /**
   * สร้าง OTP และ Token ป้องกันการปลอมแปลง
   */
  private generateTokenForWindow(roomId: string, windowNo: number): { token: string; otp: string } {
    let hash = 0;
    const str = `${roomId}-${windowNo}-KPS-SECRET-SALT-2026`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const positiveHash = Math.abs(hash);
    const token = positiveHash.toString(16).padStart(8, '0').slice(-8);
    const otp = (positiveHash % 9000 + 1000).toString();
    return { token, otp };
  }

  /**
   * สร้าง Payload ข้อมูลสำหรับ Dynamic QR Code ของครู
   */
  public generateDynamicPayload(options: {
    type: 'MORNING_ASSEMBLY' | 'CLASSROOM_PERIOD';
    roomId: string;
    courseCode?: string;
    date: string;
    periodNo?: number;
  }): DynamicQrPayload {
    const timeWindow = this.getCurrentTimeWindow();
    const { token, otp } = this.generateTokenForWindow(options.roomId, timeWindow);
    const expiresAt = (timeWindow + 1) * QR_ROTATION_INTERVAL_SECONDS * 1000;

    return {
      action: 'KPS_ATTENDANCE_CHECKIN',
      type: options.type,
      roomId: options.roomId,
      courseCode: options.courseCode,
      date: options.date,
      periodNo: options.periodNo,
      timeWindow,
      token,
      otp,
      expiresAt,
    };
  }

  /**
   * แปลง Payload เป็นรูปภาพ Data URL สำหรับแสดงผลแท็ก <img>
   */
  public async generateQrDataUrl(payload: DynamicQrPayload | StudentCardQrPayload): Promise<string> {
    try {
      const serialized = JSON.stringify(payload);
      return await QRCode.toDataURL(serialized, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 320,
        color: {
          dark: '#163A66', // Text Primary Navy Blue (Pastel Anime Master Rule)
          light: '#FFFFFF',
        },
      });
    } catch (e) {
      console.error('Failed to generate QR data URL:', e);
      return '';
    }
  }

  /**
   * สร้าง QR Code ประจำตัวนักเรียน (Student ID Card QR)
   */
  public generateStudentCardPayload(
    studentCode: string,
    studentName: string,
    classroomId: string,
    roomNumber?: string
  ): StudentCardQrPayload {
    return {
      action: 'KPS_STUDENT_ID_CARD',
      studentCode,
      studentName,
      classroomId,
      roomNumber,
    };
  }

  /**
   * ตรวจสอบความถูกต้องของ Dynamic QR Code ที่นักเรียนสแกน
   * มีระบบตรวจจับการหมดอายุ (Anti-Cheat: ไม่อนุญาตให้นำภาพแคปเจอร์มาใช้)
   */
  public verifyDynamicScan(
    scannedText: string,
    expectedRoomId: string,
    expectedType: 'MORNING_ASSEMBLY' | 'CLASSROOM_PERIOD'
  ): QrVerificationResult {
    try {
      const parsed: DynamicQrPayload = JSON.parse(scannedText);

      if (parsed.action !== 'KPS_ATTENDANCE_CHECKIN') {
        return { valid: false, message: 'QR Code นี้ไม่ใช่สำหรับเช็คชื่อโรงเรียน' };
      }

      if (parsed.type !== expectedType) {
        return { valid: false, message: 'ประเภทการเช็คชื่อไม่ตรงกัน' };
      }

      if (parsed.roomId !== expectedRoomId) {
        return { valid: false, message: 'ห้องเรียนไม่ตรงกับห้องที่เปิดเช็คชื่อ' };
      }

      const currentWindow = this.getCurrentTimeWindow();
      // อนุญาตความคลาดเคลื่อน 1 window (สูงสุด 15-30 วินาที) กรณีเวลาเครื่องต่างกันเล็กน้อย
      if (Math.abs(currentWindow - parsed.timeWindow) > 1) {
        return {
          valid: false,
          isExpired: true,
          message: '⚠️ QR Code หมดอายุแล้ว (ป้องกันการแคปหน้าจอเช็คชื่อแทนกัน) กรุณาสแกนจากหน้าจอครูใหม่อีกครั้ง',
        };
      }

      // ตรวจสอบความถูกต้องของโทเคน
      const { token } = this.generateTokenForWindow(parsed.roomId, parsed.timeWindow);
      if (token !== parsed.token) {
        return { valid: false, message: 'รหัสตรวจสอบความถูกต้องของ QR Code ไม่ถูกต้อง' };
      }

      return {
        valid: true,
        message: '✓ ตรวจสอบ QR Code ถูกต้องสมบูรณ์',
        payload: parsed,
      };
    } catch {
      return { valid: false, message: 'รูปแบบข้อมูลใน QR Code ไม่ถูกต้อง' };
    }
  }

  /**
   * ตรวจสอบและดึงข้อมูลจากบัตรนักเรียนเมื่อครูสแกน
   */
  public parseStudentCardScan(scannedText: string): StudentCardQrPayload | null {
    try {
      // กรณีเป็น JSON Format จากระบบ
      const parsed = JSON.parse(scannedText);
      if (parsed.action === 'KPS_STUDENT_ID_CARD' && parsed.studentCode) {
        return parsed as StudentCardQrPayload;
      }
      if (parsed.studentCode && parsed.studentName) {
        return {
          action: 'KPS_STUDENT_ID_CARD',
          studentCode: String(parsed.studentCode),
          studentName: String(parsed.studentName),
          classroomId: parsed.classroomId || '',
        };
      }
    } catch {
      // กรณีเป็นข้อความตัวเลขรหัสนักเรียนเพียวๆ จาก Barcode / QR ภายนอก (เช่น 47001)
      const cleanCode = scannedText.trim();
      if (/^\d{5}$/.test(cleanCode)) {
        return {
          action: 'KPS_STUDENT_ID_CARD',
          studentCode: cleanCode,
          studentName: `นักเรียนรหัส ${cleanCode}`,
          classroomId: '',
        };
      }
    }
    return null;
  }
}

export const qrAttendanceService = new QrAttendanceService();
