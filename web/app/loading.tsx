export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen ">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
        <h2 className="text-white text-xl font-semibold">
          Loading TryOnMagic...
        </h2>
      </div>
    </div>
  );
}
