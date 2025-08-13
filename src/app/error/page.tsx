import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function ErrorPage() {
  const store = await cookies()
  const title = store.get('app_err_title')?.value || 'Something went wrong'
  const message = store.get('app_err_message')?.value || 'An unexpected error occurred.'
  const backHref = store.get('app_err_back')?.value || '/'

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-xl border border-border/50 bg-card/60 shadow-xl p-6 text-center">
        <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-5">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <Link href={backHref} className="min-w-[160px] inline-flex items-center justify-center rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90">
            Go back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}