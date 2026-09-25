import { PublicClientApplication, Configuration, AccountInfo } from '@azure/msal-browser';
import { UserProfile, UserRole } from '../types';

export const AZURE_CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID || '2d50bb1c-8be9-4bf4-adc3-477c7114f1cb';
export const AZURE_TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID || '6775e30d-e01c-4822-9e5e-86701f505ec6';
export const SHAREPOINT_SITE_URL = import.meta.env.VITE_SHAREPOINT_SITE_URL || 'https://sorkonfood.sharepoint.com/sites/PowerPlatformDatabase';

const msalConfig: Configuration = {
  auth: {
    clientId: AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`,
    redirectUri: window.location.origin + window.location.pathname,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);
let isInitialized = false;

export async function initMsal(): Promise<PublicClientApplication> {
  if (!isInitialized) {
    await msalInstance.initialize();
    isInitialized = true;
  }
  return msalInstance;
}

export const loginRequest = {
  scopes: ['User.Read'],
};

export const sharePointRequest = {
  scopes: ['Sites.ReadWrite.All'],
};

export const AuthService = {
  async init(): Promise<void> {
    await initMsal();
  },

  async login(): Promise<UserProfile | null> {
    const instance = await initMsal();
    try {
      const response = await instance.loginPopup(loginRequest);
      if (response && response.account) {
        instance.setActiveAccount(response.account);
        return await this.fetchUserProfile(response.account);
      }
    } catch (error) {
      console.error('Microsoft 365 Login error:', error);
    }
    return null;
  },

  async logout(): Promise<void> {
    const instance = await initMsal();
    const account = instance.getActiveAccount() || instance.getAllAccounts()[0];
    if (account) {
      await instance.logoutPopup({ account });
    }
    localStorage.removeItem('sorkon_current_user');
  },

  async getAccessToken(scopes: string[] = ['User.Read']): Promise<string | null> {
    const instance = await initMsal();
    let account = instance.getActiveAccount();
    if (!account) {
      const accounts = instance.getAllAccounts();
      if (accounts.length > 0) {
        account = accounts[0];
        instance.setActiveAccount(account);
      }
    }
    if (!account) return null;

    try {
      const response = await instance.acquireTokenSilent({
        scopes,
        account,
      });
      return response.accessToken;
    } catch (e) {
      console.warn('Silent token acquisition failed, requesting popup...', e);
      try {
        const response = await instance.acquireTokenPopup({ scopes });
        return response.accessToken;
      } catch (err) {
        console.error('Popup token acquisition failed:', err);
        return null;
      }
    }
  },

  async getSharePointToken(): Promise<string | null> {
    return this.getAccessToken(['Sites.ReadWrite.All']);
  },

  async fetchUserProfile(account: AccountInfo): Promise<UserProfile> {
    const email = account.username.toLowerCase();
    let name = account.name || email.split('@')[0];
    
    let jobTitle = 'พนักงาน ส.ขอนแก่น';
    let department = 'S. Khonkaen Foods PCL';
    
    try {
      const token = await this.getAccessToken();
      if (token) {
        const res = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const graphUser = await res.json();
          if (graphUser.jobTitle) jobTitle = graphUser.jobTitle;
          if (graphUser.department) department = graphUser.department;
          if (graphUser.displayName) name = graphUser.displayName;
        }
      }
    } catch (e) {
      console.warn('Could not fetch Graph /me details', e);
    }

    return {
      id: account.homeAccountId || account.localAccountId,
      name,
      email,
      department,
      jobTitle,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      role: 'User', // Will be resolved by SharePointService against 4_IT_System_Users
    };
  },

  getActiveAccount(): AccountInfo | null {
    const instance = msalInstance;
    return instance.getActiveAccount() || instance.getAllAccounts()[0] || null;
  }
};
