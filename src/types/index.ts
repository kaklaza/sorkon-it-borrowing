export type UserRole = 'User' | 'Approver' | 'Admin' | 'Audit';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  avatar: string;
  role: UserRole;
  jobTitle: string;
}

export type EquipmentCategory = 
  | 'accessories' 
  | 'display' 
  | 'conference' 
  | 'computer' 
  | 'camera_video';

export interface Equipment {
  id: string;
  name: string;
  nameTh: string;
  category: EquipmentCategory;
  imageUrl: string;
  totalQuantity: number;
  availableQuantity: number;
  description: string;
  isActive: boolean;
  model?: string;
  location?: string;
}

export interface BorrowItemSelection {
  equipmentId: string;
  equipmentName: string;
  category: EquipmentCategory;
  quantity: number;
  imageUrl?: string;
  assetTag?: string;
}

export type RequestStatus = 
  | 'Pending' 
  | 'Approved' 
  | 'Rejected' 
  | 'InUse' 
  | 'Returned' 
  | 'Overdue' 
  | 'Cancelled';

export type LocationType = 'InOffice' | 'MeetingRoom' | 'Offsite';

export interface BorrowRequest {
  id: string; // e.g. REQ-202609-001
  requester: {
    name: string;
    email: string;
    department: string;
    avatar?: string;
    phone?: string;
  };
  items: BorrowItemSelection[];
  reason: string;
  borrowDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  status: RequestStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  
  // Future-ready expandable fields
  locationType?: LocationType;
  roomOrPlace?: string;
  needSetupSupport?: boolean;
  specialInstructions?: string;

  // Approver section
  approver?: {
    name: string;
    email: string;
    decidedAt: string;
    comment?: string;
  };

  // Handover (จ่ายของ)
  handover?: {
    handedBy: string;
    handedAt: string;
    assetTags: Record<string, string>; // equipmentId -> Serial/AssetTag
    notes?: string;
  };

  // Return (รับคืน)
  returnInfo?: {
    receivedBy: string;
    returnedAt: string;
    condition: 'Good' | 'Damaged' | 'Incomplete';
    notes?: string;
  };
}

export interface EmailNotification {
  id: string;
  timestamp: string;
  to: string;
  recipientName: string;
  subject: string;
  preview: string;
  bodyHtml: string;
  type: 'NEW_REQUEST' | 'APPROVED' | 'REJECTED' | 'HANDOVER' | 'RETURNED' | 'OVERDUE_REMINDER';
  requestId: string;
  isRead?: boolean;
}
