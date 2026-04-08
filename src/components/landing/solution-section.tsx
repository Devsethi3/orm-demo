import { LayersIcon, NetworkIcon, ArrowDownUp } from "lucide-react";

const SectionLabel = ({ text }:{text:string}) => (
  <div className="flex items-center gap-3 mb-8">
    <div className="size-2.5 mb-0.5 bg-white"></div>
    <span className="text-xs sm:text-sm font-chivo-mono uppercase">
      {text}
    </span>
  </div>    
);

const SolutionSection = () => {
  return (
    <div className="w-full bg-black text-white font-sans selection:bg-white selection:text-black">
      <section className="px-3 lg:px-12 py-16 lg:py-28 max-w-[1480px] mx-auto">
        <SectionLabel text="The Problem" />
        <p className="lg:text-4xl md:text-3xl text-xl font-light text-foreground/80 lg:leading-normal leading-tight">
          Most startup products don&apos;t fail because of bad ideas, they fail
          because execution is fragmented. Design and engineering fall out of
          sync, speed is prioritized over structure, and what gets built isn&apos;t
          designed to scale. Over time, this creates technical debt and slows
          everything down.
        </p>
      </section>

      <section className="relative px-3 py-16 lg:py-28 lg:px-12 bg-[#0c0c0c] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.15] mix-blend-screen pointer-events-none"
          style={{
            backgroundImage: `url('/hero.svg')`,
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none"></div>

        <div className="relative z-10 lg:px-12 max-w-[1480px] mx-auto">
          <SectionLabel text="Our Solution" />

          <div className="flex flex-col lg:flex-row lg:items-end justify-between lg:gap-8 gap-3 mb-16 lg:mb-20">
            <h2 className="text-3xl sm:text-5xl lg:text-[3.5rem] leading-[1.1] tracking-tight text-white">
              <span className="text-muted-foreground">
                A System Built for
              </span>
              <br />
              <span className="">Structured Execution</span>
            </h2>
            <p className="text-[#a1a1aa] text-sm sm:text-base leading-relaxed max-w-sm lg:mb-2">
              A structured approach to building products where design,
              engineering, and scalability are considered from day one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white text-black p-6 lg:p-10 flex flex-col justify-between min-h-[360px] lg:min-h-[420px] transition-transform duration-300 hover:-translate-y-1 group">
              <div>
                <ArrowDownUp className="text-black group-hover:scale-110 transition-transform duration-300 origin-top-left" />
              </div>
              <div>
                <h3 className="font-chivo-mono font-medium tracking-wide mb-4 uppercase">
                  Structured AI Product Development
                </h3>
                <p className="text-[#52525b] text-[14px] sm:text-[15px] leading-relaxed">
                  Scalable systems with defined processes and consistent
                  execution — ensuring predictable outcomes as you move fast.
                </p>
              </div>
            </div>

            <div className="bg-white text-black p-8 lg:p-10 flex flex-col justify-between min-h-[360px] lg:min-h-[420px] transition-transform duration-300 hover:-translate-y-1 group">
              <div>
                <LayersIcon className="text-black group-hover:scale-110 transition-transform duration-300 origin-top-left" />
              </div>
              <div>
                <h3 className="font-chivo-mono font-medium tracking-wide mb-4 uppercase">
                  Senior Engineering Leadership
                </h3>
                <p className="text-[#52525b] text-[14px] sm:text-[15px] leading-relaxed">
                  Senior engineers guiding architecture, maintaining quality,
                  and ensuring long-term scalability as your product evolves.
                </p>
              </div>
            </div>

            <div className="bg-white text-black p-8 lg:p-10 flex flex-col justify-between min-h-[360px] lg:min-h-[420px] transition-transform duration-300 hover:-translate-y-1 group md:col-span-2 lg:col-span-1">
              <div>
                <NetworkIcon className="text-black group-hover:scale-110 transition-transform duration-300 origin-top-left" />
              </div>
              <div>
                <h3 className="font-chivo-mono font-medium tracking-wide mb-4 uppercase">
                  AI-Accelerated Workflows
                </h3>
                <p className="text-[#52525b] text-[14px] sm:text-[15px] leading-relaxed">
                  Faster, efficient iteration cycles powered by modern AI
                  tooling — helping you ship quickly without compromising
                  quality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SolutionSection;
