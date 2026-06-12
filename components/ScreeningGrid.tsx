"use client";

import React from "react";
import { Candidate, ScreeningCriterion } from "../types/trade";

interface ScreeningGridProps {
  candidates: Candidate[];
  screening: ScreeningCriterion[];
  screeningScores: Record<string, Record<string, "Pass" | "Fail">>;
  onChange: (scores: Record<string, Record<string, "Pass" | "Fail">>) => void;
}

export default function ScreeningGrid({
  candidates,
  screening,
  screeningScores,
  onChange,
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
      <h3 className="panel-title" style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
        Screening Matrix (Pass / Fail)
      </h3>
      <p className="panel-subtitle" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        Filter candidates before scoring. Candidates failing any <strong>required (Y)</strong> criterion are automatically excluded.
      </p>

      <div className="table-wrapper">
        <table className="matrix-table">
          <thead>
            <tr>
              <th>Candidate</th>
              {screening.map((sc) => (
                <th key={sc.id} title={sc.desc || sc.name}>
                  <div>{sc.name}</div>
                  <small style={{ color: sc.required === "Y" ? "var(--accent-purple)" : "var(--text-muted)" }}>
                    {sc.id} {sc.required === "Y" ? "(Req)" : "(Opt)"}
                  </small>
                </th>
              ))}
              <th style={{ textAlign: "center" }}>Overall Status</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((cand) => {
              const status = getOverallStatus(cand.id);
              const isFailed = status === "Fail";

              return (
                <tr key={cand.id} style={{ opacity: isFailed ? 0.75 : 1 }}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{cand.name}</div>
                    <small style={{ color: "var(--text-muted)" }}>{cand.id}</small>
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
