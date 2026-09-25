import React, { useState } from 'react';
import { BorrowRequest, UserProfile } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  AlertCircle, 
  Calendar, 
  Check, 
  X,
  ShieldCheck,
  Package
} from 'lucide-react';

interface ApprovalsViewProps {
  requests: BorrowRequest[];
  currentUser: UserProfile;
  onApprove: (requestId: string, comment?: string) => void;
  onReject: (requestId: string, comment: string) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  requests,
  currentUser,
  onApprove,
  onReject,
}) => {
  const [filter, setFilter] = useState<'Pending' | 'Approved' | 'Rejected' | 'all'>('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeAction, setActiveAction] = useState<{
    type: 'approve' | 'reject';
    request: BorrowRequest;
  } | null>(null);

  const [commentText, setCommentText] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = requests.filter(req => {
    const matchesFilter = filter === 'all' || req.status === filter;
    const matchesSearch = 
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = requests.filter(r => r.status === 'Pending').length;

  const handleConfirmAction = () => {
    if (!activeAction) return;
    setActionError(null);

    if (activeAction.type === 'reject' && !commentText.trim()) {
      setActionError('กรุณาระบุเหตุผลการไม่อนุมัติ เพื่อแจ้งให้ผู้ยื่นคำขอทราบทางอีเมล');
      return;
    }

    if (activeAction.type === 'approve') {
      onApprove(activeAction.request.id, commentText.trim() || undefined);
    } else {
      onReject(activeAction.request.id, commentText.trim());
    }

    setActiveAction(null);
    setCommentText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
              งานรอการอนุมัติ (IT Manager Approvals)
            </h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-700 text-white animate-pulse">
                รออนุมัติ {pendingCount} รายการ
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            พิจารณาอนุมัติหรือปฏิเสธคำขอยืมอุปกรณ์ IT ส. ขอนแก่น ระบบจะตัดยอดสต็อกและส่งอีเมลแจ้งผู้ยืมอัตโนมัติ
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 px-3 py-1.5 rounded-xl text-xs text-red-800 dark:text-red-300">
          <ShieldCheck className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0" />
          <span>สิทธิ์การอนุมัติ: <strong>{currentUser.name}</strong></span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้ยืม, แผนก, รหัสคำขอ..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto text-xs">
          {[
            { id: 'Pending', label: `รอการอนุมัติ (${pendingCount})` },
            { id: 'Approved', label: 'อนุมัติแล้ว' },
            { id: 'Rejected', label: 'ไม่อนุมัติ' },
            { id: 'all', label: 'ทั้งหมด' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800 p-12 text-center">
          <Clock className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 mb-1">ไม่มีคำขอในหมวดนี้</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">ไม่มีคำขอที่รอการพิจารณาในขณะนี้</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(req => {
            const isPending = req.status === 'Pending';
            return (
              <div
                key={req.id}
                className={`bg-white dark:bg-stone-900 rounded-2xl border p-5 shadow-xs transition-all ${
                  isPending ? 'border-red-300 dark:border-red-900/60 ring-2 ring-red-500/10' : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
                  
                  {/* Requester Identity */}
                  <div className="flex items-center space-x-3">
                    <img
                      src={req.requester.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-stone-100 dark:ring-stone-800"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">{req.requester.name}</span>
                        <span className="text-xs font-mono font-bold text-red-700 dark:text-red-400">{req.id}</span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {req.requester.department} • {req.requester.email}
                      </p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center space-x-4 text-xs bg-stone-50 dark:bg-stone-800/60 px-3.5 py-2 rounded-xl border border-stone-100 dark:border-stone-700">
                    <div className="flex items-center space-x-1.5 text-stone-600 dark:text-stone-300">
                      <Calendar className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                      <span>ยืม: <strong>{req.borrowDate}</strong> ถึง <strong>{req.returnDate}</strong></span>
                    </div>
                  </div>

                  {/* Action buttons (Pending only) */}
                  {isPending && (
                    <div className="flex items-center space-x-2 w-full lg:w-auto justify-end">
                      <button
                        onClick={() => {
                          setActiveAction({ type: 'reject', request: req });
                          setCommentText('');
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center space-x-1 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>ปฏิเสธ (Reject)</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          setActiveAction({ type: 'approve', request: req });
                          setCommentText('อนุมัติเรียบร้อย อุปกรณ์พร้อมจัดเตรียม');
                        }}
                        className="px-4 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>อนุมัติ (Approve)</span>
                      </button>
                    </div>
                  )}

                  {!isPending && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      req.status === 'Approved' ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-400' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}>
                      สถานะ: {req.status}
                    </span>
                  )}
                </div>

                {/* Items & Reason */}
                <div className="pt-3 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  <div className="md:col-span-7 space-y-1.5">
                    <span className="font-semibold text-stone-600 dark:text-stone-300 flex items-center space-x-1">
                      <Package className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                      <span>อุปกรณ์ที่ขอเบิก:</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {req.items.map(item => (
                        <div key={item.equipmentId} className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                          <img src={item.imageUrl} alt="" className="w-7 h-7 rounded-lg object-cover" />
                          <span className="font-medium text-stone-800 dark:text-stone-200">{item.equipmentName}</span>
                          <span className="font-bold text-red-700 dark:text-red-400">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-5 bg-stone-50/70 dark:bg-stone-800/40 p-3 rounded-xl border border-stone-100 dark:border-stone-800 space-y-1">
                    <span className="font-semibold text-stone-600 dark:text-stone-300 block">วัตถุประสงค์ / เหตุผลที่ขอยืม:</span>
                    <p className="text-stone-700 dark:text-stone-300 italic leading-relaxed">"{req.reason}"</p>
                  </div>
                </div>

                {/* Show approver comment if already decided */}
                {req.approver && (
                  <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs text-stone-500 dark:text-stone-400 flex items-center justify-between">
                    <span>
                      พิจารณาโดย: <strong>{req.approver.name}</strong> ({new Date(req.approver.decidedAt).toLocaleString('th-TH')})
                    </span>
                    {req.approver.comment && (
                      <span className="italic">"{req.approver.comment}"</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal (Approve or Reject) */}
      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-100 dark:border-stone-800 space-y-5">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeAction.type === 'approve' ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                }`}>
                  {activeAction.type === 'approve' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-stone-100 text-lg">
                    {activeAction.type === 'approve' ? 'ยืนยันการอนุมัติคำขอ' : 'ปฏิเสธคำขอยืมอุปกรณ์'}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    รหัสคำขอ: <span className="font-mono font-bold text-red-700 dark:text-red-400">{activeAction.request.id}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveAction(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Request Summary Box */}
            <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs space-y-1.5">
              <p><span className="text-stone-400">ผู้ขอยืม:</span> <strong>{activeAction.request.requester.name}</strong> ({activeAction.request.requester.department})</p>
              <p><span className="text-stone-400">อุปกรณ์:</span> {activeAction.request.items.map(i => `${i.equipmentName} x${i.quantity}`).join(', ')}</p>
              <p><span className="text-stone-400">กำหนดคืน:</span> <strong className="text-red-700 dark:text-red-400">{activeAction.request.returnDate}</strong></p>
            </div>

            {/* Comment Box */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                {activeAction.type === 'approve' 
                  ? 'ข้อความแนะนำหรือหมายเหตุถึงผู้ยืม (Optional):' 
                  : 'เหตุผลการไม่อนุมัติ (Required - จะถูกส่งไปยังอีเมลผู้ขอยืม):'}
              </label>
              <textarea
                rows={3}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={
                  activeAction.type === 'approve'
                    ? 'เช่น อนุมัติเรียบร้อย โปรดมารับอุปกรณ์ที่ห้อง IT ก่อน 10:00 น.'
                    : 'เช่น อุปกรณ์ไม่ว่างเนื่องจากมีทีมอื่นจองใช้งาน หรือเกินโควต้าการยืม...'
                }
                className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none leading-relaxed"
              />
            </div>

            {actionError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveAction(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                ยกเลิก
              </button>
              
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center space-x-1.5 shadow-md ${
                  activeAction.type === 'approve'
                    ? 'bg-red-700 hover:bg-red-800 shadow-red-700/20'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                }`}
              >
                {activeAction.type === 'approve' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ยืนยันอนุมัติคำขอ</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>ยืนยันปฏิเสธคำขอ</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
