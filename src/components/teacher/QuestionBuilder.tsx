"use client";

import { useState } from "react";
import { createQuestionAction } from "@/app/teacher/actions";
import SubmitButton from "@/components/teacher/SubmitButton";
import { optionLetter } from "@/lib/options";
import styles from "./QuestionBuilder.module.css";

const MAX_OPTIONS = 8;
const MIN_OPTIONS = 2;

export default function QuestionBuilder({
  bookId,
  partId,
}: {
  bookId: string;
  partId: string;
}) {
  const [type, setType] = useState<"choice" | "open">("choice");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);

  function setOption(i: number, value: string) {
    setOptions((opts) => opts.map((o, idx) => (idx === i ? value : o)));
  }

  function addOption() {
    setOptions((opts) => (opts.length >= MAX_OPTIONS ? opts : [...opts, ""]));
  }

  function removeOption(i: number) {
    setOptions((opts) => {
      if (opts.length <= MIN_OPTIONS) return opts;
      return opts.filter((_, idx) => idx !== i);
    });
    setCorrectIndex((c) => {
      if (i === c) return 0; // удалили правильный — сбрасываем на первый
      if (i < c) return c - 1; // сдвиг индексов выше удалённого
      return c;
    });
  }

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
            <span className="t-label">Варианты ответа</span>
            <p className={styles.optionsHint}>
              Впишите варианты и нажмите кружок «верный» у правильного.
            </p>

            <div className={styles.optionList}>
              {options.map((opt, i) => {
                const isCorrect = correctIndex === i;
                return (
                  <div
                    key={i}
                    className={`${styles.optionRow} ${
                      isCorrect ? styles.optionRowCorrect : ""
                    }`}
                  >
                    <span className={styles.optionBadge}>{optionLetter(i)}</span>
                    <input
                      type="text"
                      name="option"
                      required
                      className={styles.optionInput}
                      placeholder={`Вариант ${optionLetter(i)}`}
                      value={opt}
                      onChange={(e) => setOption(i, e.target.value)}
                    />
                    <label
                      className={`${styles.correctToggle} ${
                        isCorrect ? styles.correctToggleOn : ""
                      }`}
                      title="Отметить как правильный"
                    >
                      <input
                        type="radio"
                        name="correctOptionIndex"
                        value={i}
                        checked={isCorrect}
                        onChange={() => setCorrectIndex(i)}
                      />
                      <span className={styles.correctDot} />
                      верный
                    </label>
                    {options.length > MIN_OPTIONS && (
                      <button
                        type="button"
                        className={styles.removeOption}
                        onClick={() => removeOption(i)}
                        aria-label="Удалить вариант"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {options.length < MAX_OPTIONS && (
              <button
                type="button"
                className={styles.addOption}
                onClick={addOption}
              >
                + Добавить вариант
              </button>
            )}
          </div>
        )}

        <div>
          <label htmlFor="points" className="t-label">
            Баллы за вопрос
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

        <div>
          <SubmitButton className="t-btn t-btn-primary" pendingText="Добавляем…">
            Добавить вопрос
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
