"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setGradeAction } from "@/app/app/actions";
import { GRADES } from "@/lib/options";
import styles from "@/app/app/app.module.css";

export default function ClassPicker() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [picking, setPicking] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function choose(grade: number) {
    setError(null);
    setPicking(grade);
    startTransition(async () => {
      const res = await setGradeAction(grade);
      if (res.ok) {
        router.refresh();
      } else {
        setError("Сақтау мүмкін болмады. Қайта көріңіз");
        setPicking(null);
      }
    });
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Қош келдіңіз</span>
        <h1 className={styles.title}>Қай сыныптасыз?</h1>
        <p className={styles.subtitle}>
          Сыныбыңызды таңдаңыз — біз сізге сай кітаптар мен тестерді көрсетеміз
        </p>
      </header>

      <div className={styles.classGrid}>
        {GRADES.map((grade) => (
          <button
            key={grade}
            type="button"
            className={styles.classCard}
            disabled={pending}
            onClick={() => choose(grade)}
          >
            <span className={styles.classNum}>{grade}</span>
            <span className={styles.classWord}>
              {picking === grade && pending ? "Сақталуда…" : "сынып"}
            </span>
          </button>
        ))}
      </div>

      {error ? <div className={styles.notice}>{error}</div> : null}
    </div>
  );
}
