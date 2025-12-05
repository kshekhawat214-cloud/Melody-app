"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Music, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                console.log("User already logged in, redirecting to home...");
                router.replace('/home');
            }
        };
        checkUser();
    }, [router]);

    const handleAuth = async (e) => {
        e.preventDefault();
        console.log("handleAuth called. isSignUp:", isSignUp);
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                console.log("Attempting sign up with:", email, displayName);
                if (!displayName.trim()) throw new Error("Listener Name is required");

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: displayName,
                        },
                    },
                });
                console.log("Sign up result:", data, error);
                if (error) throw error;
                if (data?.user && data?.user?.identities?.length === 0) {
                    throw new Error("User already registered");
                }
                // Profile creation is handled by the SQL trigger
            } else {
                console.log("Attempting sign in with:", email);
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                console.log("Sign in result:", error);
                if (error) throw error;
            }
            console.log("Auth successful, redirecting...");
            router.push('/');
            router.refresh();
        } catch (err) {
            console.error("Auth error:", err);
            if (err.message.includes("User already registered") || err.message.includes("already registered")) {
                setError("This email is already registered. Please log in instead.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-black to-black z-0" />
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-neutral-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/20">
                        <Music className="w-8 h-8 text-black fill-black" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Melody</h1>
                    <p className="text-neutral-400 mt-2">
                        {isSignUp ? "Create your listener profile" : "Welcome back, listener"}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {isSignUp && (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Listener Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="e.g. StarLord"
                                className="w-full bg-neutral-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                                required={isSignUp}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-neutral-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-neutral-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-6"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            isSignUp ? "Create Account" : "Log In"
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-neutral-400 text-sm">
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-white font-medium hover:underline focus:outline-none"
                        >
                            {isSignUp ? "Log in" : "Sign up"}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
