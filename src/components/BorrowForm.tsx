import React, { useState } from 'react';
import { Equipment, BorrowItemSelection, UserProfile, LocationType } from '../types';
import { 
  Plus, 
  Minus, 
  Check, 
  Calendar, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Sparkles, 
  ShoppingBag, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Building, 
  Wrench, 
  Info, 
  Layers, 
  MapPin, 
  Clock, 
  Award,
  ChevronRight
} from 'lucide-react';

interface BorrowFormProps {
  equipmentList: Equipment[];
  currentUser: UserProfile;
  onSubmit: (formData: {
    items: BorrowItemSelection[];
    reason: string;
    borrowDate: string;
    returnDate: string;
    phone?: string;
    locationType?: LocationType;
    roomOrPlace?: string;
    needSetupSupport?: boolean;
    specialInstructions?: string;
  }) => void;
  onViewMyRequests: () => void;
}

export const BorrowForm: React.FC<BorrowFormProps> = ({
  equipmentList,
  currentUser,
  onSubmit,
  onViewMyRequests,
}) => {
  // Step state: 1 = เลือกอุปกรณ์, 2 = ข้อมูล & กำหนดการ, 3 = ตรวจสอบและยืนยัน
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Equipment Selection
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Step 2: Schedule & Details
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const afterTomorrow = new Date();
  afterTomorrow.setDate(afterTomorrow.getDate() + 3);

  const [borrowDate, setBorrowDate] = useState(tomorrow.toISOString().slice(0, 10));
  const [returnDate, setReturnDate] = useState(afterTomorrow.toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [phone, setPhone] = useState('081-234-5678');

  // Extensible fields
  const [locationType, setLocationType] = useState<LocationType>('MeetingRoom');
  const [roomOrPlace, setRoomOrPlace] = useState('ห้องประชุมใหญ่ ชั้น 4 (Boardroom)');
  const [needSetupSupport, setNeedSetupSupport] = useState(false);
  const [needExtensionCord, setNeedExtensionCord] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Step 3: Terms Agreement
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [successReqId, setSuccessReqId] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  // Quick suggestion chips
  const reasonSuggestions = [
    'ใช้ในการนำเสนองานประชุมร่วมกับลูกค้า',
    'จัดงานสัมมนา / กิจกรรม Townhall ประจำเดือน',
    'บันทึกภาพถ่ายและถ่ายทอดสด Live Streaming',
    'ใช้ปฏิบัติงานนอกสถานที่ / Work From Site',
    'ใช้งานทดแทนคอมพิวเตอร์ประจำที่กำลังส่งซ่อม',
  ];

  const meetingRooms = [
    'ห้องประชุมใหญ่ ชั้น 4 (Boardroom)',
    'ห้องประชุม AV Room ชั้น 2',
    'ห้องประชุมย่อย 301 (Meeting Room 301)',
    'ห้องประชุมย่อย 302 (Meeting Room 302)',
    'ห้อง Townhall Hall ชั้น 1',
    'พื้นที่ส่วนกลาง Co-Working Space',
  ];

  // Quantity Handlers
  const handleToggleOrAdd = (eq: Equipment) => {
    if (eq.availableQuantity <= 0) return;
    setSelectedItems(prev => {
      const current = prev[eq.id] || 0;
      if (current === 0) {
        return { ...prev, [eq.id]: 1 };
      } else {
        const copy = { ...prev };
        delete copy[eq.id];
        return copy;
      }
    });
  };

  const handleUpdateQty = (eq: Equipment, delta: number) => {
    setSelectedItems(prev => {
      const current = prev[eq.id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[eq.id];
        return copy;
      }
      if (next > eq.availableQuantity) return prev;
      return { ...prev, [eq.id]: next };
    });
  };

  // Filtered equipment list
  const filteredEquipment = equipmentList.filter(item => {
    if (!item.isActive) return false;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameTh.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.model && item.model.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const calcDays = () => {
    if (!borrowDate || !returnDate) return 0;
    const start = new Date(borrowDate);
    const end = new Date(returnDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : -1;
  };

  const daysCount = calcDays();

  const selectedList: BorrowItemSelection[] = Object.entries(selectedItems).map(([id, qty]) => {
    const eq = equipmentList.find(e => e.id === id)!;
    return {
      equipmentId: eq.id,
      equipmentName: eq.name,
      category: eq.category,
      quantity: qty,
      imageUrl: eq.imageUrl,
    };
  });

  const totalSelectedQty = selectedList.reduce((sum, item) => sum + item.quantity, 0);

  const goToNextStep = () => {
    setStepError(null);
    if (currentStep === 1) {
      if (selectedList.length === 0) {
        setStepError('กรุณาเลือกอุปกรณ์ที่ต้องการยืมอย่างน้อย 1 รายการก่อนดำเนินการต่อ');
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      if (!reason.trim()) {
        setStepError('กรุณาระบุวัตถุประสงค์หรือเหตุผลในการขอยืม');
        return;
      }
      if (daysCount < 0) {
        setStepError('วันที่คืนต้องไม่น้อยกว่าวันที่เริ่มยืม');
        return;
      }
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevStep = () => {
    setStepError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);

    if (!agreeTerms) {
      setStepError('กรุณายอมรับเงื่อนไขและข้อตกลงการใช้งานอุปกรณ์');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      try {
        const fullInstructions = [
          needSetupSupport ? '• ต้องการให้ IT ช่วย Setup อุปกรณ์' : '',
          needExtensionCord ? '• ขอปลั๊กพ่วงไฟฟ้าเพิ่มเติม' : '',
          specialInstructions ? `• ${specialInstructions}` : '',
        ].filter(Boolean).join('\n');

        onSubmit({
          items: selectedList,
          reason,
          borrowDate,
          returnDate,
          phone,
          locationType,
          roomOrPlace: locationType === 'MeetingRoom' ? roomOrPlace : undefined,
          needSetupSupport,
          specialInstructions: fullInstructions || undefined,
        });

        const newId = `REQ-${new Date().toISOString().slice(0, 7).replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`;
        setSuccessReqId(newId);
        setSubmitting(false);
      } catch (err) {
        setSubmitting(false);
        setStepError('เกิดข้อผิดพลาดในการส่งคำขอ โปรดลองใหม่อีกครั้ง');
      }
    }, 600);
  };

  const steps = [
    { number: 1, title: 'เลือกอุปกรณ์', subtitle: 'Catalog & Quantities' },
    { number: 2, title: 'รายละเอียด & วันที่ยืม', subtitle: 'Schedule & Place' },
    { number: 3, title: 'ตรวจสอบ & ยืนยัน', subtitle: 'Review & Submit' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
      
      {/* S.Khonkaen Inspired Corporate Hero Banner */}
      <div className="bg-gradient-to-r from-red-800 via-rose-900 to-stone-900 dark:from-stone-950 dark:via-red-950 dark:to-stone-950 rounded-3xl p-6 sm:p-9 text-white shadow-xl shadow-red-950/20 mb-8 relative overflow-hidden border border-red-700/30 dark:border-stone-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md text-amber-300 text-xs font-bold mb-3 border border-amber-400/20">
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>ส. ขอนแก่น IT Service Portal • Step-by-Step System</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2 font-sans">
            แบบฟอร์มการยืมอุปกรณ์ IT
          </h1>
          <p className="text-xs sm:text-sm text-stone-200 dark:text-stone-300 leading-relaxed max-w-2xl font-normal">
            บริการขอยืมอุปกรณ์คอมพิวเตอร์และโสตทัศนูปกรณ์สำหรับพนักงานในเครือ ส. ขอนแก่น
            กรอกข้อมูลตาม 3 ขั้นตอน เพื่อส่งคำขอให้ IT Manager พิจารณาอนุมัติ
          </p>
        </div>

        {/* Decorative S. emblem watermark in background */}
        <div className="absolute right-4 -bottom-6 text-white/5 dark:text-white/5 text-[180px] font-serif font-black select-none pointer-events-none">
          ส.
        </div>
      </div>

      {/* Stepper Progress Bar (Sorkon & Dark Theme) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-6 mb-8 shadow-xs transition-colors duration-200">
        <div className="grid grid-cols-3 gap-2 relative">
          
          {/* Connector Line behind steps */}
          <div className="absolute top-1/2 left-12 right-12 -translate-y-1/2 h-1 bg-stone-100 dark:bg-stone-800 -z-0 hidden sm:block">
            <div 
              className="h-full bg-red-700 dark:bg-red-600 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {steps.map(step => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;

            return (
              <div
                key={step.number}
                onClick={() => {
                  if (step.number < currentStep) {
                    setCurrentStep(step.number);
                  }
                }}
                className={`flex flex-col items-center text-center relative z-10 ${
                  step.number < currentStep ? 'cursor-pointer' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-200 mb-2 shadow-sm ${
                    isCompleted
                      ? 'bg-red-700 dark:bg-red-600 text-white'
                      : isCurrent
                        ? 'bg-red-700 dark:bg-red-600 text-white ring-4 ring-red-100 dark:ring-red-950/60 shadow-md'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-400 border border-stone-200 dark:border-stone-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : step.number}
                </div>
                <p className={`text-xs sm:text-sm font-bold transition-colors ${
                  isCurrent 
                    ? 'text-red-700 dark:text-red-400 font-extrabold' 
                    : isCompleted 
                      ? 'text-stone-800 dark:text-stone-200' 
                      : 'text-stone-400 dark:text-stone-500'
                }`}>
                  {step.title}
                </p>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 hidden sm:block">{step.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {stepError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{stepError}</span>
        </div>
      )}

      {/* Success Modal */}
      {successReqId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-stone-100 dark:border-stone-800">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100 mb-1">ส่งคำขอยืมสำเร็จ!</h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-4">
              ระบบได้ส่งคำขอไปยัง <strong>IT Manager</strong> เรียบร้อยแล้ว พร้อมส่งอีเมลแจ้งเตือนถึงท่าน
            </p>
            <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-2xl p-4 mb-6">
              <p className="text-xs text-stone-400 font-medium">รหัสคำขอของคุณ</p>
              <p className="text-xl font-mono font-bold text-red-700 dark:text-red-400 tracking-wider mt-0.5">{successReqId}</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2">
                สถานะปัจจุบัน: <span className="text-amber-600 dark:text-amber-400 font-semibold">รอการอนุมัติ (Pending Approval)</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setSuccessReqId(null);
                  setCurrentStep(1);
                  setSelectedItems({});
                  setReason('');
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                ยื่นคำขอใหม่
              </button>
              <button
                onClick={() => {
                  setSuccessReqId(null);
                  onViewMyRequests();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-md shadow-red-700/20 flex items-center justify-center space-x-1"
              >
                <span>ดูสถานะคำขอ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: เลือกอุปกรณ์ (EQUIPMENT CATALOG & MULTI-SELECT)                   */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Search & Category Filter */}
          <div className="bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาอุปกรณ์ (เช่น Mouse, Notebook, Poly, HDMI)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                />
              </div>
              
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
                {[
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'accessories', label: 'อุปกรณ์ต่อพ่วง' },
                  { id: 'display', label: 'จอภาพ & ทีวี' },
                  { id: 'conference', label: 'ระบบห้องประชุม' },
                  { id: 'computer', label: 'คอมพิวเตอร์' },
                  { id: 'camera_video', label: 'กล้อง & Live' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                      categoryFilter === cat.id
                        ? 'bg-red-700 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Equipment Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                <span>เลือกอุปกรณ์ที่ต้องการยืม (เลือกได้มากกว่า 1 รายการ)</span>
                <span className="text-xs font-normal text-stone-500 dark:text-stone-400">({filteredEquipment.length} รายการ)</span>
              </h2>
              {totalSelectedQty > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50 animate-in fade-in">
                  เลือกแล้ว {totalSelectedQty} ชิ้น
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipment.map(eq => {
                const qty = selectedItems[eq.id] || 0;
                const isSelected = qty > 0;
                const isOutOfStock = eq.availableQuantity <= 0;

                return (
                  <div
                    key={eq.id}
                    className={`group relative bg-white dark:bg-stone-900 rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col ${
                      isSelected 
                        ? 'border-red-600 ring-2 ring-red-600/20 shadow-md' 
                        : isOutOfStock
                          ? 'border-stone-200 dark:border-stone-800 opacity-60 bg-stone-50/50 dark:bg-stone-800/30'
                          : 'border-stone-200 dark:border-stone-800 hover:border-red-300 dark:hover:border-red-900/60 hover:shadow-md'
                    }`}
                  >
                    <div className="relative h-44 w-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      <img
                        src={eq.imageUrl}
                        alt={eq.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      
                      <div className="absolute top-2.5 left-2.5">
                        {isOutOfStock ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-600 text-white shadow-xs">
                            ของหมดชั่วคราว
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-stone-900/85 backdrop-blur-md text-white shadow-xs">
                            ว่าง {eq.availableQuantity} / {eq.totalQuantity} ชิ้น
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-red-700 text-white flex items-center justify-center shadow-md animate-in zoom-in-75">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-stone-900 dark:text-stone-100 text-base leading-snug group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
                          {eq.name}
                        </h3>
                        <p className="text-xs text-stone-600 dark:text-stone-400 font-medium mb-1.5">{eq.nameTh}</p>
                        <p className="text-[12px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                          {eq.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                        {isSelected ? (
                          <div className="flex items-center justify-between w-full bg-red-50/70 dark:bg-red-950/40 rounded-xl p-1 border border-red-200 dark:border-red-900/50">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(eq, -1)}
                              className="w-8 h-8 rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center justify-center shadow-xs"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <div className="text-center px-2">
                              <span className="font-bold text-red-700 dark:text-red-400 text-sm">{qty}</span>
                              <span className="text-[10px] text-stone-500 dark:text-stone-400 ml-1">ชิ้น</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(eq, 1)}
                              disabled={qty >= eq.availableQuantity}
                              className="w-8 h-8 rounded-lg bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 disabled:opacity-40 flex items-center justify-center shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => handleToggleOrAdd(eq)}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                              isOutOfStock
                                ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                                : 'bg-red-700 hover:bg-red-800 text-white shadow-xs'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{isOutOfStock ? 'ไม่พร้อมใช้งาน' : 'เลือกอุปกรณ์นี้'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Bottom Action Bar for Step 1 */}
          <div className="sticky bottom-4 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-stone-500 dark:text-stone-400">รายการที่เลือกขณะนี้</p>
                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {totalSelectedQty > 0 ? `${totalSelectedQty} ชิ้น (${selectedList.length} รายการ)` : 'ยังไม่ได้เลือกอุปกรณ์'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={goToNextStep}
              disabled={selectedList.length === 0}
              className="py-3 px-6 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md shadow-red-700/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span>ขั้นตอนถัดไป: ระบุข้อมูลการยืม</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: รายละเอียด & กำหนดการ (SCHEDULE, LOCATION & EXPANDABLE OPTIONS)   */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 8 Cols */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Dates Box */}
              <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-red-700 dark:text-red-400" />
                  <span>กำหนดการยืม - ส่งคืนอุปกรณ์</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                      วันที่เริ่มยืม (Borrowing Date) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={borrowDate}
                      onChange={e => setBorrowDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                      วันที่ต้องคืน (Date Of Return) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={returnDate}
                      onChange={e => setReturnDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none"
                    />
                  </div>
                </div>

                <div className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                  daysCount >= 0 
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50' 
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-100'
                }`}>
                  <span className="flex items-center space-x-1.5 font-medium">
                    <Clock className="w-4 h-4" />
                    <span>ระยะเวลาการยืมใช้งาน:</span>
                  </span>
                  <span className="font-bold text-sm">
                    {daysCount >= 0 ? `${daysCount + 1} วัน (รวมวันรับและคืน)` : 'วันที่ไม่ถูกต้อง'}
                  </span>
                </div>
              </div>

              {/* Reason / Detail Box */}
              <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
                <label className="block text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-red-700 dark:text-red-400" />
                  <span>Detail (ระบุเหตุผล / วัตถุประสงค์ในการยืม) <span className="text-rose-500">*</span></span>
                </label>

                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="ระบุเหตุผลความจำเป็น เช่น นำไปใช้นำเสนองานประชุมร่วมกับลูกค้า, ใช้งานห้องประชุม..."
                  className="w-full p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs sm:text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-600 outline-none leading-relaxed"
                />

                {/* Suggestion Chips */}
                <div>
                  <p className="text-[11px] text-stone-400 mb-1.5 font-medium">ข้อความแนะนำ (คลิกเพื่อเลือก):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {reasonSuggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReason(sug)}
                        className="text-[11px] text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors text-left"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expansion 1: สถานที่ใช้งาน */}
              <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-red-700 dark:text-red-400" />
                  <span>สถานที่ใช้งานอุปกรณ์ (Location & Venue)</span>
                </h3>

                <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                  {[
                    { id: 'MeetingRoom', label: 'ห้องประชุมในบริษัท', icon: <Building className="w-4 h-4" /> },
                    { id: 'InOffice', label: 'โต๊ะทำงานภายในออฟฟิศ', icon: <Layers className="w-4 h-4" /> },
                    { id: 'Offsite', label: 'ออกปฏิบัติงานนอกสถานที่', icon: <MapPin className="w-4 h-4" /> },
                  ].map(loc => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setLocationType(loc.id as any)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all ${
                        locationType === loc.id
                          ? 'border-red-600 bg-red-50/70 dark:bg-red-950/40 text-red-700 dark:text-red-400 shadow-xs font-bold'
                          : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                      }`}
                    >
                      {loc.icon}
                      <span className="text-center">{loc.label}</span>
                    </button>
                  ))}
                </div>

                {locationType === 'MeetingRoom' && (
                  <div>
                    <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">ระบุห้องประชุม:</label>
                    <select
                      value={roomOrPlace}
                      onChange={e => setRoomOrPlace(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs outline-none"
                    >
                      {meetingRooms.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Expansion 2: บริการเสริม IT Support */}
              <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-red-700 dark:text-red-400" />
                  <span>บริการเสริมเพิ่มเติมจากฝ่าย IT (Optional IT Support)</span>
                </h3>

                <div className="space-y-2 text-xs text-stone-700 dark:text-stone-300">
                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needSetupSupport}
                      onChange={e => setNeedSetupSupport(e.target.checked)}
                      className="w-4 h-4 rounded text-red-700 focus:ring-red-500"
                    />
                    <span>ต้องการให้เจ้าหน้าที่ IT ช่วย Setup และทดสอบอุปกรณ์ในห้องประชุมก่อนเริ่มงาน</span>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={needExtensionCord}
                      onChange={e => setNeedExtensionCord(e.target.checked)}
                      className="w-4 h-4 rounded text-red-700 focus:ring-red-500"
                    />
                    <span>ขอรับสายปลั๊กพ่วงไฟฟ้า (Extension Plug) เพิ่มเติม 1 ชุด</span>
                  </label>
                </div>
              </div>

            </div>

            {/* Right 4 Cols */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                  <Info className="w-4 h-4 text-red-700 dark:text-red-400" />
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">ผู้ยื่นคำขอ (Microsoft 365)</span>
                </div>

                <div className="flex items-center space-x-3">
                  <img src={currentUser.avatar} alt="" className="w-12 h-12 rounded-xl object-cover ring-2 ring-stone-100 dark:ring-stone-800" />
                  <div>
                    <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">{currentUser.name}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{currentUser.email}</p>
                    <p className="text-xs text-red-700 dark:text-red-400 font-semibold">{currentUser.department}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">เบอร์ติดต่อกลับ:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Items Selected Mini-Summary */}
              <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-stone-200 pb-2 border-b border-stone-100 dark:border-stone-800">
                  <span>อุปกรณ์ที่เลือกไว้</span>
                  <span className="text-red-700 dark:text-red-400 font-bold">{totalSelectedQty} ชิ้น</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedList.map(item => (
                    <div key={item.equipmentId} className="flex items-center justify-between text-xs p-1.5 bg-stone-50 dark:bg-stone-800/60 rounded-lg">
                      <span className="text-stone-700 dark:text-stone-300 truncate font-medium">{item.equipmentName}</span>
                      <span className="text-red-700 dark:text-red-400 font-bold ml-2">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full py-1.5 text-center text-xs text-red-700 dark:text-red-400 hover:underline font-bold"
                >
                  ✎ แก้ไขรายการอุปกรณ์
                </button>
              </div>

              {/* Nav Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  className="flex-1 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center justify-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>ย้อนกลับ</span>
                </button>

                <button
                  type="button"
                  onClick={goToNextStep}
                  className="flex-1 py-3 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-md shadow-red-700/20"
                >
                  <span>ตรวจสอบข้อมูล</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: ตรวจสอบและยืนยันคำขอ (REVIEW & FINAL CONFIRMATION)                 */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-150">
          
          <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
            
            <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">ตรวจสอบและยืนยันข้อมูลคำขอยืมอุปกรณ์ IT</h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                โปรดตรวจสอบความถูกต้องของรายการอุปกรณ์ กำหนดการ และสถานที่ ก่อนกดส่งคำขอไปยัง IT Manager
              </p>
            </div>

            {/* Requester & Schedule Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl space-y-1">
                <span className="text-stone-400 block font-medium">ข้อมูลผู้ยืม (Requester)</span>
                <p className="font-bold text-stone-800 dark:text-stone-200 text-sm">{currentUser.name}</p>
                <p className="text-stone-500 dark:text-stone-400">{currentUser.department} • {phone}</p>
                <p className="text-stone-400 text-[11px]">{currentUser.email}</p>
              </div>

              <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl space-y-1">
                <span className="text-stone-400 block font-medium">กำหนดการใช้งาน (Schedule)</span>
                <p className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                  {borrowDate} → <span className="text-red-600 dark:text-red-400">{returnDate}</span>
                </p>
                <p className="text-red-700 dark:text-red-400 font-bold">ระยะเวลา: {daysCount + 1} วัน</p>
                <p className="text-stone-400 text-[11px]">ระบบจะแจ้งเตือนล่วงหน้า 1 วันก่อนครบกำหนด</p>
              </div>

              <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl space-y-1 sm:col-span-2 lg:col-span-1">
                <span className="text-stone-400 block font-medium">สถานที่ใช้งาน & บริการเสริม</span>
                <p className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                  {locationType === 'MeetingRoom' ? roomOrPlace : locationType === 'InOffice' ? 'ภายในสำนักงาน' : 'ปฏิบัติงานนอกสถานที่'}
                </p>
                {needSetupSupport && <p className="text-emerald-700 dark:text-emerald-400 font-semibold">✓ ขอเจ้าหน้าที่ช่วย Setup</p>}
                {needExtensionCord && <p className="text-emerald-700 dark:text-emerald-400 font-semibold">✓ ขอสายปลั๊กพ่วงไฟฟ้า</p>}
              </div>
            </div>

            {/* Reason Box */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl text-xs space-y-1">
              <span className="text-stone-400 font-medium block">วัตถุประสงค์ / เหตุผลในการขอยืม:</span>
              <p className="text-stone-800 dark:text-stone-200 text-sm leading-relaxed italic">"{reason}"</p>
            </div>

            {/* Items Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  รายการอุปกรณ์ที่ยืม ({selectedList.length} รายการ, รวม {totalSelectedQty} ชิ้น)
                </h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-red-700 dark:text-red-400 hover:underline font-bold"
                >
                  ✎ แก้ไขรายการ
                </button>
              </div>

              <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold border-b border-stone-200 dark:border-stone-700">
                    <tr>
                      <th className="p-3">รูปภาพ</th>
                      <th className="p-3">ชื่ออุปกรณ์</th>
                      <th className="p-3">หมวดหมู่</th>
                      <th className="p-3 text-center">จำนวนที่ยืม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {selectedList.map(item => (
                      <tr key={item.equipmentId}>
                        <td className="p-3">
                          <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                        </td>
                        <td className="p-3 font-bold text-stone-800 dark:text-stone-200">{item.equipmentName}</td>
                        <td className="p-3 text-stone-500 dark:text-stone-400">{item.category}</td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2.5 py-1 rounded-lg">
                            {item.quantity} ชิ้น
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 rounded text-red-700 focus:ring-red-500 mt-0.5"
                />
                <span className="text-stone-700 dark:text-stone-300 leading-relaxed">
                  ข้าพเจ้ายินยอมปฏิบัติตามนโยบายการใช้อุปกรณ์ IT ของบริษัท ส. ขอนแก่นฟู้ดส์ จำกัด (มหาชน) จะดูแลรักษาอุปกรณ์ให้อยู่ในสภาพดี ไม่นำไปใช้งานส่วนตัว และจะนำส่งคืนภายในกำหนดวันและเวลาที่ระบุ
                </span>
              </label>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={goToPrevStep}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center justify-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับไปแก้ไข</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-700 via-rose-700 to-red-800 hover:from-red-800 hover:to-rose-800 text-white font-black text-sm shadow-xl shadow-red-700/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <span>กำลังส่งข้อมูลและแจ้งเตือน IT Manager...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>ยืนยันและส่งคำขอยืมอุปกรณ์</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </form>
      )}

    </div>
  );
};
