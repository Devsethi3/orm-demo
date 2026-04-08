import React from "react";
import Image from "next/image";
import { ArrowRight, CircleCheck, ArrowUpRight } from "lucide-react";
import { Button } from "../ui/button";

const sprintFeatures = [
  "AI-Assisted Development",
  "2-Week Sprint Cycles",
  "Continuous Iteration",
  "Weekly Product Demos",
];

const engagementDeliverables = [
  "Consistent Development Capacity",
  "Sprint-Based Execution",
  "Engineering Oversight",
  "Documentation And Handover",
];

const SprintEngagementModel = () => {
  return (
    <div className="w-full flex flex-col bg-black text-white selection:bg-gray-800 selection:text-white">
      <section className="pt-20 px-3 md:px-12 lg:px-24">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <div className="size-2.5 bg-white"></div>
            <span className="text-sm uppercase font-chivo-mono">
              How Sprint Work
            </span>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start gap-12 lg:gap-24">
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl max-w-2xl leading-[1.1] font-normal tracking-tight text-muted-foreground">
              We use AI + structured sprints <br className="hidden md:block" />
              <span className="text-foreground">to move 2-3x faster</span>
            </h2>

            <p className="text-foreground/80 text-sm leading-relaxed max-w-md lg:mt-4 font-light">
              We combine AI-driven development with structured 2-week sprints to
              move faster, iterate quickly, and ship production-ready systems.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 mt-20">
            {sprintFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-card px-6 py-3 hover:bg-muted transition-all duration-300 cursor-pointer group"
              >
                <ArrowRight className="w-4 h-4 text-foreground/80 group-hover:text-white transition-colors" />
                <span className="text-[14px] text-foreground/80 font-medium tracking-wide group-hover:text-white transition-colors">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative w-full py-32 px-6 flex flex-col items-center justify-center overflow-hidden min-h-screen">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/hero.svg"
            alt="Abstract architectural structure"
            fill
            className="object-cover grayscale contrast-125 brightness-50"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-[#050505]"></div>

          <div
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
              backgroundImage:
                "radial-gradient(circle, #fff 1px, transparent 1.5px)",
              backgroundSize: "4px 4px",
            }}
          ></div>
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
          {/* Section Header Centered */}
          <div className="flex flex-col items-center text-center mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-2.5 bg-white"></div>
              <span className="text-sm uppercase font-chivo-mono">
                What You Get
              </span>
            </div>

            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl mb-6 text-muted-foreground">
              Monthly Engagement <span className="text-foreground">Model</span>
            </h2>

            <p className="text-foreground/80 text-[15px] leading-relaxed max-w-md">
              Execution Acceleration works through a
              <br className="hidden sm:block" /> monthly engagement structure.
            </p>
          </div>

          <div
            className="bg-white text-black w-full max-w-[480px] p-8 md:p-12 relative shadow-2xl"
          >
            <div className="relative z-10">
              <h3 className="font-chivo-mono text-lg">Startups receive:</h3>

              <p className="text-sm leading-relaxed mb-8 pr-4">
                This model provides the flexibility to scale development effort
                based on product needs.
              </p>

              <ul className="space-y-5 mb-12">
                {engagementDeliverables.map((item, index) => (
                  <li key={index} className="flex items-center gap-4 group">
                    <CircleCheck className="w-[18px] h-[18px] text-black stroke-[1.5] shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-[14px] font-medium tracking-tight">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <Button className="group">
                <span>
                  Start MVP Program
                </span>
                <ArrowUpRight className="w-[18px] h-[18px] group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SprintEngagementModel;
