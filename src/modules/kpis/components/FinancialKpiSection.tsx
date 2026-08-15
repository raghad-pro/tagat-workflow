"use client";

import React from "react";
import { DollarSign, FileText, TrendingUp, CreditCard, Receipt, Wallet } from "lucide-react";
import { KpiMetricCard } from "./KpiMetricCard";
import type { FinancialKpis, InvoicesKpis } from "../types/kpis.types";

interface FinancialKpiSectionProps {
  financial?: FinancialKpis;
  invoices?: InvoicesKpis;
}

export function FinancialKpiSection({ financial, invoices }: FinancialKpiSectionProps) {
  if (!financial && !invoices) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-[#25C6DA]" />
        <h2 className="text-[20px] font-bold text-foreground tracking-tight">
          Financial & Revenue KPIs
        </h2>
      </div>

      {/* Primary Financial Metric Cards (4 cards, unified 145px) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiMetricCard
          label="Total Revenue"
          metric={financial?.revenue}
          icon={DollarSign}
          iconBg="#E6F6FE"
          iconColor="#03A9F4"
          prefix="$"
        />

        <KpiMetricCard
          label="Total Invoiced"
          metric={financial?.invoiced}
          icon={Receipt}
          iconBg="#FAF5FF"
          iconColor="#9810FA"
          prefix="$"
        />

        <KpiMetricCard
          label="Total Expenses"
          metric={financial?.expenses}
          icon={CreditCard}
          iconBg="#FEECEB"
          iconColor="#F44336"
          prefix="$"
        />

        <KpiMetricCard
          label="Net Profit"
          metric={financial?.profit}
          icon={TrendingUp}
          iconBg="#EDF7EE"
          iconColor="#4CAF50"
          prefix="$"
        />
      </div>

      {/* Secondary Invoices & Cashflow row */}
      {invoices && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiMetricCard
            label="Paid Invoices Amount"
            valueOverride={`$${(invoices.paid_amount || 0).toLocaleString("en-US")}`}
            subLabel={`${invoices.paid_count || 0} invoices settled`}
            icon={Receipt}
            iconBg="#EDF7EE"
            iconColor="#4CAF50"
          />

          <KpiMetricCard
            label="Outstanding Invoices"
            valueOverride={`$${(invoices.outstanding_amount || 0).toLocaleString("en-US")}`}
            subLabel={`${invoices.unpaid_count || 0} unpaid • ${invoices.overdue_count || 0} overdue`}
            icon={FileText}
            iconBg="#FFFDEB"
            iconColor="#E8D636"
          />

          <KpiMetricCard
            label="Employee Payouts"
            metric={financial?.employee_payouts}
            icon={Wallet}
            iconBg="#E6F6FE"
            iconColor="#25C6DA"
            prefix="$"
          />
        </div>
      )}

      {/* Multi-Currency Breakdown if present */}
      {financial?.by_currency && financial.by_currency.length > 0 && (
        <div className="bg-white dark:bg-card rounded-2xl p-5 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] flex flex-col gap-3">
          <h4 className="text-sm font-bold text-foreground">Currency Breakdown</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {financial.by_currency.map((curr) => (
              <div
                key={curr.currency_id}
                className="p-3.5 rounded-xl bg-muted/40 border border-border/40 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{curr.code} ({curr.symbol})</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#25C6DA]/15 text-[#25C6DA]">
                    Invoiced: {curr.symbol}{curr.invoiced.toLocaleString("en-US")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>Collected: <strong className="text-emerald-500">{curr.symbol}{curr.collected.toLocaleString("en-US")}</strong></span>
                  <span>Outstanding: <strong className="text-amber-500">{curr.symbol}{curr.outstanding.toLocaleString("en-US")}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
