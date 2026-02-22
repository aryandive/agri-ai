"use client";

import { useEffect, useState } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DashboardPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedCrops, setExpandedCrops] = useState<Record<number, boolean>>({});

    // New states for dashboard widgets
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [weatherData, setWeatherData] = useState<any>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [mandiPrices, setMandiPrices] = useState<any[]>([]);
    const [mandiLoading, setMandiLoading] = useState(false);

    useEffect(() => {
        if (isLoaded && !user) {
            router.push("/sign-in");
        } else if (isLoaded && user) {
            fetchProfile();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, user]);

    const fetchWeather = async (lat: number, lng: number) => {
        setWeatherLoading(true);
        try {
            const geoResp = await fetch(
                `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lng}&limit=1&appid=${process.env.NEXT_PUBLIC_OW_KEY || "9d373ac68940eb3da83810bc662103c5"}`
            );
            const geo = await geoResp.json();
            if (geo?.[0]?.name) {
                const city = geo[0].name;
                const weatherResp = await fetch(`${API_BASE}/api/weather?city=${encodeURIComponent(city)}${user ? `&clerk_id=${user.id}` : ""}`);
                if (weatherResp.ok) {
                    setWeatherData(await weatherResp.json());
                }
            }
        } catch (e) {
            console.error("Failed to fetch weather", e);
        } finally {
            setWeatherLoading(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchMandi = async (crops: any[]) => {
        setMandiLoading(true);
        try {
            const cropNames = crops.map((c) => c.crop);
            const promises = cropNames.map((c) =>
                fetch(`${API_BASE}/api/mandi/prices?commodity=${encodeURIComponent(c)}&limit=1`).then(r => r.json()).catch(() => null)
            );
            const results = await Promise.all(promises);
            const validData = results
                .filter(r => r && r.prices && r.prices.length > 0)
                .map(r => r.prices[0]);
            setMandiPrices(validData);
        } catch (e) {
            console.error("Failed to fetch mandi", e);
        } finally {
            setMandiLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            setError(null);
            const resp = await fetch(`${API_BASE}/api/users/profile/${user?.id}`);
            if (resp.status === 404) {
                // No profile exists, go to onboarding //
                router.push("/onboarding");
                return;
            }
            if (!resp.ok) {
                throw new Error(`Failed to fetch profile: ${resp.status}`);
            }

            const data = await resp.json();
            setProfile(data);

            if (data.location_lat && data.location_lng) {
                fetchWeather(data.location_lat, data.location_lng);
            }
            if (data.crops && data.crops.length > 0) {
                fetchMandi(data.crops);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Failed to connect to the backend server.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={{ padding: "40px", textAlign: "center", fontSize: "1.2rem", color: "var(--color-text-muted)" }}>Loading your farm data...</div>;
    }

    if (error) {
        return (
            <div style={{ padding: "40px", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
                <h2 style={{ fontSize: "1.5rem", color: "var(--color-primary)", marginBottom: "16px" }}>⚠️ Connection Error</h2>
                <p style={{ color: "var(--color-text-muted)", marginBottom: "24px" }}>{error}</p>
                <button onClick={fetchProfile} className="btn-primary" style={{ padding: "10px 24px" }}>
                    Retry Connection
                </button>
            </div>
        );
    }

    if (!profile) {
        return <div style={{ padding: "40px", textAlign: "center" }}>Loading your farm data...</div>;
    }

    // Calculate days since planted
    const getDaysSince = (dateStr: string) => {
        const planted = new Date(dateStr);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - planted.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const weatherIconUrl = (icon: string) => `https://openweathermap.org/img/wn/${icon}@2x.png`;

    return (
        <div style={{ maxWidth: "1000px" }}>
            {/* Header */}
            <div className="animate-fade-in-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <p style={{ color: "var(--color-primary-light)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        🌾 Personalized Dashboard
                    </p>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit, sans-serif" }}>
                        Welcome back, <span className="gradient-text">{profile.name.split(" ")[0]}</span>
                    </h1>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <Link href="/profile" style={{ padding: "8px 16px", borderRadius: "8px", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", color: "var(--color-text-main)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
                        <span>👤</span> Profile
                    </Link>
                    <SignOutButton>
                        <button style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--color-danger)", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
                            Sign Out
                        </button>
                    </SignOutButton>
                </div>
            </div>

            {/* Top Grid: Weather & Mandi */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "32px" }}>

                {/* Weather Widget */}
                <div className="glass-card animate-fade-in-up animate-delay-1" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                                <span>🌤️</span> Local Weather
                            </h2>
                            <Link href="/weather" style={{ fontSize: "0.85rem", color: "var(--color-primary-light)", textDecoration: "none", fontWeight: 600 }}>
                                View Full Forecast →
                            </Link>
                        </div>

                        {weatherLoading ? (
                            <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Loading weather data...</div>
                        ) : weatherData ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "20px", background: "var(--color-bg-secondary)", padding: "16px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
                                <div style={{ textAlign: "center" }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={weatherIconUrl(weatherData.current.icon)} alt={weatherData.current.description} style={{ width: "64px", height: "64px" }} />
                                    <p style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "Outfit, sans-serif", color: "var(--color-text-main)", lineHeight: 1 }}>
                                        {weatherData.current.temperature.toFixed(1)}°C
                                    </p>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--color-text-main)", marginBottom: "4px" }}>
                                        {weatherData.current.city}
                                    </p>
                                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", textTransform: "capitalize", marginBottom: "8px" }}>
                                        {weatherData.current.description}
                                    </p>
                                    <div style={{ display: "flex", gap: "12px", fontSize: "0.85rem", color: "var(--color-text-dim)" }}>
                                        <span>💧 {weatherData.current.humidity}%</span>
                                        <span>💨 {weatherData.current.wind_speed} m/s</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Weather unavailable</div>
                        )}
                    </div>

                    {weatherData?.advisory?.alerts && weatherData.advisory.alerts.length > 0 && (
                        <div style={{ marginTop: "16px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "12px", borderRadius: "8px" }}>
                            <p style={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>⚠️</span> {weatherData.advisory.alerts[0].message}
                            </p>
                        </div>
                    )}
                </div>

                {/* Mandi Prices Widget */}
                <div className="glass-card animate-fade-in-up animate-delay-2" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "1.2rem", color: "#16a34a" }}>₹</span> My Crop Prices
                        </h2>
                        <Link href="/mandi" style={{ fontSize: "0.85rem", color: "var(--color-primary-light)", textDecoration: "none", fontWeight: 600 }}>
                            View Mandi →
                        </Link>
                    </div>

                    {mandiLoading ? (
                        <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Loading market prices...</div>
                    ) : mandiPrices.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {mandiPrices.map((p, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-secondary)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
                                    <div>
                                        <p style={{ fontWeight: 600, color: "var(--color-text-main)", fontSize: "0.95rem" }}>{p.commodity}</p>
                                        <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>{p.market}, {p.state}</p>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <p style={{ fontWeight: 700, color: "var(--color-primary-light)", fontSize: "1.1rem", fontFamily: "Outfit, sans-serif" }}>
                                            ₹{p.modal_price?.toLocaleString() || "N/A"}
                                        </p>
                                        <p style={{ fontSize: "0.7rem", color: "var(--color-text-dim)" }}>per quintal</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "var(--color-bg-secondary)", borderRadius: "12px", border: "1px dashed var(--color-border)", padding: "20px", textAlign: "center" }}>
                            <p style={{ fontSize: "2rem", marginBottom: "8px" }}>📉</p>
                            <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>No recent prices found for your crops.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="animate-fade-in-up animate-delay-2" style={{ marginBottom: "32px" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>⚡</span> Quick Actions
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    {[
                        { title: "Crop Doctor", desc: "Diagnose diseases", icon: "🔬", href: "/crop-doctor", bg: "linear-gradient(135deg, rgba(22, 163, 74, 0.1), rgba(21, 128, 61, 0.1))", border: "rgba(22, 163, 74, 0.3)" },
                        { title: "Marketplace", desc: "Buy & sell goods", icon: "🛒", href: "/marketplace", bg: "linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(190, 24, 93, 0.1))", border: "rgba(236, 72, 153, 0.3)" },
                        { title: "Crop Planner", desc: "Plan new cycle", icon: "📋", href: "/crop-planner", bg: "linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(13, 148, 136, 0.1))", border: "rgba(20, 184, 166, 0.3)" },
                        { title: "News & Schemes", desc: "Govt updates", icon: "📰", href: "/news", bg: "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(109, 40, 217, 0.1))", border: "rgba(139, 92, 246, 0.3)" }
                    ].map((act, i) => (
                        <Link href={act.href} key={i} style={{ textDecoration: "none" }}>
                            <div className="glass-card" style={{ padding: "20px", background: act.bg, borderColor: act.border, display: "flex", alignItems: "center", gap: "16px" }}>
                                <div style={{ fontSize: "2rem" }}>{act.icon}</div>
                                <div>
                                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px" }}>{act.title}</h3>
                                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{act.desc}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Farm Overview & Crop Growth Status */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "32px" }}>

                {/* Farm Overview Card */}
                <div className="glass-card animate-fade-in-up animate-delay-3" style={{ padding: "24px" }}>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>🗺️</span> Farm Overview
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--color-border)" }}>
                            <span style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>Total Area:</span>
                            <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>{profile.land_area_acres} Acres</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--color-border)" }}>
                            <span style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>Soil Type:</span>
                            <span style={{ fontWeight: 600, color: "var(--color-text-main)", textTransform: "capitalize" }}>{profile.soil_type} Soil</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px" }}>
                            <span style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>Location:</span>
                            <span style={{ fontWeight: 600, color: "var(--color-primary-light)" }}>Lat: {profile.location_lat?.toFixed(2)}, Lng: {profile.location_lng?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Current Crops Status */}
                <div className="glass-card animate-fade-in-up animate-delay-3" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>🌱</span> Crop Growth Status
                        </h2>
                    </div>
                    {profile.crops && profile.crops.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {profile.crops.map((c: any, i: number) => {
                                const days = getDaysSince(c.planted_date);
                                // Simple mock logic for maturity stage
                                let stage = "Seedling";
                                let progress = 20;
                                let color = "#3b82f6";
                                let advice = "Ensure adequate watering.";

                                if (days > 30 && days <= 60) {
                                    stage = "Vegetative";
                                    progress = 50;
                                    color = "#10b981";
                                    advice = "Apply Nitrogen fertilizer (Urea). Check for early pests.";
                                } else if (days > 60 && days <= 90) {
                                    stage = "Flowering / Grain Filling";
                                    progress = 80;
                                    color = "#f59e0b";
                                    advice = "🛑 High disease risk. Pre-emptive fungicide spray recommended.";
                                } else if (days > 90) {
                                    stage = "Maturity / Harvest Ready";
                                    progress = 100;
                                    color = "#f43f5e";
                                    advice = "Prepare for harvest. Withhold watering 1 week prior.";
                                }

                                return (
                                    <div key={i} style={{ background: "var(--color-bg-secondary)", borderRadius: "12px", padding: "16px", border: "1px solid var(--color-border)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center" }}>
                                            <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--color-text-main)" }}>{c.crop}</span>
                                            <span style={{ fontSize: "0.8rem", color: color, fontWeight: 700, background: `${color}20`, padding: "4px 10px", borderRadius: "999px" }}>
                                                Day {days}: {stage}
                                            </span>
                                        </div>

                                        {/* Progress bar */}
                                        <div style={{ width: "100%", height: "8px", background: "var(--color-bg-main)", borderRadius: "999px", marginBottom: "12px", overflow: "hidden" }}>
                                            <div style={{ width: `${progress}%`, height: "100%", background: color, borderRadius: "999px" }}></div>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px", borderLeft: `3px solid ${color}` }}>
                                            <span style={{ fontSize: "1.2rem" }}>🤖</span>
                                            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                                                <strong style={{ color: "var(--color-text-main)", marginRight: "4px" }}>AI Action:</strong> {advice}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ padding: "32px 24px", textAlign: "center", color: "var(--color-text-muted)", background: "var(--color-bg-secondary)", borderRadius: "12px", border: "1px dashed var(--color-border)" }}>
                            <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🌾</p>
                            <p style={{ fontSize: "0.95rem" }}>No crops planted currently.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Crop Process Checklist */}
            {profile.crops && profile.crops.length > 0 && (
                <div className="glass-card animate-fade-in-up animate-delay-4" style={{ padding: "24px", marginBottom: "32px" }}>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "20px", color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>📋</span> Crop Process Checklist
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {profile.crops.map((c: any, idx: number) => {
                            const days = getDaysSince(c.planted_date);

                            // Crop lifecycle stages: [label, startDay, endDay, tasks]
                            const stages = [
                                { label: "Land Prep & Sowing", icon: "🌱", day: 0, tasks: ["Till and level soil", "Apply basal fertilizer (DAP/SSP)", "Sow seeds at correct depth", "Ensure proper spacing"] },
                                { label: "Germination", icon: "🌿", day: 7, tasks: ["Check germination rate", "Re-sow if gaps > 20%", "Light irrigation daily"] },
                                { label: "Vegetative Growth", icon: "🍃", day: 21, tasks: ["Apply Nitrogen (Urea) top dressing", "Weed control (manual/herbicide)", "First pest scouting"] },
                                { label: "Branching / Tillering", icon: "🌾", day: 40, tasks: ["Irrigation every 7–10 days", "Potassium application if needed", "Monitor for aphids / whitefly"] },
                                { label: "Flowering", icon: "🌸", day: 60, tasks: ["Avoid irrigation stress", "Spray micronutrients (zinc/boron)", "Fungicide spray to prevent blight"] },
                                { label: "Grain / Fruit Filling", icon: "🫘", day: 80, tasks: ["Maintain soil moisture", "Monitor for stem borer / pod borer", "Apply K2SO4 if fruiting is poor"] },
                                { label: "Ripening", icon: "🟡", day: 100, tasks: ["Reduce irrigation gradually", "Watch for lodging / premature drop", "Arrange harvesting equipment"] },
                                { label: "Harvest", icon: "🚜", day: 120, tasks: ["Harvest at moisture < 20%", "Dry before storage", "Record yield per acre"] },
                            ];

                            return (
                                <div key={idx} style={{ background: "var(--color-bg-secondary)", borderRadius: "12px", border: "1px solid var(--color-border)", overflow: "hidden" }}>
                                    <div
                                        onClick={() => setExpandedCrops(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", cursor: "pointer", background: expandedCrops[idx] ? "rgba(0,0,0,0.1)" : "transparent", transition: "background 0.2s" }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                                            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--color-primary-light)" }}>
                                                🌾 {c.crop}
                                            </p>
                                            <span style={{ fontSize: "0.85rem", background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "999px", color: "var(--color-text-muted)" }}>planted {days} days ago</span>
                                        </div>
                                        <span style={{ fontSize: "1rem", color: "var(--color-text-dim)", transform: expandedCrops[idx] ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
                                    </div>

                                    {expandedCrops[idx] && (
                                        <div style={{ padding: "0 20px 20px 20px", display: "flex", flexDirection: "column", gap: "0", marginTop: "16px" }}>
                                            {stages.map((stage, si) => {
                                                const nextStage = stages[si + 1];
                                                const isDone = days > (nextStage?.day ?? 999);
                                                const isCurrent = days >= stage.day && (!nextStage || days <= nextStage.day);
                                                const daysUntil = stage.day - days;
                                                const isUpcoming = !isDone && !isCurrent;

                                                return (
                                                    <div key={si} style={{ display: "flex", gap: "16px", position: "relative" }}>
                                                        {/* Timeline line */}
                                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "32px", flexShrink: 0 }}>
                                                            <div style={{
                                                                width: "32px", height: "32px", borderRadius: "50%",
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                fontSize: "0.9rem", fontWeight: 700, flexShrink: 0,
                                                                background: isDone ? "rgba(20,184,166,0.15)" : isCurrent ? "rgba(245,158,11,0.15)" : "var(--color-bg-main)",
                                                                border: isDone ? "2px solid #14b8a6" : isCurrent ? "2px solid #f59e0b" : "1px solid var(--color-border)",
                                                                color: isDone ? "#14b8a6" : isCurrent ? "#f59e0b" : "var(--color-text-dim)",
                                                            }}>
                                                                {isDone ? "✓" : stage.icon}
                                                            </div>
                                                            {si < stages.length - 1 && (
                                                                <div style={{ width: "2px", flex: 1, minHeight: "24px", background: isDone ? "#14b8a6" : "var(--color-border)", margin: "4px 0" }} />
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div style={{ paddingBottom: si < stages.length - 1 ? "20px" : 0, flex: 1, paddingTop: "4px" }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                                                                <span style={{ fontWeight: 600, fontSize: "0.95rem", color: isDone ? "var(--color-text-muted)" : isCurrent ? "#f59e0b" : "var(--color-text-main)", textDecoration: isDone ? "line-through" : "none" }}>
                                                                    {stage.label}
                                                                </span>
                                                                {isCurrent && (
                                                                    <span style={{ fontSize: "0.7rem", background: "rgba(245,158,11,0.15)", color: "#f59e0b", padding: "4px 10px", borderRadius: "999px", fontWeight: 700, letterSpacing: "0.5px" }}>
                                                                        ← CURRENT STAGE
                                                                    </span>
                                                                )}
                                                                {isUpcoming && daysUntil > 0 && (
                                                                    <span style={{ fontSize: "0.7rem", background: "var(--color-bg-main)", color: "var(--color-text-dim)", padding: "4px 10px", borderRadius: "999px", border: "1px solid var(--color-border)" }}>
                                                                        in {daysUntil} days
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Action Items (only for current) */}
                                                            {isCurrent && (
                                                                <div style={{
                                                                    background: "rgba(245,158,11,0.05)", border: "1px dashed rgba(245,158,11,0.3)",
                                                                    borderRadius: "8px", padding: "14px", marginTop: "12px"
                                                                }}>
                                                                    <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#f59e0b", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Action Items:</p>
                                                                    <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--color-text-muted)", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                                                                        {stage.tasks.map((task, ti) => (
                                                                            <li key={ti}>{task}</li>
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
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
