import Link from "next/link";
import { notFound } from "next/navigation";
import { listBooks } from "@/lib/db/books";
import { listParts } from "@/lib/db/parts";
import { createPartAction } from "@/app/teacher/actions";
import PageHeader from "@/components/teacher/PageHeader";
import SubmitButton from "@/components/teacher/SubmitButton";
import PartItem from "@/components/teacher/PartItem";
import styles from "./book.module.css";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const [books, parts] = await Promise.all([listBooks(), listParts(bookId)]);
  const book = books.find((b) => b.id === bookId);
  if (!book) notFound();

  return (
    <>
      <PageHeader
        eyebrow="Книга"
        title={book.title}
        description={book.description || undefined}
        back={
          <Link href="/teacher/books" className="t-btn t-btn-ghost t-btn-sm">
            ← К списку книг
          </Link>
        }
      />

      <div className={styles.layout}>
        <div className={styles.parts}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>Части книги</span>
            <span className={styles.count}>
              {parts.length}{" "}
              {parts.length === 1
                ? "часть"
                : parts.length >= 2 && parts.length <= 4
                  ? "части"
                  : "частей"}
            </span>
          </div>

          {parts.length === 0 ? (
            <div className="t-empty">
              В этой книге ещё нет частей. Добавьте первую справа.
            </div>
          ) : (
            parts.map((part) => <PartItem key={part.id} part={part} />)
          )}
        </div>

        <aside className={styles.aside}>
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>Новая часть</h2>
            <p className={styles.formHint}>
              Часть добавится следующей по порядку. Текст можно отредактировать
              позже.
            </p>
            <form action={createPartAction} className={styles.form}>
              <input type="hidden" name="bookId" value={book.id} />
              <div>
                <label htmlFor="title" className="t-label">
                  Название части
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  className="t-input"
                  placeholder="Глава 1. Знакомство"
                />
              </div>
              <div>
                <label htmlFor="readingText" className="t-label">
                  Текст для чтения
                </label>
                <textarea
                  id="readingText"
                  name="readingText"
                  rows={7}
                  className="t-textarea"
                  placeholder="Вставьте текст части, который прочитают ученики"
                />
              </div>
              <div>
                <SubmitButton
                  className="t-btn t-btn-primary"
                  pendingText="Добавляем…"
                >
                  Добавить часть
                </SubmitButton>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}
