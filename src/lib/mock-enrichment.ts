export interface MockTradeEnrichment {
  filingDate: string;
  excessReturn: number | null;
}

export const MOCK_TRADE_ENRICHMENT: Record<string, MockTradeEnrichment> = {
  t1: { filingDate: "2026-05-18", excessReturn: 22.4 },
  t2: { filingDate: "2026-04-10", excessReturn: 8.6 },
  t3: { filingDate: "2026-03-25", excessReturn: -4.2 },
  t4: { filingDate: "2026-05-08", excessReturn: 11.3 },
  t5: { filingDate: "2026-04-28", excessReturn: 6.1 },
  t6: { filingDate: "2026-05-02", excessReturn: 14.8 },
  t7: { filingDate: "2026-04-22", excessReturn: 9.2 },
  t8: { filingDate: "2026-03-18", excessReturn: 5.4 },
  t8b: { filingDate: "2026-04-26", excessReturn: 19.7 },
  t9: { filingDate: "2026-04-12", excessReturn: 7.8 },
  t9b: { filingDate: "2026-05-01", excessReturn: 12.5 },
  t10: { filingDate: "2026-03-08", excessReturn: -9.6 },
  t11: { filingDate: "2026-05-20", excessReturn: 3.2 },
  t12: { filingDate: "2026-04-20", excessReturn: 16.9 },
  t12b: { filingDate: "2026-05-22", excessReturn: 21.1 },
};

export function getMockTradeEnrichment(
  tradeId: string
): MockTradeEnrichment | undefined {
  return MOCK_TRADE_ENRICHMENT[tradeId];
}
