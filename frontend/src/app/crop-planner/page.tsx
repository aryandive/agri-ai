"use client";

import { useState } from "react";

interface CropPlan {
    crop: string;
    season: string;
    duration: string;
    yieldPerAcre: string;
    waterNeeded: string;
    seedRate: string;
    fertilizer: string;
    bestSoil: string;
    emoji: string;
}

const cropData: Record<string, CropPlan> = {
    wheat: { crop: "Wheat", season: "Rabi (Oct-Mar)", duration: "120-150 days", yieldPerAcre: "18-20 quintals", waterNeeded: "4-6 irrigations", seedRate: "40-50 kg/acre", fertilizer: "Urea 50kg + DAP 25kg/acre", bestSoil: "Loamy, Clay Loam", emoji: "🌾" },
    rice: { crop: "Rice (Paddy)", season: "Kharif (Jun-Nov)", duration: "120-140 days", yieldPerAcre: "20-25 quintals", waterNeeded: "Continuous flooding", seedRate: "8-10 kg/acre (transplanting)", fertilizer: "Urea 60kg + DAP 30kg/acre", bestSoil: "Clay, Silty Clay", emoji: "🍚" },
    cotton: { crop: "Cotton", season: "Kharif (Apr-Dec)", duration: "150-180 days", yieldPerAcre: "8-12 quintals", waterNeeded: "6-8 irrigations", seedRate: "3-4 kg/acre", fertilizer: "Urea 65kg + DAP 30kg/acre", bestSoil: "Black Cotton Soil", emoji: "🏵️" },
    soybean: { crop: "Soybean", season: "Kharif (Jun-Oct)", duration: "90-110 days", yieldPerAcre: "8-10 quintals", waterNeeded: "3-4 irrigations", seedRate: "30-35 kg/acre", fertilizer: "DAP 40kg + Potash 20kg/acre", bestSoil: "Loamy, Clay Loam", emoji: "🫘" },
    mustard: { crop: "Mustard", season: "Rabi (Oct-Mar)", duration: "110-140 days", yieldPerAcre: "6-8 quintals", waterNeeded: "2-3 irrigations", seedRate: "2-3 kg/acre", fertilizer: "Urea 40kg + DAP 20kg/acre", bestSoil: "Sandy Loam, Loam", emoji: "🌼" },
    sugarcane: { crop: "Sugarcane", season: "Annual (Feb-Jan)", duration: "10-12 months", yieldPerAcre: "300-400 quintals", waterNeeded: "8-10 irrigations", seedRate: "25,000-30,000 setts/acre", fertilizer: "Urea 120kg + DAP 50kg/acre", bestSoil: "Deep Loam, Clay Loam", emoji: "🎋" },
    potato: { crop: "Potato", season: "Rabi (Oct-Feb)", duration: "80-120 days", yieldPerAcre: "80-100 quintals", waterNeeded: "6-8 irrigations", seedRate: "600-800 kg/acre", fertilizer: "Urea 55kg + DAP 50kg/acre", bestSoil: "Sandy Loam, Loam", emoji: "🥔" },
    tomato: { crop: "Tomato", season: "Year-round", duration: "60-80 days", yieldPerAcre: "80-120 quintals", waterNeeded: "Weekly irrigation", seedRate: "150-200 g/acre (nursery)", fertilizer: "NPK balanced + Micronutrients", bestSoil: "Well-drained Loam", emoji: "🍅" },
};

const cropOptions = Object.keys(cropData);

export default function CropPlannerPage() {
    const [selectedCrop, setSelectedCrop] = useState("");
    const [landArea, setLandArea] = useState("");
    const [plan, setPlan] = useState<CropPlan | null>(null);
    const [calculations, setCalculations] = useState<{ totalYield: string; totalSeed: string } | null>(null);

    const handlePlan = () => {
        if (!selectedCrop || !landArea) return;

        const data = cropData[selectedCrop];
        setPlan(data);

        const acres = parseFloat(landArea);
        if (!isNaN(acres) && acres > 0) {
            // Parse yield range and seed rate
            const yieldMatch = data.yieldPerAcre.match(/(\d+)-?(\d+)?/);
            const seedMatch = data.seedRate.match(/(\d[\d,]*)-?(\d[\d,]*)?/);

            const avgYield = yieldMatch
                ? (parseInt(yieldMatch[1]) + parseInt(yieldMatch[2] || yieldMatch[1])) / 2
                : 0;
            const avgSeed = seedMatch
                ? (parseInt(seedMatch[1].replace(/,/g, "")) + parseInt((seedMatch[2] || seedMatch[1]).replace(/,/g, ""))) / 2
                : 0;

            setCalculations({
                totalYield: `${(avgYield * acres).toFixed(0)} quintals (estimated)`,
                totalSeed: `${(avgSeed * acres).toFixed(0)} kg`,
            });
        }
    };

    return (
        <div style={{ maxWidth: "900px" }}>
            {/* Header */}
            <div className="animate-fade-in-up" style={{ marginBottom: "32px" }}>
                <p style={{ color: "#14b8a6", fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    📋 Plan Your Season
                </p>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit, sans-serif", marginBottom: "8px" }}>
                    <span className="gradient-text">Crop Planner</span>
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                    Select a crop and land area to get yield estimates, seed requirements, and farming guidelines.
                </p>
            </div>

            {/* Input Form */}
            <div className="glass-card animate-fade-in-up animate-delay-1" style={{ opacity: 0, padding: "28px", marginBottom: "24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px" }}>
                            Select Crop
                        </label>
                        <select
                            className="input-field"
                            value={selectedCrop}
                            onChange={(e) => { setSelectedCrop(e.target.value); setPlan(null); }}
                            id="crop-planner-select"
                            style={{ cursor: "pointer" }}
                        >
                            <option value="">Choose a crop...</option>
                            {cropOptions.map((c) => (
                                <option key={c} value={c}>
                                    {cropData[c].emoji} {cropData[c].crop}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px" }}>
                            Land Area (acres)
                        </label>
                        <input
                            type="number"
                            className="input-field"
                            placeholder="e.g. 5"
                            value={landArea}
                            onChange={(e) => setLandArea(e.target.value)}
                            min="0.1"
                            step="0.1"
                            id="crop-planner-area"
                        />
                    </div>
                </div>
                <button
                    className="btn-primary"
                    onClick={handlePlan}
                    disabled={!selectedCrop || !landArea}
                >
                    📊 Generate Plan
                </button>
            </div>

            {/* Results */}
            {plan && (
                <div className="animate-fade-in-up" style={{ opacity: 0 }}>
                    {/* Crop Summary */}
                    <div className="glass-card" style={{ padding: "28px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
                            <div style={{
                                width: "56px",
                                height: "56px",
                                borderRadius: "14px",
                                background: "rgba(20, 184, 166, 0.15)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "2rem",
                                border: "1px solid rgba(20, 184, 166, 0.3)",
                            }}>
                                {plan.emoji}
                            </div>
                            <div>
                                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                                    {plan.crop}
                                </h2>
                                <p style={{ color: "var(--color-text-dim)", fontSize: "0.85rem" }}>
                                    {plan.season} • {plan.duration}
                                </p>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                            {[
                                { label: "Yield / Acre", value: plan.yieldPerAcre, emoji: "📦" },
                                { label: "Seed Rate", value: plan.seedRate, emoji: "🌱" },
                                { label: "Water Needed", value: plan.waterNeeded, emoji: "💧" },
                                { label: "Fertilizer", value: plan.fertilizer, emoji: "🧪" },
                                { label: "Best Soil Type", value: plan.bestSoil, emoji: "🏔️" },
                                { label: "Growth Duration", value: plan.duration, emoji: "⏱️" },
                            ].map((stat) => (
                                <div key={stat.label} style={{
                                    background: "var(--color-bg-secondary)",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    border: "1px solid var(--color-border)",
                                }}>
                                    <p style={{ fontSize: "0.85rem", marginBottom: "2px" }}>{stat.emoji}</p>
                                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginBottom: "4px" }}>{stat.label}</p>
                                    <p style={{ fontWeight: 600, color: "var(--color-text-main)", fontSize: "0.9rem" }}>{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Calculated Totals */}
                    {calculations && (
                        <div className="glass-card" style={{ padding: "24px" }}>
                            <h3 style={{ fontWeight: 700, marginBottom: "16px", color: "#14b8a6" }}>
                                📐 Calculations for {landArea} acres
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div style={{
                                    background: "rgba(20, 184, 166, 0.1)",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    border: "1px solid rgba(20, 184, 166, 0.2)",
                                    textAlign: "center",
                                }}>
                                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)", marginBottom: "6px" }}>Expected Total Yield</p>
                                    <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#14b8a6", fontFamily: "Outfit, sans-serif" }}>
                                        {calculations.totalYield}
                                    </p>
                                </div>
                                <div style={{
                                    background: "rgba(245, 158, 11, 0.1)",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    border: "1px solid rgba(245, 158, 11, 0.2)",
                                    textAlign: "center",
                                }}>
                                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)", marginBottom: "6px" }}>Total Seed Required</p>
                                    <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-accent)", fontFamily: "Outfit, sans-serif" }}>
                                        {calculations.totalSeed}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!plan && (
                <div className="glass-card animate-fade-in-up animate-delay-2" style={{ opacity: 0, padding: "48px", textAlign: "center" }}>
                    <p style={{ fontSize: "3rem", marginBottom: "12px" }}>🌾</p>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "1rem" }}>
                        Select a crop and enter your land area above to generate a farming plan
                    </p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
                        {["wheat", "rice", "potato", "tomato"].map((c) => (
                            <button
                                key={c}
                                onClick={() => setSelectedCrop(c)}
                                style={{
                                    background: "var(--color-bg-card)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "999px",
                                    padding: "6px 16px",
                                    color: "var(--color-text-muted)",
                                    cursor: "pointer",
                                    fontSize: "0.85rem",
                                }}
                            >
                                {cropData[c].emoji} {cropData[c].crop}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
