import { atom } from "jotai";

export const imagePreviewAtom = atom<string | string[] | null>(null);
imagePreviewAtom.debugLabel = "imagePreviewAtom";
