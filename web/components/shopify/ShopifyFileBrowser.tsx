import { useAppBridge } from "@shopify/app-bridge-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { CheckCircle2, Loader2, Layers } from "lucide-react";

export default function ShopifyFileBrowser({
  selectedImage,
  setSelectedImage,
}: {
  selectedImage?: string | null;
  setSelectedImage: (image: string) => void;
}) {
  const appBridge = useAppBridge();
  const [shopifyFiles, setShopifyFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchFiles = useCallback(
    async (nextCursor: string | null = null) => {
      setIsLoadingFiles(true);
      try {
        const sessionToken = await appBridge.idToken();
        const response = await fetch(
          `/api/shopify/files?${nextCursor ? `cursor=${nextCursor}` : ""}`,
          {
            headers: {
              Authorization: `Bearer ${sessionToken}`,
            },
          },
        );
        const data = await response.json();
        if (data.success) {
          if (nextCursor) {
            setShopifyFiles((prev) => [...prev, ...data.files]);
          } else {
            setShopifyFiles(data.files);
          }
          setCursor(data.pageInfo.endCursor);
          setHasNextPage(data.pageInfo.hasNextPage);
        } else {
          toast.error(data.error || "Failed to fetch files");
        }
      } catch (error) {
        toast.error("Failed to fetch Shopify files");
      } finally {
        setIsLoadingFiles(false);
      }
    },
    [appBridge],
  );

  const handleProductSelect = async () => {
    if (!(window as any).shopify) {
      toast.error(
        "Shopify App Bridge not found. Please use the app inside Shopify Admin.",
      );
      return;
    }

    try {
      const selected = await (window as any).shopify.resourcePicker({
        type: "product",
        multiple: false,
      });

      if (selected && selected.length > 0) {
        const product = selected[0];
        const imageUrl =
          product.images?.[0]?.originalSrc ||
          product.variants?.[0]?.image?.originalSrc;

        if (imageUrl) {
          setSelectedImage(imageUrl);
          toast.success(`Selected ${product.title}`);
        } else {
          toast.error("No image found for the selected product");
        }
      }
    } catch (error) {
      toast.error("Failed to select product from Shopify");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Shopify Admin Gallery
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleProductSelect}
          className="flex items-center gap-2"
        >
          <Layers className="h-4 w-4" />
          Select from Products
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-2">
        {shopifyFiles.map((file) => (
          <div
            key={file.id}
            className={cn(
              "relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
              selectedImage === file.url
                ? "border-purple-600 shadow-md"
                : "border-slate-200 hover:border-slate-300 dark:hover:border-slate-700",
            )}
            onClick={() => setSelectedImage(file.url)}
          >
            <Image
              src={file.url}
              alt="Shopify File"
              fill
              className="object-cover"
            />
            {selectedImage === file.url && (
              <div className="absolute top-1 right-1 bg-purple-600 rounded-full p-0.5">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        ))}
        {isLoadingFiles && (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        )}
        {!isLoadingFiles && shopifyFiles.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            No images found in your Shopify Files.
          </div>
        )}
      </div>
      {hasNextPage && !isLoadingFiles && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchFiles(cursor)}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
