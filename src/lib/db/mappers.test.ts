import { describe, it, expect } from "vitest";
import { bookFromRow, partFromRow, questionFromRow, studentFromRow } from "@/lib/db/mappers";

describe("mappers", () => {
  it("maps book row to domain", () => {
    const b = bookFromRow({
      id: "1", title: "T", description: "D", cover_url: null, grade: 2, created_at: "x",
    });
    expect(b).toEqual({ id: "1", title: "T", description: "D", coverUrl: null, grade: 2 });
  });
  it("maps part row to domain", () => {
    const p = partFromRow({
      id: "1", book_id: "b", order: 2, title: "T", reading_text: "R",
    });
    expect(p).toEqual({ id: "1", bookId: "b", order: 2, title: "T", readingText: "R" });
  });
  it("maps question row to domain", () => {
    const q = questionFromRow({
      id: "1", part_id: "p", type: "choice", text: "T", points: 2,
      options: ["a", "b"], correct_option_index: 1,
    });
    expect(q).toEqual({
      id: "1", partId: "p", type: "choice", text: "T", points: 2,
      options: ["a", "b"], correctOptionIndex: 1,
    });
  });
  it("maps student row to domain", () => {
    const s = studentFromRow({
      id: "1", telegram_id: "123", name: "N", grade: 3, created_at: "x",
    });
    expect(s).toEqual({ id: "1", telegramId: "123", name: "N", grade: 3 });
  });

  it("maps student without chosen grade to null", () => {
    const s = studentFromRow({
      id: "1", telegram_id: "123", name: "N", grade: null, created_at: "x",
    });
    expect(s.grade).toBeNull();
  });
});
