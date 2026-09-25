import React, { useState } from 'react';
import { BorrowRequest, UserProfile } from '../types';
import { ExportUtils } from '../utils/exportUtils';
import { 
  ClipboardList, 
  Search, 
  FileDown, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  X,
  PackageCheck
} from 'lucide-react';

interface MyRequestsProps {
  requests: BorrowRequest[];
  currentUser: UserProfile;
  onCancelRequest: (requestId: string) => void;
  onNewRequestClick: () => void;
}

export const MyRequests: React.FC<MyRequestsProps> = ({
  requests,
  currentUser,
  onCancelRequest,
  onNewRequestClick,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);

  const myRequests = requests.filter(req => {
    if (currentUser.role === 'User') {
      return req.requester.email.toLowerCase() === currentUser.email.toLowerCase();
    }
    return true;
  });

  const filtered = myRequests.filter(req => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesSearch = 
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.items.some(i => i.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const statusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    Pending: { label: 'รออนุมัติ', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', icon: <Clock className="w-3.5 h-3.5" /> },
    Approved: { label: 'อนุมัติแล้ว (รอรับของ)', bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-800', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    InUse: { label: 'กำลังยืมใช้งาน', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800', icon: <PackageCheck className="w-3.5 h-3.5" /> },
    Returned: { label: 'ส่งคืนเรียบร้อย', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    Overdue: { label: 'เกินกำหนดส่งคืน', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    Rejected: { label: 'ไม่อนุมัติ', bg: 'bg-stone-100 dark:bg-stone-800', text: 'text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700', icon: <XCircle className="w-3.5 h-3.5" /> },
    Cancelled: { label: 'ยกเลิกแล้ว', bg: 'bg-stone-100 dark:bg-stone-800', text: 'text-stone-500 dark:text-stone-500 border-stone-200 dark:border-stone-700', icon: <X className="w-3.5 h-3.5" /> },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            คำขอของฉัน (My Requests)
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            ติดตามสถานะคำขอยืมอุปกรณ์ ประวัติการส่งคืน และดาวน์โหลดใบยืม-ส่งมอบ (PDF)
          </p>
        </div>
        <button
          onClick={onNewRequestClick}
          className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-colors shadow-sm self-start sm:self-auto"
        >
          + ยื่นคำขอใหม่
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหารหัสคำขอ หรือชื่ออุปกรณ์..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'Pending', label: 'รออนุมัติ' },
            { id: 'Approved', label: 'อนุมัติแล้ว' },
            { id: 'InUse', label: 'กำลังยืม' },
            { id: 'Returned', label: 'ส่งคืนแล้ว' },
            { id: 'Overdue', label: 'เกินกำหนด' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setFilterStatus(s.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                filterStatus === s.id
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table / Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 mb-1">ไม่พบรายการคำขอ</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">ยังไม่มีคำขอยืมอุปกรณ์ที่ตรงกับเงื่อนไขการค้นหา</p>
          <button
            onClick={onNewRequestClick}
            className="px-4 py-2 rounded-xl bg-red-700 text-white text-xs font-bold hover:bg-red-800"
          >
            ยื่นคำขอยืมตอนนี้
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(req => {
            const statusInfo = statusConfig[req.status] || statusConfig.Pending;
            const totalQty = req.items.reduce((s, i) => s + i.quantity, 0);

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs hover:border-red-200 dark:hover:border-red-900/40 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-red-700 dark:text-red-400 text-sm tracking-wide">
                      {req.id}
                    </span>
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.text}`}>
                      {statusInfo.icon}
                      <span>{statusInfo.label}</span>
                    </span>
                    <span className="text-xs text-stone-400">
                      ยื่นเมื่อ {new Date(req.createdAt).toLocaleDateString('th-TH')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {req.items.map(item => (
                      <span
                        key={item.equipmentId}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-700 dark:text-stone-300"
                      >
                        <span>{item.equipmentName}</span>
                        <span className="text-red-700 dark:text-red-400 font-bold">x{item.quantity}</span>
                      </span>
                    ))}
                    <span className="text-xs text-stone-400 ml-1">
                      (รวม {totalQty} รายการ)
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-1 italic">
                    "{req.reason}"
                  </p>
                </div>

                {/* Center Dates */}
                <div className="flex items-center space-x-4 text-xs text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/60 px-4 py-2.5 rounded-xl border border-stone-100 dark:border-stone-700 self-stretch lg:self-auto justify-between lg:justify-start">
                  <div>
                    <span className="block text-[10px] text-stone-400 font-medium">วันที่เริ่มยืม</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">{req.borrowDate}</span>
                  </div>
                  <span className="text-stone-300 dark:text-stone-600">→</span>
                  <div>
                    <span className="block text-[10px] text-stone-400 font-medium">กำหนดวันคืน</span>
                    <span className="font-bold text-red-700 dark:text-red-400">{req.returnDate}</span>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center space-x-2 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100 dark:border-stone-800">
                  <button
                    onClick={() => setSelectedRequest(req)}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center space-x-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-stone-400" />
                    <span className="hidden sm:inline">ดูรายละเอียด</span>
                  </button>

                  <button
                    onClick={() => ExportUtils.exportRequestToPDF(req)}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 text-xs font-bold flex items-center space-x-1.5 border border-red-200 dark:border-red-900/40 transition-colors"
                    title="ดาวน์โหลดใบยืม-ส่งมอบอุปกรณ์ PDF"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">พิมพ์ใบยืม (PDF)</span>
                  </button>

                  {req.status === 'Pending' && (
                    <button
                      onClick={() => {
                        if (confirm(`คุณต้องการยกเลิกคำขอ ${req.id} ใช่หรือไม่?`)) {
                          onCancelRequest(req.id);
                        }
                      }}
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="ยกเลิกคำขอนี้"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-stone-100 dark:border-stone-800 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-red-700 dark:text-red-400">{selectedRequest.id}</span>
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">รายละเอียดคำขอยืมอุปกรณ์</h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress */}
            <div className="bg-stone-50 dark:bg-stone-800/60 p-4 rounded-2xl border border-stone-200 dark:border-stone-700">
              <p className="text-xs font-bold text-stone-600 dark:text-stone-300 mb-3">ขั้นตอนการดำเนินงาน (Workflow Progress)</p>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                
                <div className="space-y-1">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-xs font-bold">
                    ✓
                  </div>
                  <p className="font-semibold text-stone-800 dark:text-stone-200">ยื่นคำขอ</p>
                  <p className="text-[10px] text-stone-400">{new Date(selectedRequest.createdAt).toLocaleDateString('th-TH')}</p>
                </div>

                <div className="space-y-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                    selectedRequest.status === 'Rejected'
                      ? 'bg-rose-500 text-white'
                      : ['Approved', 'InUse', 'Returned', 'Overdue'].includes(selectedRequest.status)
                        ? 'bg-emerald-500 text-white'
                        : selectedRequest.status === 'Pending'
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-stone-200 dark:bg-stone-700 text-stone-500'
                  }`}>
                    {selectedRequest.status === 'Rejected' ? '✕' : ['Approved', 'InUse', 'Returned', 'Overdue'].includes(selectedRequest.status) ? '✓' : '2'}
                  </div>
                  <p className="font-semibold text-stone-800 dark:text-stone-200">IT อนุมัติ</p>
                  <p className="text-[10px] text-stone-400">
                    {selectedRequest.approver?.name ? 'พิจารณาแล้ว' : 'รอการพิจารณา'}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                    ['InUse', 'Returned', 'Overdue'].includes(selectedRequest.status)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-stone-200 dark:bg-stone-700 text-stone-500'
                  }`}>
                    {['InUse', 'Returned', 'Overdue'].includes(selectedRequest.status) ? '✓' : '3'}
                  </div>
                  <p className="font-semibold text-stone-800 dark:text-stone-200">ส่งมอบอุปกรณ์</p>
                  <p className="text-[10px] text-stone-400">
                    {selectedRequest.handover ? 'รับของแล้ว' : 'รอรับอุปกรณ์'}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                    selectedRequest.status === 'Returned'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-stone-200 dark:bg-stone-700 text-stone-500'
                  }`}>
                    {selectedRequest.status === 'Returned' ? '✓' : '4'}
                  </div>
                  <p className="font-semibold text-stone-800 dark:text-stone-200">คืนอุปกรณ์</p>
                  <p className="text-[10px] text-stone-400">
                    {selectedRequest.status === 'Returned' ? 'เสร็จสิ้น' : 'รอการส่งคืน'}
                  </p>
                </div>

              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
                <span className="text-stone-400 block">ผู้ยื่นคำขอ:</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{selectedRequest.requester.name}</span>
                <span className="text-stone-500 dark:text-stone-400 block">{selectedRequest.requester.department}</span>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl">
                <span className="text-stone-400 block">ระยะเวลาการยืม:</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{selectedRequest.borrowDate} ถึง {selectedRequest.returnDate}</span>
              </div>
            </div>

            {/* Reason */}
            <div>
              <p className="text-xs font-bold text-stone-500 dark:text-stone-400 mb-1">วัตถุประสงค์ / เหตุผล:</p>
              <p className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl text-xs text-stone-800 dark:text-stone-200 leading-relaxed">
                {selectedRequest.reason}
              </p>
            </div>

            {/* Items Table */}
            <div>
              <p className="text-xs font-bold text-stone-500 dark:text-stone-400 mb-2">รายการอุปกรณ์ที่ยืม:</p>
              <div className="border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                    <tr>
                      <th className="p-2.5 font-semibold text-stone-700 dark:text-stone-300">อุปกรณ์</th>
                      <th className="p-2.5 font-semibold text-stone-700 dark:text-stone-300 text-center">จำนวน</th>
                      <th className="p-2.5 font-semibold text-stone-700 dark:text-stone-300">Serial No. / Asset Tag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {selectedRequest.items.map(item => (
                      <tr key={item.equipmentId}>
                        <td className="p-2.5 font-medium text-stone-800 dark:text-stone-200">{item.equipmentName}</td>
                        <td className="p-2.5 text-center font-bold text-red-700 dark:text-red-400">{item.quantity}</td>
                        <td className="p-2.5 font-mono text-stone-500 dark:text-stone-400">
                          {item.assetTag || 'รอ IT ระบุตอนจ่ายของ'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approver comments */}
            {selectedRequest.approver && (
              <div className="p-3 bg-red-50/60 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs">
                <span className="font-bold text-red-900 dark:text-red-300 block mb-0.5">การพิจารณาจาก IT Manager:</span>
                <p className="text-red-800 dark:text-red-400">{selectedRequest.approver.name} ({new Date(selectedRequest.approver.decidedAt).toLocaleString('th-TH')})</p>
                {selectedRequest.approver.comment && (
                  <p className="text-stone-600 dark:text-stone-400 mt-1 italic">"{selectedRequest.approver.comment}"</p>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end space-x-3 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={() => ExportUtils.exportRequestToPDF(selectedRequest)}
                className="px-4 py-2 rounded-xl bg-red-700 text-white text-xs font-bold hover:bg-red-800 flex items-center space-x-1.5 shadow-sm"
              >
                <FileDown className="w-4 h-4" />
                <span>พิมพ์ใบยืม (PDF)</span>
              </button>
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
