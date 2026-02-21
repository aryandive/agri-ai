"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts";
import { useTranslations } from "next-intl";

const API_BASE = "http://localhost:8000/api/mandi";

interface MandiPrice {
    commodity: string;
    state: string;
    district: string;
    market: string;
    variety: string;
    min_price: number | null;
    max_price: number | null;
    modal_price: number | null;
    date: string;
}

interface TrendPoint {
    date: string;
    avg_price: number | null;
    low: number | null;
    high: number | null;
    markets: number;
}

export default function MandiPage() {
    const t = useTranslations("Mandi");
    const [prices, setPrices] = useState<MandiPrice[]>([]);
    const [commodities, setCommodities] = useState<string[]>([]);
    const [states, setStates] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState("");

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedState, setSelectedState] = useState("");
    const [sortBy, setSortBy] = useState("default");
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    // Trend chart
    const [trendCommodity, setTrendCommodity] = useState("");
    const [trendDays, setTrendDays] = useState(7);
    const [trendData, setTrendData] = useState<TrendPoint[]>([]);
    const [trendLoading, setTrendLoading] = useState(false);

    // Saved crops — by commodity name
    const [savedCrops, setSavedCrops] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<"all" | "saved" | "mycrops">("all");

    // "My Crops" — farmer's profile crops
    const { user, isLoaded } = useUser();
    const [myCrops, setMyCrops] = useState<string[]>([]);

    useEffect(() => {
        if (isLoaded && user) {
            fetch(`http://localhost:8000/api/users/profile/${user.id}`)
                .then(r => r.json())
                .then(d => {
                    if (d.crops && Array.isArray(d.crops)) {
                        setMyCrops(d.crops.map((c: any) => c.crop));
                    }
                })
                .catch(e => console.error("Could not fetch user crops", e));
        }
    }, [isLoaded, user]);

    const toggleSave = (commodity: string) => {
        setSavedCrops((prev) =>
            prev.includes(commodity) ? prev.filter((c) => c !== commodity) : [...prev, commodity]
        );
    };

    // Fetch prices
    const loadPrices = useCallback(async () => {
        try {
            const params = new URLSearchParams({ limit: "300" });
            if (searchQuery) params.set("commodity", searchQuery);
            if (selectedState) params.set("state", selectedState);

            const res = await fetch(`${API_BASE}/prices?${params}`);
            const data = await res.json();
            setPrices(data.prices || []);
        } catch {
            setError(t("errorBackend"));
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedState]);

    // Load prices + metadata on mount
    useEffect(() => {
        loadPrices();
        fetch(`${API_BASE}/commodities`)
            .then((r) => r.json())
            .then((d) => setCommodities(d.commodities || []))
            .catch(() => { });
        fetch(`${API_BASE}/states`)
            .then((r) => r.json())
            .then((d) => setStates(d.states || []))
            .catch(() => { });
    }, [loadPrices]);

    // Load trend data
    useEffect(() => {
        if (!trendCommodity) return;
        setTrendLoading(true);
        fetch(`${API_BASE}/trend?commodity=${encodeURIComponent(trendCommodity)}&days=${trendDays}`)
            .then((r) => r.json())
            .then((d) => setTrendData(d.trend || []))
            .catch(() => setTrendData([]))
            .finally(() => setTrendLoading(false));
    }, [trendCommodity, trendDays]);

    // Manual fetch
    const handleManualFetch = async () => {
        setFetching(true);
        try {
            const res = await fetch(`${API_BASE}/fetch`, { method: "POST" });
            const data = await res.json();
            if (data.status === "success") {
                await loadPrices();
            }
        } catch {
            setError(t("errorFetch"));
        } finally {
            setFetching(false);
        }
    };

    // Sort + filter
    const displayed = [...prices]
        .filter((p) => {
            if (viewMode === "saved") return savedCrops.includes(p.commodity);
            if (viewMode === "mycrops") return myCrops.some((c) => p.commodity.toLowerCase().includes(c.toLowerCase()));
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "price_asc": return (a.modal_price || 0) - (b.modal_price || 0);
                case "price_desc": return (b.modal_price || 0) - (a.modal_price || 0);
                case "state": return (a.state || "").localeCompare(b.state || "");
                case "type": return (a.commodity || "").localeCompare(b.commodity || "");
                case "date": return (b.date || "").localeCompare(a.date || "");
                default: return 0;
            }
        });

    const sortLabels: Record<string, string> = {
        default: t("sortDefault"),
        price_asc: t("sortPriceAsc"),
        price_desc: t("sortPriceDesc"),
        state: t("sortState"),
        type: t("sortType"),
        date: t("sortDate"),
    };

    return (
        <div style={{ maxWidth: "1100px" }}>
            {/* Header */}
            <div className="animate-fade-in-up" style={{ marginBottom: "32px" }}>
                <p style={{ color: "var(--color-accent)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {t("tag")}
                </p>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit, sans-serif", marginBottom: "8px" }}>
                    <span className="gradient-text">{t("title")}</span>
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                    {t("subtitle")}
                </p>
            </div>

            {/* Controls Row */}
            <div className="animate-fade-in-up animate-delay-1" style={{ opacity: 0, display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center", position: "relative", zIndex: 999 }}>
                {/* View Toggle */}
                <div style={{ display: "flex", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                    {(["all", "saved", "mycrops"] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setViewMode(v)}
                            style={{
                                padding: "10px 18px",
                                background: viewMode === v ? "var(--color-primary)" : "var(--color-bg-secondary)",
                                color: viewMode === v ? "white" : "var(--color-text-muted)",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                            }}
                        >
                            {v === "saved" ? t("tabSaved", { count: savedCrops.length }) : v === "mycrops" ? t("tabMyCrops") : t("tabAll")}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <input
                    type="text"
                    className="input-field"
                    placeholder={t("searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1, minWidth: "160px" }}
                    id="mandi-search"
                />

                {/* State Filter */}
                <select
                    className="input-field"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    style={{ minWidth: "140px", cursor: "pointer" }}
                    id="mandi-state-filter"
                >
                    <option value="">{t("allStates")}</option>
                    {states.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                {/* Sort */}
                <div style={{ position: "relative" }}>
                    <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        style={{
                            padding: "12px 18px",
                            borderRadius: "12px",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-bg-secondary)",
                            color: "var(--color-text-muted)",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                        }}
                    >
                        ⇅ {sortLabels[sortBy]}
                    </button>
                    {showSortDropdown && (
                        <div style={{
                            position: "absolute",
                            top: "calc(100% + 6px)",
                            right: 0,
                            background: "var(--color-bg-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "12px",
                            padding: "6px",
                            zIndex: 999,
                            minWidth: "200px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                        }}>
                            {Object.entries(sortLabels).map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => { setSortBy(key); setShowSortDropdown(false); }}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        padding: "10px 14px",
                                        background: sortBy === key ? "rgba(22, 163, 74, 0.15)" : "transparent",
                                        border: "none",
                                        borderRadius: "8px",
                                        color: sortBy === key ? "var(--color-primary-light)" : "var(--color-text-muted)",
                                        cursor: "pointer",
                                        fontSize: "0.85rem",
                                        fontWeight: sortBy === key ? 600 : 400,
                                        textAlign: "left",
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Fetch Button */}
                <button
                    className="btn-primary"
                    onClick={handleManualFetch}
                    disabled={fetching}
                    style={{ padding: "10px 18px", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                >
                    {fetching ? t("fetching") : t("fetchLatest")}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "12px", padding: "14px", marginBottom: "16px", color: "#ef4444", fontSize: "0.9rem" }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Trend Chart */}
            {trendCommodity && (
                <div className="glass-card animate-fade-in-up" style={{ padding: "24px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                            <h3 style={{ fontWeight: 700, color: "var(--color-text-main)", fontSize: "1.1rem" }}>
                                {t("trendTitle", { commodity: trendCommodity })}
                            </h3>
                            <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)" }}>
                                {t("trendSubtitle", { days: trendDays })}
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                            {[7, 14, 30].map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setTrendDays(d)}
                                    style={{
                                        padding: "6px 14px",
                                        borderRadius: "999px",
                                        border: trendDays === d ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                                        background: trendDays === d ? "rgba(22, 163, 74, 0.15)" : "var(--color-bg-secondary)",
                                        color: trendDays === d ? "var(--color-primary-light)" : "var(--color-text-dim)",
                                        cursor: "pointer",
                                        fontSize: "0.8rem",
                                        fontWeight: 600,
                                    }}
                                >
                                    {d}D
                                </button>
                            ))}
                            <button
                                onClick={() => setTrendCommodity("")}
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: "999px",
                                    border: "1px solid var(--color-border)",
                                    background: "var(--color-bg-secondary)",
                                    color: "var(--color-text-dim)",
                                    cursor: "pointer",
                                    fontSize: "0.8rem",
                                }}
                            >
                                {t("trendClose")}
                            </button>
                        </div>
                    </div>

                    {trendLoading ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-dim)" }}>{t("trendLoading")}</div>
                    ) : trendData.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-dim)" }}>{t("trendNoData")}</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#6b7280"
                                    fontSize={12}
                                    tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }}
                                />
                                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `₹${v}`} />
                                <Tooltip
                                    contentStyle={{
                                        background: "rgba(15, 23, 42, 0.95)",
                                        border: "1px solid rgba(45, 90, 54, 0.4)",
                                        borderRadius: "10px",
                                        color: "#e2e8f0",
                                        fontSize: "0.85rem",
                                    }}
                                    formatter={(value: number | string | undefined) => [`₹${Number(value)?.toLocaleString()}`, t("trendAvgPrice")]}
                                    labelFormatter={(label) => `Date: ${label}`}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="avg_price"
                                    stroke="#22c55e"
                                    strokeWidth={2.5}
                                    fill="url(#priceGradient)"
                                    dot={{ r: 4, fill: "#22c55e" }}
                                    activeDot={{ r: 6, fill: "#16a34a" }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            )}

            {/* Prices Table */}
            <div className="glass-card animate-fade-in-up animate-delay-2" style={{ opacity: 0, overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-dim)" }}>
                        <p style={{ fontSize: "1.5rem", marginBottom: "8px" }}>⏳</p>
                        {t("loading")}
                    </div>
                ) : displayed.length === 0 ? (
                    <div style={{ padding: "60px", textAlign: "center", color: "var(--color-text-dim)" }}>
                        <p style={{ fontSize: "1.5rem", marginBottom: "8px" }}>📭</p>
                        {viewMode === "saved"
                            ? t("noSaved")
                            : t("noPrices")}
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                                    {[t("tableCommodity"), t("tableModal"), t("tableMin"), t("tableMax"), t("tableMarket"), t("tableState"), t("tableDate"), t("tableTrend"), ""].map((h, i) => (
                                        <th key={i} style={{ padding: "12px 14px", textAlign: "left", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-dim)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {displayed.map((p, i) => (
                                    <tr
                                        key={`${p.commodity}-${p.market}-${p.date}-${i}`}
                                        style={{ borderBottom: "1px solid rgba(45, 90, 54, 0.3)", transition: "background 0.2s" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-card-hover)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                        <td style={{ padding: "12px 14px" }}>
                                            <p style={{ fontWeight: 600, color: "var(--color-text-main)", fontSize: "0.9rem" }}>{p.commodity}</p>
                                            {p.variety && <p style={{ fontSize: "0.7rem", color: "var(--color-text-dim)" }}>{p.variety}</p>}
                                        </td>
                                        <td style={{ padding: "12px 14px", fontWeight: 700, fontSize: "1rem", color: "var(--color-primary-light)", fontFamily: "Outfit, sans-serif", whiteSpace: "nowrap" }}>
                                            {p.modal_price ? `₹${p.modal_price.toLocaleString()}` : "–"}
                                        </td>
                                        <td style={{ padding: "12px 14px", color: "var(--color-text-dim)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                                            {p.min_price ? `₹${p.min_price.toLocaleString()}` : "–"}
                                        </td>
                                        <td style={{ padding: "12px 14px", color: "var(--color-text-dim)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                                            {p.max_price ? `₹${p.max_price.toLocaleString()}` : "–"}
                                        </td>
                                        <td style={{ padding: "12px 14px", color: "var(--color-text-muted)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>{p.market}</td>
                                        <td style={{ padding: "12px 14px", color: "var(--color-text-dim)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>{p.state}</td>
                                        <td style={{ padding: "12px 14px", color: "var(--color-text-dim)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>{p.date}</td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <button
                                                onClick={() => setTrendCommodity(p.commodity)}
                                                style={{
                                                    background: trendCommodity === p.commodity ? "rgba(22, 163, 74, 0.2)" : "var(--color-bg-secondary)",
                                                    border: "1px solid var(--color-border)",
                                                    borderRadius: "8px",
                                                    padding: "4px 10px",
                                                    color: "var(--color-text-muted)",
                                                    cursor: "pointer",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                📈
                                            </button>
                                        </td>
                                        <td style={{ padding: "12px 14px", width: "40px", textAlign: "center" }}>
                                            <button
                                                onClick={() => toggleSave(p.commodity)}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    fontSize: "1.1rem",
                                                    width: "32px",
                                                    height: "32px",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    lineHeight: 1,
                                                }}
                                            >
                                                {savedCrops.includes(p.commodity) ? "⭐" : "☆"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
                    {t("footerCount", { count: displayed.length })}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
                    {t("footerSource")}
                </p>
            </div>
        </div>
    );
}
