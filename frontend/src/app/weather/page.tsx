"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useUser } from "@clerk/nextjs";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar,
} from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface WeatherCurrent {
    temperature: number;
    feels_like: number;
    humidity: number;
    description: string;
    icon: string;
    wind_speed: number;
    city: string;
    pressure?: number;
    visibility?: number;
    sunrise?: string;
    sunset?: string;
    clouds?: number;
}

interface HourlyForecast {
    time: string;
    temperature: number;
    description: string;
    icon: string;
    humidity: number;
    wind_speed: number;
    rain_probability: number;
}

interface ForecastDay {
    date: string;
    temperature_min: number;
    temperature_max: number;
    description: string;
    icon: string;
    rain_probability?: number;
    humidity?: number;
}

interface WeatherAlert {
    type: string;
    severity: string;
    message: string;
    action: string;
}

interface CropImpactItem {
    type: string;
    icon: string;
    title: string;
    message: string;
    action: string;
}

interface CropImpact {
    crop: string;
    stage: string;
    day: number;
    total_days: number;
    days_to_next: number;
    next_stage: string;
    overall: string;
    summary: string;
    impacts: CropImpactItem[];
}

interface AgriAdvisory {
    alerts: WeatherAlert[];
    crop_impacts: CropImpact[];
}

interface WeatherData {
    current: WeatherCurrent;
    forecast: ForecastDay[];
    hourly: HourlyForecast[];
    advisory?: AgriAdvisory;
}

const weatherIconUrl = (icon: string) =>
    `https://openweathermap.org/img/wn/${icon}@2x.png`;

const sevColors: Record<string, { bg: string; border: string; text: string }> = {
    danger: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.4)", text: "#ef4444" },
    warning: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.4)", text: "#f59e0b" },
    info: { bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.4)", text: "#3b82f6" },
    good: { bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.4)", text: "#22c55e" },
    caution: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.4)", text: "#f59e0b" },
};

const overallColors: Record<string, { bg: string; border: string; text: string; emoji: string }> = {
    good: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.5)", text: "#22c55e", emoji: "✅" },
    caution: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.5)", text: "#f59e0b", emoji: "⚡" },
    danger: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.5)", text: "#ef4444", emoji: "⚠️" },
};

export default function WeatherPage() {
    const { user } = useUser();
    const [city, setCity] = useState("");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<WeatherData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [geoLoading, setGeoLoading] = useState(false);

    // Auto-detect location on mount
    useEffect(() => {
        if ("geolocation" in navigator) {
            setGeoLoading(true);
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    try {
                        const resp = await fetch(
                            `https://api.openweathermap.org/geo/1.0/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&limit=1&appid=${process.env.NEXT_PUBLIC_OW_KEY || "9d373ac68940eb3da83810bc662103c5"}`
                        );
                        const geo = await resp.json();
                        if (geo?.[0]?.name) {
                            setCity(geo[0].name);
                            fetchWeather(geo[0].name);
                        }
                    } catch { /* ignore */ }
                    setGeoLoading(false);
                },
                () => setGeoLoading(false),
                { timeout: 5000 }
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchWeather = async (cityName: string) => {
        setLoading(true);
        setError(null);
        try {
            const url = `${API_BASE}/api/weather?city=${encodeURIComponent(cityName.trim())}${user ? `&clerk_id=${user.id}` : ""}`;
            const resp = await fetch(url);
            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                throw new Error(errData.detail || `Server error (${resp.status})`);
            }
            setData(await resp.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch weather.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        if (city.trim()) fetchWeather(city.trim());
    };

    return (
        <div style={{ maxWidth: "1000px" }}>
            {/* Header */}
            <div className="animate-fade-in-up" style={{ marginBottom: "32px" }}>
                <p style={{ color: "var(--color-info)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    🌤️ Smart Weather
                </p>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit, sans-serif", marginBottom: "8px" }}>
                    <span className="gradient-text">Weather & Crop Advisory</span>
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                    Real-time weather with AI-powered farming advisories for your crops.
                </p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="animate-fade-in-up animate-delay-1" style={{ opacity: 0, display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                <input
                    type="text"
                    className="input-field"
                    placeholder={geoLoading ? "Detecting your location..." : "Enter city name — e.g. Delhi, Jaipur..."}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ flex: 1, minWidth: "200px" }}
                    id="weather-city-input"
                />
                <button type="submit" className="btn-primary" disabled={loading || !city.trim()}>
                    {loading ? (
                        <><span className="spinner" style={{ width: "18px", height: "18px", borderWidth: "2px" }}></span> Searching...</>
                    ) : "🔍 Search"}
                </button>
            </form>

            {/* Quick Cities */}
            {!data && !loading && (
                <div className="animate-fade-in-up animate-delay-2" style={{ opacity: 0, display: "flex", justifyContent: "center", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
                    {["Delhi", "Mumbai", "Jaipur", "Bangalore", "Lucknow", "Chandigarh"].map((c) => (
                        <button
                            key={c}
                            onClick={() => { setCity(c); fetchWeather(c); }}
                            style={{
                                background: "var(--color-bg-card)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "999px",
                                padding: "6px 16px",
                                color: "var(--color-text-muted)",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                            }}
                        >{c}</button>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="glass-card" style={{ padding: "16px 20px", borderColor: "var(--color-danger)", marginBottom: "24px" }}>
                    <p style={{ color: "var(--color-danger)", fontWeight: 600 }}>⚠️ {error}</p>
                </div>
            )}

            {data && (
                <div className="animate-fade-in-up" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                    {/* === CURRENT WEATHER CARD === */}
                    <div className="glass-card" style={{ padding: "28px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
                            <div>
                                <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)", marginBottom: "4px" }}>Current Weather</p>
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "4px" }}>📍 {data.current.city}</h2>
                                <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>{data.current.description}</p>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={weatherIconUrl(data.current.icon)} alt={data.current.description} style={{ width: "80px", height: "80px" }} />
                                <p style={{ fontSize: "2.5rem", fontWeight: 800, fontFamily: "Outfit, sans-serif", color: "var(--color-text-main)" }}>
                                    {data.current.temperature.toFixed(1)}°C
                                </p>
                            </div>
                        </div>

                        {/* Extended detail grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "10px", marginTop: "20px" }}>
                            {[
                                { label: "Feels Like", value: `${data.current.feels_like.toFixed(1)}°C`, emoji: "🌡️" },
                                { label: "Humidity", value: `${data.current.humidity}%`, emoji: "💧" },
                                { label: "Wind", value: `${data.current.wind_speed} m/s`, emoji: "💨" },
                                { label: "Pressure", value: data.current.pressure ? `${data.current.pressure} hPa` : "–", emoji: "🔵" },
                                { label: "Visibility", value: data.current.visibility ? `${(data.current.visibility / 1000).toFixed(1)} km` : "–", emoji: "👁️" },
                                { label: "Clouds", value: data.current.clouds != null ? `${data.current.clouds}%` : "–", emoji: "☁️" },
                                { label: "Sunrise", value: data.current.sunrise || "–", emoji: "🌅" },
                                { label: "Sunset", value: data.current.sunset || "–", emoji: "🌇" },
                            ].map((item) => (
                                <div key={item.label} style={{
                                    background: "var(--color-bg-secondary)",
                                    borderRadius: "12px",
                                    padding: "14px",
                                    textAlign: "center",
                                    border: "1px solid var(--color-border)",
                                }}>
                                    <p style={{ fontSize: "1.1rem", marginBottom: "4px" }}>{item.emoji}</p>
                                    <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-text-main)" }}>{item.value}</p>
                                    <p style={{ fontSize: "0.7rem", color: "var(--color-text-dim)" }}>{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* === AGRICULTURE ALERTS === */}
                    {data.advisory && data.advisory.alerts.length > 0 && (
                        <div className="glass-card" style={{ padding: "24px" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "14px" }}>🌾 Agriculture Alerts</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {data.advisory.alerts.map((alert, i) => {
                                    const c = sevColors[alert.severity] || sevColors.info;
                                    return (
                                        <div key={i} style={{
                                            background: c.bg, border: `1px solid ${c.border}`,
                                            borderRadius: "12px", padding: "14px",
                                        }}>
                                            <p style={{ fontWeight: 600, color: c.text, fontSize: "0.9rem", marginBottom: "4px" }}>
                                                {alert.message}
                                            </p>
                                            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                                                👉 {alert.action}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* === CROP IMPACT ANALYSIS === */}
                    {data.advisory && data.advisory.crop_impacts.length > 0 && (
                        <div className="glass-card" style={{ padding: "24px" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "14px" }}>
                                🌱 Is This Weather Good For Your Crops?
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {data.advisory.crop_impacts.map((ci) => {
                                    const oc = overallColors[ci.overall] || overallColors.good;
                                    const progress = Math.min(100, Math.round((ci.day / ci.total_days) * 100));
                                    return (
                                        <div key={ci.crop} style={{
                                            background: oc.bg, border: `1px solid ${oc.border}`,
                                            borderRadius: "16px", padding: "20px",
                                        }}>
                                            {/* Crop header */}
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                                                <div>
                                                    <h4 style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--color-text-main)" }}>
                                                        {oc.emoji} {ci.crop}
                                                    </h4>
                                                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                                                        Stage: <strong>{ci.stage}</strong> • Day {ci.day}/{ci.total_days}
                                                    </p>
                                                </div>
                                                <span style={{
                                                    padding: "4px 14px",
                                                    borderRadius: "999px",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 700,
                                                    color: oc.text,
                                                    background: oc.bg,
                                                    border: `1px solid ${oc.border}`,
                                                    textTransform: "uppercase",
                                                }}>
                                                    {ci.overall}
                                                </span>
                                            </div>

                                            {/* Progress bar */}
                                            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "999px", height: "8px", marginBottom: "10px", overflow: "hidden" }}>
                                                <div style={{
                                                    width: `${progress}%`,
                                                    height: "100%",
                                                    borderRadius: "999px",
                                                    background: `linear-gradient(90deg, ${oc.text}, ${oc.text}aa)`,
                                                    transition: "width 1s ease",
                                                }} />
                                            </div>
                                            <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginBottom: "12px" }}>
                                                {ci.days_to_next} days until <strong>{ci.next_stage}</strong>
                                            </p>

                                            {/* Summary */}
                                            <p style={{ fontWeight: 600, fontSize: "0.9rem", color: oc.text, marginBottom: "12px" }}>
                                                {ci.summary}
                                            </p>

                                            {/* Impact items */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                {ci.impacts.map((imp, j) => {
                                                    const ic = sevColors[imp.type] || sevColors.info;
                                                    return (
                                                        <div key={j} style={{
                                                            background: "rgba(0,0,0,0.15)",
                                                            borderRadius: "10px",
                                                            padding: "10px 14px",
                                                            borderLeft: `3px solid ${ic.text}`,
                                                        }}>
                                                            <p style={{ fontWeight: 600, fontSize: "0.85rem", color: ic.text }}>
                                                                {imp.icon} {imp.title}
                                                            </p>
                                                            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "3px 0" }}>
                                                                {imp.message}
                                                            </p>
                                                            <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
                                                                💡 {imp.action}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* === HOURLY FORECAST === */}
                    {data.hourly.length > 0 && (
                        <div className="glass-card" style={{ padding: "24px" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "14px" }}>🕐 Next 24 Hours</h3>
                            <div style={{ overflowX: "auto" }}>
                                <div style={{ display: "flex", gap: "10px", minWidth: "max-content" }}>
                                    {data.hourly.map((h, i) => (
                                        <div key={i} style={{
                                            background: "var(--color-bg-secondary)",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "12px",
                                            padding: "12px 14px",
                                            textAlign: "center",
                                            minWidth: "90px",
                                        }}>
                                            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-dim)", marginBottom: "4px" }}>{h.time}</p>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={weatherIconUrl(h.icon)} alt={h.description} style={{ width: "40px", height: "40px", margin: "0 auto" }} />
                                            <p style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text-main)" }}>{h.temperature.toFixed(0)}°</p>
                                            <p style={{ fontSize: "0.7rem", color: "var(--color-text-dim)" }}>{h.humidity}% 💧</p>
                                            {h.rain_probability > 0 && (
                                                <p style={{ fontSize: "0.7rem", color: "#3b82f6", fontWeight: 600 }}>🌧 {h.rain_probability}%</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* === TEMPERATURE CHART === */}
                    {data.forecast.length > 0 && (
                        <div className="glass-card" style={{ padding: "24px" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>📊 5-Day Temperature Trend</h3>
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={data.forecast.map((f) => ({ name: f.date, min: f.temperature_min, max: f.temperature_max }))}>
                                    <defs>
                                        <linearGradient id="tempMin" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="tempMax" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                                    <YAxis stroke="#6b7280" fontSize={11} tickFormatter={(v: number) => `${v}°`} />
                                    <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(45,90,54,0.4)", borderRadius: "10px", color: "#e2e8f0", fontSize: "0.85rem" }} />
                                    <Area type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={2} fill="url(#tempMax)" name="Max °C" dot={{ r: 3, fill: "#ef4444" }} />
                                    <Area type="monotone" dataKey="min" stroke="#3b82f6" strokeWidth={2} fill="url(#tempMin)" name="Min °C" dot={{ r: 3, fill: "#3b82f6" }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* === RAIN PROBABILITY CHART === */}
                    {data.forecast.some((f) => f.rain_probability && f.rain_probability > 0) && (
                        <div className="glass-card" style={{ padding: "24px" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>🌧️ Rain Probability</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={data.forecast.map((f) => ({ name: f.date, rain: f.rain_probability || 0 }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                                    <YAxis stroke="#6b7280" fontSize={11} tickFormatter={(v: number) => `${v}%`} domain={[0, 100]} />
                                    <Tooltip contentStyle={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(45,90,54,0.4)", borderRadius: "10px", color: "#e2e8f0", fontSize: "0.85rem" }}
                                        formatter={(value: number | string | undefined) => [`${value}%`, "Rain Chance"]} />
                                    <Bar dataKey="rain" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Rain %" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* === 5-DAY FORECAST CARDS === */}
                    {data.forecast.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "14px" }}>📅 5-Day Forecast</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: "12px" }}>
                                {data.forecast.map((day) => (
                                    <div key={day.date} className="weather-card">
                                        <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px" }}>{day.date}</p>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={weatherIconUrl(day.icon)} alt={day.description} style={{ width: "50px", height: "50px", margin: "0 auto" }} />
                                        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "6px 0" }}>{day.description}</p>
                                        <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                                            {day.temperature_min.toFixed(0)}° — {day.temperature_max.toFixed(0)}°
                                        </p>
                                        {day.rain_probability != null && day.rain_probability > 0 && (
                                            <p style={{ fontSize: "0.75rem", color: "#3b82f6", fontWeight: 600, marginTop: "4px" }}>
                                                🌧 {day.rain_probability}% rain
                                            </p>
                                        )}
                                        {day.humidity != null && (
                                            <p style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", marginTop: "2px" }}>
                                                💧 {day.humidity}% humidity
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Placeholder */}
            {!data && !loading && !error && (
                <div className="glass-card animate-fade-in-up animate-delay-2" style={{ opacity: 0, padding: "48px", textAlign: "center" }}>
                    <p style={{ fontSize: "3rem", marginBottom: "12px" }}>🌍</p>
                    <p style={{ color: "var(--color-text-muted)", fontSize: "1rem" }}>
                        Search for a city above to view weather data & crop advisories
                    </p>
                </div>
            )}
        </div>
    );
}
