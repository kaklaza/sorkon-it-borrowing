# ==============================================================================
# PowerShell Script: Create 4 SharePoint Online Lists for S.Khonkaen IT Borrowing System
# Module: PnP.PowerShell
# ==============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$SiteUrl = "https://sorkonfood.sharepoint.com/sites/PowerPlatformDatabase"
)

Write-Host "Connecting to SharePoint Online Site: $SiteUrl ..." -ForegroundColor Cyan
Connect-PnPOnline -Url $SiteUrl -Interactive

# ------------------------------------------------------------------------------
# List 1: IT_Equipment_Catalog
# ------------------------------------------------------------------------------
Write-Host "Creating List 1: IT_Equipment_Catalog..." -ForegroundColor Yellow
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
    Write-Host "  -> Done!" -ForegroundColor Green
} else {
    Write-Host "  -> List IT_Equipment_Catalog already exists. Skipped." -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# List 2: IT_Borrow_Requests
# ------------------------------------------------------------------------------
Write-Host "Creating List 2: IT_Borrow_Requests..." -ForegroundColor Yellow
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
    Write-Host "  -> Done!" -ForegroundColor Green
} else {
    Write-Host "  -> List IT_Borrow_Requests already exists. Skipped." -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# List 3: IT_Borrow_Items
# ------------------------------------------------------------------------------
Write-Host "Creating List 3: IT_Borrow_Items..." -ForegroundColor Yellow
if (-not (Get-PnPList -Identity "IT_Borrow_Items" -ErrorAction SilentlyContinue)) {
    New-PnPList -Title "IT_Borrow_Items" -Template GenericList
    Add-PnPField -List "IT_Borrow_Items" -DisplayName "RequestID" -InternalName "RequestID" -Type Text
    Add-PnPField -List "IT_Borrow_Items" -DisplayName "EquipmentID" -InternalName "EquipmentID" -Type Text
    Add-PnPField -List "IT_Borrow_Items" -DisplayName "EquipmentTitle" -InternalName "EquipmentTitle" -Type Text
    Add-PnPField -List "IT_Borrow_Items" -DisplayName "Quantity" -InternalName "Quantity" -Type Number
    Add-PnPField -List "IT_Borrow_Items" -DisplayName "AssetTag" -InternalName "AssetTag" -Type Text
    Write-Host "  -> Done!" -ForegroundColor Green
} else {
    Write-Host "  -> List IT_Borrow_Items already exists. Skipped." -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# List 4: IT_System_Users
# ------------------------------------------------------------------------------
Write-Host "Creating List 4: IT_System_Users..." -ForegroundColor Yellow
if (-not (Get-PnPList -Identity "IT_System_Users" -ErrorAction SilentlyContinue)) {
    New-PnPList -Title "IT_System_Users" -Template GenericList
    Add-PnPField -List "IT_System_Users" -DisplayName "Email" -InternalName "Email" -Type Text
    Add-PnPField -List "IT_System_Users" -DisplayName "DisplayName" -InternalName "DisplayName" -Type Text
    Add-PnPField -List "IT_System_Users" -DisplayName "Department" -InternalName "Department" -Type Text
    Add-PnPField -List "IT_System_Users" -DisplayName "Role" -InternalName "Role" -Type Choice -Choices "User","Approver","Admin","Audit"
    Write-Host "  -> Done!" -ForegroundColor Green
} else {
    Write-Host "  -> List IT_System_Users already exists. Skipped." -ForegroundColor Gray
}

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "All 4 SharePoint Lists created successfully in $SiteUrl" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
