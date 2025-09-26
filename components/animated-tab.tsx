"use client"

import { useState, useEffect } from "react"
import { TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface AnimatedTabProps {
  value: string
  icon: LucideIcon
  label: string
  gradientFrom: string
  gradientTo: string
  iconAnimation?: "rotate" | "scale" | "bounce" | "pulse"
  className?: string
}

const iconAnimations = {
  rotate: "group-hover:rotate-12 group-data-[state=active]:rotate-12",
  scale: "group-hover:scale-110 group-data-[state=active]:scale-110",
  bounce: "group-hover:animate-bounce group-data-[state=active]:animate-bounce",
  pulse: "group-hover:animate-pulse group-data-[state=active]:animate-pulse",
}

export function AnimatedTab({
  value,
  icon: Icon,
  label,
  gradientFrom,
  gradientTo,
  iconAnimation = "scale",
  className,
}: AnimatedTabProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isActive, setIsActive] = useState(false)

  return (
    <TabsTrigger
      value={value}
      className={cn(
        "flex items-center gap-2 group relative overflow-hidden transition-all duration-300 ease-out",
        "hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
        "data-[state=active]:shadow-lg data-[state=active]:shadow-black/10 dark:data-[state=active]:shadow-black/30",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      {/* Animated background gradient */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-r opacity-0 transition-all duration-300 ease-out",
          `from-${gradientFrom}/10 to-${gradientTo}/10`,
          (isHovered || isActive) && "opacity-100"
        )}
      />
      
      {/* Ripple effect */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 transition-opacity duration-300",
          (isHovered || isActive) && "opacity-100"
        )}
      />
      
      {/* Icon with animation */}
      <Icon 
        className={cn(
          "w-4 h-4 transition-all duration-300 ease-out relative z-10",
          iconAnimations[iconAnimation]
        )}
      />
      
      {/* Label with subtle animation */}
      <span className="transition-all duration-300 ease-out relative z-10 group-hover:translate-x-0.5">
        {label}
      </span>
      
      {/* Active indicator */}
      <div 
        className={cn(
          "absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r transition-all duration-300 ease-out",
          `from-${gradientFrom} to-${gradientTo}`,
          isActive && "w-3/4 -translate-x-1/2"
        )}
      />
    </TabsTrigger>
  )
}

// Pre-configured animated tabs for common use cases
export const AnimatedTabs = {
  Overview: (props: Partial<AnimatedTabProps>) => (
    <AnimatedTab
      value="overview"
      icon={require("lucide-react").BarChart3}
      label="Overview"
      gradientFrom="blue"
      gradientTo="purple"
      iconAnimation="rotate"
      {...props}
    />
  ),
  
  Charts: (props: Partial<AnimatedTabProps>) => (
    <AnimatedTab
      value="charts"
      icon={require("lucide-react").TrendingUp}
      label="Charts"
      gradientFrom="green"
      gradientTo="emerald"
      iconAnimation="scale"
      {...props}
    />
  ),
  
  Browser: (props: Partial<AnimatedTabProps>) => (
    <AnimatedTab
      value="browser"
      icon={require("lucide-react").Search}
      label="Key Browser"
      gradientFrom="orange"
      gradientTo="red"
      iconAnimation="rotate"
      {...props}
    />
  ),
  
  Console: (props: Partial<AnimatedTabProps>) => (
    <AnimatedTab
      value="console"
      icon={require("lucide-react").Terminal}
      label="Console"
      gradientFrom="purple"
      gradientTo="pink"
      iconAnimation="scale"
      {...props}
    />
  ),
  
  Settings: (props: Partial<AnimatedTabProps>) => (
    <AnimatedTab
      value="settings"
      icon={require("lucide-react").Settings}
      label="Settings"
      gradientFrom="gray"
      gradientTo="slate"
      iconAnimation="rotate"
      {...props}
    />
  ),
}
