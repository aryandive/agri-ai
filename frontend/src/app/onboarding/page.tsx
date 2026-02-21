"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const soilTypes = [
    { id: "black", name: "Black Soil", image: "/soils/black.png.png" },
    { id: "alluvial", name: "Alluvial Soil", image: "/soils/alluvial.png.png" },
    { id: "red", name: "Red / Yellow Soil", image: "/soils/red.png.png" },
    { id: "laterite", name: "Laterite Soil", image: "/soils/laterite.png.png" },
    { id: "arid", name: "Arid / Desert", image: "/soils/arid.png.png" },
    { id: "mountain", name: "Mountain / Forest", image: "/soils/mountain.png.png" },
];

export default function OnboardingPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [landArea, setLandArea] = useState("");
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locLoading, setLocLoading] = useState(false);
    const [soil, setSoil] = useState("");
    const [crops, setCrops] = useState<{ crop: string; planted_date: string }[]>([]);
    const [currentCrop, setCurrentCrop] = useState("");
    const [currentDate, setCurrentDate] = useState("");

    const [submitting, setSubmitting] = useState(false);

    if (!isLoaded) return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;
    if (!user) {
        router.push("/sign-in");
        return null;
    }

    const handleGetLocation = () => {
        setLocLoading(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLocLoading(false);
                },
                () => {
                    alert("Failed to get location. Make sure permissions are enabled.");
                    setLocLoading(false);
                }
            );
        } else {
            alert("Geolocation is not supported by your browser");
            setLocLoading(false);
        }
    };

    const addCrop = () => {
        if (currentCrop && currentDate) {
            setCrops([...crops, { crop: currentCrop, planted_date: currentDate }]);
            setCurrentCrop("");
            setCurrentDate("");
        }
    };

    const removeCrop = (index: number) => {
        setCrops(crops.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!landArea || !soil) return;

        setSubmitting(true);
        try {
            const resp = await fetch(`${API_BASE}/api/users/profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clerk_id: user.id,
                    name: user.fullName || user.firstName || "Farmer",
                    land_area_acres: parseFloat(landArea),
                    soil_type: soil,
                    location_lat: location?.lat || null,
                    location_lng: location?.lng || null,
                    crops: crops,
                }),
            });

            if (resp.ok) {
                router.push("/dashboard");
            } else {
                alert("Failed to save profile. Please try again.");
            }
        } catch (e) {
            console.error(e);
            alert("Error connecting to server.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <div className="animate-fade-in-up" style={{ marginBottom: "32px", textAlign: "center" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit, sans-serif", marginBottom: "8px" }}>
                    <span className="gradient-text">Welcome to Agri AI</span>
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                    Let's set up your personalized farm profile to get custom insights.
                </p>
            </div>

            <div className="glass-card animate-fade-in-up animate-delay-1" style={{ padding: "32px", opacity: 0 }}>

                {/* Step 1: Land Area & Location */}
                {step === 1 && (
                    <div>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px" }}>Step 1: Your Farm Setup</h2>

                        <div style={{ marginBottom: "24px" }}>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px" }}>
                                Total Land Area (Acres)
                            </label>
                            <input
                                type="number"
                                className="input-field"
                                placeholder="e.g. 5"
                                value={landArea}
                                onChange={(e) => setLandArea(e.target.value)}
                                min="0.1"
                                step="0.1"
                            />
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px" }}>
                                Farm Location (For Weather/Market data)
                            </label>
                            {location ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px", background: "rgba(20, 184, 166, 0.1)", borderRadius: "12px", border: "1px solid rgba(20, 184, 166, 0.3)", color: "var(--color-text-main)" }}>
                                    📍 Saved: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleGetLocation}
                                    disabled={locLoading}
                                    style={{ width: "100%", padding: "12px", display: "flex", justifyContent: "center", gap: "8px" }}
                                >
                                    {locLoading ? "Locating..." : "📍 Auto-Detect My Location"}
                                </button>
                            )}
                        </div>

                        <button
                            className="btn-primary"
                            style={{ width: "100%" }}
                            onClick={() => setStep(2)}
                            disabled={!landArea}
                        >
                            Next Step →
                        </button>
                    </div>
                )}

                {/* Step 2: Soil Type */}
                {step === 2 && (
                    <div>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px" }}>Step 2: Soil Type</h2>
                        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "16px" }}>
                            Select the option that best matches your farm's soil.
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "32px" }}>
                            {soilTypes.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => setSoil(s.id)}
                                    style={{
                                        borderRadius: "12px",
                                        border: soil === s.id ? "2px solid #14b8a6" : "1px solid var(--color-border)",
                                        background: soil === s.id ? "rgba(20, 184, 166, 0.1)" : "var(--color-bg-secondary)",
                                        cursor: "pointer",
                                        textAlign: "center",
                                        overflow: "hidden",
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <div style={{ width: "100%", height: "90px", overflow: "hidden" }}>
                                        <img
                                            src={s.image}
                                            alt={s.name}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block",
                                                filter: soil === s.id ? "brightness(1.1)" : "brightness(0.8)",
                                                transition: "filter 0.2s ease",
                                            }}
                                        />
                                    </div>
                                    <p style={{ fontWeight: 600, fontSize: "0.85rem", padding: "8px 4px", color: soil === s.id ? "#14b8a6" : "var(--color-text-main)" }}>
                                        {s.name}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>
                                ← Back
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => setStep(3)}
                                disabled={!soil}
                                style={{ flex: 2 }}
                            >
                                Next Step →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Current Crops */}
                {step === 3 && (
                    <div>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px" }}>Step 3: Current Crops</h2>
                        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "16px" }}>
                            What have you already planted? Add the plantation date so we can track growth stages.
                        </p>

                        {crops.length > 0 && (
                            <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                {crops.map((c, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--color-bg-secondary)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                                        <div>
                                            <p style={{ fontWeight: 600, color: "var(--color-text-main)" }}>🌾 {c.crop}</p>
                                            <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>Planted: {c.planted_date}</p>
                                        </div>
                                        <button onClick={() => removeCrop(i)} style={{ background: "transparent", border: "none", color: "var(--color-danger)", cursor: "pointer", fontWeight: 600, padding: "8px" }}>
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>Crop Name</label>
                                <select
                                    className="input-field"
                                    value={currentCrop}
                                    onChange={e => setCurrentCrop(e.target.value)}
                                    style={{ width: "100%", cursor: "pointer" }}
                                >
                                    <option value="">— Select a crop —</option>
                                    <optgroup label="Cereals">
                                        <option value="Wheat">Wheat</option>
                                        <option value="Rice">Rice (Paddy)</option>
                                        <option value="Maize">Maize (Corn)</option>
                                        <option value="Barley">Barley</option>
                                        <option value="Sorghum">Sorghum (Jowar)</option>
                                        <option value="Pearl Millet">Pearl Millet (Bajra)</option>
                                        <option value="Finger Millet">Finger Millet (Ragi)</option>
                                    </optgroup>
                                    <optgroup label="Pulses">
                                        <option value="Chickpea">Chickpea (Chana)</option>
                                        <option value="Lentil">Lentil (Masoor)</option>
                                        <option value="Pigeon Pea">Pigeon Pea (Tur/Arhar)</option>
                                        <option value="Mung Bean">Mung Bean (Moong)</option>
                                        <option value="Black Gram">Black Gram (Urad)</option>
                                        <option value="Kidney Bean">Kidney Bean (Rajma)</option>
                                    </optgroup>
                                    <optgroup label="Oilseeds">
                                        <option value="Mustard">Mustard</option>
                                        <option value="Groundnut">Groundnut</option>
                                        <option value="Soybean">Soybean</option>
                                        <option value="Sunflower">Sunflower</option>
                                        <option value="Sesame">Sesame (Til)</option>
                                        <option value="Castor">Castor</option>
                                    </optgroup>
                                    <optgroup label="Cash Crops">
                                        <option value="Cotton">Cotton</option>
                                        <option value="Sugarcane">Sugarcane</option>
                                        <option value="Jute">Jute</option>
                                        <option value="Tobacco">Tobacco</option>
                                    </optgroup>
                                    <optgroup label="Vegetables">
                                        <option value="Tomato">Tomato</option>
                                        <option value="Potato">Potato</option>
                                        <option value="Onion">Onion</option>
                                        <option value="Brinjal">Brinjal</option>
                                        <option value="Cabbage">Cabbage</option>
                                        <option value="Cauliflower">Cauliflower</option>
                                        <option value="Chilli">Chilli / Green Pepper</option>
                                        <option value="Okra">Okra (Bhindi)</option>
                                        <option value="Pea">Pea</option>
                                        <option value="Spinach">Spinach</option>
                                    </optgroup>
                                    <optgroup label="Fruits">
                                        <option value="Mango">Mango</option>
                                        <option value="Banana">Banana</option>
                                        <option value="Grapes">Grapes</option>
                                        <option value="Pomegranate">Pomegranate</option>
                                        <option value="Papaya">Papaya</option>
                                        <option value="Guava">Guava</option>
                                    </optgroup>
                                    <optgroup label="Spices">
                                        <option value="Turmeric">Turmeric</option>
                                        <option value="Ginger">Ginger</option>
                                        <option value="Garlic">Garlic</option>
                                        <option value="Coriander">Coriander</option>
                                        <option value="Cumin">Cumin</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>Plantation Date</label>
                                <input type="date" className="input-field" value={currentDate} onChange={e => setCurrentDate(e.target.value)} />
                            </div>
                        </div>

                        <button type="button" onClick={addCrop} disabled={!currentCrop || !currentDate} style={{ width: "100%", padding: "10px", background: "var(--color-bg-secondary)", border: "1px dashed var(--color-border)", borderRadius: "8px", color: "var(--color-text-main)", fontWeight: 600, cursor: "pointer", marginBottom: "32px" }}>
                            + Add Crop
                        </button>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button className="btn-secondary" onClick={() => setStep(2)} disabled={submitting} style={{ flex: 1 }}>
                                ← Back
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSubmit}
                                disabled={submitting}
                                style={{ flex: 2 }}
                            >
                                {submitting ? "Saving..." : "Save My Profile ✨"}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
