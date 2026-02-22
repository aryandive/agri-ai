"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useLanguage } from "@/lib/LanguageContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Address {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zip: string;
}

export default function CheckoutPage() {
    const router = useRouter();
    const { user } = useUser();
    const { t } = useLanguage();
    const [cart, setCart] = useState<any[]>([]);
    const [addr, setAddr] = useState<Address>({ name: "", phone: "", street: "", city: "", state: "", zip: "" });
    const [isSaving, setIsSaving] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [errors, setErrors] = useState<Partial<Address>>({});

    useEffect(() => {
        // Load cart
        const savedCart = localStorage.getItem("agri_cart");
        if (savedCart) setCart(JSON.parse(savedCart));
        else router.push("/marketplace");

        // Load user profile address
        if (user) {
            fetch(`${API_BASE}/api/users/profile/${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.address && data.address.phone) {
                        setAddr({
                            name: data.name || "",
                            phone: data.address.phone || "",
                            street: data.address.street || "",
                            city: data.address.city || "",
                            state: data.address.state || "",
                            zip: data.address.zip || "",
                        });
                    }
                })
                .catch(err => console.error("Error fetching profile:", err));
        }
    }, [user, router]);

    const validate = () => {
        const newErrors: Partial<Address> = {};
        if (!/^\d{10}$/.test(addr.phone)) newErrors.phone = "Phone must be 10 digits";
        if (!/^\d{6}$/.test(addr.zip)) newErrors.zip = "ZIP must be 6 digits";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePlaceOrder = async () => {
        if (!validate() || !user) return;
        setIsSaving(true);

        try {
            // Save address to profile if it wasn't there or updated
            await fetch(`${API_BASE}/api/users/profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    clerk_id: user.id,
                    address: addr
                }),
            });

            // Mock order placement
            const newOrder = {
                id: Math.random().toString(36).substring(2, 9).toUpperCase(),
                date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                total: cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0),
                items: cart.map(c => ({ name: c.product.name, qty: c.quantity }))
            };
            const existingOrders = JSON.parse(localStorage.getItem("agri_orders") || "[]");
            localStorage.setItem("agri_orders", JSON.stringify([newOrder, ...existingOrders]));

            setOrderPlaced(true);
            localStorage.removeItem("agri_cart");
        } catch (error) {
            console.error("Checkout error:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const cartTotal = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);

    if (orderPlaced) {
        return (
            <div style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center" }} className="glass-card">
                <p style={{ fontSize: "4rem" }}>🎉</p>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-primary)" }}>Order Placed Success!</h1>
                <p style={{ margin: "20px 0", color: "var(--color-text-muted)" }}>Your farming supplies are on the way to:</p>
                <div style={{ background: "var(--color-bg-secondary)", padding: "20px", borderRadius: "12px", textAlign: "left" }}>
                    <p><strong>{addr.name}</strong></p>
                    <p>{addr.street}, {addr.city}</p>
                    <p>{addr.state} - {addr.zip}</p>
                    <p>📞 {addr.phone}</p>
                </div>
                <button className="btn-primary" style={{ marginTop: "30px" }} onClick={() => router.push("/profile")}>
                    View My Orders
                </button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "24px" }} className="gradient-text">Checkout</h1>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "24px" }}>
                <div className="glass-card" style={{ padding: "24px" }}>
                    <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px" }}>🚚 Shipping Information</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div style={{ gridColumn: "span 2" }}>
                            <label className="label">Full Name</label>
                            <input className="input-field" value={addr.name} onChange={e => setAddr({ ...addr, name: e.target.value })} placeholder="Full Name" />
                        </div>
                        <div>
                            <label className="label">Phone Number</label>
                            <input className="input-field" value={addr.phone} onChange={e => setAddr({ ...addr, phone: e.target.value })} placeholder="10-digit mobile" />
                            {errors.phone && <p style={{ color: "red", fontSize: "0.7rem", marginTop: "4px" }}>{errors.phone}</p>}
                        </div>
                        <div>
                            <label className="label">ZIP Code</label>
                            <input className="input-field" value={addr.zip} onChange={e => setAddr({ ...addr, zip: e.target.value })} placeholder="6-digit ZIP" />
                            {errors.zip && <p style={{ color: "red", fontSize: "0.7rem", marginTop: "4px" }}>{errors.zip}</p>}
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                            <label className="label">Street Address</label>
                            <input className="input-field" value={addr.street} onChange={e => setAddr({ ...addr, street: e.target.value })} placeholder="H.No, Street, Landmark" />
                        </div>
                        <div>
                            <label className="label">City</label>
                            <input className="input-field" value={addr.city} onChange={e => setAddr({ ...addr, city: e.target.value })} placeholder="City" />
                        </div>
                        <div>
                            <label className="label">State</label>
                            <input className="input-field" value={addr.state} onChange={e => setAddr({ ...addr, state: e.target.value })} placeholder="State" />
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: "24px", height: "fit-content" }}>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px" }}>Order Summary</h2>
                    {cart.map(item => (
                        <div key={item.product._id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.85rem" }}>
                            <span>{item.product.name} x {item.quantity}</span>
                            <span>₹{item.product.price * item.quantity}</span>
                        </div>
                    ))}
                    <div style={{ borderTop: "1px solid var(--color-border)", marginTop: "16px", paddingTop: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem" }}>
                            <span>Total</span>
                            <span>₹{cartTotal.toLocaleString()}</span>
                        </div>
                    </div>
                    <button
                        className="btn-primary"
                        style={{ width: "100%", marginTop: "24px", padding: "14px" }}
                        onClick={handlePlaceOrder}
                        disabled={isSaving || !addr.name || !addr.phone || !addr.street}
                    >
                        {isSaving ? "Saving..." : "Place Order"}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .label {
                    display: block;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--color-text-muted);
                    margin-bottom: 6px;
                }
            `}</style>
        </div>
    );
}
