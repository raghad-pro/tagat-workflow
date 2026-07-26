import React from "react";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/atoms/Button";
import { Building2, Rocket, Globe2, TestTube, Briefcase, User, Hourglass } from "lucide-react";

export interface CompanyCardProps {
  id: number;
  name: string;
  domain?: string;
  logo?: string | null;
  status?: "none" | "pending" | "approved" | "active" | "rejected";
  onJoin?: (id: number) => void;
  isLoading?: boolean;
}

// Helper to assign the brand color and Building2 icon for companies without logos
const getCompanyIconConfig = (id: number) => {
  return { icon: Building2, bg: "rgba(81,209,225,0.1)", color: "#51D1E1" }; // brand color
};

export function CompanyCard({ id, name, domain, logo, status, onJoin, isLoading }: CompanyCardProps) {
  const isPending = status === "pending";
  const isApproved = status === "approved" || status === "active";
  const { icon: Icon, bg, color } = getCompanyIconConfig(id);

  let buttonText = "Join Request";
  if (isPending) buttonText = "Pending";
  if (isApproved) buttonText = "Approved";

  // Classes for the button
  let buttonClasses = "w-full font-medium";
  if (isPending) {
    buttonClasses += " !bg-[#51D1E1] !text-white border-none"; // Cyan background and text like sidebar
  } else if (isApproved) {
    buttonClasses += " !bg-[rgba(34,197,94,0.10)] !text-[#15803d] border-none"; // Light green background, green text
  }

  return (
    <div className="ds-bg-form rounded-2xl p-5 border ds-border-form transition-all hover:shadow-md flex flex-col justify-between" style={{ minHeight: "200px" }}>
      {/* Top Section */}
      <div className="flex justify-between items-start mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm border border-slate-100 overflow-hidden" 
          style={!logo ? { background: bg, color: color, borderColor: 'transparent' } : {}}
        >
          {logo ? (
            <img src={logo} alt={`${name} logo`} className="w-full h-full object-cover" />
          ) : (
            <Icon size={24} strokeWidth={1.5} />
          )}
        </div>
        
        {isPending && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#51D1E1] text-white border-none">
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
        disabled={isPending || isApproved}
        loading={isLoading}
        onClick={() => !isApproved && onJoin && onJoin(id)}
      >
        {buttonText}
      </Button>
    </div>
  );
}
