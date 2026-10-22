import "server-only";
import { getWedding } from "@/modules/weddings/service";
import * as repository from "./repository";
import { expenseDTO } from "./dto";
import type { ExpenseInput, ExpenseUpdate, ExpenseFilters } from "./schema";
const validId = (id: string) => {
  if (!/^[a-f\d]{24}$/i.test(id)) throw repository.missingExpense();
};
export async function listExpenses(
  userId: string,
  weddingId: string,
  filters: ExpenseFilters,
) {
  await getWedding(userId, weddingId);
  const rows = await repository.listRecords(weddingId, filters);
  const data = rows.slice(0, filters.limit).map(expenseDTO);
  const last = data.at(-1);
  return {
    data,
    nextCursor:
      rows.length > filters.limit && last
        ? Buffer.from(
            JSON.stringify({ date: last.expenseDate, id: last.id }),
          ).toString("base64url")
        : null,
  };
}
export async function getExpense(
  userId: string,
  weddingId: string,
  expenseId: string,
) {
  await getWedding(userId, weddingId);
  validId(expenseId);
  const row = await repository.getRecord(weddingId, expenseId);
  if (!row) throw repository.missingExpense();
  return expenseDTO(row);
}
export async function createExpense(
  userId: string,
  weddingId: string,
  input: ExpenseInput,
) {
  await getWedding(userId, weddingId);
  return expenseDTO(await repository.createRecord(userId, weddingId, input));
}
export async function updateExpense(
  userId: string,
  weddingId: string,
  expenseId: string,
  input: ExpenseUpdate,
) {
  await getWedding(userId, weddingId);
  validId(expenseId);
  return expenseDTO(
    await repository.updateRecord(userId, weddingId, expenseId, input),
  );
}
export async function deleteExpense(
  userId: string,
  weddingId: string,
  expenseId: string,
) {
  await getWedding(userId, weddingId);
  validId(expenseId);
  await repository.deleteRecord(userId, weddingId, expenseId);
}
export async function expenseSummary(userId: string, weddingId: string) {
  await getWedding(userId, weddingId);
  return repository.summary(weddingId);
}
