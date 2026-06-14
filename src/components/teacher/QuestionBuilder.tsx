"use client";

import { useState } from "react";
import { createQuestionAction } from "@/app/teacher/actions";
import SubmitButton from "@/components/teacher/SubmitButton";
import styles from "./QuestionBuilder.module.css";

export default function QuestionBuilder({
  bookId,
  partId,
}: {
  bookId: string;
  partId: string;
}) {
  const [type, setType] = useState<"choice" | "open">("choice");

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Новый вопрос</h2>
      <p className={styles.hint}>
        Выберите тип вопроса и заполните поля. Вопрос добавится в тест этой
        части.
      </p>

      <form action={createQuestionAction} className={styles.form}>
        <input type="hidden" name="bookId" value={bookId} />
        <input type="hidden" name="partId" value={partId} />

        <div>
          <span className="t-label">Тип вопроса</span>
          <div className={styles.typeToggle}>
            <label
              className={`${styles.typeOption} ${
                type === "choice" ? styles.typeOptionActive : ""
              }`}
            >
              <input
                type="radio"
                name="type"
                value="choice"
                checked={type === "choice"}
                onChange={() => setType("choice")}
              />
              <span className={styles.typeName}>С вариантами</span>
              <span className={styles.typeDesc}>Один правильный ответ</span>
            </label>
            <label
              className={`${styles.typeOption} ${
                type === "open" ? styles.typeOptionActive : ""
              }`}
            >
              <input
                type="radio"
                name="type"
                value="open"
                checked={type === "open"}
                onChange={() => setType("open")}
              />
              <span className={styles.typeName}>Открытый</span>
              <span className={styles.typeDesc}>Ответ проверяет учитель</span>
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="qtext" className="t-label">
            Текст вопроса
          </label>
          <textarea
            id="qtext"
            name="text"
            required
            rows={3}
            className="t-textarea"
            placeholder="Сформулируйте вопрос"
          />
        </div>

        {type === "choice" && (
          <div className={styles.optionsBlock}>
            <label htmlFor="options" className="t-label">
              Варианты ответа
            </label>
            <textarea
              id="options"
              name="options"
              rows={4}
              className="t-textarea"
              placeholder={"Каждый вариант — с новой строки\nВариант 1\nВариант 2\nВариант 3"}
            />
            <p className={styles.optionsHint}>
              По одному варианту в строке. Нумерация для правильного ответа
              начинается с 0 (первый вариант — 0).
            </p>
          </div>
        )}

        <div className={styles.row}>
          {type === "choice" ? (
            <div>
              <label htmlFor="correctOptionIndex" className="t-label">
                Правильный (№)
              </label>
              <input
                id="correctOptionIndex"
                name="correctOptionIndex"
                type="number"
                min={0}
                defaultValue={0}
                className="t-input"
              />
            </div>
          ) : (
            <div />
          )}
          <div>
            <label htmlFor="points" className="t-label">
              Баллы
            </label>
            <input
              id="points"
              name="points"
              type="number"
              min={1}
              defaultValue={1}
              required
              className="t-input"
            />
          </div>
        </div>

        <div>
          <SubmitButton className="t-btn t-btn-primary" pendingText="Добавляем…">
            Добавить вопрос
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
