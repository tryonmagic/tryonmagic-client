import { clientAPI } from ".";
import { AIModel, CreateAIModel, GenericAPIResponse } from "./type";

export const generateAIModel = (token: string, aiModel: CreateAIModel) => {
  return clientAPI(token).post<GenericAPIResponse<AIModel>>(
    "ai-models",
    aiModel,
  );
};
