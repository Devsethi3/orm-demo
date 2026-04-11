export const SectionLabel = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3 mb-8">
    <div className="size-2.5 mb-0.5 bg-white"></div>
    <span className="text-xs sm:text-sm font-chivo-mono uppercase text-foreground/80">{text}</span>
  </div>
);
