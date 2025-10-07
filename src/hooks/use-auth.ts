'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/services/authService';

export function useAuth(requireAuth: boolean = true) {
  const [user, setUser] = useState<{ userId: string; email: string; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        
        if (!currentUser && requireAuth) {
          router.push('/');
        } else {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (requireAuth) {
          router.push('/');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, requireAuth]);

  return { user, loading };
}
