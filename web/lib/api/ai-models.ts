import { clientAPI } from ".";
import { AIModel, CreateAIModel, Garment, GenericAPIResponse } from "./type";

export const generateAIModel = (token: string, aiModel: CreateAIModel) => {
  return clientAPI(token).post<GenericAPIResponse<AIModel>>(
    "ai-models",
    aiModel,
  );
};

export const getAIModels = async (token: string) => {
  const response =
    await clientAPI(token).get<GenericAPIResponse<AIModel[]>>("ai-models");
  return response.data.data;
};

export const getGarments = async (token: string) => {
  const response =
    await clientAPI(token).get<GenericAPIResponse<Garment[]>>("garments");
  return response.data.data;
};
