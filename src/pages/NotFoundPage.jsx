import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Compass className="h-8 w-8" />
      </div>
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Sahifa topilmadi</h1>
      <p className="mt-2 max-w-sm text-slate-500">Siz qidirayotgan sahifa mavjud emas yoki ko‘chirilgan.</p>
      <Link to="/admin" className="mt-6 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
        Boshqaruv paneli
      </Link>
    </div>
  );
}
