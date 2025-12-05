"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { languages } from '@/lib/data';
import { usePlayer } from '@/context/PlayerContext';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const router = useRouter();
  const { userPreferences, setUserPreferences } = usePlayer();
  const [selectedLanguages, setSelectedLanguages] = useState([]);

  // Check if user already has preferences, if so redirect to home
  useEffect(() => {
    if (userPreferences.languages.length > 0) {
      router.push('/home');
    }
  }, [userPreferences, router]);

  const toggleLanguage = (langId) => {
    setSelectedLanguages(prev =>
      prev.includes(langId)
        ? prev.filter(id => id !== langId)
        : [...prev, langId]
    );
  };

  const handleContinue = () => {
    setUserPreferences(prev => ({ ...prev, languages: selectedLanguages }));
    router.push('/home');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full space-y-12 text-center"
      >
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">
            Welcome to Melody
          </h1>
          <p className="text-xl text-neutral-400">
            Select the languages you listen to. We&apos;ll curate the best music for you.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {languages.map((lang) => {
            const isSelected = selectedLanguages.includes(lang.id);
            return (
              <motion.button
                key={lang.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleLanguage(lang.id)}
                className={cn(
                  "relative h-32 rounded-xl p-6 flex items-end justify-start text-xl font-bold transition-all overflow-hidden group",
                  "bg-gradient-to-br",
                  lang.color,
                  isSelected ? "ring-4 ring-white" : "opacity-80 hover:opacity-100"
                )}
              >
                <span className="relative z-10 text-white">{lang.name}</span>
                {isSelected && (
                  <div className="absolute top-4 right-4 bg-white text-black rounded-full p-1">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleContinue}
          disabled={selectedLanguages.length === 0}
          className={cn(
            "px-12 py-4 rounded-full font-bold text-lg transition-all",
            selectedLanguages.length > 0
              ? "bg-white text-black hover:bg-neutral-200"
              : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
          )}
        >
          Start Listening
        </motion.button>
      </motion.div>
    </div>
  );
}
