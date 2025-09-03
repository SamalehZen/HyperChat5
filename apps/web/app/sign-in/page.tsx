'use client';

import { useAuth, useSignIn } from '@clerk/nextjs';
import { ModernSignIn } from '@repo/common/components';
import { useRouter } from 'next/navigation';

export default function OauthSignIn() {
    const { signIn } = useSignIn();
    const { isSignedIn, isLoaded } = useAuth();
    const router = useRouter();
    if (!signIn) return null;

    if (isSignedIn) {
        router.push('/chat');
    }

    if (!isLoaded) return null;

    return (
        <ModernSignIn
            onClose={() => {
                router.push('/chat');
            }}
        />
    );
}
