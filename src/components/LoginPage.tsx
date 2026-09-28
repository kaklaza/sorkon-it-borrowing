import React, { useState } from 'react';
import { ShieldCheck, Laptop, Lock, ArrowRight, Sun, Moon, Info, AlertTriangle } from 'lucide-react';
import { AuthService } from '../services/authService';
import { UserProfile } from '../types';
import { SharePointService } from '../services/sharepointService';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onDemoMode: () => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onDemoMode,
  isDark,
  onToggleDark,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Full-page SSO Redirect Login (Industry Standard - No popup blocker issues)
  const handleRedirectLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await AuthService.loginRedirect();
    } catch (err: any) {
      console.error('Redirect login error:', err);
      setErrorMessage(err.message || String(err));
      setIsLoading(false);
    }
  };

  // Popup Login option
  const handlePopupLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { profile, error } = await AuthService.login();
      if (profile) {
        const realRole = await SharePointService.resolveUserRole(profile.email);
        profile.role = realRole;
        onLoginSuccess(profile);
      } else if (error) {
        setErrorMessage(error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col justify-between text-stone-900 dark:text-stone-100 transition-colors duration-200">
      
      {/* Top Header */}
      <header className="py-4 px-6 sm:px-8 border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-700 to-rose-900 text-white flex items-center justify-center font-black text-xl shadow-md">
            ส.
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wide text-red-700 dark:text-red-400">
              บมจ. ส. ขอนแก่นฟู้ดส์
            </h1>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              S. KHONKAEN FOODS PUBLIC COMPANY LIMITED
            </p>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
          title={isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
        </button>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Logo & Portal Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 mb-2 ring-8 ring-red-50/50 dark:ring-red-950/30">
              <Laptop className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
              ระบบยืม-คืนอุปกรณ์ IT
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto">
              IT Equipment Borrowing &amp; Inventory Management Portal
            </p>
          </div>

          {/* Security Notice */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 flex items-start space-x-3 text-xs text-stone-600 dark:text-stone-300">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-stone-800 dark:text-stone-200">ยืนยันตัวตนผ่าน Microsoft 365 องค์กร:</span>
              <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                เพื่อความปลอดภัยของข้อมูลและตรวจสอบสิทธิ์ตามแผนก กรุณาเข้าสู่ระบบด้วยอีเมลบริษัท (<code className="text-red-600 dark:text-red-400">@sorkon.co.th</code>)
              </p>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400 flex items-start space-x-2.5 animate-in shake">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed">
                <p className="font-bold">เข้าสู่ระบบไม่สำเร็จ</p>
                <p className="mt-0.5 break-words">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Primary Action: Microsoft 365 SSO Login Button */}
          <div className="space-y-3">
            <button
              onClick={handleRedirectLogin}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-red-700 hover:bg-red-800 active:scale-98 text-white font-bold text-sm shadow-lg shadow-red-700/20 hover:shadow-red-700/30 flex items-center justify-center space-x-3 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังเชื่อมต่อ Microsoft 365...</span>
                </div>
              ) : (
                <>
                  {/* Microsoft 4-Color Grid */}
                  <div className="grid grid-cols-2 gap-0.5 w-4 h-4 shrink-0">
                    <span className="bg-[#f25022] rounded-[1px]" />
                    <span className="bg-[#7fba00] rounded-[1px]" />
                    <span className="bg-[#00a4ef] rounded-[1px]" />
                    <span className="bg-[#ffb900] rounded-[1px]" />
                  </div>
                  <span>เข้าสู่ระบบด้วย Microsoft 365</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            {/* Alternative Popup Login */}
            <button
              onClick={handlePopupLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs text-stone-600 dark:text-stone-300 font-semibold flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>หรือเข้าสู่ระบบผ่านหน้าต่าง Pop-up</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-stone-200 dark:border-stone-800" />
            <span className="bg-white dark:bg-stone-900 px-3 text-[11px] text-stone-400 absolute">
              หรือ
            </span>
          </div>

          {/* Demo Mode Button for IT Testing */}
          <div>
            <button
              onClick={onDemoMode}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>ทดลองใช้งานโหมดตัวอย่าง (Demo Mode)</span>
            </button>
            <p className="text-[10px] text-stone-400 text-center mt-1.5">
              ใช้สำหรับทดสอบ Flow ยืม-คืน และสลับ Role โดยไม่ต้องใช้บัญชีจริง
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-stone-400 dark:text-stone-500 border-t border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50">
        <p>© 2026 บริษัท ส. ขอนแก่นฟู้ดส์ จำกัด (มหาชน) • ฝ่ายเทคโนโลยีสารสนเทศ (IT Department)</p>
      </footer>

    </div>
  );
};
