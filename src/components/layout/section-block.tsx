import { cn } from "@/lib/utils";

interface SectionBlockProps {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SectionBlock({
  id,
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: SectionBlockProps) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-24 space-y-5", className)}
    >
      {(title || description || action) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            {title && <h2 className="section-title">{title}</h2>}
            {description && (
              <p className="section-description">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
