"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";



export default function Sidebar() {
    const pathname = usePathname();
    const { language, setLanguage, t } = useLanguage();
    const [isLight, setIsLight] = useState(false);

    const navItems = [
        {
            label: t.nav.home,
            href: "/",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            ),
        },
        {
            label: t.nav.cropDoctor,
            href: "/crop-doctor",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 1 8-1 3.5-3 6-6 8" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.5 12 13 13 12" />
                </svg>
            ),
        },
        {
            label: t.nav.weather,
            href: "/weather",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.5 21H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                </svg>
            ),
        },
        {
            label: t.nav.mandi,
            href: "/mandi",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
            ),
        },
        {
            label: t.nav.news,
            href: "/news",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                    <path d="M18 14h-8" />
                    <path d="M15 18h-5" />
                    <path d="M10 6h8v4h-8V6Z" />
                </svg>
            ),
        },
        {
            label: t.nav.marketplace,
            href: "/marketplace",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
            ),
        },
        {
            label: t.nav.cropPlanner,
            href: "/crop-planner",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            ),
        },
        {
            label: t.nav.profile,
            href: "/profile",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
        },
    ];

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        const systemPrefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;

        if (savedTheme === "light" || (!savedTheme && systemPrefersLight)) {
            setIsLight(true);
            document.documentElement.classList.add("light");
        } else {
            setIsLight(false);
            document.documentElement.classList.remove("light");
        }
    }, []);

    const toggleTheme = () => {
        const newLight = !isLight;
        setIsLight(newLight);
        if (newLight) {
            document.documentElement.classList.add("light");
            localStorage.setItem("theme", "light");
        } else {
            document.documentElement.classList.remove("light");
            localStorage.setItem("theme", "dark");
        }
    };

    return (
        <aside className="sidebar">
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="sidebar-logo">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="14" fill="#16a34a" opacity="0.2" />
                        <path
                            d="M16 6c-2 4-6 6-6 10a6 6 0 0 0 12 0c0-4-4-6-6-10Z"
                            fill="#22c55e"
                        />
                        <path d="M16 12v8M13 17h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <h1 className="gradient-text">Agri AI</h1>
                </div>
            </Link>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-link ${pathname === item.href ? "active" : ""}`}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div style={{ padding: "16px", borderTop: "1px solid var(--color-border)", marginTop: "auto" }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button
                        onClick={toggleTheme}
                        title={isLight ? t.common.darkMode : t.common.lightMode}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '12px',
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-main)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {isLight ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                            </svg>
                        )}
                        {isLight ? t.common.darkMode : t.common.lightMode}
                    </button>

                    <button
                        onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '12px',
                            background: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-main)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        {language === 'en' ? "हिन्दी" : "Eng"}
                    </button>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)" }}>
                    🌾 {t.common.version}
                </p>
                <p style={{ fontSize: "0.7rem", color: "var(--color-text-dim)", marginTop: "4px" }}>
                    {t.common.subtitle}
                </p>
            </div>
        </aside>
    );
}
