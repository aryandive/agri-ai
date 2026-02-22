"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- Types ---
interface CropInput {
    crop: string;
    planted_date: string;
    soil_type?: string;
}

interface UserProfile {
    clerk_id: string;
    name: string;
    land_area_acres: number;
    soil_type: string;
    location_lat: number;
    location_lng: number;
    crops: CropInput[];
}

interface OrderItem {
    name: string;
    qty: number;
}

interface PastOrder {
    id: string;
    date: string;
    total: number;
    items: OrderItem[];
}

export default function ProfilePage() {
    const { t } = useLanguage();
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const tabs = [t.profile.personalInfo, t.profile.farmInfo, t.profile.orders, t.profile.settings];
    const soilTypes = [
        { id: "black", name: "Black Soil" },
        { id: "alluvial", name: "Alluvial Soil" },
        { id: "red", name: "Red / Yellow Soil" },
        { id: "laterite", name: "Laterite Soil" },
        { id: "arid", name: "Arid / Desert" },
        { id: "mountain", name: "Mountain / Forest" },
    ];
    // Helper to get translated soil name
    const getSoilName = (id: string) => {
        // In a real app, these names would also be in translations.ts
        // For now, I'll use the IDs to match or just keep it simple.
        // Actually, let's just use the hardcoded names for now and translate the labels if needed.
        // Wait, I should probably add soil types to translations.ts too for full coverage.
        // Let's stick to the current plan and use what's in translations.ts.
        switch (id) {
            case "black": return "Black Soil";
            case "alluvial": return "Alluvial Soil";
            case "red": return "Red / Yellow Soil";
            case "laterite": return "Laterite Soil";
            case "arid": return "Arid / Desert";
            case "mountain": return "Mountain / Forest";
            default: return id;
        }
    };

    const [activeTab, setActiveTab] = useState(t.profile.personalInfo);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    // Form states (populated from profile)
    const [name, setName] = useState("");
    const [landArea, setLandArea] = useState<number | "">("");
    const [soilType, setSoilType] = useState("");
    const [crops, setCrops] = useState<CropInput[]>([]);

    // Crop inputs for adding new crop
    const [newCropName, setNewCropName] = useState("");
    const [newCropDate, setNewCropDate] = useState("");
    const [newCropSoil, setNewCropSoil] = useState("");

    // Orders state
    const [orders, setOrders] = useState<PastOrder[]>([]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const storedOrders = JSON.parse(localStorage.getItem("agri_orders") || "[]");
                setOrders(storedOrders);
            } catch (e) {
                console.error(e);
            }
        }
    }, [activeTab]);

    useEffect(() => {
        if (isLoaded && !user) {
            router.push("/sign-in");
        } else if (isLoaded && user) {
            fetchProfile();
        }
    }, [isLoaded, user]);

    const fetchProfile = async () => {
        try {
            const resp = await fetch(`${API_BASE}/api/users/profile/${user?.id}`);
            if (resp.ok) {
                const data = await resp.json();
                setProfile(data);
                setName(data.name || "");
                setLandArea(data.land_area_acres || "");
                setSoilType(data.soil_type || "");
                setCrops(data.crops || []);
            } else {
                console.error("Profile not found or error");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setSaveMessage("");

        const payload = {
            clerk_id: user.id,
            name,
            land_area_acres: landArea === "" ? null : Number(landArea),
            soil_type: soilType,
            location_lat: profile?.location_lat, // preserve existing
            location_lng: profile?.location_lng, // preserve existing
            crops: crops
        };

        try {
            const resp = await fetch(`${API_BASE}/api/users/profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (resp.ok) {
                setSaveMessage(t.profile.saveSuccess);
                setTimeout(() => setSaveMessage(""), 3000);
            } else {
                setSaveMessage(t.profile.saveFailed);
            }
        } catch (e) {
            console.error(e);
            setSaveMessage(t.profile.networkError);
        } finally {
            setSaving(false);
        }
    };

    const addCrop = () => {
        if (!newCropName || !newCropDate) return;
        setCrops([...crops, { crop: newCropName, planted_date: newCropDate, soil_type: newCropSoil || soilType }]);
        setNewCropName("");
        setNewCropDate("");
        setNewCropSoil("");
    };

    const removeCrop = (index: number) => {
        setCrops(crops.filter((_, i) => i !== index));
    };

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>{t.common.loading}...</div>;

    return (
        <div style={{ maxWidth: "1000px" }}>
            <div className="animate-fade-in-up" style={{ marginBottom: "32px" }}>
                <p style={{ color: "var(--color-primary-light)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    ⚙️ {t.profile.subTitle}
                </p>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit, sans-serif" }}>
                    <span className="gradient-text">{t.profile.title}</span>
                </h1>
            </div>

            <div style={{ display: "flex", gap: "24px", flexDirection: "row", alignItems: "flex-start" }} className="profile-layout">
                {/* Left Sidebar Tabs */}
                <div className="glass-card animate-fade-in-up animate-delay-1" style={{ width: "240px", padding: "16px", flexShrink: 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: "12px 16px",
                                    textAlign: "left",
                                    background: activeTab === tab ? "rgba(34, 197, 94, 0.15)" : "transparent",
                                    color: activeTab === tab ? "var(--color-primary-light)" : "var(--color-text-muted)",
                                    border: "none",
                                    borderLeft: activeTab === tab ? "3px solid var(--color-primary)" : "3px solid transparent",
                                    borderRadius: "0 8px 8px 0",
                                    cursor: "pointer",
                                    fontWeight: activeTab === tab ? 700 : 500,
                                    fontSize: "0.95rem",
                                    transition: "all 0.2s"
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="glass-card animate-fade-in-up animate-delay-2" style={{ flex: 1, padding: "32px", minHeight: "500px" }}>

                    {/* --- PERSONAL INFO TAB --- */}
                    {activeTab === t.profile.personalInfo && (
                        <div>
                            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "24px" }}>👤 {t.profile.personalTitle}</h2>

                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "400px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px" }}>{t.profile.fullName}</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        style={{ width: "100%" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px" }}>{t.profile.email}</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        value={user?.primaryEmailAddress?.emailAddress || ""}
                                        disabled
                                        style={{ width: "100%", opacity: 0.6, cursor: "not-allowed" }}
                                    />
                                    <p style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", marginTop: "4px" }}>{t.profile.clerkAuth}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- FARM INFO TAB --- */}
                    {activeTab === t.profile.farmInfo && (
                        <div>
                            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "24px" }}>🚜 {t.profile.farmTitle}</h2>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px" }}>{t.profile.landArea}</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={landArea}
                                        onChange={e => setLandArea(e.target.value === "" ? "" : Number(e.target.value))}
                                        style={{ width: "100%" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px" }}>{t.profile.soilType}</label>
                                    <select
                                        className="input-field"
                                        value={soilType}
                                        onChange={e => setSoilType(e.target.value)}
                                        style={{ width: "100%" }}
                                    >
                                        <option value="">{t.profile.selectSoil}</option>
                                        {soilTypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", paddingTop: "24px", borderTop: "1px solid var(--color-border)" }}>🌱 {t.profile.manageCrops}</h3>

                            {/* Existing Crops */}
                            {crops.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                                    {crops.map((c, i) => (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--color-bg-secondary)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                                            <div>
                                                <p style={{ fontWeight: 600, color: "var(--color-text-main)" }}>🌾 {c.crop}</p>
                                                <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
                                                    {t.profile.plantedOn.replace("{date}", c.planted_date)} {c.soil_type && `• ${t.profile.soil}: ${getSoilName(c.soil_type)}`}
                                                </p>
                                            </div>
                                            <button onClick={() => removeCrop(i)} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", color: "#ef4444", cursor: "pointer", fontWeight: 600, padding: "6px 12px", fontSize: "0.8rem" }}>
                                                {t.profile.remove}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add New Crop Form */}
                            <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "8px", border: "1px dashed var(--color-border)" }}>
                                <p style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "12px", color: "var(--color-text-muted)" }}>+ {t.profile.addCrop}</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "12px", alignItems: "end" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", marginBottom: "4px" }}>{t.profile.cropName}</label>
                                        <select
                                            className="input-field"
                                            value={newCropName}
                                            onChange={e => setNewCropName(e.target.value)}
                                            style={{ width: "100%", padding: "10px", fontSize: "0.85rem" }}
                                        >
                                            <option value="">{t.profile.selectCrop}</option>
                                            <option value="Wheat">Wheat</option>
                                            <option value="Rice">Rice (Paddy)</option>
                                            <option value="Cotton">Cotton</option>
                                            <option value="Sugarcane">Sugarcane</option>
                                            <option value="Soybean">Soybean</option>
                                            <option value="Maize">Maize (Corn)</option>
                                            <option value="Tomato">Tomato</option>
                                            <option value="Potato">Potato</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", marginBottom: "4px" }}>{t.profile.plantationDate}</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            value={newCropDate}
                                            onChange={e => setNewCropDate(e.target.value)}
                                            style={{ width: "100%", padding: "10px", fontSize: "0.85rem" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", marginBottom: "4px" }}>{t.profile.soilType}</label>
                                        <select
                                            className="input-field"
                                            value={newCropSoil}
                                            onChange={e => setNewCropSoil(e.target.value)}
                                            style={{ width: "100%", padding: "10px", fontSize: "0.85rem" }}
                                        >
                                            <option value="">— {t.common.default} —</option>
                                            {soilTypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        onClick={addCrop}
                                        disabled={!newCropName || !newCropDate}
                                        style={{ padding: "10px 16px", background: "var(--color-primary)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: (!newCropName || !newCropDate) ? 0.5 : 1 }}
                                    >
                                        {t.profile.add}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- ORDERS TAB --- */}
                    {activeTab === t.profile.orders && (
                        <div>
                            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "24px" }}>📦 {t.profile.ordersTitle}</h2>

                            {orders.length === 0 ? (
                                <div style={{ padding: "40px", textAlign: "center", background: "var(--color-bg-secondary)", borderRadius: "12px", border: "1px dashed var(--color-border)" }}>
                                    <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🛒</p>
                                    <p style={{ fontWeight: 600, color: "var(--color-text-main)", fontSize: "1.1rem" }}>{t.profile.noOrders}</p>
                                    <p style={{ color: "var(--color-text-dim)", fontSize: "0.85rem", marginTop: "8px" }}>{t.profile.noOrdersDesc}</p>
                                    <button onClick={() => router.push("/marketplace")} className="btn-primary" style={{ marginTop: "20px", padding: "10px 24px" }}>{t.profile.browseMarket}</button>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {orders.map(order => (
                                        <div key={order.id} style={{
                                            background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)",
                                            borderRadius: "12px", padding: "20px"
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--color-border)" }}>
                                                <div>
                                                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>{t.profile.orderId}</p>
                                                    <p style={{ fontWeight: 700, fontFamily: "Outfit, sans-serif", letterSpacing: "1px" }}>#{order.id}</p>
                                                </div>
                                                <div style={{ textAlign: "right" }}>
                                                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>{t.profile.orderDate}</p>
                                                    <p style={{ fontWeight: 600 }}>{order.date}</p>
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: "16px" }}>
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.9rem" }}>
                                                        <span style={{ color: "var(--color-text-main)" }}>{item.qty}x {item.name}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px solid var(--color-border)" }}>
                                                <span style={{ fontWeight: 600, color: "var(--color-text-muted)", fontSize: "0.9rem" }}>{t.profile.total}</span>
                                                <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--color-primary-light)" }}>₹{order.total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- SETTINGS TAB --- */}
                    {activeTab === t.profile.settings && (
                        <div>
                            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "24px" }}>⚙️ {t.profile.settingsTitle}</h2>

                            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "8px" }}>{t.profile.appLanguage}</label>
                                    <select className="input-field" style={{ width: "250px" }}>
                                        <option value="en">English</option>
                                        <option value="hi">Hindi (हिंदी)</option>
                                        <option value="mr">Marathi (मराठी)</option>
                                        <option value="te">Telugu (తెలుగు)</option>
                                    </select>
                                </div>

                                <div>
                                    <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "12px" }}>{t.profile.notifications}</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                            <input type="checkbox" defaultChecked style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }} />
                                            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{t.profile.weatherAlerts}</span>
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                            <input type="checkbox" defaultChecked style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }} />
                                            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{t.profile.diseaseWarnings}</span>
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                            <input type="checkbox" style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }} />
                                            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{t.profile.mandiDrops}</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Shared Save Button for Personal & Farm Info */}
                    {(activeTab === t.profile.personalInfo || activeTab === t.profile.farmInfo) && (
                        <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "16px" }}>
                            <button
                                onClick={handleSave}
                                className="btn-primary"
                                disabled={saving}
                                style={{ padding: "12px 32px", fontSize: "1rem" }}
                            >
                                {saving ? t.common.saving : t.profile.saveChanges}
                            </button>
                            {saveMessage && (
                                <span className="animate-fade-in-up" style={{ color: saveMessage.includes("✅") ? "#22c55e" : "#ef4444", fontWeight: 600, fontSize: "0.9rem" }}>
                                    {saveMessage}
                                </span>
                            )}
                        </div>
                    )}

                </div>
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    .profile-layout {
                        flex-direction: column !important;
                    }
                    .profile-layout > div:first-child {
                        width: 100% !important;
                    }
                }
            `}</style>
        </div>
    );
}
