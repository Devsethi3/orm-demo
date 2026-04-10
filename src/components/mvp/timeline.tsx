import { CircleCheck } from "lucide-react";

const timelineData = [
  {
    week: "Week 1",
    title: "Product Discovery",
    items: [
      "Product Roadmap",
      "Feature Prioritization",
      "System Architecture Planning",
    ],
  },
  {
    week: "Week 2 - 4",
    title: "Core Development",
    items: [
      "Frontend Interfaces",
      "Backend Systems",
      "Database Structure",
      "API Integrations",
    ],
  },
  {
    week: "Week 5 - 6",
    title: "Polishing & Features",
    items: [
      "Authentication",
      "RBAC Implementation",
      "Analytics Integration",
      "Security Checks",
    ],
  },
  {
    week: "Week 7 - 8",
    title: "Testing & Launch Preparation",
    items: [
      "Deployment",
      "Optimization & Refinements",
      "Performance Testing",
      "Bug Fixing",
    ],
  },
];

const Timeline = () => {
  return (
    <div className="min-h-screen overflow-hidden py-12 sm:py-16 lg:py-24">
      <div className="max-w-[1480px] px-3 lg:px-12 mx-auto">
        <div className="mb-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-2.5 bg-white"></div>
            <span className="text-sm font-chivo-mono uppercase">
              Timeline
            </span>
          </div>

          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-normal leading-[1.1] mb-8 text-muted-foreground">
            MVP Project <br />
            <span className="text-foreground italic">Timeline</span>
          </h1>

          <div className="relative w-full flex items-center">
            <div className="relative ml-auto bg-black pl-6 py-1 text-sm text-foreground/70 hidden md:block z-10">
              A typical MVP build follows a 6-8 week execution timeline.
            </div>
          </div>
          <div className="mt-4 text-sm text-foreground/70 md:hidden">
            A typical MVP build follows a 6-8 week execution timeline.
          </div>
        </div>

        <div className="relative w-full flex flex-col">
          <div className="absolute left-[15px] md:left-1/2 top-0 bottom-0 w-px bg-white/50 md:-translate-x-1/2"></div>

          {timelineData.map((item, index) => {
            const isLeft = index % 2 === 0;

            return (
              <div
                key={index}
                className="relative flex items-center mb-16 md:mb-32 w-full group"
              >
                {isLeft ? null : <div className="hidden md:block flex-1"></div>}

                <div className="absolute left-[15px] md:left-1/2 top-[24px] md:top-1/2 w-[14px] h-[14px] bg-gray-300 rounded-full -translate-x-1/2 md:-translate-y-1/2 z-10 ring-4 ring-black"></div>

                <div
                  className={`flex-1 flex w-full pl-12 md:pl-0 ${isLeft ? "md:justify-end md:pr-16" : "md:justify-start md:pl-16"}`}
                >
                  <div className="relative w-full">
                    <div
                      className={`hidden md:block absolute top-1/2 w-16 border-t border-dashed border-gray-600 -translate-y-1/2 z-0
                      ${isLeft ? "-right-16" : "-left-16"}
                    `}
                    ></div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-2.5 bg-white"></div>
                      <h3 className="font-chivo-mono">
                        {item.week} :{" "}
                        <span>{item.title}</span>
                      </h3>
                    </div>

                    <div className="relative border border-white/50 bg-card/50 p-6 sm:p-8 hover:border-white/40 hover:bg-muted/40 transition-colors duration-300">
                      <div className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-white/80"></div>
                      <div className="absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2 border-white/80"></div>
                      <div className="absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2 border-white/80"></div>
                      <div className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-white/80"></div>

                      <ul className="space-y-4">
                        {item.items.map((listItem, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-4 text-foreground/80 text-[15px]"
                          >
                            <CircleCheck className="w-[18px] h-[18px] stroke-[1.5] mt-[2px] shrink-0" />
                            <span className="leading-snug">{listItem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {isLeft ? <div className="hidden md:block flex-1"></div> : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
