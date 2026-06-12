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
}

export default function ScoringMatrix({
  candidates,
  tradeCriteria,
  scores,
  screeningScores,
  screening,
  onChange,
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
      <h3 className="panel-title" style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
        Scoring Matrix (0–5 Scale)
      </h3>
      <p className="panel-subtitle" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        Enter raw scores from 0 (Poor) to 5 (Excellent). Weighted scores and totals are calculated instantly.
      </p>

      <div className="table-wrapper">
        <table className="matrix-table">
          <thead>
            <tr>
              <th>Candidate</th>
              {tradeCriteria.map((tc) => (
                <th key={tc.id} title={tc.desc || tc.name}>
                  <div>{tc.name}</div>
                  <small style={{ color: "var(--accent-blue)" }}>
                    {tc.id} ({tc.weight}%)
                  </small>
                </th>
              ))}
              <th style={{ textAlign: "right" }}>Total Score (0-1)</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((cand) => {
              const isExcluded = getOverallScreeningStatus(cand.id) === "Fail";
              const totalScore = calculateRowTotal(cand.id);

              return (
                <tr key={cand.id} style={{ opacity: isExcluded ? 0.65 : 1 }}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 600 }}>{cand.name}</span>
                      <small style={{ color: "var(--text-muted)" }}>
                        {cand.id} {isExcluded && <span style={{ color: "var(--accent-red)", fontWeight: "bold" }}>(Screening Fail)</span>}
                      </small>
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
                            className="form-input"
                            style={{ width: "70px", padding: "0.4rem 0.5rem", textAlign: "center" }}
                          />
                          <small style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
                            w: {weightedVal.toFixed(3)}
                          </small>
                        </div>
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "right", fontWeight: 700, fontSize: "1.1rem" }}>
                    <div style={{ color: isExcluded ? "var(--text-muted)" : "var(--accent-green)" }}>
                      {totalScore.toFixed(3)}
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
