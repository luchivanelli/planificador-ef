export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4">
      <div className="surface-card px-8 py-6 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#0f63ff]" />
        <p className="text-sm text-slate-600">Cargando...</p>
      </div>
    </div>
  );
}
