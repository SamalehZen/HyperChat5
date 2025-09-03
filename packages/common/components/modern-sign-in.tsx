'use client';

import { useSignIn, useSignUp } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { SignInPage } from '@repo/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ModernSignInProps = {
    redirectUrl?: string;
    onClose?: () => void;
};

export const ModernSignIn = ({
    redirectUrl = '/sign-in/sso-callback',
    onClose,
}: ModernSignInProps) => {
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { signIn, isLoaded, setActive } = useSignIn();
    const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
    const router = useRouter();

    if (!isSignUpLoaded || !isLoaded) return null;

    const handleEmailPasswordSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading('email');
        setError('');

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (!email || !password) {
            setError('Email et mot de passe sont requis');
            setIsLoading(null);
            return;
        }

        try {
            const result = await signIn.create({
                identifier: email,
                password,
            });

            if (result.status === 'complete') {
                setActive({ session: result.createdSessionId });
                router.push('/chat');
            }
        } catch (error: any) {
            console.error('Sign-in error:', error);
            if (isClerkAPIResponseError(error)) {
                setError(error.errors[0]?.longMessage || 'Erreur de connexion. Veuillez réessayer.');
            } else {
                setError('Erreur de connexion. Veuillez réessayer.');
            }
        } finally {
            setIsLoading(null);
        }
    };

    const handleGoogleAuth = async () => {
        setIsLoading('google');

        try {
            if (!isLoaded || !signIn) return;
            await signIn.authenticateWithRedirect({
                strategy: 'oauth_google',
                redirectUrl,
                redirectUrlComplete: redirectUrl,
            });
        } catch (error) {
            console.error('Google authentication error:', error);
        } finally {
            setIsLoading(null);
        }
    };

    const handleResetPassword = async () => {
        // Logique pour réinitialiser le mot de passe
        console.log('Reset password requested');
    };

    const handleCreateAccount = async () => {
        // Navigation vers la page d'inscription
        router.push('/sign-up');
    };

    return (
        <div className="fixed inset-0 z-[100] flex h-full w-full flex-col items-center justify-center backdrop-blur-sm bg-black/20">
            <div className="bg-background rounded-3xl shadow-2xl max-w-4xl max-h-[90vh] overflow-auto">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 rounded-full p-2 hover:bg-secondary transition-colors"
                    >
                        ✕
                    </button>
                )}
                <SignInPage
                    title={<span className="font-light text-foreground tracking-tighter">Bienvenue</span>}
                    description="Connectez-vous pour accéder à vos outils de recherche avancés"
                    onSignIn={handleEmailPasswordSignIn}
                    onGoogleSignIn={handleGoogleAuth}
                    onResetPassword={handleResetPassword}
                    onCreateAccount={handleCreateAccount}
                />
                {error && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                {isLoading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                            <span>
                                {isLoading === 'google' ? 'Authentification avec Google...' : 
                                 isLoading === 'email' ? 'Connexion en cours...' : 'Chargement...'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};