import { ArrowUpRight, CircleCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";
import { SectionLabel } from "../ui/section-label";

interface ExecutionPath {
  title: string;
  description: string;
  features: string[];
  buttonText: string;
  theme: "light" | "dark";
}

interface CornerBracketProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  colorClass: string;
}

interface PathCardProps {
  path: ExecutionPath;
}

const pathsData: ExecutionPath[] = [
  {
    title: "MVP Launch Program",
    description: "For founders going from idea to a production-ready product.",
    features: [
      "End-to-end product design + build",
      "Scalable architecture from day one",
      "Fast, structured delivery",
    ],
    buttonText: "START MVP PROGRAM",
    theme: "dark",
  },
  {
    title: "Execution Sprints",
    description: "For teams that need to move faster without losing structure.",
    features: [
      "Focused design + development cycles",
      "Continuous iteration and improvement",
      "Clear workflows and rapid delivery",
    ],
    buttonText: "START SPRINT",
    theme: "light",
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
    theme: "dark",
  },
];

const CornerBracket = ({ position, colorClass }: CornerBracketProps) => {
  const baseClasses = "absolute w-3 h-3";
  const positionClasses: Record<string, string> = {
    "top-left": "top-[-2] left-[-2] border-t-2 border-l-2",
    "top-right": "top-[-2] right-[-2] border-t-2 border-r-2",
    "bottom-left": "bottom-[-2] left-[-2] border-b-2 border-l-2",
    "bottom-right": "bottom-[-2] right-[-2] border-b-2 border-r-2",
  };
  return (
    <div
      className={`${baseClasses} ${positionClasses[position]} ${colorClass}`}
    ></div>
  );
};

const PathCard = ({ path }: PathCardProps) => {
  const isLight = path.theme === "light";
  const cornerColor = isLight ? "border-white" : "border-white";

  return (
    <div
      className={`
        relative flex flex-col w-full min-h-120 p-8 md:p-10 transition-all duration-300
        ${
          isLight
            ? "bg-white text-black shadow-2xl shadow-white/5 scale-[1.03] z-10 rounded-lg"
            : "bg-[#0a0a0a] text-white rounded-lg"
        }
      `}
    >
      <CornerBracket position="top-left" colorClass={cornerColor} />
      <CornerBracket position="top-right" colorClass={cornerColor} />
      <CornerBracket position="bottom-left" colorClass={cornerColor} />
      <CornerBracket position="bottom-right" colorClass={cornerColor} />

      <div className="grow flex flex-col">
        <h3 className="text-[22px] font-medium tracking-tight mb-3">
          {path.title}
        </h3>
        <p
          className={`text-[14px] leading-relaxed mb-10 pr-4 ${isLight ? "text-gray-700" : "text-gray-400"}`}
        >
          {path.description}
        </p>
        <ul className="space-y-5 mb-12 grow">
          {path.features.map((feature: string, fIndex: number) => (
            <li key={fIndex} className="flex items-start gap-4 group">
              <CircleCheck
                className={`w-4.5 h-4.5 shrink-0 mt-0.75 
                  ${isLight ? "text-black stroke-[1.5]" : "text-gray-400 stroke-[1.25] group-hover:text-white"}
                `}
              />
              <span
                className={`text-[15px] leading-snug ${isLight ? "text-gray-800" : "text-gray-300"}`}
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link href="/contact-us" className="w-full">
        <Button
          variant={isLight ? "default" : "outline"}
          className="w-full group h-11! text-sm"
        >
          <span>{path.buttonText}</span>
          <ArrowUpRight
            className="size-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            strokeWidth={1.5}
          />
        </Button>
      </Link>
    </div>
  );
};

const ExecutionPaths = () => {
  return (
    <section className="py-24 md:py-32">
      <div className="w-full max-w-[1480] mx-auto px-3 sm:px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-20">
          <div>
            <SectionLabel text="How we work" />
            <h2 className="text-4xl md:text-5xl lg:text-[56px] text-muted-foreground font-heading">
              How You Can <span className="text-foreground">Work</span> <br className="hidden sm:block" />
              <span className="text-foreground">With Us</span>
            </h2>
          </div>
          <p className="text-muted-foreground lg:pb-3">
            We partner with teams that care about building products the right
            way from the start.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center">
          <div className="relative flex flex-col w-full min-h-120 p-8 md:p-10 transition-all duration-300 bg-card/70">
            <CornerBracket position="top-left" colorClass="border-white" />
            <CornerBracket position="top-right" colorClass="border-white" />
            <CornerBracket position="bottom-left" colorClass="border-white" />
            <CornerBracket position="bottom-right" colorClass="border-white" />

            <div className="grow flex flex-col">
              <h3 className="text-[22px] font-medium tracking-tight mb-3">
                MVP Launch Program
              </h3>
              <p className="mb-8 pr-4 text-muted-foreground">
                For founders going from idea to a production-ready product.
              </p>
              <ul className="space-y-5 mb-12 grow text-muted-foreground">
                <li className="flex items-start gap-4 group">
                  <CircleCheck
                    className={`w-4.5 h-4.5 shrink-0 mt-0.75 
                `}
                  />
                  End-to-end product design + build
                </li>
                <li className="flex items-start gap-4 group">
                  <CircleCheck
                    className={`w-4.5 h-4.5 shrink-0 mt-0.75 
                `}
                  />
                  Scalable architecture from day one
                </li>
                <li className="flex items-start gap-4 group">
                  <CircleCheck
                    className={`w-4.5 h-4.5 shrink-0 mt-0.75 
                `}
                  />
                  Fast, structured delivery
                </li>
              </ul>
            </div>

            <Button className="w-full group h-11! text-sm">
              <span>Start MVP Program</span>
              <ArrowUpRight
                className="size-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                strokeWidth={1.5}
              />
            </Button>
          </div>
          <div className="relative flex flex-col w-full min-h-120 p-8 md:p-10 transition-all duration-300 bg-white text-black">
            <CornerBracket position="top-left" colorClass="border-white" />
            <CornerBracket position="top-right" colorClass="border-white" />
            <CornerBracket position="bottom-left" colorClass="border-white" />
            <CornerBracket position="bottom-right" colorClass="border-white" />

            <div className="grow flex flex-col">
              <h3 className="text-[22px] font-medium tracking-tight mb-3">
                MVP Launch Program
              </h3>
              <p className="mb-8 pr-4 text-black/70">
                For founders going from idea to a production-ready product.
              </p>
              <ul className="space-y-5 mb-12 grow text-black/70">
                <li className="flex items-start gap-4 group">
                  <CircleCheck
                    className={`w-4.5 h-4.5 shrink-0 mt-0.75 
                `}
                  />
                  End-to-end product design + build
                </li>
                <li className="flex items-start gap-4 group">
                  <CircleCheck
                    className={`w-4.5 h-4.5 shrink-0 mt-0.75 
                `}
                  />
                  Scalable architecture from day one
                </li>
                <li className="flex items-start gap-4 group">
                  <CircleCheck
                    className={`w-4.5 h-4.5 shrink-0 mt-0.75 
                `}
                  />
                  Fast, structured delivery
                </li>
              </ul>
            </div>

            <Button className="w-full group h-11! text-sm bg-black text-white hover:bg-black/90">
              <span>Start MVP Program</span>
              <ArrowUpRight
                className="size-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                strokeWidth={1.5}
              />
            </Button>
          </div>
              <div className="relative flex flex-col w-full min-h-120 p-8 md:p-10 transition-all duration-300 bg-card/70">
            <CornerBracket position="top-left" colorClass="border-white" />
            <CornerBracket position="top-right" colorClass="border-white" />
            <CornerBracket position="bottom-left" colorClass="border-white" />
            <CornerBracket position="bottom-right" colorClass="border-white" />

            <div className="grow flex flex-col">
              <h3 className="text-[22px] font-medium tracking-tight mb-3">
                MVP Launch Program
              </h3>
              <p className="mb-8 pr-4 text-muted-foreground">
                For founders going from idea to a production-ready product.
              </p>
              <ul className="space-y-5 mb-12 grow text-muted-foreground">
                <li className="flex items-start gap-4 group">
                  <CircleCheck
                    className={`w-4.5 h-4.5 shrink-0 mt-0.75 
                `}
                  />
                  End-to-end product design + build
                </li>
                <li className="flex items-start gap-4 group">
                  <CircleCheck
                    className={`w-4.5 h-4.5 shrink-0 mt-0.75 
                `}
                  />
                  Scalable architecture from day one
                </li>
                <li className="flex items-start gap-4 group">
                  <CircleCheck
                    className={`w-4.5 h-4.5 shrink-0 mt-0.75 
                `}
                  />
                  Fast, structured delivery
                </li>
              </ul>
            </div>

            <Button className="w-full group h-11! text-sm">
              <span>Start MVP Program</span>
              <ArrowUpRight
                className="size-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                strokeWidth={1.5}
              />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExecutionPaths;
