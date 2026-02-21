"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface NewsArticle {
    id: number;
    title: string;
    source: string;
    source_type: string;
    summary: string;
    simplified_summary: string | null;
    key_points: string[];
    region: string;
    category: string;
    url: string;
    image_url: string | null;
    published_at: string;
    created_at: string;
}

interface Scheme {
    id: number;
    name: string;
    description: string;
    eligibility: string;
    benefits: string;
    deadline: string;
    region: string;
    category: string;
    application_link: string | null;
    is_urgent: boolean;
}

interface DiseaseCure {
    _id: string;
    diseaseName: string;
    imageUrl: string | null;
    affectedCrops: string[];
    symptoms: string[];
    description: string;
    cause: string;
    severity: string;
    cureSteps: string[];
    pesticides: string[];
    organicRemedies: string[];
    preventionTips: string[];
    season: string;
    region: string[];
}

const categoryConfig: Record<string, { emoji: string; color: string; bg: string }> = {
    scheme: { emoji: "🏛️", color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
    policy: { emoji: "📋", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    subsidy: { emoji: "💰", color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    mandi: { emoji: "📊", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    weather: { emoji: "⛅", color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
};

const STATES = [
    "All States", "Maharashtra", "Uttar Pradesh", "Punjab", "Haryana",
    "Madhya Pradesh", "Rajasthan", "Karnataka", "Tamil Nadu", "Gujarat",
    "Andhra Pradesh", "Telangana", "West Bengal", "Bihar", "Odisha",
    "Kerala", "Assam", "Jharkhand", "Chhattisgarh",
];

const LANGUAGES: Record<string, string> = {
    en: "English",
    hi: "हिन्दी",
    mr: "मराठी",
    ta: "தமிழ்",
    te: "తెలుగు",
    bn: "বাংলা",
    gu: "ગુજરાતી",
    pa: "ਪੰਜਾਬੀ",
    kn: "ಕನ್ನಡ",
};

export default function NewsPage() {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [diseases, setDiseases] = useState<DiseaseCure[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [category, setCategory] = useState("");
    const [state, setState] = useState("");
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<"news" | "schemes" | "diseases">("news");
    const [language, setLanguage] = useState("en");
    const [translations, setTranslations] = useState<Record<number, { title: string; summary: string }>>({});
    const [translatingId, setTranslatingId] = useState<number | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const loadArticles = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (state && state !== "All States") params.set("state", state);
            if (category) params.set("category", category);
            if (search) params.set("search", search);
            params.set("limit", "100");

            const resp = await fetch(`${API_BASE}/api/news/articles?${params}`);
            if (resp.ok) {
                const data = await resp.json();
                setArticles(data.articles || []);
            }
        } catch { /* ignore */ }
        setLoading(false);
    }, [state, category, search]);

    const loadSchemes = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (state && state !== "All States") params.set("state", state);

            const resp = await fetch(`${API_BASE}/api/news/schemes?${params}`);
            if (resp.ok) {
                const data = await resp.json();
                setSchemes(data.schemes || []);
            }
        } catch { /* ignore */ }
        setLoading(false);
    }, [state]);

    const loadDiseases = useCallback(async () => {
        setLoading(true);
        try {
            const { sanityClient, DISEASE_CURE_QUERY } = await import("@/lib/sanity");
            const data = await sanityClient.fetch(DISEASE_CURE_QUERY);
            if (data) setDiseases(data);
        } catch { /* Sanity not configured */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (tab === "news") loadArticles();
        else if (tab === "schemes") loadSchemes();
        else loadDiseases();
    }, [tab, loadArticles, loadSchemes, loadDiseases]);

    const handleFetchAndSummarize = async () => {
        setFetching(true);
        try {
            await fetch(`${API_BASE}/api/news/fetch-and-summarize`, { method: "POST" });
            // Also mark urgent schemes
            await fetch(`${API_BASE}/api/news/mark-urgent`, { method: "POST" });
            // Reload
            if (tab === "news") await loadArticles();
            else await loadSchemes();
        } catch { /* ignore */ }
        setFetching(false);
    };

    const handleTranslate = async (articleId: number) => {
        if (language === "en") return;
        const key = `${articleId}_${language}`;
        if (translations[articleId]) return;

        setTranslatingId(articleId);
        try {
            const resp = await fetch(`${API_BASE}/api/news/translate/${articleId}?language=${language}`, { method: "POST" });
            if (resp.ok) {
                const data = await resp.json();
                setTranslations((prev) => ({ ...prev, [articleId]: { title: data.title, summary: data.summary } }));
            }
        } catch { /* ignore */ }
        setTranslatingId(null);
    };

    const getCatStyle = (cat: string) => categoryConfig[cat] || { emoji: "📰", color: "#6b7280", bg: "rgba(107,114,128,0.12)" };

    return (
        <div style={{ maxWidth: "960px" }}>
            {/* Header */}
            <div className="animate-fade-in-up" style={{ marginBottom: "28px" }}>
                <p style={{ color: "#8b5cf6", fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    📰 Stay Informed
                </p>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit, sans-serif", marginBottom: "8px" }}>
                    <span className="gradient-text">Agriculture News & Schemes</span>
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                    Live agriculture news from PIB, government schemes, and policy updates — simplified for farmers.
                </p>
            </div>

            {/* Tab Toggle + Fetch Button */}
            <div className="animate-fade-in-up animate-delay-1" style={{ opacity: 0, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                    {(["news", "schemes", "diseases"] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            padding: "10px 22px",
                            background: tab === t ? "var(--color-primary)" : "var(--color-bg-secondary)",
                            color: tab === t ? "white" : "var(--color-text-muted)",
                            border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                        }}>
                            {t === "news" ? "📰 News" : t === "schemes" ? "🏛️ Schemes" : "🦠 Disease & Cure"}
                        </button>
                    ))}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {/* Language Selector */}
                    <select
                        value={language}
                        onChange={(e) => { setLanguage(e.target.value); setTranslations({}); }}
                        style={{
                            padding: "8px 12px", background: "var(--color-bg-secondary)", color: "var(--color-text-main)",
                            border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "0.8rem",
                        }}
                    >
                        {Object.entries(LANGUAGES).map(([code, name]) => (
                            <option key={code} value={code}>{name}</option>
                        ))}
                    </select>
                    <button onClick={handleFetchAndSummarize} className="btn-primary" disabled={fetching} style={{ padding: "8px 16px", fontSize: "0.8rem" }}>
                        {fetching ? "⏳ Fetching..." : "🔄 Fetch Latest"}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="animate-fade-in-up animate-delay-2" style={{ opacity: 0, display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                {/* State Filter */}
                <select value={state} onChange={(e) => setState(e.target.value)} style={{
                    padding: "8px 14px", background: "var(--color-bg-secondary)", color: "var(--color-text-main)",
                    border: "1px solid var(--color-border)", borderRadius: "10px", fontSize: "0.8rem", minWidth: "140px",
                }}>
                    <option value="">📍 All States</option>
                    {STATES.filter((s) => s !== "All States").map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>

                {/* Category Filter (news tab only) */}
                {tab === "news" && (
                    <select value={category} onChange={(e) => setCategory(e.target.value)} style={{
                        padding: "8px 14px", background: "var(--color-bg-secondary)", color: "var(--color-text-main)",
                        border: "1px solid var(--color-border)", borderRadius: "10px", fontSize: "0.8rem", minWidth: "120px",
                    }}>
                        <option value="">📂 All Categories</option>
                        {Object.keys(categoryConfig).map((c) => (
                            <option key={c} value={c}>{categoryConfig[c].emoji} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                    </select>
                )}

                {/* Search */}
                {tab === "news" && (
                    <input
                        type="text"
                        placeholder="🔍 Search news..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && loadArticles()}
                        className="input-field"
                        style={{ flex: 1, minWidth: "150px", padding: "8px 14px", fontSize: "0.8rem" }}
                    />
                )}
            </div>

            {/* Urgent Schemes Banner */}
            {tab === "schemes" && schemes.some((s) => s.is_urgent) && (
                <div className="glass-card" style={{
                    padding: "16px 20px", marginBottom: "16px",
                    background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)",
                }}>
                    <p style={{ fontWeight: 700, color: "#ef4444", fontSize: "0.9rem", marginBottom: "6px" }}>
                        🔔 Urgent: {schemes.filter((s) => s.is_urgent).length} scheme(s) with deadline within 15 days!
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        Apply before the deadline to avail benefits.
                    </p>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: "center", padding: "48px" }}>
                    <span className="spinner" style={{ width: "32px", height: "32px" }}></span>
                    <p style={{ color: "var(--color-text-muted)", marginTop: "12px" }}>Loading...</p>
                </div>
            )}

            {/* === NEWS TAB === */}
            {tab === "news" && !loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {articles.length === 0 && (
                        <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
                            <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📰</p>
                            <p style={{ color: "var(--color-text-muted)", marginBottom: "16px" }}>
                                No news articles yet. Click &quot;Fetch Latest&quot; to pull live agriculture news.
                            </p>
                            <button onClick={handleFetchAndSummarize} className="btn-primary" disabled={fetching}>
                                {fetching ? "⏳ Fetching..." : "🔄 Fetch Latest News"}
                            </button>
                        </div>
                    )}
                    {articles.map((article, index) => {
                        const cat = getCatStyle(article.category);
                        const isExpanded = expandedId === article.id;
                        const trans = translations[article.id];
                        const displayTitle = (language !== "en" && trans?.title) ? trans.title : article.title;
                        const displaySummary = (language !== "en" && trans?.summary) ? trans.summary
                            : article.simplified_summary || article.summary || "";

                        return (
                            <div
                                key={article.id}
                                className={`glass-card animate-fade-in-up animate-delay-${Math.min(index + 1, 4)}`}
                                style={{ padding: "22px", opacity: 0, cursor: "pointer", transition: "all 0.2s" }}
                                onClick={() => setExpandedId(isExpanded ? null : article.id)}
                            >
                                {/* Top row: badge + date */}
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                                    <span style={{
                                        padding: "3px 12px", borderRadius: "999px",
                                        background: cat.bg, color: cat.color,
                                        fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
                                    }}>
                                        {cat.emoji} {article.category}
                                    </span>
                                    <span style={{
                                        padding: "3px 10px", borderRadius: "999px",
                                        background: "rgba(107,114,128,0.1)", color: "#6b7280",
                                        fontSize: "0.7rem", fontWeight: 600,
                                    }}>
                                        📍 {article.region || "national"}
                                    </span>
                                    <span style={{ fontSize: "0.72rem", color: "var(--color-text-dim)", marginLeft: "auto" }}>
                                        {article.published_at || article.created_at}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-main)", lineHeight: 1.4, marginBottom: "8px" }}>
                                    {displayTitle}
                                </h3>

                                {/* Summary */}
                                <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                                    {displaySummary.slice(0, isExpanded ? 999 : 200)}{!isExpanded && displaySummary.length > 200 ? "..." : ""}
                                </p>

                                {/* Expanded view */}
                                {isExpanded && (
                                    <div style={{ marginTop: "14px", borderTop: "1px solid var(--color-border)", paddingTop: "14px" }}>
                                        {/* Key Points */}
                                        {article.key_points && article.key_points.length > 0 && (
                                            <div style={{ marginBottom: "12px" }}>
                                                <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--color-text-main)", marginBottom: "6px" }}>📌 Key Points:</p>
                                                <ul style={{ paddingLeft: "20px", margin: 0 }}>
                                                    {article.key_points.map((kp, i) => (
                                                        <li key={i} style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "3px" }}>{kp}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Actions: translate, read more */}
                                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                                            {language !== "en" && !trans && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleTranslate(article.id); }}
                                                    disabled={translatingId === article.id}
                                                    style={{
                                                        padding: "6px 14px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 600,
                                                        background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    {translatingId === article.id ? "⏳ Translating..." : `🌐 Translate to ${LANGUAGES[language]}`}
                                                </button>
                                            )}
                                            {article.url && (
                                                <a
                                                    href={article.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        padding: "6px 14px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 600,
                                                        background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)",
                                                        textDecoration: "none",
                                                    }}
                                                >
                                                    🔗 Read Full Article
                                                </a>
                                            )}
                                            <span style={{ fontSize: "0.72rem", color: "var(--color-text-dim)" }}>
                                                Source: {article.source} ({article.source_type})
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* === SCHEMES TAB === */}
            {tab === "schemes" && !loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {schemes.length === 0 && (
                        <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
                            <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🏛️</p>
                            <p style={{ color: "var(--color-text-muted)" }}>
                                No schemes found. Schemes are auto-detected from news articles after summarization.
                            </p>
                        </div>
                    )}
                    {schemes.map((scheme, index) => (
                        <div
                            key={scheme.id}
                            className={`glass-card animate-fade-in-up animate-delay-${Math.min(index + 1, 4)}`}
                            style={{
                                padding: "22px", opacity: 0,
                                borderColor: scheme.is_urgent ? "rgba(239,68,68,0.4)" : undefined,
                                background: scheme.is_urgent ? "rgba(239,68,68,0.04)" : undefined,
                            }}
                        >
                            {/* Urgent badge */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                                {scheme.is_urgent && (
                                    <span style={{
                                        padding: "3px 12px", borderRadius: "999px",
                                        background: "rgba(239,68,68,0.15)", color: "#ef4444",
                                        fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
                                        animation: "pulse 2s infinite",
                                    }}>
                                        🔔 URGENT
                                    </span>
                                )}
                                <span style={{
                                    padding: "3px 12px", borderRadius: "999px",
                                    background: "rgba(139,92,246,0.12)", color: "#a78bfa",
                                    fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
                                }}>
                                    🏛️ {scheme.category}
                                </span>
                                <span style={{
                                    padding: "3px 10px", borderRadius: "999px",
                                    background: "rgba(107,114,128,0.1)", color: "#6b7280",
                                    fontSize: "0.7rem", fontWeight: 600,
                                }}>
                                    📍 {scheme.region || "national"}
                                </span>
                            </div>

                            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-main)", lineHeight: 1.4, marginBottom: "8px" }}>
                                {scheme.name}
                            </h3>

                            {scheme.description && (
                                <p style={{ fontSize: "0.88rem", color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: "12px" }}>
                                    {scheme.description}
                                </p>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
                                {scheme.eligibility && (
                                    <div style={{ background: "var(--color-bg-secondary)", borderRadius: "10px", padding: "12px", border: "1px solid var(--color-border)" }}>
                                        <p style={{ fontSize: "0.72rem", color: "var(--color-text-dim)", marginBottom: "4px", fontWeight: 600 }}>👤 Eligibility</p>
                                        <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>{scheme.eligibility}</p>
                                    </div>
                                )}
                                {scheme.deadline && (
                                    <div style={{ background: "var(--color-bg-secondary)", borderRadius: "10px", padding: "12px", border: "1px solid var(--color-border)" }}>
                                        <p style={{ fontSize: "0.72rem", color: "var(--color-text-dim)", marginBottom: "4px", fontWeight: 600 }}>📅 Deadline</p>
                                        <p style={{ fontSize: "0.82rem", color: scheme.is_urgent ? "#ef4444" : "var(--color-text-muted)", fontWeight: scheme.is_urgent ? 700 : 400 }}>
                                            {scheme.deadline}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {scheme.application_link && (
                                <a
                                    href={scheme.application_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: "inline-block", marginTop: "12px",
                                        padding: "8px 18px", borderRadius: "10px", fontSize: "0.82rem", fontWeight: 600,
                                        background: "var(--color-primary)", color: "white",
                                        textDecoration: "none",
                                    }}
                                >
                                    📝 Apply Now →
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* === DISEASE & CURE TAB === */}
            {tab === "diseases" && !loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {diseases.length === 0 && (
                        <div className="glass-card" style={{ padding: "48px", textAlign: "center" }}>
                            <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🦠</p>
                            <p style={{ color: "var(--color-text-muted)", marginBottom: "8px" }}>
                                No disease data yet. Add entries via Sanity CMS to populate this section.
                            </p>
                            <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)" }}>
                                This data powers the Crop Doctor recommendations.
                            </p>
                        </div>
                    )}
                    {diseases.map((disease, index) => {
                        const sevColor: Record<string, string> = { low: "#22c55e", medium: "#f59e0b", high: "#f97316", critical: "#ef4444" };
                        const color = sevColor[disease.severity] || "#6b7280";

                        return (
                            <div
                                key={disease._id}
                                className={`glass-card animate-fade-in-up animate-delay-${Math.min(index + 1, 4)}`}
                                style={{ padding: "22px", opacity: 0 }}
                            >
                                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                    {/* Image */}
                                    {disease.imageUrl && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={disease.imageUrl} alt={disease.diseaseName}
                                            style={{ width: "100px", height: "100px", borderRadius: "12px", objectFit: "cover", flexShrink: 0 }} />
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {/* Badges */}
                                        <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                                            <span style={{
                                                padding: "3px 10px", borderRadius: "6px",
                                                background: `${color}20`, color,
                                                fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
                                            }}>
                                                ⚠️ {disease.severity || "unknown"}
                                            </span>
                                            {disease.cause && (
                                                <span style={{
                                                    padding: "3px 10px", borderRadius: "6px",
                                                    background: "rgba(139,92,246,0.12)", color: "#a78bfa",
                                                    fontSize: "0.7rem", fontWeight: 600,
                                                }}>
                                                    🔬 {disease.cause}
                                                </span>
                                            )}
                                            {disease.season && (
                                                <span style={{
                                                    padding: "3px 10px", borderRadius: "6px",
                                                    background: "rgba(34,197,94,0.12)", color: "#22c55e",
                                                    fontSize: "0.7rem", fontWeight: 600,
                                                }}>
                                                    🗓️ {disease.season.replace("_", " ")}
                                                </span>
                                            )}
                                        </div>

                                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "6px" }}>
                                            {disease.diseaseName}
                                        </h3>
                                        {disease.description && (
                                            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: "10px" }}>
                                                {disease.description}
                                            </p>
                                        )}

                                        {/* Affected Crops */}
                                        {disease.affectedCrops?.length > 0 && (
                                            <div style={{ marginBottom: "10px" }}>
                                                <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", fontWeight: 600, marginBottom: "4px" }}>🌾 Affected Crops:</p>
                                                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                    {disease.affectedCrops.map((c, i) => (
                                                        <span key={i} style={{
                                                            padding: "2px 10px", borderRadius: "999px", fontSize: "0.72rem",
                                                            background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)",
                                                            color: "var(--color-text-muted)",
                                                        }}>{c}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px", marginTop: "14px" }}>
                                    {disease.symptoms?.length > 0 && (
                                        <div style={{ background: "var(--color-bg-secondary)", borderRadius: "10px", padding: "12px", border: "1px solid var(--color-border)" }}>
                                            <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", fontWeight: 600, marginBottom: "6px" }}>🔍 Symptoms</p>
                                            <ul style={{ paddingLeft: "16px", margin: 0 }}>
                                                {disease.symptoms.map((s, i) => (
                                                    <li key={i} style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "2px" }}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {disease.cureSteps?.length > 0 && (
                                        <div style={{ background: "var(--color-bg-secondary)", borderRadius: "10px", padding: "12px", border: "1px solid var(--color-border)" }}>
                                            <p style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 600, marginBottom: "6px" }}>💊 Cure Steps</p>
                                            <ol style={{ paddingLeft: "16px", margin: 0 }}>
                                                {disease.cureSteps.map((s, i) => (
                                                    <li key={i} style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "2px" }}>{s}</li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}
                                    {disease.pesticides?.length > 0 && (
                                        <div style={{ background: "var(--color-bg-secondary)", borderRadius: "10px", padding: "12px", border: "1px solid var(--color-border)" }}>
                                            <p style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: 600, marginBottom: "6px" }}>🧪 Pesticides</p>
                                            <ul style={{ paddingLeft: "16px", margin: 0 }}>
                                                {disease.pesticides.map((p, i) => (
                                                    <li key={i} style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "2px" }}>{p}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {disease.organicRemedies?.length > 0 && (
                                        <div style={{ background: "var(--color-bg-secondary)", borderRadius: "10px", padding: "12px", border: "1px solid var(--color-border)" }}>
                                            <p style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 600, marginBottom: "6px" }}>🌿 Organic Remedies</p>
                                            <ul style={{ paddingLeft: "16px", margin: 0 }}>
                                                {disease.organicRemedies.map((r, i) => (
                                                    <li key={i} style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "2px" }}>{r}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {disease.preventionTips?.length > 0 && (
                                        <div style={{ background: "var(--color-bg-secondary)", borderRadius: "10px", padding: "12px", border: "1px solid var(--color-border)" }}>
                                            <p style={{ fontSize: "0.75rem", color: "#3b82f6", fontWeight: 600, marginBottom: "6px" }}>🛡️ Prevention</p>
                                            <ul style={{ paddingLeft: "16px", margin: 0 }}>
                                                {disease.preventionTips.map((t, i) => (
                                                    <li key={i} style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "2px" }}>{t}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
