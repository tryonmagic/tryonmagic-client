import {
  PaginationResponseData,
  SuccessWithPaginationResponse,
} from "@/lib/api/type";
import { IFile } from "../type";
import { AuthenticatedQueryFunction } from "@/lib/hooks/useAuthenticatedQuery";
import { clientAPI } from "@/lib/api";
import { ImageType, SortOption } from "./image-upload-manager";

export const getFilesQuery: AuthenticatedQueryFunction<
  PaginationResponseData<ImageType>,
  [
    "files",
    {
      page: number;
      pageSize: number;
      types?: string[];
      search?: string;
      sortOption?: SortOption;
    },
  ]
> = async (token, queryKey) => {
  const [, { page, pageSize, types, search, sortOption }] = queryKey;
  const params: Record<string, string | boolean | number | string[]> = {
    page,
    pageSize,
  };
  if (types) {
    params.types = types;
  }
  if (search) {
    params.search = search;
  }
  injectSortBy(sortOption, params);
  const res = await clientAPI(token).get<SuccessWithPaginationResponse<IFile>>(
    "/storage/files",
    {
      params,
    },
  );

  const files = res.data.data.results;
  const imagesWithUrl = await Promise.all(
    files.map((image) => {
      return {
        id: image.id!,
        name: image.name,
        url: image.url,
        originalUrl: image.url,
        thumbnailUrl: image.url,
        size: image.size,
        type: image.ext,
        tags: [],
        uploadDate: new Date(image.createdAt!),
        uploading: false,
        progress: 0,
      };
    }),
  );

  return {
    results: imagesWithUrl,
    page,
    limit: pageSize,
    totalPages: res.data.data.totalPages,
    totalResults: res.data.data.totalResults,
  };
};
function injectSortBy(
  sortOption: SortOption | undefined,
  params: Record<string, string | number | boolean | string[]>,
) {
  if (sortOption === SortOption.NEWEST) {
    params.sortBy = "createdAt";
    params.sortOrder = "desc";
  } else if (sortOption === SortOption.OLDEST) {
    params.sortBy = "createdAt";
    params.sortOrder = "asc";
  } else if (sortOption === SortOption.NAME_ASC) {
    params.sortBy = "name";
    params.sortOrder = "asc";
  } else if (sortOption === SortOption.NAME_DESC) {
    params.sortBy = "name";
    params.sortOrder = "desc";
  } else if (sortOption === SortOption.SIZE_ASC) {
    params.sortBy = "size";
    params.sortOrder = "asc";
  } else if (sortOption === SortOption.SIZE_DESC) {
    params.sortBy = "size";
    params.sortOrder = "desc";
  }
}
