
const gridCategories = [
  {
    title: "FRONTEND",
    items: ["Next.JS", "ReactJS", "Astro", "Angular", "TypeScript"],
  },
  {
    title: "INFRASTRUCTURE",
    items: ["AWS", "GCP", "Cloudflare", "Vercel", "Azure", "Digital Ocean"],
  },
  {
    title: "BACKEND",
    items: ["NodeJS", "Supabase", "NeonDB", "GoLang", "Python", "PostgreSQL"],
  },
  {
    title: "MOBILE",
    items: ["React Native", "Flutter", "Android", "IOS"],
  },
  {
    title: "AI",
    items: ["Vector DB", "AI Agents", "OpenAI", "ClaudeAI", "Knowledge Graph"],
  },
  {
    title: "DESIGN",
    items: [
      "Figma",
      "Framer",
      "Unicorn Studio",
      "Spline 3D",
      "Webflow",
      "Lottie",
    ],
  },
];

const fullWidthCategory = {
  title: "AI TOOLING",
  items: [
    "Google Antigravity",
    "Claude Code",
    "Lovable",
    "Base44",
    "Replit",
    "Cursor AI",
    "Copilot",
    "Bolt",
    "Code Rabbit",
  ],
};

const TechPill = ({ name }: { name: string }) => (
  <div className="bg-[#141414] px-5 py-2.5 text-[#d4d4d8] hover:bg-[#1f1f1f] text-foreground transition-colors cursor-default whitespace-nowrap">
    {name}
  </div>
);

export default function TechStackSection() {
  return (
    <section className="w-full min-h-screen bg-black text-white py-24 px-3 md:px-12 flex flex-col items-center selection:bg-white selection:text-black">
      <div className="flex flex-col items-center mb-24 max-w-4xl text-center">
        <div className="flex items-center gap-3 lg:mb-6 mb-3">
          <div className="size-3 bg-white mb-0.5"></div>
          <span className="lg:text-sm text-xs uppercase font-chivo-mono">
            AI + TECH STACK
          </span>
        </div>

        <h2 className="font-heading text-4xl sm:text-5xl md:text-[4rem] leading-[1.1] text-muted-foreground">
          Modern Startup <span className="text-foreground">Technology</span>{" "}
          <br className="hidden md:block" />{" "}
          <span className="text-foreground">Stack</span>
        </h2>
      </div>

      <div className="w-full max-w-[1380px] lg:px-12 flex flex-col gap-16 md:gap-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-24 gap-y-16">
          {gridCategories.map((category, index) => (
            <div key={index} className="flex flex-col">
              <h3 className="font-chivo-mono uppercase mb-6 text-white">
                {category.title}
              </h3>
              <div className="flex flex-wrap gap-3">
                {category.items.map((tech, idx) => (
                  <TechPill key={idx} name={tech} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col pt-4 md:pt-0">
          <h3 className="text-[13px] font-bold tracking-[0.15em] uppercase mb-6 text-white">
            {fullWidthCategory.title}
          </h3>
          <div className="flex flex-wrap gap-3">
            {fullWidthCategory.items.map((tech, idx) => (
              <TechPill key={idx} name={tech} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
