"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  ArrowLeftRightIcon,
  Building02Icon,
  UserGroupIcon,
  CreditCardIcon,
  BarChartHorizontalIcon,
  Settings01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  DollarCircleIcon,
} from "@hugeicons/core-free-icons";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    role: string;
  };
}

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: DashboardSquare01Icon,
    roles: ["admin", "finance", "hr", "viewer"],
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: ArrowLeftRightIcon,
    roles: ["admin", "finance", "hr", "viewer"],
  },
  {
    label: "Accounts",
    href: "/accounts",
    icon: Building02Icon,
    roles: ["admin", "finance"],
  },
  {
    label: "Salaries",
    href: "/salaries",
    icon: UserGroupIcon,
    roles: ["admin", "finance", "hr"],
  },
  {
    label: "Subscriptions",
    href: "/subscriptions",
    icon: CreditCardIcon,
    roles: ["admin", "finance"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChartHorizontalIcon,
    roles: ["admin", "finance", "hr", "viewer"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings01Icon,
    roles: ["admin"],
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNav = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex flex-col border-r border-border bg-card h-full"
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <HugeiconsIcon
            icon={DollarCircleIcon}
            className="h-4 w-4 text-primary-foreground"
          />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-semibold text-sm overflow-hidden whitespace-nowrap"
            >
              {APP_NAME}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors relative",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-primary/10"
                  transition={{ duration: 0.2 }}
                />
              )}
              <HugeiconsIcon
                icon={item.icon}
                className="h-4 w-4 shrink-0 relative z-10"
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap relative z-10"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? (
          <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
        ) : (
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
        )}
      </button>
    </motion.aside>
  );
}
