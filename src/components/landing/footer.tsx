import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Logo from "../ui/logo";
import Link from "next/link";
import { Button } from "../ui/button";
import { AnimatedShinyText } from "../ui/animated-shiny-text";

export default function Footer() {
  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-between pt-32 pb-8 selection:bg-white selection:text-black overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/footer.png"
          alt="background"
          fill
          priority
          className="object-cover opacity-50"
        />
      </div>
      <div className="relative z-10 w-full max-w-[1480px]  px-3 lg:px-12  flex flex-col items-center text-center mt-10 md:mt-20">
        <div className="inline-flex items-center gap-3 bg-[#111] border border-[#333] px-4 py-2 mb-8">
          <div className="size-2.5 mb-0.5 bg-white"></div>
          <span className="text-xs lg:text-sm uppercase font-chivo-mono flex items-center gap-2">
            Start a conversation{" "}
            <ArrowRight className="w-3.5 h-3.5 text-[#888]" />
          </span>
        </div>

        <h2 className="font-heading text-[2.75rem] sm:text-6xl md:text-[4.5rem] leading-[1.05] mb-8 text-muted-foreground">
          Let&apos;s <span className="text-foreground">Build Something</span> That <br className="hidden sm:block" />
          <AnimatedShinyText>Actually Scales</AnimatedShinyText>
        </h2>

        <p className="text-[15px] text-foreground/80 sm:text-[17px] leading-relaxed max-w-[600px] mb-12">
          Whether you&apos;re starting from scratch or scaling an existing
          product, we&apos;ll help you move fast with structure, clarity, and
          long-term stability.
        </p>

        <Button className="h-10! lg:text-sm text-xs">
          Book a strategy call <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
        </Button>
      </div>

      <div className="flex-grow min-h-[100px] md:min-h-[200px]"></div>

      <div className="relative z-10 w-full max-w-[1480px] lg:px-12 px-3 flex flex-col mt-auto lg:pt-16 pt-10">
        <div className="flex flex-col lg:flex-row justify-between gap-16 lg:gap-8 mb-20 w-full">
          <div className="flex-shrink-0">
            <Logo />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-12 lg:gap-x-24 w-full lg:w-auto">
            <div className="flex flex-col gap-5">
              <h4 className="text-[14px] mb-1">Navigation</h4>
              <Link
                href="/"
                className="text-foreground/80 hover:text-white transition-colors text-[14px]"
              >
                Home
              </Link>
              <Link
                href="/execution"
                className="text-foreground/80 hover:text-white transition-colors text-[14px]"
              >
                How We Works
              </Link>
              <Link
                href="/case-studies"
                className="text-foreground/80 hover:text-white transition-colors text-[14px]"
              >
                Case Studies
              </Link>
              <Link
                href="/about"
                className="text-foreground/80 hover:text-white transition-colors text-[14px]"
              >
                About
              </Link>
            </div>

            <div className="flex flex-col gap-5">
              <h4 className="text-[14px] text-white font-medium mb-1">
                Services
              </h4>
              <Link
                href="/mvp"
                className="text-foreground/80 hover:text-white transition-colors text-[14px]"
              >
                MVP Launch Program
              </Link>
              <Link
                href="/execution"
                className="text-foreground/80 hover:text-white transition-colors text-[14px]"
              >
                Executions
              </Link>
            </div>

            <div className="flex flex-col gap-5 col-span-2 md:col-span-1">
              <h4 className="text-[14px] text-white font-medium mb-1">
                Support
              </h4>
              <Link
                href="/contact-us"
                className="text-foreground/80 hover:text-white transition-colors text-[14px]"
              >
                Help center
              </Link>
              <span className="text-foreground/80 text-[14px] mt-1">
                +1 (999) 888-77-6
              </span>
              <Link
                href="mailto:xocket@gmail.com"
                className="text-foreground/80 hover:text-white transition-colors text-[14px]"
              >
                xocket@gmail.com
              </Link>
            </div>
          </div>
        </div>

        <div className="w-full border-t border-[#333]/60 pt-6 pb-2 flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-foreground/60">
          <p>© 2026 Xocket</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
