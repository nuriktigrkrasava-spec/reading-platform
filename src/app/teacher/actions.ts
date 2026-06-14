"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkPassword, startSession, endSession, isAuthenticated } from "@/lib/auth/teacher";
import * as books from "@/lib/db/books";
import * as parts from "@/lib/db/parts";
import * as questions from "@/lib/db/questions";
import * as students from "@/lib/db/students";
import * as grading from "@/lib/db/grading";

async function requireAuth() {
  if (!(await isAuthenticated())) redirect("/teacher/login");
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) return { error: "Неверный пароль" };
  await startSession();
  redirect("/teacher");
}

export async function logoutAction() {
  await endSession();
  redirect("/teacher/login");
}

export async function createBookAction(formData: FormData) {
  await requireAuth();
  await books.createBook({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
  });
  revalidatePath("/teacher/books");
}

export async function deleteBookAction(formData: FormData) {
  await requireAuth();
  await books.deleteBook(String(formData.get("bookId")));
  revalidatePath("/teacher/books");
}

export async function createPartAction(formData: FormData) {
  await requireAuth();
  const bookId = String(formData.get("bookId"));
  const order = await parts.nextPartOrder(bookId);
  await parts.createPart({
    bookId, order,
    title: String(formData.get("title") ?? ""),
    readingText: String(formData.get("readingText") ?? ""),
  });
  revalidatePath(`/teacher/books/${bookId}`);
}

export async function updatePartAction(formData: FormData) {
  await requireAuth();
  const bookId = String(formData.get("bookId"));
  await parts.updatePart(String(formData.get("partId")), {
    title: String(formData.get("title") ?? ""),
    readingText: String(formData.get("readingText") ?? ""),
  });
  revalidatePath(`/teacher/books/${bookId}`);
}

export async function deletePartAction(formData: FormData) {
  await requireAuth();
  const bookId = String(formData.get("bookId"));
  await parts.deletePart(String(formData.get("partId")));
  revalidatePath(`/teacher/books/${bookId}`);
}

export async function createQuestionAction(formData: FormData) {
  await requireAuth();
  const type = String(formData.get("type")) as "choice" | "open";
  const partId = String(formData.get("partId"));
  const bookId = String(formData.get("bookId"));
  const optionsRaw = String(formData.get("options") ?? "");
  const options = type === "choice"
    ? optionsRaw.split("\n").map((s) => s.trim()).filter(Boolean) : [];
  const correctOptionIndex = type === "choice"
    ? Number(formData.get("correctOptionIndex") ?? 0) : null;
  await questions.createQuestion({
    partId, type,
    text: String(formData.get("text") ?? ""),
    points: Number(formData.get("points") ?? 1),
    options, correctOptionIndex,
  });
  revalidatePath(`/teacher/books/${bookId}/parts/${partId}`);
}

export async function deleteQuestionAction(formData: FormData) {
  await requireAuth();
  const bookId = String(formData.get("bookId"));
  const partId = String(formData.get("partId"));
  await questions.deleteQuestion(String(formData.get("questionId")));
  revalidatePath(`/teacher/books/${bookId}/parts/${partId}`);
}

export async function enrollAction(formData: FormData) {
  await requireAuth();
  await students.enroll(String(formData.get("studentId")), String(formData.get("bookId")));
  revalidatePath("/teacher/students");
}

export async function unenrollAction(formData: FormData) {
  await requireAuth();
  await students.unenroll(String(formData.get("studentId")), String(formData.get("bookId")));
  revalidatePath("/teacher/students");
}

export async function gradeAction(formData: FormData) {
  await requireAuth();
  await grading.gradeAnswer({
    answerId: String(formData.get("answerId")),
    awardedPoints: Number(formData.get("awardedPoints") ?? 0),
    comment: String(formData.get("comment") ?? ""),
  });
  revalidatePath("/teacher/grading");
}
