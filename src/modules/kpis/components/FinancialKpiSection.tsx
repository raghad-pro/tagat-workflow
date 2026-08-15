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
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[8px] bg-[#E6F6FE] flex items-center justify-center text-[#03A9F4]">
          <DollarSign className="w-5 h-5" />
        </div>
        <h2 className="text-[20px] sm:text-[22px] font-bold text-[#000000] dark:text-white tracking-tight leading-[32px]">
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
            iconBg="rgba(37, 198, 218, 0.12)"
            iconColor="#25C6DA"
            prefix="$"
          />
        </div>
      )}

      {/* Multi-Currency Breakdown if present */}
      {financial?.by_currency && financial.by_currency.length > 0 && (
        <div className="bg-white dark:bg-card rounded-[8px] p-6 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[15px] font-bold text-[#000000] dark:text-white">Multi-Currency Portfolio</h4>
            <span className="text-xs text-[#707070] dark:text-gray-400">
              {financial.by_currency.length} currencies tracked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {financial.by_currency.map((curr) => (
              <div
                key={curr.currency_id}
                className="p-4 rounded-[8px] bg-[#FAF5FF] dark:bg-muted/40 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#9810FA]/15 text-[#9810FA] flex items-center justify-center font-bold text-xs">
                      {curr.symbol}
                    </div>
                    <span className="font-bold text-[14px] text-[#000000] dark:text-white">
                      {curr.code}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E6F6FE] text-[#03A9F4]">
                    {curr.symbol}{curr.invoiced.toLocaleString("en-US")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-black/5 dark:border-white/5">
                  <span className="text-[#707070] dark:text-gray-400">
                    Collected: <strong className="text-[#4CAF50]">{curr.symbol}{curr.collected.toLocaleString("en-US")}</strong>
                  </span>
                  <span className="text-[#707070] dark:text-gray-400">
                    Due: <strong className="text-[#F44336]">{curr.symbol}{curr.outstanding.toLocaleString("en-US")}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
