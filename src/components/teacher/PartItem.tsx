"use client";

import { useState } from "react";
import Link from "next/link";
import type { Part } from "@/lib/types";
import { updatePartAction, deletePartAction } from "@/app/teacher/actions";
import SubmitButton from "@/components/teacher/SubmitButton";
import styles from "@/app/teacher/books/[bookId]/book.module.css";

export default function PartItem({ part }: { part: Part }) {
  const [editing, setEditing] = useState(false);

  return (
    <article className={styles.part}>
      <div className={styles.partTop}>
        <span className={styles.order}>{part.order}</span>
        <div className={styles.partMain}>
          <h3 className={styles.partTitle}>{part.title}</h3>
          {part.readingText && (
            <p className={styles.partText}>{part.readingText}</p>
          )}

          <div className={styles.partActions}>
            <Link
              href={`/teacher/books/${part.bookId}/parts/${part.id}`}
              className={styles.builderLink}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              Конструктор теста
            </Link>

            <button
              type="button"
              className="t-btn t-btn-ghost t-btn-sm"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Отмена" : "Изменить"}
            </button>

            <form action={deletePartAction}>
              <input type="hidden" name="bookId" value={part.bookId} />
              <input type="hidden" name="partId" value={part.id} />
              <SubmitButton
                className="t-btn t-btn-danger t-btn-sm"
                pendingText="Удаление…"
              >
                Удалить
              </SubmitButton>
            </form>
          </div>
        </div>
      </div>

      {editing && (
        <form action={updatePartAction} className={styles.editForm}>
          <input type="hidden" name="bookId" value={part.bookId} />
          <input type="hidden" name="partId" value={part.id} />
          <div>
            <label className="t-label" htmlFor={`title-${part.id}`}>
              Название части
            </label>
            <input
              id={`title-${part.id}`}
              name="title"
              defaultValue={part.title}
              required
              className="t-input"
            />
          </div>
          <div>
            <label className="t-label" htmlFor={`text-${part.id}`}>
              Текст для чтения
            </label>
            <textarea
              id={`text-${part.id}`}
              name="readingText"
              defaultValue={part.readingText}
              rows={6}
              className="t-textarea"
            />
          </div>
          <div className={styles.editActions}>
            <SubmitButton className="t-btn t-btn-primary t-btn-sm">
              Сохранить
            </SubmitButton>
            <button
              type="button"
              className="t-btn t-btn-ghost t-btn-sm"
              onClick={() => setEditing(false)}
            >
              Отмена
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
