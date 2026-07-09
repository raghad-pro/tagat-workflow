import React from "react";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/atoms/Button";
import { Building2, Rocket, Globe2, TestTube, Briefcase, User, Hourglass } from "lucide-react";

export interface CompanyCardProps {
  id: number;
  name: string;
  domain?: string;
  logo?: string;
  status?: "none" | "pending" | "approved" | "active" | "rejected";
  onJoin?: (id: number) => void;
  isLoading?: boolean;
}

// Helper to assign a random icon and color based on company ID or name
const getCompanyIconConfig = (id: number) => {
  const configs = [
    { icon: Building2, bg: "rgba(14,165,233,0.1)", color: "#0ea5e9" }, // light blue
    { icon: Rocket, bg: "rgba(99,102,241,0.1)", color: "#6366f1" }, // indigo
    { icon: Briefcase, bg: "rgba(245,158,11,0.1)", color: "#f59e0b" }, // amber/orange
    { icon: User, bg: "rgba(168,85,247,0.1)", color: "#a855f7" }, // purple
    { icon: TestTube, bg: "rgba(100,116,139,0.1)", color: "#64748b" }, // slate
    { icon: Globe2, bg: "rgba(15,118,110,0.1)", color: "#0f766e" }, // teal
  ];
  return configs[id % configs.length];
};

export function CompanyCard({ id, name, domain, logo, status, onJoin, isLoading }: CompanyCardProps) {
  const isPending = status === "pending";
  const isApproved = status === "approved" || status === "active";
  const { bg, color } = getCompanyIconConfig(id);
  const Icon = Building2; // Always use Building2 for fallback as requested

  let buttonText = "Join Request";
  if (isPending) buttonText = "Pending";
  if (isApproved) buttonText = "Approved";

  // Classes for the button
  let buttonClasses = "w-full font-medium";
  if (isPending) {
    buttonClasses += " ds-bg-primary-200 ds-text-brand border-none"; // Cyan background and text like sidebar
  } else if (isApproved) {
    buttonClasses += " ds-icon-success border-none"; // Light green background, green text
  }

  return (
    <div className="ds-bg-form rounded-2xl p-5 border ds-border-form transition-all hover:shadow-md flex flex-col justify-between" style={{ minHeight: "200px" }}>
      {/* Top Section */}
      <div className="flex justify-between items-start mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" 
          style={!logo ? { background: bg, color: color } : { background: '#f8fafc' }}
        >
          {logo ? (
            <img src={logo} alt={name} className="w-full h-full object-cover" />
          ) : (
            <Icon size={24} strokeWidth={1.5} />
          )}
        </div>
        
        {isPending && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ds-bg-primary-200 ds-text-brand border-none">
            <Hourglass size={12} />
            <span>Pending</span>
          </div>
        )}
      </div>
      
      {/* Middle Section */}
      <div className="flex-1 mb-6">
        <Text size="base" weight="bold" className="ds-text-primary line-clamp-1 mb-1">
          {name}
        </Text>
        <Text size="sm" className="ds-text-gray-200 line-clamp-1">
          {domain || "no-domain.com"}
        </Text>
      </div>

      {/* Bottom Section */}
      <Button
        variant={isPending ? "outline" : "solid"}
        size="md"
        className={buttonClasses + (isPending ? " !border-transparent" : "")}
        disabled={isPending || isApproved || isLoading}
        onClick={() => !isApproved && onJoin && onJoin(id)}
      >
        {buttonText}
      </Button>
    </div>
  );
}
