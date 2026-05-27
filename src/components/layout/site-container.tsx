import { cn } from "@/lib/utils";

interface SiteContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "main";
  narrow?: boolean;
}

export function SiteContainer({
  children,
  className,
  as: Component = "div",
  narrow = false,
}: SiteContainerProps) {
  return (
    <Component
      className={cn(
        "mx-auto w-full px-4 py-8 sm:px-6 lg:px-8",
        narrow ? "max-w-4xl" : "max-w-7xl",
        className
      )}
    >
      {children}
    </Component>
  );
}
