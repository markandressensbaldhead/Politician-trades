import { EdgarFiling } from "@/types";
import { prepareFilingsResponse } from "@/lib/filing-utils";
import {
  attachTradeKeysToFilings,
  buildTradeKeyForRow,
  buildTradeSecSnapshot,
} from "@/lib/sec-trade-matcher";
import {
  enrichFilingsWithExcerpts,
  getFilingsForPolitician,
} from "@/lib/sec-edgar";
import {
  congressRowToTradeInsert,
  edgarFilingToRow,
  getDistinctPoliticiansFromTrades,
  upsertSecFilings,
  updateTradeSecData,
} from "@/lib/supabase/sec-filings";
import {
  getExistingTradeKeysForPolitician,
  getTradesForPolitician,
  insertNewTrades,
  profileTradeToRow,
  quiverTradeToRow,
  syncPoliticianTradesIfMissing,
} from "@/lib/supabase/trades";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { slugify } from "@/lib/quiver-mappers";
import { fetchCongressTrades } from "@/lib/quiverquant";
import {
  getTrumpFilings,
  getTrumpProfile,
  isTrumpProfileId,
  TRUMP_PROFILE_ID,
} from "@/lib/trump-data";

export interface SyncSecFilingsResult {
  politiciansProcessed: number;
  filingsUpserted: number;
  tradesLinked: number;
  errors: string[];
}

interface PoliticianSecTarget {
  politicianId: string;
  politicianName: string;
  tickers: string[];
}

async function getPoliticiansForSecSync(): Promise<PoliticianSecTarget[]> {
  const targets = new Map<string, PoliticianSecTarget>();

  if (isSupabaseConfigured()) {
    const fromDb = await getDistinctPoliticiansFromTrades();

    for (const entry of fromDb) {
      targets.set(entry.politicianId, entry);
    }
  }

  const apiKey = process.env.QUIVERQUANT_API_KEY;
  if (apiKey) {
    try {
      const trades = await fetchCongressTrades(apiKey);
      const byPolitician = new Map<string, PoliticianSecTarget>();

      for (const trade of trades) {
        const politicianId = trade.BioGuideID || slugify(trade.Representative);
        const existing = byPolitician.get(politicianId) ?? {
          politicianId,
          politicianName: trade.Representative,
          tickers: [],
        };

        existing.tickers.push(trade.Ticker.toUpperCase());
        byPolitician.set(politicianId, existing);
      }

      for (const entry of byPolitician.values()) {
        const current = targets.get(entry.politicianId);
        targets.set(entry.politicianId, {
          politicianId: entry.politicianId,
          politicianName: entry.politicianName,
          tickers: [
            ...new Set([...(current?.tickers ?? []), ...entry.tickers]),
          ],
        });
      }
    } catch (error) {
      console.error(
        "Quiver politician index for SEC sync failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  const trumpProfile = await getTrumpProfile();
  targets.set(TRUMP_PROFILE_ID, {
    politicianId: TRUMP_PROFILE_ID,
    politicianName: trumpProfile.name,
    tickers: [...new Set(trumpProfile.trades.map((trade) => trade.ticker))],
  });

  return [...targets.values()];
}

async function fetchLiveFilings(target: PoliticianSecTarget): Promise<EdgarFiling[]> {
  if (isTrumpProfileId(target.politicianId)) {
    return getTrumpFilings();
  }

  return getFilingsForPolitician({
    politicianName: target.politicianName,
    tickers: target.tickers,
  });
}

async function getTradesForSecLink(target: PoliticianSecTarget) {
  if (isSupabaseConfigured()) {
    const rows = await getTradesForPolitician(target.politicianId, 200);

    if (rows.length > 0) {
      return rows.map(congressRowToTradeInsert);
    }
  }

  if (isTrumpProfileId(target.politicianId)) {
    const profile = await getTrumpProfile();

    return profile.trades.map((trade) =>
      profileTradeToRow(profile.id, profile.name, trade)
    );
  }

  const apiKey = process.env.QUIVERQUANT_API_KEY;
  if (!apiKey) {
    return [];
  }

  const trades = await fetchCongressTrades(apiKey);

  return trades
    .filter(
      (trade) =>
        trade.BioGuideID === target.politicianId ||
        slugify(trade.Representative) === target.politicianId
    )
    .map(quiverTradeToRow);
}

export async function syncSecFilingsForPolitician(
  target: PoliticianSecTarget
): Promise<{ filingsUpserted: number; tradesLinked: number }> {
  if (isSupabaseConfigured() && isTrumpProfileId(target.politicianId)) {
    const profile = await getTrumpProfile();
    await syncPoliticianTradesIfMissing(
      profile.id,
      profile.name,
      profile.trades
    );
  }

  const syncedAt = new Date().toISOString();
  let filings = await fetchLiveFilings(target);

  const enrichedTop = await enrichFilingsWithExcerpts(filings, 6);
  const excerptById = new Map(
    enrichedTop.map((filing) => [filing.id, filing.excerpt])
  );

  filings = prepareFilingsResponse(
    filings.map((filing) => ({
      ...filing,
      excerpt: excerptById.get(filing.id) ?? filing.excerpt,
    }))
  ).filings;

  const trades = await getTradesForSecLink(target);
  const filingTradeKeys = attachTradeKeysToFilings(trades, filings);

  if (isSupabaseConfigured() && trades.length > 0) {
    const existingKeys = await getExistingTradeKeysForPolitician(
      target.politicianId
    );
    const missingTrades = trades.filter(
      (trade) => !existingKeys.has(buildTradeKeyForRow(trade))
    );
    await insertNewTrades(missingTrades);
  }

  const rows = filings.map((filing) =>
    edgarFilingToRow(
      target.politicianId,
      target.politicianName,
      filing,
      filingTradeKeys.get(filing.id) ?? []
    )
  );

  const filingsUpserted = isSupabaseConfigured()
    ? await upsertSecFilings(rows)
    : 0;

  let tradesLinked = 0;

  if (isSupabaseConfigured()) {
    for (const trade of trades) {
      const snapshot = buildTradeSecSnapshot(trade, filings, syncedAt);

      if (snapshot.filings.length === 0) {
        continue;
      }

      await updateTradeSecData(buildTradeKeyForRow(trade), snapshot);
      tradesLinked += 1;
    }
  }

  return { filingsUpserted, tradesLinked };
}

export async function syncSecFilingsAndLinkTrades(): Promise<SyncSecFilingsResult> {
  const targets = await getPoliticiansForSecSync();
  const errors: string[] = [];
  let filingsUpserted = 0;
  let tradesLinked = 0;

  for (const target of targets) {
    try {
      const result = await syncSecFilingsForPolitician(target);
      filingsUpserted += result.filingsUpserted;
      tradesLinked += result.tradesLinked;
    } catch (error) {
      errors.push(
        `${target.politicianName}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  return {
    politiciansProcessed: targets.length,
    filingsUpserted,
    tradesLinked,
    errors,
  };
}
