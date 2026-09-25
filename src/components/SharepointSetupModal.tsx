import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, X } from 'lucide-react';
import { SharePointService } from '../services/sharepointService';

interface SharepointSetupModalProps {
  onClose: () => void;
}

export const SharepointSetupModal: React.FC<SharepointSetupModalProps> = ({ onClose }) => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const envSample = `# ตั้งค่าในไฟล์ .env.local ในโฟลเดอร์โปรเจกต์
VITE_AZURE_CLIENT_ID=00000000-0000-0000-0000-000000000000
VITE_AZURE_TENANT_ID=11111111-1111-1111-1111-111111111111
VITE_SHAREPOINT_SITE_ID=sorkon.sharepoint.com,xxxx-xxxx-xxxx,yyyy-yyyy-yyyy
`;

  const powershellScript = `# PowerShell Script: สร้าง SharePoint Online Lists สำหรับ ส. ขอนแก่น (PnP PowerShell)
# 1. ติดตั้งโมดูล: Install-Module PnP.PowerShell -Scope CurrentUser
# 2. เชื่อมต่อ Site:
$SiteUrl = "https://sorkon.sharepoint.com/sites/ITDepartment"
Connect-PnPOnline -Url $SiteUrl -Interactive

# สร้างตารางที่ 1: IT_Equipment_Catalog
New-PnPList -Title "IT_Equipment_Catalog" -Template GenericList
Add-PnPField -List "IT_Equipment_Catalog" -DisplayName "NameTh" -InternalName "NameTh" -Type Text
Add-PnPField -List "IT_Equipment_Catalog" -DisplayName "Category" -InternalName "Category" -Type Choice -Choices "accessories","display","conference","computer","camera_video"
Add-PnPField -List "IT_Equipment_Catalog" -DisplayName "ImageUrl" -InternalName "ImageUrl" -Type URL
Add-PnPField -List "IT_Equipment_Catalog" -DisplayName "TotalQuantity" -InternalName "TotalQuantity" -Type Number
Add-PnPField -List "IT_Equipment_Catalog" -DisplayName "AvailableQuantity" -InternalName "AvailableQuantity" -Type Number
Add-PnPField -List "IT_Equipment_Catalog" -DisplayName "IsActive" -InternalName "IsActive" -Type Boolean

# สร้างตารางที่ 2: IT_Borrow_Requests
New-PnPList -Title "IT_Borrow_Requests" -Template GenericList
Add-PnPField -List "IT_Borrow_Requests" -DisplayName "RequesterEmail" -InternalName "RequesterEmail" -Type Text
Add-PnPField -List "IT_Borrow_Requests" -DisplayName "RequesterName" -InternalName "RequesterName" -Type Text
Add-PnPField -List "IT_Borrow_Requests" -DisplayName "Department" -InternalName "Department" -Type Text
Add-PnPField -List "IT_Borrow_Requests" -DisplayName "Reason" -InternalName "Reason" -Type Note
Add-PnPField -List "IT_Borrow_Requests" -DisplayName "BorrowDate" -InternalName "BorrowDate" -Type DateTime
Add-PnPField -List "IT_Borrow_Requests" -DisplayName "ReturnDate" -InternalName "ReturnDate" -Type DateTime
Add-PnPField -List "IT_Borrow_Requests" -DisplayName "Status" -InternalName "Status" -Type Choice -Choices "Pending","Approved","Rejected","InUse","Returned","Overdue","Cancelled"
Add-PnPField -List "IT_Borrow_Requests" -DisplayName "ApproverEmail" -InternalName "ApproverEmail" -Type Text
Add-PnPField -List "IT_Borrow_Requests" -DisplayName "ApproverComment" -InternalName "ApproverComment" -Type Note

# สร้างตารางที่ 3: IT_Borrow_Items
New-PnPList -Title "IT_Borrow_Items" -Template GenericList
Add-PnPField -List "IT_Borrow_Items" -DisplayName "EquipmentTitle" -InternalName "EquipmentTitle" -Type Text
Add-PnPField -List "IT_Borrow_Items" -DisplayName "Quantity" -InternalName "Quantity" -Type Number
Add-PnPField -List "IT_Borrow_Items" -DisplayName "AssetTag" -InternalName "AssetTag" -Type Text

# สร้างตารางที่ 4: IT_System_Users
New-PnPList -Title "IT_System_Users" -Template GenericList
Add-PnPField -List "IT_System_Users" -DisplayName "Email" -InternalName "Email" -Type Text
Add-PnPField -List "IT_System_Users" -DisplayName "DisplayName" -InternalName "DisplayName" -Type Text
Add-PnPField -List "IT_System_Users" -DisplayName "Role" -InternalName "Role" -Type Choice -Choices "User","Approver","Admin","Audit"

Write-Host "สร้างตาราง SharePoint Lists ทั้งหมดเรียบร้อยแล้ว!" -ForegroundColor Green
`;

  const copyToClipboard = (text: string, type: 'env' | 'script') => {
    navigator.clipboard.writeText(text);
    if (type === 'env') {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 flex items-center justify-center font-bold">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                คู่มือการเชื่อมต่อ SharePoint Online &amp; Azure Entra ID (ส. ขอนแก่น)
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">ขั้นตอนการเตรียมค่า Configuration เพื่อให้ระบบใช้งานกับ M365 จริงของบริษัท</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Connection Status */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                สถานะการทำงาน: <span className="text-red-700 dark:text-red-400 font-extrabold">{SharePointService.isConfigured ? 'Live SharePoint Connected' : 'Local Demo Mode (พร้อมใช้งานทันที)'}</span>
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                ระบบถูกออกแบบให้รองรับทั้งการทดสอบบนเครื่อง และการเชื่อมต่อไปยัง SharePoint Online จริงผ่าน Microsoft Graph API
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: Azure App Registration */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-red-700 text-white flex items-center justify-center text-xs font-bold">1</span>
            <span>ลงทะเบียน Azure App Registration (Microsoft Entra ID)</span>
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed pl-8">
            ให้ IT Administrator เข้าไปที่ <a href="https://portal.azure.com" target="_blank" rel="noreferrer" className="text-red-700 dark:text-red-400 underline inline-flex items-center">Azure Portal <ExternalLink className="w-3 h-3 ml-0.5" /></a> &gt; Microsoft Entra ID &gt; App registrations &gt; New registration:
          </p>
          <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-1 list-disc list-inside pl-10 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-200 dark:border-stone-700">
            <li>ตั้งชื่อแอพ เช่น <code>SORKON-IT-Borrowing-Portal</code></li>
            <li>เพิ่ม API Permissions (Microsoft Graph): <code>User.Read</code>, <code>Sites.ReadWrite.All</code>, <code>Mail.Send</code></li>
            <li>สร้าง Client Secret ในเมนู <em>Certificates &amp; secrets</em></li>
          </ul>
        </div>

        {/* Step 2: Environment Variables */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pl-8">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2 -ml-8">
              <span className="w-6 h-6 rounded-full bg-red-700 text-white flex items-center justify-center text-xs font-bold">2</span>
              <span>ระบุค่าในไฟล์ <code>.env.local</code></span>
            </h3>
            <button
              onClick={() => copyToClipboard(envSample, 'env')}
              className="text-xs text-red-700 dark:text-red-400 font-bold hover:underline flex items-center space-x-1"
            >
              {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEnv ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด'}</span>
            </button>
          </div>
          <pre className="bg-stone-900 text-stone-100 p-3.5 rounded-xl text-xs font-mono overflow-x-auto ml-8 border border-stone-800">
            {envSample}
          </pre>
        </div>

        {/* Step 3: PowerShell Script */}
        <div className="space-y-2">
          <div className="flex items-center justify-between pl-8">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center space-x-2 -ml-8">
              <span className="w-6 h-6 rounded-full bg-red-700 text-white flex items-center justify-center text-xs font-bold">3</span>
              <span>สร้างตาราง SharePoint Lists 4 ตารางอัตโนมัติด้วย PowerShell</span>
            </h3>
            <button
              onClick={() => copyToClipboard(powershellScript, 'script')}
              className="text-xs text-red-700 dark:text-red-400 font-bold hover:underline flex items-center space-x-1"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? 'คัดลอกแล้ว' : 'คัดลอก PowerShell Script'}</span>
            </button>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 pl-8">
            นำสคริปต์นี้ไปรันใน PowerShell เพื่อสร้างตารางทั้งหมดบน SharePoint Site ของบริษัท ส. ขอนแก่น:
          </p>
          <pre className="bg-stone-900 text-amber-300 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 ml-8 border border-stone-800">
            {powershellScript}
          </pre>
        </div>

        <div className="flex justify-end pt-3 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-md shadow-red-700/20"
          >
            เข้าใจแล้ว / ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
