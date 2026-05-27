import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-bold">Politician not found</h1>
      <p className="mt-2 text-muted-foreground">
        The profile you&apos;re looking for doesn&apos;t exist or has been
        removed.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to Leaderboard</Link>
      </Button>
    </div>
  );
}
