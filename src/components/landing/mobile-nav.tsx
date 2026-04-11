"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export const navLinks = [
  { label: "MVP", href: "/mvp" },
  { label: "Execution", href: "/execution" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "About", href: "/about" },
] as const;

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Lock scroll properly
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Toggle Button */}
      <Button
        size="icon"
        variant="secondary"
        onClick={() => setIsOpen((prev) => !prev)}
        className="md:hidden p-2 z-[9999]"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </Button>

      {/* Overlay */}
      <div
        className={cn(
          "fixed h-screen inset-0 z-[98] md:hidden transition-all duration-300",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />

        {/* Menu Panel */}
        <div
          className={cn(
            "absolute top-0 left-0 w-full h-full bg-black flex flex-col px-6 pt-24 pb-8",
            "transform transition-transform duration-300",
            isOpen ? "translate-y-0" : "-translate-y-full",
          )}
        >
          <nav className="flex flex-col space-y-6 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-lg font-chivo-mono tracking-[0.12em] uppercase text-white/80 hover:text-white transition-colors border-b border-white/10 pb-3"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-white/10 pt-6 mt-auto space-y-4">
            <p className="text-xs text-white/60">© 2026 Xocket</p>
            <div className="flex flex-col gap-3">
              <Link
                href="/terms"
                onClick={() => setIsOpen(false)}
                className="text-xs font-chivo-mono tracking-[0.1em] uppercase text-white/60 hover:text-white transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                onClick={() => setIsOpen(false)}
                className="text-xs font-chivo-mono tracking-[0.1em] uppercase text-white/60 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNav;
