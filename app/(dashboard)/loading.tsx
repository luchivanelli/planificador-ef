export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600 mx-auto mb-3" />
        <p className="text-sm text-gray-600">Cargando contenido del panel...</p>
      </div>
    </div>
  );
}
