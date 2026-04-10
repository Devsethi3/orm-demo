import { SectionLabel } from "../ui/section-label";
import {
  SiNextdotjs,
  SiReact,
  SiAstro,
  SiAngular,
  SiTypescript,
  SiNodedotjs,
  SiSupabase,
  SiGo,
  SiPython,
  SiPostgresql,
  SiReactquery,
  SiFigma,
  SiFramer,
  SiWebflow,
  SiGooglecloud,
  SiCloudflare,
  SiDigitalocean,
  SiFlutter,
  SiAndroid,
  SiApple,
  SiOpenai,
  SiUnrealengine,
  SiLottiefiles,
  SiReplit,
} from "react-icons/si";
import { VscAzure } from "react-icons/vsc";
import { FaCode, FaRobot, FaDatabase, FaAws } from "react-icons/fa";
import { TbBrandVercel, TbVector } from "react-icons/tb";
import { cn } from "@/lib/utils"; // Assuming you have this utility

// --- Data & Icon Mapping (Unchanged) ---
const iconMap: { [key: string]: React.ReactElement } = {
  "Next.JS": <SiNextdotjs />,
  ReactJS: <SiReact />,
  Astro: <SiAstro />,
  Angular: <SiAngular />,
  TypeScript: <SiTypescript />,
  NodeJS: <SiNodedotjs />,
  Supabase: <SiSupabase />,
  NeonDB: <FaDatabase className="text-green-400" />,
  GoLang: <SiGo />,
  Python: <SiPython />,
  PostgreSQL: <SiPostgresql />,
  AWS: <FaAws />,
  GCP: <SiGooglecloud />,
  Cloudflare: <SiCloudflare />,
  Vercel: <TbBrandVercel />,
  Azure: <VscAzure />,
  "Digital Ocean": <SiDigitalocean />,
  "React Native": <SiReactquery />,
  Flutter: <SiFlutter />,
  Android: <SiAndroid />,
  IOS: <SiApple />,
  "Vector DB": <TbVector />,
  "AI Agents": <FaRobot />,
  OpenAI: <SiOpenai />,
  ClaudeAI: <FaRobot className="text-orange-400" />,
  "Knowledge Graph": <FaCode />,
  Figma: <SiFigma />,
  Framer: <SiFramer />,
  "Unicorn Studio": <SiUnrealengine />,
  "Spline 3D": <FaCode />,
  Webflow: <SiWebflow />,
  Lottie: <SiLottiefiles />,
  "Google Antigravity": <FaCode />,
  "Claude Code": <FaCode />,
  Lovable: <FaCode />,
  Base44: <FaCode />,
  Replit: <SiReplit />,
  "Cursor AI": <FaCode />,
  Copilot: <FaCode />,
  Bolt: <FaCode />,
  "Code Rabbit": <FaCode />,
};
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
  { title: "MOBILE", items: ["React Native", "Flutter", "Android", "IOS"] },
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

const BlueprintCorners = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-10 rounded-lg"
  >
    <div className="absolute -left-[2px] -top-[2px] h-3 w-3 border-l-2 border-t-2 border-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:scale-75 group-hover:opacity-100" />
    <div className="absolute -right-[2px] -top-[2px] h-3 w-3 border-r-2 border-t-2 border-white opacity-0 transition-all duration-300 group-hover:-translate-x-0 group-hover:translate-y-0 group-hover:scale-75 group-hover:opacity-100" />
    <div className="absolute -bottom-[2px] -left-[2px] h-3 w-3 border-b-2 border-l-2 border-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:-translate-y-0 group-hover:scale-75 group-hover:opacity-100" />
    <div className="absolute -bottom-[2px] -right-[2px] h-3 w-3 border-b-2 border-r-2 border-white opacity-0 transition-all duration-300 group-hover:-translate-x-0 group-hover:-translate-y-0 group-hover:scale-75 group-hover:opacity-100" />
  </div>
);

const TechItem = ({ name }: { name: string }) => {
  const icon = iconMap[name] || <FaCode />;

  return (
    <div
      className={cn(
        "group relative flex cursor-default items-center justify-center gap-2 rounded-lg border p-2 text-center transition-all duration-300 ease-in-out",
        "border-zinc-800 bg-zinc-900 bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.05),rgba(255,255,255,0.05)_1.5px,transparent_1.5px,transparent_9px)]",
        "hover:z-10 hover:border-zinc-500",
      )}
    >
      <BlueprintCorners />

      <div className="size-4 text-zinc-400 transition-colors duration-300 group-hover:text-white">
        {icon}
      </div>
      <p className="mt-1 text-xs lg:text-sm font-medium text-zinc-400 transition-colors duration-300 group-hover:text-white">
        {name}
      </p>
    </div>
  );
};

export default function TechStackSection() {
  return (
    <section className="w-full bg-black text-white py-24 px-4 md:px-8 lg:px-12 flex flex-col items-center selection:bg-white selection:text-black">
      <div className="flex flex-col items-center mb-20 max-w-4xl text-center">
        <SectionLabel text="AI + Tech Stack" />
        <h2 className="mt-4 font-heading text-4xl sm:text-5xl md:text-[4rem] leading-[1.1] text-zinc-300">
          Modern Startup <br className="hidden md:block" />
          <span className="text-white italic">Technology Stack</span>
        </h2>
      </div>

      <div className="w-full max-w-7xl flex flex-col gap-16 md:gap-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-16 gap-y-16">
          {gridCategories.map((category) => (
            <div key={category.title}>
              <h3 className="mb-6 font-mono text-sm font-medium uppercase tracking-widest text-zinc-400">
                {category.title}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                {category.items.map((tech) => (
                  <TechItem key={tech} name={tech} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 md:pt-0">
          <h3 className="mb-6 font-mono text-sm font-medium uppercase tracking-widest text-zinc-400">
            {fullWidthCategory.title}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-4">
            {fullWidthCategory.items.map((tech) => (
              <TechItem key={tech} name={tech} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
