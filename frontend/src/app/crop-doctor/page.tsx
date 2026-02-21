"use client";

import { useState, useEffect, useRef, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { useUser } from "@clerk/nextjs";
<<<<<<< HEAD
import { useTranslations } from "next-intl";
=======
import { sanityClient, PRODUCTS_BY_DISEASE_QUERY } from "@/lib/sanity";
>>>>>>> origin/development

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Product {
    _id: string;
    name: string;
    slug: { current: string };
    imageUrl: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    rating?: number;
    reviews?: number;
    inStock: boolean;
    seller?: string;
    isSponsored?: boolean;
    targetDiseases?: string[];
}

interface AnalyzeResult {
    disease_name: string;
    confidence: string;
    description: string;
    cure_steps: string[];
    pesticides: string[];
    prevention_tips: string[];
}

export default function CropDoctorPage() {
    const t = useTranslations("CropDoctor");
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalyzeResult | null>(null);
    const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [dragover, setDragover] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cart, setCart] = useState<any[]>([]);

    const { user, isLoaded } = useUser();
    const [myCrops, setMyCrops] = useState<string[]>([]);
    const [selectedCrop, setSelectedCrop] = useState("");

    // Load cart from localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem("agri_cart");
        if (savedCart) setCart(JSON.parse(savedCart));
    }, []);

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
            setError(t("errorInvalidImage"));
            return;
        }
        setImage(file);
        setPreview(URL.createObjectURL(file));
        setError(null);
        setResult(null);
        setRecommendedProducts([]);
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
            setError(t("errorNoImage"));
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);
        setRecommendedProducts([]);

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

            // Fetch products from Sanity matching the disease or pesticides
            if (data.disease_name && data.disease_name !== "Healthy") {
                try {
                    const params = {
                        diseaseName: data.disease_name,
                        pesticides: data.pesticides && data.pesticides.length > 0 ? data.pesticides : ["__none__"] // GROQ needs a non-empty array for 'in'
                    };
                    const products = await sanityClient.fetch(PRODUCTS_BY_DISEASE_QUERY, params);
                    setRecommendedProducts(products || []);
                } catch (err) {
                    console.error("Failed to fetch recommended products:", err);
                    setError("Failed to fetch recommended products from the marketplace.");
                }
            } else {
                setRecommendedProducts([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t("errorServerError"));
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
        setRecommendedProducts([]);
        setError(null);
    };

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((c: any) => c.product._id === product._id);
            let newCart;
            if (existing) {
                newCart = prev.map((c: any) => c.product._id === product._id ? { ...c, quantity: c.quantity + 1 } : c);
            } else {
                newCart = [...prev, { product, quantity: 1 }];
            }
            localStorage.setItem("agri_cart", JSON.stringify(newCart));
            return newCart;
        });
    };

    const getCartQty = (id: string) => cart.find((c: any) => c.product._id === id)?.quantity || 0;

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
                    {t("tag")}
                </p>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit, sans-serif", marginBottom: "8px" }}>
                    <span className="gradient-text">{t("title")}</span>
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                    {t("subtitle")}
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
                                {t("uploadClickToChange", { filename: image?.name || "" })}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📷</div>
                            <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "8px" }}>
                                {t("uploadDropzone")}
                            </p>
                            <p style={{ color: "var(--color-text-dim)", fontSize: "0.85rem" }}>
                                {t("uploadBrowse")}
                            </p>
                        </div>
                    )}
                </div>

                {/* My Crops Quick Filter */}
                {myCrops.length > 0 && (
                    <div className="animate-fade-in-up animate-delay-2" style={{ opacity: 0, marginBottom: "20px" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px" }}>
                            {t("cropSelectLabel")}
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
                        {t("descLabel")}
                    </label>
                    <textarea
                        className="input-field"
                        placeholder={t("descPlaceholder")}
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
                                {t("btnAnalyzing")}
                            </>
                        ) : (
                            <>{t("btnAnalyze")}</>
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
                            {t("btnReset")}
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
                        {t("resultTitle")}
                    </h2>

                    {/* Disease Name & Confidence */}
                    <div className="glass-card" style={{ padding: "24px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                            <div>
                                <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)", marginBottom: "4px" }}>{t("resultDisease")}</p>
                                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: result.disease_name === "Healthy" ? "var(--color-success)" : "var(--color-warning)" }}>
                                    {result.disease_name}
                                </h3>
                            </div>
                            <span className={`result-badge ${confidenceBadgeClass(result.confidence)}`}>
                                {t("resultConfidence", { level: result.confidence })}
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
                            <h4 style={{ fontWeight: 600, marginBottom: "12px", color: "var(--color-primary-light)" }}>{t("resultTreatment")}</h4>
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
                            <h4 style={{ fontWeight: 600, marginBottom: "12px", color: "var(--color-accent)" }}>{t("resultPesticides")}</h4>
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
                            <h4 style={{ fontWeight: 600, marginBottom: "12px", color: "var(--color-info)" }}>{t("resultPrevention")}</h4>
                            <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                {result.prevention_tips.map((tip, i) => (
                                    <li key={i} style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>{tip}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Recommended Cure Products */}
                    {recommendedProducts.length > 0 && (
                        <div className="glass-card" style={{ padding: "24px", marginTop: "16px" }}>
                            <h4 style={{ fontWeight: 700, marginBottom: "16px", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                                🛍️ Recommended Cure Products
                            </h4>
                            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
                                Directly treat {result.disease_name} with these highly rated solutions from our Marketplace:
                            </p>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
                                {recommendedProducts.map(product => (
                                    <div key={product._id} style={{
                                        background: "var(--color-bg-secondary)",
                                        borderRadius: "16px",
                                        padding: "16px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "12px",
                                        border: "1px solid var(--color-border)",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                                        transition: "transform 0.2s, box-shadow 0.2s",
                                        cursor: "pointer",
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "translateY(-4px)";
                                            e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "none";
                                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                                        }}
                                    >
                                        {product.imageUrl && (
                                            <div style={{ width: "100%", height: "160px", borderRadius: "10px", overflow: "hidden", background: "white", position: "relative" }}>
                                                {product.isSponsored && (
                                                    <span style={{ position: "absolute", top: "8px", left: "8px", background: "rgba(255, 193, 7, 0.9)", color: "#78350f", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.05em", backdropFilter: "blur(4px)" }}>
                                                        Sponsored
                                                    </span>
                                                )}
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                                />
                                            </div>
                                        )}
                                        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                                            <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)", marginBottom: "4px" }}>
                                                {product.seller || "AgriMarket"}
                                            </p>
                                            <h5 style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "6px", color: "var(--color-text-main)", lineHeight: 1.3 }}>
                                                {product.name}
                                            </h5>

                                            <div style={{ marginTop: "auto" }}>
                                                <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-primary)" }}>
                                                    ₹{product.price?.toLocaleString("en-IN") || 0}
                                                    {product.originalPrice && (
                                                        <span style={{ fontSize: "0.85rem", color: "var(--color-text-dim)", textDecoration: "line-through", marginLeft: "8px", fontWeight: 400 }}>
                                                            ₹{product.originalPrice.toLocaleString("en-IN")}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        {getCartQty(product._id) > 0 ? (
                                            <button
                                                onClick={() => window.location.href = '/marketplace'}
                                                style={{
                                                    width: "100%", padding: "10px", borderRadius: "8px",
                                                    background: "var(--color-bg-secondary)", color: "var(--color-text-main)",
                                                    fontWeight: 600, fontSize: "0.9rem", border: "1px solid var(--color-primary)"
                                                }}>
                                                Added! ({getCartQty(product._id)}) - View Cart
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => addToCart(product)}
                                                style={{
                                                    width: "100%", padding: "10px", borderRadius: "8px",
                                                    background: "var(--color-primary)", color: "white",
                                                    fontWeight: 600, fontSize: "0.9rem", border: "none"
                                                }}>
                                                🛒 Add to Cart
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
