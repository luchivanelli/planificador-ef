/**
 * Esqueleto del panel: dibuja la forma de la página que está por llegar, así la
 * espera no se siente como una pantalla en blanco.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando contenido">
      <div className="space-y-2">
        <div className="skeleton h-7 w-56" />
        <div className="skeleton h-4 w-72" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card flex items-center gap-3 p-4">
            <div className="skeleton h-9 w-9 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-5 w-10" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="skeleton h-11 w-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-3 w-60" />
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="skeleton h-32" />
          <div className="skeleton h-32" />
        </div>
      </div>

      <div className="card p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="skeleton h-11 w-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-3 w-52" />
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </div>
      </div>
    </div>
  );
}
