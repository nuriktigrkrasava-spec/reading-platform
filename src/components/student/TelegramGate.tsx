"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/app/app.module.css";

type GateState = "checking" | "no-telegram" | "ready";

export default function TelegramGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<GateState>("checking");

  useEffect(() => {
    let cancelled = false;
    const wa = window.Telegram?.WebApp;
    wa?.ready();

    const initData = wa?.initData;
    if (!initData) {
      // Opened outside Telegram (or no init data) — show guidance,
      // but still render children so a pre-existing cookie session works.
      setState("no-telegram");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/student/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });
        const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
        if (cancelled) return;
        if (data?.ok) {
          setState("ready");
          router.refresh();
        } else {
          setState("no-telegram");
        }
      } catch {
        if (!cancelled) setState("no-telegram");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state === "checking") {
    return (
      <div className={styles.center}>
        <div className={styles.centerInner}>
          <div className={styles.spinner} />
          <p className={styles.centerText}>Загрузка…</p>
        </div>
      </div>
    );
  }

  if (state === "no-telegram") {
    return (
      <div className={styles.center}>
        <div className={styles.centerInner}>
          <div className={styles.centerTitle}>Откройте приложение из Telegram</div>
          <p className={styles.centerText}>
            Чтобы продолжить, запустите приложение через бота в Telegram на телефоне.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
