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
  onCandidatesChange?: (candidates: Candidate[]) => void;
  meta?: {
    project: string;
    sponsor: string;
    lead: string;
    date: string;
    version: string;
  };
}

export default function DashboardView({
  candidates,
  tradeCriteria,
  scores,
  screeningScores,
  screening,
  recommendation,
  onRecommendationChange,
  onCandidatesChange,
  meta,
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
      let gen = `Based on the trade study criteria and weighting, Candidate **${best.name}** is recommended with a total weighted score of **${best.score.toFixed(2)}** (${(best.score * 100).toFixed(1)}%).\n\n`;
      if (scoredPassed.length > 1) {
        const runnerUp = scoredPassed[1];
        const diff = best.score - runnerUp.score;
        gen += `It outperformed the runner-up, **${runnerUp.name}** (score: ${runnerUp.score.toFixed(2)}), by a margin of ${diff.toFixed(2)}.\n\n`;
      }
      if (failedCandidates.length > 0) {
        gen += `Note: Candidates ${failedCandidates.map((c) => c.name).join(", ")} were excluded from selection due to failing mandatory screening criteria.`;
      }
      onRecommendationChange(gen);
    }
  }, [scoredPassed, failedCandidates, recommendation, onRecommendationChange]);



  const handleGeneratePPT = async () => {
    try {
      const pptxgenModule = await import("pptxgenjs");
      const pptxgen = pptxgenModule.default || pptxgenModule;
      const pptx = new pptxgen();
      
      const prjTitle = meta?.project || "Trade Study Evaluation";
      const prjSponsor = meta?.sponsor || "Not Documented";
      const prjLead = meta?.lead || "Not Documented";
      const prjDate = meta?.date || new Date().toLocaleDateString();
      const prjVer = meta?.version || "1.0";
      
      // Define Global Theme Colors
      const bgColor = "0F172A"; // Slate 900
      const cardColor = "1E293B"; // Slate 800
      const textColor = "F8FAFC"; // Slate 50
      const mutedTextColor = "94A3B8"; // Slate 400
      const accentColor = "6366F1"; // Indigo 500
      const greenColor = "10B981"; // Green 500
      const redColor = "EF4444"; // Red 500
      
      // =========================================================================
      // SLIDE 1: Title Slide (Dark Theme)
      // =========================================================================
      const slide1 = pptx.addSlide();
      slide1.background = { fill: bgColor };
      
      // Top accent bar
      slide1.addShape(pptxgen.shapes.RECTANGLE, {
        x: 0,
        y: 0,
        w: 10,
        h: 0.15,
        fill: { color: accentColor }
      });
      
      // Project Title
      slide1.addText(prjTitle, {
        x: 1.0,
        y: 1.8,
        w: 8.0,
        h: 1.2,
        fontSize: 36,
        bold: true,
        color: textColor,
        fontFace: "Arial",
        align: "left",
        valign: "top"
      });
      
      // Subtitle
      slide1.addText("Trade Study Evaluation & Recommendation", {
        x: 1.0,
        y: 2.9,
        w: 8.0,
        h: 0.4,
        fontSize: 16,
        color: accentColor,
        fontFace: "Arial",
        align: "left"
      });
      
      // Metadata section (Sponsor, Lead, Date, Version)
      const metaText = `Sponsor: ${prjSponsor}\nLead: ${prjLead}\nDate: ${prjDate} | Version: ${prjVer}`;
      slide1.addText(metaText, {
        x: 1.0,
        y: 3.7,
        w: 8.0,
        h: 1.2,
        fontSize: 12,
        color: mutedTextColor,
        fontFace: "Arial",
        align: "left",
        valign: "top"
      });
      
      // =========================================================================
      // SLIDE 2: Executive Summary (The Winner & Plain English Explanation)
      // =========================================================================
      const slide2 = pptx.addSlide();
      slide2.background = { fill: bgColor };
      
      // Title
      slide2.addText("Executive Summary & Recommendation", {
        x: 0.8,
        y: 0.5,
        w: 8.4,
        h: 0.6,
        fontSize: 24,
        bold: true,
        color: textColor,
        fontFace: "Arial"
      });
      
      // Line separator
      slide2.addShape(pptxgen.shapes.RECTANGLE, {
        x: 0.8,
        y: 1.1,
        w: 8.4,
        h: 0.02,
        fill: { color: accentColor }
      });
      
      if (scoredPassed.length > 0) {
        const winner = scoredPassed[0];
        const winnerScorePct = (winner.score * 100).toFixed(1);
        
        // Winner Box / Card
        slide2.addText(`RECOMMENDED DECISION`, {
          x: 0.8,
          y: 1.4,
          w: 8.4,
          h: 0.3,
          fontSize: 11,
          bold: true,
          color: mutedTextColor,
          fontFace: "Arial"
        });
        
        const winnerNameText = `${winner.name} (${winner.id})`;
        slide2.addText(winnerNameText, {
          x: 0.8,
          y: 1.7,
          w: 8.4,
          h: 0.8,
          fontSize: 28,
          bold: true,
          color: greenColor,
          fontFace: "Arial",
          fill: { color: cardColor },
          valign: "middle",
          align: "center"
        });
        
        // Plain English explanation points
        let explanation = "";
        explanation += `• Strategic Fit: ${winner.name} met all mandatory operational screening criteria without any exclusions.\n\n`;
        explanation += `• Performance Winner: Achieved the highest overall performance score of ${winnerScorePct}%.\n\n`;
        
        // Find highest scoring criteria
        const candScores = scores[winner.id] || {};
        const bestTC = [...tradeCriteria]
          .map(tc => ({ tc, val: candScores[tc.id] !== undefined ? candScores[tc.id] : 3.0 }))
          .sort((a, b) => b.val - a.val);
        
        if (bestTC.length > 0) {
          explanation += `• Strengths: Delivered exceptional results in "${bestTC[0].tc.name}" (weighted at ${bestTC[0].tc.weight}%) where it scored ${bestTC[0].val.toFixed(1)}/5.0.\n\n`;
        }
        
        if (scoredPassed.length > 1) {
          const runnerUp = scoredPassed[1];
          const diffPct = ((winner.score - runnerUp.score) * 100).toFixed(1);
          explanation += `• Competitive Margin: Outpaced the closest alternative, ${runnerUp.name}, by a clean margin of ${diffPct}%.`;
        } else {
          explanation += `• Unanimous Choice: Stands as the single qualified solution passing all evaluation bars.`;
        }
        
        slide2.addText(explanation, {
          x: 0.8,
          y: 2.7,
          w: 8.4,
          h: 2.4,
          fontSize: 13,
          color: textColor,
          fontFace: "Arial",
          valign: "top"
        });
      } else {
        slide2.addText("No candidates successfully passed all mandatory screening criteria.\n\nPlease review your Screening Matrix requirements.", {
          x: 0.8,
          y: 1.8,
          w: 8.4,
          h: 2.0,
          fontSize: 16,
          color: redColor,
          fontFace: "Arial",
          align: "center",
          valign: "middle"
        });
      }
      
      // =========================================================================
      // SLIDE 3: Screening Matrix (Pass/Fail)
      // =========================================================================
      const slide3 = pptx.addSlide();
      slide3.background = { fill: bgColor };
      
      slide3.addText("Screening & Eligibility Summary", {
        x: 0.8,
        y: 0.5,
        w: 8.4,
        h: 0.6,
        fontSize: 24,
        bold: true,
        color: textColor,
        fontFace: "Arial"
      });
      
      slide3.addShape(pptxgen.shapes.RECTANGLE, {
        x: 0.8,
        y: 1.1,
        w: 8.4,
        h: 0.02,
        fill: { color: accentColor }
      });
      
      // Explanation
      slide3.addText("Candidates are screened first against non-negotiable operational baseline requirements. Failure on a single Required (Y) criterion excludes a candidate from final performance rankings.", {
        x: 0.8,
        y: 1.3,
        w: 8.4,
        h: 0.6,
        fontSize: 11,
        color: mutedTextColor,
        fontFace: "Arial"
      });
      
      // Render Screening Table
      const screeningHeaders: any[] = [
        { text: "Candidate ID & Name", options: { bold: true, color: "FFFFFF", fill: { color: "1E293B" } } },
        { text: "Screening Status", options: { bold: true, color: "FFFFFF", fill: { color: "1E293B" }, align: "center" as const } },
        { text: "Issues / Exclusions", options: { bold: true, color: "FFFFFF", fill: { color: "1E293B" } } }
      ];
      
      const screeningRows: any[][] = [screeningHeaders];
      
      candidates.forEach(cand => {
        const isEx = getOverallScreeningStatus(cand.id) === "Fail";
        const statusText = isEx ? "EXCLUDED" : "PASSED";
        const statusColor = isEx ? redColor : greenColor;
        
        // Find failed required criteria
        const candScores = screeningScores[cand.id] || {};
        const failedReq = screening
          .filter(sc => sc.required === "Y" && candScores[sc.id] === "Fail")
          .map(sc => sc.name || sc.id);
        
        const issuesText = isEx 
          ? `Failed mandatory requirement: ${failedReq.join(", ") || "No specific requirement recorded"}` 
          : "Met all mandatory requirements.";
          
        screeningRows.push([
          { text: `${cand.name} (${cand.id})`, options: { color: "FFFFFF" } },
          { text: statusText, options: { color: statusColor, align: "center" as const, bold: true } },
          { text: issuesText, options: { color: isEx ? "EF4444" : "94A3B8" } }
        ]);
      });
      
      slide3.addTable(screeningRows, {
        x: 0.8,
        y: 2.1,
        w: 8.4,
        colW: [2.5, 1.8, 4.1],
        border: { type: "solid", color: "334155", pt: 1 },
        fontSize: 11,
        fontFace: "Arial"
      });
      
      // =========================================================================
      // SLIDE 4: Performance Ratings & Weighted Scores
      // =========================================================================
      const slide4 = pptx.addSlide();
      slide4.background = { fill: bgColor };
      
      slide4.addText("Weighted Performance Rankings", {
        x: 0.8,
        y: 0.5,
        w: 8.4,
        h: 0.6,
        fontSize: 24,
        bold: true,
        color: textColor,
        fontFace: "Arial"
      });
      
      slide4.addShape(pptxgen.shapes.RECTANGLE, {
        x: 0.8,
        y: 1.1,
        w: 8.4,
        h: 0.02,
        fill: { color: accentColor }
      });
      
      slide4.addText("Qualified candidates are ranked by their aggregate weighted performance score across evaluation criteria. Weights reflect priority level to senior leadership.", {
        x: 0.8,
        y: 1.3,
        w: 8.4,
        h: 0.6,
        fontSize: 11,
        color: mutedTextColor,
        fontFace: "Arial"
      });
      
      // Render Rankings Table
      const rankingsHeaders: any[] = [
        { text: "Rank", options: { bold: true, color: "FFFFFF", fill: { color: "1E293B" }, align: "center" as const } },
        { text: "Candidate Name", options: { bold: true, color: "FFFFFF", fill: { color: "1E293B" } } },
        { text: "Aggregate Weighted Score", options: { bold: true, color: "FFFFFF", fill: { color: "1E293B" }, align: "center" as const } },
        { text: "Percentage Rating", options: { bold: true, color: "FFFFFF", fill: { color: "1E293B" }, align: "center" as const } }
      ];
      
      const rankingsRows: any[][] = [rankingsHeaders];
      
      scoredPassed.forEach((cand, idx) => {
        const isWinner = idx === 0;
        rankingsRows.push([
          { text: `#${idx + 1}`, options: { bold: true, color: isWinner ? greenColor : "FFFFFF", align: "center" as const } },
          { text: isWinner ? `${cand.name} (RECOMMENDED)` : cand.name, options: { bold: isWinner, color: isWinner ? greenColor : "FFFFFF" } },
          { text: cand.score.toFixed(2), options: { bold: isWinner, color: isWinner ? greenColor : "FFFFFF", align: "center" as const } },
          { text: `${(cand.score * 100).toFixed(1)}%`, options: { bold: isWinner, color: isWinner ? greenColor : "FFFFFF", align: "center" as const } }
        ]);
      });
      
      slide4.addTable(rankingsRows, {
        x: 0.8,
        y: 2.1,
        w: 8.4,
        colW: [1.0, 3.8, 2.0, 1.6],
        border: { type: "solid", color: "334155", pt: 1 },
        fontSize: 11,
        fontFace: "Arial"
      });
      
      // Quick criteria weight breakdown summary text below
      let criteriaSummary = "Priority Criteria Weighting Breakdown:\n";
      tradeCriteria.forEach(tc => {
        criteriaSummary += `• ${tc.name}: ${tc.weight}%  `;
      });
      slide4.addText(criteriaSummary, {
        x: 0.8,
        y: 4.6,
        w: 8.4,
        h: 0.6,
        fontSize: 11,
        color: mutedTextColor,
        fontFace: "Arial",
        italic: true
      });
      
      // =========================================================================
      // SLIDE 5: Strategic Conclusion & Path Forward
      // =========================================================================
      const slide5 = pptx.addSlide();
      slide5.background = { fill: bgColor };
      
      slide5.addText("Conclusion & Recommended Next Steps", {
        x: 0.8,
        y: 0.5,
        w: 8.4,
        h: 0.6,
        fontSize: 24,
        bold: true,
        color: textColor,
        fontFace: "Arial"
      });
      
      slide5.addShape(pptxgen.shapes.RECTANGLE, {
        x: 0.8,
        y: 1.1,
        w: 8.4,
        h: 0.02,
        fill: { color: accentColor }
      });
      
      let nextStepsText = "";
      if (scoredPassed.length > 0) {
        const best = scoredPassed[0];
        nextStepsText += `1. Formalize Selection: Transition project requirements to focus on procurement and onboarding of ${best.name}.\n\n`;
        nextStepsText += `2. Address Gaps: Initiate discussions with ${best.name} to address minor weaknesses identified in trade evaluation scorecards.\n\n`;
        nextStepsText += `3. Schedule Review: Establish high-level deployment targets and resource allocation strategies.\n\n`;
        nextStepsText += `4. Continuous Evaluation: Review the trade study baseline periodically to verify performance guarantees remain aligned with expectations.`;
      } else {
        nextStepsText += `1. Review Requirements: The screening requirements were too restrictive, resulting in all candidates being excluded.\n\n`;
        nextStepsText += `2. Revise Baseline: Conduct a workshop to distinguish nice-to-have features from mandatory operational constraints.\n\n`;
        nextStepsText += `3. Expand Candidates: Introduce additional market solutions into the candidate pool to ensure a viable selection exists.`;
      }
      
      slide5.addText(nextStepsText, {
        x: 0.8,
        y: 1.5,
        w: 8.4,
        h: 3.4,
        fontSize: 14,
        color: textColor,
        fontFace: "Arial",
        valign: "top"
      });
      
      // Save presentation
      const safeProjectName = prjTitle.toLowerCase().replace(/\s+/g, "-");
      await pptx.writeFile({ fileName: `${safeProjectName}-briefing.pptx` });
      alert("PowerPoint presentation generated and downloaded successfully!");
    } catch (err: any) {
      console.error("Failed to generate PowerPoint briefing", err);
      alert("Failed to generate PowerPoint: " + err.message);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Active Candidates Rankings */}
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "0.25rem" }}>
            <div>
              <h3 className="panel-title" style={{ fontSize: "1.25rem", margin: 0 }}>
                Candidate Rankings
              </h3>
              <p className="panel-subtitle" style={{ fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
                Scores calculated out of 1.0 based on criteria scores and relative weights. You can edit names/descriptions inline.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGeneratePPT}
              className="btn-primary animate-fade-in"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                fontWeight: "bold",
                fontSize: "0.9rem",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
                border: "none",
                cursor: "pointer"
              }}
            >
              📊 Generate PowerPoint
            </button>
          </div>

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
                        <div style={{ fontWeight: "600", padding: "0.1rem 0.25rem", color: "var(--text-primary)" }}>
                          {cand.name}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>({cand.id})</span>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: "1rem" }}>
                        <span style={{ fontWeight: "700", color: colorClass }}>{cand.score.toFixed(2)}</span>
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
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", padding: "0.1rem 0.25rem" }}>
                      {cand.desc || <span style={{ fontStyle: "italic", opacity: 0.6 }}>No description</span>}
                    </div>
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
                    <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                      {cand.name}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>({cand.id})</span>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-muted)", flexShrink: 0, paddingLeft: "1rem" }}>
                    Calculated Score: {cand.score.toFixed(2)}
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
            Review the generated decision description. This summary is read-only.
          </p>

          <textarea
            className="form-input"
            rows={6}
            style={{ width: "100%", fontFamily: "inherit", resize: "vertical", background: "rgba(255, 255, 255, 0.02)", color: "var(--text-secondary)", cursor: "not-allowed" }}
            value={recommendation}
            readOnly={true}
            placeholder="Document recommendations, trade study caveats, and next steps..."
          />
        </div>
    </div>
  );
}
