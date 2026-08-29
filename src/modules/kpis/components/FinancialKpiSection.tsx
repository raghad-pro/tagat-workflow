"use client";

import React from "react";
import { DollarSign, FileText, TrendingUp, CreditCard, Receipt, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { KpiMetricCard } from "./KpiMetricCard";
import { KpiSectionHeading } from "./KpiSectionHeading";
import { KPI_CARD, toneEdge, toneInk, toneWash } from "../tones";
import type { FinancialKpis, InvoicesKpis } from "../types/kpis.types";

interface FinancialKpiSectionProps {
  financial?: FinancialKpis;
  invoices?: InvoicesKpis;
}

const money = (value: number | undefined) => `$${(value || 0).toLocaleString("en-US")}`;

export function FinancialKpiSection({ financial, invoices }: FinancialKpiSectionProps) {
  const t = useTranslations("kpis.financial");

  if (!financial && !invoices) return null;

  return (
    <div className="flex flex-col gap-4">
      <KpiSectionHeading icon={DollarSign} title={t("heading")} tone="sky" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiMetricCard
          label={t("totalRevenue")}
          metric={financial?.revenue}
          icon={DollarSign}
          tone="sky"
          prefix="$"
        />
        <KpiMetricCard
          label={t("totalInvoiced")}
          metric={financial?.invoiced}
          icon={Receipt}
          tone="violet"
          prefix="$"
        />
        <KpiMetricCard
          label={t("totalExpenses")}
          metric={financial?.expenses}
          icon={CreditCard}
          tone="red"
          prefix="$"
        />
        <KpiMetricCard
          label={t("netProfit")}
          metric={financial?.profit}
          icon={TrendingUp}
          tone="green"
          prefix="$"
        />
      </div>

      {invoices && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiMetricCard
            label={t("paidInvoices")}
            valueOverride={money(invoices.paid_amount)}
            subLabel={t("invoicesSettled", { count: invoices.paid_count || 0 })}
            icon={Receipt}
            tone="green"
          />
          <KpiMetricCard
            label={t("outstandingInvoices")}
            valueOverride={money(invoices.outstanding_amount)}
            subLabel={t("unpaidOverdue", {
              unpaid: invoices.unpaid_count || 0,
              overdue: invoices.overdue_count || 0,
            })}
            icon={FileText}
            tone="amber"
          />
          <KpiMetricCard
            label={t("employeePayouts")}
            metric={financial?.employee_payouts}
            icon={Wallet}
            tone="brand"
            prefix="$"
          />
        </div>
      )}

      {financial?.by_currency && financial.by_currency.length > 0 && (
        <div className={cn(KPI_CARD, "flex flex-col gap-4 p-6")}>
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-[15px] font-bold ds-text-primary">{t("multiCurrency")}</h4>
            <span className="text-xs ds-text-gray-200">
              {t("currenciesTracked", { count: financial.by_currency.length })}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {financial.by_currency.map((curr) => (
              <div
                key={curr.currency_id}
                className="flex flex-col gap-2 rounded-xl p-4"
                style={{
                  backgroundColor: toneWash("violet", 8),
                  border: `1px solid ${toneEdge("violet", 16)}`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        color: toneInk("violet"),
                        backgroundColor: toneWash("violet", 18),
                      }}
                    >
                      {curr.symbol}
                    </div>
                    <span className="text-[14px] font-bold ds-text-primary">{curr.code}</span>
                  </div>

                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                    style={{ color: toneInk("sky"), backgroundColor: toneWash("sky", 15) }}
                  >
                    {curr.symbol}
                    {curr.invoiced.toLocaleString("en-US")}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t pt-1 text-xs ds-text-gray-200"
                  style={{ borderColor: "color-mix(in srgb, var(--color-text-primary) 10%, transparent)" }}
                >
                  <span>
                    {t("collected")}{" "}
                    <strong style={{ color: toneInk("green") }}>
                      {curr.symbol}
                      {curr.collected.toLocaleString("en-US")}
                    </strong>
                  </span>
                  <span>
                    {t("due")}{" "}
                    <strong style={{ color: toneInk("red") }}>
                      {curr.symbol}
                      {curr.outstanding.toLocaleString("en-US")}
                    </strong>
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
