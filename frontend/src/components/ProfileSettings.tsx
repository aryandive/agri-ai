'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { getUserLocale, setUserLocale } from '@/services/locale';

export default function ProfileSettings() {
    const { theme, setTheme } = useTheme();
    const t = useTranslations('Settings');
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [currentLocale, setCurrentLocale] = useState('en');

    // Ensure hydration matches server
    useEffect(() => {
        setMounted(true);
        getUserLocale().then(setCurrentLocale);
    }, []);

    if (!mounted) {
        return null; // Return skeleton/null to prevent hydration mismatch
    }

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = e.target.value;
        startTransition(async () => {
            await setUserLocale(nextLocale);
            setCurrentLocale(nextLocale);
            router.refresh(); // Crucial: forcefully re-render Server Components with the new locale
        });
    };

    return (
        <div className="glass-card p-6 max-w-2xl mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-6 gradient-text">
                {t('title')}
            </h2>

            <div className="space-y-6">
                {/* Theme Settings */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                    <div>
                        <h3 className="font-medium text-[var(--color-text-main)]">
                            {t('theme')}
                        </h3>
                        <p className="text-sm text-[var(--color-text-dim)]">
                            {t('themeSubtitle')}
                        </p>
                    </div>

                    <select
                        className="input-field sm:w-auto min-w-[140px]"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                    >
                        <option value="system">{t('system')}</option>
                        <option value="light">{t('light')}</option>
                        <option value="dark">{t('dark')}</option>
                    </select>
                </div>

                {/* Language Settings */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                    <div>
                        <h3 className="font-medium text-[var(--color-text-main)]">
                            {t('language')}
                        </h3>
                        <p className="text-sm text-[var(--color-text-dim)]">
                            {t('languageSubtitle')}
                        </p>
                    </div>

                    <select
                        className="input-field sm:w-auto min-w-[140px]"
                        value={currentLocale}
                        onChange={handleLanguageChange}
                        disabled={isPending}
                    >
                        <option value="en">{t('english')}</option>
                        <option value="hi">{t('hindi')}</option>
                        <option value="mr">{t('marathi')}</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
