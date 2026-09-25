# ==============================================================================
# PowerShell Script: สร้าง SharePoint Online Lists 4 ตารางสำหรับระบบยืม-คืนอุปกรณ์ IT
# ใช้ PnP.PowerShell (แนะนำ) หรือ SharePoint Online Management Shell
# ==============================================================================

# 1. ติดตั้ง PnP.PowerShell (หากยังไม่เคยติดตั้ง):
# Install-Module -Name "PnP.PowerShell" -Scope CurrentUser -Force

param(
    [Parameter(Mandatory=$true)]
    [string]$SiteUrl = "https://yourtenant.sharepoint.com/sites/ITDepartment"
)

Write-Host "กำลังเชื่อมต่อไปยัง SharePoint Online Site: $SiteUrl ..." -ForegroundColor Cyan
Connect-PnPOnline -Url $SiteUrl -Interactive

# ------------------------------------------------------------------------------
# ตารางที่ 1: IT_Equipment_Catalog (รายการอุปกรณ์และสต็อก)
# ------------------------------------------------------------------------------
Write-Host "สร้างตารางที่ 1: IT_Equipment_Catalog..." -ForegroundColor Yellow
if (-not (Get-PnPList -Identity "IT_Equipment_Catalog" -ErrorAction SilentlyContinue)) {
    New-PnPList -Title "IT_Equipment_Catalog" -Template GenericList
    Add-PnPField -List "IT_Equipment_Catalog" -DisplayName "NameTh" -InternalName "NameTh" -Type Text
    Add-PnPField -List "IT_Equipment_Catalog" -DisplayName "Category" -InternalName "Category" -Type Choice -Choices "accessories","display","conference","computer","camera_video"
    Add-PnPField -List "IT_Equipment_Catalog" -DisplayName "ImageUrl" -InternalName "ImageUrl" -Type URL
    Add-PnPField -List "IT_Equipment_Catalog" -DisplayName "TotalQuantity" -InternalName "TotalQuantity" -Type Number
    Add-PnPField -List "IT_Equipment_Catalog" -DisplayName "AvailableQuantity" -InternalName "AvailableQuantity" -Type Number
    Add-PnPField -List "IT_Equipment_Catalog" -DisplayName "Description" -InternalName "Description" -Type Note
    Add-PnPField -List "IT_Equipment_Catalog" -DisplayName "Model" -InternalName "Model" -Type Text
    Add-PnPField -List "IT_Equipment_Catalog" -DisplayName "Location" -InternalName "Location" -Type Text
    Add-PnPField -List "IT_Equipment_Catalog" -DisplayName "IsActive" -InternalName "IsActive" -Type Boolean
    Write-Host "  -> สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "  -> มีตาราง IT_Equipment_Catalog อยู่แล้ว ข้ามขั้นตอนนี้" -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# ตารางที่ 2: IT_Borrow_Requests (รายการคำขอยืม)
# ------------------------------------------------------------------------------
Write-Host "สร้างตารางที่ 2: IT_Borrow_Requests..." -ForegroundColor Yellow
if (-not (Get-PnPList -Identity "IT_Borrow_Requests" -ErrorAction SilentlyContinue)) {
    New-PnPList -Title "IT_Borrow_Requests" -Template GenericList
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "RequesterEmail" -InternalName "RequesterEmail" -Type Text
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "RequesterName" -InternalName "RequesterName" -Type Text
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "Department" -InternalName "Department" -Type Text
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "Phone" -InternalName "Phone" -Type Text
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "Reason" -InternalName "Reason" -Type Note
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "BorrowDate" -InternalName "BorrowDate" -Type DateTime
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "ReturnDate" -InternalName "ReturnDate" -Type DateTime
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "Status" -InternalName "Status" -Type Choice -Choices "Pending","Approved","Rejected","InUse","Returned","Overdue","Cancelled"
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "ApproverEmail" -InternalName "ApproverEmail" -Type Text
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "ApproverName" -InternalName "ApproverName" -Type Text
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "ApproverComment" -InternalName "ApproverComment" -Type Note
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "ApprovedAt" -InternalName "ApprovedAt" -Type DateTime
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "HandedBy" -InternalName "HandedBy" -Type Text
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "HandedAt" -InternalName "HandedAt" -Type DateTime
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "ReturnedAt" -InternalName "ReturnedAt" -Type DateTime
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "ReturnCondition" -InternalName "ReturnCondition" -Type Text
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "LocationType" -InternalName "LocationType" -Type Choice -Choices "InOffice","MeetingRoom","Offsite"
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "RoomOrPlace" -InternalName "RoomOrPlace" -Type Text
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "NeedSetupSupport" -InternalName "NeedSetupSupport" -Type Boolean
    Add-PnPField -List "IT_Borrow_Requests" -DisplayName "SpecialInstructions" -InternalName "SpecialInstructions" -Type Note
    Write-Host "  -> สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "  -> มีตาราง IT_Borrow_Requests อยู่แล้ว ข้ามขั้นตอนนี้" -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# ตารางที่ 3: IT_Borrow_Items (รายการย่อยของอุปกรณ์ในแต่ละคำขอ)
# ------------------------------------------------------------------------------
Write-Host "สร้างตารางที่ 3: IT_Borrow_Items..." -ForegroundColor Yellow
if (-not (Get-PnPList -Identity "IT_Borrow_Items" -ErrorAction SilentlyContinue)) {
    New-PnPList -Title "IT_Borrow_Items" -Template GenericList
    Add-PnPField -List "IT_Borrow_Items" -DisplayName "RequestID" -InternalName "RequestID" -Type Text
    Add-PnPField -List "IT_Borrow_Items" -DisplayName "EquipmentID" -InternalName "EquipmentID" -Type Text
    Add-PnPField -List "IT_Borrow_Items" -DisplayName "EquipmentTitle" -InternalName "EquipmentTitle" -Type Text
    Add-PnPField -List "IT_Borrow_Items" -DisplayName "Quantity" -InternalName "Quantity" -Type Number
    Add-PnPField -List "IT_Borrow_Items" -DisplayName "AssetTag" -InternalName "AssetTag" -Type Text
    Write-Host "  -> สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "  -> มีตาราง IT_Borrow_Items อยู่แล้ว ข้ามขั้นตอนนี้" -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# ตารางที่ 4: IT_System_Users (กำหนดสิทธิ์การใช้งาน Role-Based Access Control)
# ------------------------------------------------------------------------------
Write-Host "สร้างตารางที่ 4: IT_System_Users..." -ForegroundColor Yellow
if (-not (Get-PnPList -Identity "IT_System_Users" -ErrorAction SilentlyContinue)) {
    New-PnPList -Title "IT_System_Users" -Template GenericList
    Add-PnPField -List "IT_System_Users" -DisplayName "Email" -InternalName "Email" -Type Text
    Add-PnPField -List "IT_System_Users" -DisplayName "DisplayName" -InternalName "DisplayName" -Type Text
    Add-PnPField -List "IT_System_Users" -DisplayName "Department" -InternalName "Department" -Type Text
    Add-PnPField -List "IT_System_Users" -DisplayName "Role" -InternalName "Role" -Type Choice -Choices "User","Approver","Admin","Audit"
    Write-Host "  -> สำเร็จ" -ForegroundColor Green
} else {
    Write-Host "  -> มีตาราง IT_System_Users อยู่แล้ว ข้ามขั้นตอนนี้" -ForegroundColor Gray
}

Write-Host "`n==============================================================================" -ForegroundColor Green
Write-Host "สร้างตาราง SharePoint Lists สำหรับระบบยืม-คืนอุปกรณ์ IT ครบถ้วนทั้ง 4 ตารางแล้ว!" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
