import { FileText } from "lucide-react"

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
}

export function EmptyState({ 
  title, 
  description, 
  icon: Icon = FileText 
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 mb-3">
          <Icon className="h-8 w-8 text-primary/60" />
        </div>
        <h3 className="text-lg font-bold text-muted-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground/70 mt-1.5 max-w-xs mx-auto">
          {description}
        </p>
      </div>
    </div>
  )
}