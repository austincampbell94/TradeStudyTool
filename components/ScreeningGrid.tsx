"use client";

import React from "react";
import { Candidate, ScreeningCriterion } from "../types/trade";

interface ScreeningGridProps {
  candidates: Candidate[];
  screening: ScreeningCriterion[];
  screeningScores: Record<string, Record<string, "Pass" | "Fail">>;
  onChange: (scores: Record<string, Record<string, "Pass" | "Fail">>) => void;
  onCandidatesChange?: (candidates: Candidate[]) => void;
  onScreeningChange?: (screening: ScreeningCriterion[]) => void;
}

export default function ScreeningGrid({
  candidates,
  screening,
  screeningScores,
  onChange,
  onCandidatesChange,
  onScreeningChange,
}: ScreeningGridProps) {
  
  const handleToggle = (candId: string, screenId: string) => {
    const currentScore = (screeningScores[candId] && screeningScores[candId][screenId]) || "Pass";
    const nextScore: "Pass" | "Fail" = currentScore === "Pass" ? "Fail" : "Pass";

    const updated: Record<string, Record<string, "Pass" | "Fail">> = {
      ...screeningScores,
      [candId]: {
        ...screeningScores[candId],
        [screenId]: nextScore,
      },
    };
    onChange(updated);
  };

  // Helper to determine if a candidate passed all required screening criteria
  const getOverallStatus = (candId: string) => {
    const candScores = screeningScores[candId] || {};
    for (const sc of screening) {
      if (sc.required === "Y") {
        const score = candScores[sc.id] || "Pass"; // defaults to Pass if not interacted with
        if (score === "Fail") return "Fail";
      }
    }
    return "Pass";
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
        <h3 className="panel-title" style={{ fontSize: "1.25rem", margin: 0 }}>
          Screening Matrix (Pass / Fail)
        </h3>
        <div className="tooltip-container">
          <span style={{ cursor: "help", fontSize: "1.1rem", opacity: 0.7 }}>❓</span>
          <span className="tooltip-text">
            <strong>How to use the Screening Matrix:</strong>
            <br />
            1. Toggle each candidate as <strong>Pass</strong> or <strong>Fail</strong> for each screening criterion.
            <br />
            2. If a candidate is marked as <strong>Fail</strong> on a <strong>Required (Y)</strong> criterion, they are immediately excluded.
            <br />
            3. Excluded candidates are visually marked in red and excluded from scoring calculations.
          </span>
        </div>
      </div>
      <p className="panel-subtitle" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        Filter candidates before scoring. Candidate details are locked here, but you can edit screening criteria inline.
      </p>

      <div className="table-wrapper">
        <table className="matrix-table">
          <thead>
            <tr>
              <th>Candidate</th>
              {screening.map((sc, scIdx) => (
                <th key={sc.id} style={{ minWidth: "145px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", textAlign: "center", color: "var(--text-primary)" }}>
                      {sc.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: sc.required === "Y" ? "var(--accent-purple)" : "var(--text-muted)", textAlign: "center", fontWeight: "bold" }}>
                      {sc.required === "Y" ? "Required (Y)" : "Optional (N)"}
                    </div>
                  </div>
                </th>
              ))}
              <th style={{ textAlign: "center", minWidth: "130px" }}>Overall Status</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((cand, candIdx) => {
              const status = getOverallStatus(cand.id);
              const isFailed = status === "Fail";

              return (
                <tr key={cand.id} style={{ opacity: isFailed ? 0.75 : 1 }}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                        {cand.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <small style={{ color: "var(--text-muted)", flexShrink: 0 }}>{cand.id}</small>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {cand.desc || <span style={{ fontStyle: "italic", opacity: 0.6 }}>No description</span>}
                        </span>
                      </div>
                    </div>
                  </td>
                  {screening.map((sc) => {
                    const score = (screeningScores[cand.id] && screeningScores[cand.id][sc.id]) || "Pass";
                    const isPass = score === "Pass";

                    return (
                      <td key={sc.id}>
                        <button
                          type="button"
                          onClick={() => handleToggle(cand.id, sc.id)}
                          className={`toggle-btn ${isPass ? "pass" : "fail"}`}
                        >
                          {isPass ? "✓ Pass" : "✗ Fail"}
                        </button>
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "center" }}>
                    <span className={isFailed ? "badge-fail" : "badge-pass"}>
                      {isFailed ? "EXCLUDED" : "PASSED"}
                    </span>
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
