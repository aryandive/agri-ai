import { useTranslations } from 'next-intl';

export default function NotFound() {
    const t = useTranslations('Settings');

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg-primary)]">
            <h1 className="text-4xl font-bold text-[var(--color-text-main)]">404 - Not Found</h1>
            <p className="mt-4 text-[var(--color-text-muted)]">The page you are looking for does not exist.</p>
            <a href="/" className="mt-8 btn-primary">
                Return Home
            </a>
        </div>
    );
}
