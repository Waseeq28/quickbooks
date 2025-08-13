export default function DocsPage() {
  const endpoints: Array<{
    method: 'GET'|'POST'|'DELETE'
    path: string
    purpose: string
    authz: string
    input?: string
    output?: string
  }> = [
    { method: 'GET', path: '/api/quickbooks/connect', purpose: 'Start OAuth 2.0 flow with QuickBooks for the current team (redirects to Intuit).', authz: 'Admin only (team:update)' },
    { method: 'GET', path: '/api/quickbooks/callback', purpose: 'OAuth callback. Exchanges code for tokens and saves a team-scoped connection.', authz: 'Admin only (team:update)' },
    { method: 'DELETE', path: '/api/quickbooks/disconnect', purpose: 'Disconnects the current team from its QuickBooks company.', authz: 'Admin only (team:update)' },
    { method: 'GET', path: '/api/quickbooks/invoices', purpose: 'List invoices (simplified) for the current team’s QuickBooks company.', authz: 'invoice:read', output: 'Array<SimpleInvoice>' },
    { method: 'POST', path: '/api/quickbooks/invoices', purpose: 'Create a new invoice. Finds/creates customer and items; sets ItemRef so product names display in QBO.', authz: 'invoice:create', input: '{ customerName: string; issueDate?: string; dueDate?: string; items: Array<{ description: string; productName?: string; productDescription?: string; quantity: number; rate: number; }> }', output: '{ success: true; invoice: SimpleInvoice }' },
    { method: 'DELETE', path: '/api/quickbooks/invoices/[id]', purpose: 'Delete (void) an invoice by DocNumber (translates to Id+SyncToken under the hood).', authz: 'invoice:delete' },
    { method: 'POST', path: '/api/quickbooks/invoices/[id]/send', purpose: 'Email the invoice PDF to a recipient.', authz: 'invoice:read', input: '{ email: string }' },
    { method: 'GET', path: '/api/quickbooks/invoices/[id]/pdf', purpose: 'Download the invoice PDF.', authz: 'invoice:read', output: 'application/pdf (binary stream)' },
    { method: 'POST', path: '/api/chat', purpose: 'Chat endpoint backed by tools (invoice fetch/create/update/delete/pdf).', authz: 'Tools enforce same RBAC per action.' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold">API Documentation</h1>
        <p className="text-sm text-muted-foreground mt-1">Team-scoped QuickBooks integration with RBAC. All endpoints infer the current team from the authenticated session. Actions are authorized server-side.</p>

        <div className="mt-4 overflow-hidden rounded-lg border border-border/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-slate-200">
                <th className="text-left px-3 py-2 w-24">Method</th>
                <th className="text-left px-3 py-2 w-80">Path</th>
                <th className="text-left px-3 py-2">Purpose</th>
                <th className="text-left px-3 py-2 w-56">RBAC</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-900/60' : 'bg-slate-900/30'}>
                  <td className="px-3 py-2"><code className="px-2 py-0.5 rounded bg-slate-800 text-blue-300">{ep.method}</code></td>
                  <td className="px-3 py-2 font-mono text-blue-300">{ep.path}</td>
                  <td className="px-3 py-2 align-top">
                    <div>{ep.purpose}</div>
                    {ep.input && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-slate-300">Input</div>
                        <pre className="mt-1 bg-slate-950/70 border border-slate-800 rounded p-2 overflow-x-auto text-xs text-slate-200 whitespace-pre-wrap">{ep.input}</pre>
                      </div>
                    )}
                    {ep.output && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-slate-300">Output</div>
                        <pre className="mt-1 bg-slate-950/70 border border-slate-800 rounded p-2 overflow-x-auto text-xs text-slate-200 whitespace-pre-wrap">{ep.output}</pre>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2"><code className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">{ep.authz}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground mt-2">RBAC keys: team:update (admin); invoice:read/create/delete per role. All operations use the current team’s QuickBooks connection.</p>
      </div>
    </div>
  )
}


