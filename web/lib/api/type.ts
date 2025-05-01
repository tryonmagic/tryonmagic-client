export interface GenericAPIResponse<T = unknown> {
  code: number;
  status: string;
  message: string;
  data?: T | null;
}

export enum ImageSourceType {
  URL = "URL",
  BASE64 = "BASE64",
}
export enum BackgroundSourceType {
  IMAGE = "IMAGE",
  COLOR = "COLOR",
  PROMPT = "PROMPT",
}

export interface RemoveBackgroundTaskInput {
  sourceImage: string;
  imageSourceType: ImageSourceType;
  edgeThreshold: number;
  detailPreservation: boolean;
  enhancedHairDetection: boolean;
}

export interface ReplaceBackgroundTaskInput {
  sourceImageUrl: string;
  backgroundSourceType: BackgroundSourceType;
  backgroundImageSourceType?: ImageSourceType;
  backgroundSourceValue: string;
}

export interface NewTask<T = unknown> {
  type: TaskType;
  inputData: T;
}

export enum TaskStatus {
  PENDING = "PENDING",
  QUEUED = "QUEUED",
  PROCESSING = "PROCESSING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
}

export const TaskStatusMessageMapping = {
  [TaskStatus.PENDING]: "Pending...",
  [TaskStatus.QUEUED]: "Queued",
  [TaskStatus.PROCESSING]: "Processing...",
  [TaskStatus.SUCCEEDED]: "Completed",
  [TaskStatus.FAILED]: "Failed",
};

export enum TaskType {
  REMOVE_BACKGROUND = "REMOVE_BACKGROUND",
  GENERATE_IMAGE = "GENERATE_IMAGE",
  REPLACE_BACKGROUND = "REPLACE_BACKGROUND",
}

export interface Task<T = unknown> {
  id: string;
  type: TaskType;
  status: TaskStatus;
  userId: string;
  inputData: T;
  resultData?: Record<string, any> | null;
  error?: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface TaskProgress<T = unknown> {
  id?: string;
  type?: TaskType;
  status: TaskStatus;
  progress?: number;
  resultData?: {
    outputImageUrl: string;
  } & T;
}

export interface AIModel {
  id: string;
  userId: string;
  aiModelAuthor: string;
  modelTitle: string;
  prompt: string;
  gender: string;
  negativePrompt?: string | null;
  genAIName: string;
  modelCategory: string; // "fashion", "lifestyle", "travel"
  modelLocation: string; // (e.g., "studio", "beach", "urban rooftop
  ethnicity: string;
  skinTone?: string | null;
  ageRange: string;
  isActive: boolean;
  styleTags: string[];
  resolution?: {
    width: number;
    height: number;
  };
  aspectRatio: string;
  modelImageUrl?: string | null;
  overrideParameters: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateAIModel = Omit<
  AIModel,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "aiModelAuthor"
  | "modelTitle"
  | "genAIName"
  | "modelCategory"
  | "isActive"
  | "styleTags"
  | "userId"
>;

export enum OutfitType {
  TOP = "TOP",
  BOTTOM = "BOTTOM",
  FULL_BODY = "FULL_BODY",
}
export interface Garment {
  id: string;
  outfitType: OutfitType;
  color: string;
  imageUrl: string;
  tags: string;
  createdAt: string;
  updatedAt: string;
}
