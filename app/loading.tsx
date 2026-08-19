import { Volleyball } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card flex flex-col items-center gap-3 px-10 py-8 text-center">
        <span className="relative flex h-12 w-12 items-center justify-center">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
          <Volleyball className="h-5 w-5 text-brand-600" />
        </span>
        <p className="text-sm font-medium text-ink-600">Cargando...</p>
      </div>
    </div>
  );
}
