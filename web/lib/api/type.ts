import { SubscriptionPlan } from "@/app/purchase/type";
import { User } from "@/types/user";
import { SubscriptionStatus } from "./subscription-sync";

export interface GenericAPIResponse<T = unknown> {
  code: number;
  status: string;
  message: string;
  data: T | null;
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
  isBackgroundRemoved: boolean;
}

export enum VTONModelMode {
  PERFORMANCE = "performance",
  QUALITY = "quality",
  BALANCED = "balanced",
}

export interface VTONTaskInput {
  outfitType: OutfitType;
  modelMode: VTONModelMode;
  modelImage: string;
  garmentImage: string;
  seed: number;
  numSamples: number;
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
  // GENERATE_IMAGE = "GENERATE_IMAGE",
  REPLACE_BACKGROUND = "REPLACE_BACKGROUND",
  GENERATE_AI_MODEL = "GENERATE_AI_MODEL",
  VTON = "VTON",
  UPSCALE = "UPSCALE",
  ENHANCE = "ENHANCE",
  EXPAND_IMAGE = "EXPAND_IMAGE",
  EDIT_IMAGE = "EDIT_IMAGE",
  PRODUCT_IMAGE_EDITING = "PRODUCT_IMAGE_EDITING",
}

export const TaskTypeLabel = {
  [TaskType.REMOVE_BACKGROUND]: "Remove Background",
  [TaskType.REPLACE_BACKGROUND]: "Replace Background",
  [TaskType.GENERATE_AI_MODEL]: "AI Model",
  [TaskType.VTON]: "VTON",
  [TaskType.UPSCALE]: "Upscale",
  [TaskType.ENHANCE]: "Enhance",
  [TaskType.EXPAND_IMAGE]: "Expand Image",
  [TaskType.EDIT_IMAGE]: "Edit Image",
  [TaskType.PRODUCT_IMAGE_EDITING]: "Product Image Editing",
};

export interface Transaction {
  id: string;
  userId: string;
  user?: any; // Optionally, a User object
  taskId?: string | null;
  task?: any; // Optionally, a Task object
  transactionType: string;
  transactionStatus: string;
  debitAmount: number;
  creditAmount: number;
  netAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  referenceType?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  currency?: string;
  amountPaid?: number;
  exchangeRate?: number;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string | null;
  expiresAt?: string | null;
}

export enum AuditStatus {
  PENDING = "PENDING",
  RESOLVED = "RESOLVED",
  REJECTED = "REJECTED",
}

export interface TaskAudit {
  id: string;
  taskId: string;
  userId: string;
  reason: string;
  isRefundRequested: boolean;
  adminFeedback?: string;
  status: AuditStatus;
  createdAt: string;
  updatedAt: string;
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
  transactionHistory?: Transaction | null;
  taskAudit?: TaskAudit | null;
}

export interface TaskProgress<T = unknown> {
  id?: string;
  type?: TaskType;
  status: TaskStatus;
  progress?: number;
  resultData?: {
    outputImageUrl: string;
    error?: string;
  } & T;
}

export interface VtonTaskResultData {
  outputImageUrl: string[];
}
export interface UpscaleTaskInput {
  sourceImageUrl: string;
  // scale: string;
  imageSourceType: ImageSourceType;
}

export interface EnhanceImageTaskInput {
  sourceImageUrl: string;
  targetWidth: number;
  targetHeight: number;
  horizontalAlignment: string;
  verticalAlignment: string;
  expandPrompt: string;
  imageSourceType: ImageSourceType;
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

export enum EditMode {
  PROMPT = "PROMPT",
  REGION = "REGION",
}
export enum EditType {
  INPAINT_REMOVE = "EDIT_MODE_INPAINT_REMOVAL",
  INPAINT_REPLACE = "EDIT_MODE_INPAINT_REPLACE",
  INPAINT_INSERTION = "EDIT_MODE_INPAINT_INSERTION",
}

export interface EditRegion {
  x: number; // required, min=0
  y: number; // required, min=0
  width: number; // required, min=1
  height: number; // required, min=1
}

export interface EditImageTaskInput {
  sourceImageUrl: string;
  imageSourceType: ImageSourceType;
  editType: EditType;
  editMode: EditMode;
  editPrompt?: string | null;
  editRegion?: EditRegion[] | null;
  replacePrompt?: {
    replaceFrom?: string | null;
    replaceTo: string;
  } | null;
}

// Product Image Editing Types
export enum ProductImageEditingType {
  SMART_BACKGROUND = "SMART_BACKGROUND",
  STYLE_TRANSFER = "STYLE_TRANSFER",
  SCENE_GENERATION = "SCENE_GENERATION",
  PRODUCT_VARIANTS = "PRODUCT_VARIANTS",
  PRODUCT_COLOR_VARIANTS = "PRODUCT_COLOR_VARIANTS",
}

export enum StyleType {
  ARTISTIC = "ARTISTIC",
  MOOD = "MOOD",
  BRAND = "BRAND",
  CREATIVE = "CREATIVE",
}

export enum SceneType {
  LIFESTYLE = "LIFESTYLE",
  COMMERCIAL = "COMMERCIAL",
  CONTEXT = "CONTEXT",
  BRAND_ENVIRONMENT = "BRAND_ENVIRONMENT",
}

export enum VariantType {
  SIZE = "SIZE",
  CONFIGURATION = "CONFIGURATION",
  ANGLE = "ANGLE",
  BATCH = "BATCH",
}

export interface ProductImageEditTaskInput {
  // Common fields
  sourceImageUrl: string;
  imageSourceType: ImageSourceType;
  processingType: ProductImageEditingType;

  // Smart Background fields
  backgroundPrompt?: string | null;
  preserveLighting?: boolean;
  matchShadows?: boolean;
  enhanceQuality?: boolean;
  backgroundStyle?: string | null;
  lightingAdjustment?: string | null;

  // Style Transfer fields
  styleType?: StyleType | null;
  stylePrompt?: string | null;
  styleReferenceImageUrl?: string | null;
  styleReferenceImageType?: ImageSourceType | null;
  intensity?: number;
  preserveDetails?: boolean;
  brandGuidelines?: string | null;

  // Scene Generation fields
  sceneType?: SceneType | null;
  scenePrompt?: string | null;
  contextDescription?: string | null;
  lifestyleSettings?: string | null;
  brandEnvironment?: string | null;
  lightingConditions?: string | null;
  targetAudience?: string | null;

  // Product Variants fields
  variantType?: VariantType | null;
  variantPrompt?: string | null;
  numberOfVariants?: number;
  sizeVariations?: string[] | null;
  configurationOptions?: string[] | null;
  angleVariations?: string[] | null;
  colorVariations?: string[] | null;
  materialVariations?: string[] | null;
}

export interface ProductImageEditTaskResultData {
  outputImageUrl: string | string[];
}

export interface PaginationResponseData<T = unknown> {
  results: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}
export interface SuccessWithPaginationResponse<T = unknown> {
  code: number;
  status: string;
  message: string;
  data: PaginationResponseData<T>;
}

export function getPointsForTaskType(
  taskType: TaskType,
  backgroundSourceType?: BackgroundSourceType,
): number {
  switch (taskType) {
    case TaskType.REMOVE_BACKGROUND:
      return 1;
    case TaskType.GENERATE_AI_MODEL:
      return 3;
    case TaskType.VTON:
      return 4;
    case TaskType.UPSCALE:
      return 2;
    case TaskType.ENHANCE:
      return 3;
    case TaskType.EXPAND_IMAGE:
      return 3;
    case TaskType.EDIT_IMAGE:
      return 2;
    case TaskType.PRODUCT_IMAGE_EDITING:
      return 3;
    case TaskType.REPLACE_BACKGROUND: {
      if (backgroundSourceType === BackgroundSourceType.PROMPT) {
        return 3;
      }
      return 1;
    }
    default:
      return 3;
  }
}

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  pointsBalance: number;
  pointsUsed: number;
  pointsTotal: number;
  monthlyPoints: number;
  lastResetDate: string;
  nextResetDate: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
}
