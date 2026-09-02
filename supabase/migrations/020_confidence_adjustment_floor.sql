-- ============================================================================
-- 020 — Confidence adjustment floor
--
-- The normal distribution produces a 45-99 base card rating. Confidence is a
-- correction on that card rating, but it must keep the final rating inside the
-- same visible card range rather than allowing inactive players to fall below
-- 45.
-- ============================================================================

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
recent_league_matches as (
  select league_id, id as match_id
  from (
    select
      id,
      league_id,
      row_number() over (
        partition by league_id
        order by played_at desc, created_at desc
      ) as recency_rank
    from public.matches
    where status = 'scored'
  ) ranked
  where recency_rank <= 6
),
recent_appearances as (
  select
    p.id as player_id,
    count(s.id) as recent_matches_played
  from public.players p
  left join recent_league_matches rlm on rlm.league_id = p.league_id
  left join public.player_match_scores s
    on s.player_id = p.id
   and s.match_id = rlm.match_id
  group by p.id
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
    array_agg(match_rating_score order by recency_rank)
      filter (where recency_rank <= 3) as recent_rating_scores,
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
    latest_rating_score,
    previous_rating_average,
    recent_rating_scores,
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
base_rated as (
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
    end as base_card_rating
  from public.players p
  join public.leagues l on l.id = p.league_id
  left join weighted w on w.player_id = p.id
  left join league_form lf on lf.league_id = p.league_id
),
confidence as (
  select
    player_id,
    round(recent_matches_played / 6.0 * 100, 3) as raw_confidence_pct,
    case
      when recent_matches_played / 6.0 > 0.6 then 100::numeric
      else round(recent_matches_played / 6.0 * 100, 3)
    end as confidence_pct
  from recent_appearances
),
rated as (
  select
    br.player_id,
    greatest(
      45,
      floor(br.base_card_rating - 10 * (100 - c.raw_confidence_pct) / 100)
    )::integer as card_rating,
    c.confidence_pct,
    c.raw_confidence_pct as confidence_adjustment_pct
  from base_rated br
  join confidence c on c.player_id = br.player_id
),
form as (
  select
    player_id,
    case
      when array_length(recent_rating_scores, 1) >= 3
       and recent_rating_scores[3] < recent_rating_scores[2]
       and recent_rating_scores[2] < recent_rating_scores[1]
      then 'fire'
      when array_length(recent_rating_scores, 1) >= 3
       and recent_rating_scores[3] > recent_rating_scores[2]
       and recent_rating_scores[2] > recent_rating_scores[1]
      then 'ice'
      when previous_rating_average is not null
       and latest_rating_score < previous_rating_average * 0.95
      then 'down'
      when previous_rating_average is not null
       and latest_rating_score > previous_rating_average * 1.05
      then 'up'
      else null
    end as form_state
  from weighted
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
  coalesce(w.total_victories, 0) as total_victories,
  r.confidence_pct,
  r.confidence_adjustment_pct,
  f.form_state
from public.players p
join public.leagues l on l.id = p.league_id
join rated r on r.player_id = p.id
left join weighted w on w.player_id = p.id
left join form f on f.player_id = p.id;

comment on view public.player_market_values is
  'Matches played, averages, weighted match rating score, confidence-adjusted '
  'market value in GBP, goal and victory totals, confidence, and form state per '
  'player. Market value is adjusted card_rating times the league market '
  'constant. Confidence-adjusted card_rating is bounded at 45 and 99.';
