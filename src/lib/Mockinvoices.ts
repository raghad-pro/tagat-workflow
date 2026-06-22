import type {
  Invoice,
  InvoiceStats,
  InvoicesResponse,
  InvoicesQueryParams,
  CreateInvoiceRequest,
} from "@/modules/invoices/types/invoices.types";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
// TODO: حذف هذا الملف كاملاً لما الـ backend يكون جاهز (ENV.IS_MOCK = false)
let MOCK_INVOICES_DB: Invoice[] = [
  { id: "1",  invoiceNumber: "#INV-2026-0234", company: "Advanced Tech Company",  issueDate: "2026-06-06 10:30", dueDate: "2026-06-06 10:30", amount: 1500, currency: "USD", status: "Overdue",  client: "Ali Hassan",    project: "Website Redesign"  },
  { id: "2",  invoiceNumber: "#INV-2026-0235", company: "Advanced Tech Company",  issueDate: "2026-06-06 10:30", dueDate: "2026-06-10 10:30", amount: 1500, currency: "USD", status: "Overdue",  client: "Sara Ahmed",    project: "Mobile App"        },
  { id: "3",  invoiceNumber: "#INV-2026-0236", company: "Advanced Tech Company",  issueDate: "2026-06-06 10:30", dueDate: "2026-06-15 10:30", amount: 1500, currency: "USD", status: "Overdue",  client: "Mohammed Ali",  project: "CRM System"        },
  { id: "4",  invoiceNumber: "#INV-2026-0201", company: "Blue Ocean Solutions",   issueDate: "2026-05-20 09:00", dueDate: "2026-06-01 09:00", amount: 3200, currency: "USD", status: "Paid",     client: "Noor Khalid",   project: "ERP Integration"   },
  { id: "5",  invoiceNumber: "#INV-2026-0202", company: "Blue Ocean Solutions",   issueDate: "2026-05-22 11:00", dueDate: "2026-06-05 11:00", amount: 800,  currency: "USD", status: "Paid",     client: "Lena Faris",    project: "Landing Page"      },
  { id: "6",  invoiceNumber: "#INV-2026-0210", company: "Nexus Digital",          issueDate: "2026-06-01 08:30", dueDate: "2026-06-20 08:30", amount: 2100, currency: "USD", status: "Pending",  client: "Rami Haddad",   project: "SEO Campaign"      },
  { id: "7",  invoiceNumber: "#INV-2026-0211", company: "Nexus Digital",          issueDate: "2026-06-03 14:00", dueDate: "2026-06-25 14:00", amount: 950,  currency: "USD", status: "Pending",  client: "Dina Nasser",   project: "Social Media"      },
  { id: "8",  invoiceNumber: "#INV-2026-0212", company: "Smart Systems Co.",      issueDate: "2026-06-04 10:00", dueDate: "2026-06-18 10:00", amount: 4500, currency: "USD", status: "Pending",  client: "Khaled Omar",   project: "Cloud Migration"   },
  { id: "9",  invoiceNumber: "#INV-2026-0188", company: "Peak Performance Ltd",   issueDate: "2026-05-10 09:00", dueDate: "2026-05-25 09:00", amount: 1200, currency: "USD", status: "Paid",     client: "Hana Zaki",     project: "UI/UX Audit"       },
  { id: "10", invoiceNumber: "#INV-2026-0189", company: "Peak Performance Ltd",   issueDate: "2026-05-12 13:00", dueDate: "2026-05-28 13:00", amount: 750,  currency: "USD", status: "Paid",     client: "Sami Fares",    project: "Branding"          },
  { id: "11", invoiceNumber: "#INV-2026-0220", company: "Alpha Innovations",      issueDate: "2026-06-02 10:00", dueDate: "2026-06-12 10:00", amount: 3800, currency: "USD", status: "Overdue",  client: "Lara Salam",    project: "Data Analytics"    },
  { id: "12", invoiceNumber: "#INV-2026-0221", company: "Alpha Innovations",      issueDate: "2026-06-03 15:00", dueDate: "2026-06-13 15:00", amount: 2200, currency: "USD", status: "Pending",  client: "Nabil Younes",  project: "API Development"   },
];

// ─── Offset added to mock a larger real-world total ───────────────────────────
const STATS_OFFSET = { total: 1835, paid: 120, pending: 21, overdue: 12 } as const;

// ─── Network latency simulation ───────────────────────────────────────────────
const delay = (ms = 400) => new Promise<void>((res) => setTimeout(res, ms));

// ─── Get all (search + filter + pagination) ───────────────────────────────────
export async function mockGetInvoices(
  params: InvoicesQueryParams = {}
): Promise<InvoicesResponse> {
  await delay();

  const { search = "", status = "all", page = 1, per_page = 10 } = params;
  const q = search.trim().toLowerCase();

  const filtered = MOCK_INVOICES_DB.filter((inv) => {
    const matchSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.company.toLowerCase().includes(q) ||
      inv.client.toLowerCase().includes(q);

    const matchStatus =
      status === "all" || inv.status.toLowerCase() === status.toLowerCase();

    return matchSearch && matchStatus;
  });

  const total = filtered.length;
  const start = (page - 1) * per_page;
  const data  = filtered.slice(start, start + per_page);

  return { data, meta: { total, page, per_page } };
}

// ─── Get stats ────────────────────────────────────────────────────────────────
export async function mockGetInvoiceStats(): Promise<InvoiceStats> {
  await delay(300);
  return {
    total:   MOCK_INVOICES_DB.length + STATS_OFFSET.total,
    paid:    MOCK_INVOICES_DB.filter((i) => i.status === "Paid").length    + STATS_OFFSET.paid,
    pending: MOCK_INVOICES_DB.filter((i) => i.status === "Pending").length + STATS_OFFSET.pending,
    overdue: MOCK_INVOICES_DB.filter((i) => i.status === "Overdue").length + STATS_OFFSET.overdue,
  };
}

// ─── Create ───────────────────────────────────────────────────────────────────
export async function mockCreateInvoice(data: CreateInvoiceRequest): Promise<Invoice> {
  await delay();

  // Generate a sequential invoice number
  const lastNum = MOCK_INVOICES_DB.length
    ? parseInt(MOCK_INVOICES_DB[0].invoiceNumber.replace(/\D/g, ""), 10)
    : 300;

  const newInvoice: Invoice = {
    id:            String(Date.now()),
    invoiceNumber: `#INV-${new Date().getFullYear()}-${String(lastNum + 1).padStart(4, "0")}`,
    company:       data.company,
    client:        data.client,
    project:       data.project,
    currency:      (data.currency || "USD") as Invoice["currency"],
    amount:        Number(data.amount) || 0,
    issueDate:     data.invoiceDate || new Date().toISOString().slice(0, 10),
    dueDate:       data.dueDate     || new Date().toISOString().slice(0, 10),
    status:        (data.status     || "Pending") as Invoice["status"],
  };

  MOCK_INVOICES_DB = [newInvoice, ...MOCK_INVOICES_DB];
  return newInvoice;
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export async function mockDeleteInvoice(id: string): Promise<void> {
  await delay(300);
  MOCK_INVOICES_DB = MOCK_INVOICES_DB.filter((inv) => inv.id !== id);
}