"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildCsv, CsvExportRow, downloadCsv } from "@/lib/csv-export";

interface ExportCsvButtonProps {
  rows: CsvExportRow[];
  filename: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ExportCsvButton({
  rows,
  filename,
  label = "Export CSV",
  variant = "outline",
  size = "sm",
  className,
}: ExportCsvButtonProps) {
  function handleExport() {
    if (rows.length === 0) {
      return;
    }

    downloadCsv(filename, buildCsv(rows));
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleExport}
      disabled={rows.length === 0}
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

interface ExportCsvLinkProps {
  href: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExportCsvLink({
  href,
  label = "Export CSV",
  variant = "outline",
  size = "sm",
}: ExportCsvLinkProps) {
  return (
    <Button variant={variant} size={size} asChild>
      <a href={href} download>
        <Download className="h-3.5 w-3.5" />
        {label}
      </a>
    </Button>
  );
}
