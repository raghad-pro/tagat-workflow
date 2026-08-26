"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "@/assets/icons/icons";
import Logo from "@/components/atoms/Logo";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { findHubForPath, isItemActive, type Role } from "@/config/navigation";
import { useVisibleHubs, useHubLabel } from "@/hooks/useNavigation";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";

/** The one easing the whole sidebar moves on — a soft, decelerating settle. */
const EASE = [0.22, 1, 0.36, 1] as const;

/** Height, opacity and the rows inside all settle together on this. */
const EXPAND_TRANSITION = {
  height: { duration: 0.34, ease: EASE },
  opacity: { duration: 0.22, ease: "easeOut" },
} as const;

/**
 * Roles whose navigation is short enough to show whole.
 *
 * An employee or a client reaches a handful of pages across two or three hubs.
 * Folding those away costs them a click per section and buys back nothing —
 * the column has room to spare — so they get every section open at once. An
 * admin or a company manager can see all six hubs and twenty-odd pages, which
 * only fits as an accordion.
 */
const EXPANDED_ROLES: readonly Role[] = ["employee", "client"];

/**
 * Six named hubs, each expanding its pages in place underneath it.
 *
 * The pages used to live in a popover floating beside the column. They now
 * unfold inside it, height animated from 0 to natural height so the rows below
 * slide down rather than jump. How many may be open at once depends on how
 * long the account's list is — see `EXPANDED_ROLES`.
 *
 * `collapsible="icon"` drops the names, leaving the six icons as a rail. There
 * is no room to unfold anything at 56px, so a hub tapped from the rail opens
 * the sidebar first and expands once it is wide enough to read.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const locale = useLocale();
  const isAr = locale === "ar";
  const { setOpen, setOpenMobile, isMobile, state } = useSidebar();
  const { user } = useAuth();

  const hubs = useVisibleHubs();
  const hubLabel = useHubLabel();

  const expandAll = EXPANDED_ROLES.includes(user?.role as Role);
  const routeHub = findHubForPath(pathname, hubs);
  const [openHubKeys, setOpenHubKeys] = useState<string[]>([]);

  const isCollapsed = state === "collapsed" && !isMobile;

  // Which hubs exist depends on the account's role and permissions, and those
  // resolve a tick after the first render — so the opening state is seeded off
  // the resolved list rather than at mount. Deliberately not keyed on the
  // route: this is the starting position, and the effect below keeps it honest
  // from there without undoing anything the user has since closed.
  const hubKeys = hubs.map((hub) => hub.key).join(",");
  useEffect(() => {
    if (!hubKeys) return;
    setOpenHubKeys(expandAll ? hubKeys.split(",") : routeHub ? [routeHub.key] : []);
  }, [hubKeys, expandAll]);

  // Unlike the popover — a transient surface that closed the moment it had
  // taken you somewhere — an open section is where you are. Landing in a hub
  // brings it forward: for the folded roles that swaps sections, for the
  // expanded ones it only makes sure the new one is not shut.
  useEffect(() => {
    if (!routeHub) return;
    setOpenHubKeys((current) => {
      if (!expandAll) return [routeHub.key];
      return current.includes(routeHub.key) ? current : [...current, routeHub.key];
    });
  }, [routeHub?.key, expandAll]);

  const openHub = (current: string[], hubKey: string) =>
    expandAll ? [...current, hubKey] : [hubKey];

  const handleHubClick = (hubKey: string) => {
    if (isCollapsed) {
      // Widen first: the section is only readable once the names are back.
      // The open set survives the collapse untouched — only the rendering of
      // it is suppressed — so re-expanding restores what was on screen.
      setOpen(true);
      setOpenHubKeys((current) =>
        current.includes(hubKey) ? current : openHub(current, hubKey)
      );
      return;
    }
    setOpenHubKeys((current) =>
      current.includes(hubKey)
        ? current.filter((key) => key !== hubKey)
        : openHub(current, hubKey)
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      side={isAr ? "right" : "left"}
      className={cn("border-none", "ds-sidebar")}
    >
      {/* ── Logo ── */}
      <SidebarHeader
        className="px-4 pt-1.5 pb-0 group-data-[collapsible=icon]:hidden"
        style={{ justifyContent: "center" }}
      >
        <div className="mb-0 flex w-full justify-center">
          <Logo />
        </div>
      </SidebarHeader>

      {/* ── Hubs ── */}
      <SidebarContent
        className={cn(
          "gap-0.5 px-2 pt-1 pb-2",
          "group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-3",
          "overflow-y-auto overflow-x-hidden",
          "no-scrollbar scrollbar-hide",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        )}
      >
        {hubs.map((hub) => {
          const HubIcon = hub.icon;
          const label = hubLabel(hub);
          const isOpen = openHubKeys.includes(hub.key);
          const isCurrent = routeHub?.key === hub.key;
          // The solid pill marks one place at a time. While a section is shut
          // it sits on the hub; opening the section hands it down to the page
          // you are actually on, and the shared layoutId slides it there.
          const showHubFill = isCurrent && !isOpen;

          return (
            <div key={hub.key} className="w-full group-data-[collapsible=icon]:w-auto">
              {/* ── Hub row ── */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleHubClick(hub.key)}
                    aria-expanded={isOpen}
                    aria-current={isCurrent ? "true" : undefined}
                    className={cn(
                      "group/hub relative flex h-[36px] w-full items-center gap-2.5 rounded-lg px-2.5",
                      "text-[12.5px] font-semibold outline-none",
                      "transition-colors duration-200 ease-out",
                      "focus-visible:ring-2 focus-visible:ring-[var(--color-btn-brand)]",
                      "group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10",
                      "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
                      // One quiet scale instead of three competing treatments:
                      //   rest    — no background
                      //   hover   — a light brand wash, brand text
                      //   current — the solid brand fill, or brand text alone
                      //             once the pill has moved into the section
                      showHubFill
                        ? "text-white dark:text-black"
                        : isCurrent
                          ? "text-[var(--color-btn-brand)] hover:bg-[var(--color-btn-brand)]/10"
                          : [
                              "text-slate-600 dark:text-slate-300",
                              "hover:bg-[var(--color-btn-brand)]/10 hover:text-[var(--color-btn-brand)]",
                            ]
                    )}
                  >
                    {showHubFill && (
                      <motion.span
                        layoutId="nav-active-fill"
                        aria-hidden
                        className={cn(
                          "absolute inset-0 rounded-lg bg-[var(--color-btn-brand)]",
                          "shadow-[0_4px_14px_-4px_var(--color-btn-brand)]"
                        )}
                        transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.8 }}
                      />
                    )}

                    <span className="relative z-10 flex h-[26px] w-[26px] shrink-0 items-center justify-center">
                      <HubIcon
                        size={16}
                        className={cn(
                          "shrink-0 transition-colors duration-200 ease-out",
                          showHubFill
                            ? "text-white dark:text-black"
                            : isCurrent
                              ? "text-[var(--color-btn-brand)]"
                              : "text-slate-500 group-hover/hub:text-[var(--color-btn-brand)] dark:text-slate-400"
                        )}
                      />
                    </span>

                    <span className="relative z-10 truncate group-data-[collapsible=icon]:hidden">
                      {label}
                    </span>

                    {/* Points along the row when shut, straight down when open
                        — the direction the section actually travels. */}
                    <motion.span
                      aria-hidden
                      className="relative z-10 ms-auto flex shrink-0 items-center group-data-[collapsible=icon]:hidden"
                      animate={{ rotate: isOpen ? 90 : isAr ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                    >
                      <ChevronRight
                        size={13}
                        className={cn(
                          "transition-colors duration-200 ease-out",
                          showHubFill
                            ? "text-white/70 dark:text-black/60"
                            : cn(
                                "text-slate-400 opacity-60",
                                "group-hover/hub:text-[var(--color-btn-brand)] group-hover/hub:opacity-100",
                                isOpen && "text-[var(--color-btn-brand)] opacity-100"
                              )
                        )}
                      />
                    </motion.span>
                  </button>
                </TooltipTrigger>
                {/* The name is already on the row; the tooltip is only worth
                    showing once the rail has collapsed it away. */}
                {isCollapsed && (
                  <TooltipContent side={isAr ? "left" : "right"}>{label}</TooltipContent>
                )}
              </Tooltip>

              {/* ── The hub's pages, unfolding in place ──
                  `height: auto` is what lets the rows below glide down by
                  exactly the section's height instead of being pushed in one
                  step. `overflow-hidden` keeps the rows clipped to the growing
                  box so none of them appear before there is room for them. */}
              <AnimatePresence initial={false}>
                {isOpen && !isCollapsed && (
                  <motion.div
                    key="section"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={EXPAND_TRANSITION}
                    style={{ overflow: "hidden" }}
                    className="group-data-[collapsible=icon]:hidden"
                  >
                    {/* The stagger is per-row rather than orchestrated from
                        here, and that is the fix for the section that came
                        back blank.

                        This used to be a `motion.nav` running the rows through
                        `hidden`/`visible` variants with `exit="hidden"`. On
                        close, exit drove every row to `opacity: 0`; reopening
                        re-rendered with `animate="visible"` — an unchanged prop
                        — so framer had nothing to re-run and left them there.
                        The box measured the rows and grew to their full height,
                        which is why an open section could hold a blank gap.

                        Each row now carries its own `animate` object, rebuilt
                        every render, so it cannot get stranded in a state
                        nothing will move it out of. */}
                    <nav
                      className={cn(
                        "relative flex flex-col gap-0.5 py-1",
                        // No surface of its own: the pages sit on the sidebar's
                        // own background, indented under their hub. A single
                        // hairline down the indent is all the grouping needs —
                        // it stays out of the way of the one thing here that is
                        // meant to carry colour, the active page.
                        "ms-[13px] ps-[13px]",
                        "before:absolute before:inset-y-1 before:start-0 before:w-px",
                        "before:bg-slate-200 dark:before:bg-white/10"
                      )}
                    >
                      {hub.items.map((item, index) => {
                        const isActive = isItemActive(pathname, item);
                        const Icon = item.icon;

                        return (
                          <motion.div
                            key={item.href}
                            initial={{ opacity: 0, y: -6, x: isAr ? 6 : -6 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            transition={{
                              duration: 0.28,
                              ease: EASE,
                              // Trails the box opening, then each row a beat
                              // after the one above it.
                              delay: 0.06 + index * 0.035,
                            }}
                          >
                            <Link
                              href={item.href}
                              onClick={() => {
                                if (isMobile) setOpenMobile(false);
                              }}
                              className={cn(
                                "group/nav-item relative flex h-[32px] items-center gap-2.5 rounded-lg px-2.5",
                                "text-[12.5px]",
                                "transition-colors duration-200 ease-out",
                                // The same scale the hub rows use: a wash under
                                // the pointer, the solid fill for the page you
                                // are on.
                                isActive
                                  ? "font-bold text-white dark:text-black"
                                  : [
                                      "font-medium text-slate-600 dark:text-slate-300",
                                      "hover:bg-[var(--color-btn-brand)]/10 hover:text-[var(--color-btn-brand)]",
                                    ]
                              )}
                            >
                              {isActive && (
                                <motion.span
                                  layoutId="nav-active-fill"
                                  aria-hidden
                                  className={cn(
                                    "absolute inset-0 rounded-lg bg-[var(--color-btn-brand)]",
                                    "shadow-[0_4px_14px_-4px_var(--color-btn-brand)]"
                                  )}
                                  transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.8 }}
                                />
                              )}

                              <Icon
                                size={15}
                                className={cn(
                                  "relative z-10 shrink-0 transition-colors duration-200 ease-out",
                                  isActive
                                    ? "text-white dark:text-black"
                                    : "text-slate-500 group-hover/nav-item:text-[var(--color-btn-brand)] dark:text-slate-400"
                                )}
                              />
                              <span className="relative z-10 truncate">
                                {t(item.key as Parameters<typeof t>[0])}
                              </span>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </nav>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
