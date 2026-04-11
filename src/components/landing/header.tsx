"use client";

import { memo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/logo";
import MobileNav, { navLinks } from "@/components/landing/mobile-nav";

const Header = memo(function Header() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-white/10 bg-black/80 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-[1480px] items-center justify-between px-3 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex items-center z-[60]">
          <Logo />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Button
                key={link.label}
                asChild
                variant="ghost"
                className={cn(
                  "text-xs font-chivo-mono tracking-[0.12em] uppercase",
                  isActive
                    ? "text-white bg-white/10"
                    : "text-white/70 hover:text-white",
                )}
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            );
          })}
        </div>

        <div className="flex items-center z-[60] gap-3">
          <Link href="/contact-us" className="">
            <Button className="text-xs">Book a call</Button>
          </Link>

          <MobileNav />
        </div>
      </nav>
    </header>
  );
});

export default Header;
