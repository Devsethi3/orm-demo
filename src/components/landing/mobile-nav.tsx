"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "../ui/button";

export const navLinks = [
  { label: "MVP", href: "/mvp" },
  { label: "Execution", href: "/execution" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "About", href: "/about" },
] as const;

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <Button
        size={"icon"}
        variant={'secondary'}
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 hover:bg-white/10 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-16 bg-black/95 backdrop-blur-sm md:hidden z-[9999]">
          <nav className="flex flex-col px-6 py-8 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-sm font-chivo-mono tracking-[0.1em] uppercase text-white/70 hover:text-white transition-colors py-3 border-b border-white/10"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
};

export default MobileNav;
