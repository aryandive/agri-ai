"use client";

import { useState, useEffect, useRef, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { useUser } from "@clerk/nextjs";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AnalyzeResult {
    disease_name: string;
    confidence: string;
    description: string;
    cure_steps: string[];
    pesticides: string[];
    prevention_tips: string[];
}

export default function CropDoctorPage() {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalyzeResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragover, setDragover] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { user, isLoaded } = useUser();
    const [myCrops, setMyCrops] = useState<string[]>([]);
    const [selectedCrop, setSelectedCrop] = useState("");

    useEffect(() => {
        if (isLoaded && user) {
            fetch(`${API_BASE}/api/users/profile/${user.id}`)
                .then(r => r.json())
                .then(d => {
                    if (d.crops && Array.isArray(d.crops)) {
                        setMyCrops(d.crops.map((c: any) => c.crop));
                    }
                })
                .catch(e => console.error("Could not fetch user crops", e));
        }
    }, [isLoaded, user]);

    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file (JPG, PNG, etc.)");
            return;
        }
        setImage(file);
        setPreview(URL.createObjectURL(file));
        setError(null);
        setResult(null);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragover(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!image) {
            setError("Please upload an image first.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append("image", image);
            if (description) formData.append("description", description);
            if (selectedCrop) formData.append("crop", selectedCrop);

            const resp = await fetch(`${API_BASE}/api/analyze`, {
                method: "POST",
                body: formData,
            });

            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                throw new Error(errData.detail || `Server error (${resp.status})`);
            }

            const data: AnalyzeResult = await resp.json();
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setImage(null);
        setPreview(null);
        setDescription("");
        setSelectedCrop("");
        setResult(null);
        setError(null);
    };

    const confidenceBadgeClass = (c: string) => {
        const lower = c.toLowerCase();
        if (lower === "high") return "badge-high";
        if (lower === "medium") return "badge-medium";
        return "badge-low";
    };

    return (
        <div style={{ maxWidth: "900px" }}>
            {/* Header */}
            <div className="animate-fade-in-up" style={{ marginBottom: "32px" }}>
                <p style={{ color: "var(--color-primary-light)", fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    🔬 AI Plant Doctor
                </p>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit, sans-serif", marginBottom: "8px" }}>
                    <span className="gradient-text">Crop Disease Detection</span>
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                    Upload a photo of your plant or leaf and get an instant AI diagnosis with treatment steps.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Upload Area */}
                <div
                    className={`upload-zone animate-fade-in-up animate-delay-1 ${dragover ? "dragover" : ""}`}
                    style={{ opacity: 0, marginBottom: "20px", position: "relative" }}
                    onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
                    onDragLeave={() => setDragover(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleChange}
                        style={{ display: "none" }}
                        id="crop-image-upload"
                    />
                    {preview ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={preview}
                                alt="Selected plant"
                                style={{ maxWidth: "300px", maxHeight: "250px", borderRadius: "12px", objectFit: "cover" }}
                            />
                            <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                                {image?.name} — Click to change
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📷</div>
                            <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "8px" }}>
                                Drop your plant image here
                            </p>
                            <p style={{ color: "var(--color-text-dim)", fontSize: "0.85rem" }}>
                                or click to browse files (JPG, PNG, WEBP)
                            </p>
                        </div>
                    )}
                </div>

                {/* My Crops Quick Filter */}
                {myCrops.length > 0 && (
                    <div className="animate-fade-in-up animate-delay-2" style={{ opacity: 0, marginBottom: "20px" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px" }}>
                            Which crop is this? (Optional)
                        </label>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {myCrops.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setSelectedCrop(selectedCrop === c ? "" : c)}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: "999px",
                                        border: selectedCrop === c ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                                        background: selectedCrop === c ? "rgba(22, 163, 74, 0.15)" : "var(--color-bg-secondary)",
                                        color: selectedCrop === c ? "var(--color-primary-light)" : "var(--color-text-dim)",
                                        cursor: "pointer",
                                        fontSize: "0.85rem",
                                        fontWeight: 600,
                                        transition: "all 0.2s"
                                    }}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description Field */}
                <div className="animate-fade-in-up animate-delay-2" style={{ opacity: 0, marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px" }}>
                        Additional Description (optional)
                    </label>
                    <textarea
                        className="input-field"
                        placeholder="Describe what you see — e.g. yellow spots on leaves, wilting, brown edges..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        style={{ resize: "vertical" }}
                    />
                </div>

                {/* Actions */}
                <div className="animate-fade-in-up animate-delay-3" style={{ opacity: 0, display: "flex", gap: "12px", marginBottom: "32px" }}>
                    <button type="submit" className="btn-primary" disabled={loading || !image}>
                        {loading ? (
                            <>
                                <span className="spinner" style={{ width: "18px", height: "18px", borderWidth: "2px" }}></span>
                                Analyzing...
                            </>
                        ) : (
                            <>🔍 Analyze Plant</>
                        )}
                    </button>
                    {(image || result) && (
                        <button
                            type="button"
                            onClick={resetForm}
                            style={{
                                padding: "12px 24px",
                                borderRadius: "12px",
                                border: "1px solid var(--color-border)",
                                background: "transparent",
                                color: "var(--color-text-muted)",
                                cursor: "pointer",
                                fontWeight: 500,
                                fontSize: "0.95rem",
                            }}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </form>

            {/* Error */}
            {error && (
                <div className="glass-card" style={{ padding: "16px 20px", borderColor: "var(--color-danger)", marginBottom: "24px" }}>
                    <p style={{ color: "var(--color-danger)", fontWeight: 600 }}>⚠️ {error}</p>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="animate-fade-in-up" style={{ opacity: 0 }}>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>
                        📋 Diagnosis Results
                    </h2>

                    {/* Disease Name & Confidence */}
                    <div className="glass-card" style={{ padding: "24px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                            <div>
                                <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)", marginBottom: "4px" }}>Disease Detected</p>
                                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: result.disease_name === "Healthy" ? "var(--color-success)" : "var(--color-warning)" }}>
                                    {result.disease_name}
                                </h3>
                            </div>
                            <span className={`result-badge ${confidenceBadgeClass(result.confidence)}`}>
                                ● {result.confidence} Confidence
                            </span>
                        </div>
                        {result.description && (
                            <p style={{ marginTop: "12px", color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                                {result.description}
                            </p>
                        )}
                    </div>

                    {/* Cure Steps */}
                    {result.cure_steps.length > 0 && (
                        <div className="glass-card" style={{ padding: "24px", marginBottom: "16px" }}>
                            <h4 style={{ fontWeight: 600, marginBottom: "12px", color: "var(--color-primary-light)" }}>💊 Treatment Steps</h4>
                            <ol style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                {result.cure_steps.map((step, i) => (
                                    <li key={i} style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>{step}</li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* Pesticides */}
                    {result.pesticides.length > 0 && (
                        <div className="glass-card" style={{ padding: "24px", marginBottom: "16px" }}>
                            <h4 style={{ fontWeight: 600, marginBottom: "12px", color: "var(--color-accent)" }}>🧪 Recommended Pesticides</h4>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {result.pesticides.map((p, i) => (
                                    <span key={i} style={{
                                        background: "rgba(245, 158, 11, 0.1)",
                                        border: "1px solid rgba(245, 158, 11, 0.3)",
                                        padding: "6px 14px",
                                        borderRadius: "999px",
                                        fontSize: "0.85rem",
                                        color: "var(--color-accent)",
                                    }}>
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Prevention Tips */}
                    {result.prevention_tips.length > 0 && (
                        <div className="glass-card" style={{ padding: "24px" }}>
                            <h4 style={{ fontWeight: 600, marginBottom: "12px", color: "var(--color-info)" }}>🛡️ Prevention Tips</h4>
                            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                {result.prevention_tips.map((tip, i) => (
                                    <li key={i} style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>{tip}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
