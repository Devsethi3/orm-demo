"use client";

import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

const HeroSection = () => {
  return (
    <section className="px-3 lg:px-12 py-12 sm:py-16 lg:py-24 max-w-[1480px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 sm:gap-12 lg:gap-16 items-center">
        <div className="flex flex-col items-start justify-center">
          <div className="inline-flex items-center gap-3 bg-white/5 px-3 py-2 mb-6 sm:mb-8 border border-white/10 rounded-sm">
            <span className="bg-white size-2.5 shrink-0 mb-0.5"></span>
            <span className="lg:text-sm text-xs font-chivo-mono uppercase text-foreground/80">
              From Idea → MVP or Execution Sprints for Scaling Startups.
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-light mb-6 sm:mb-8">
            <span className="text-white/60">Structured Execution</span> for
            <br />
            Growing Startups
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-white/60 mb-8 sm:mb-12 max-w-xl leading-relaxed font-geist">
            We partner with founders and teams to design, build, and launch
            production-ready products with scalable architecture, structured
            workflows, and built-in compliance.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <Button
              size="lg"
            className="flex text-xs sm:text-sm items-center justify-center gap-2 w-full sm:w-auto"
            >
              Start a project <ArrowUpRight size={16} />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="flex items-center text-xs sm:text-sm justify-center gap-2 w-full sm:w-auto border-white/20 text-white hover:bg-white/5"
            >
              See how it works <ArrowUpRight size={16} />
            </Button>
          </div>
        </div>

        <div className="w-full flex justify-end items-center mt-8 lg:mt-0">
          <div className="w-full max-w-[600px] aspect-[3/4] sm:aspect-auto sm:h-[500px] lg:h-[650px] relative overflow-hidden bg-white/5 border border-white/10">
            <Image
              src={"/hero.svg"}
              alt="hero image"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
              className="object-cover"
              priority
              quality={95}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
