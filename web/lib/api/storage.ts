import { clientAPI } from ".";
import { IFile } from "../uploader/type";
import { GenericAPIResponse } from "./type";

export const saveFileRequest = <T = unknown>(token: string, payload: IFile) => {
  return clientAPI(token).post<GenericAPIResponse<IFile>>(
    `/storage/save-file`,
    payload,
  );
};
