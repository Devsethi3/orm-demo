import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowUpRight } from "lucide-react";
import { Button } from "../ui/button";
import { SectionLabel } from "../ui/section-label";
import { AnimatedShinyText } from "../ui/animated-shiny-text";

const CornerBrackets = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative w-full h-full">
      <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-white pointer-events-none z-10" />
      <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 border-white pointer-events-none z-10" />
      <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 border-white pointer-events-none z-10" />
      <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-white pointer-events-none z-10" />
      {children}
    </div>
  );
};

const pathsData = [
  {
    title: "MVP Launch Program",
    description: "For founders going from idea to a production-ready product.",
    features: [
      "End-to-end product design + build",
      "Scalable architecture from day one",
      "Fast, structured delivery",
    ],
    buttonText: "START MVP PROGRAM",
    isHighlighted: false,
  },
  {
    title: "Execution Sprints",
    description: "For teams that need to move faster without losing structure.",
    features: [
      "Focused design + development cycles",
      "Continuous iteration and improvement",
      "Clear workflows and rapid delivery",
    ],
    buttonText: "START MVP PROGRAM",
    isHighlighted: true,
  },
  {
    title: "Product Scaling & Optimization",
    description: "For products that need to evolve, stabilize, and scale.",
    features: [
      "Performance and system improvements",
      "UX refinement and feature expansion",
      "Long-term product support",
    ],
    buttonText: "CONTACT SALES",
    isHighlighted: false,
  },
];

export default function ExecutionPathsSection() {
  return (
    <section className="relative w-full min-h-screen flex flex-col items-center py-24  bg-black text-white selection:bg-white selection:text-black overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/footer.png"
          alt="background"
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="relative z-10 w-full max-w-[1480px] px-3 lg:px-12 flex flex-col items-center">
        <div className="flex flex-col items-center text-center max-w-2xl mb-20">
          <SectionLabel text="Execution Paths" />

          <h2 className="font-heading text-4xl sm:text-5xl md:text-[3.5rem] leading-[1.1] mb-6 text-muted-foreground">
            How You <span className="text-foreground">Can Work</span> <br className="hidden sm:block" />{" "}
            <AnimatedShinyText>With Us</AnimatedShinyText>
          </h2>

          <p className="text-muted-foreground text-[15px] sm:text-base leading-relaxed max-w-xl font-light">
            We partner with teams that care about building products the
            <br className="hidden sm:block" /> right way from the start.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 w-full items-stretch">
          {pathsData.map((card, index) => (
            <div key={index} className="flex h-full">
              <CornerBrackets>
                <div
                  className={`flex flex-col h-full p-6 lg:p-7 transition-colors duration-300
                    ${
                      card.isHighlighted
                        ? "bg-white text-black"
                        : "bg-[#0a0a0a] text-white border border-[#1a1a1a]"
                    }
                  `}
                >
                  <div className="mb-10">
                    <h3 className="text-lg mb-3 tracking-wide">{card.title}</h3>
                    <p
                      className={`text-sm leading-relaxed 
                      ${card.isHighlighted ? "text-[#3f3f46]" : "text-[#8a8a93]"}
                    `}
                    >
                      {card.description}
                    </p>
                  </div>

                  <ul className="flex flex-col gap-5 mb-12">
                    {card.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-4">
                        <CheckCircle2
                          className={`w-4 h-4 mt-0.5 shrink-0
                            ${card.isHighlighted ? "text-black" : "text-[#a1a1aa]"}
                          `}
                        />
                        <span
                          className={`text-[14px] leading-snug
                          ${card.isHighlighted ? "text-black" : "text-[#d4d4d8]"}
                        `}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-4">
                    <Link href="/contact-us" className="block">
                      <Button
                        className={`w-full flex items-center justify-between px-6 lg:h-11! h-9! text-sm font-chivo-mono uppercase transition-colors
                          ${
                            card.isHighlighted
                              ? "bg-black text-white hover:bg-[#1a1a1a]"
                              : "bg-white text-black hover:bg-[#e5e5e5]"
                          }
                        `}
                      >
                        {card.buttonText}
                        <ArrowUpRight className="w-4 h-4 stroke-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CornerBrackets>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
