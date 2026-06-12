export interface TradeStudyMeta {
  project: string;
  sponsor: string;
  lead: string;
  date: string;
  version: string;
}

export interface Candidate {
  id: string;
  name: string;
  desc: string;
}

export interface ScreeningCriterion {
  id: string;
  name: string;
  desc: string;
  required: "Y" | "N";
}

export interface TradeCriterion {
  id: string;
  name: string;
  desc: string;
  weight: number;
}

export interface TradeStudyData {
  meta: TradeStudyMeta;
  screening: ScreeningCriterion[];
  tradeCriteria: TradeCriterion[];
  candidates: Candidate[];
  scores: Record<string, Record<string, number>>; // C-1 -> TC-1 -> score (0-5)
  screeningScores: Record<string, Record<string, "Pass" | "Fail">>; // C-1 -> SC-1 -> "Pass" | "Fail"
}
