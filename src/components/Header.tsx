import { FileText, Sparkles } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-lg border-b border-primary/10 shadow-sm">
      <div className="px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
                      <div className="relative">
            <div className="absolute inset-0 bg-blue-200 rounded-xl blur-lg opacity-50 animate-pulse"></div>
            <div className="relative flex items-center justify-center w-10 h-10 bg-blue-500 rounded-xl shadow-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </div>
            <div>
              <h1 className="text-lg font-bold text-blue-600">
                Invoice Manager
              </h1>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-600" />
                Powered by QuickBooks AI
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-medium text-muted-foreground">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 