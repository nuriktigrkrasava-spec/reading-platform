import Link from "next/link";
import { listBooks } from "@/lib/db/books";
import { createBookAction, deleteBookAction } from "@/app/teacher/actions";
import PageHeader from "@/components/teacher/PageHeader";
import SubmitButton from "@/components/teacher/SubmitButton";
import { levelLabel } from "@/lib/options";
import styles from "./books.module.css";

export const dynamic = "force-dynamic";

export default async function BooksPage() {
  const books = await listBooks();

  return (
    <>
      <PageHeader
        eyebrow="Кітапхана"
        title="Кітаптар"
        description="Платформа кітаптарын басқарыңыз: шығармаларды қосып, оларды оқуға арналған бөлімдерге бөліңіз."
      />

      <div className={styles.layout}>
        <div className={styles.list}>
          {books.length === 0 ? (
            <div className="t-empty">
              Әзірге бірде-бір кітап жоқ. Оң жақтан алғашқысын жасаңыз.
            </div>
          ) : (
            books.map((book) => (
              <article key={book.id} className={styles.bookCard}>
                <Link
                  href={`/teacher/books/${book.id}`}
                  className={styles.spine}
                  aria-hidden
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                  </svg>
                </Link>

                <div className={styles.bookBody}>
                  <Link
                    href={`/teacher/books/${book.id}`}
                    className={styles.bookTitleLink}
                  >
                    {book.title}
                  </Link>
                  <span className="t-chip t-chip-clay" style={{ marginTop: 6 }}>
                    {levelLabel(book.level)}
                  </span>
                  {book.description && (
                    <p className={styles.bookDesc}>{book.description}</p>
                  )}
                  <div className={styles.bookFoot}>
                    <Link
                      href={`/teacher/books/${book.id}`}
                      className={styles.openLink}
                    >
                      Ашу және өңдеу
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <form action={deleteBookAction}>
                    <input type="hidden" name="bookId" value={book.id} />
                    <SubmitButton
                      className="t-btn t-btn-danger t-btn-sm"
                      pendingText="Жойылуда…"
                    >
                      Жою
                    </SubmitButton>
                  </form>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className={styles.aside}>
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>Жаңа кітап</h2>
            <p className={styles.formHint}>
              Шығарманың атауы мен қысқаша сипаттамасын қосыңыз.
            </p>
            <form action={createBookAction} className={styles.form}>
              <div>
                <label htmlFor="title" className="t-label">
                  Атауы
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  className="t-input"
                  placeholder="Мысалы, «Менің атым Қожа»"
                />
              </div>
              <div>
                <label htmlFor="level" className="t-label">
                  Деңгей
                </label>
                <input
                  id="level"
                  name="level"
                  type="number"
                  min={1}
                  defaultValue={books.length + 1}
                  required
                  className="t-input"
                />
              </div>
              <div>
                <label htmlFor="description" className="t-label">
                  Сипаттама
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="t-textarea"
                  placeholder="Бұл кітап не туралы және кімге арналған"
                />
              </div>
              <div className={styles.formActions}>
                <SubmitButton
                  className="t-btn t-btn-primary"
                  pendingText="Жасалуда…"
                >
                  Кітап қосу
                </SubmitButton>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}
