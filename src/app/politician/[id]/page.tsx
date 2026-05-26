import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PoliticianProfile } from "@/components/politician/politician-profile";
import {
  getPoliticianProfile,
  getPoliticianProfileIds,
} from "@/lib/politician";

interface PoliticianPageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const ids = await getPoliticianProfileIds();
  return ids.slice(0, 50).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: PoliticianPageProps): Promise<Metadata> {
  const politician = await getPoliticianProfile(params.id);

  if (!politician) {
    return { title: "Politician Not Found" };
  }

  return {
    title: politician.name,
    description: `Stock trading profile for ${politician.name} (${politician.party}, ${politician.chamber}).`,
  };
}

export default async function PoliticianPage({ params }: PoliticianPageProps) {
  const politician = await getPoliticianProfile(params.id);

  if (!politician) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PoliticianProfile politician={politician} />
    </div>
  );
}
