import React, { useState } from 'react';
import { BorrowRequest, Equipment, UserProfile, UserRole } from '../types';
import { ExportUtils } from '../utils/exportUtils';
import { 
  BarChart3, 
  Package, 
  Users, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers, 
  X, 
  Search,
  RotateCcw
} from 'lucide-react';

interface AdminDashboardProps {
  requests: BorrowRequest[];
  equipmentList: Equipment[];
  users: UserProfile[];
  currentUser: UserProfile;
  onUpdateEquipment: (item: Equipment) => void;
  onAddEquipment: (item: Equipment) => void;
  onDeleteEquipment: (id: string) => void;
  onHandover: (requestId: string, handedBy: string, assetTags: Record<string, string>, notes?: string) => void;
  onReturn: (requestId: string, receivedBy: string, condition: 'Good' | 'Damaged' | 'Incomplete', notes?: string) => void;
  onUpdateUserRole: (userId: string, role: UserRole) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  requests,
  equipmentList,
  users,
  currentUser,
  onUpdateEquipment,
  onAddEquipment,
  onDeleteEquipment,
  onHandover,
  onReturn,
  onUpdateUserRole,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'handover' | 'users'>('overview');
  const [searchEquipment, setSearchEquipment] = useState('');

  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isNewEquipment, setIsNewEquipment] = useState(false);

  const [handoverModalReq, setHandoverModalReq] = useState<BorrowRequest | null>(null);
  const [assetTagInputs, setAssetTagInputs] = useState<Record<string, string>>({});

  const [returnModalReq, setReturnModalReq] = useState<BorrowRequest | null>(null);
  const [returnCondition, setReturnCondition] = useState<'Good' | 'Damaged' | 'Incomplete'>('Good');
  const [returnNotes, setReturnNotes] = useState('');

  const totalRequests = requests.length;
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const inUseCount = requests.filter(r => r.status === 'InUse').length;
  const overdueCount = requests.filter(r => r.status === 'Overdue').length;
  const returnedCount = requests.filter(r => r.status === 'Returned').length;

  const equipmentUsageCount: Record<string, number> = {};
  requests.forEach(r => {
    r.items.forEach(i => {
      equipmentUsageCount[i.equipmentName] = (equipmentUsageCount[i.equipmentName] || 0) + i.quantity;
    });
  });

  const sortedPopularEquipment = Object.entries(equipmentUsageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const handleSaveEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment) return;

    if (isNewEquipment) {
      onAddEquipment(editingEquipment);
    } else {
      onUpdateEquipment(editingEquipment);
    }
    setEditingEquipment(null);
  };

  const handleConfirmHandover = () => {
    if (!handoverModalReq) return;
    onHandover(handoverModalReq.id, currentUser.name, assetTagInputs);
    setHandoverModalReq(null);
    setAssetTagInputs({});
  };

  const handleConfirmReturn = () => {
    if (!returnModalReq) return;
    onReturn(returnModalReq.id, currentUser.name, returnCondition, returnNotes);
    setReturnModalReq(null);
    setReturnNotes('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      
      {/* Top Banner & Export Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            ระบบหลังบ้าน (Admin &amp; Audit Management)
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            สรุปภาพรวมการยืม-คืน, จัดการสต็อกอุปกรณ์ ส. ขอนแก่น ใน SharePoint List, ส่งมอบ-รับคืน, และกำหนดสิทธิ์
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => ExportUtils.exportToExcel(requests)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
            title="ส่งออกข้อมูลเป็น Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => ExportUtils.exportToCSV(requests)}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 dark:bg-stone-800 dark:hover:bg-stone-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all border border-stone-700"
            title="ส่งออกข้อมูลเป็น CSV (UTF-8 BOM)"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-stone-200 dark:border-stone-800 pb-3 mb-6 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-colors ${
            activeTab === 'overview'
              ? 'bg-red-700 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard สรุปข้อมูล</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-colors ${
            activeTab === 'inventory'
              ? 'bg-red-700 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>จัดการสต็อกอุปกรณ์ ({equipmentList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('handover')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-colors ${
            activeTab === 'handover'
              ? 'bg-red-700 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>ส่งมอบ &amp; รับคืนอุปกรณ์</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-colors ${
            activeTab === 'users'
              ? 'bg-red-700 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>กำหนดสิทธิ์ใช้งาน (RBAC)</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">คำขอทั้งหมด</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100">{totalRequests}</span>
                <span className="text-xs text-red-700 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full">รายการ</span>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
              <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">รอการอนุมัติ</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{pendingCount}</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
              <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">กำลังยืมใช้งาน</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-black text-red-700 dark:text-red-400">{inUseCount}</span>
                <Package className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
              <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">เกินกำหนดส่งคืน</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">{overdueCount}</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs col-span-2 lg:col-span-1">
              <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider block">ส่งคืนสำเร็จ</span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{returnedCount}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </div>

          {/* Popular Equipment & Recent Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-5 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center justify-between">
                <span>อุปกรณ์ที่มีการยืมใช้งานสูงสุด</span>
                <Layers className="w-4 h-4 text-stone-400" />
              </h3>

              <div className="space-y-3">
                {sortedPopularEquipment.map(([name, count], index) => {
                  const maxVal = sortedPopularEquipment[0][1] || 1;
                  const pct = Math.round((count / maxVal) * 100);

                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center space-x-2">
                          <span className="w-4 text-stone-400 font-mono text-[11px]">#{index + 1}</span>
                          <span>{name}</span>
                        </span>
                        <span className="font-bold text-red-700 dark:text-red-400">{count} ครั้ง</span>
                      </div>
                      <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-700 to-rose-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-7 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">รายการคำขอล่าสุดในระบบ</h3>
                <span className="text-xs text-stone-400">{requests.length} คำขอ</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-semibold border-b border-stone-100 dark:border-stone-700">
                    <tr>
                      <th className="p-2">รหัส</th>
                      <th className="p-2">ผู้ยืม</th>
                      <th className="p-2">อุปกรณ์</th>
                      <th className="p-2">สถานะ</th>
                      <th className="p-2 text-right">PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {requests.slice(0, 6).map(req => (
                      <tr key={req.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40">
                        <td className="p-2 font-mono font-bold text-red-700 dark:text-red-400">{req.id}</td>
                        <td className="p-2">
                          <p className="font-medium text-stone-800 dark:text-stone-200">{req.requester.name}</p>
                          <p className="text-[10px] text-stone-400">{req.requester.department}</p>
                        </td>
                        <td className="p-2 text-stone-600 dark:text-stone-300">
                          {req.items.map(i => i.equipmentName).join(', ')}
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'Approved' ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400' :
                            req.status === 'InUse' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400' :
                            req.status === 'Returned' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400' :
                            req.status === 'Overdue' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400' :
                            'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          <button
                            onClick={() => ExportUtils.exportRequestToPDF(req)}
                            className="p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300"
                            title="Print PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY & STOCK MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาอุปกรณ์เพื่อจัดการสต็อก..."
                value={searchEquipment}
                onChange={e => setSearchEquipment(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>

            <button
              onClick={() => {
                setIsNewEquipment(true);
                setEditingEquipment({
                  id: `eq-${Date.now()}`,
                  name: '',
                  nameTh: '',
                  category: 'accessories',
                  imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600',
                  totalQuantity: 5,
                  availableQuantity: 5,
                  description: '',
                  isActive: true,
                  model: '',
                  location: 'ตู้เก็บอุปกรณ์ IT ส. ขอนแก่น ชั้น 3',
                });
              }}
              className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มอุปกรณ์ใหม่ (Add Equipment)</span>
            </button>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-bold">
                <tr>
                  <th className="p-3">รูปภาพ</th>
                  <th className="p-3">ชื่ออุปกรณ์ (Catalog Item)</th>
                  <th className="p-3">หมวดหมู่</th>
                  <th className="p-3 text-center">คงเหลือ / ทั้งหมด</th>
                  <th className="p-3">สถานที่เก็บ</th>
                  <th className="p-3 text-center">สถานะใช้งาน</th>
                  <th className="p-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {equipmentList
                  .filter(e => e.name.toLowerCase().includes(searchEquipment.toLowerCase()) || e.nameTh.toLowerCase().includes(searchEquipment.toLowerCase()))
                  .map(eq => (
                    <tr key={eq.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40">
                      <td className="p-3">
                        <img src={eq.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover ring-1 ring-stone-200 dark:ring-stone-700" />
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">{eq.name}</p>
                        <p className="text-stone-500 dark:text-stone-400 text-xs">{eq.nameTh}</p>
                        {eq.model && <p className="text-[10px] text-red-700 dark:text-red-400 font-mono mt-0.5">{eq.model}</p>}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[11px] font-medium">
                          {eq.category}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          eq.availableQuantity <= 1 ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {eq.availableQuantity} / {eq.totalQuantity}
                        </span>
                      </td>
                      <td className="p-3 text-stone-500 dark:text-stone-400 text-xs">
                        {eq.location || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onUpdateEquipment({ ...eq, isActive: !eq.isActive })}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-colors ${
                            eq.isActive ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400' : 'bg-stone-200 dark:bg-stone-700 text-stone-500'
                          }`}
                        >
                          {eq.isActive ? 'เปิดให้ยืม' : 'ปิดชั่วคราว'}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => {
                              setIsNewEquipment(false);
                              setEditingEquipment(eq);
                            }}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                            title="แก้ไขสต็อก/ข้อมูล"
                          >
                            <Edit3 className="w-4 h-4 text-red-700 dark:text-red-400" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`คุณต้องการลบ ${eq.name} ออกจากระบบใช่หรือไม่?`)) {
                                onDeleteEquipment(eq.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-stone-400 hover:text-rose-600"
                            title="ลบอุปกรณ์"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 3: PHYSICAL HANDOVER & RETURN */}
      {activeTab === 'handover' && (
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-4 rounded-2xl text-xs text-red-900 dark:text-red-300 flex items-center justify-between">
            <span>
              <strong>ฝ่าย IT ส่งมอบและรับคืน:</strong> เมื่อคำขอได้รับการอนุมัติแล้ว เจ้าหน้าที่ IT สามารถกด "ส่งมอบ (Handover)" พร้อมบันทึก Serial No. และเมื่อผู้ยืมนำของมาคืน สามารถกด "ตรวจรับคืน (Return)" เพื่อคืนยอดสต็อกกลับเข้าระบบ
            </span>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-bold">
                <tr>
                  <th className="p-3">รหัสคำขอ</th>
                  <th className="p-3">ผู้ยืม</th>
                  <th className="p-3">รายการอุปกรณ์</th>
                  <th className="p-3">วันที่เริ่มยืม - กำหนดคืน</th>
                  <th className="p-3">สถานะ</th>
                  <th className="p-3 text-right">การจัดการส่งมอบ/รับคืน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40">
                    <td className="p-3 font-mono font-bold text-red-700 dark:text-red-400">{req.id}</td>
                    <td className="p-3">
                      <p className="font-bold text-stone-800 dark:text-stone-200">{req.requester.name}</p>
                      <p className="text-stone-400 text-[10px]">{req.requester.department}</p>
                    </td>
                    <td className="p-3">
                      {req.items.map(i => (
                        <span key={i.equipmentId} className="inline-block mr-1.5 px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-[11px] text-stone-700 dark:text-stone-300">
                          {i.equipmentName} x{i.quantity}
                        </span>
                      ))}
                    </td>
                    <td className="p-3 text-stone-600 dark:text-stone-300">
                      {req.borrowDate} → <span className="font-bold text-red-700 dark:text-red-400">{req.returnDate}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        req.status === 'Approved' ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-400' :
                        req.status === 'InUse' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400' :
                        req.status === 'Returned' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400' :
                        req.status === 'Overdue' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400' :
                        'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {req.status === 'Approved' && (
                        <button
                          onClick={() => {
                            setHandoverModalReq(req);
                            const defaults: Record<string, string> = {};
                            req.items.forEach(i => {
                              defaults[i.equipmentId] = `${i.equipmentName.slice(0, 3).toUpperCase()}-SKK-${Math.floor(100 + Math.random() * 900)}`;
                            });
                            setAssetTagInputs(defaults);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs"
                        >
                          ส่งมอบ (Handover)
                        </button>
                      )}

                      {(req.status === 'InUse' || req.status === 'Overdue') && (
                        <button
                          onClick={() => setReturnModalReq(req)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                        >
                          ตรวจรับคืน (Mark Return)
                        </button>
                      )}

                      {req.status === 'Returned' && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>คืนแล้ว</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ROLE-BASED ACCESS CONTROL (RBAC) */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mb-1">
              ระบบกำหนดสิทธิ์การใช้งาน (Role-Based Access Control)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              กำหนดบทบาทของผู้ใช้ในองค์กร ส. ขอนแก่น เพื่อจำกัดการเข้าถึงหน้าอนุมัติ สต็อก และการส่งออกข้อมูล
            </p>

            <div className="border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-bold">
                  <tr>
                    <th className="p-3">ผู้ใช้งาน (M365 User)</th>
                    <th className="p-3">แผนก (Department)</th>
                    <th className="p-3">สิทธิ์ปัจจุบัน (Role)</th>
                    <th className="p-3 text-right">เปลี่ยนสิทธิ์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                      <td className="p-3 flex items-center space-x-3">
                        <img src={u.avatar} alt="" className="w-9 h-9 rounded-xl object-cover" />
                        <div>
                          <p className="font-bold text-stone-800 dark:text-stone-200">{u.name}</p>
                          <p className="text-stone-400 text-[11px]">{u.email}</p>
                        </div>
                      </td>
                      <td className="p-3 text-stone-600 dark:text-stone-400">{u.department}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          u.role === 'Approver' ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-400' :
                          u.role === 'Admin' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400' :
                          u.role === 'Audit' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-400' :
                          'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <select
                          value={u.role}
                          onChange={e => onUpdateUserRole(u.id, e.target.value as UserRole)}
                          className="px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 outline-none focus:ring-2 focus:ring-red-500/20"
                        >
                          <option value="User">User (ผู้ยืมทั่วไป)</option>
                          <option value="Approver">Approver (IT Manager)</option>
                          <option value="Admin">Admin (ผู้ดูแลระบบ/จ่ายของ)</option>
                          <option value="Audit">Audit (ดูรายงาน &amp; Export)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* Equipment Add/Edit Modal */}
      {editingEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-100 dark:border-stone-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-lg">
                {isNewEquipment ? 'เพิ่มอุปกรณ์ใหม่เข้าสต็อก ส. ขอนแก่น' : 'แก้ไขข้อมูลอุปกรณ์ & สต็อก'}
              </h3>
              <button onClick={() => setEditingEquipment(null)} className="p-1 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEquipment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">ชื่ออุปกรณ์ (English):</label>
                <input
                  required
                  type="text"
                  value={editingEquipment.name}
                  onChange={e => setEditingEquipment({ ...editingEquipment, name: e.target.value })}
                  placeholder="เช่น Mouse, Keyboard, Poly, Monitor"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-red-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">ชื่อภาษาไทย / รายละเอียดสั้น:</label>
                <input
                  required
                  type="text"
                  value={editingEquipment.nameTh}
                  onChange={e => setEditingEquipment({ ...editingEquipment, nameTh: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-red-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">หมวดหมู่ (Category):</label>
                  <select
                    value={editingEquipment.category}
                    onChange={e => setEditingEquipment({ ...editingEquipment, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs outline-none"
                  >
                    <option value="accessories">อุปกรณ์ต่อพ่วง (Accessories)</option>
                    <option value="display">จอภาพ &amp; ทีวี (Display)</option>
                    <option value="conference">ระบบห้องประชุม (Conference)</option>
                    <option value="computer">คอมพิวเตอร์ (Computer)</option>
                    <option value="camera_video">กล้อง &amp; Live (Camera/Video)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">รุ่น / โมเดล (Model):</label>
                  <input
                    type="text"
                    value={editingEquipment.model || ''}
                    onChange={e => setEditingEquipment({ ...editingEquipment, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">จำนวนทั้งหมดในคลัง (Total):</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={editingEquipment.totalQuantity}
                    onChange={e => {
                      const total = parseInt(e.target.value) || 0;
                      setEditingEquipment({ 
                        ...editingEquipment, 
                        totalQuantity: total,
                        availableQuantity: Math.min(editingEquipment.availableQuantity, total)
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">จำนวนที่ว่างให้ยืม (Available):</label>
                  <input
                    required
                    type="number"
                    min="0"
                    max={editingEquipment.totalQuantity}
                    value={editingEquipment.availableQuantity}
                    onChange={e => setEditingEquipment({ ...editingEquipment, availableQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs outline-none font-bold text-emerald-600 dark:text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">รูปภาพอุปกรณ์ (Image URL):</label>
                <input
                  type="text"
                  value={editingEquipment.imageUrl}
                  onChange={e => setEditingEquipment({ ...editingEquipment, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">สถานที่จัดเก็บ (Storage Location):</label>
                <input
                  type="text"
                  value={editingEquipment.location || ''}
                  onChange={e => setEditingEquipment({ ...editingEquipment, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingEquipment(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-50 dark:hover:bg-stone-800"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-md shadow-red-700/20"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Handover Modal */}
      {handoverModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-100 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">บันทึกการส่งมอบอุปกรณ์ (Handover)</h3>
              <button onClick={() => setHandoverModalReq(null)} className="p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-50 dark:bg-red-950/40 p-3 rounded-xl text-xs text-red-900 dark:text-red-300">
              <p>ผู้รับมอบ: <strong>{handoverModalReq.requester.name}</strong> ({handoverModalReq.requester.department})</p>
              <p>กำหนดคืน: <strong className="text-red-700 dark:text-red-400">{handoverModalReq.returnDate}</strong></p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-stone-700 dark:text-stone-300 block">ระบุ Serial Number หรือ Asset Tag ที่ส่งมอบ:</label>
              {handoverModalReq.items.map(item => (
                <div key={item.equipmentId} className="flex items-center space-x-2">
                  <span className="w-40 font-medium text-stone-800 dark:text-stone-200 truncate">{item.equipmentName}:</span>
                  <input
                    type="text"
                    value={assetTagInputs[item.equipmentId] || ''}
                    onChange={e => setAssetTagInputs({ ...assetTagInputs, [item.equipmentId]: e.target.value })}
                    placeholder="เช่น SKK-NB-2026-001"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono text-xs outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={() => setHandoverModalReq(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmHandover}
                className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold"
              >
                ยืนยันส่งมอบอุปกรณ์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returnModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-100 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base">ตรวจรับคืนอุปกรณ์ (Return Inspection)</h3>
              <button onClick={() => setReturnModalReq(null)} className="p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl text-xs text-emerald-900 dark:text-emerald-300">
              <p>ผู้ส่งคืน: <strong>{returnModalReq.requester.name}</strong></p>
              <p>อุปกรณ์: {returnModalReq.items.map(i => `${i.equipmentName} (${i.quantity})`).join(', ')}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">ผลการตรวจสภาพอุปกรณ์:</label>
                <div className="flex space-x-2">
                  {[
                    { id: 'Good', label: '✅ สภาพสมบูรณ์ปกติ' },
                    { id: 'Damaged', label: '⚠️ ชำรุด/มีรอยเสียหาย' },
                    { id: 'Incomplete', label: '❌ อุปกรณ์ไม่ครบ' },
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setReturnCondition(c.id as any)}
                      className={`flex-1 py-2 px-2 rounded-xl font-bold border text-center transition-colors ${
                        returnCondition === c.id 
                          ? 'bg-red-700 text-white border-red-700' 
                          : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">บันทึกเพิ่มเติม (Notes):</label>
                <textarea
                  rows={2}
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  placeholder="เช่น ตรวจสอบอุปกรณ์ครบถ้วน ทำความสะอาดเรียบร้อย..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                onClick={() => setReturnModalReq(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmReturn}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                บันทึกการรับคืน (คืนยอดเข้าสต็อก)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
