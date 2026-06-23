"use client";

import React from "react";
import { Candidate, TradeCriterion, ScreeningCriterion } from "../types/trade";

interface ScoringMatrixProps {
  candidates: Candidate[];
  tradeCriteria: TradeCriterion[];
  scores: Record<string, Record<string, number>>;
  screeningScores: Record<string, Record<string, "Pass" | "Fail">>;
  screening: ScreeningCriterion[];
  onChange: (scores: Record<string, Record<string, number>>) => void;
  onCandidatesChange?: (candidates: Candidate[]) => void;
  onTradeCriteriaChange?: (tradeCriteria: TradeCriterion[]) => void;
}

export default function ScoringMatrix({
  candidates,
  tradeCriteria,
  scores,
  screeningScores,
  screening,
  onChange,
  onCandidatesChange,
  onTradeCriteriaChange,
}: ScoringMatrixProps) {
  
  const handleScoreChange = (candId: string, tcId: string, value: number) => {
    // Clamp values between 0 and 5
    const clamped = Math.max(0, Math.min(5, value));
    const updated = {
      ...scores,
      [candId]: {
        ...scores[candId],
        [tcId]: clamped,
      },
    };
    onChange(updated);
  };

  const getOverallScreeningStatus = (candId: string) => {
    const candScores = screeningScores[candId] || {};
    for (const sc of screening) {
      if (sc.required === "Y") {
        const score = candScores[sc.id] || "Pass";
        if (score === "Fail") return "Fail";
      }
    }
    return "Pass";
  };

  const calculateRowTotal = (candId: string) => {
    let total = 0;
    const candScores = scores[candId] || {};
    
    tradeCriteria.forEach((tc) => {
      const score = candScores[tc.id] !== undefined ? candScores[tc.id] : 3.0; // default to 3
      const weightFactor = tc.weight / 100;
      total += (score / 5) * weightFactor;
    });

    return total;
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
        <h3 className="panel-title" style={{ fontSize: "1.25rem" }}>
          Scoring Matrix (0–5 Scale)
        </h3>
        <div className="tooltip-container">
          <span style={{ cursor: "help", fontSize: "1rem", opacity: 0.7 }}>❓</span>
          <span className="tooltip-text">
            <strong>How to use the Scoring Matrix:</strong>
            <br />
            1. Rate each candidate option against each weighted criterion on a scale from 0 (poor) to 5 (excellent).
            <br />
            2. The system computes the weighted scores instantly: <em>(Raw Score / 5) × (Weight / 100)</em>.
            <br />
            3. The <strong>Total Score</strong> (0 to 1.0) is the sum of these weighted scores.
          </span>
        </div>
      </div>
      <p className="panel-subtitle" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        Enter raw scores from 0 (Poor) to 5 (Excellent). You can edit candidate and criteria names inline.
      </p>

      <div className="table-wrapper">
        <table className="matrix-table">
          <thead>
            <tr>
              <th>Candidate</th>
              {tradeCriteria.map((tc, tcIdx) => (
                <th key={tc.id} style={{ minWidth: "120px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", textAlign: "center", color: "var(--text-primary)", padding: "0.25rem 0" }}>
                      {tc.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.15rem" }}>
                      <small style={{ fontSize: "0.75rem", color: "var(--accent-blue)" }}>
                        {tc.id} ({tc.weight.toFixed(2)}%)
                      </small>
                    </div>
                  </div>
                </th>
              ))}
              <th style={{ textAlign: "right", minWidth: "120px" }}>Total Score (0-1)</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((cand, candIdx) => {
              const isExcluded = getOverallScreeningStatus(cand.id) === "Fail";
              const totalScore = calculateRowTotal(cand.id);

              return (
                <tr key={cand.id} style={{ opacity: isExcluded ? 0.65 : 1 }}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", paddingLeft: "0.4rem" }}>
                        {cand.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", paddingLeft: "0.4rem" }}>
                        <small style={{ color: "var(--text-muted)", flexShrink: 0 }}>{cand.id}</small>
                        {cand.desc && (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            — {cand.desc}
                          </span>
                        )}
                      </div>
                      {isExcluded && (
                        <span style={{ color: "var(--accent-red)", fontWeight: "bold", fontSize: "0.75rem", paddingLeft: "0.4rem" }}>
                          (Screening Fail)
                        </span>
                      )}
                    </div>
                  </td>
                  {tradeCriteria.map((tc) => {
                    const currentScore =
                      scores[cand.id] && scores[cand.id][tc.id] !== undefined
                        ? scores[cand.id][tc.id]
                        : 3.0;

                    const weightedVal = (currentScore / 5) * (tc.weight / 100);

                    return (
                      <td key={tc.id}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                           <input
                             type="number"
                             min="0"
                             max="5"
                             step="0.1"
                             value={currentScore}
                             onChange={(e) => {
                               const val = parseFloat(e.target.value);
                               handleScoreChange(cand.id, tc.id, isNaN(val) ? 0 : val);
                             }}
                             onKeyDown={(e) => {
                               if (["e", "E", "+", "-"].includes(e.key)) {
                                 e.preventDefault();
                               }
                             }}
                             className="form-input"
                             style={{ width: "70px", padding: "0.4rem 0.5rem", textAlign: "center" }}
                           />
                          <small style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
                            w: {weightedVal.toFixed(2)}
                          </small>
                        </div>
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "right", fontWeight: 700, fontSize: "1.1rem" }}>
                    <div style={{ color: isExcluded ? "var(--text-muted)" : "var(--accent-green)" }}>
                      {totalScore.toFixed(2)}
                      <div style={{ fontSize: "0.75rem", fontWeight: "normal", color: "var(--text-muted)" }}>
                        {(totalScore * 100).toFixed(1)}%
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
