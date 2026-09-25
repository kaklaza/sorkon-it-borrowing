import { Equipment, BorrowRequest, UserProfile, EmailNotification, RequestStatus } from '../types';
import { INITIAL_EQUIPMENT, INITIAL_REQUESTS, INITIAL_USERS, INITIAL_EMAIL_LOGS } from '../data/initialData';

const STORAGE_KEYS = {
  EQUIPMENT: 'it_borrow_equipment_v1',
  REQUESTS: 'it_borrow_requests_v1',
  USERS: 'it_borrow_users_v1',
  CURRENT_USER: 'it_borrow_current_user_v1',
  EMAIL_LOGS: 'it_borrow_email_logs_v1',
};

export const StorageService = {
  // Current User
  getCurrentUser(): UserProfile {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load current user', e);
    }
    return INITIAL_USERS[0]; // Default: Klanarong (Requester)
  },

  setCurrentUser(user: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('auth-change', { detail: user }));
  },

  getUsers(): UserProfile[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load users', e);
    }
    return INITIAL_USERS;
  },

  saveUsers(users: UserProfile[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  // Equipment (Inventory)
  getEquipment(): Equipment[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EQUIPMENT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load equipment', e);
    }
    return INITIAL_EQUIPMENT;
  },

  saveEquipment(equipment: Equipment[]) {
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(equipment));
    window.dispatchEvent(new CustomEvent('equipment-change', { detail: equipment }));
  },

  updateEquipmentItem(item: Equipment) {
    const list = this.getEquipment();
    const index = list.findIndex(e => e.id === item.id);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.push(item);
    }
    this.saveEquipment(list);
  },

  deleteEquipmentItem(id: string) {
    const list = this.getEquipment().filter(e => e.id !== id);
    this.saveEquipment(list);
  },

  // Requests
  getRequests(): BorrowRequest[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load requests', e);
    }
    return INITIAL_REQUESTS;
  },

  saveRequests(requests: BorrowRequest[]) {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    window.dispatchEvent(new CustomEvent('requests-change', { detail: requests }));
  },

  createRequest(data: Omit<BorrowRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): BorrowRequest {
    const requests = this.getRequests();
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = requests.length + 1;
    const newId = `REQ-${yearMonth}-${String(count).padStart(3, '0')}`;

    const newRequest: BorrowRequest = {
      ...data,
      id: newId,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    requests.unshift(newRequest);
    this.saveRequests(requests);

    // Send simulated email to IT Manager and Requester
    const itManager = INITIAL_USERS.find(u => u.role === 'Approver') || INITIAL_USERS[1];
    const itemsListHtml = newRequest.items.map(i => `<li>${i.equipmentName} x ${i.quantity}</li>`).join('');

    this.addEmailLog({
      to: itManager.email,
      recipientName: itManager.name,
      subject: `[IT Approval Required] คำขอยืมอุปกรณ์ใหม่ ${newRequest.id} จาก ${newRequest.requester.name}`,
      preview: `มีคำขอยืมอุปกรณ์ใหม่จากแผนก ${newRequest.requester.department} เหตุผล: ${newRequest.reason.substring(0, 50)}...`,
      type: 'NEW_REQUEST',
      requestId: newRequest.id,
      bodyHtml: `
        <div style="font-family: sans-serif; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">คำขอยืมอุปกรณ์ IT รายการใหม่ (รอการอนุมัติ)</h2>
          <p>เรียน <strong>${itManager.name}</strong>,</p>
          <p>มีคำขอยืมอุปกรณ์รหัส <strong>${newRequest.id}</strong> ส่งเข้ามาในระบบ:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #f8fafc;">
            <tr><td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; width: 30%;">ผู้ยืม:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${newRequest.requester.name} (${newRequest.requester.department})</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">วันที่ยืม - คืน:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${newRequest.borrowDate} ถึง ${newRequest.returnDate}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">เหตุผล:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${newRequest.reason}</td></tr>
            ${newRequest.locationType ? `<tr><td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">สถานที่ใช้งาน:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${newRequest.locationType === 'MeetingRoom' ? newRequest.roomOrPlace : newRequest.locationType === 'InOffice' ? 'ภายในสำนักงาน' : 'นอกสถานที่'}</td></tr>` : ''}
            ${newRequest.specialInstructions ? `<tr><td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">บริการเสริม/ข้อความ:</td><td style="padding: 8px; border: 1px solid #cbd5e1;">${newRequest.specialInstructions.replace(/\n/g, '<br/>')}</td></tr>` : ''}
          </table>
          <p><strong>รายการอุปกรณ์ที่ขอ:</strong></p>
          <ul>${itemsListHtml}</ul>
          <p style="margin-top: 24px;">กรุณาเข้าสู่ระบบเพื่อกด <strong>อนุมัติ (Approve)</strong> หรือ <strong>ปฏิเสธ (Reject)</strong></p>
        </div>
      `,
    });

    // Confirmation email to requester
    this.addEmailLog({
      to: newRequest.requester.email,
      recipientName: newRequest.requester.name,
      subject: `[คำขอยืมอุปกรณ์] บันทึกคำขอสำเร็จ รหัส ${newRequest.id}`,
      preview: `ระบบได้รับคำขอยืมอุปกรณ์ของคุณแล้ว ขณะนี้อยู่ระหว่างรอ IT Manager พิจารณาอนุมัติ`,
      type: 'NEW_REQUEST',
      requestId: newRequest.id,
      bodyHtml: `
        <div style="font-family: sans-serif; color: #1e293b;">
          <h2 style="color: #0d9488;">ระบบได้รับคำขอยืมอุปกรณ์ของคุณแล้ว</h2>
          <p>เรียน <strong>${newRequest.requester.name}</strong>,</p>
          <p>คำขอยืมอุปกรณ์รหัส <strong>${newRequest.id}</strong> ของท่านถูกส่งไปยังหัวหน้างานฝ่าย IT เรียบร้อยแล้ว</p>
          <p>เมื่อได้รับการพิจารณาอนุมัติ ระบบจะส่งอีเมลแจ้งเตือนให้ท่านทราบอีกครั้ง</p>
        </div>
      `,
    });

    return newRequest;
  },

  updateRequestStatus(
    requestId: string,
    status: RequestStatus,
    approverData?: { name: string; email: string; comment?: string }
  ) {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    req.status = status;
    req.updatedAt = new Date().toISOString();

    if (approverData) {
      req.approver = {
        name: approverData.name,
        email: approverData.email,
        decidedAt: new Date().toISOString(),
        comment: approverData.comment,
      };
    }

    // Adjust inventory if approved or rejected
    if (status === 'Approved') {
      const equipmentList = this.getEquipment();
      req.items.forEach(item => {
        const eq = equipmentList.find(e => e.id === item.equipmentId);
        if (eq) {
          eq.availableQuantity = Math.max(0, eq.availableQuantity - item.quantity);
        }
      });
      this.saveEquipment(equipmentList);

      // Email requester
      this.addEmailLog({
        to: req.requester.email,
        recipientName: req.requester.name,
        subject: `[อนุมัติแล้ว] คำขอยืมอุปกรณ์ ${req.id} ได้รับการอนุมัติแล้ว`,
        preview: `คำขอยืมอุปกรณ์ของคุณได้รับการอนุมัติจาก IT Manager แล้ว สามารถติดต่อรับอุปกรณ์ได้ที่ห้อง IT`,
        type: 'APPROVED',
        requestId: req.id,
        bodyHtml: `
          <div style="font-family: sans-serif; color: #1e293b;">
            <h2 style="color: #16a34a;">คำขอยืมอุปกรณ์ได้รับการอนุมัติแล้ว</h2>
            <p>เรียน <strong>${req.requester.name}</strong>,</p>
            <p>คำขอยืมอุปกรณ์รหัส <strong>${req.id}</strong> ได้รับการอนุมัติโดย <strong>${approverData?.name || 'IT Manager'}</strong> เรียบร้อยแล้ว</p>
            ${approverData?.comment ? `<p style="background: #f1f5f9; padding: 10px; border-left: 4px solid #16a34a;"><strong>หมายเหตุจากผู้อนุมัติ:</strong> ${approverData.comment}</p>` : ''}
            <p>โปรดติดต่อห้องฝ่าย IT ชั้น 3 เพื่อตรวจรับอุปกรณ์ตามวันและเวลาที่ระบุ (${req.borrowDate})</p>
          </div>
        `,
      });
    } else if (status === 'Rejected') {
      // Email requester
      this.addEmailLog({
        to: req.requester.email,
        recipientName: req.requester.name,
        subject: `[ไม่อนุมัติ] คำขอยืมอุปกรณ์ ${req.id} ไม่ได้รับการอนุมัติ`,
        preview: `คำขอยืมอุปกรณ์รหัส ${req.id} ไม่ได้รับการอนุมัติ: ${approverData?.comment || '-'}`,
        type: 'REJECTED',
        requestId: req.id,
        bodyHtml: `
          <div style="font-family: sans-serif; color: #1e293b;">
            <h2 style="color: #dc2626;">คำขอยืมอุปกรณ์ไม่ได้รับการอนุมัติ</h2>
            <p>เรียน <strong>${req.requester.name}</strong>,</p>
            <p>คำขอยืมอุปกรณ์รหัส <strong>${req.id}</strong> ไม่ได้รับการอนุมัติจาก <strong>${approverData?.name || 'IT Manager'}</strong></p>
            ${approverData?.comment ? `<p style="background: #fee2e2; color: #991b1b; padding: 10px; border-left: 4px solid #dc2626;"><strong>เหตุผล:</strong> ${approverData.comment}</p>` : ''}
          </div>
        `,
      });
    }

    this.saveRequests(requests);
  },

  // Hand over equipment (จ่ายของ)
  handoverEquipment(requestId: string, handedBy: string, assetTags: Record<string, string>, notes?: string) {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    req.status = 'InUse';
    req.updatedAt = new Date().toISOString();
    req.handover = {
      handedBy,
      handedAt: new Date().toISOString(),
      assetTags,
      notes,
    };

    // Update items with asset tags
    req.items.forEach(item => {
      if (assetTags[item.equipmentId]) {
        item.assetTag = assetTags[item.equipmentId];
      }
    });

    this.saveRequests(requests);

    // Email
    this.addEmailLog({
      to: req.requester.email,
      recipientName: req.requester.name,
      subject: `[ส่งมอบแล้ว] บันทึกการส่งมอบอุปกรณ์ IT รหัส ${req.id}`,
      preview: `เจ้าหน้าที่ IT ได้ส่งมอบอุปกรณ์ให้ท่านเรียบร้อยแล้ว กำหนดส่งคืนวันที่ ${req.returnDate}`,
      type: 'HANDOVER',
      requestId: req.id,
      bodyHtml: `
        <div style="font-family: sans-serif; color: #1e293b;">
          <h2 style="color: #0284c7;">บันทึกการส่งมอบอุปกรณ์เรียบร้อยแล้ว</h2>
          <p>เรียน <strong>${req.requester.name}</strong>,</p>
          <p>เจ้าหน้าที่ <strong>${handedBy}</strong> ได้ทำการส่งมอบอุปกรณ์ตามคำขอ <strong>${req.id}</strong> ให้ท่านเรียบร้อยแล้ว</p>
          <p><strong>กำหนดวันส่งคืน:</strong> <span style="color: #e11d48; font-weight: bold;">${req.returnDate}</span></p>
        </div>
      `,
    });
  },

  // Return equipment (คืนของ)
  returnEquipment(requestId: string, receivedBy: string, condition: 'Good' | 'Damaged' | 'Incomplete', notes?: string) {
    const requests = this.getRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    req.status = 'Returned';
    req.updatedAt = new Date().toISOString();
    req.returnInfo = {
      receivedBy,
      returnedAt: new Date().toISOString(),
      condition,
      notes,
    };

    // Restore available quantities
    const equipmentList = this.getEquipment();
    req.items.forEach(item => {
      const eq = equipmentList.find(e => e.id === item.equipmentId);
      if (eq) {
        eq.availableQuantity = Math.min(eq.totalQuantity, eq.availableQuantity + item.quantity);
      }
    });
    this.saveEquipment(equipmentList);
    this.saveRequests(requests);

    // Email
    this.addEmailLog({
      to: req.requester.email,
      recipientName: req.requester.name,
      subject: `[ส่งคืนเรียบร้อย] ยืนยันการรับคืนอุปกรณ์ IT รหัส ${req.id}`,
      preview: `ฝ่าย IT ได้รับคืนอุปกรณ์รหัส ${req.id} สภาพ: ${condition === 'Good' ? 'สมบูรณ์ปกติ' : 'มีข้อบกพร่อง'} เรียบร้อยแล้ว`,
      type: 'RETURNED',
      requestId: req.id,
      bodyHtml: `
        <div style="font-family: sans-serif; color: #1e293b;">
          <h2 style="color: #15803d;">ยืนยันการรับคืนอุปกรณ์สำเร็จ</h2>
          <p>เรียน <strong>${req.requester.name}</strong>,</p>
          <p>ฝ่าย IT ตรวจรับคืนอุปกรณ์ตามคำขอ <strong>${req.id}</strong> โดยเจ้าหน้าที่ <strong>${receivedBy}</strong> เรียบร้อยแล้ว</p>
          <p><strong>สภาพอุปกรณ์:</strong> ${condition === 'Good' ? '✅ สมบูรณ์เรียบร้อยดี' : `⚠️ ${condition} (${notes || '-'})`}</p>
          <p>ขอขอบคุณที่ใช้บริการระบบยืม-คืนอุปกรณ์ IT</p>
        </div>
      `,
    });
  },

  // Email Notification Center
  getEmailLogs(): EmailNotification[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMAIL_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load email logs', e);
    }
    return INITIAL_EMAIL_LOGS;
  },

  addEmailLog(log: Omit<EmailNotification, 'id' | 'timestamp'>) {
    const list = this.getEmailLogs();
    const newLog: EmailNotification = {
      ...log,
      id: `em-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    list.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('email-sent', { detail: newLog }));
  },

  markEmailAsRead(id: string) {
    const list = this.getEmailLogs().map(e => e.id === id ? { ...e, isRead: true } : e);
    localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(list));
  },

  // Reset to default seed
  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.EQUIPMENT);
    localStorage.removeItem(STORAGE_KEYS.REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.EMAIL_LOGS);
    window.location.reload();
  },
};
