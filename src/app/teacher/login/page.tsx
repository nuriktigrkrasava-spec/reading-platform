"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/teacher/actions";
import SubmitButton from "@/components/teacher/SubmitButton";
import styles from "./login.module.css";

type State = { error: string } | null;

async function action(_prev: State, formData: FormData): Promise<State> {
  const result = await loginAction(formData);
  return result ?? null;
}

export default function LoginPage() {
  const [state, formAction] = useActionState<State, FormData>(action, null);

  return (
    <div className={styles.screen}>
      <section className={styles.aside}>
        <div className={styles.asideTop}>
          <span className={styles.mark}>Ч</span>
          <span className={styles.asideBrand}>Читальня</span>
        </div>
        <div className={styles.asideBody}>
          <p className={styles.asideQuote}>
            Каждая прочитанная страница — это шаг ученика навстречу себе.
          </p>
        </div>
        <p className={styles.asideMeta}>Кабинет преподавателя</p>
      </section>

      <section className={styles.panel}>
        <div className={styles.card}>
          <span className={styles.eyebrow}>Вход в кабинет</span>
          <h1 className={styles.title}>С возвращением</h1>
          <p className={styles.lead}>
            Введите пароль преподавателя, чтобы продолжить работу с платформой.
          </p>

          <form action={formAction} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="password" className="t-label">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                required
                className="t-input"
                placeholder="••••••••"
              />
            </div>

            {state?.error && (
              <p className={styles.error} role="alert">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {state.error}
              </p>
            )}

            <SubmitButton
              className={`t-btn t-btn-primary ${styles.submit}`}
              pendingText="Проверяем…"
            >
              Войти
            </SubmitButton>
          </form>
        </div>
      </section>
    </div>
  );
}
