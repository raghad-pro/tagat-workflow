"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Label,
} from "recharts";
import { DollarSign, Building2, FileText, AlertCircle } from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const cashFlowData = [
  { month: "Jan", revenue: 40000, expenses: 28000 },
  { month: "Feb", revenue: 52000, expenses: 32000 },
  { month: "Mar", revenue: 38000, expenses: 25000 },
  { month: "Apr", revenue: 61000, expenses: 40000 },
  { month: "May", revenue: 55000, expenses: 35000 },
  { month: "Jun", revenue: 67000, expenses: 42000 },
];

const churnData = [
  { month: "Jan", new: 40, cancelled: 10 },
  { month: "Feb", new: 30, cancelled: 25 },
  { month: "Mar", new: 20, cancelled: 30 },
  { month: "Apr", new: 50, cancelled: 38 },
  { month: "May", new: 35, cancelled: 20 },
  { month: "Jun", new: 45, cancelled: 15 },
];

const packageData = [
  { name: "Basic",      value: 74, color: "#d1d5db" },
  { name: "Pro",        value: 38, color: "#25c6da" },
  { name: "Enterprise", value: 12, color: "#fbbf24" },
];

const companies = [
  { name: "Advanced Tech Company",   date: "2026-06-05", plan: "Enterprise", amount: "$1,500" },
  { name: "Innovation Institute",    date: "2026-06-04", plan: "Pro",        amount: "$499"   },
  { name: "Smart Solutions Company", date: "2026-06-03", plan: "Basic",      amount: "$99"    },
  { name: "Development Group",       date: "2026-06-02", plan: "Pro",        amount: "$499"   },
  { name: "Future Company",          date: "2026-06-01", plan: "Enterprise", amount: "$2,000" },
];

const requests = [
  {
    id: "#REQ-1247",
    priority: "High",
    company: "Advanced Tech Company",
    sub: "Plan Upgrade",
    date: "2026-06-05 16:00",
  },
  {
    id: "#REQ-1246",
    priority: "Medium",
    company: "Innovation Institute",
    sub: "Advanced Technical Support",
    date: "2026-06-05 14:20",
  },
  {
    id: "#REQ-1245",
    priority: "Low",
    company: "Smart Solutions Company",
    sub: "Custom Feature Request",
    date: "2026-06-05 09:15",
  },
];

// ─── Configs ──────────────────────────────────────────────────────────────────

const cashFlowConfig: ChartConfig = {
  revenue:  { label: "Revenue",  color: "#22c55e" },
  expenses: { label: "Expenses", color: "#86efac" },
};

const churnConfig: ChartConfig = {
  new:       { label: "New Subscriptions", color: "#22c55e" },
  cancelled: { label: "Cancellations",     color: "#ef4444" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const planColors: Record<string, string> = {
  Enterprise: "#f59e0b",
  Pro:        "#25c6da",
  Basic:      "#9ca3af",
};

const priorityColors: Record<string, string> = {
  High:   "#ef4444",
  Medium: "#f59e0b",
  Low:    "#22c55e",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  trendColor = "#22c55e",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  trend?: string;
  trendColor?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex gap-3 ds-bg-form  1px solid ds-border-form ds-shadow-sm"
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ds-bg-primary-200"
       
      >
        <Icon size={16} className="ds-text-brand" />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className="text-[11px] font-medium leading-tight ds-text-gray-200"
         
        >
          {label}
        </span>
        <span
          className="text-xl font-bold leading-tight ds-text-primary"
         
        >
          {value}
        </span>
        <span className="text-[11px] ds-text-gray-200" >
          {sub}
        </span>
        {trend && (
          <span className="text-[11px] font-semibold" style={{ color: trendColor }}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Card Wrapper ─────────────────────────────────────────────────────────────
function Card({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-5 flex flex-col ${className}`}
      style={{
        background: "var(--color-bg-form)",
        border: "1px solid var(--color-border-form)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
          {title}
        </p>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Show All Button ──────────────────────────────────────────────────────────
function ShowAll({ href = "#" }: { href?: string }) {
  return (
    <a
      href={href}
      className="text-xs font-semibold hover:underline"
      style={{ color: "var(--color-text-brand)" }}
    >
      ↗ Show All
    </a>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-gray-200)" }}>Platform performance overview</p>
        </div>
         <div className="flex items-center gap-3">
           <span className="text-xs" style={{ color: "var(--color-text-gray-200)" }}>
           Last updated: now
           </span> 
            <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 ds-bg-primary ds-text-button"  
          >
            + New Company
          </button>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* ── LEFT COLUMN (Charts & Stats - 2/3 Width) ── */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={DollarSign} label="MRR" value="$67,000" sub="Compared to last month" trend="↑ +15.3%" />
            <StatCard icon={Building2} label="Companies" value="124 / 132" sub="Engagement Rate: 94%" trend="↑ +8 this month" />
            <StatCard icon={FileText} label="Invoices" value="$12,450" sub="Requires Follow-up" trend="↑ 12 overdue" trendColor="#ef4444" />
            <StatCard icon={AlertCircle} label="Pending" value="37" sub="Needs Processing" />
          </div>

          {/* Monthly Cash Flow */}
          <Card title="Monthly Cash Flow"  action={
              <div className="flex items-center gap-3 text-[11px] ds-text-gray-200" >
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#86efac" }} />
                  Expenses
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#22c55e" }} />
                  Revenue
                </span>
              </div>
            }
          >
            <ChartContainer config={cashFlowConfig} className="h-[200px] w-full" >
              
              <BarChart data={cashFlowData} barGap={3} barCategoryGap="35%">
                <CartesianGrid vertical={false} stroke="var(--color-border-form)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-text-gray-200)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-text-gray-200)" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="expenses" fill="#86efac" radius={[5, 5, 0, 0]} />
                <Bar dataKey="revenue" fill="#22c55e" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </Card>

          {/* Bottom Row Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Subscriber Growth vs Churn Rate" action={
        <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--color-text-gray-200)" }}>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block bg-red-500" />Cancellations</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block bg-green-500" />New Subscriptions</span>
        </div>
    }>
              <ChartContainer config={churnConfig} className="h-[200px] w-full">
                <BarChart data={churnData}>
                  <CartesianGrid vertical={false} stroke="var(--color-border-form)" />
                  <Bar dataKey="cancelled" fill="#ef4444" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="new" fill="#22c55e" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </Card>
    {/* Pie Chart  */}
   <Card title="Package Distribution">
  <div className="flex items-center gap-6 flex-row xl:flex-col">
    <ChartContainer config={{ packages: { label: "Packages" } }} className="h-[130px] w-[130px]">
      <PieChart>
            <Pie
              data={packageData}
              dataKey="value"
              nameKey="name"
              innerRadius={40}
              outerRadius={60}
              strokeWidth={2}
              stroke="var(--color-bg-form)"
            >
              {packageData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

       <div className="flex flex-col gap-2.5 flex-1">
      {packageData.map((d) => (
        <div key={d.name} className="flex items-center justify-between text-xs">
           <span className="font-bold">{d.value} companies</span>
          <span className="flex items-center gap-2">
        <span style={{ color: "var(--color-text-gray-200)" }}>
          {d.name}
        </span>
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: d.color }}
        />
      </span>
             
            </div>
          ))}
        </div>
      </div>
    </Card>
  </div>
        </div>

        {/* ── RIGHT: Companies + Requests Column ── */}
        <div className="flex flex-col gap-5">

          {/* Latest Registered Companies */}
          <Card title="Latest Registered Companies" 
          action={
            <ShowAll />
            }
          >
            <div className="flex flex-col gap-3">
              {companies.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ds-bg-primary-200"
                    
                  >
                    <Building2 size={14} className="ds-text-brand" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-bold truncate ds-text-primary"
                
                    >
                      {c.name}
                    </p>
                    <p className="text-[10px] ds-text-gray-200">
                      {c.date}
                    </p>
                  </div>

                  {/* Plan + Amount */}
                  <div className="flex  items-end gap-2 shrink-0">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: `${planColors[c.plan]}22`,
                        color: planColors[c.plan],
                      }}
                    >
                      {c.plan}
                    </span>
                    <span
                      className="text-xs font-bold ds-text-success"
                  
                    >
                      {c.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Latest Subscriber Requests */}
          <Card title="Latest Subscriber Requests" action={<ShowAll />}>
            <div className="flex flex-col gap-3">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl p-3 ds-bg ds-border-form"
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-1.5">
                     <div className="flex items-center gap-1.5">
                    <span
                      className="text-[11px] font-bold ds-text-brand"
                 
                    >
                      {r.id}
                    </span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: `${priorityColors[r.priority]}20`,
                          color: priorityColors[r.priority],
                        }}
                      >
                        {r.priority}
                      </span>
                   </div>
                    
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "#fef3c7", color: "#d97706" }}
                      >
                        Processing
                      </span>
                    </div>
               

                  {/* Company */}
                  <p
                    className="text-xs font-bold ds-text-primary"
                   
                  >
                    {r.company}
                  </p>

                  {/* Sub + Date */}
                  <p
                    className="text-[10px] mt-0.5 ds-text-gray-200"
                  >
                    {r.sub} · {r.date}
                  </p>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}