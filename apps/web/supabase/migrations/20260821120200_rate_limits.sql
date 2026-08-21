/*
 * -------------------------------------------------------
 * Rate limiting, counted in Postgres (no new service, no new dependency)
 * -------------------------------------------------------
 * security-audit.md finding 4. proxy.ts excludes /api/* from the middleware, so
 * there is no site-wide place a limiter can live; each route has to ask for a
 * count itself. This gives it something to count with, using the Postgres we
 * already have — CLAUDE.md §5 forbids adding a service or a package without
 * Jon's say-so, and this needs neither.
 *
 * A FIXED-WINDOW COUNTER. Time is chopped into windows of p_window_seconds;
 * each (key, window) has one row whose `hits` counts calls. A call is allowed
 * while hits <= limit. Cheap, atomic (the upsert increments under a row lock),
 * and good enough for "stop one IP or one account hammering an endpoint" — it
 * is not trying to be a precise sliding window.
 *
 * The counters table is reachable by NOBODY directly — not anon, not
 * authenticated, not even the browser's service calls except through the
 * function below, which is service_role only. Idempotent and safe to re-run.
 */

begin;

create table if not exists
    public.rate_limits
(
    bucket_key   text                     not null,
    window_start timestamp with time zone not null,
    hits         integer                  not null default 0,
    primary key (bucket_key, window_start)
);

comment on table public.rate_limits is
    'Fixed-window request counters for API rate limiting. One row per (key, time window). security-audit.md finding 4.';

-- Old windows are never read again. This lets a periodic cleanup find them fast.
create index if not exists rate_limits_window_start_idx
    on public.rate_limits (window_start);

alter table public.rate_limits
    enable row level security;

-- Nobody touches this table directly; all access is through rate_limit_hit.
revoke all on public.rate_limits from anon, authenticated, service_role;

/*
 * rate_limit_hit: record one call against a key and say whether it is allowed.
 *
 * Returns TRUE while the key is within its limit for the current window, FALSE
 * once it is over. The insert-or-increment is a single atomic statement, so two
 * requests racing on the same key cannot both slip past the limit.
 */
create or replace function public.rate_limit_hit(
    p_key text,
    p_limit integer,
    p_window_seconds integer
) returns boolean
    language plpgsql
    security definer
    set search_path = ''
as
$$
declare
    w            timestamp with time zone;
    current_hits integer;
begin
    -- Snap to the start of the current fixed window.
    w := to_timestamp(
            floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
         );

    -- Aliased so the ON CONFLICT clause can name the existing row unambiguously.
    insert into public.rate_limits as rl (bucket_key, window_start, hits)
    values (p_key, w, 1)
    on conflict (bucket_key, window_start)
        do update set hits = rl.hits + 1
    returning rl.hits into current_hits;

    return current_hits <= p_limit;
end;
$$;

comment on function public.rate_limit_hit is
    'Records one call against (p_key, current window) and returns true if still within p_limit, false if over. Atomic. security-audit.md finding 4.';

revoke execute on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;

/*
 * rate_limits_prune: delete windows older than the cutoff. Not called by the
 * app; run it occasionally (e.g. a scheduled task, or by hand) so the table
 * cannot grow without bound. Safe to run any time — it only removes windows
 * that are already closed. Default cutoff generous at one day.
 */
create or replace function public.rate_limits_prune(older_than interval default interval '1 day')
    returns bigint
    language plpgsql
    security definer
    set search_path = ''
as
$$
declare
    removed bigint;
begin
    delete from public.rate_limits where window_start < now() - older_than;
    get diagnostics removed = row_count;
    return removed;
end;
$$;

comment on function public.rate_limits_prune is
    'Housekeeping: removes closed rate-limit windows older than the cutoff. Run on a schedule or by hand. security-audit.md finding 4.';

revoke execute on function public.rate_limits_prune(interval) from public, anon, authenticated;
grant execute on function public.rate_limits_prune(interval) to service_role;

commit;
