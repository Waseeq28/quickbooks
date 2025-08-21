import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie
            .split(';')
            .map(c => c.trim())
            .filter(c => c.length > 0)
            .map(c => {
              const [name, ...rest] = c.split('=');
              return { name, value: rest.join('=') };
            });
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookie = `${name}=${value}`;
            if (options?.expires) {
              cookie += `; expires=${options.expires}`;
            }
            if (options?.path) {
              cookie += `; path=${options.path}`;
            }
            if (options?.domain) {
              cookie += `; domain=${options.domain}`;
            }
            if (options?.sameSite) {
              cookie += `; samesite=${options.sameSite}`;
            }
            if (options?.secure) {
              cookie += `; secure`;
            }
            document.cookie = cookie;
          });
        },
      },
      auth: {
        persistSession: true,
        storageKey: 'sb-auth-token',
        storage: {
          getItem: (key: string) => {
            if (typeof window !== 'undefined') {
              return window.localStorage.getItem(key);
            }
            return null;
          },
          setItem: (key: string, value: string) => {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(key, value);
            }
          },
          removeItem: (key: string) => {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(key);
            }
          },
        },
      },
    }
  );
}
