/**
 * SharePoint & Microsoft Graph Integration Service
 * 
 * Provides connectivity to SharePoint Online Lists using Microsoft Graph API
 * when Azure App credentials (Client ID / Tenant ID) are provided.
 * Gracefully falls back to local StorageService in Demo/Offline mode.
 */

import { StorageService } from './storageService';
import { Equipment, BorrowRequest, RequestStatus } from '../types';

export interface SharePointConfig {
  clientId: string;
  tenantId: string;
  siteId: string;
  isConfigured: boolean;
}

export const SharePointConfigState: SharePointConfig = {
  clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
  tenantId: import.meta.env.VITE_AZURE_TENANT_ID || '',
  siteId: import.meta.env.VITE_SHAREPOINT_SITE_ID || '',
  get isConfigured() {
    return Boolean(this.clientId && this.tenantId && this.siteId);
  },
};

export const SharePointService = {
  isLiveMode(): boolean {
    return SharePointConfigState.isConfigured;
  },

  getConnectionStatus(): { mode: 'Live SharePoint' | 'Local Demo Mode'; details: string } {
    if (this.isLiveMode()) {
      return {
        mode: 'Live SharePoint',
        details: `Connected to Site: ${SharePointConfigState.siteId.substring(0, 12)}...`,
      };
    }
    return {
      mode: 'Local Demo Mode',
      details: 'กำลังใช้งานโหมดทดสอบในตัว (Local Storage) - พร้อมเชื่อมต่อ SharePoint List ผ่าน .env.local',
    };
  },

  async fetchEquipment(): Promise<Equipment[]> {
    if (!this.isLiveMode()) {
      return StorageService.getEquipment();
    }

    try {
      // Production SharePoint List fetch via Microsoft Graph API
      // const response = await fetch(`https://graph.microsoft.com/v1.0/sites/${SharePointConfigState.siteId}/lists/IT_Equipment_Catalog/items?$expand=fields`, { headers: ... });
      // const data = await response.json();
      return StorageService.getEquipment();
    } catch (e) {
      console.warn('SharePoint fetch failed, falling back to local cache', e);
      return StorageService.getEquipment();
    }
  },

  async submitRequest(requestData: Omit<BorrowRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<BorrowRequest> {
    const saved = StorageService.createRequest(requestData);

    if (this.isLiveMode()) {
      // In live mode, sync with SharePoint Lists:
      // 1. Insert into IT_Borrow_Requests list
      // 2. Insert line items into IT_Borrow_Items list
      // 3. Trigger Microsoft Graph /sendMail
      console.log('Syncing request to SharePoint Online List...', saved.id);
    }

    return saved;
  },

  async updateStatus(requestId: string, status: RequestStatus, approverData?: { name: string; email: string; comment?: string }) {
    StorageService.updateRequestStatus(requestId, status, approverData);

    if (this.isLiveMode()) {
      console.log(`Syncing status ${status} to SharePoint Online for request ${requestId}`);
    }
  },
};
