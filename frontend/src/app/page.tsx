import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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
            🌾 Smart Farming Assistant
          </p>
          <h1 style={{ fontSize: "2.75rem", fontWeight: 800, lineHeight: 1.15, marginBottom: "16px", fontFamily: "Outfit, sans-serif" }}>
            <span className="gradient-text">AI-Powered Agriculture</span>
            <br />
            <span style={{ color: "var(--color-text-main)" }}>at Your Fingertips</span>
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--color-text-muted)", lineHeight: 1.7, maxWidth: "600px", marginBottom: "32px" }}>
            Detect crop diseases instantly, track weather forecasts, monitor market prices, and plan your harvest — all powered by cutting-edge AI.
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            <Link href="/sign-up" className="btn-primary" style={{ textDecoration: "none", padding: "14px 28px", fontSize: "1.05rem" }}>
              Get Started for Free
            </Link>
            <Link href="/sign-in" className="btn-secondary" style={{ textDecoration: "none", padding: "14px 28px", fontSize: "1.05rem", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "12px", color: "var(--color-text-main)", fontWeight: 600 }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "24px", color: "var(--color-text-main)" }}>
          Features
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {features.map((feature, index) => (
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
                  {feature.title}
                </h3>
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <section style={{ marginTop: "48px" }}>
        <div className="glass-card" style={{ padding: "32px", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "24px" }}>
          {[
            { value: "50+", label: "Crop Diseases", emoji: "🦠" },
            { value: "Real-time", label: "Weather Data", emoji: "⛅" },
            { value: "100+", label: "Market Prices", emoji: "📊" },
            { value: "AI", label: "Powered by Gemini", emoji: "🤖" },
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
