import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.screen}>
      <section className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.mark}>Ч</span>
          <span className={styles.brandName}>Читальня</span>
        </div>

        <span className={styles.eyebrow}>Платформа чтения</span>
        <h1 className={styles.title}>Платформа чтения</h1>
        <p className={styles.lead}>
          Учебная среда для осмысленного чтения: преподаватель ведёт занятия и
          проверяет работы, ученики читают и отвечают на задания.
        </p>

        <Link href="/teacher" className={`t-btn t-btn-primary ${styles.cta}`}>
          Вход для учителя
        </Link>

        <p className={styles.note}>
          Ученики открывают платформу через Telegram-бота.
        </p>
      </section>
    </main>
  );
}
