import { clientAPI } from ".";
import {
  AIModel,
  CreateAIModel,
  Garment,
  GenericAPIResponse,
  SuccessWithPaginationResponse,
} from "./type";

export const generateAIModel = (token: string, aiModel: CreateAIModel) => {
  return clientAPI(token).post<GenericAPIResponse<AIModel>>(
    "ai-models",
    aiModel,
  );
};

export const getAIModels = async (
  token: string,
  page: number,
  pageSize: number,
) => {
  const response = await clientAPI(token).get<
    SuccessWithPaginationResponse<AIModel>
  >("ai-models", {
    params: {
      page,
      pageSize,
    },
  });
  return response.data;
};

export const getGarments = async (token: string) => {
  const response =
    await clientAPI(token).get<GenericAPIResponse<Garment[]>>("garments");
  return response.data.data;
};
