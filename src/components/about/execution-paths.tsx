import { ArrowUpRight, CircleCheck } from "lucide-react";
import { Button } from "../ui/button";

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
    buttonText: "START MVP PROGRAM",
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

const ExecutionPaths = () => {
  return (
    <section className="relative w-full bg-[#020202] text-white py-24 md:py-32 px-3 md:px-12 lg:px-24 overflow-hidden selection:bg-gray-800 selection:text-white min-h-screen flex items-center">
      <div className="relative z-10 w-full max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-20">
          <div className="flex flex-col">
            {/* Label */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-[6px] h-[6px] bg-white"></div>
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-gray-300">
                Execution Paths
              </span>
            </div>

            <h2 className="font-heading text-4xl md:text-5xl lg:text-[56px] text-[#f4f4f5] leading-[1.1] font-normal tracking-tight">
              How You Can Work <br className="hidden sm:block" />
              With Us
            </h2>
          </div>

          {/* Subtitle/Description */}
          <p className="text-[#a1a1aa] text-[15px] leading-relaxed max-w-[480px] lg:pb-3">
            We partner with teams that care about building products the right
            way from the start.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pathsData.map((path, index) => {
            const isLight = path.theme === "light";

            return (
              <div
                key={index}
                className={`
                  relative flex flex-col w-full min-h-[480px] p-8 md:p-10 transition-all duration-300
                  ${isLight ? "bg-white text-black shadow-2xl scale-[1.02] md:scale-[1.03] z-10" : "bg-[#0a0a0a] text-white border border-transparent"}
                `}
                style={
                  isLight
                    ? {
                        clipPath:
                          "polygon(0.2% 0.5%, 99.8% 0%, 100% 99.5%, 0% 100%)",
                      }
                    : {}
                }
              >
                {!isLight && (
                  <>
                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/60"></div>
                    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/60"></div>
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/60"></div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/60"></div>
                  </>
                )}

                <div className="flex-grow flex flex-col">
                  <h3
                    className={`text-[22px] font-medium tracking-tight mb-3 ${isLight ? "text-black" : "text-white"}`}
                  >
                    {path.title}
                  </h3>

                  <p
                    className={`text-[14px] leading-relaxed mb-10 pr-4 ${isLight ? "text-gray-800" : "text-[#888888]"}`}
                  >
                    {path.description}
                  </p>

                  <ul className="space-y-6 mb-12 flex-grow">
                    {path.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-4 group">
                        <CircleCheck
                          className={`w-[18px] h-[18px] shrink-0 mt-[2px] transition-transform group-hover:scale-110 
                            ${isLight ? "text-black stroke-[1.5]" : "text-gray-400 stroke-[1.25] group-hover:text-white"}
                          `}
                        />
                        <span
                          className={`text-[14px] leading-snug tracking-tight ${isLight ? "text-black font-medium" : "text-gray-300"}`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  className={`
                    w-full group h-11
                    ${isLight ? "bg-black text-white" : "bg-white text-black"}
                  `}
                >
                  <span
                    className={`text-sm ${isLight ? "text-white" : "text-black"}`}
                  >
                    {path.buttonText}
                  </span>
                  <ArrowUpRight
                    className={`w-[18px] h-[18px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform 
                      ${isLight ? "text-white" : "text-black"}
                    `}
                    strokeWidth={1.5}
                  />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ExecutionPaths;
