"use client";

import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AnimatedShinyText } from "../ui/animated-shiny-text";
import { AnimatedShinyButton } from "../ui/animated-shiny-button";
import { ShinyButton } from "../ui/shiny-button";
import { PixelatedCanvas } from "../ui/pixelated-canvas";

const HeroSection = () => {
  return (
    <section className="px-3 min-h-screen lg:px-12 py-12 sm:py-16 lg:py-24 max-w-[1480px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 sm:gap-12 lg:gap-16 items-center">
        <div className="flex flex-col items-start justify-center">
          <div className="inline-flex items-center gap-3 bg-white/5 px-3 py-2 mb-6 sm:mb-8 border border-white/10 rounded-sm">
            <span className="bg-white size-2.5 shrink-0 mb-0.5"></span>
            <span className="lg:text-sm text-xs font-chivo-mono uppercase text-foreground/80">
              From Idea → MVP or Execution Sprints for Scaling Startups.
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-heading leading-tight mb-6 sm:mb-8 text-muted-foreground">
            Launch an <span className="text-foreground">Investor-Ready</span> <br /> MVP in{" "}
            <AnimatedShinyText>6-8 Weeks</AnimatedShinyText>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-white/60 mb-8 sm:mb-12 max-w-xl leading-relaxed font-geist">
            We design, build, and launch investor-ready products — engineered
            for scale, speed, and real-world use from day one.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <AnimatedShinyButton url="/mvp">
              Start MVP Program
            </AnimatedShinyButton>
            <Link href="/contact-us">
              <ShinyButton>Book a call</ShinyButton>
            </Link>
          </div>
        </div>

        <div className="w-full flex justify-end items-center mt-8 lg:mt-0">
          <div className="w-full max-w-[600px] aspect-[3/4] sm:aspect-auto sm:h-[500px] lg:h-[650px] relative overflow-hidden">
            <PixelatedCanvas
              src="/mvp.png"
              width={600}
              height={650}
              cellSize={3}
              dotScale={3}
              shape="square"
              backgroundColor="#000000"
              dropoutStrength={0.4}
              interactive
              distortionStrength={3}
              distortionRadius={80}
              distortionMode="swirl"
              followSpeed={0.2}
              jitterStrength={4}
              jitterSpeed={4}
              sampleAverage
              tintColor="#FFFFFF"
              tintStrength={0.2}
              className="hidden md:block transform scale-x-[-1]"
            />
            <Image
              src={"/mvp-hero.svg"}
              alt="hero image"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
              className="object-cover md:hidden block"
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
