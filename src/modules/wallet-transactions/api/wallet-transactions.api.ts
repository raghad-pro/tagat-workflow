import apiClient from "@/services/apiClient";
import {
  WalletTransactionsQueryParams,
  ApiWalletTransactionsResponse,
  ApiWalletTransactionResponse,
  AddTransactionRequest,
  UpdateTransactionRequest,
  WalletTransactionStats,
} from "../types/wallet-transactions.types";

// ============================================================================
// MOCK DATA (Until real API is provided)
// ============================================================================

let MOCK_TRANSACTIONS = [
  {
    id: 1,
    transaction_number: "#PAY-78945",
    company_id: 1,
    wallet_id: 1,
    amount: "500.00",
    transaction_date: "2026-08-05",
    type: "Income",
    notes: "Payment for services",
    created_at: "2026-08-05T14:30:00Z",
    updated_at: "2026-08-05T14:30:00Z",
    company: { id: 1, name: "Advanced Tech Company" },
    wallet: { id: 1, name: "Bank of Palestine", currency: { code: "USD", symbol: "$" } },
  },
  {
    id: 2,
    transaction_number: "#INV-2020-0234",
    company_id: 2,
    wallet_id: 2,
    amount: "-150.00",
    transaction_date: "2026-08-04",
    type: "Funding",
    notes: "Project funding",
    created_at: "2026-08-04T10:15:00Z",
    updated_at: "2026-08-04T10:15:00Z",
    company: { id: 2, name: "Innovation Foundation" },
    wallet: { id: 2, name: "paypal", currency: { code: "USD", symbol: "$" } },
  },
  {
    id: 3,
    transaction_number: "#INV-2020-0235",
    company_id: 3,
    wallet_id: 3,
    amount: "300.00",
    transaction_date: "2026-08-03",
    type: "Assets",
    notes: "Equipment purchase",
    created_at: "2026-08-03T08:30:00Z",
    updated_at: "2026-08-03T08:30:00Z",
    company: { id: 3, name: "GreenTech Solutions" },
    wallet: { id: 3, name: "Stripe", currency: { code: "USD", symbol: "$" } },
  },
  {
    id: 4,
    transaction_number: "#INV-2020-0039",
    company_id: 4,
    wallet_id: 3,
    amount: "-75.00",
    transaction_date: "2026-08-02",
    type: "Income",
    notes: "Service fee",
    created_at: "2026-08-02T14:45:00Z",
    updated_at: "2026-08-02T14:45:00Z",
    company: { id: 4, name: "BlueWave Corp" },
    wallet: { id: 3, name: "Stripe", currency: { code: "USD", symbol: "$" } },
  },
];

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const walletTransactionsApi = {
  // ─── GET ALL ──────────────────────────────────────────────────────────────
  getAll: async (params?: WalletTransactionsQueryParams): Promise<ApiWalletTransactionsResponse> => {
    await wait(500); // Simulate network latency

    let filtered = [...MOCK_TRANSACTIONS];
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        t => t.transaction_number.toLowerCase().includes(q) || t.company?.name.toLowerCase().includes(q)
      );
    }
    if (params?.type && params.type !== "all") {
      filtered = filtered.filter(t => t.type.toLowerCase() === params.type?.toLowerCase());
    }

    return {
      success: true,
      message: "Mock data fetched successfully",
      data: {
        current_page: params?.page || 1,
        data: filtered,
        total: filtered.length,
        per_page: params?.per_page || 10,
        last_page: 1,
      },
    };
  },

  // ─── GET STATS ────────────────────────────────────────────────────────────
  getStats: async (): Promise<{ success: boolean; data: WalletTransactionStats }> => {
    await wait(300);
    return {
      success: true,
      data: {
        totalVolume: 1245600.00,
        income: 84500.00,
        expenses: 32100.00,
      }
    };
  },

  // ─── CREATE ───────────────────────────────────────────────────────────────
  create: async (data: AddTransactionRequest): Promise<ApiWalletTransactionResponse> => {
    await wait(500);
    const newTx = {
      id: Date.now(),
      transaction_number: `#TXN-${Math.floor(Math.random() * 10000)}`,
      ...data,
      amount: String(data.amount),
      notes: data.notes || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      company: { id: data.company_id, name: `Company ${data.company_id}` },
      wallet: { id: data.wallet_id, name: `Wallet ${data.wallet_id}`, currency: { code: "USD", symbol: "$" } },
    };
    MOCK_TRANSACTIONS.unshift(newTx);
    return { success: true, message: "Transaction added successfully", data: newTx };
  },

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  update: async (id: number, data: UpdateTransactionRequest): Promise<ApiWalletTransactionResponse> => {
    await wait(500);
    const index = MOCK_TRANSACTIONS.findIndex(t => t.id === id);
    if (index === -1) throw new Error("Not found");

    MOCK_TRANSACTIONS[index] = {
      ...MOCK_TRANSACTIONS[index],
      ...data,
      amount: data.amount !== undefined ? String(data.amount) : MOCK_TRANSACTIONS[index].amount,
      updated_at: new Date().toISOString(),
    };
    return { success: true, message: "Transaction updated successfully", data: MOCK_TRANSACTIONS[index] };
  },

  // ─── DELETE ───────────────────────────────────────────────────────────────
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    await wait(500);
    MOCK_TRANSACTIONS = MOCK_TRANSACTIONS.filter(t => t.id !== id);
    return { success: true, message: "Transaction deleted successfully" };
  },
};
