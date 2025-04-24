import { clientAPI } from ".";
import { GenericAPIResponse, NewTask, Task } from "./type";

export const newTask = <T = unknown>(token: string, newTask: NewTask<T>) => {
  return clientAPI(token).post<GenericAPIResponse<Task<T>>>(
    "tasks/new",
    newTask,
  );
};
