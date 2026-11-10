import type { Sql } from "./db";

/** The reservation is atomic, including requests served by different Vercel instances. */
export async function reserveLoginAttempt(sql: Sql, key: string, limit: number): Promise<boolean> {
  const rows = await sql<{ attempts: number }>`
    with expired as (
      delete from atelier_login_limits where expires_at < now() - interval '1 day'
    )
    insert into atelier_login_limits (bucket_key, attempts, expires_at)
    values (${key}, 1, now() + interval '10 minutes')
    on conflict (bucket_key) do update set
      attempts = case when atelier_login_limits.expires_at <= now()
        then 1 else atelier_login_limits.attempts + 1 end,
      expires_at = case when atelier_login_limits.expires_at <= now()
        then now() + interval '10 minutes' else atelier_login_limits.expires_at end
    where atelier_login_limits.expires_at <= now() or atelier_login_limits.attempts < ${limit}
    returning attempts
  `;
  return rows.length === 1;
}
