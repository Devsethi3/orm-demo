import { ArrowUpRight, CircleCheck } from "lucide-react";
// Assuming these are your custom components from your project's `ui` folder
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
    buttonText: "START SPRINT", // Changed for variety
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
                className={`w-4.5 h-4.5 shrink-0 mt-0.75 transition-transform group-hover:scale-110 
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

      <Button
        variant={isLight ? "default" : "outline"}
        className="w-full group h-12 text-sm"
      >
        <span>{path.buttonText}</span>
        <ArrowUpRight
          className="size-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          strokeWidth={1.5}
        />
      </Button>
    </div>
  );
};

const ExecutionPaths = () => {
  return (
    <section className="bg-black text-white py-24 md:py-32">
      <div className="w-full max-w-[1480] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-20">
          <div>
            <SectionLabel text="How we work" />
            <h2 className="text-4xl md:text-5xl lg:text-[56px] text-gray-100 font-heading">
              How You Can Work <br className="hidden sm:block" />
              <span className="italic text-white">With Us</span>
            </h2>
          </div>
          <p className="text-gray-400 text-base leading-relaxed max-w-md lg:pb-3">
            We partner with teams that care about building products the right
            way from the start.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center">
          {pathsData.map((path: ExecutionPath, index: number) => (
            <PathCard key={index} path={path} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExecutionPaths;
