import AIFashionGenerator from "@/components/ai-fashion-generator";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
          AI Fashion Model Generator
        </h1>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
          Create stunning fashion models with AI in seconds
        </p>
        <AIFashionGenerator />
      </div>
    </main>
  );
}
