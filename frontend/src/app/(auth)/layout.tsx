import { CheckSquare } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-600 text-white mb-4">
            <CheckSquare className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
          <p className="text-gray-500 mt-1">Manage your tasks efficiently</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
