"use client";

import AIFashionGenerator from "@/components/ai-fashion-generator";

export default function Page() {
  // now we can use the new managed app bridge, so we don't need to
  // worry about checking if the app is installed or not
  return <AIFashionGenerator />;
}
