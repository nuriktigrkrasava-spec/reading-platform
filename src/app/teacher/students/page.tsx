import { listStudents, listEnrolledBookIds } from "@/lib/db/students";
import { listBooks } from "@/lib/db/books";
import { enrollAction, unenrollAction } from "@/app/teacher/actions";
import PageHeader from "@/components/teacher/PageHeader";
import SubmitButton from "@/components/teacher/SubmitButton";
import styles from "./students.module.css";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default async function StudentsPage() {
  const [students, books] = await Promise.all([listStudents(), listBooks()]);
  const enrolledByStudent = await Promise.all(
    students.map((s) => listEnrolledBookIds(s.id)),
  );
  const bookById = new Map(books.map((b) => [b.id, b]));

  return (
    <>
      <PageHeader
        eyebrow="Сообщество"
        title="Ученики"
        description="Список учеников платформы. Записывайте их на книги и управляйте доступом к материалам."
      />

      {students.length === 0 ? (
        <div className="t-empty">
          Учеников пока нет. Они появятся здесь после регистрации в боте.
        </div>
      ) : (
        <div className={styles.grid}>
          {students.map((student, idx) => {
            const enrolledIds = enrolledByStudent[idx];
            const enrolledSet = new Set(enrolledIds);
            const available = books.filter((b) => !enrolledSet.has(b.id));

            return (
              <article key={student.id} className={styles.card}>
                <div className={styles.head}>
                  <span className={styles.avatar}>
                    {initials(student.name)}
                  </span>
                  <div>
                    <h2 className={styles.name}>{student.name}</h2>
                    <div className={styles.tg}>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 2L11 13" />
                        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                      {student.telegramId}
                    </div>
                  </div>
                </div>

                <div className={styles.block}>
                  <p className={styles.blockTitle}>Записан на книги</p>
                  {enrolledIds.length === 0 ? (
                    <p className={styles.emptyEnrolled}>Пока ни на одну книгу.</p>
                  ) : (
                    <div className={styles.enrolled}>
                      {enrolledIds.map((bookId) => {
                        const book = bookById.get(bookId);
                        return (
                          <div key={bookId} className={styles.enrolledItem}>
                            <span className={styles.enrolledTitle}>
                              {book?.title ?? "Книга удалена"}
                            </span>
                            <form action={unenrollAction}>
                              <input
                                type="hidden"
                                name="studentId"
                                value={student.id}
                              />
                              <input type="hidden" name="bookId" value={bookId} />
                              <button
                                type="submit"
                                className={styles.unenrollBtn}
                              >
                                Отписать
                              </button>
                            </form>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={styles.block}>
                  <p className={styles.blockTitle}>Записать на книгу</p>
                  {available.length === 0 ? (
                    <p className={styles.emptyEnrolled}>
                      Доступных книг для записи нет.
                    </p>
                  ) : (
                    <form action={enrollAction} className={styles.enrollForm}>
                      <input
                        type="hidden"
                        name="studentId"
                        value={student.id}
                      />
                      <select name="bookId" required className="t-select">
                        {available.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title}
                          </option>
                        ))}
                      </select>
                      <SubmitButton
                        className="t-btn t-btn-primary t-btn-sm"
                        pendingText="…"
                      >
                        Записать
                      </SubmitButton>
                    </form>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
