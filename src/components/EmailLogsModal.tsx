import React, { useState } from 'react';
import { EmailNotification } from '../types';
import { Mail, X } from 'lucide-react';

interface EmailLogsModalProps {
  emails: EmailNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

export const EmailLogsModal: React.FC<EmailLogsModalProps> = ({
  emails,
  onClose,
  onMarkRead,
}) => {
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(emails[0] || null);

  const typeBadges: Record<string, { label: string; bg: string; text: string }> = {
    NEW_REQUEST: { label: 'คำขอใหม่', bg: 'bg-red-100 dark:bg-red-950/60', text: 'text-red-800 dark:text-red-300' },
    APPROVED: { label: 'อนุมัติแล้ว', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300' },
    REJECTED: { label: 'ไม่อนุมัติ', bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-800 dark:text-rose-300' },
    HANDOVER: { label: 'ส่งมอบของ', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300' },
    RETURNED: { label: 'รับคืนสำเร็จ', bg: 'bg-teal-100 dark:bg-teal-950/60', text: 'text-teal-800 dark:text-teal-300' },
    OVERDUE_REMINDER: { label: 'แจ้งเตือนเกินกำหนด', bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-800 dark:text-rose-300' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-4xl w-full h-[85vh] shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                กล่องอีเมลแจ้งเตือนอัตโนมัติ (S. Khonkaen Email Logs)
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                บันทึกประวัติการส่งอีเมลแจ้งเตือนผู้ยืมและ IT Manager ทุกขั้นตอน
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Split */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0">
          
          {/* Left List (5 cols) */}
          <div className="md:col-span-5 border-r border-stone-100 dark:border-stone-800 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
            {emails.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs">
                ไม่มีประวัติการส่งอีเมล
              </div>
            ) : (
              emails.map(email => {
                const isSelected = selectedEmail?.id === email.id;
                const badge = typeBadges[email.type] || typeBadges.NEW_REQUEST;

                return (
                  <div
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email);
                      onMarkRead(email.id);
                    }}
                    className={`p-3.5 cursor-pointer transition-colors text-xs ${
                      isSelected 
                        ? 'bg-red-50/80 dark:bg-red-950/40 border-l-4 border-red-700' 
                        : 'hover:bg-stone-50 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(email.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="font-bold text-stone-800 dark:text-stone-200 line-clamp-1 mb-0.5">{email.subject}</p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mb-1">ถึง: {email.recipientName} ({email.to})</p>
                    <p className="text-[11px] text-stone-400 line-clamp-2">{email.preview}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Preview (7 cols) */}
          <div className="md:col-span-7 p-6 overflow-y-auto bg-white dark:bg-stone-900 flex flex-col justify-between">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="pb-3 border-b border-stone-100 dark:border-stone-800">
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 leading-snug">{selectedEmail.subject}</h3>
                  <div className="mt-2 text-xs text-stone-600 dark:text-stone-400 space-y-0.5">
                    <p><strong>ผู้รับ:</strong> {selectedEmail.recipientName} &lt;{selectedEmail.to}&gt;</p>
                    <p><strong>วัน-เวลา:</strong> {new Date(selectedEmail.timestamp).toLocaleString('th-TH')}</p>
                    <p><strong>รหัสอ้างอิง:</strong> <span className="font-mono font-bold text-red-700 dark:text-red-400">{selectedEmail.requestId}</span></p>
                  </div>
                </div>

                <div 
                  className="prose prose-sm max-w-none text-xs text-stone-700 dark:text-stone-300 bg-stone-50/70 dark:bg-stone-800/50 p-4 rounded-2xl border border-stone-100 dark:border-stone-800"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                />
              </div>
            ) : (
              <div className="text-center py-20 text-stone-400 text-xs">
                เลือกอีเมลทางด้านซ้ายเพื่อดูรายละเอียด
              </div>
            )}

            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
              <span>Microsoft 365 Exchange Online (S. Khonkaen)</span>
              <span>สถานะ: Delivered (สำเร็จ)</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
