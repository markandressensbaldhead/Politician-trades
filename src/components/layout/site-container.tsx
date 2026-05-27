import { cn } from "@/lib/utils";

interface SiteContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "main";
}

export function SiteContainer({
  children,
  className,
  as: Component = "div",
}: SiteContainerProps) {
  return (
    <Component
      className={cn(
        "w-full px-4 py-8 sm:px-6 lg:px-8 xl:px-10 2xl:px-12",
        className
      )}
    >
      {children}
    </Component>
  );
}
