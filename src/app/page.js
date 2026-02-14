'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import GuestChat from '@/components/GuestChat';

export default function Home() {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        // Handle password recovery redirect
        if (window.location.hash && window.location.hash.includes('type=recovery')) {
            router.push(`/login${window.location.hash}`);
            return;
        }

        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                router.push('/chat');
            } else {
                setIsLoading(false);
            }
        };
        checkUser();
    }, [router]);

    if (isLoading) {
        return (
            <div style={{
                height: '100vh',
                backgroundColor: '#212121',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontFamily: 'sans-serif'
            }}>
                Cargando Sigma AI...
            </div>
        );
    }

    return <GuestChat />;
}
