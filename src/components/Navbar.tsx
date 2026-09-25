import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USERS } from '../data/initialData';
import { 
  Laptop, 
  ClipboardList, 
  CheckCircle2, 
  BarChart3, 
  Mail, 
  Database, 
  UserCheck, 
  ChevronDown, 
  Sun,
  Moon,
  Clock,
  LogIn,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { AuthService } from '../services/authService';
import { SharePointService } from '../services/sharepointService';

interface NavbarProps {
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingApprovalsCount: number;
  unreadEmailsCount: number;
  isDark: boolean;
  onToggleDark: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onUserChange,
  currentTab,
  onTabChange,
  pendingApprovalsCount,
  unreadEmailsCount,
  isDark,
  onToggleDark,
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const activeMsalAccount = AuthService.getActiveAccount();

  const handleM365Login = async () => {
    setIsLoggingIn(true);
    try {
      const profile = await AuthService.login();
      if (profile) {
        const realRole = await SharePointService.resolveUserRole(profile.email);
        profile.role = realRole;
        onUserChange(profile);
        setRoleMenuOpen(false);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleM365Logout = async () => {
    await AuthService.logout();
    onUserChange(INITIAL_USERS[0]);
    setRoleMenuOpen(false);
  };

  const handleRoleSelect = (role: UserRole) => {
    const target = INITIAL_USERS.find(u => u.role === role) || currentUser;
    onUserChange(target);
    setRoleMenuOpen(false);
  };

  const roleColors: Record<UserRole, string> = {
    User: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    Approver: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    Admin: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    Audit: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  };

  const roleNamesTh: Record<UserRole, string> = {
    User: 'ผู้ใช้งานทั่วไป (Requester)',
    Approver: 'ผู้อนุมัติ (IT Manager)',
    Admin: 'ผู้ดูแลระบบ (IT Admin)',
    Audit: 'ผู้ตรวจสอบ (Audit)',
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 shadow-xs transition-colors duration-200">
      
      {/* Top Sorkon Style Utility Bar */}
      <div className="bg-gradient-to-r from-red-800 via-rose-800 to-red-900 text-white text-[11px] py-1.5 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="font-black tracking-wider text-amber-300">S.KHONKAEN IT PORTAL</span>
            <span className="hidden sm:inline text-rose-200">|</span>
            <span className="hidden sm:inline text-rose-100">ผู้ส่งมอบความสุขและความสะดวกสบายด้านอุปกรณ์เทคโนโลยีสารสนเทศ</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-1.5 text-rose-100">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>ระบบเชื่อมต่อ Microsoft 365 Cloud Online</span>
            </div>

            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={onToggleDark}
              className="flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
              title={isDark ? 'สลับเป็นโหมดสว่าง (Light Mode)' : 'สลับเป็นโหมดมืด (Dark Mode)'}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span className="font-bold text-[10px]">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-stone-200" />
                  <span className="font-bold text-[10px]">Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar with robust flex layout and vertical centering */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4.25rem] py-2 gap-3 sm:gap-4">
          
          {/* Logo & Brand (No-wrap, clean shrink-0) */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group shrink-0" 
            onClick={() => onTabChange('borrow')}
          >
            {/* Iconic Sorkon Red Emblem */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-700 via-rose-700 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-700/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <span className="font-serif font-black text-xl tracking-tighter text-white">ส.</span>
            </div>
            
            <div className="shrink-0">
              <div className="flex items-center space-x-2">
                <span className="font-black text-stone-900 dark:text-stone-100 text-base sm:text-lg tracking-tight whitespace-nowrap">
                  ส.ขอนแก่น IT Borrowing
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0">
                  M365
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 hidden xl:block whitespace-nowrap leading-tight mt-0.5">
                ระบบยืม-คืนอุปกรณ์ IT บริษัท ส. ขอนแก่นฟู้ดส์ จำกัด (มหาชน)
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 shrink-0">
            <button
              onClick={() => onTabChange('borrow')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                currentTab === 'borrow' 
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 shadow-xs' 
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>แบบฟอร์มขอยืม</span>
            </button>

            <button
              onClick={() => onTabChange('my-requests')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                currentTab === 'my-requests' 
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 shadow-xs' 
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>คำขอของฉัน</span>
            </button>

            {/* Approver or Admin */}
            {(currentUser.role === 'Approver' || currentUser.role === 'Admin') && (
              <button
                onClick={() => onTabChange('approvals')}
                className={`relative px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  currentTab === 'approvals' 
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 shadow-xs' 
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>งานรออนุมัติ</span>
                {pendingApprovalsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-red-600 text-white animate-pulse">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            )}

            {/* Admin or Audit Dashboard */}
            {(currentUser.role === 'Admin' || currentUser.role === 'Audit' || currentUser.role === 'Approver') && (
              <button
                onClick={() => onTabChange('dashboard')}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  currentTab === 'dashboard' 
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 shadow-xs' 
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>แดชบอร์ด &amp; สต็อก</span>
              </button>
            )}

            <button
              onClick={() => onTabChange('emails')}
              className={`relative px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                currentTab === 'emails' 
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 shadow-xs' 
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
              title="อีเมลแจ้งเตือนทั้งหมด"
            >
              <Mail className="w-4 h-4" />
              <span>กล่องเมลแจ้งเตือน</span>
              {unreadEmailsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-600 absolute top-2 right-2" />
              )}
            </button>

            <button
              onClick={() => onTabChange('sharepoint')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                currentTab === 'sharepoint' 
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 shadow-xs' 
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span>SharePoint Setup</span>
            </button>
          </nav>

          {/* User Profile & Role Switcher */}
          <div className="relative shrink-0">
            <div 
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center space-x-2 p-1.5 pr-2.5 rounded-2xl border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-800/60 cursor-pointer transition-all shrink-0"
            >
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover ring-2 ring-stone-200 dark:ring-stone-700 shrink-0" 
              />
              <div className="text-left hidden lg:block">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold border ${roleColors[currentUser.role]}`}>
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate max-w-[120px]">{currentUser.department}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
            </div>

            {/* Dropdown Menu */}
            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                
                {/* Real Microsoft 365 Auth Section */}
                <div className="p-3 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      ระบบยืนยันตัวตนองค์กร
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center space-x-1 ${
                      activeMsalAccount 
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${activeMsalAccount ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      <span>{activeMsalAccount ? 'M365 ซิงค์แล้ว' : 'Demo Mode'}</span>
                    </span>
                  </div>

                  {activeMsalAccount ? (
                    <div className="space-y-2">
                      <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                        <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{activeMsalAccount.name}</p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">{activeMsalAccount.username}</p>
                      </div>
                      <button
                        onClick={handleM365Logout}
                        className="w-full py-1.5 px-3 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-stone-600 dark:text-stone-300 hover:text-red-700 dark:hover:text-red-400 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>ออกจากระบบ Microsoft 365</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        onClick={handleM365Login}
                        disabled={isLoggingIn}
                        className="w-full py-2 px-3 rounded-xl bg-red-700 hover:bg-red-800 active:scale-98 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-all disabled:opacity-50"
                      >
                        {isLoggingIn ? (
                          <span>กำลังเชื่อมต่อ Microsoft...</span>
                        ) : (
                          <>
                            {/* Microsoft 4-color grid */}
                            <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5 shrink-0">
                              <span className="bg-[#f25022] rounded-[1px]" />
                              <span className="bg-[#7fba00] rounded-[1px]" />
                              <span className="bg-[#00a4ef] rounded-[1px]" />
                              <span className="bg-[#ffb900] rounded-[1px]" />
                            </div>
                            <span>เข้าสู่ระบบ Microsoft 365 (จริง)</span>
                          </>
                        )}
                      </button>
                      <p className="text-[10px] text-stone-400 text-center mt-1.5">
                        ใช้บัญชี @sorkon.co.th เพื่อซิงค์กับ SharePoint Online
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-800/20">
                  <p className="text-xs font-bold text-stone-700 dark:text-stone-200">จำลองสลับบทบาท (Role Switcher)</p>
                  <p className="text-[10px] text-stone-400">เลือกเพื่อทดสอบหน้าจอของแต่ละ Role</p>
                </div>

                <div className="p-1 space-y-1">
                  {(['User', 'Approver', 'Admin', 'Audit'] as UserRole[]).map((r) => {
                    const u = INITIAL_USERS.find(user => user.role === r);
                    const isSelected = currentUser.role === r;
                    return (
                      <button
                        key={r}
                        onClick={() => handleRoleSelect(r)}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center space-x-3 text-xs transition-colors ${
                          isSelected 
                            ? 'bg-red-50 dark:bg-red-950/50 font-bold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50' 
                            : 'hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        <img src={u?.avatar} className="w-7 h-7 rounded-lg object-cover shrink-0" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-stone-900 dark:text-stone-100 truncate">{u?.name}</p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">{roleNamesTh[r]}</p>
                        </div>
                        {isSelected && <UserCheck className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
