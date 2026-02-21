"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

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

const TABS = ["Personal Info", "Farm Info", "Orders", "Settings"];

const SOIL_TYPES = [
    { id: "black", name: "Black Soil" },
    { id: "alluvial", name: "Alluvial Soil" },
    { id: "red", name: "Red / Yellow Soil" },
    { id: "laterite", name: "Laterite Soil" },
    { id: "arid", name: "Arid / Desert" },
    { id: "mountain", name: "Mountain / Forest" },
];

export default function ProfilePage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState("Personal Info");
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
                setSaveMessage("✅ Profile updated successfully!");
                setTimeout(() => setSaveMessage(""), 3000);
            } else {
                setSaveMessage("❌ Failed to update profile.");
            }
        } catch (e) {
            console.error(e);
            setSaveMessage("❌ Network error saving profile.");
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

    if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>Loading profile...</div>;

    return (
        <div style={{ maxWidth: "1000px" }}>
            <div className="animate-fade-in-up" style={{ marginBottom: "32px" }}>
                <p style={{ color: "var(--color-primary-light)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    ⚙️ Account Management
                </p>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit, sans-serif" }}>
                    <span className="gradient-text">Your Profile</span>
                </h1>
            </div>

            <div style={{ display: "flex", gap: "24px", flexDirection: "row", alignItems: "flex-start" }} className="profile-layout">
                {/* Left Sidebar Tabs */}
                <div className="glass-card animate-fade-in-up animate-delay-1" style={{ width: "240px", padding: "16px", flexShrink: 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {TABS.map(tab => (
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
                    {activeTab === "Personal Info" && (
                        <div>
                            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "24px" }}>👤 Personal Information</h2>

                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "400px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px" }}>Full Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        style={{ width: "100%" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px" }}>Email Address (readonly)</label>
                                    <input
                                        type="email"
                                        className="input-field"
                                        value={user?.primaryEmailAddress?.emailAddress || ""}
                                        disabled
                                        style={{ width: "100%", opacity: 0.6, cursor: "not-allowed" }}
                                    />
                                    <p style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", marginTop: "4px" }}>Managed by Clerk authentication.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- FARM INFO TAB --- */}
                    {activeTab === "Farm Info" && (
                        <div>
                            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "24px" }}>🚜 Farm Details</h2>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px" }}>Land Area (Acres)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={landArea}
                                        onChange={e => setLandArea(e.target.value)}
                                        style={{ width: "100%" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px" }}>Soil Type</label>
                                    <select
                                        className="input-field"
                                        value={soilType}
                                        onChange={e => setSoilType(e.target.value)}
                                        style={{ width: "100%" }}
                                    >
                                        <option value="">— Select Soil —</option>
                                        {SOIL_TYPES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", paddingTop: "24px", borderTop: "1px solid var(--color-border)" }}>🌱 Manage Crops</h3>

                            {/* Existing Crops */}
                            {crops.length > 0 && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                                    {crops.map((c, i) => (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--color-bg-secondary)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                                            <div>
                                                <p style={{ fontWeight: 600, color: "var(--color-text-main)" }}>🌾 {c.crop}</p>
                                                <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
                                                    Planted: {c.planted_date} {c.soil_type && `• Soil: ${SOIL_TYPES.find(s => s.id === c.soil_type)?.name || c.soil_type}`}
                                                </p>
                                            </div>
                                            <button onClick={() => removeCrop(i)} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", color: "#ef4444", cursor: "pointer", fontWeight: 600, padding: "6px 12px", fontSize: "0.8rem" }}>
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add New Crop Form */}
                            <div style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "8px", border: "1px dashed var(--color-border)" }}>
                                <p style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "12px", color: "var(--color-text-muted)" }}>+ Add Another Crop</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "12px", alignItems: "end" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", marginBottom: "4px" }}>Crop Name</label>
                                        <select
                                            className="input-field"
                                            value={newCropName}
                                            onChange={e => setNewCropName(e.target.value)}
                                            style={{ width: "100%", padding: "10px", fontSize: "0.85rem" }}
                                        >
                                            <option value="">— Select —</option>
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
                                        <label style={{ display: "block", fontSize: "0.7rem", marginBottom: "4px" }}>Plantation Date</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            value={newCropDate}
                                            onChange={e => setNewCropDate(e.target.value)}
                                            style={{ width: "100%", padding: "10px", fontSize: "0.85rem" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.7rem", marginBottom: "4px" }}>Soil Type</label>
                                        <select
                                            className="input-field"
                                            value={newCropSoil}
                                            onChange={e => setNewCropSoil(e.target.value)}
                                            style={{ width: "100%", padding: "10px", fontSize: "0.85rem" }}
                                        >
                                            <option value="">— Default Farm Soil —</option>
                                            {SOIL_TYPES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        onClick={addCrop}
                                        disabled={!newCropName || !newCropDate}
                                        style={{ padding: "10px 16px", background: "var(--color-primary)", color: "white", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", opacity: (!newCropName || !newCropDate) ? 0.5 : 1 }}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- ORDERS TAB --- */}
                    {activeTab === "Orders" && (
                        <div>
                            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "24px" }}>📦 Order History</h2>

                            {orders.length === 0 ? (
                                <div style={{ padding: "40px", textAlign: "center", background: "var(--color-bg-secondary)", borderRadius: "12px", border: "1px dashed var(--color-border)" }}>
                                    <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🛒</p>
                                    <p style={{ fontWeight: 600, color: "var(--color-text-main)", fontSize: "1.1rem" }}>No past orders found.</p>
                                    <p style={{ color: "var(--color-text-dim)", fontSize: "0.85rem", marginTop: "8px" }}>When you place an order in the Marketplace, it will appear here.</p>
                                    <button onClick={() => router.push("/marketplace")} className="btn-primary" style={{ marginTop: "20px", padding: "10px 24px" }}>Browse Marketplace</button>
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
                                                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>ORDER ID</p>
                                                    <p style={{ fontWeight: 700, fontFamily: "Outfit, sans-serif", letterSpacing: "1px" }}>#{order.id}</p>
                                                </div>
                                                <div style={{ textAlign: "right" }}>
                                                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>ORDER DATE</p>
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
                                                <span style={{ fontWeight: 600, color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Total</span>
                                                <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--color-primary-light)" }}>₹{order.total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- SETTINGS TAB --- */}
                    {activeTab === "Settings" && (
                        <div>
                            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "24px" }}>⚙️ Preferences</h2>

                            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "8px" }}>App Language</label>
                                    <select className="input-field" style={{ width: "250px" }}>
                                        <option value="en">English</option>
                                        <option value="hi">Hindi (हिंदी)</option>
                                        <option value="mr">Marathi (मराठी)</option>
                                        <option value="te">Telugu (తెలుగు)</option>
                                    </select>
                                </div>

                                <div>
                                    <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "12px" }}>Notifications</p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                            <input type="checkbox" defaultChecked style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }} />
                                            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Weather & Rain Alerts</span>
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                            <input type="checkbox" defaultChecked style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }} />
                                            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Crop Disease Warnings</span>
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                                            <input type="checkbox" style={{ width: "16px", height: "16px", accentColor: "var(--color-primary)" }} />
                                            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Mandi Price Drops</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Shared Save Button for Personal & Farm Info */}
                    {(activeTab === "Personal Info" || activeTab === "Farm Info") && (
                        <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "16px" }}>
                            <button
                                onClick={handleSave}
                                className="btn-primary"
                                disabled={saving}
                                style={{ padding: "12px 32px", fontSize: "1rem" }}
                            >
                                {saving ? "Saving..." : "Save Changes"}
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
