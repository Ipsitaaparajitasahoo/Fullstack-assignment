import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Welcome back</h2>
      <LoginForm />
    </div>
  );
}
