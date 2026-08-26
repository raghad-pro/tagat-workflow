"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ChevronRight } from "@/assets/icons/icons";
import { useVisibleHubs, useHubLabel } from "@/hooks/useNavigation";
import { cn } from "@/lib/utils";

/**
 * The launcher: one tile per hub, the same six the sidebar rail carries.
 *
 * Clicking a tile lifts it while the rest of the grid recedes, then routes to
 * the hub's first page — where the sidebar has already opened that hub, so the
 * tile's contents appear to unfold into the rail.
 */
export function HubGrid() {
  const hubs = useVisibleHubs();
  const hubLabel = useHubLabel();
  const t = useTranslations("sidebar");
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  if (hubs.length === 0) return null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
      }}
      className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
    >
      {hubs.map((hub) => {
        const Icon = hub.icon;
        const label = hubLabel(hub);
        const target = hub.items[0].href;
        const isPending = pendingKey === hub.key;
        const isDimmed = pendingKey !== null && !isPending;

        return (
          <motion.button
            key={hub.key}
            type="button"
            variants={{
              hidden: { opacity: 0, y: 14 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
              },
            }}
            animate={
              isPending
                ? { opacity: 1, y: 0, scale: 1.06 }
                : isDimmed
                  ? { opacity: 0.35, y: 0, scale: 0.97 }
                  : undefined
            }
            whileHover={pendingKey ? undefined : { y: -4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.8 }}
            onClick={() => {
              setPendingKey(hub.key);
              router.push(target);
            }}
            aria-label={label}
            className={cn(
              "group relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl p-3.5 text-start",
              "border border-slate-200/80 dark:border-white/10",
              "hover:border-[var(--color-btn-brand)]/40",
              "bg-white dark:bg-white/[0.03]",
              "transition-shadow duration-200 hover:shadow-lg",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-btn-brand)]"
            )}
          >
            {/* Brand wash — barely there at rest, stronger on hover. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[var(--color-btn-brand)] opacity-[0.07] transition-opacity duration-200 group-hover:opacity-[0.16]"
            />

            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-btn-brand)]">
              <Icon size={20} className="text-white dark:text-black" />
            </span>

            <span className="relative min-w-0">
              <span className="block truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">
                {label}
              </span>
              <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                {t(`${hub.key}Desc` as Parameters<typeof t>[0])}
              </span>
            </span>

            <ChevronRight
              size={14}
              className="relative mt-auto text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            />
          </motion.button>
        );
      })}
    </motion.div>
  );
}
