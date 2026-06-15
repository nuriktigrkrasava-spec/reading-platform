import Link from "next/link";
import { getStudentId } from "@/lib/auth/student";
import { getStudent } from "@/lib/db/students";
import { booksForGradeWithProgress } from "@/lib/db/studentRepo";
import { gradeLabel } from "@/lib/options";
import { pluralWith } from "@/lib/plural";
import LoadingScreen from "@/components/student/LoadingScreen";
import ClassPicker from "@/components/student/ClassPicker";
import { ChevronRight } from "@/components/student/icons";
import styles from "./app.module.css";

export const dynamic = "force-dynamic";

export default async function StudentHomePage() {
  const studentId = await getStudentId();
  if (!studentId) return <LoadingScreen />;

  const student = await getStudent(studentId);
  if (!student) return <LoadingScreen />;

  // Класс не выбран — показываем экран выбора класса.
  if (student.grade == null) return <ClassPicker />;

  const enrolled = await booksForGradeWithProgress(studentId, student.grade);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{gradeLabel(student.grade)} · мои книги</span>
        <h1 className={styles.title}>Читальня</h1>
        <p className={styles.subtitle}>Продолжайте с того места, где остановились</p>
      </header>

      {enrolled.length === 0 ? (
        <div className={styles.notice}>
          <span className={styles.noticeIcon}>📚</span>
          Для {gradeLabel(student.grade).toLowerCase()} пока нет книг. Загляните позже
        </div>
      ) : (
        <div className={styles.cardList}>
          {enrolled.map(({ book, progress }) => (
            <Link key={book.id} href={`/app/books/${book.id}`} className={styles.bookCard}>
              <div className={styles.bookTop}>
                <div>
                  <div className={styles.bookTitle}>{book.title}</div>
                  {book.description ? (
                    <div className={styles.bookDesc}>{book.description}</div>
                  ) : null}
                </div>
                <ChevronRight className={styles.chevron} />
              </div>
              <div className={styles.progress}>
                <div className={styles.progressMeta}>
                  <span>
                    Пройдено{" "}
                    {pluralWith(progress.completedParts, "часть", "части", "частей")}
                  </span>
                  <span className={styles.progressPercent}>{progress.percent}%</span>
                </div>
                <div className={styles.bar}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link href="/app/progress" className={styles.back} style={{ marginTop: 4 }}>
        Мой прогресс
        <ChevronRight />
      </Link>
    </div>
  );
}
