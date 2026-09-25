import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { SharePointService } from './services/sharepointService';
import { Equipment, BorrowRequest, UserProfile, UserRole, EmailNotification, BorrowItemSelection } from './types';
import { Navbar } from './components/Navbar';
import { BorrowForm } from './components/BorrowForm';
import { MyRequests } from './components/MyRequests';
import { ApprovalsView } from './components/ApprovalsView';
import { AdminDashboard } from './components/AdminDashboard';
import { EmailLogsModal } from './components/EmailLogsModal';
import { SharepointSetupModal } from './components/SharepointSetupModal';
import { Mail, RotateCcw, Database, Heart } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(StorageService.getCurrentUser());
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(StorageService.getEquipment());
  const [requests, setRequests] = useState<BorrowRequest[]>(StorageService.getRequests());
  const [users, setUsers] = useState<UserProfile[]>(StorageService.getUsers());
  const [emailLogs, setEmailLogs] = useState<EmailNotification[]>(StorageService.getEmailLogs());

  // Dark Mode state with persistence
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('sorkon_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sorkon_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sorkon_theme', 'light');
    }
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(prev => !prev);

  // Active view tab
  const [currentTab, setCurrentTab] = useState<string>('borrow');

  // Modals
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSharepointModal, setShowSharepointModal] = useState(false);

  // Live Toast for recent email notifications
  const [recentToast, setRecentToast] = useState<{ message: string; sub: string } | null>(null);

  // Refresh data on events
  useEffect(() => {
    const handleRequestsChange = (e: any) => setRequests([...e.detail]);
    const handleEquipmentChange = (e: any) => setEquipmentList([...e.detail]);
    const handleAuthChange = (e: any) => setCurrentUser({ ...e.detail });
    const handleEmailSent = (e: any) => {
      setEmailLogs(StorageService.getEmailLogs());
      setRecentToast({
        message: `✉️ อีเมลถูกส่งถึง: ${e.detail.recipientName}`,
        sub: e.detail.subject,
      });
      setTimeout(() => setRecentToast(null), 5000);
    };

    window.addEventListener('requests-change', handleRequestsChange);
    window.addEventListener('equipment-change', handleEquipmentChange);
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('email-sent', handleEmailSent);

    return () => {
      window.removeEventListener('requests-change', handleRequestsChange);
      window.removeEventListener('equipment-change', handleEquipmentChange);
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('email-sent', handleEmailSent);
    };
  }, []);

  // Handlers
  const handleUserChange = (newUser: UserProfile) => {
    StorageService.setCurrentUser(newUser);
    setCurrentUser(newUser);
  };

  const handleCreateRequest = (formData: {
    items: BorrowItemSelection[];
    reason: string;
    borrowDate: string;
    returnDate: string;
    phone?: string;
    locationType?: any;
    roomOrPlace?: string;
    needSetupSupport?: boolean;
    specialInstructions?: string;
  }) => {
    SharePointService.submitRequest({
      requester: {
        name: currentUser.name,
        email: currentUser.email,
        department: currentUser.department,
        avatar: currentUser.avatar,
        phone: formData.phone,
      },
      items: formData.items,
      reason: formData.reason,
      borrowDate: formData.borrowDate,
      returnDate: formData.returnDate,
      locationType: formData.locationType,
      roomOrPlace: formData.roomOrPlace,
      needSetupSupport: formData.needSetupSupport,
      specialInstructions: formData.specialInstructions,
    });
    setRequests(StorageService.getRequests());
    setEquipmentList(StorageService.getEquipment());
  };

  const handleApprove = (requestId: string, comment?: string) => {
    SharePointService.updateStatus(requestId, 'Approved', {
      name: currentUser.name,
      email: currentUser.email,
      comment,
    });
    setRequests(StorageService.getRequests());
    setEquipmentList(StorageService.getEquipment());
  };

  const handleReject = (requestId: string, comment: string) => {
    SharePointService.updateStatus(requestId, 'Rejected', {
      name: currentUser.name,
      email: currentUser.email,
      comment,
    });
    setRequests(StorageService.getRequests());
  };

  const handleCancelRequest = (requestId: string) => {
    StorageService.updateRequestStatus(requestId, 'Cancelled');
    setRequests(StorageService.getRequests());
  };

  const handleHandover = (requestId: string, handedBy: string, assetTags: Record<string, string>, notes?: string) => {
    StorageService.handoverEquipment(requestId, handedBy, assetTags, notes);
    setRequests(StorageService.getRequests());
  };

  const handleReturn = (requestId: string, receivedBy: string, condition: 'Good' | 'Damaged' | 'Incomplete', notes?: string) => {
    StorageService.returnEquipment(requestId, receivedBy, condition, notes);
    setRequests(StorageService.getRequests());
    setEquipmentList(StorageService.getEquipment());
  };

  const handleUpdateEquipment = (item: Equipment) => {
    StorageService.updateEquipmentItem(item);
    setEquipmentList(StorageService.getEquipment());
  };

  const handleAddEquipment = (item: Equipment) => {
    StorageService.updateEquipmentItem(item);
    setEquipmentList(StorageService.getEquipment());
  };

  const handleDeleteEquipment = (id: string) => {
    StorageService.deleteEquipmentItem(id);
    setEquipmentList(StorageService.getEquipment());
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    const updated = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
    StorageService.saveUsers(updated);
    setUsers(updated);
    if (currentUser.id === userId) {
      handleUserChange({ ...currentUser, role: newRole });
    }
  };

  const pendingApprovalsCount = requests.filter(r => r.status === 'Pending').length;
  const unreadEmailsCount = emailLogs.filter(e => !e.isRead).length;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col selection:bg-red-700 selection:text-white transition-colors duration-200">
      
      {/* Top Navigation with S.Khonkaen branding and Dark Mode toggle */}
      <Navbar
        currentUser={currentUser}
        onUserChange={handleUserChange}
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'emails') {
            setShowEmailModal(true);
          } else if (tab === 'sharepoint') {
            setShowSharepointModal(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        pendingApprovalsCount={pendingApprovalsCount}
        unreadEmailsCount={unreadEmailsCount}
        isDark={isDark}
        onToggleDark={toggleDarkMode}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'borrow' && (
          <BorrowForm
            equipmentList={equipmentList}
            currentUser={currentUser}
            onSubmit={handleCreateRequest}
            onViewMyRequests={() => setCurrentTab('my-requests')}
          />
        )}

        {currentTab === 'my-requests' && (
          <MyRequests
            requests={requests}
            currentUser={currentUser}
            onCancelRequest={handleCancelRequest}
            onNewRequestClick={() => setCurrentTab('borrow')}
          />
        )}

        {currentTab === 'approvals' && (
          <ApprovalsView
            requests={requests}
            currentUser={currentUser}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}

        {currentTab === 'dashboard' && (
          <AdminDashboard
            requests={requests}
            equipmentList={equipmentList}
            users={users}
            currentUser={currentUser}
            onUpdateEquipment={handleUpdateEquipment}
            onAddEquipment={handleAddEquipment}
            onDeleteEquipment={handleDeleteEquipment}
            onHandover={handleHandover}
            onReturn={handleReturn}
            onUpdateUserRole={handleUpdateUserRole}
          />
        )}
      </main>

      {/* Email Logs Modal */}
      {showEmailModal && (
        <EmailLogsModal
          emails={emailLogs}
          onClose={() => setShowEmailModal(false)}
          onMarkRead={(id) => {
            StorageService.markEmailAsRead(id);
            setEmailLogs(StorageService.getEmailLogs());
          }}
        />
      )}

      {/* SharePoint Setup Guide Modal */}
      {showSharepointModal && (
        <SharepointSetupModal onClose={() => setShowSharepointModal(false)} />
      )}

      {/* Live Toast Alert for Sent Emails */}
      {recentToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-stone-900 dark:bg-stone-800 text-white p-4 rounded-2xl shadow-2xl border border-stone-700 dark:border-stone-600 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-red-700 text-white flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">{recentToast.message}</p>
              <p className="text-[11px] text-stone-300 truncate mt-0.5">{recentToast.sub}</p>
            </div>
            <button
              onClick={() => {
                setShowEmailModal(true);
                setRecentToast(null);
              }}
              className="text-[10px] text-red-400 hover:text-red-300 font-bold underline shrink-0"
            >
              เปิดดู
            </button>
          </div>
        </div>
      )}

      {/* S.Khonkaen Corporate Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-6 mt-12 text-center text-xs text-stone-500 dark:text-stone-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-red-700 dark:text-red-400">ส. ขอนแก่นฟู้ดส์ จำกัด (มหาชน)</span>
            <span>•</span>
            <span>IT Equipment Borrowing System</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSharepointModal(true)}
              className="text-red-700 dark:text-red-400 hover:underline flex items-center space-x-1 font-semibold"
            >
              <Database className="w-3.5 h-3.5" />
              <span>SharePoint Schema &amp; Setup Guide</span>
            </button>
            <button
              onClick={() => {
                if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้นเพื่อทดสอบใหม่หรือไม่?')) {
                  StorageService.resetAllData();
                }
              }}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 flex items-center space-x-1"
              title="รีเซ็ตข้อมูลตัวอย่างทั้งหมด"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตข้อมูล Demo</span>
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
