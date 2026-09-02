-- ============================================================================
-- 018 — Conservative stats, rating-first market values
--
-- The card model now derives in three steps:
--
--   1. Each metric gets its own conservative form score on the original 0-10
--      scale: 50% previous history + 50% latest match.
--   2. Each match also gets an overall rating score from final_score, divided
--      by the metric capacity. With the default metrics that is final_score /
--      40 * 10, so victory and attributes move the rating while goals do not.
--      The player rating is the normal-distribution position of the weighted
--      rating score, clamped from 45 to 99.
--   3. Market value is the card rating multiplied by the league market
--      constant.
--
-- Match final_score stays stored and unchanged. It still records what happened
-- in a match; it no longer prices the player directly.
-- ============================================================================

create or replace function public.to_card_rating(
  p_latest_score numeric,
  p_league_mean numeric,
  p_league_spread numeric
) returns integer
  language sql immutable
  set search_path = ''
as $$
  select case
    when p_latest_score is null
      or p_league_mean is null
      or coalesce(p_league_spread, 0) = 0
    then 72
    else least(99, greatest(45,
      round(72 + 18 * (p_latest_score - p_league_mean)
        / p_league_spread)
    ))::integer
  end;
$$;

comment on function public.to_card_rating(numeric, numeric, numeric) is
  'A player''s 0-99 card rating: their weighted match rating score placed on a '
  'normal distribution of every player''s weighted match rating score, centred '
  'on 72 and bounded at 45 and 99.';

-- ---------------------------------------------------------------------------
-- player_metric_averages
--
-- Same columns as before. career_average/metric_averages now expose the
-- effective score for that specific metric: one match directly, or 50%
-- previous average plus 50% latest match.
-- ---------------------------------------------------------------------------

create or replace view public.player_metric_averages
with (security_invoker = true) as
with scored_metrics as (
  select
    p.league_id,
    p.id as player_id,
    m.code as metric_code,
    m.label as metric_label,
    m.display_order,
    (s.metric_scores ->> m.code)::numeric as metric_score,
    row_number() over (
      partition by p.id, m.code
      order by mt.played_at desc, s.created_at desc
    ) as recency_rank
  from public.players p
  join public.league_metrics m
    on m.league_id = p.league_id
   and m.is_active
  join public.player_match_scores s
    on s.player_id = p.id
  join public.matches mt
    on mt.id = s.match_id
   and mt.status = 'scored'
  where s.metric_scores ? m.code
    and jsonb_typeof(s.metric_scores -> m.code) = 'number'
),
per_metric as (
  select
    league_id,
    player_id,
    metric_code,
    metric_label,
    display_order,
    count(*) as scored_count,
    max(metric_score) filter (where recency_rank = 1) as latest_metric_score,
    round(avg(metric_score) filter (where recency_rank > 1), 3)
      as previous_metric_average
  from scored_metrics
  group by league_id, player_id, metric_code, metric_label, display_order
),
weighted as (
  select
    league_id,
    player_id,
    metric_code,
    metric_label,
    display_order,
    scored_count,
    case
      when scored_count = 1 then latest_metric_score
      else round(0.5 * previous_metric_average + 0.5 * latest_metric_score, 3)
    end as weighted_metric_score
  from per_metric
)
select
  league_id,
  player_id,
  metric_code,
  metric_label,
  display_order,
  weighted_metric_score as career_average,
  public.to_card_stat(weighted_metric_score) as card_stat,
  scored_count
from weighted;

comment on view public.player_metric_averages is
  'Conservative 0-10 metric form score and 0-99 card stat per player per '
  'active metric: 50% previous history and 50% latest match.';

-- ---------------------------------------------------------------------------
-- player_market_values
-- ---------------------------------------------------------------------------

create or replace view public.player_market_values
with (security_invoker = true) as
with league_metric_capacity as (
  select
    league_id,
    sum(maximum_score) as metric_capacity
  from public.league_metrics
  where is_active
  group by league_id
),
scored as (
  select
    s.player_id,
    s.final_score,
    round(s.final_score / nullif(lmc.metric_capacity, 0) * 10, 3)
      as match_rating_score,
    s.goals,
    s.victory,
    m.played_at,
    row_number() over (
      partition by s.player_id
      order by m.played_at desc, s.created_at desc
    ) as recency_rank
  from public.player_match_scores s
  join public.matches m on m.id = s.match_id
  join league_metric_capacity lmc on lmc.league_id = m.league_id
  where m.status = 'scored'
),
per_player as (
  select
    player_id,
    count(*)::integer as matches_played,
    round(avg(final_score), 3) as career_average,
    max(final_score) filter (where recency_rank = 1) as latest_score,
    max(match_rating_score) filter (where recency_rank = 1)
      as latest_rating_score,
    round(avg(match_rating_score) filter (where recency_rank > 1), 3)
      as previous_rating_average,
    sum(goals)::integer as total_goals,
    sum(victory) as total_victories
  from scored
  group by player_id
),
weighted as (
  select
    player_id,
    matches_played,
    career_average,
    latest_score,
    total_goals,
    total_victories,
    case
      when matches_played = 1 then latest_rating_score
      else round(0.5 * previous_rating_average + 0.5 * latest_rating_score, 3)
    end as weighted_rating_score
  from per_player
),
league_form as (
  select
    p.league_id,
    avg(w.weighted_rating_score) as mean_weighted_rating_score,
    stddev_pop(w.weighted_rating_score) as spread_weighted_rating_score
  from weighted w
  join public.players p on p.id = w.player_id
  group by p.league_id
),
rated as (
  select
    p.id as player_id,
    case
      when w.weighted_rating_score is not null then public.to_card_rating(
        w.weighted_rating_score,
        lf.mean_weighted_rating_score,
        lf.spread_weighted_rating_score
      )
      when p.estimated_market_value_gbp is not null
       and l.market_constant_gbp > 0
      then least(99, greatest(45,
        round(p.estimated_market_value_gbp / l.market_constant_gbp)
      ))::integer
      else public.to_card_rating(null, lf.mean_weighted_rating_score,
        lf.spread_weighted_rating_score)
    end as card_rating
  from public.players p
  join public.leagues l on l.id = p.league_id
  left join weighted w on w.player_id = p.id
  left join league_form lf on lf.league_id = p.league_id
)
select
  p.league_id,
  p.id as player_id,
  coalesce(w.matches_played, 0) as matches_played,
  w.career_average,
  w.latest_score,
  coalesce(w.weighted_rating_score, 0) as weighted_performance_score,
  round(r.card_rating * l.market_constant_gbp, 2) as market_value_gbp,
  r.card_rating,
  coalesce(w.total_goals, 0) as total_goals,
  coalesce(w.total_victories, 0) as total_victories
from public.players p
join public.leagues l on l.id = p.league_id
join rated r on r.player_id = p.id
left join weighted w on w.player_id = p.id;

comment on view public.player_market_values is
  'Matches played, averages, weighted match rating score, market value in GBP, '
  'goal and victory totals, and the 0-99 card rating per player. Market value '
  'is card_rating times the league market constant.';

-- ---------------------------------------------------------------------------
-- player_cards uses the revised metric averages without changing shape.
-- ---------------------------------------------------------------------------

create or replace view public.player_cards
with (security_invoker = true) as
with metric_stats as (
  select
    player_id,
    jsonb_object_agg(metric_code, card_stat order by display_order)
      as metric_card_stats,
    jsonb_object_agg(metric_code, career_average order by display_order)
      as metric_averages
  from public.player_metric_averages
  group by player_id
),
attribute_counts as (
  select
    counted.player_id,
    jsonb_object_agg(a.code, counted.total) as attribute_counts,
    sum(counted.total)::integer as attribute_total
  from (
    select s.player_id, sa.league_attribute_id, count(*)::integer as total
    from public.player_match_score_attributes sa
    join public.player_match_scores s on s.id = sa.player_match_score_id
    join public.matches m on m.id = s.match_id and m.status = 'scored'
    group by s.player_id, sa.league_attribute_id
  ) as counted
  join public.league_attributes a on a.id = counted.league_attribute_id
  group by counted.player_id
)
select
  p.id,
  p.league_id,
  p.player_code,
  p.first_name,
  p.last_name,
  p.nickname,
  coalesce(nullif(btrim(p.nickname), ''), p.first_name || ' ' || p.last_name)
    as display_name,
  p.preferred_position,
  p.avatar_path,
  p.is_active,
  mv.matches_played,
  mv.career_average,
  mv.latest_score,
  mv.weighted_performance_score,
  mv.market_value_gbp,
  mv.card_rating,
  coalesce(ms.metric_card_stats, '{}'::jsonb) as metric_card_stats,
  coalesce(ms.metric_averages, '{}'::jsonb) as metric_averages,
  coalesce(ac.attribute_counts, '{}'::jsonb) as attribute_counts,
  coalesce(ac.attribute_total, 0) as attribute_total,
  p.created_at,
  p.updated_at,
  p.user_id,
  mv.total_goals,
  mv.total_victories,
  p.is_guest,
  p.estimated_market_value_gbp
from public.players p
join public.player_market_values mv on mv.player_id = p.id
left join metric_stats ms on ms.player_id = p.id
left join attribute_counts ac on ac.player_id = p.id;
