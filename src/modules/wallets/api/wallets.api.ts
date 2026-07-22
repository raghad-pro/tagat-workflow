import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type {
  Wallet,
  WalletsQueryParams,
  AddWalletRequest,
  ApiWalletsResponse,
  ApiWalletResponse,
  ApiCompanyCurrenciesResponse,
} from "../types/wallets.types";
import { DUMMY_WALLETS, DUMMY_CURRENCIES } from "../data/mockData";

let mockWallets = [...DUMMY_WALLETS];
const mockCurrencies = [...DUMMY_CURRENCIES];

export const walletsApi = {
  getAll: async (params?: WalletsQueryParams, role = "super_admin"): Promise<ApiWalletsResponse> => {
    try {
      const res = await apiClient.get<ApiWalletsResponse>(`${getRolePrefix(role)}/wallets`, params as Record<string, unknown>);
      if (res && res.data) return res;
    } catch {
      // Fallback
    }
    
    let filtered = [...mockWallets];
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(w => w.name.toLowerCase().includes(q) || w.currency?.code.toLowerCase().includes(q));
    }
    
    const page = params?.page || 1;
    const perPage = params?.per_page || 10;
    const start = (page - 1) * perPage;
    const paginated = filtered.slice(start, start + perPage);

    return {
      success: true,
      data: {
        current_page: page,
        data: paginated,
        total: filtered.length,
        per_page: perPage,
        last_page: Math.ceil(filtered.length / perPage) || 1,
      }
    };
  },

  getById: async (id: number, role = "super_admin"): Promise<ApiWalletResponse> => {
    try {
      const res = await apiClient.get<ApiWalletResponse>(`${getRolePrefix(role)}/wallets/${id}`);
      if (res && res.data) return res;
    } catch {
      // Fallback
    }
    const wallet = mockWallets.find(w => w.id === id);
    if (!wallet) throw new Error("Wallet not found");
    return { success: true, data: wallet };
  },

  getCompanyCurrencies: async (companyId: number, role = "super_admin"): Promise<ApiCompanyCurrenciesResponse> => {
    try {
      const res = await apiClient.get<ApiCompanyCurrenciesResponse>(
        role === "super_admin" 
          ? `${getRolePrefix(role)}/companies/${companyId}/currencies`
          : `${getRolePrefix(role)}/companies/${companyId}/currencies`
      );
      if (res && res.data) return res;
    } catch {
      // Fallback
    }
    return { success: true, data: mockCurrencies };
  },

  create: async (data: AddWalletRequest, role = "super_admin"): Promise<ApiWalletResponse> => {
    try {
      return await apiClient.post<ApiWalletResponse>(`${getRolePrefix(role)}/wallets`, data);
    } catch {
      const cur = mockCurrencies.find(c => c.id === Number(data.currency_id));
      const newWallet: Wallet = {
        id: Date.now(),
        name: data.name,
        company_id: data.company_id,
        currency_id: data.currency_id,
        notes: data.notes || null,
        balance: String(data.balance || 0),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        currency: cur!,
        company: mockWallets[0].company,
      };
      mockWallets = [newWallet, ...mockWallets];
      return { success: true, data: newWallet };
    }
  },

  update: async (id: number, data: Partial<AddWalletRequest>, role = "super_admin"): Promise<ApiWalletResponse> => {
    try {
      return await apiClient.put<ApiWalletResponse>(`${getRolePrefix(role)}/wallets/${id}`, data);
    } catch {
      const idx = mockWallets.findIndex(w => w.id === id);
      if (idx !== -1) {
        mockWallets[idx] = { ...mockWallets[idx], ...data, balance: data.balance !== undefined ? String(data.balance) : mockWallets[idx].balance };
        if (data.currency_id) {
          const cur = mockCurrencies.find(c => c.id === Number(data.currency_id));
          if (cur) mockWallets[idx].currency = cur;
        }
      }
      return { success: true, data: mockWallets[idx] };
    }
  },

  delete: async (id: number, role = "super_admin") => {
    try {
      return await apiClient.delete<{ success: boolean; message: string }>(`${getRolePrefix(role)}/wallets/${id}`);
    } catch {
      mockWallets = mockWallets.filter(w => w.id !== id);
      return { success: true, message: "Deleted locally" };
    }
  },
};
