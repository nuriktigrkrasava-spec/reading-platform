import Link from "next/link";
import { notFound } from "next/navigation";
import { listBooks } from "@/lib/db/books";
import { listParts } from "@/lib/db/parts";
import { createPartAction, updateBookAction } from "@/app/teacher/actions";
import PageHeader from "@/components/teacher/PageHeader";
import SubmitButton from "@/components/teacher/SubmitButton";
import PartItem from "@/components/teacher/PartItem";
import { GRADES, gradeLabel } from "@/lib/options";
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
        eyebrow="Кітап"
        title={book.title}
        description={book.description || undefined}
        back={
          <Link href="/teacher/books" className="t-btn t-btn-ghost t-btn-sm">
            ← Кітаптар тізіміне
          </Link>
        }
      />

      <div className={styles.layout}>
        <div className={styles.parts}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionTitle}>Кітап бөлімдері</span>
            <span className={styles.count}>{parts.length} бөлім</span>
          </div>

          {parts.length === 0 ? (
            <div className="t-empty">
              Бұл кітапта әзірге бөлім жоқ. Оң жақтан алғашқысын қосыңыз.
            </div>
          ) : (
            parts.map((part) => <PartItem key={part.id} part={part} />)
          )}
        </div>

        <aside className={styles.aside}>
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>Кітап сыныбы</h2>
            <p className={styles.formHint}>
              Кітапты осы сыныпты таңдаған оқушылар көреді.
            </p>
            <form action={updateBookAction} className={styles.form}>
              <input type="hidden" name="bookId" value={book.id} />
              <input type="hidden" name="title" value={book.title} />
              <input type="hidden" name="description" value={book.description} />
              <div>
                <label htmlFor="grade" className="t-label">
                  Қай сыныпқа арналған
                </label>
                <select
                  id="grade"
                  name="grade"
                  required
                  className="t-select"
                  defaultValue={book.grade}
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {gradeLabel(g)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <SubmitButton
                  className="t-btn t-btn-primary t-btn-sm"
                  pendingText="Сақталуда…"
                >
                  Сыныпты сақтау
                </SubmitButton>
              </div>
            </form>
          </div>

          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>Жаңа бөлім</h2>
            <p className={styles.formHint}>
              Бөлім келесі ретпен қосылады. Мәтінді кейінірек өңдеуге болады.
            </p>
            <form action={createPartAction} className={styles.form}>
              <input type="hidden" name="bookId" value={book.id} />
              <div>
                <label htmlFor="title" className="t-label">
                  Бөлім атауы
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  className="t-input"
                  placeholder="1-тарау. Танысу"
                />
              </div>
              <div>
                <label htmlFor="readingText" className="t-label">
                  Оқуға арналған мәтін
                </label>
                <textarea
                  id="readingText"
                  name="readingText"
                  rows={7}
                  className="t-textarea"
                  placeholder="Оқушылар оқитын бөлім мәтінін енгізіңіз"
                />
              </div>
              <div>
                <SubmitButton
                  className="t-btn t-btn-primary"
                  pendingText="Қосылуда…"
                >
                  Бөлім қосу
                </SubmitButton>
              </div>
            </form>
          </div>
        </aside>
      </div>
    </>
  );
}
