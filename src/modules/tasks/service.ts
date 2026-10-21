import "server-only";
import { getWedding } from "@/modules/weddings/service";
import { taskDTO } from "./dto";
import * as repository from "./repository";
import type { TaskInput, TaskUpdate, TaskFilters } from "./schema";
function validId(id: string) {
  if (!/^[a-f\d]{24}$/i.test(id)) throw repository.missingTask();
}
export async function listTasks(
  userId: string,
  weddingId: string,
  filters: TaskFilters,
) {
  await getWedding(userId, weddingId);
  const rows = await repository.listRecords(weddingId, filters);
  const more = rows.length > filters.limit;
  const data = rows.slice(0, filters.limit).map(taskDTO);
  return { data, nextCursor: more ? data.at(-1)!.id : null };
}
export async function getTask(
  userId: string,
  weddingId: string,
  taskId: string,
) {
  await getWedding(userId, weddingId);
  validId(taskId);
  const row = await repository.getRecord(weddingId, taskId);
  if (!row) throw repository.missingTask();
  return taskDTO(row);
}
export async function createTask(
  userId: string,
  weddingId: string,
  input: TaskInput,
) {
  await getWedding(userId, weddingId);
  return taskDTO(await repository.createRecord(userId, weddingId, input));
}
export async function updateTask(
  userId: string,
  weddingId: string,
  taskId: string,
  input: TaskUpdate,
) {
  await getWedding(userId, weddingId);
  validId(taskId);
  return taskDTO(
    await repository.updateRecord(userId, weddingId, taskId, input),
  );
}
export async function deleteTask(
  userId: string,
  weddingId: string,
  taskId: string,
) {
  await getWedding(userId, weddingId);
  validId(taskId);
  await repository.deleteRecord(userId, weddingId, taskId);
}
export async function taskContext(userId: string, weddingId: string) {
  await getWedding(userId, weddingId);
  return {
    options: await repository.options(weddingId),
    summary: await repository.summary(weddingId),
  };
}
