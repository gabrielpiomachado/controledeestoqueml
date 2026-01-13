import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "positive" | "negative" | "neutral";
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend = "neutral", className }: StatCardProps) {
  return (
    <div className={cn("stat-card animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="stat-label">{title}</p>
          <p className={cn(
            "stat-value",
            trend === "positive" && "stat-positive",
            trend === "negative" && "stat-negative"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          trend === "positive" && "bg-success/10 text-success",
          trend === "negative" && "bg-destructive/10 text-destructive",
          trend === "neutral" && "bg-primary/10 text-primary"
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
