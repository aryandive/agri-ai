"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdBanner() {
    const { user, isLoaded } = useUser();
    const [showAds, setShowAds] = useState(false);
    const pathname = usePathname();

    // Do not show ads in the admin panel or sign-in pages
    const isExcludedRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up');

    useEffect(() => {
        if (isLoaded && user) {
            const role = (user.publicMetadata?.role as string)?.toLowerCase();
            // Show ads only if the user is NOT subscribed and NOT an admin
            if (role === "subscribed" || role === "admin") {
                setShowAds(false);
            } else {
                setShowAds(true);
            }
        }
    }, [isLoaded, user]);

    if (!showAds || isExcludedRoute) return null;

    return (
        <div style={{
            background: "linear-gradient(to right, rgba(100, 116, 139, 0.05), rgba(100, 116, 139, 0.1))",
            border: "1px dashed var(--color-border)",
            borderRadius: "16px",
            padding: "20px",
            textAlign: "center",
            marginTop: "12px",
            marginBottom: "32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: "900px" // match main content max constraint
        }}>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", fontWeight: 700 }}>Advertisement</p>
            <h4 style={{ color: "var(--color-text-main)", marginBottom: "16px", fontWeight: 700, fontSize: "1.2rem" }}>
                Tired of Ads & Limits? Get Unlimited AI
            </h4>
            <button className="btn-primary" style={{ padding: "10px 24px", fontSize: "0.95rem", background: "var(--color-text-main)" }} onClick={() => window.location.href = "/profile"}>
                Upgrade to Premium
            </button>
        </div>
    );
}
