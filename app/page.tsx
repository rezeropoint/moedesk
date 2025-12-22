import { Sparkles } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Sparkles className="h-12 w-12 text-primary mx-auto" />
        <h1 className="text-3xl font-bold text-foreground">MoeDesk</h1>
        <p className="text-muted-foreground">二次元跨境电商运营工作台</p>
      </div>
    </main>
  )
}
