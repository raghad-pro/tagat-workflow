import { LucideIcon } from "lucide-react";

interface StepCardProps {
  num: number;
  title: string;
  desc: string;
  icon: LucideIcon;
}

export function StepCard({ num, title, desc, icon: Icon }: StepCardProps) {
  return (
    <div className="relative ds-bg px-8 pt-12 pb-8 rounded-2xl shadow-sm border border-border flex flex-col items-center text-center mt-6 md:mt-0 transition-transform hover:-translate-y-1 hover:shadow-md duration-300">
      
      {/* Number Badge overlapping the top border */}
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary/10 text-primary border-4 border-background flex items-center justify-center font-bold">
        {num}
      </div>

      {/* Icon */}
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary-hover text-white flex items-center justify-center font-bold text-xl mb-6 shadow-md shadow-primary/30">
        <Icon className="w-8 h-8" />
      </div>
      
      <h3 className="mb-4 font-bold text-xl text-foreground">
        {title}
      </h3>
      <p className="ds-text-gray-200">{desc}</p>
    </div>
  );
}
