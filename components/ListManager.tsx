"use client";

import React from "react";
import { ScreeningCriterion, TradeCriterion } from "../types/trade";

interface ListManagerProps<T> {
  type: "candidates" | "screening" | "tradeCriteria";
  title: string;
  subtitle: string;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, key: string, value: string | number) => void;
}

export default function ListManager<T extends { id: string; name: string; desc: string }>({
  type,
  title,
  subtitle,
  items,
  onAdd,
  onRemove,
  onChange,
}: ListManagerProps<T>) {
  const MIN = 3;
  const MAX = 10;

  const getPlaceholders = (typeStr: "candidates" | "screening" | "tradeCriteria", idx: number) => {
    if (typeStr === "candidates") {
      const names = ["e.g. Vendor A Relay", "e.g. Vendor B Relay", "e.g. In-house Dev"];
      const descs = ["e.g. Mature product, higher cost", "e.g. Lower cost, emerging product", "e.g. Custom build, longer lead time"];
      return {
        name: names[idx] || "e.g. Candidate Name",
        desc: descs[idx] || "e.g. Candidate description",
      };
    } else if (typeStr === "screening") {
      const names = ["e.g. Meets MIL-STD baseline", "e.g. Bandwidth >= 10 Mbps", "e.g. Delivery within 12 months"];
      const descs = ["e.g. Basic environmental spec", "e.g. Throughput requirement", "e.g. Schedule constraint"];
      return {
        name: names[idx] || "e.g. Screening Criterion",
        desc: descs[idx] || "e.g. Criterion description",
      };
    } else {
      const names = ["e.g. Performance", "e.g. Cost", "e.g. Schedule / Maturity"];
      const descs = ["e.g. Throughput, latency, etc.", "e.g. Lifecycle cost class", "e.g. Time to field & confidence"];
      return {
        name: names[idx] || "e.g. Trade Criterion",
        desc: descs[idx] || "e.g. Criterion description",
      };
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h3 className="panel-title" style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{title}</h3>
          <p className="panel-subtitle" style={{ fontSize: "0.85rem" }}>{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={items.length >= MAX}
          className={`btn-primary ${items.length >= MAX ? "btn-disabled" : ""}`}
          style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
        >
          + Add Item
        </button>
      </div>

      <div className="list-container">
        {items.map((item, index) => {
          const isScreening = type === "screening";
          const isTrade = type === "tradeCriteria";
          const placeholders = getPlaceholders(type, index);

          return (
            <div key={item.id} className="list-item-row">
              <div className="list-index">{item.id}</div>
              
              <div className="list-inputs">
                {/* Name field */}
                <div style={{ flex: 2 }}>
                  <input
                    type="text"
                    placeholder={placeholders.name}
                    value={item.name}
                    onChange={(e) => onChange(index, "name", e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Description field */}
                <div style={{ flex: 3 }}>
                  <input
                    type="text"
                    placeholder={placeholders.desc}
                    value={item.desc}
                    onChange={(e) => onChange(index, "desc", e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Screening: Required Select */}
                {isScreening && (
                  <div style={{ flex: 1 }}>
                    <select
                      value={(item as unknown as ScreeningCriterion).required}
                      onChange={(e) => onChange(index, "required", e.target.value)}
                      className="form-input form-select"
                    >
                      <option value="Y">Required (Y)</option>
                      <option value="N">Optional (N)</option>
                    </select>
                  </div>
                )}

                {/* Trade Criteria: Weight Input */}
                {isTrade && (
                  <div style={{ flex: 1.5, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="number"
                      placeholder="Weight %"
                      value={(item as unknown as TradeCriterion).weight || ""}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onChange(index, "weight", isNaN(val) ? 0 : val);
                      }}
                      className="form-input"
                      min="0"
                      max="100"
                    />
                    <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>%</span>
                  </div>
                )}
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={items.length <= MIN}
                className={`btn-danger ${items.length <= MIN ? "btn-disabled" : ""}`}
                title={items.length <= MIN ? "Minimum limit of 3 items reached" : "Remove item"}
              >
                🗑️
              </button>
            </div>
          );
        })}
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
        <span>Min: {MIN} / Max: {MAX}</span>
        <span>Current items: {items.length}</span>
      </div>
    </div>
  );
}
