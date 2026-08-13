'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { IconLoader } from '@tabler/icons-react';

// Single auth guard for every protected route. Without it, the dashboard,
// matches, and players pages each implemented their own redirect, and the
// match-detail page had no client-side guard at all.
export default function AppGuardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <IconLoader className="animate-spin" size={48} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
