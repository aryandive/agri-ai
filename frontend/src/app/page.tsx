import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

// The traditional "Features" mapping
const features = [
  {
    title: "Crop Doctor",
    description: "Upload a photo of your crop and get instant AI-powered disease diagnosis with treatment recommendations.",
    href: "/crop-doctor",
    emoji: "🔬",
    gradient: "linear-gradient(135deg, #16a34a, #15803d)",
  },
  {
    title: "Weather Forecast",
    description: "Get real-time weather data and 5-day forecasts for your region to plan farming activities.",
    href: "/weather",
    emoji: "🌤️",
    gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
  },
  {
    title: "Mandi Prices",
    description: "Track live crop market prices across mandis. Save your crops to monitor prices that matter.",
    href: "/mandi",
    emoji: "💰",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
  },
  {
    title: "News & Schemes",
    description: "Stay updated with agricultural news, government schemes, and farming best practices.",
    href: "/news",
    emoji: "📰",
    gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
  },
  {
    title: "Marketplace",
    description: "Browse quality seeds, fertilizers, pesticides, and farming equipment from trusted sellers.",
    href: "/marketplace",
    emoji: "🛒",
    gradient: "linear-gradient(135deg, #ec4899, #be185d)",
  },
  {
    title: "Crop Planner",
    description: "Plan your crop cycle. Get yield estimates, soil requirements, and optimal planting schedules.",
    href: "/crop-planner",
    emoji: "📋",
    gradient: "linear-gradient(135deg, #14b8a6, #0d9488)",
  },
];

export default async function HomePage() {
  const t = await getTranslations("Home");
  const { userId } = await auth();

  // If user is logged in, we should check if they have a profile
  // For now, we will redirect them to the personalized dashboard directly (which handles onboarding checks)
  if (userId) {
    redirect("/dashboard");
  }

  // --- PUBLIC LANDING PAGE ---
  return (
    <div>
      {/* Hero Section */}
      <section style={{ marginBottom: "48px" }}>
        <div className="animate-fade-in-up" style={{ maxWidth: "700px" }}>
          <p style={{ color: "var(--color-primary-light)", fontWeight: 600, fontSize: "0.875rem", marginBottom: "12px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {t("tag")}
          </p>
          <h1 style={{ fontSize: "2.75rem", fontWeight: 800, lineHeight: 1.15, marginBottom: "16px", fontFamily: "Outfit, sans-serif" }}>
            <span className="gradient-text">{t("title1")}</span>
            <br />
            <span style={{ color: "var(--color-text-main)" }}>{t("title2")}</span>
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--color-text-muted)", lineHeight: 1.7, maxWidth: "600px", marginBottom: "32px" }}>
            {t("subtitle")}
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            <Link href="/sign-up" className="btn-primary" style={{ textDecoration: "none", padding: "14px 28px", fontSize: "1.05rem" }}>
              {t("btnGetStarted")}
            </Link>
            <Link href="/sign-in" className="btn-secondary" style={{ textDecoration: "none", padding: "14px 28px", fontSize: "1.05rem", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "12px", color: "var(--color-text-main)", fontWeight: 600 }}>
              {t("btnSignIn")}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "24px", color: "var(--color-text-main)" }}>
          {t("featuresTitle")}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {[
            { tag: "Crop", emoji: "🔬", gradient: "linear-gradient(135deg, #16a34a, #15803d)", href: "/crop-doctor" },
            { tag: "Weather", emoji: "🌤️", gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)", href: "/weather" },
            { tag: "Mandi", emoji: "💰", gradient: "linear-gradient(135deg, #f59e0b, #d97706)", href: "/mandi" },
            { tag: "News", emoji: "📰", gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)", href: "/news" },
            { tag: "Market", emoji: "🛒", gradient: "linear-gradient(135deg, #ec4899, #be185d)", href: "/marketplace" },
            { tag: "Planner", emoji: "📋", gradient: "linear-gradient(135deg, #14b8a6, #0d9488)", href: "/crop-planner" },
          ].map((feature, index) => (
            <div
              key={feature.href}
              className={`glass-card animate-fade-in-up animate-delay-${index + 1}`}
              style={{ padding: "28px", height: "100%", opacity: 0 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: feature.gradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                }}>
                  {feature.emoji}
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                  {t(`feat${feature.tag}Title` as any)}
                </h3>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                {t(`feat${feature.tag}Desc` as any)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <section style={{ marginTop: "48px" }}>
        <div className="glass-card" style={{ padding: "32px", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "24px" }}>
          {[
            { value: "50+", label: t("statsDiseases"), emoji: "🦠" },
            { value: "Real-time", label: t("statsWeather"), emoji: "⛅" },
            { value: "100+", label: t("statsMandi"), emoji: "📊" },
            { value: "AI", label: t("statsAI"), emoji: "🤖" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "4px" }}>{stat.emoji}</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary-light)", fontFamily: "Outfit, sans-serif" }}>
                {stat.value}
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
