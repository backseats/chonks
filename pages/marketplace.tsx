import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Marketplace() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/marketplace/chonks');
    }, [router]);

    return null; // No need to render anything as we're redirecting
}
