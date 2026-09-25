/**
 * SharePoint & Microsoft Graph Integration Service
 * 
 * Directly connects to Microsoft 365 SharePoint Online Lists via Microsoft Graph API
 * for Sor Khonkaen Foods PCL (Infrastructure DB site).
 * Supports automatic fallback to StorageService when offline or in demo mode.
 */

import { StorageService } from './storageService';
import { AuthService, AZURE_CLIENT_ID, AZURE_TENANT_ID, SHAREPOINT_SITE_URL } from './authService';
import { Equipment, BorrowRequest, RequestStatus, UserProfile, UserRole } from '../types';

interface ListMap {
  catalogId?: string;
  requestsId?: string;
  itemsId?: string;
  usersId?: string;
}

class SharePointServiceImpl {
  private siteId: string | null = null;
  private listMap: ListMap = {};
  private isResolvingSite = false;

  public get isConfigured(): boolean {
    return Boolean(AZURE_CLIENT_ID && AZURE_TENANT_ID && SHAREPOINT_SITE_URL);
  }

  public getConnectionStatus(): { mode: 'Live SharePoint' | 'Local Demo Mode'; details: string; isConnected: boolean } {
    const account = AuthService.getActiveAccount();
    if (this.isConfigured && account) {
      return {
        mode: 'Live SharePoint',
        details: `เชื่อมต่อ SharePoint Online (Infrastructure DB) ในชื่อ: ${account.name || account.username}`,
        isConnected: true,
      };
    }
    return {
      mode: 'Local Demo Mode',
      details: this.isConfigured 
        ? 'ตั้งค่าระบบ M365 แล้ว (คลิก "เข้าสู่ระบบ Microsoft 365" เพื่อซิงค์ SharePoint จริง)' 
        : 'กำลังใช้งานโหมดทดสอบในตัว (Local Storage)',
      isConnected: false,
    };
  }

  private async getAuthHeaders(): Promise<HeadersInit | null> {
    const token = await AuthService.getSharePointToken();
    if (!token) return null;
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  /**
   * Resolve SharePoint Site ID from tenant URL (e.g. sorkonfood.sharepoint.com:/sites/PowerPlatformDatabase)
   */
  private async getSiteId(): Promise<string | null> {
    if (this.siteId) return this.siteId;
    if (this.isResolvingSite) return null;

    try {
      this.isResolvingSite = true;
      const headers = await this.getAuthHeaders();
      if (!headers) return null;

      const urlObj = new URL(SHAREPOINT_SITE_URL);
      const host = urlObj.hostname; // e.g. sorkonfood.sharepoint.com
      const sitePath = urlObj.pathname.replace(/\/$/, ''); // e.g. /sites/PowerPlatformDatabase

      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${host}:${sitePath}`, { headers });
      if (!res.ok) {
        console.warn('Could not resolve SharePoint site id', await res.text());
        return null;
      }

      const siteData = await res.json();
      this.siteId = siteData.id;
      await this.resolveLists();
      return this.siteId;
    } catch (e) {
      console.warn('SharePoint site resolution failed', e);
      return null;
    } finally {
      this.isResolvingSite = false;
    }
  }

  /**
   * Find and cache the List IDs for the 4 lists
   */
  private async resolveLists(): Promise<void> {
    if (!this.siteId) return;
    try {
      const headers = await this.getAuthHeaders();
      if (!headers) return;

      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${this.siteId}/lists`, { headers });
      if (!res.ok) return;

      const data = await res.json();
      const lists = data.value || [];

      for (const l of lists) {
        const name = (l.name || '').toLowerCase();
        const title = (l.displayName || '').toLowerCase();

        if (name.includes('equipment_catalog') || title.includes('equipment_catalog')) {
          this.listMap.catalogId = l.id;
        } else if (name.includes('borrow_requests') || title.includes('borrow_requests')) {
          this.listMap.requestsId = l.id;
        } else if (name.includes('borrow_items') || title.includes('borrow_items')) {
          this.listMap.itemsId = l.id;
        } else if (name.includes('system_users') || title.includes('system_users')) {
          this.listMap.usersId = l.id;
        }
      }
      console.log('SharePoint Lists resolved:', this.listMap);
    } catch (e) {
      console.warn('Failed resolving lists', e);
    }
  }

  /**
   * Resolve user role from 4_IT_System_Users list
   */
  public async resolveUserRole(email: string): Promise<UserRole> {
    const defaultRole: UserRole = 'User';
    try {
      const siteId = await this.getSiteId();
      if (!siteId || !this.listMap.usersId) return defaultRole;

      const headers = await this.getAuthHeaders();
      if (!headers) return defaultRole;

      const res = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${this.listMap.usersId}/items?$expand=fields`,
        { headers }
      );
      if (!res.ok) return defaultRole;

      const data = await res.json();
      const items = data.value || [];
      const lowerEmail = email.toLowerCase().trim();

      const match = items.find((item: any) => {
        const fields = item.fields || {};
        const title = (fields.Title || '').toLowerCase().trim();
        const mail = (fields.Email || '').toLowerCase().trim();
        return title === lowerEmail || mail === lowerEmail;
      });

      if (match && match.fields && match.fields.Role) {
        const r = match.fields.Role;
        if (['Admin', 'Approver', 'User', 'Audit'].includes(r)) {
          return r as UserRole;
        }
      }
    } catch (e) {
      console.warn('Error resolving user role from SharePoint', e);
    }
    return defaultRole;
  }

  /**
   * Fetch equipment catalog from 1_IT_Equipment_Catalog
   */
  public async fetchEquipment(): Promise<Equipment[]> {
    try {
      const siteId = await this.getSiteId();
      if (siteId && this.listMap.catalogId) {
        const headers = await this.getAuthHeaders();
        if (headers) {
          const res = await fetch(
            `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${this.listMap.catalogId}/items?$expand=fields`,
            { headers }
          );
          if (res.ok) {
            const data = await res.json();
            const items = data.value || [];
            if (items.length > 0) {
              const liveEquipment: Equipment[] = items.map((item: any, idx: number) => {
                const f = item.fields || {};
                return {
                  id: item.id || `eq-${idx + 1}`,
                  name: f.Title || 'อุปกรณ์ IT',
                  nameTh: f.NameTh || f.Title || 'อุปกรณ์ IT',
                  category: (f.Category as any) || 'computer',
                  imageUrl: f.ImageUrl || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60',
                  totalQuantity: Number(f.TotalQuantity) || 1,
                  availableQuantity: Number(f.AvailableQuantity) !== undefined ? Number(f.AvailableQuantity) : 1,
                  description: f.Description || '',
                  isActive: f.IsActive !== false,
                  model: f.Model || '',
                  location: f.Location || '',
                };
              });
              StorageService.saveEquipment(liveEquipment);
              return liveEquipment;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Live SharePoint catalog fetch failed, using local cache', e);
    }
    return StorageService.getEquipment();
  }

  /**
   * Fetch borrow requests from SharePoint
   */
  public async fetchRequests(): Promise<BorrowRequest[]> {
    try {
      const siteId = await this.getSiteId();
      if (siteId && this.listMap.requestsId) {
        const headers = await this.getAuthHeaders();
        if (headers) {
          const res = await fetch(
            `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${this.listMap.requestsId}/items?$expand=fields`,
            { headers }
          );
          if (res.ok) {
            const data = await res.json();
            const items = data.value || [];
            if (items.length > 0) {
              // Convert SharePoint items to BorrowRequest
              const liveRequests: BorrowRequest[] = items.map((item: any) => {
                const f = item.fields || {};
                return {
                  id: f.Title || item.id,
                  requester: {
                    name: f.RequesterName || 'ไม่ระบุชื่อ',
                    email: f.RequesterEmail || '',
                    department: f.Department || 'S. Khonkaen Foods',
                    phone: f.Phone || '',
                  },
                  items: [], // Line items can be hydrated
                  reason: f.Reason || '',
                  borrowDate: f.BorrowDate || new Date().toISOString(),
                  returnDate: f.ReturnDate || new Date().toISOString(),
                  status: (f.Status as RequestStatus) || 'Pending',
                  approver: f.ApproverName ? {
                    name: f.ApproverName,
                    email: f.ApproverEmail || '',
                    comment: f.ApproverComment || '',
                    approvedAt: f.ApprovedAt || '',
                  } : undefined,
                  handover: f.HandedBy ? {
                    handedBy: f.HandedBy,
                    handedAt: f.HandedAt || '',
                    assetTags: {},
                  } : undefined,
                  returnInspection: f.ReturnedAt ? {
                    receivedBy: f.HandedBy || '',
                    returnedAt: f.ReturnedAt,
                    condition: (f.ReturnCondition as any) || 'Good',
                  } : undefined,
                  locationType: f.LocationType || 'InOffice',
                  roomOrPlace: f.RoomOrPlace || '',
                  needSetupSupport: Boolean(f.NeedSetupSupport),
                  specialInstructions: f.SpecialInstructions || '',
                  createdAt: item.createdDateTime || new Date().toISOString(),
                  updatedAt: item.lastModifiedDateTime || new Date().toISOString(),
                };
              });
              StorageService.saveRequests(liveRequests);
              return liveRequests;
            }
          }
        }
      }
    } catch (e) {
      console.warn('SharePoint requests fetch failed, falling back to local', e);
    }
    return StorageService.getRequests();
  }

  /**
   * Submit borrow request to SharePoint Lists
   */
  public async submitRequest(requestData: Omit<BorrowRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<BorrowRequest> {
    const saved = StorageService.createRequest(requestData);

    try {
      const siteId = await this.getSiteId();
      if (siteId && this.listMap.requestsId) {
        const headers = await this.getAuthHeaders();
        if (headers) {
          // 1. Post to 2_IT_Borrow_Requests
          await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${this.listMap.requestsId}/items`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              fields: {
                Title: saved.id,
                RequesterName: saved.requester.name,
                RequesterEmail: saved.requester.email,
                Department: saved.requester.department,
                Phone: saved.requester.phone || '',
                Reason: saved.reason,
                BorrowDate: saved.borrowDate,
                ReturnDate: saved.returnDate,
                Status: 'Pending',
                LocationType: saved.locationType || 'InOffice',
                RoomOrPlace: saved.roomOrPlace || '',
                NeedSetupSupport: Boolean(saved.needSetupSupport),
                SpecialInstructions: saved.specialInstructions || '',
              },
            }),
          });

          // 2. Post line items to 3_IT_Borrow_Items
          if (this.listMap.itemsId) {
            for (const it of saved.items) {
              await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${this.listMap.itemsId}/items`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  fields: {
                    Title: it.equipmentName,
                    RequestID: saved.id,
                    EquipmentID: it.equipmentId,
                    EquipmentTitle: it.equipmentName,
                    Quantity: it.quantity,
                    AssetTag: it.assetTag || '',
                  },
                }),
              });
            }
          }
          console.log(`Saved request ${saved.id} directly to SharePoint Online!`);
        }
      }
    } catch (e) {
      console.warn('Direct SharePoint submission failed, saved to local cache', e);
    }

    return saved;
  }

  /**
   * Update Request status in SharePoint
   */
  public async updateStatus(requestId: string, status: RequestStatus, approverData?: { name: string; email: string; comment?: string }): Promise<void> {
    StorageService.updateRequestStatus(requestId, status, approverData);

    try {
      const siteId = await this.getSiteId();
      if (siteId && this.listMap.requestsId) {
        const headers = await this.getAuthHeaders();
        if (headers) {
          // Find item by Title (Request ID)
          const findRes = await fetch(
            `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${this.listMap.requestsId}/items?$filter=fields/Title eq '${requestId}'&$expand=fields`,
            { headers }
          );
          if (findRes.ok) {
            const result = await findRes.json();
            const item = (result.value || [])[0];
            if (item) {
              const patchBody: any = { Status: status };
              if (approverData) {
                patchBody.ApproverName = approverData.name;
                patchBody.ApproverEmail = approverData.email;
                patchBody.ApproverComment = approverData.comment || '';
                patchBody.ApprovedAt = new Date().toISOString();
              }
              await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${this.listMap.requestsId}/items/${item.id}/fields`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(patchBody),
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('SharePoint status sync failed', e);
    }
  }
}

export const SharePointService = new SharePointServiceImpl();
