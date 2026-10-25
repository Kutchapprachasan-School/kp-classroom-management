// src/utils/speechTTS.ts
// ระบบสังเคราะห์เสียงพูด Web Speech API (Text-to-Speech)
// รองรับภาษาไทย (TH), ภาษาอังกฤษ (EN), ภาษาญี่ปุ่น (JA), และภาษาจีน (ZH)

export type JapanesePraise = 'sugoi' | 'yatta' | 'excellent';
export type EnglishPraise = 'great' | 'awesome' | 'perfect' | 'excellent';
export type ChinesePraise = 'taiBangLe' | 'haoJiLe' | 'zhenBang';
export type SpeechLanguage = 'th-TH' | 'en-US' | 'ja-JP' | 'zh-CN' | string;

/**
 * แปลงคำนำหน้าชื่อย่อภาษาไทยให้เป็นคำเต็มที่ลื่นไหลสำหรับระบบสังเคราะห์เสียงพูด (TTS)
 * ป้องกันไม่ให้ AI อ่านสะกดทีละตัวอักษร เช่น:
 * - ด.ช. / ด.ช / ด. ช. -> เด็กชาย
 * - ด.ญ. / ด.ญ / ด. ญ. -> เด็กหญิง
 * - น.ส. / น.ส / น. ส. -> นางสาว
 */
export function formatStudentNameForSpeech(name: string): string {
  if (!name) return '';
  let formatted = name.trim();

  // ด.ช. / ด.ช / ด. ช. -> เด็กชาย
  formatted = formatted.replace(/(^|[\s(])ด\s*\.\s*ช\s*\.?\s*/gi, '$1เด็กชาย');

  // ด.ญ. / ด.ญ / ด. ญ. -> เด็กหญิง
  formatted = formatted.replace(/(^|[\s(])ด\s*\.\s*ญ\s*\.?\s*/gi, '$1เด็กหญิง');

  // น.ส. / น.ส / น. ส. -> นางสาว
  formatted = formatted.replace(/(^|[\s(])น\s*\.\s*ส\s*\.?\s*/gi, '$1นางสาว');

  return formatted;
}

class SpeechTTSEngine {
  private synth: SpeechSynthesis | null = null;
  private thaiVoice: SpeechSynthesisVoice | null = null;
  private englishVoice: SpeechSynthesisVoice | null = null;
  private japaneseVoice: SpeechSynthesisVoice | null = null;
  private chineseVoice: SpeechSynthesisVoice | null = null;

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
        // ค้นหาเสียงภาษาอังกฤษ
        this.englishVoice =
          voices.find((v) => v.lang === 'en-US' || v.lang === 'en-GB' || v.lang.startsWith('en')) || null;
        // ค้นหาเสียงภาษาญี่ปุ่น
        this.japaneseVoice =
          voices.find((v) => v.lang === 'ja-JP' || v.lang.startsWith('ja')) || null;
        // ค้นหาเสียงภาษาจีน
        this.chineseVoice =
          voices.find((v) => v.lang === 'zh-CN' || v.lang === 'zh-TW' || v.lang.startsWith('zh')) || null;
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

  private getVoiceForLang(lang: string): SpeechSynthesisVoice | null {
    const l = (lang || '').toLowerCase();
    if (l.startsWith('th')) return this.thaiVoice;
    if (l.startsWith('en')) return this.englishVoice;
    if (l.startsWith('ja')) return this.japaneseVoice;
    if (l.startsWith('zh')) return this.chineseVoice;
    return null;
  }

  // อ่านชื่อนักเรียน
  public speakStudentName(
    number: number | undefined,
    name: string,
    enabled: boolean = true,
    lang: SpeechLanguage = 'th-TH'
  ): void {
    if (!this.synth || !enabled) return;
    this.stop();

    const cleanName = formatStudentNameForSpeech((name || '').trim());
    let textToSpeech = cleanName;
    if (lang.startsWith('th')) {
      textToSpeech = number ? `เลขที่ ${number}, ${cleanName}` : cleanName;
    } else if (lang.startsWith('en')) {
      textToSpeech = number ? `Number ${number}, ${cleanName}` : cleanName;
    } else if (lang.startsWith('ja')) {
      textToSpeech = number ? `${number} 番, ${cleanName} さん` : `${cleanName} さん`;
    } else if (lang.startsWith('zh')) {
      textToSpeech = number ? `${number} 号, ${cleanName}` : cleanName;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeech);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    const voice = this.getVoiceForLang(lang);
    if (voice) {
      utterance.voice = voice;
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

  // พูดคำชมภาษาอังกฤษ (Great! / Awesome! / Perfect!)
  public speakEnglishPraise(
    phrase: EnglishPraise = 'great',
    enabled: boolean = true
  ): void {
    if (!this.synth || !enabled) return;

    const phrases: Record<EnglishPraise, string> = {
      great: 'Great job!',
      awesome: 'Awesome!',
      perfect: 'Perfect!',
      excellent: 'Excellent work!',
    };

    const text = phrases[phrase] || phrases.great;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.05;
    utterance.pitch = 1.1;

    if (this.englishVoice) {
      utterance.voice = this.englishVoice;
    }

    try {
      this.synth.speak(utterance);
    } catch {
      // ignore
    }
  }

  // พูดคำชมภาษาจีน (太棒了! / 好极了! / 真棒!)
  public speakChinesePraise(
    phrase: ChinesePraise = 'taiBangLe',
    enabled: boolean = true
  ): void {
    if (!this.synth || !enabled) return;

    const phrases: Record<ChinesePraise, string> = {
      taiBangLe: '太棒了！', // Tài bàng le!
      haoJiLe: '好极了！',   // Hǎo jí le!
      zhenBang: '真棒！',     // Zhēn bàng!
    };

    const text = phrases[phrase] || phrases.taiBangLe;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.05;
    utterance.pitch = 1.1;

    if (this.chineseVoice) {
      utterance.voice = this.chineseVoice;
    }

    try {
      this.synth.speak(utterance);
    } catch {
      // ignore
    }
  }

  // อ่านข้อความทั่วไป รองรับหลายภาษา (ไทย, อังกฤษ, ญี่ปุ่น, จีน)
  public speakText(text: string, lang: SpeechLanguage = 'th-TH', enabled: boolean = true): void {
    if (!this.synth || !enabled || !text) return;
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voice = this.getVoiceForLang(lang);
    if (voice) {
      utterance.voice = voice;
    }

    try {
      this.synth.speak(utterance);
    } catch {
      // ignore
    }
  }
}

export const tts = new SpeechTTSEngine();
