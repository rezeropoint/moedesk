import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16162a]">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🎌</div>
          <h1 className="text-2xl font-bold text-white">MoeDesk</h1>
          <p className="text-gray-400 mt-2">二次元跨境电商运营工作台</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
