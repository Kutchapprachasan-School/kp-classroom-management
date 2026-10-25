// src/components/common/ErrorBoundary.tsx
// Global Error Boundary to catch render errors gracefully and prevent white-screen crashes

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught application error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('cls_current_auth_user');
      }
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7FAFF] flex items-center justify-center p-4 font-sans select-none">
          <div className="w-full max-w-md bg-white border border-[#E6EEF7] rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(40,90,140,0.08)] text-center animate-fade-in">
            {/* Warning Icon Container */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold text-[#163A66] mb-1.5">
              ขออภัย เกิดข้อผิดพลาดในการแสดงผล
            </h1>
            <p className="text-xs text-[#6B7C93] mb-6 leading-relaxed">
              ระบบตรวจพบข้อผิดพลาดที่ไม่คาดคิด กรุณาลองโหลดหน้าเว็บใหม่อีกครั้ง หรือรีเซ็ตเพื่อเข้าสู่ระบบใหม่
            </p>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full h-11 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>โหลดหน้าเว็บใหม่</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#163A66] border border-slate-200 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>ล้างแคชและเข้าสู่ระบบใหม่</span>
              </button>
            </div>

            {/* Collapsible Error Debug Details */}
            {this.state.error && (
              <details className="mt-5 text-left text-[11px] text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-200 overflow-hidden">
                <summary className="font-semibold text-slate-600 cursor-pointer select-none">
                  รายละเอียดข้อผิดพลาดทางเทคนิค
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-[10px] text-rose-700 max-h-36 overflow-y-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
