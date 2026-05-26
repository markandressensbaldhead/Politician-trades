"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, X } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Politician } from "@/types";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

interface SearchResultsProps {
  politicians: Politician[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}

export function SearchResults({ politicians: allPoliticians }: SearchResultsProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return allPoliticians;

    return allPoliticians.filter(
      (p) =>
        p.name.toLowerCase().includes(normalized) ||
        p.state.toLowerCase().includes(normalized) ||
        p.party.toLowerCase().includes(normalized) ||
        p.chamber.toLowerCase().includes(normalized) ||
        p.committee.toLowerCase().includes(normalized)
    );
  }, [query, allPoliticians]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name, state, party, or committee..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9 h-11 bg-card/50 border-border/60"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={() => setQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {results.length} politician{results.length !== 1 ? "s" : ""} found
      </p>

      <div className="grid gap-3">
        {results.map((politician) => (
          <Link key={politician.id} href={`/politician/${politician.id}`}>
            <Card className="border-border/60 bg-card/50 transition-colors hover:border-primary/30 hover:bg-card/80">
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-secondary">
                    {getInitials(politician.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{politician.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {politician.party}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {politician.chamber}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {politician.state}
                    {politician.district ? `-${politician.district}` : ""} ·{" "}
                    {politician.committee}
                  </p>
                </div>

                <div className="hidden sm:block text-right shrink-0">
                  <p
                    className={cn(
                      "font-mono tabular-nums font-medium",
                      politician.ytdReturn >= 0 ? "text-gain" : "text-loss"
                    )}
                  >
                    {formatPercent(politician.ytdReturn)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono tabular-nums">
                    {formatCurrency(politician.portfolioValue)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {results.length === 0 && (
          <Card className="border-border/60 bg-card/50">
            <CardHeader className="text-center py-12">
              <CardTitle>No results found</CardTitle>
              <CardDescription>
                Try searching by a different name, state, or committee
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
