"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

// --- Types ---
interface Product {
    _id: string;
    name: string;
    imageUrl: string;
    description: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    category: string;
    seller: string;
    rating: number;
    reviews: number;
    isSponsored: boolean;
    inStock: boolean;
    tags?: string[];
    features?: string[];
    specifications?: { label: string; value: string }[];
}

interface CartItem {
    product: Product;
    quantity: number;
}

// --- Fallback Data (works before Sanity is connected) ---
const FALLBACK_PRODUCTS: Product[] = [
    {
        _id: "1", name: "Premium Hybrid Tomato Seeds (50g)",
        imageUrl: "https://images.unsplash.com/photo-1592921870789-04563d55041c?w=400",
        description: "High-yield disease-resistant hybrid tomato seeds. Suitable for all seasons. Germination rate 95%+.",
        price: 299, originalPrice: 450, discount: 34, category: "Seeds", seller: "KrishiMart",
        rating: 4.5, reviews: 234, isSponsored: true, inStock: true,
        features: ["95%+ germination rate", "Disease resistant", "All-season variety", "High yield"],
        tags: ["hybrid", "tomato", "seeds"],
    },
    {
        _id: "2", name: "NPK 19:19:19 Water Soluble Fertilizer (1kg)",
        imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
        description: "Balanced nutrition for all crops. Promotes healthy growth and high yield. 100% water soluble.",
        price: 420, category: "Fertilizers", seller: "AgroBasket",
        rating: 4.3, reviews: 189, isSponsored: false, inStock: true,
        features: ["100% water soluble", "Balanced NPK", "Foliar & drip compatible"],
    },
    {
        _id: "3", name: "Neem Oil Organic Pesticide (500ml)",
        imageUrl: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400",
        description: "100% organic cold-pressed neem oil. Effective against 200+ pests. Safe for organic farming certification.",
        price: 350, originalPrice: 500, discount: 30, category: "Pesticides", seller: "OrganicFarm",
        rating: 4.7, reviews: 412, isSponsored: true, inStock: true,
        features: ["100% organic", "200+ pests", "Cold-pressed", "NPOP certified"],
    },
    {
        _id: "4", name: "Drip Irrigation Kit (100 sqm)",
        imageUrl: "https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?w=400",
        description: "Complete drip irrigation system with timer. Saves 60% water.",
        price: 2499, originalPrice: 3500, discount: 29, category: "Irrigation", seller: "IrriTech",
        rating: 4.4, reviews: 78, isSponsored: false, inStock: true,
        features: ["60% water saving", "Auto-timer included", "100 sqm coverage", "Easy DIY setup"],
    },
    {
        _id: "5", name: "Solar Sprayer Pump (16L)",
        imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400",
        description: "Rechargeable solar-powered sprayer pump. 6-hour battery life. Double nozzle for wide coverage.",
        price: 3200, category: "Equipment", seller: "SolarAgri",
        rating: 4.2, reviews: 56, isSponsored: false, inStock: true,
        features: ["Solar powered", "6h battery", "Double nozzle", "16L tank"],
    },
    {
        _id: "6", name: "Vermicompost Organic Manure (25kg)",
        imageUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400",
        description: "Premium quality vermicompost. Rich in NPK and beneficial microbes. NPOP certified organic.",
        price: 450, category: "Organic", seller: "WormFarm",
        rating: 4.6, reviews: 321, isSponsored: false, inStock: true,
    },
    {
        _id: "7", name: "BT Cotton Seeds Certified (450g)",
        imageUrl: "https://images.unsplash.com/photo-1594897030264-ab7d87efc473?w=400",
        description: "GEAC approved BT cotton seeds. Resistant to bollworm. High fiber quality.",
        price: 899, category: "Seeds", seller: "CottonPro",
        rating: 4.1, reviews: 145, isSponsored: false, inStock: false,
    },
    {
        _id: "8", name: "Hand Soil pH Tester Kit",
        imageUrl: "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400",
        description: "Portable soil testing kit. Tests pH, NPK levels. Results in 10 minutes.",
        price: 699, originalPrice: 999, discount: 30, category: "Tools", seller: "SoilTech",
        rating: 4.3, reviews: 98, isSponsored: true, inStock: true,
    },
    {
        _id: "9", name: "Mulching Film Black (1m x 400m)",
        imageUrl: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400",
        description: "UV stabilized black mulching film. Controls weeds and retains soil moisture.",
        price: 1800, category: "Equipment", seller: "PlastiAgri",
        rating: 4.0, reviews: 42, isSponsored: false, inStock: true,
    },
    {
        _id: "10", name: "Trichoderma Bio Fungicide (1kg)",
        imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400",
        description: "Biological fungicide for soil-borne diseases. Safe for organic farming.",
        price: 380, category: "Pesticides", seller: "BioGuard",
        rating: 4.5, reviews: 167, isSponsored: false, inStock: true,
        features: ["Bio fungicide", "Organic safe", "Soil treatment", "Trichoderma viride"],
    },
    {
        _id: "11", name: "Micro Nutrient Mix (Zn, Fe, B, Mn) 1kg",
        imageUrl: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400",
        description: "Complete micro-nutrient mix for correcting deficiencies. Chelated formula for maximum absorption.",
        price: 560, originalPrice: 720, discount: 22, category: "Fertilizers", seller: "NutriCrop",
        rating: 4.4, reviews: 203, isSponsored: false, inStock: true,
    },
    {
        _id: "12", name: "Garden Sprinkler System (Auto Timer)",
        imageUrl: "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=400",
        description: "360° rotating sprinkler with programmable timer. Covers up to 200 sqm area.",
        price: 1899, originalPrice: 2500, discount: 24, category: "Irrigation", seller: "IrriTech",
        rating: 4.3, reviews: 89, isSponsored: true, inStock: true,
        features: ["360° rotation", "Auto timer", "200 sqm range", "Adjustable pressure"],
    },
];

const CATEGORIES = ["All", "Seeds", "Fertilizers", "Pesticides", "Equipment", "Tools", "Organic", "Irrigation"];

interface Address {
    name: string; phone: string; address: string; pincode: string; state: string;
}

export default function MarketplacePage() {
    const t = useTranslations("Marketplace");
    const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [showWishlist, setShowWishlist] = useState(false);
    const [detailProduct, setDetailProduct] = useState<Product | null>(null);
    const [sortBy, setSortBy] = useState("featured");
    const [showCheckout, setShowCheckout] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [addr, setAddr] = useState<Address>({ name: "", phone: "", address: "", pincode: "", state: "" });

    // Try loading from Sanity
    useEffect(() => {
        (async () => {
            try {
                const { sanityClient, PRODUCT_QUERY } = await import("@/lib/sanity");
                const data = await sanityClient.fetch(PRODUCT_QUERY);
                console.log("Sanity Response Data:", data);
                if (data && data.length > 0) {
                    setProducts(data);
                } else {
                    console.log("Sanity returned exactly 0 products.");
                }
            } catch (err) {
                console.error("Sanity fetch error:", err);
                // Sanity not configured or error — use fallback data
            }
        })();
    }, []);

    // Load wishlist from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("agri_wishlist");
        if (saved) setWishlist(JSON.parse(saved));
        const savedCart = localStorage.getItem("agri_cart");
        if (savedCart) setCart(JSON.parse(savedCart));
    }, []);

    // Save wishlist & cart
    useEffect(() => { localStorage.setItem("agri_wishlist", JSON.stringify(wishlist)); }, [wishlist]);
    useEffect(() => { localStorage.setItem("agri_cart", JSON.stringify(cart)); }, [cart]);

    // Filter & sort
    const filtered = products
        .filter((p) => {
            const matchesCat = activeCategory === "All" || p.category === activeCategory;
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCat && matchesSearch;
        })
        .sort((a, b) => {
            if (sortBy === "price-low") return a.price - b.price;
            if (sortBy === "price-high") return b.price - a.price;
            if (sortBy === "rating") return b.rating - a.rating;
            return (b.isSponsored ? 1 : 0) - (a.isSponsored ? 1 : 0); // featured = sponsored first
        });

    const toggleWishlist = (id: string) => setWishlist((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((c) => c.product._id === product._id);
            if (existing) return prev.map((c) => c.product._id === product._id ? { ...c, quantity: c.quantity + 1 } : c);
            return [...prev, { product, quantity: 1 }];
        });
    };

    const updateQty = (id: string, delta: number) => {
        setCart((prev) => prev.map((c) => c.product._id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter((c) => c.quantity > 0));
    };

    const getCartQty = (id: string) => cart.find((c) => c.product._id === id)?.quantity || 0;
    const cartTotal = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
    const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

    return (
        <div style={{ maxWidth: "1100px" }}>
            {/* Header */}
            <div className="animate-fade-in-up" style={{ marginBottom: "28px" }}>
                <p style={{ color: "#ec4899", fontWeight: 600, fontSize: "0.85rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {t("tag")}
                </p>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "Outfit, sans-serif", marginBottom: "8px" }}>
                    <span className="gradient-text">{t("title")}</span>
                </h1>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
                    {t("subtitle")}
                </p>
            </div>

            {/* Controls */}
            <div className="animate-fade-in-up animate-delay-1" style={{ opacity: 0, display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
                <input
                    type="text" className="input-field" placeholder={t("searchPlaceholder")}
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1, minWidth: "180px", padding: "10px 14px" }}
                />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{
                    padding: "10px 14px", background: "var(--color-bg-secondary)", color: "var(--color-text-main)",
                    border: "1px solid var(--color-border)", borderRadius: "10px", fontSize: "0.82rem",
                }}>
                    <option value="featured">{t("sortFeatured")}</option>
                    <option value="price-low">{t("sortPriceLow")}</option>
                    <option value="price-high">{t("sortPriceHigh")}</option>
                    <option value="rating">{t("sortRating")}</option>
                </select>
                <button onClick={() => setShowWishlist(!showWishlist)} style={{
                    padding: "10px 18px", background: showWishlist ? "rgba(236,72,153,0.2)" : "var(--color-bg-secondary)",
                    color: showWishlist ? "#f472b6" : "var(--color-text-main)",
                    border: showWishlist ? "1px solid #ec4899" : "1px solid var(--color-border)", borderRadius: "10px", cursor: "pointer",
                    fontWeight: 700, fontSize: "0.85rem", position: "relative",
                }}>
                    {t("btnWishlist")} {wishlist.length > 0 && <span style={{
                        position: "absolute", top: "-6px", right: "-6px",
                        background: "#ec4899", color: "white", borderRadius: "50%",
                        width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.65rem", fontWeight: 800,
                    }}>{wishlist.length}</span>}
                </button>
                <button onClick={() => setShowCart(!showCart)} style={{
                    padding: "10px 18px", background: showCart ? "var(--color-primary)" : "var(--color-bg-secondary)",
                    color: showCart ? "white" : "var(--color-text-main)",
                    border: "1px solid var(--color-border)", borderRadius: "10px", cursor: "pointer",
                    fontWeight: 700, fontSize: "0.85rem", position: "relative",
                }}>
                    {t("btnCart")} {cartCount > 0 && <span style={{
                        position: "absolute", top: "-6px", right: "-6px",
                        background: "#ef4444", color: "white", borderRadius: "50%",
                        width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.65rem", fontWeight: 800,
                    }}>{cartCount}</span>}
                </button>
            </div>

            {/* Category Tabs */}
            <div className="animate-fade-in-up animate-delay-2" style={{ opacity: 0, display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
                {CATEGORIES.map((cat) => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                        padding: "8px 16px", borderRadius: "999px", whiteSpace: "nowrap",
                        border: activeCategory === cat ? "1px solid #ec4899" : "1px solid var(--color-border)",
                        background: activeCategory === cat ? "rgba(236,72,153,0.15)" : "var(--color-bg-secondary)",
                        color: activeCategory === cat ? "#f472b6" : "var(--color-text-dim)",
                        cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
                    }}>
                        {t(`cat${cat}`)}
                    </button>
                ))}
            </div>

            {/* Wishlist Panel */}
            {showWishlist && (
                <div className="glass-card" style={{ padding: "20px", marginBottom: "20px", borderColor: "#ec4899" }}>
                    <h3 style={{ fontWeight: 700, marginBottom: "14px", fontSize: "1.1rem", color: "#f472b6" }}>{t("wishlistTitle", { count: wishlist.length })}</h3>
                    {wishlist.length === 0 ? (
                        <p style={{ color: "var(--color-text-dim)", fontSize: "0.9rem" }}>{t("wishlistEmpty")}</p>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
                            {products.filter(p => wishlist.includes(p._id)).map(p => (
                                <div key={p._id} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px", background: "var(--color-bg-secondary)", borderRadius: "10px", border: "1px solid var(--color-border)" }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={p.imageUrl} alt={p.name} style={{ width: "52px", height: "52px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100/1a1a2e/4ade80?text=🌿"; }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--color-text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                                        <p style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--color-text-main)" }}>₹{p.price.toLocaleString()}</p>
                                        <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                                            <button onClick={() => addToCart(p)} className="btn-primary" style={{ fontSize: "0.7rem", padding: "3px 8px" }}>{t("btnAddCart")}</button>
                                            <button onClick={() => toggleWishlist(p._id)} style={{ fontSize: "0.7rem", padding: "3px 8px", background: "transparent", border: "1px solid #ec4899", color: "#f472b6", borderRadius: "6px", cursor: "pointer" }}>{t("btnRemove")}</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Cart Panel */}
            {showCart && (
                <div className="glass-card" style={{ padding: "20px", marginBottom: "20px" }}>
                    <h3 style={{ fontWeight: 700, marginBottom: "14px", fontSize: "1.1rem" }}>{t("cartTitle", { count: cartCount })}</h3>
                    {cart.length === 0 ? (
                        <p style={{ color: "var(--color-text-dim)", fontSize: "0.9rem" }}>{t("cartEmpty")}</p>
                    ) : (
                        <>
                            {cart.map((item) => (
                                <div key={item.product._id} style={{
                                    display: "flex", alignItems: "center", gap: "12px",
                                    padding: "10px 0", borderBottom: "1px solid var(--color-border)",
                                }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={item.product.imageUrl} alt={item.product.name}
                                        style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover" }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--color-text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {item.product.name}
                                        </p>
                                        <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)" }}>
                                            ₹{item.product.price} × {item.quantity} = ₹{(item.product.price * item.quantity).toLocaleString()}
                                        </p>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <button onClick={() => updateQty(item.product._id, -1)} style={qtyBtnStyle}>−</button>
                                        <span style={{ fontWeight: 700, fontSize: "0.9rem", minWidth: "24px", textAlign: "center" }}>{item.quantity}</span>
                                        <button onClick={() => updateQty(item.product._id, 1)} style={qtyBtnStyle}>+</button>
                                    </div>
                                </div>
                            ))}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
                                <p style={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: "Outfit, sans-serif" }}>
                                    {t("cartTotal", { total: cartTotal.toLocaleString() })}
                                </p>
                                <button className="btn-primary" style={{ padding: "10px 24px" }} onClick={() => setShowCheckout(true)}>
                                    {t("btnCheckout")}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Product Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                {filtered.map((product, index) => {
                    const inCart = getCartQty(product._id);
                    const isWished = wishlist.includes(product._id);
                    const discountPct = product.discount || (product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0);

                    return (
                        <div
                            key={product._id}
                            className={`glass-card animate-fade-in-up animate-delay-${Math.min(index + 1, 4)}`}
                            style={{ padding: "0", opacity: 0, position: "relative", overflow: "hidden" }}
                        >
                            {/* Sponsored Badge */}
                            {product.isSponsored && (
                                <span style={{
                                    position: "absolute", top: "10px", left: "10px", zIndex: 2,
                                    background: "rgba(245,158,11,0.9)", color: "#fff",
                                    padding: "3px 10px", borderRadius: "6px",
                                    fontSize: "0.65rem", fontWeight: 700,
                                }}>
                                    {t("badgeSponsored")}
                                </span>
                            )}

                            {/* Discount Badge */}
                            {discountPct > 0 && (
                                <span style={{
                                    position: "absolute", top: "10px", right: "10px", zIndex: 2,
                                    background: "rgba(34,197,94,0.9)", color: "#fff",
                                    padding: "3px 10px", borderRadius: "6px",
                                    fontSize: "0.7rem", fontWeight: 700,
                                }}>
                                    {t("badgeOff", { pct: discountPct })}
                                </span>
                            )}

                            {/* Image wrapper — badges + wishlist all anchored inside this */}
                            <div style={{ position: "relative", width: "100%" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }}
                                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x300/1a1a2e/4ade80?text=🌿+Product"; }}
                                />
                                {/* Wishlist — always bottom-right corner of the image */}
                                <button
                                    onClick={() => toggleWishlist(product._id)}
                                    style={{
                                        position: "absolute", bottom: "8px", right: "8px", zIndex: 2,
                                        background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%",
                                        width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center",
                                        cursor: "pointer", fontSize: "1rem", backdropFilter: "blur(8px)",
                                    }}
                                >
                                    {isWished ? "❤️" : "🤍"}
                                </button>
                            </div>

                            {/* Product Info */}
                            <div style={{ padding: "16px" }}>
                                <p style={{ fontSize: "0.7rem", color: "#ec4899", fontWeight: 600, textTransform: "uppercase", marginBottom: "4px" }}>
                                    {t(`cat${product.category}`)} • {product.seller}
                                </p>
                                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main)", lineHeight: 1.4, marginBottom: "6px", minHeight: "40px" }}>
                                    {product.name}
                                </h3>
                                <p style={{
                                    fontSize: "0.78rem", color: "var(--color-text-dim)", lineHeight: 1.5, marginBottom: "10px", minHeight: "36px",
                                    overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
                                }}>
                                    {product.description}
                                </p>

                                {/* Rating */}
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                                    <span style={{ color: "#f59e0b", fontSize: "0.82rem" }}>
                                        {"★".repeat(Math.floor(product.rating))}{"☆".repeat(5 - Math.floor(product.rating))}
                                    </span>
                                    <span style={{ fontSize: "0.72rem", color: "var(--color-text-dim)" }}>
                                        {product.rating} ({product.reviews})
                                    </span>
                                </div>

                                {/* Price */}
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                                    <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)", fontFamily: "Outfit, sans-serif" }}>
                                        ₹{product.price.toLocaleString()}
                                    </span>
                                    {product.originalPrice && (
                                        <span style={{ fontSize: "0.85rem", color: "var(--color-text-dim)", textDecoration: "line-through" }}>
                                            ₹{product.originalPrice.toLocaleString()}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: "8px" }}>
                                    {product.inStock ? (
                                        inCart > 0 ? (
                                            <div style={{
                                                display: "flex", alignItems: "center", gap: "8px", flex: 1,
                                                background: "var(--color-bg-secondary)", borderRadius: "10px",
                                                padding: "4px", border: "1px solid var(--color-border)",
                                            }}>
                                                <button onClick={() => updateQty(product._id, -1)} style={{ ...qtyBtnStyle, flex: 1 }}>−</button>
                                                <span style={{ fontWeight: 700, fontSize: "0.95rem", flex: 1, textAlign: "center" }}>{inCart}</span>
                                                <button onClick={() => updateQty(product._id, 1)} style={{ ...qtyBtnStyle, flex: 1 }}>+</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => addToCart(product)} className="btn-primary" style={{ flex: 1, padding: "10px", fontSize: "0.82rem" }}>
                                                {t("btnAddCartFull")}
                                            </button>
                                        )
                                    ) : (
                                        <button disabled style={{
                                            flex: 1, padding: "10px", fontSize: "0.82rem", opacity: 0.4,
                                            background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)",
                                            borderRadius: "10px", color: "var(--color-text-dim)", cursor: "not-allowed"
                                        }}>
                                            {t("btnOutOfStock")}
                                        </button>
                                    )}
                                    <button onClick={() => setDetailProduct(product)} style={{
                                        padding: "10px 14px", background: "var(--color-bg-secondary)",
                                        border: "1px solid var(--color-border)", borderRadius: "10px",
                                        color: "var(--color-text-muted)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                                    }}>
                                        ℹ️
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Product Detail Modal */}
            {detailProduct && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 1000,
                    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "20px",
                }} onClick={() => setDetailProduct(null)}>
                    <div className="glass-card" style={{
                        maxWidth: "600px", width: "100%", maxHeight: "85vh", overflow: "auto",
                        padding: "0", position: "relative",
                    }} onClick={(e) => e.stopPropagation()}>
                        {/* Close */}
                        <button onClick={() => setDetailProduct(null)} style={{
                            position: "absolute", top: "12px", right: "12px", zIndex: 10,
                            background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%",
                            width: "32px", height: "32px", color: "white", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem",
                        }}>✕</button>

                        {/* Image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={detailProduct.imageUrl} alt={detailProduct.name}
                            style={{ width: "100%", height: "250px", objectFit: "cover" }}
                            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/600x300/1a1a2e/4ade80?text=🌿"; }} />

                        <div style={{ padding: "24px" }}>
                            {/* Badges */}
                            <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                                <span style={{ padding: "3px 10px", borderRadius: "6px", background: "rgba(236,72,153,0.12)", color: "#f472b6", fontSize: "0.72rem", fontWeight: 600 }}>
                                    {t(`cat${detailProduct.category}`)}
                                </span>
                                {detailProduct.isSponsored && (
                                    <span style={{ padding: "3px 10px", borderRadius: "6px", background: "rgba(245,158,11,0.12)", color: "#f59e0b", fontSize: "0.72rem", fontWeight: 600 }}>
                                        {t("badgeSponsored")}
                                    </span>
                                )}
                                {!detailProduct.inStock && (
                                    <span style={{ padding: "3px 10px", borderRadius: "6px", background: "rgba(239,68,68,0.12)", color: "#ef4444", fontSize: "0.72rem", fontWeight: 600 }}>
                                        {t("btnOutOfStock")}
                                    </span>
                                )}
                            </div>

                            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "8px", fontFamily: "Outfit, sans-serif" }}>
                                {detailProduct.name}
                            </h2>
                            <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: "16px" }}>
                                {detailProduct.description}
                            </p>

                            {/* Price */}
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                                <span style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "Outfit, sans-serif", color: "var(--color-text-main)" }}>
                                    ₹{detailProduct.price.toLocaleString()}
                                </span>
                                {detailProduct.originalPrice && (
                                    <>
                                        <span style={{ fontSize: "1rem", color: "var(--color-text-dim)", textDecoration: "line-through" }}>
                                            ₹{detailProduct.originalPrice.toLocaleString()}
                                        </span>
                                        <span style={{ padding: "3px 10px", borderRadius: "6px", background: "rgba(34,197,94,0.15)", color: "#22c55e", fontSize: "0.82rem", fontWeight: 700 }}>
                                            {t("modalSave", { amount: (detailProduct.originalPrice - detailProduct.price).toLocaleString() })}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Rating */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                                <span style={{ color: "#f59e0b", fontSize: "1rem" }}>
                                    {"★".repeat(Math.floor(detailProduct.rating))}{"☆".repeat(5 - Math.floor(detailProduct.rating))}
                                </span>
                                <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                                    {detailProduct.rating} • {t("modalReviews", { count: detailProduct.reviews })}
                                </span>
                            </div>

                            {/* Features */}
                            {detailProduct.features && detailProduct.features.length > 0 && (
                                <div style={{ marginBottom: "16px" }}>
                                    <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "8px" }}>{t("modalKeyFeatures")}</p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                        {detailProduct.features.map((f, i) => (
                                            <span key={i} style={{
                                                padding: "4px 12px", borderRadius: "999px",
                                                background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)",
                                                fontSize: "0.78rem", color: "var(--color-text-muted)",
                                            }}>
                                                ✅ {f}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Specifications */}
                            {detailProduct.specifications && detailProduct.specifications.length > 0 && (
                                <div style={{ marginBottom: "16px" }}>
                                    <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "8px" }}>{t("modalSpecifications")}</p>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                                        {detailProduct.specifications.map((s, i) => (
                                            <div key={i} style={{
                                                padding: "8px 12px", borderRadius: "8px",
                                                background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)",
                                            }}>
                                                <p style={{ fontSize: "0.7rem", color: "var(--color-text-dim)" }}>{s.label}</p>
                                                <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-main)" }}>{s.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Seller */}
                            <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)", marginBottom: "16px" }}>
                                {t("soldBy")} <strong>{detailProduct.seller}</strong>
                            </p>

                            {/* Cart controls in modal */}
                            {detailProduct.inStock && (
                                getCartQty(detailProduct._id) > 0 ? (
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "12px",
                                        background: "var(--color-bg-secondary)", borderRadius: "12px",
                                        padding: "8px 16px", border: "1px solid var(--color-border)",
                                        justifyContent: "space-between"
                                    }}>
                                        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text-muted)" }}>{t("badgeInCart")}</span>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <button onClick={() => updateQty(detailProduct._id, -1)} style={{ ...qtyBtnStyle, width: "36px", height: "36px" }}>−</button>
                                            <span style={{ fontWeight: 800, fontSize: "1.1rem", minWidth: "28px", textAlign: "center" }}>{getCartQty(detailProduct._id)}</span>
                                            <button onClick={() => updateQty(detailProduct._id, 1)} style={{ ...qtyBtnStyle, width: "36px", height: "36px" }}>+</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => addToCart(detailProduct)} className="btn-primary" style={{ width: "100%", padding: "12px", fontSize: "0.95rem" }}>
                                        {t("btnAddCartPrice", { price: detailProduct.price.toLocaleString() })}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Address Modal */}
            {showCheckout && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 2000,
                    background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
                }} onClick={() => { if (!orderPlaced) setShowCheckout(false); }}>
                    <div className="glass-card" style={{ maxWidth: "480px", width: "100%", padding: "28px", position: "relative" }}
                        onClick={(e) => e.stopPropagation()}>
                        {!orderPlaced ? (
                            <>
                                <button onClick={() => setShowCheckout(false)} style={{
                                    position: "absolute", top: "12px", right: "12px",
                                    background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%",
                                    width: "30px", height: "30px", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "1rem"
                                }}>✕</button>
                                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "4px", fontFamily: "Outfit, sans-serif" }}>{t("checkoutTitle")}</h2>
                                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "20px" }}>{t("checkoutTotal")} <strong style={{ color: "var(--color-text-main)" }}>₹{cartTotal.toLocaleString()}</strong> • {cartCount} {t("checkoutItems")}</p>

                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {([
                                        { key: "name", label: t("labelName"), placeholder: "e.g. Rajan Patel", type: "text" },
                                        { key: "phone", label: t("labelPhone"), placeholder: "10-digit mobile number", type: "tel" },
                                        { key: "address", label: t("labelAddress"), placeholder: "House, Street, Village", type: "text" },
                                        { key: "pincode", label: t("labelPincode"), placeholder: "6-digit PIN", type: "text" },
                                        { key: "state", label: t("labelState"), placeholder: "e.g. Maharashtra", type: "text" },
                                    ] as { key: keyof Address; label: string; placeholder: string; type: string }[]).map(f => (
                                        <div key={f.key}>
                                            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px" }}>{f.label}</label>
                                            <input
                                                type={f.type}
                                                className="input-field"
                                                placeholder={f.placeholder}
                                                value={addr[f.key]}
                                                onChange={e => setAddr(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                style={{ width: "100%" }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className="btn-primary"
                                    style={{ width: "100%", marginTop: "20px", padding: "13px", fontSize: "0.95rem" }}
                                    disabled={!addr.name || !addr.phone || !addr.address || !addr.pincode || !addr.state}
                                    onClick={() => {
                                        setOrderPlaced(true);
                                        const newOrder = {
                                            id: Math.random().toString(36).substring(2, 9).toUpperCase(),
                                            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                                            total: cartTotal,
                                            items: cart.map(c => ({ name: c.product.name, qty: c.quantity }))
                                        };
                                        const existingOrders = JSON.parse(localStorage.getItem("agri_orders") || "[]");
                                        localStorage.setItem("agri_orders", JSON.stringify([newOrder, ...existingOrders]));
                                        setCart([]);
                                        localStorage.removeItem("agri_cart");
                                    }}
                                >
                                    {t("btnPlaceOrder", { total: cartTotal.toLocaleString() })}
                                </button>
                            </>
                        ) : (
                            <div style={{ textAlign: "center", padding: "16px 0" }}>
                                <p style={{ fontSize: "3rem", marginBottom: "12px" }}>{t("orderSuccess")}</p>
                                <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "8px", fontFamily: "Outfit, sans-serif", color: "#22c55e" }}>{t("orderPlacedTitle")}</h2>
                                <p style={{ color: "var(--color-text-muted)", marginBottom: "6px", fontSize: "0.9rem" }}>{t("orderDeliveredTo")}</p>
                                <p style={{ fontWeight: 700, color: "var(--color-text-main)", marginBottom: "4px" }}>{addr.name}</p>
                                <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{addr.address}, {addr.pincode}, {addr.state}</p>
                                <button className="btn-primary" style={{ marginTop: "20px", padding: "10px 32px" }}
                                    onClick={() => { setShowCheckout(false); setOrderPlaced(false); setShowCart(false); setAddr({ name: "", phone: "", address: "", pincode: "", state: "" }); }}>
                                    {t("btnDone")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const qtyBtnStyle: React.CSSProperties = {
    width: "32px", height: "32px", borderRadius: "8px",
    background: "var(--color-bg-card)", border: "1px solid var(--color-border)",
    color: "var(--color-text-main)", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: "1rem",
};
