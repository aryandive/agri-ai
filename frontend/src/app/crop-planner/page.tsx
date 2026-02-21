"use client";

<<<<<<< HEAD
import { useState } from "react";
import { useTranslations } from "next-intl";
=======
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
>>>>>>> origin/development

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface CropSuggestion {
    crop: string;
    season: string;
    duration: string;
    yieldPerAcre: string;
    waterNeeded: string;
    seedRate: string;
    fertilizer: string;
    bestSoil: string;
    emoji: string;
    reasoning: string;
}

export default function CropPlannerPage() {
<<<<<<< HEAD
    const t = useTranslations("CropPlanner");
    const [selectedCrop, setSelectedCrop] = useState("");
=======
    const { user, isLoaded } = useUser();

    // Farm Context States
>>>>>>> origin/development
    const [landArea, setLandArea] = useState("");
    const [soilType, setSoilType] = useState("");
    const [waterAvailability, setWaterAvailability] = useState("");
    const [location, setLocation] = useState("Fetching location...");
    const [mandiPrices, setMandiPrices] = useState<Record<string, string>>({});

    // UI States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<CropSuggestion[]>([]);

    useEffect(() => {
        if (!isLoaded || !user) return;

        const loadContext = async () => {
            try {
                // 1. Fetch Profile (Soil Type & Size)
                const profRes = await fetch(`${API_BASE}/api/users/profile/${user.id}`);
                if (profRes.ok) {
                    const profileData = await profRes.json();
                    if (profileData.soil_type) setSoilType(profileData.soil_type);
                    if (profileData.farm_size) setLandArea(profileData.farm_size.toString());
                }

                // 2. Fast Location using IP
                try {
                    const locRes = await fetch("https://ipapi.co/json/");
                    const locData = await locRes.json();
                    const locString = `${locData.city}, ${locData.region}`;
                    setLocation(locString);

                    // 3. Fetch Mandi Prices for this state
                    const mandiRes = await fetch(`${API_BASE}/api/mandi/prices?state=${encodeURIComponent(locData.region)}`);
                    if (mandiRes.ok) {
                        const mData = await mandiRes.json();
                        const prices: Record<string, string> = {};
                        mData.data.slice(0, 5).forEach((p: any) => {
                            prices[p.commodity] = `₹${p.modal_price}/quintal`;
                        });
                        setMandiPrices(prices);
                    }
                } catch (e) {
                    setLocation("Location unavailable");
                }

            } catch (err) {
                console.error("Error loading user context:", err);
            }
        };

        loadContext();
    }, [isLoaded, user]);

    const handlePlan = async () => {
        if (!landArea) {
            setError("Please enter your land area.");
            return;
        }

        setError(null);
        setLoading(true);
        setSuggestions([]);

        try {
            const reqBody = {
                soil_type: soilType || "Unknown",
                acres: parseFloat(landArea),
                location: location !== "Fetching location..." ? location : "Unknown",
                water_availability: waterAvailability || "Unknown",
                mandi_prices: mandiPrices
            };

            const response = await fetch(`${API_BASE}/api/planner/suggest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reqBody)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Failed to generate suggestions.");
            }

            const data = await response.json();
            setSuggestions(data.suggestions || []);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: "1000px" }}>
            {/* Header */}
            <div className="animate-fade-in-up" style={{ marginBottom: "32px" }}>
                <p style={{ color: "#14b8a6", fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    🤖 AI Farming Advisor
                </p>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit, sans-serif", marginBottom: "8px" }}>
<<<<<<< HEAD
                    <span className="gradient-text">{t("title")}</span>
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                    {t("description")}
                </p>
            </div>

            {/* Input Form */}
            <div className="glass-card animate-fade-in-up animate-delay-1" style={{ opacity: 0, padding: "28px", marginBottom: "24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px" }}>
                            {t("selectCrop")}
                        </label>
                        <select
                            className="input-field"
                            value={selectedCrop}
                            onChange={(e) => { setSelectedCrop(e.target.value); setPlan(null); }}
                            id="crop-planner-select"
                            style={{ cursor: "pointer" }}
                        >
                            <option value="">{t("chooseCrop")}</option>
                            {cropOptions.map((c) => (
                                <option key={c} value={c}>
                                    {cropData[c].emoji} {cropData[c].crop}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px" }}>
                            {t("landArea")}
                        </label>
                        <input
                            type="number"
                            className="input-field"
                            placeholder={t("placeholderArea")}
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
                    {t("generatePlan")}
                </button>
=======
                    <span className="gradient-text">Intelligent Crop Planner</span>
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                    Our AI analyzes your soil, location, and real-time market prices to recommend the most profitable crops to plant next.
                </p>
            </div>

            {/* Farm Context Bar */}
            <div className="glass-card animate-fade-in-up animate-delay-1" style={{ opacity: 0, padding: "20px", marginBottom: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", background: "rgba(20, 184, 166, 0.05)", borderLeft: "4px solid #14b8a6" }}>
                <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Location</span>
                    <input
                        type="text"
                        value={location === "Fetching location..." ? "" : location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="e.g. Pune, Maharashtra"
                        style={{ marginTop: "4px", padding: "6px 10px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "6px", width: "100%", fontSize: "0.9rem", color: "var(--color-text-main)" }}
                    />
                </div>
                <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Soil Type</span>
                    <input
                        type="text"
                        value={soilType}
                        onChange={e => setSoilType(e.target.value)}
                        placeholder="e.g. Black Soil"
                        style={{ marginTop: "4px", padding: "6px 10px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "6px", width: "100%", fontSize: "0.9rem", color: "var(--color-text-main)" }}
                    />
                </div>
                <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Land Area (Acres)</span>
                    <input
                        type="number"
                        value={landArea}
                        onChange={e => setLandArea(e.target.value)}
                        placeholder="e.g. 5"
                        style={{ marginTop: "4px", padding: "6px 10px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "6px", width: "100%", fontSize: "0.9rem", color: "var(--color-text-main)" }}
                    />
                </div>
                <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Water</span>
                    <select
                        value={waterAvailability}
                        onChange={e => setWaterAvailability(e.target.value)}
                        style={{ marginTop: "4px", padding: "6px 10px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "6px", width: "100%", fontSize: "0.9rem", color: "var(--color-text-main)" }}
                    >
                        <option value="">Select availability...</option>
                        <option value="Good (Irrigation/Canal/Rain)">Good (Irrigation)</option>
                        <option value="Adequate (Tube well)">Adequate (Tube well)</option>
                        <option value="Poor (Drought-prone)">Poor (Rainfed)</option>
                    </select>
                </div>
>>>>>>> origin/development
            </div>

            <button
                className="btn-primary animate-fade-in-up animate-delay-2"
                onClick={handlePlan}
                disabled={loading || !landArea}
                style={{ opacity: 0, padding: "14px 28px", fontSize: "1.05rem", width: "100%", maxWidth: "300px", marginBottom: "32px", background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)" }}
            >
                {loading ? "🤖 AI is analyzing market geometry..." : "✨ Calculate Best Crops"}
            </button>

<<<<<<< HEAD
                        {/* Stats Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                            {[
                                { label: t("yieldPerAcre"), value: plan.yieldPerAcre, emoji: "📦" },
                                { label: t("seedRate"), value: plan.seedRate, emoji: "🌱" },
                                { label: t("waterNeeded"), value: plan.waterNeeded, emoji: "💧" },
                                { label: t("fertilizer"), value: plan.fertilizer, emoji: "🧪" },
                                { label: t("bestSoilType"), value: plan.bestSoil, emoji: "🏔️" },
                                { label: t("growthDuration"), value: plan.duration, emoji: "⏱️" },
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
                                {t("calculationsTitle", { acres: landArea })}
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div style={{
                                    background: "rgba(20, 184, 166, 0.1)",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    border: "1px solid rgba(20, 184, 166, 0.2)",
                                    textAlign: "center",
                                }}>
                                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)", marginBottom: "6px" }}>{t("totalYield")}</p>
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
                                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)", marginBottom: "6px" }}>{t("totalSeed")}</p>
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
                        {t("emptyStateTitle")}
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
=======
            {error && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "16px", borderRadius: "12px", marginBottom: "20px" }}>
                    ❌ {error}
                </div>
            )}

            {/* Results */}
            {suggestions.length > 0 && (
                <div className="animate-fade-in-up" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>🏆 Top 3 Recommended Crops</h2>

                    {suggestions.map((plan, idx) => (
                        <div key={idx} className="glass-card" style={{ padding: "0" }}>
                            {/* Card Header */}
                            <div style={{ padding: "24px", borderBottom: "1px solid var(--color-border)", background: idx === 0 ? "rgba(20, 184, 166, 0.05)" : "transparent" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                                    <div style={{
                                        width: "60px", height: "60px", borderRadius: "16px",
                                        background: idx === 0 ? "rgba(20, 184, 166, 0.2)" : "var(--color-bg-secondary)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "2.2rem", flexShrink: 0
                                    }}>
                                        {plan.emoji}
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                            <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-text-main)", fontFamily: "Outfit, sans-serif" }}>
                                                {plan.crop}
                                            </h3>
                                            {idx === 0 && (
                                                <span style={{ background: "#14b8a6", color: "#fff", padding: "4px 10px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase" }}>
                                                    Best Match
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ color: "var(--color-text-dim)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                                            <strong>Why:</strong> {plan.reasoning}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                                {[
                                    { label: "Est. Yield / Acre", value: plan.yieldPerAcre, emoji: "📦" },
                                    { label: "Growth Duration", value: plan.duration, emoji: "⏱️" },
                                    { label: "Season", value: plan.season, emoji: "📅" },
                                    { label: "Water Needed", value: plan.waterNeeded, emoji: "💧" },
                                    { label: "Seed Rate / Acre", value: plan.seedRate, emoji: "🌱" },
                                    { label: "Fertilizer", value: plan.fertilizer, emoji: "🧪" },
                                ].map((stat) => (
                                    <div key={stat.label} style={{
                                        background: "var(--color-bg-secondary)",
                                        borderRadius: "12px", padding: "14px",
                                        border: "1px solid var(--color-border)",
                                    }}>
                                        <p style={{ fontSize: "0.9rem", marginBottom: "4px" }}>{stat.emoji}</p>
                                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginBottom: "4px" }}>{stat.label}</p>
                                        <p style={{ fontWeight: 600, color: "var(--color-text-main)", fontSize: "0.95rem" }}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
>>>>>>> origin/development
                </div>
            )}
        </div>
    );
}
