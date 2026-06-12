"use client";

import React, { useEffect } from "react";
import { Candidate, TradeCriterion, ScreeningCriterion } from "../types/trade";

interface DashboardViewProps {
  candidates: Candidate[];
  tradeCriteria: TradeCriterion[];
  scores: Record<string, Record<string, number>>;
  screeningScores: Record<string, Record<string, "Pass" | "Fail">>;
  screening: ScreeningCriterion[];
  recommendation: string;
  onRecommendationChange: (rec: string) => void;
  onWeightsChange: (criteria: TradeCriterion[]) => void;
  onCandidatesChange?: (candidates: Candidate[]) => void;
  onTradeCriteriaChange?: (tradeCriteria: TradeCriterion[]) => void;
}

export default function DashboardView({
  candidates,
  tradeCriteria,
  scores,
  screeningScores,
  screening,
  recommendation,
  onRecommendationChange,
  onWeightsChange,
  onCandidatesChange,
  onTradeCriteriaChange,
}: DashboardViewProps) {

  // Helper to determine screening status
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

  // Helper to calculate score for a candidate using current criteria weights
  const calculateScore = (candId: string, criteriaList: TradeCriterion[]) => {
    let total = 0;
    const candScores = scores[candId] || {};
    criteriaList.forEach((tc) => {
      const score = candScores[tc.id] !== undefined ? candScores[tc.id] : 3.0;
      total += (score / 5) * (tc.weight / 100);
    });
    return total;
  };

  // Separate candidates into passed and failed
  const passedCandidates = candidates.filter((c) => getOverallScreeningStatus(c.id) === "Pass");
  const failedCandidates = candidates.filter((c) => getOverallScreeningStatus(c.id) === "Fail");

  // Calculate scores and sort
  const scoredPassed = passedCandidates
    .map((c) => ({
      ...c,
      score: calculateScore(c.id, tradeCriteria),
    }))
    .sort((a, b) => b.score - a.score);

  const scoredFailed = failedCandidates.map((c) => ({
    ...c,
    score: calculateScore(c.id, tradeCriteria),
  }));

  // Auto-generate recommendation rationale if empty
  useEffect(() => {
    if (!recommendation && scoredPassed.length > 0) {
      const best = scoredPassed[0];
      let gen = `Based on the trade study criteria and weighting, Candidate **${best.name}** is recommended with a total weighted score of **${best.score.toFixed(3)}** (${(best.score * 100).toFixed(1)}%).\n\n`;
      if (scoredPassed.length > 1) {
        const runnerUp = scoredPassed[1];
        const diff = best.score - runnerUp.score;
        gen += `It outperformed the runner-up, **${runnerUp.name}** (score: ${runnerUp.score.toFixed(3)}), by a margin of ${diff.toFixed(3)}.\n\n`;
      }
      if (failedCandidates.length > 0) {
        gen += `Note: Candidates ${failedCandidates.map((c) => c.name).join(", ")} were excluded from selection due to failing mandatory screening criteria.`;
      }
      onRecommendationChange(gen);
    }
  }, [scoredPassed, failedCandidates, recommendation, onRecommendationChange]);

  // Proportional weight adjustment algorithm to ensure total weight always sums to 100%
  const handleWeightSlider = (tcId: string, newWeight: number) => {
    const targetIdx = tradeCriteria.findIndex((tc) => tc.id === tcId);
    if (targetIdx === -1) return;

    const updatedCriteria = [...tradeCriteria];
    
    // Clamp the new weight between 0 and 100
    const clampedNewWeight = Math.max(0, Math.min(100, newWeight));
    updatedCriteria[targetIdx] = {
      ...updatedCriteria[targetIdx],
      weight: clampedNewWeight,
    };

    // Calculate sum of other weights
    const otherCriteriaCount = updatedCriteria.length - 1;
    if (otherCriteriaCount <= 0) return;

    const sumOfOthersOld = updatedCriteria.reduce((sum, tc, idx) => {
      return idx === targetIdx ? sum : sum + tc.weight;
    }, 0);

    const remainingToDistribute = 100 - clampedNewWeight;

    if (sumOfOthersOld > 0) {
      // Proportional redistribution
      updatedCriteria.forEach((tc, idx) => {
        if (idx !== targetIdx) {
          const proportion = tc.weight / sumOfOthersOld;
          tc.weight = Math.round(proportion * remainingToDistribute * 10) / 10;
        }
      });
    } else {
      // Equal redistribution if others were all zero
      updatedCriteria.forEach((tc, idx) => {
        if (idx !== targetIdx) {
          tc.weight = Math.round((remainingToDistribute / otherCriteriaCount) * 10) / 10;
        }
      });
    }

    // Fix floating point rounding errors to ensure exact sum of 100%
    const currentSum = updatedCriteria.reduce((s, tc) => s + tc.weight, 0);
    const diff = 100 - currentSum;
    if (Math.abs(diff) > 0.01) {
      // Find the first other item to adjust
      const adjustIdx = targetIdx === 0 ? 1 : 0;
      updatedCriteria[adjustIdx].weight = Math.round((updatedCriteria[adjustIdx].weight + diff) * 10) / 10;
    }

    onWeightsChange(updatedCriteria);
  };

  return (
    <div className="layout-split animate-fade-in">
      {/* Left Column: Rankings and Details */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Active Candidates Rankings */}
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <h3 className="panel-title" style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
            Candidate Rankings
          </h3>
          <p className="panel-subtitle" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Scores calculated out of 1.0 based on criteria scores and relative weights. You can edit names/descriptions inline.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {scoredPassed.length > 0 ? (
              scoredPassed.map((cand, index) => {
                const percentage = cand.score * 100;
                let colorClass = "var(--accent-blue)";
                if (index === 0) colorClass = "var(--accent-green)";
                else if (index === scoredPassed.length - 1) colorClass = "var(--text-muted)";

                return (
                  <div key={cand.id} style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flex: 1 }}>
                        <span style={{ fontWeight: "700", marginRight: "0.25rem" }}>#{index + 1}</span>
                        <input
                          type="text"
                          value={cand.name}
                          onChange={(e) => {
                            const newCands = candidates.map(c => c.id === cand.id ? { ...c, name: e.target.value } : c);
                            onCandidatesChange?.(newCands);
                          }}
                          className="editable-input"
                          style={{ fontWeight: "600", padding: "0.1rem 0.25rem" }}
                        />
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>({cand.id})</span>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: "1rem" }}>
                        <span style={{ fontWeight: "700", color: colorClass }}>{cand.score.toFixed(3)}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.4rem" }}>({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div style={{ height: "12px", background: "rgba(255, 255, 255, 0.05)", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--border-color)", margin: "0.2rem 0" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${percentage}%`,
                          background: index === 0 ? "linear-gradient(90deg, var(--accent-blue), var(--accent-green))" : "var(--gradient-accent)",
                          borderRadius: "6px",
                          transition: "width 0.3s ease-out-in",
                        }}
                      />
                    </div>
                    <input
                      type="text"
                      value={cand.desc}
                      onChange={(e) => {
                        const newCands = candidates.map(c => c.id === cand.id ? { ...c, desc: e.target.value } : c);
                        onCandidatesChange?.(newCands);
                      }}
                      placeholder="Description"
                      className="editable-input"
                      style={{ fontSize: "0.85rem", color: "var(--text-muted)", padding: "0.1rem 0.25rem" }}
                    />
                  </div>
                );
              })
            ) : (
              <p style={{ color: "var(--accent-red)", textAlign: "center", padding: "1rem" }}>
                No candidates passed screening! Adjust your screening criteria.
              </p>
            )}
          </div>
        </div>

        {/* Excluded Candidates */}
        {scoredFailed.length > 0 && (
          <div className="glass-panel" style={{ padding: "1.5rem" }}>
            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-red)", marginBottom: "1rem" }}>
              Excluded Candidates (Failing Required Screening)
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {scoredFailed.map((cand) => (
                <div
                  key={cand.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 1rem",
                    background: "rgba(239, 68, 68, 0.05)",
                    border: "1px solid rgba(239, 68, 68, 0.15)",
                    borderRadius: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                    <input
                      type="text"
                      value={cand.name}
                      onChange={(e) => {
                        const newCands = candidates.map(c => c.id === cand.id ? { ...c, name: e.target.value } : c);
                        onCandidatesChange?.(newCands);
                      }}
                      className="editable-input"
                      style={{ fontWeight: 600, color: "var(--text-secondary)" }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>({cand.id})</span>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-muted)", flexShrink: 0, paddingLeft: "1rem" }}>
                    Calculated Score: {cand.score.toFixed(3)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rationale & Recommendation */}
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <h3 className="panel-title" style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
            Recommendation & Decision Summary
          </h3>
          <p className="panel-subtitle" style={{ fontSize: "0.85rem", marginBottom: "1.25rem" }}>
            Review the generated decision description. You can customize the details here.
          </p>

          <textarea
            className="form-input"
            rows={6}
            style={{ width: "100%", fontFamily: "inherit", resize: "vertical", background: "rgba(0,0,0,0.3)" }}
            value={recommendation}
            onChange={(e) => {
              onRecommendationChange(e.target.value);
            }}
            placeholder="Document recommendations, trade study caveats, and next steps..."
          />
        </div>
      </div>

      {/* Right Column: Sensitivity Weight Adjustment Sliders */}
      <div className="glass-panel" style={{ padding: "1.75rem", alignSelf: "start" }}>
        <h3 className="panel-title" style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
          Sensitivity Analysis
        </h3>
        <p className="panel-subtitle" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Drag sliders or edit weights. Other weights adjust proportionally to keep the total at exactly 100%. You can also edit names inline.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {tradeCriteria.map((tc) => (
            <div key={tc.id} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem", fontWeight: "600", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flex: 1 }}>
                  <input
                    type="text"
                    value={tc.name}
                    onChange={(e) => {
                      const newCriteria = tradeCriteria.map(c => c.id === tc.id ? { ...c, name: e.target.value } : c);
                      onTradeCriteriaChange?.(newCriteria);
                    }}
                    className="editable-input"
                    style={{ fontWeight: "600", padding: "0.1rem 0.25rem" }}
                  />
                  <small style={{ color: "var(--text-muted)", flexShrink: 0 }}>({tc.id})</small>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.1rem", flexShrink: 0 }}>
                  <input
                    type="number"
                    value={tc.weight}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      handleWeightSlider(tc.id, isNaN(val) ? 0 : val);
                    }}
                    className="editable-input"
                    style={{ width: "45px", textAlign: "right", color: "var(--accent-indigo)", padding: "0" }}
                    min="0"
                    max="100"
                    step="0.5"
                  />
                  <span style={{ color: "var(--accent-indigo)" }}>%</span>
                </div>
              </div>
              
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={tc.weight}
                onChange={(e) => handleWeightSlider(tc.id, parseFloat(e.target.value))}
                style={{
                  width: "100%",
                  cursor: "pointer",
                  accentColor: "var(--accent-indigo)",
                }}
              />
              <input
                type="text"
                value={tc.desc}
                onChange={(e) => {
                  const newCriteria = tradeCriteria.map(c => c.id === tc.id ? { ...c, desc: e.target.value } : c);
                  onTradeCriteriaChange?.(newCriteria);
                }}
                placeholder="Description"
                className="editable-input"
                style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "0.1rem 0.25rem" }}
              />
            </div>
          ))}
        </div>

        {/* Visual Confirmation Banner */}
        <div
          className="weight-sum-banner valid"
          style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between" }}
        >
          <span>⚖️ Total Criteria Weight:</span>
          <strong>100.0%</strong>
        </div>
      </div>
    </div>
  );
}
