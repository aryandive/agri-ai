"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

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
    const t = useTranslations("Onboarding");

    const [step, setStep] = useState(1);
    const [landArea, setLandArea] = useState("");
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locLoading, setLocLoading] = useState(false);
    const [soil, setSoil] = useState("");
    const [crops, setCrops] = useState<{ crop: string; planted_date: string }[]>([]);
    const [currentCrop, setCurrentCrop] = useState("");
    const [currentDate, setCurrentDate] = useState("");

    const [submitting, setSubmitting] = useState(false);

    if (!isLoaded) return <div style={{ padding: "40px", textAlign: "center" }}>{t("loading")}</div>;
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
                    alert(t("alertLocationFailed"));
                    setLocLoading(false);
                }
            );
        } else {
            alert(t("alertNoGeolocation"));
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
                alert(t("errorSaveProfile"));
            }
        } catch (e) {
            console.error(e);
            alert(t("errorServer"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <div className="animate-fade-in-up" style={{ marginBottom: "32px", textAlign: "center" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit, sans-serif", marginBottom: "8px" }}>
                    <span className="gradient-text">{t("title")}</span>
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                    {t("subtitle")}
                </p>
            </div>

            <div className="glass-card animate-fade-in-up animate-delay-1" style={{ padding: "32px", opacity: 0 }}>

                {/* Step 1: Land Area & Location */}
                {step === 1 && (
                    <div>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px" }}>{t("step1Title")}</h2>

                        <div style={{ marginBottom: "24px" }}>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px" }}>
                                {t("labelLandArea")}
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
                                {t("labelLocation")}
                            </label>
                            {location ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px", background: "rgba(20, 184, 166, 0.1)", borderRadius: "12px", border: "1px solid rgba(20, 184, 166, 0.3)", color: "var(--color-text-main)" }}>
                                    {t("locationSaved", { lat: location.lat.toFixed(4), lng: location.lng.toFixed(4) })}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleGetLocation}
                                    disabled={locLoading}
                                    style={{ width: "100%", padding: "12px", display: "flex", justifyContent: "center", gap: "8px" }}
                                >
                                    {locLoading ? t("locating") : t("btnDetectLocation")}
                                </button>
                            )}
                        </div>

                        <button
                            className="btn-primary"
                            style={{ width: "100%" }}
                            onClick={() => setStep(2)}
                            disabled={!landArea}
                        >
                            {t("btnNext")}
                        </button>
                    </div>
                )}

                {/* Step 2: Soil Type */}
                {step === 2 && (
                    <div>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px" }}>{t("step2Title")}</h2>
                        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "16px" }}>
                            {t("step2Subtitle")}
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
                                        {t(s.id === "black" ? "soilBlack" : s.id === "alluvial" ? "soilAlluvial" : s.id === "red" ? "soilRed" : s.id === "laterite" ? "soilLaterite" : s.id === "arid" ? "soilArid" : s.id === "mountain" ? "soilMountain" : s.name as any) || s.name}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button className="btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>
                                {t("btnBack")}
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => setStep(3)}
                                disabled={!soil}
                                style={{ flex: 2 }}
                            >
                                {t("btnNext")}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Current Crops */}
                {step === 3 && (
                    <div>
                        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px" }}>{t("step3Title")}</h2>
                        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "16px" }}>
                            {t("step3Subtitle")}
                        </p>

                        {crops.length > 0 && (
                            <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                {crops.map((c, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--color-bg-secondary)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                                        <div>
                                            <p style={{ fontWeight: 600, color: "var(--color-text-main)" }}>🌾 {c.crop}</p>
                                            <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>{t("plantedDate", { date: c.planted_date })}</p>
                                        </div>
                                        <button onClick={() => removeCrop(i)} style={{ background: "transparent", border: "none", color: "var(--color-danger)", cursor: "pointer", fontWeight: 600, padding: "8px" }}>
                                            {t("btnRemove")}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>{t("labelCropName")}</label>
                                <select
                                    className="input-field"
                                    value={currentCrop}
                                    onChange={e => setCurrentCrop(e.target.value)}
                                    style={{ width: "100%", cursor: "pointer" }}
                                >
                                    <option value="">{t("selectCropDefault")}</option>
                                    <optgroup label={t("cropCategories.cereals")}>
                                        <option value="Wheat">{t("crops.wheat")}</option>
                                        <option value="Rice">{t("crops.rice")}</option>
                                        <option value="Maize">{t("crops.maize")}</option>
                                        <option value="Barley">{t("crops.barley")}</option>
                                        <option value="Sorghum">{t("crops.sorghum")}</option>
                                        <option value="Pearl Millet">{t("crops.pearlMillet")}</option>
                                        <option value="Finger Millet">{t("crops.fingerMillet")}</option>
                                    </optgroup>
                                    <optgroup label={t("cropCategories.pulses")}>
                                        <option value="Chickpea">{t("crops.chickpea")}</option>
                                        <option value="Lentil">{t("crops.lentil")}</option>
                                        <option value="Pigeon Pea">{t("crops.pigeonPea")}</option>
                                        <option value="Mung Bean">{t("crops.mungBean")}</option>
                                        <option value="Black Gram">{t("crops.blackGram")}</option>
                                        <option value="Kidney Bean">{t("crops.kidneyBean")}</option>
                                    </optgroup>
                                    <optgroup label={t("cropCategories.oilseeds")}>
                                        <option value="Mustard">{t("crops.mustard")}</option>
                                        <option value="Groundnut">{t("crops.groundnut")}</option>
                                        <option value="Soybean">{t("crops.soybean")}</option>
                                        <option value="Sunflower">{t("crops.sunflower")}</option>
                                        <option value="Sesame">{t("crops.sesame")}</option>
                                        <option value="Castor">{t("crops.castor")}</option>
                                    </optgroup>
                                    <optgroup label={t("cropCategories.cashCrops")}>
                                        <option value="Cotton">{t("crops.cotton")}</option>
                                        <option value="Sugarcane">{t("crops.sugarcane")}</option>
                                        <option value="Jute">{t("crops.jute")}</option>
                                        <option value="Tobacco">{t("crops.tobacco")}</option>
                                    </optgroup>
                                    <optgroup label={t("cropCategories.vegetables")}>
                                        <option value="Tomato">{t("crops.tomato")}</option>
                                        <option value="Potato">{t("crops.potato")}</option>
                                        <option value="Onion">{t("crops.onion")}</option>
                                        <option value="Brinjal">{t("crops.brinjal")}</option>
                                        <option value="Cabbage">{t("crops.cabbage")}</option>
                                        <option value="Cauliflower">{t("crops.cauliflower")}</option>
                                        <option value="Chilli">{t("crops.chilli")}</option>
                                        <option value="Okra">{t("crops.okra")}</option>
                                        <option value="Pea">{t("crops.pea")}</option>
                                        <option value="Spinach">{t("crops.spinach")}</option>
                                    </optgroup>
                                    <optgroup label={t("cropCategories.fruits")}>
                                        <option value="Mango">{t("crops.mango")}</option>
                                        <option value="Banana">{t("crops.banana")}</option>
                                        <option value="Grapes">{t("crops.grapes")}</option>
                                        <option value="Pomegranate">{t("crops.pomegranate")}</option>
                                        <option value="Papaya">{t("crops.papaya")}</option>
                                        <option value="Guava">{t("crops.guava")}</option>
                                    </optgroup>
                                    <optgroup label={t("cropCategories.spices")}>
                                        <option value="Turmeric">{t("crops.turmeric")}</option>
                                        <option value="Ginger">{t("crops.ginger")}</option>
                                        <option value="Garlic">{t("crops.garlic")}</option>
                                        <option value="Coriander">{t("crops.coriander")}</option>
                                        <option value="Cumin">{t("crops.cumin")}</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>{t("labelPlantationDate")}</label>
                                <input type="date" className="input-field" value={currentDate} onChange={e => setCurrentDate(e.target.value)} />
                            </div>
                        </div>

                        <button type="button" onClick={addCrop} disabled={!currentCrop || !currentDate} style={{ width: "100%", padding: "10px", background: "var(--color-bg-secondary)", border: "1px dashed var(--color-border)", borderRadius: "8px", color: "var(--color-text-main)", fontWeight: 600, cursor: "pointer", marginBottom: "32px" }}>
                            {t("btnAddCrop")}
                        </button>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button className="btn-secondary" onClick={() => setStep(2)} disabled={submitting} style={{ flex: 1 }}>
                                {t("btnBack")}
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSubmit}
                                disabled={submitting}
                                style={{ flex: 2 }}
                            >
                                {submitting ? t("btnSaving") : t("btnSave")}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
