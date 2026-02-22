import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await currentUser();

    // Redirect to sign in if no user
    if (!user) {
        redirect('/sign-in?redirect_url=/admin');
    }

    // Check for admin role specifically set inside Clerk's publicMetadata
    // You can set this in the Clerk Dashboard > Users > User Details > Metadata
    const isAdmin = (user.publicMetadata?.role as string)?.toLowerCase() === 'admin';

    if (!isAdmin) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '100vh', fontFamily: 'Outfit, sans-serif', background: 'var(--color-bg-main)'
            }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '16px', color: 'var(--color-danger)' }}>403 Forbidden</h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--color-text-main)', marginBottom: '24px' }}>
                    You do not have the required permissions to access the Admin Panel.
                </p>
                <a href="/dashboard" style={{
                    padding: '12px 24px', background: 'var(--color-primary)', color: 'white',
                    borderRadius: '8px', textDecoration: 'none', fontWeight: 600
                }}>
                    Return to Dashboard
                </a>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', width: '100vw', margin: 0, padding: 0 }}>
            {children}
        </div>
    );
}
