'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        // Handle password recovery redirect
        if (window.location.hash && window.location.hash.includes('type=recovery')) {
            router.push(`/login${window.location.hash}`);
            return;
        }

        // Unify chat UI for both authenticated and guest users.
        router.replace('/chat');
    }, [router]);

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
