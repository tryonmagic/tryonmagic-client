import { clientAPI } from ".";
import { GenericAPIResponse, NewTask, Task, ProductImageEditTaskInput } from "./type";

export const createProductImageEditTask = (token: string, taskInput: NewTask<ProductImageEditTaskInput>) => {
  return clientAPI(token).post<GenericAPIResponse<Task<ProductImageEditTaskInput>>>(
    "tasks/new",
    taskInput,
  );
}; 