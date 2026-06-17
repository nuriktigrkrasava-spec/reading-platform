import Link from "next/link";
import { getStudentId } from "@/lib/auth/student";
import { partsWithStatus, type PartWithStatus } from "@/lib/db/studentRepo";
import LoadingScreen from "@/components/student/LoadingScreen";
import {
  ChevronLeft,
  ChevronRight,
  CheckIcon,
  ClockIcon,
  LockIcon,
  BookIcon,
} from "@/components/student/icons";
import styles from "../../app.module.css";

export const dynamic = "force-dynamic";

function PartIcon({ status, unlocked }: { status: PartWithStatus["status"]; unlocked: boolean }) {
  if (status === "completed")
    return <span className={`${styles.partIcon} ${styles.iconDone}`}><CheckIcon /></span>;
  if (status === "pending_review")
    return <span className={`${styles.partIcon} ${styles.iconReview}`}><ClockIcon /></span>;
  if (!unlocked)
    return <span className={styles.partIcon}><LockIcon /></span>;
  return <span className={`${styles.partIcon} ${styles.iconOpen}`}><BookIcon /></span>;
}

function PartTail({ status, unlocked }: { status: PartWithStatus["status"]; unlocked: boolean }) {
  if (!unlocked)
    return <span className={`${styles.pill} ${styles.pillLocked}`}>Жабық</span>;
  if (status === "completed")
    return <span className={`${styles.pill} ${styles.pillOk}`}>Дайын</span>;
  if (status === "pending_review")
    return <span className={`${styles.pill} ${styles.pillReview}`}>Тексеруде</span>;
  return <span className={styles.partTail}><ChevronRight /></span>;
}

export default async function BookPartsPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const studentId = await getStudentId();
  if (!studentId) return <LoadingScreen />;

  const parts = await partsWithStatus(studentId, bookId);

  return (
    <div className={styles.shell}>
      <Link href="/app" className={styles.back}>
        <ChevronLeft />
        Барлық кітаптар
      </Link>

      <header className={styles.header}>
        <span className={styles.eyebrow}>Мазмұны</span>
        <h1 className={styles.title}>Кітап бөлімдері</h1>
        <p className={styles.subtitle}>Бөлімдерді ретімен ашыңыз</p>
      </header>

      {parts.length === 0 ? (
        <div className={styles.notice}>Бұл кітапта әзірге бөлім жоқ</div>
      ) : (
        <div className={styles.partList}>
          {parts.map(({ part, status, unlocked }) => {
            const interactive = unlocked;
            const inner = (
              <>
                <PartIcon status={status} unlocked={unlocked} />
                <div className={styles.partBody}>
                  <span className={styles.partOrder}>{part.order}-бөлім</span>
                  <span className={styles.partTitle}>{part.title}</span>
                </div>
                <PartTail status={status} unlocked={unlocked} />
              </>
            );
            if (interactive) {
              return (
                <Link
                  key={part.id}
                  href={`/app/books/${bookId}/parts/${part.id}`}
                  className={`${styles.partRow} ${styles.partRowLink}`}
                >
                  {inner}
                </Link>
              );
            }
            return (
              <div key={part.id} className={`${styles.partRow} ${styles.partLocked}`}>
                {inner}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
