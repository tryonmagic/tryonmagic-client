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

// type AIModel struct {
// 	ID             uuid.UUID      `gorm:"primaryKey;not null" json:"id"`
// 	AIModelAuthor  AIModelAuthor  `gorm:"default:SYSTEM;not null" json:"aiModelAuthor"`
// 	ModelTitle     string         `gorm:"not null" json:"modelTitle"`
// 	Prompt         string         `gorm:"not null" json:"prompt"`
// 	NegativePrompt *string        `json:"negativePrompt"`
// 	GenAIName      string         `gorm:"not null" json:"genAIName"`
// 	ModelCategory  string         `json:"modelCategory"` // "fashion", "lifestyle", "travel"
// 	ModelLocation  string         `json:"modelLocation"` // (e.g., "studio", "beach", "urban rooftop")
// 	Ethnicity      string         `json:"ethnicity"`
// 	SkinTone       *string        `json:"skinTone"`
// 	Gender         string         `json:"gender"`
// 	AgeRange       string         `json:"ageRange"`
// 	IsActive       bool           `gorm:"default:true" json:"isActive"`
// 	StyleTags      datatypes.JSON `json:"styleTags"`
// 	Resolution     datatypes.JSON `json:"resolution"`
// 	ModelImageUrl  *string        `json:"modelImageUrl"`
// 	UserID         uuid.UUID      `gorm:"not null" json:"userId"`
// 	TaskID         *uuid.UUID     `json:"taskId"`
// 	User           *User          `gorm:"foreignKey:UserID;references:ID" json:"user"`
// 	Task           *Task          `gorm:"foreignKey:TaskID;references:ID" json:"task"`
// 	CreatedAt      time.Time      `gorm:"autoCreateTime" json:"createdAt"`
// 	UpdatedAt      time.Time      `gorm:"autoUpdateTime" json:"updatedAt"`
// }

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
