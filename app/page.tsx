"use client";

import React, { useState, useEffect } from "react";
import { TradeStudyMeta, Candidate, ScreeningCriterion, TradeCriterion } from "../types/trade";
import MetadataSection from "../components/MetadataSection";
import ListManager from "../components/ListManager";
import ScreeningGrid from "../components/ScreeningGrid";
import ScoringMatrix from "../components/ScoringMatrix";
import DashboardView from "../components/DashboardView";

// Interface for database studies
interface SavedStudy {
  id: string;
  name: string;
  data: {
    meta: TradeStudyMeta;
    candidates: Candidate[];
    screening: ScreeningCriterion[];
    tradeCriteria: TradeCriterion[];
    scores: Record<string, Record<string, number>>;
    screeningScores: Record<string, Record<string, "Pass" | "Fail">>;
    recommendation: string;
  };
  timestamp: string;
}

// Demo trade study template (seeded in browser database)
const DEMO_STUDY = {
  meta: {
    project: "Comms Relay Options",
    sponsor: "Example Project Office",
    lead: "Wreck It Ralph",
    date: "2026-05-15",
    version: "1.0",
  },
  candidates: [
    { id: "C-1", name: "Vendor A Relay", desc: "Mature product, higher cost" },
    { id: "C-2", name: "Vendor B Relay", desc: "Lower cost, emerging product" },
    { id: "C-3", name: "In-house Dev", desc: "Custom build, longer lead time" },
  ],
  screening: [
    { id: "SC-1", name: "Meets MIL-STD baseline", desc: "Basic environmental spec", required: "Y" as const },
    { id: "SC-2", name: "Bandwidth >= 10 Mbps", desc: "Throughput requirement", required: "Y" as const },
    { id: "SC-3", name: "Delivery within 12 months", desc: "Schedule constraint", required: "Y" as const },
  ],
  tradeCriteria: [
    { id: "TC-1", name: "Performance", desc: "Throughput, latency, etc.", weight: 40 },
    { id: "TC-2", name: "Cost", desc: "Lifecycle cost class", weight: 30 },
    { id: "TC-3", name: "Schedule / Maturity", desc: "Time to field & system confidence", weight: 30 },
  ],
  scores: {
    "C-1": { "TC-1": 4, "TC-2": 2, "TC-3": 4 },
    "C-2": { "TC-1": 3, "TC-2": 4, "TC-3": 3 },
    "C-3": { "TC-1": 2, "TC-2": 1, "TC-3": 1 },
  },
  screeningScores: {
    "C-1": { "SC-1": "Pass" as const, "SC-2": "Pass" as const, "SC-3": "Pass" as const },
    "C-2": { "SC-1": "Pass" as const, "SC-2": "Pass" as const, "SC-3": "Fail" as const },
    "C-3": { "SC-1": "Fail" as const, "SC-2": "Pass" as const, "SC-3": "Pass" as const },
  },
  recommendation: "Based on the trade study criteria and weighting, Candidate **Vendor A Relay** is recommended with a total weighted score of **0.680** (68.0%).\n\nIt outperformed the runner-up, **Vendor B Relay** (score: 0.660), by a margin of 0.020.\n\nNote: Candidates In-house Dev was excluded from selection due to failing mandatory screening criteria."
};

// Default empty state for the user's workspace
const initialMeta: TradeStudyMeta = {
  project: "",
  sponsor: "",
  lead: "",
  date: "",
  version: "1.0",
};

const initialCandidates: Candidate[] = [
  { id: "C-1", name: "", desc: "" },
  { id: "C-2", name: "", desc: "" },
  { id: "C-3", name: "", desc: "" },
];

const initialScreening: ScreeningCriterion[] = [
  { id: "SC-1", name: "", desc: "", required: "Y" },
  { id: "SC-2", name: "", desc: "", required: "Y" },
  { id: "SC-3", name: "", desc: "", required: "Y" },
];

const initialTradeCriteria: TradeCriterion[] = [
  { id: "TC-1", name: "", desc: "", weight: 40 },
  { id: "TC-2", name: "", desc: "", weight: 30 },
  { id: "TC-3", name: "", desc: "", weight: 30 },
];

const initialScores: Record<string, Record<string, number>> = {};
const initialScreeningScores: Record<string, Record<string, "Pass" | "Fail">> = {};

export default function Home() {
  const [showStep2, setShowStep2] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [meta, setMeta] = useState<TradeStudyMeta>(initialMeta);
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [screening, setScreening] = useState<ScreeningCriterion[]>(initialScreening);
  const [tradeCriteria, setTradeCriteria] = useState<TradeCriterion[]>(initialTradeCriteria);
  const [scores, setScores] = useState<Record<string, Record<string, number>>>(initialScores);
  const [screeningScores, setScreeningScores] = useState<Record<string, Record<string, "Pass" | "Fail">>>(initialScreeningScores);
  const [recommendation, setRecommendation] = useState<string>("");
  const [showWreckItRalphModal, setShowWreckItRalphModal] = useState<boolean>(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("app_theme") as "light" | "dark" | "system") || "system";
  });

  // Sync theme to document element and localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("app_theme", theme);
    
    const root = document.documentElement;
    const applyTheme = (t: "light" | "dark" | "system") => {
      if (t === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.setAttribute("data-theme", systemTheme);
      } else {
        root.setAttribute("data-theme", t);
      }
    };

    applyTheme(theme);

    // Watch for system theme changes if set to system
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [theme]);

  // Database States
  const [savedStudies, setSavedStudies] = useState<SavedStudy[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState<string>("");
  
  // Helper: Determine overall screening result per candidate
  const getOverallScreening = (candId: string) => {
    const candScores = screeningScores[candId] || {};
    for (const sc of screening) {
      if (sc.required === "Y") {
        const val = candScores[sc.id] || "Pass";
        if (val === "Fail") return "Fail";
      }
    }
    return "Pass";
  };

  // Validate weight sum
  const weightSum = tradeCriteria.reduce((sum, tc) => sum + tc.weight, 0);
  const isWeightValid = Math.abs(weightSum - 100) < 0.05;

  // Check if setup details are complete in Step 1
  const isSetupComplete = 
    meta.project.trim() !== "" &&
    candidates.length >= 3 &&
    candidates.every(c => c.name.trim() !== "") &&
    screening.length >= 3 &&
    screening.every(s => s.name.trim() !== "") &&
    tradeCriteria.length >= 3 &&
    tradeCriteria.every(tc => tc.name.trim() !== "") &&
    isWeightValid;

  const getSetupErrors = () => {
    const errors: string[] = [];
    if (meta.project.trim() === "") {
      errors.push("Project Title is required.");
    }
    if (candidates.length < 3) {
      errors.push("At least 3 candidates are required.");
    }
    if (candidates.some(c => c.name.trim() === "")) {
      errors.push("All candidates must have a name.");
    }
    if (screening.length < 3) {
      errors.push("At least 3 screening criteria are required.");
    }
    if (screening.some(s => s.name.trim() === "")) {
      errors.push("All screening criteria must have a name.");
    }
    if (tradeCriteria.length < 3) {
      errors.push("At least 3 weighted criteria are required.");
    }
    if (tradeCriteria.some(tc => tc.name.trim() === "")) {
      errors.push("All weighted criteria must have a name.");
    }
    if (!isWeightValid) {
      errors.push(`Weighted criteria weights must sum to exactly 100% (currently ${weightSum.toFixed(2)}%).`);
    }
    return errors;
  };

  // Helper: Check if all Step 2 evaluations are fully filled
  const isStep2Complete = () => {
    // Check if screening scores exist for all candidate-criterion pairs
    for (const cand of candidates) {
      for (const s of screening) {
        const val = screeningScores[cand.id]?.[s.id];
        if (!val) return false;
      }
    }

    // Check if scoring scores exist and are valid for all passed candidates
    for (const cand of candidates) {
      const isFailed = getOverallScreening(cand.id) === "Fail";
      if (!isFailed) {
        for (const tc of tradeCriteria) {
          const val = scores[cand.id]?.[tc.id];
          if (val === undefined || val === null || isNaN(val)) {
            return false;
          }
        }
      }
    }
    return true;
  };

  // Initialize browser localStorage database and load active workspace
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("trade_studies");
    let studiesList: SavedStudy[] = [];

    if (!stored) {
      studiesList = [
        {
          id: "demo",
          name: "Comms Relay Options (Demo)",
          data: DEMO_STUDY,
          timestamp: new Date().toISOString()
        }
      ];
      localStorage.setItem("trade_studies", JSON.stringify(studiesList));
    } else {
      try {
        studiesList = JSON.parse(stored);
        // Automatically update the demo study inside database if it contains Jane Doe
        const demoIndex = studiesList.findIndex(s => s.id === "demo");
        if (demoIndex !== -1) {
          studiesList[demoIndex].data = DEMO_STUDY;
          localStorage.setItem("trade_studies", JSON.stringify(studiesList));
        }
      } catch {
        studiesList = [];
      }
    }

    // Wrap state updates in setTimeout to avoid synchronous setState inside useEffect warning
    setTimeout(() => {
      setSavedStudies(studiesList);

      // Load last session workspace if it exists
      const currentActive = localStorage.getItem("current_trade_study");
      if (currentActive) {
        try {
          const parsed = JSON.parse(currentActive);
          if (parsed.meta && parsed.meta.lead === "Jane Doe") {
            parsed.meta.lead = "Wreck It Ralph";
            localStorage.setItem("current_trade_study", JSON.stringify(parsed));
          }
          const loadedScores = parsed.scores || {};
          const loadedScreeningScores = parsed.screeningScores || {};
          
          const newScreeningScores = { ...loadedScreeningScores };
          if (parsed.candidates && parsed.screening) {
            parsed.candidates.forEach((cand: Candidate) => {
              if (!newScreeningScores[cand.id]) {
                newScreeningScores[cand.id] = {};
              }
              parsed.screening.forEach((s: ScreeningCriterion) => {
                if (!newScreeningScores[cand.id][s.id]) {
                  newScreeningScores[cand.id][s.id] = "Pass";
                }
              });
            });
          }

          const newScores = { ...loadedScores };
          if (parsed.candidates && parsed.tradeCriteria) {
            parsed.candidates.forEach((cand: Candidate) => {
              if (!newScores[cand.id]) {
                newScores[cand.id] = {};
              }
              parsed.tradeCriteria.forEach((tc: TradeCriterion) => {
                if (newScores[cand.id][tc.id] === undefined) {
                  newScores[cand.id][tc.id] = 3.0;
                }
              });
            });
          }

          setMeta(parsed.meta || initialMeta);
          setCandidates(parsed.candidates || initialCandidates);
          setScreening(parsed.screening || initialScreening);
          setTradeCriteria(parsed.tradeCriteria || initialTradeCriteria);
          setScores(newScores);
          setScreeningScores(newScreeningScores);
          setRecommendation(parsed.recommendation || "");

          const d = parsed;
          if (d.tradeCriteria && d.meta && d.candidates && d.screening) {
            const loadedWeightSum = d.tradeCriteria.reduce((sum: number, tc: TradeCriterion) => sum + tc.weight, 0);
            const loadedIsWeightValid = Math.abs(loadedWeightSum - 100) < 0.05;
            const loadedIsSetupComplete = 
              d.meta.project.trim() !== "" &&
              d.candidates.length >= 3 &&
              d.candidates.every((c: Candidate) => c.name.trim() !== "") &&
              d.screening.length >= 3 &&
              d.screening.every((s: ScreeningCriterion) => s.name.trim() !== "") &&
              d.tradeCriteria.length >= 3 &&
              d.tradeCriteria.every((tc: TradeCriterion) => tc.name.trim() !== "") &&
              loadedIsWeightValid;

            if (loadedIsSetupComplete) {
              setShowStep2(true);
              
              let hasAllScores = true;
              for (const cand of d.candidates) {
                for (const s of d.screening) {
                  if (!newScreeningScores[cand.id]?.[s.id]) {
                    hasAllScores = false;
                    break;
                  }
                }
                if (!hasAllScores) break;

                const isFailed = d.screening.some((sc: ScreeningCriterion) => {
                  if (sc.required === "Y") {
                    const val = newScreeningScores[cand.id]?.[sc.id] || "Pass";
                    if (val === "Fail") return true;
                  }
                  return false;
                });

                if (!isFailed) {
                  for (const tc of d.tradeCriteria) {
                    const val = newScores[cand.id]?.[tc.id];
                    if (val === undefined || val === null || isNaN(val)) {
                      hasAllScores = false;
                      break;
                    }
                  }
                }
                if (!hasAllScores) break;
              }
              setShowResults(hasAllScores);
            }
          }
        } catch (e) {
          console.error("Failed to parse current active study", e);
        }
      }
    }, 0);
  }, []);

  // Auto-save active workspace state to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const activeData = {
      meta,
      candidates,
      screening,
      tradeCriteria,
      scores,
      screeningScores,
      recommendation
    };
    localStorage.setItem("current_trade_study", JSON.stringify(activeData));
  }, [meta, candidates, screening, tradeCriteria, scores, screeningScores, recommendation]);

  // Database functions
  const handleLoadStudy = (id: string) => {
    if (!id) return;
    
    if (id === "new") {
      if (confirm("Are you sure you want to start a new blank study? Unsaved changes to your current study may be lost.")) {
        setMeta(initialMeta);
        setCandidates(initialCandidates);
        setScreening(initialScreening);
        setTradeCriteria(initialTradeCriteria);
        setScores(initialScores);
        setScreeningScores(initialScreeningScores);
        setRecommendation("");
        setSelectedStudyId("");
        setShowStep2(false);
        setShowResults(false);
      }
      return;
    }

    const study = savedStudies.find(s => s.id === id);
    if (!study) return;

    if (confirm(`Load study "${study.name}"? Unsaved changes to your current study may be lost.`)) {
      const d = study.data;
      
      const loadedScores = d.scores || {};
      const loadedScreeningScores = d.screeningScores || {};
      
      const newScreeningScores = { ...loadedScreeningScores };
      (d.candidates || []).forEach((cand: Candidate) => {
        if (!newScreeningScores[cand.id]) {
          newScreeningScores[cand.id] = {};
        }
        (d.screening || []).forEach((s: ScreeningCriterion) => {
          if (!newScreeningScores[cand.id][s.id]) {
            newScreeningScores[cand.id][s.id] = "Pass";
          }
        });
      });

      const newScores = { ...loadedScores };
      (d.candidates || []).forEach((cand: Candidate) => {
        if (!newScores[cand.id]) {
          newScores[cand.id] = {};
        }
        (d.tradeCriteria || []).forEach((tc: TradeCriterion) => {
          if (newScores[cand.id][tc.id] === undefined) {
            newScores[cand.id][tc.id] = 3.0;
          }
        });
      });

      setMeta(d.meta);
      setCandidates(d.candidates);
      setScreening(d.screening);
      setTradeCriteria(d.tradeCriteria);
      setScores(newScores);
      setScreeningScores(newScreeningScores);
      setRecommendation(d.recommendation || "");
      setSelectedStudyId(id);

      const loadedWeightSum = (d.tradeCriteria || []).reduce((sum: number, tc: TradeCriterion) => sum + tc.weight, 0);
      const loadedIsWeightValid = Math.abs(loadedWeightSum - 100) < 0.05;
      const loadedIsSetupComplete = 
        d.meta.project && d.meta.project.trim() !== "" &&
        d.candidates && d.candidates.length >= 3 &&
        d.candidates.every((c: Candidate) => c.name.trim() !== "") &&
        d.screening && d.screening.length >= 3 &&
        d.screening.every((s: ScreeningCriterion) => s.name.trim() !== "") &&
        d.tradeCriteria && d.tradeCriteria.length >= 3 &&
        d.tradeCriteria.every((tc: TradeCriterion) => tc.name.trim() !== "") &&
        loadedIsWeightValid;

      if (loadedIsSetupComplete) {
        setShowStep2(true);
        let hasAllScores = true;
        for (const cand of d.candidates || []) {
          for (const s of d.screening || []) {
            if (!newScreeningScores[cand.id]?.[s.id]) {
              hasAllScores = false;
              break;
            }
          }
          if (!hasAllScores) break;

          const isFailed = (d.screening || []).some((sc: ScreeningCriterion) => {
            if (sc.required === "Y") {
              const val = newScreeningScores[cand.id]?.[sc.id] || "Pass";
              if (val === "Fail") return true;
            }
            return false;
          });

          if (!isFailed) {
            for (const tc of d.tradeCriteria || []) {
              const val = newScores[cand.id]?.[tc.id];
              if (val === undefined || val === null || isNaN(val)) {
                hasAllScores = false;
                break;
              }
            }
          }
          if (!hasAllScores) break;
        }
        setShowResults(hasAllScores);
      } else {
        setShowStep2(false);
        setShowResults(false);
      }
    }
  };

  const handleSaveStudyToDb = () => {
    const studyName = meta.project.trim() || prompt("Enter a name for this trade study:")?.trim();
    if (!studyName) {
      alert("Please enter a name to save your study.");
      return;
    }

    const newId = selectedStudyId && selectedStudyId !== "demo" ? selectedStudyId : `study-${Date.now()}`;
    const studyData = {
      meta,
      candidates,
      screening,
      tradeCriteria,
      scores,
      screeningScores,
      recommendation
    };

    const updatedStudies = savedStudies.filter(s => s.id !== newId);
    updatedStudies.push({
      id: newId,
      name: studyName,
      data: studyData,
      timestamp: new Date().toISOString()
    });

    localStorage.setItem("trade_studies", JSON.stringify(updatedStudies));
    setSavedStudies(updatedStudies);
    setSelectedStudyId(newId);
    
    if (!meta.project.trim()) {
      setMeta(prev => ({ ...prev, project: studyName }));
    }
    
    alert(`Study "${studyName}" successfully saved to local database!`);
  };

  const handleDeleteStudyFromDb = (id: string) => {
    if (id === "demo") return;
    const study = savedStudies.find(s => s.id === id);
    if (!study) return;

    if (confirm(`Are you sure you want to delete "${study.name}" from the database?`)) {
      const updatedStudies = savedStudies.filter(s => s.id !== id);
      localStorage.setItem("trade_studies", JSON.stringify(updatedStudies));
      setSavedStudies(updatedStudies);
      setSelectedStudyId("");
    }
  };
  // Export JSON
  const handleExportJson = () => {
    const data = {
      meta,
      candidates,
      screening,
      tradeCriteria,
      scores,
      screeningScores,
      recommendation,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.project.toLowerCase().replace(/\s+/g, "-")}-study.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCsv = () => {
    const getScoringTotal = (candId: string) => {
      let total = 0;
      const candScores = scores[candId] || {};
      tradeCriteria.forEach((tc) => {
        const score = candScores[tc.id] !== undefined ? candScores[tc.id] : 3.0;
        total += (score / 5) * (tc.weight / 100);
      });
      return total;
    };

    const rows = [
      ["Metadata - Project", meta.project],
      ["Metadata - Sponsor", meta.sponsor],
      ["Metadata - Lead Analyst", meta.lead],
      ["Metadata - Date", meta.date],
      ["Metadata - Version", meta.version],
      [],
      ["Candidate Scoring Details"],
      ["Candidate ID", "Candidate Name", "Criterion ID", "Criterion Name", "Weight %", "Raw Score (0-5)", "Weighted Score"],
    ];

    candidates.forEach((cand) => {
      tradeCriteria.forEach((tc) => {
        const rawScore = (scores[cand.id] && scores[cand.id][tc.id] !== undefined) ? scores[cand.id][tc.id] : 3.0;
        const weightedScore = (rawScore / 5) * (tc.weight / 100);
        rows.push([
          cand.id,
          cand.name,
          tc.id,
          tc.name,
          `${tc.weight}%`,
          rawScore.toString(),
          weightedScore.toFixed(2),
        ]);
      });
    });

    // Append Rankings
    rows.push([]);
    rows.push(["Study Results & Rankings"]);
    rows.push(["Rank", "Candidate ID", "Candidate Name", "Total Score (0-1)", "Percentage", "Status"]);

    const passedCandidates = candidates.filter((c) => getOverallScreening(c.id) === "Pass");
    const failedCandidates = candidates.filter((c) => getOverallScreening(c.id) === "Fail");

    const scoredPassed = passedCandidates
      .map((c) => ({
        ...c,
        score: getScoringTotal(c.id),
      }))
      .sort((a, b) => b.score - a.score);

    scoredPassed.forEach((cand, index) => {
      rows.push([
        (index + 1).toString(),
        cand.id,
        cand.name,
        cand.score.toFixed(2),
        `${(cand.score * 100).toFixed(1)}%`,
        "PASSED"
      ]);
    });

    failedCandidates.forEach((cand) => {
      const score = getScoringTotal(cand.id);
      rows.push([
        "N/A",
        cand.id,
        cand.name,
        score.toFixed(2),
        `${(score * 100).toFixed(1)}%`,
        "EXCLUDED (Failed Screening)"
      ]);
    });

    rows.push([]);
    rows.push(["Recommendation & Decision Summary"]);
    rows.push([recommendation || "No recommendation documented."]);

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement("a");
    a.href = encodedUri;
    a.download = `${meta.project.toLowerCase().replace(/\s+/g, "-")}-study.csv`;
    a.click();
  };

  // Export Markdown (Aligned with user's trade-study-template.md)
  const handleExportMarkdown = () => {
    // getOverallScreening helper is available at the component level

    // Calculate total score per candidate
    const getScoringTotal = (candId: string) => {
      let total = 0;
      const candScores = scores[candId] || {};
      tradeCriteria.forEach((tc) => {
        const score = candScores[tc.id] !== undefined ? candScores[tc.id] : 3.0;
        total += (score / 5) * (tc.weight / 100);
      });
      return total;
    };

    // Sort passed candidates for rankings
    const passedCandidates = candidates.filter((c) => getOverallScreening(c.id) === "Pass");
    const failedCandidates = candidates.filter((c) => getOverallScreening(c.id) === "Fail");

    const scoredPassed = passedCandidates
      .map((c) => ({
        ...c,
        score: getScoringTotal(c.id),
      }))
      .sort((a, b) => b.score - a.score);

    const md = `---
title: "Trade Study — ${meta.project}"
author: "${meta.lead}"
date: "${meta.date}"
version: ${meta.version}
---

# Trade Study: ${meta.project}

## Metadata
- Sponsor / Project: ${meta.sponsor || "N/A"}
- Study Lead: ${meta.lead || "N/A"}
- Date Conducted: ${meta.date || "N/A"}
- Version: ${meta.version}

## Screening Criteria
| ID | Screening Criterion | Description | Required? (Y/N) |
|---:|---|---|:---:|
${screening.map((sc) => `| ${sc.id} | ${sc.name} | ${sc.desc || "N/A"} | ${sc.required} |`).join("\n")}

## Trade Candidates
| ID | Candidate | Short Description |
|---:|---|---|
${candidates.map((c) => `| ${c.id} | ${c.name} | ${c.desc || "N/A"} |`).join("\n")}

## Trade Criteria (scored)
| ID | Criterion | Description | Weight (%) |
|---:|---|---|---:|
${tradeCriteria.map((tc) => `| ${tc.id} | ${tc.name} | ${tc.desc || "N/A"} | ${tc.weight}% |`).join("\n")}

## Screening Results
| Candidate | ${screening.map((sc) => sc.id).join(" | ")} | Overall Status |
|---:|${screening.map(() => ":---:").join("|")}|:---:|
${candidates
  .map((cand) => {
    const scList = screening.map((sc) => (screeningScores[cand.id]?.[sc.id] || "Pass"));
    const status = getOverallScreening(cand.id) === "Fail" ? "Fail" : "Pass";
    return `| ${cand.name} | ${scList.join(" | ")} | ${status.toUpperCase()} |`;
  })
  .join("\n")}

## Scoring Matrix
| Candidate | ${tradeCriteria.map((tc) => `${tc.id} (${tc.weight}%) | Raw Score | Weighted`).join(" | ")} | Total Weighted Score (0-1) |
|---:|${tradeCriteria.map(() => "---:|---:|---:").join("|")}|---:|
${candidates
  .map((cand) => {
    const isFailed = getOverallScreening(cand.id) === "Fail";
    if (isFailed) {
      return `| ${cand.name} | *Excluded from trade study scoring due to screening failure* | | | | | | |`;
    }
    const rowList = tradeCriteria.map((tc) => {
      const raw = (scores[cand.id]?.[tc.id] !== undefined) ? scores[cand.id][tc.id] : 3.0;
      const wScore = (raw / 5) * (tc.weight / 100);
      return `${tc.weight}% | ${raw.toFixed(1)} | ${wScore.toFixed(2)}`;
    });
    const total = getScoringTotal(cand.id);
    return `| ${cand.name} | ${rowList.join(" | ")} | **${total.toFixed(2)}** |`;
  })
  .join("\n")}

## Study Results & Rankings

### Candidate Rankings
| Rank | Candidate | ID | Total Score | Percentage |
|:---:|---|:---:|:---:|:---:|
${scoredPassed.length > 0
  ? scoredPassed.map((cand, index) => `| ${index + 1} | ${cand.name} | ${cand.id} | **${cand.score.toFixed(2)}** | ${(cand.score * 100).toFixed(1)}% |`).join("\n")
  : "| N/A | *No candidates passed mandatory screening* | | | |"
}

${failedCandidates.length > 0 
  ? `\n### Excluded Candidates (Failed Screening)
${failedCandidates.map((c) => `- **${c.name}** (${c.id}) — Excluded due to failing required screening criteria.`).join("\n")}`
  : ""
}

## Recommendation & Decision Summary
${recommendation || "No recommendation documented."}
`;

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.project.toLowerCase().replace(/\s+/g, "-")}-study.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // State adjustment helper functions to keep scores & screening results in sync

  // Candidates Handlers
  const handleAddCandidate = () => {
    const nextNum = candidates.length + 1;
    const newCand: Candidate = {
      id: `C-${nextNum}`,
      name: `Candidate ${nextNum}`,
      desc: "",
    };
    setCandidates([...candidates, newCand]);
    setScores(prev => ({
      ...prev,
      [newCand.id]: tradeCriteria.reduce((acc, tc) => ({ ...acc, [tc.id]: 3.0 }), {} as Record<string, number>)
    }));
    setScreeningScores(prev => ({
      ...prev,
      [newCand.id]: screening.reduce((acc, sc) => ({ ...acc, [sc.id]: "Pass" }), {} as Record<string, "Pass" | "Fail">)
    }));
  };

  const handleRemoveCandidate = (index: number) => {
    if (candidates.length <= 3) return;
    const newCands = [...candidates];
    newCands.splice(index, 1);

    // Re-index remaining candidates sequentially
    const updatedCands = newCands.map((c, idx) => ({
      ...c,
      id: `C-${idx + 1}`
    }));

    // Re-map scores & screeningScores
    const newScores: Record<string, Record<string, number>> = {};
    const newScreeningScores: Record<string, Record<string, "Pass" | "Fail">> = {};

    updatedCands.forEach((cand, idx) => {
      const oldId = idx < index ? `C-${idx + 1}` : `C-${idx + 2}`;
      if (scores[oldId]) {
        newScores[cand.id] = scores[oldId];
      }
      if (screeningScores[oldId]) {
        newScreeningScores[cand.id] = screeningScores[oldId];
      }
    });

    setCandidates(updatedCands);
    setScores(newScores);
    setScreeningScores(newScreeningScores);
  };

  const handleChangeCandidate = (index: number, key: string, value: string | number) => {
    const newCands = [...candidates];
    newCands[index] = {
      ...newCands[index],
      [key]: value as string,
    };
    setCandidates(newCands);
  };

  // Screening Criteria Handlers
  const handleAddScreening = () => {
    const nextNum = screening.length + 1;
    const newSc: ScreeningCriterion = {
      id: `SC-${nextNum}`,
      name: `Screening Criterion ${nextNum}`,
      desc: "",
      required: "Y",
    };
    setScreening([...screening, newSc]);
    setScreeningScores(prev => {
      const updated = { ...prev };
      candidates.forEach(cand => {
        if (!updated[cand.id]) updated[cand.id] = {};
        updated[cand.id] = {
          ...updated[cand.id],
          [newSc.id]: "Pass"
        };
      });
      return updated;
    });
  };

  const handleRemoveScreening = (index: number) => {
    if (screening.length <= 3) return;
    const newScreening = [...screening];
    newScreening.splice(index, 1);

    // Re-index remaining screening criteria
    const updatedScreening = newScreening.map((sc, idx) => ({
      ...sc,
      id: `SC-${idx + 1}`
    }));

    const newScreeningScores: Record<string, Record<string, "Pass" | "Fail">> = {};
    
    candidates.forEach(cand => {
      const candScores = screeningScores[cand.id] || {};
      const newCandScores: Record<string, "Pass" | "Fail"> = {};
      
      updatedScreening.forEach((sc, idx) => {
        const oldId = idx < index ? `SC-${idx + 1}` : `SC-${idx + 2}`;
        if (candScores[oldId] !== undefined) {
          newCandScores[sc.id] = candScores[oldId];
        }
      });
      newScreeningScores[cand.id] = newCandScores;
    });

    setScreening(updatedScreening);
    setScreeningScores(newScreeningScores);
  };

  const handleChangeScreening = (index: number, key: string, value: string | number) => {
    const newScreening = [...screening];
    newScreening[index] = {
      ...newScreening[index],
      [key]: value as "Y" | "N",
    };
    setScreening(newScreening);
  };

  // Trade Criteria Handlers
  const handleAddTradeCriterion = () => {
    const nextNum = tradeCriteria.length + 1;
    const newTc: TradeCriterion = {
      id: `TC-${nextNum}`,
      name: `Trade Criterion ${nextNum}`,
      desc: "",
      weight: 0,
    };
    setTradeCriteria([...tradeCriteria, newTc]);
    setScores(prev => {
      const updated = { ...prev };
      candidates.forEach(cand => {
        if (!updated[cand.id]) updated[cand.id] = {};
        updated[cand.id] = {
          ...updated[cand.id],
          [newTc.id]: 3.0
        };
      });
      return updated;
    });
  };

  const handleRemoveTradeCriterion = (index: number) => {
    if (tradeCriteria.length <= 3) return;
    const newTradeCriteria = [...tradeCriteria];
    newTradeCriteria.splice(index, 1);

    // Re-index remaining trade criteria
    const updatedTradeCriteria = newTradeCriteria.map((tc, idx) => ({
      ...tc,
      id: `TC-${idx + 1}`
    }));

    const newScores: Record<string, Record<string, number>> = {};
    
    candidates.forEach(cand => {
      const candScores = scores[cand.id] || {};
      const newCandScores: Record<string, number> = {};
      
      updatedTradeCriteria.forEach((tc, idx) => {
        const oldId = idx < index ? `TC-${idx + 1}` : `TC-${idx + 2}`;
        if (candScores[oldId] !== undefined) {
          newCandScores[tc.id] = candScores[oldId];
        }
      });
      newScores[cand.id] = newCandScores;
    });

    setTradeCriteria(updatedTradeCriteria);
    setScores(newScores);
  };

  const handleChangeTradeCriterion = (index: number, key: string, value: string | number) => {
    const newTradeCriteria = [...tradeCriteria];
    newTradeCriteria[index] = {
      ...newTradeCriteria[index],
      [key]: value,
    } as TradeCriterion;
    setTradeCriteria(newTradeCriteria);
  };

  return (
    <main className="app-container">
      {/* App Header */}
      <header className="app-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* Balanced spacer to keep logo centered */}
        <div style={{ width: "130px" }} aria-hidden="true"></div>

        {/* Logo */}
        <div 
          className="logo-section" 
          onClick={() => setShowWreckItRalphModal(true)} 
          style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}
          title="I'm gunna wreck it!"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Base Pillar */}
            <path d="M12 5V19" stroke="url(#logo-grad)" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M8 19H16" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round"/>
            
            {/* Angled Beam representing dynamic trade-offs */}
            <path d="M5 8L12 5L19 8" stroke="url(#logo-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            
            {/* Left Pan */}
            <path d="M5 8V12" stroke="url(#logo-grad)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M2 12H8C8 14.5 2 14.5 2 12Z" fill="url(#logo-grad)" fillOpacity="0.15" stroke="url(#logo-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            
            {/* Right Pan */}
            <path d="M19 8V12" stroke="url(#logo-grad)" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M16 12H22C22 14.5 16 14.5 16 12Z" fill="url(#logo-grad)" fillOpacity="0.15" stroke="url(#logo-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            
            {/* Center Pivot Point */}
            <circle cx="12" cy="5" r="1.5" fill="url(#logo-grad)"/>

            <defs>
              <linearGradient id="logo-grad" x1="4" y1="3" x2="24" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--accent-blue)" />
                <stop offset="0.5" stopColor="var(--accent-indigo)" />
                <stop offset="1" stopColor="var(--accent-purple)" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ letterSpacing: "-0.01em" }}>
            TradeStudy<span className="logo-text-highlight">Tool</span>
          </span>
        </div>

        {/* Theme Selector */}
        <div 
          style={{ 
            display: "flex", 
            background: "rgba(255, 255, 255, 0.05)", 
            border: "1px solid var(--border-color)", 
            borderRadius: "20px", 
            padding: "2px",
            gap: "2px",
            alignItems: "center",
            width: "130px",
            justifyContent: "space-between"
          }}
        >
          <button 
            type="button"
            onClick={() => setTheme("light")} 
            style={{ 
              background: theme === "light" ? "var(--accent-blue)" : "transparent",
              color: theme === "light" ? "#fff" : "var(--text-secondary)",
              border: "none",
              borderRadius: "18px",
              padding: "4px 8px",
              fontSize: "0.75rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              flex: 1
            }}
            title="Light Mode"
          >
            ☀️
          </button>
          <button 
            type="button"
            onClick={() => setTheme("dark")} 
            style={{ 
              background: theme === "dark" ? "var(--accent-indigo)" : "transparent",
              color: theme === "dark" ? "#fff" : "var(--text-secondary)",
              border: "none",
              borderRadius: "18px",
              padding: "4px 8px",
              fontSize: "0.75rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              flex: 1
            }}
            title="Dark Mode"
          >
            🌙
          </button>
          <button 
            type="button"
            onClick={() => setTheme("system")} 
            style={{ 
              background: theme === "system" ? "rgba(255, 255, 255, 0.15)" : "transparent",
              color: theme === "system" ? "var(--text-primary)" : "var(--text-secondary)",
              border: "none",
              borderRadius: "18px",
              padding: "4px 8px",
              fontSize: "0.75rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              flex: 1
            }}
            title="System Mode"
          >
            💻
          </button>
        </div>
      </header>

      {/* Quick Action Dashboard Toolbar with Dynamic Inline-Editable Metadata */}
      <div
        className="glass-panel animate-fade-in"
        style={{
          padding: "1rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.1rem" }}>📋</span>
              <input
                type="text"
                value={meta.project}
                onChange={(e) => setMeta({ ...meta, project: e.target.value })}
                placeholder="Project Name"
                className="editable-input"
                style={{ fontSize: "1.1rem", fontWeight: 700, padding: "0.1rem 0.3rem", width: "250px" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <span>Lead:</span>
                <input
                  type="text"
                  value={meta.lead}
                  onChange={(e) => setMeta({ ...meta, lead: e.target.value })}
                  placeholder="Lead Analyst"
                  className="editable-input"
                  style={{ fontSize: "0.8rem", color: "var(--text-secondary)", width: "100px", padding: "0 0.2rem" }}
                />
              </div>
              <span>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <span>Date:</span>
                <input
                  type="date"
                  value={meta.date}
                  onChange={(e) => setMeta({ ...meta, date: e.target.value })}
                  className="editable-input"
                  style={{ fontSize: "0.8rem", color: "var(--text-secondary)", width: "125px", padding: "0 0.2rem" }}
                />
              </div>
              <span>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <span>Ver:</span>
                <input
                  type="text"
                  value={meta.version}
                  onChange={(e) => setMeta({ ...meta, version: e.target.value })}
                  placeholder="1.0"
                  className="editable-input"
                  style={{ fontSize: "0.8rem", color: "var(--text-secondary)", width: "50px", padding: "0 0.2rem" }}
                />
              </div>
            </div>
          </div>
          {!isWeightValid && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "var(--accent-red)",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: "bold",
                alignSelf: "center"
              }}
            >
              Weighted criteria sum is {weightSum}% (must sum to exactly 100%)
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>

          <button onClick={handleExportJson} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            💾 Export JSON
          </button>
          
          <button onClick={handleExportCsv} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            📊 Export CSV
          </button>

          <button onClick={handleExportMarkdown} className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            📝 Export Markdown
          </button>
        </div>
      </div>

      {/* Setup Workspace Panels */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Browser Local Database Panel */}
        <div className="glass-panel animate-fade-in" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 className="panel-title" style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>Study Database</h3>
              <p className="panel-subtitle" style={{ fontSize: "0.85rem" }}>Save your work locally in the browser or load templates.</p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={selectedStudyId}
                onChange={(e) => handleLoadStudy(e.target.value)}
                className="form-input form-select"
                style={{ width: "220px", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
              >
                <option value="">-- Load Saved Study --</option>
                <option value="new">🆕 Create New Blank Study</option>
                {savedStudies.map((study) => (
                  <option key={study.id} value={study.id}>
                    📁 {study.name}
                  </option>
                ))}
              </select>
              
              <button
                onClick={handleSaveStudyToDb}
                className="btn-primary"
                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
              >
                💾 Save Current Study
              </button>
              
              {selectedStudyId && selectedStudyId !== "demo" && (
                <button
                  onClick={() => handleDeleteStudyFromDb(selectedStudyId)}
                  className="btn-danger"
                  style={{ padding: "0.5rem", borderRadius: "10px" }}
                  title="Delete study from database"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Step 1 Setup Workspace Panel Box */}
        <div
          className="glass-panel animate-fade-in"
          style={{
            padding: "2.5rem 2rem",
            border: "2px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "2.5rem",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
          }}
        >
          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Step 1: Workspace Setup
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.4rem 0 0 0" }}>
              Define project metadata, candidates, screening criteria, and weighted criteria. All fields must be completed.
            </p>
          </div>

          <MetadataSection meta={meta} onChange={setMeta} />
          
          <ListManager
            type="screening"
            title="Screening Criteria (3 to 10)"
            subtitle="Mandatory filters (Pass/Fail) applied to exclude unqualified options early."
            items={screening}
            onAdd={handleAddScreening}
            onRemove={handleRemoveScreening}
            onChange={handleChangeScreening}
          />

          <ListManager
            type="candidates"
            title="Candidates (3 to 10)"
            subtitle="The options, designs, systems, or providers being evaluated."
            items={candidates}
            onAdd={handleAddCandidate}
            onRemove={handleRemoveCandidate}
            onChange={handleChangeCandidate}
          />
          
          <ListManager
            type="tradeCriteria"
            title="Weighted Criteria (3 to 10)"
            subtitle="Scored criteria with weights summing to exactly 100%. Adjust weights here or on Step 3."
            items={tradeCriteria}
            onAdd={handleAddTradeCriterion}
            onRemove={handleRemoveTradeCriterion}
            onChange={handleChangeTradeCriterion}
          />
        </div>

        {/* Button to proceed to Step 2 */}
        <div id="step-2-trigger-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
          {!isSetupComplete && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "var(--accent-red)",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: "bold",
                maxWidth: "400px",
                textAlign: "center"
              }}
            >
              ⚠️ Incomplete Setup: Please resolve all issues (Project Title, names for all Candidates/Criteria, and exactly 100% weight sum) before proceeding.
            </div>
          )}
          <button
            onClick={() => {
              if (!isSetupComplete) {
                const errors = getSetupErrors();
                alert(`The Step 1 setup is incomplete. Please fix the following errors before continuing:\n\n${errors.map((e, idx) => `${idx + 1}. ${e}`).join("\n")}`);
                return;
              }

              // Initialize default scores for any empty values
              const newScreeningScores = { ...screeningScores };
              let screeningUpdated = false;
              candidates.forEach(cand => {
                if (!newScreeningScores[cand.id]) {
                  newScreeningScores[cand.id] = {};
                  screeningUpdated = true;
                }
                screening.forEach(s => {
                  if (!newScreeningScores[cand.id][s.id]) {
                    newScreeningScores[cand.id][s.id] = "Pass";
                    screeningUpdated = true;
                  }
                });
              });
              if (screeningUpdated) {
                setScreeningScores(newScreeningScores);
              }

              const newScores = { ...scores };
              let scoresUpdated = false;
              candidates.forEach(cand => {
                if (!newScores[cand.id]) {
                  newScores[cand.id] = {};
                  scoresUpdated = true;
                }
                tradeCriteria.forEach(tc => {
                  if (newScores[cand.id][tc.id] === undefined) {
                    newScores[cand.id][tc.id] = 3.0;
                    scoresUpdated = true;
                  }
                });
              });
              if (scoresUpdated) {
                setScores(newScores);
              }

              setShowStep2(true);
              setTimeout(() => {
                document.getElementById("step-2-trigger-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }}
            className={`btn-primary ${!isSetupComplete ? "disabled" : ""}`}
            style={{
              padding: "1rem 2.5rem",
              fontSize: "1.05rem",
              borderRadius: "12px",
              ...(!isSetupComplete ? {
                background: "rgba(255, 255, 255, 0.08)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-color)",
                cursor: "not-allowed",
                boxShadow: "none",
                transform: "none",
              } : {})
            }}
          >
            🚀 Proceed to Evaluation & Scoring
          </button>
        </div>

        {/* Step 2 Section (Evaluation & Scoring Grid) */}
        {showStep2 && (
          <div
            id="step-2-section"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
              borderTop: "2px solid var(--border-color)",
              paddingTop: "2rem",
              marginTop: "2rem"
            }}
          >
            <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                Step 2: Evaluation & Scoring
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.4rem 0 0 0" }}>
                Filter candidates using pass/fail screening criteria and rate them against weighted trade criteria.
              </p>
            </div>

            <ScreeningGrid
              candidates={candidates}
              screening={screening}
              screeningScores={screeningScores}
              onChange={setScreeningScores}
              onCandidatesChange={setCandidates}
              onScreeningChange={setScreening}
            />
            
            <ScoringMatrix
              candidates={candidates}
              tradeCriteria={tradeCriteria}
              scores={scores}
              screeningScores={screeningScores}
              screening={screening}
              onChange={setScores}
              onCandidatesChange={setCandidates}
              onTradeCriteriaChange={setTradeCriteria}
            />

            {/* Button to open Results (only rendered if isStep2Complete() is true) */}
            {isStep2Complete() && (
              <div id="results-trigger-container" style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
                <button
                  onClick={() => {
                    setShowResults(true);
                    setTimeout(() => {
                      document.getElementById("results-trigger-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 100);
                  }}
                  className="btn-primary"
                  style={{ padding: "1rem 2.5rem", fontSize: "1.05rem", borderRadius: "12px" }}
                >
                  📊 View Rankings & Recommendation Summary
                </button>
              </div>
            )}

            {/* Results Section (rendered inline below Scoring Grid) */}
            {showResults && (
              <div
                id="results-section"
                style={{
                  borderTop: "2px solid var(--border-color)",
                  paddingTop: "2rem",
                  marginTop: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                    📊 Study Results & Rankings
                  </h2>
                  <button
                    onClick={() => {
                      setShowResults(false);
                      // Scroll back to Step 2 scoring matrix bottom smoothly
                      setTimeout(() => {
                        document.getElementById("results-trigger-container")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      }, 100);
                    }}
                    className="btn-secondary"
                    style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "8px" }}
                  >
                    Hide Results
                  </button>
                </div>
                
                <DashboardView
                  candidates={candidates}
                  tradeCriteria={tradeCriteria}
                  scores={scores}
                  screeningScores={screeningScores}
                  screening={screening}
                  recommendation={recommendation}
                  onRecommendationChange={setRecommendation}
                  onCandidatesChange={setCandidates}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wreck It Ralph Modal */}
      {showWreckItRalphModal && (
        <div 
          onClick={() => setShowWreckItRalphModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fade-in 0.2s ease",
            cursor: "pointer"
          }}
          title="Click anywhere to close"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              borderRadius: "16px",
              overflow: "hidden",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
              position: "relative",
              display: "flex",
              justifyContent: "center"
            }}
          >
            <button
              onClick={() => setShowWreckItRalphModal(false)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "rgba(0, 0, 0, 0.5)",
                border: "none",
                color: "#ffffff",
                fontSize: "1.2rem",
                cursor: "pointer",
                padding: "0.25rem",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10
              }}
              title="Close"
            >
              ❌
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/wreck_it_ralph.gif" 
              alt="Wreck-It Ralph" 
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
