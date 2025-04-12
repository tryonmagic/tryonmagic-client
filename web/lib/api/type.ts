export interface GenericAPIResponse<T = unknown> {
  code: number;
  status: string;
  message: string;
  data?: T | null;
}
