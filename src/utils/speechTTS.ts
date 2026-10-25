// src/utils/speechTTS.ts
// ระบบสังเคราะห์เสียงพูด Web Speech API (Text-to-Speech)
// รองรับการอ่านออกเสียงชื่อนักเรียนภาษาไทย และคำชมภาษาญี่ปุ่น (Sugoi! / Yatta! / Subarashii!)

export type JapanesePraise = 'sugoi' | 'yatta' | 'excellent';

class SpeechTTSEngine {
  private synth: SpeechSynthesis | null = null;
  private thaiVoice: SpeechSynthesisVoice | null = null;
  private japaneseVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices(): void {
    if (!this.synth) return;
    try {
      const voices = this.synth.getVoices();
      if (voices && voices.length > 0) {
        // ค้นหาเสียงภาษาไทย
        this.thaiVoice =
          voices.find((v) => v.lang === 'th-TH' || v.lang.startsWith('th')) || null;
        // ค้นหาเสียงภาษาญี่ปุ่น
        this.japaneseVoice =
          voices.find((v) => v.lang === 'ja-JP' || v.lang.startsWith('ja')) || null;
      }
    } catch {
      // Ignored for environments where voices can't be listed
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public stop(): void {
    if (!this.synth) return;
    try {
      this.synth.cancel();
    } catch {
      // ignore
    }
  }

  // อ่านชื่อนักเรียนเป็นภาษาไทย
  public speakStudentName(
    number: number | undefined,
    name: string,
    enabled: boolean = true
  ): void {
    if (!this.synth || !enabled) return;
    this.stop();

    // จัดรูปแบบข้อความให้ออกเสียงเป็นธรรมชาติ
    const cleanName = (name || '').trim();
    const textToSpeech = number ? `เลขที่ ${number}, ${cleanName}` : cleanName;

    const utterance = new SpeechSynthesisUtterance(textToSpeech);
    utterance.lang = 'th-TH';
    utterance.rate = 1.0; // ความเร็วปกติ
    utterance.pitch = 1.05; // เสียงสดใสขึ้นเล็กน้อย

    if (this.thaiVoice) {
      utterance.voice = this.thaiVoice;
    }

    try {
      this.synth.speak(utterance);
    } catch {
      // ignore speech failure
    }
  }

  // พูดคำชมภาษาญี่ปุ่น (Sugoi! / Yatta! / Subarashii!)
  public speakJapanesePraise(
    phrase: JapanesePraise = 'sugoi',
    enabled: boolean = true
  ): void {
    if (!this.synth || !enabled) return;

    const phrases: Record<JapanesePraise, string> = {
      sugoi: 'すごいです！', // Sugoi desu! (ยอดเยี่ยมมาก!)
      yatta: 'やったー！',   // Yatta! (สำเร็จแล้ว!)
      excellent: 'すばらしい！', // Subarashii! (วิเศษมาก!)
    };

    const text = phrases[phrase] || phrases.sugoi;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 1.05;
    utterance.pitch = 1.15;

    if (this.japaneseVoice) {
      utterance.voice = this.japaneseVoice;
    }

    try {
      this.synth.speak(utterance);
    } catch {
      // ignore speech failure
    }
  }

  // อ่านข้อความทั่วไป (เช่น คำศัพท์ภาษาอังกฤษ หรือข้อความทั่วไป)
  public speakText(text: string, lang: string = 'th-TH', enabled: boolean = true): void {
    if (!this.synth || !enabled || !text) return;
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    try {
      this.synth.speak(utterance);
    } catch {
      // ignore
    }
  }
}

export const tts = new SpeechTTSEngine();
