"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Users,
  Mail,
  UserCog,
  Handshake,
  Building2,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logout } from "@/actions/auth";
import { getInitials } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UserRole, UserStatus } from "@/lib/types/enums";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: UserRole;
    status?: UserStatus;
  };
  isCollapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  mounted: boolean;
}

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "ACCOUNT_EXECUTIVE", "PARTNER", "CLIENT"],
  },
  {
    name: "Transactions",
    href: "/dashboard/transactions",
    icon: ArrowLeftRight,
    roles: ["ADMIN", "ACCOUNT_EXECUTIVE", "CLIENT"],
  },
  {
    name: "Brands",
    href: "/dashboard/brands",
    icon: Building2,
    roles: ["ADMIN", "ACCOUNT_EXECUTIVE"],
  },
  {
    name: "Subscriptions",
    href: "/dashboard/subscriptions",
    icon: CreditCard,
    roles: ["ADMIN"],
  },
  {
    name: "Employees",
    href: "/dashboard/employees",
    icon: UserCog,
    roles: ["ADMIN", "ACCOUNT_EXECUTIVE"],
  },
  {
    name: "Partners",
    href: "/dashboard/partners",
    icon: Handshake,
    roles: ["ADMIN", "ACCOUNT_EXECUTIVE", "PARTNER"],
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    name: "Invites",
    href: "/dashboard/invites",
    icon: Mail,
    roles: ["ADMIN"],
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

export function Sidebar({
  user,
  isCollapsed,
  mobileOpen,
  onCloseMobile,
  mounted,
}: SidebarProps) {
  const pathname = usePathname();

  const filteredNavigation = navigationItems.filter((item) =>
    item.roles.includes(user.role),
  );

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <TooltipProvider delayDuration={0}>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar border-r lg:hidden">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b px-4">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                width={28}
                height={28}
                alt="logo"
                className="shrink-0"
              />
              <span className="font-medium text-foreground">Finance CRM</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={onCloseMobile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3">
            <ul className="space-y-1">
              {filteredNavigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm font-medium",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Section */}
          <div className="border-t p-3">
            <div className="flex items-center gap-3 rounded-md bg-accent/50 p-2.5">
              <Avatar className="h-9 w-9 shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600 text-white font-medium">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.role.replace("_", " ")}
                </p>
              </div>
              <form action={handleLogout}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </aside>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r bg-sidebar",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex h-14 items-center border-b",
            isCollapsed ? "justify-center px-2" : "px-4",
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2.5 overflow-hidden",
              isCollapsed && "justify-center",
            )}
          >
            <Image
              src="/logo.png"
              width={28}
              height={28}
              alt="logo"
              className="shrink-0"
            />
            {!isCollapsed && (
              <span className="font-medium text-foreground whitespace-nowrap">
                Finance CRM
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3.5">
          <ul className="space-y-1">
            {filteredNavigation.map((item) => {
              const active = isActive(item.href);
              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium",
                    isCollapsed && "justify-center px-0",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );

              return (
                <li key={item.name}>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={12}>
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className={cn("border-t p-2", isCollapsed && "px-1")}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent cursor-default">
                    <Avatar className="h-8 w-8">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600 text-white font-medium">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Avatar>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.role.replace("_", " ")}
                  </p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <form action={handleLogout}>
                    <button
                      type="submit"
                      className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </form>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  Log out
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-md p-2.5">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600 text-white font-medium">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.role.replace("_", " ")}
                </p>
              </div>
              <form action={handleLogout}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
