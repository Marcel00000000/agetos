"use client";

import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      await signIn("google", { callbackUrl: "/agent-control" });
    } catch (err) {
      console.error("Google OAuth sign-in failed", err);
      setError("Nie udało się rozpocząć logowania Google. Spróbuj ponownie.");
    } finally {
      // When redirect happens the component unmounts, otherwise we restore the button state.
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void handleLogin();
    }, 300);

    return () => clearTimeout(timer);
  }, [handleLogin]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#04060e] text-white">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/5 p-10 text-center backdrop-blur-2xl">
        <p className="text-xs uppercase tracking-[0.5em] text-cyan-200">Glass Control</p>
        <h1 className="mt-4 text-3xl font-semibold">CrewAI Command Deck</h1>
        <p className="mt-2 text-sm text-white/70">
          Łączymy Cię z Google OAuth 2.0. Jeżeli nie nastąpi automatyczne przekierowanie w ciągu chwili,
          użyj przycisku poniżej.
        </p>
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        <Button className="mt-8 w-full" onClick={handleLogin} loading={loading}>
          Kontynuuj z Google
        </Button>
      </div>
    </div>
  );
}
