-- ============================================================================
-- Derived views: market values, card ratings and metric averages
--
-- The metric-first 0.5/0.5 weighting only becomes distinguishable from a plain
-- career average once a player has three or more matches, so this file builds
-- that case explicitly rather than relying on the two-match seed.
-- ============================================================================

begin;
select plan(20);

-- Cleared so the new-user trigger makes this account an administrator
-- regardless of who already exists in this database.
delete from public.league_members;

insert into auth.users (id, instance_id, aud, role, email)
values (
  '99999999-9999-4999-8999-00000000000a',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'admin@test.local'
);

-- ---------------------------------------------------------------------------
-- The specification's worked example, built from scratch:
--
--   attack:  previous 7, 8, 6 -> previous average 7.0; latest 10 -> 8.5
--   defence: previous 7, 8, 6 -> previous average 7.0; latest 9  -> 8.0
--   rating score = weighted(final_score / 20 * 10) = 4.125
--   base rating = one standard deviation above the league = 90
--   confidence adjustment = 4 of 6 recent league matches -> final rating 86
--   market value = 86 x 1,000,000 = 86,000,000
--
-- Note this differs from the career average of 7.625, and includes any points
-- already stored in final_score.
-- ---------------------------------------------------------------------------

insert into public.leagues (id, title, market_constant_gbp)
values ('66666666-6666-4666-8666-000000000001', 'Liga de prueba', 1000000);

insert into public.league_metrics
  (league_id, code, label, display_order, minimum_score, maximum_score)
values
  ('66666666-6666-4666-8666-000000000001', 'attack',  'Ataque',  1, 0, 10),
  ('66666666-6666-4666-8666-000000000001', 'defence', 'Defensa', 2, 0, 10);

insert into public.players
  (id, league_id, player_code, first_name, last_name, preferred_position)
values
  ('77777777-7777-4777-8777-000000000001',
   '66666666-6666-4666-8666-000000000001',
   'TST-0001', 'Cuatro', 'Partidos', 'CM'),
  ('77777777-7777-4777-8777-000000000002',
   '66666666-6666-4666-8666-000000000001',
   'TST-0002', 'Un', 'Partido', 'ST'),
  ('77777777-7777-4777-8777-000000000003',
   '66666666-6666-4666-8666-000000000001',
   'TST-0003', 'Cero', 'Partidos', 'GK');

-- Four matches, oldest to newest. played_at drives which score counts as
-- "latest", so the dates matter more than the insert order.
insert into public.matches (
  id, league_id, title, location, played_at,
  home_team_name, away_team_name, status, results_imported_at
)
values
  ('88888888-8888-4888-8888-000000000001',
   '66666666-6666-4666-8666-000000000001', 'P1', 'Sitio',
   now() - interval '40 days', 'A', 'B', 'scored', now()),
  ('88888888-8888-4888-8888-000000000002',
   '66666666-6666-4666-8666-000000000001', 'P2', 'Sitio',
   now() - interval '30 days', 'A', 'B', 'scored', now()),
  ('88888888-8888-4888-8888-000000000003',
   '66666666-6666-4666-8666-000000000001', 'P3', 'Sitio',
   now() - interval '20 days', 'A', 'B', 'scored', now()),
  ('88888888-8888-4888-8888-000000000004',
   '66666666-6666-4666-8666-000000000001', 'P4', 'Sitio',
   now() - interval '10 days', 'A', 'B', 'scored', now());

insert into public.match_players (match_id, player_id)
select m.id, '77777777-7777-4777-8777-000000000001'
from public.matches m
where m.league_id = '66666666-6666-4666-8666-000000000001';

insert into public.match_players (match_id, player_id)
values ('88888888-8888-4888-8888-000000000004',
        '77777777-7777-4777-8777-000000000002');

-- Scores 7.0, 8.0, 6.0 then a latest of 9.5. metric_scores are set so the
-- averages land exactly on those figures.
insert into public.player_match_scores
  (match_id, player_id, metric_scores, base_score, attribute_points,
   final_score)
values
  ('88888888-8888-4888-8888-000000000001',
   '77777777-7777-4777-8777-000000000001',
   '{"attack": 7, "defence": 7}', 7.0, 0, 7.0),
  ('88888888-8888-4888-8888-000000000002',
   '77777777-7777-4777-8777-000000000001',
   '{"attack": 8, "defence": 8}', 8.0, 0, 8.0),
  ('88888888-8888-4888-8888-000000000003',
   '77777777-7777-4777-8777-000000000001',
   '{"attack": 6, "defence": 6}', 6.0, 0, 6.0),
  ('88888888-8888-4888-8888-000000000004',
   '77777777-7777-4777-8777-000000000001',
   '{"attack": 10, "defence": 9}', 9.5, 0, 9.5),
  -- A single match, so the one-match branch applies.
  ('88888888-8888-4888-8888-000000000004',
   '77777777-7777-4777-8777-000000000002',
   '{"attack": 5, "defence": 3}', 4.0, 0, 4.0);

-- ---------------------------------------------------------------------------
-- Four matches: the weighted branch
-- ---------------------------------------------------------------------------

select is(
  (select matches_played from public.player_market_values
   where player_id = '77777777-7777-4777-8777-000000000001'),
  4,
  'every scored match counts towards matches_played'
);

select is(
  (select latest_score from public.player_market_values
   where player_id = '77777777-7777-4777-8777-000000000001'),
  9.5::numeric,
  'the most recently played match is the latest score'
);

select is(
  (select career_average from public.player_market_values
   where player_id = '77777777-7777-4777-8777-000000000001'),
  7.625::numeric,
  'career average is the plain mean of every match'
);

select is(
  (select weighted_performance_score from public.player_market_values
   where player_id = '77777777-7777-4777-8777-000000000001'),
  4.125::numeric,
  'the weighted score halves the earlier rating score and the latest rating score'
);

select is(
  (select market_value_gbp from public.player_market_values
   where player_id = '77777777-7777-4777-8777-000000000001'),
  86000000.00::numeric,
  'market value is the card rating times the league constant'
);

-- The rating is a standing, not a measurement. Two players have a weighted
-- rating score here — 4.125 and 2.0 — so the league mean is 3.0625 and the
-- population standard deviation is exactly 1.0625. Each of them therefore sits
-- one deviation from the centre, which is eighteen points.
select is(
  (select card_rating from public.player_market_values
   where player_id = '77777777-7777-4777-8777-000000000001'),
  86,
  'a player one standard deviation above the league is adjusted by confidence'
);

select is(
  (select card_rating from public.player_market_values
   where player_id = '77777777-7777-4777-8777-000000000002'),
  45,
  'and one standard deviation below is also adjusted by confidence'
);

-- Nobody to compare against yet, so the centre is the only honest answer.
select is(
  (select card_rating from public.player_market_values
   where player_id = '77777777-7777-4777-8777-000000000003'),
  62,
  'a player who has never been scored sits at the centre before confidence'
);

select is(
  (select confidence_pct from public.player_market_values
   where player_id = '77777777-7777-4777-8777-000000000001'),
  100::numeric,
  'four of the last six league matches fills the confidence donut'
);

select is(
  (select confidence_adjustment_pct from public.player_market_values
   where player_id = '77777777-7777-4777-8777-000000000002'),
  16.667::numeric,
  'one of the last six league matches keeps the raw confidence share'
);

select is(
  (select form_state from public.player_market_values
   where player_id = '77777777-7777-4777-8777-000000000001'),
  'up',
  'a latest rating score 5% above history shows an upward arrow'
);

-- ---------------------------------------------------------------------------
-- One match: the latest score is used directly
-- ---------------------------------------------------------------------------

select is(
  (select weighted_performance_score from public.player_market_values
   where player_id = '77777777-7777-4777-8777-000000000002'),
  2.0::numeric,
  'with one match the weighted score is that match rating score'
);

select is(
  (select market_value_gbp from public.player_market_values
   where player_id = '77777777-7777-4777-8777-000000000002'),
  45000000.00::numeric,
  'with one match the market value is the rating times the constant'
);

-- ---------------------------------------------------------------------------
-- No matches: no weighted rating score yet
-- ---------------------------------------------------------------------------

select is(
  (select matches_played from public.player_market_values
   where player_id = '77777777-7777-4777-8777-000000000003'),
  0,
  'a player who has never played reports zero matches'
);

select is(
  (select weighted_performance_score from public.player_market_values
   where player_id = '77777777-7777-4777-8777-000000000003'),
  0::numeric,
  'a player with no matches has no weighted rating score yet'
);

select ok(
  (select career_average is null from public.player_market_values
   where player_id = '77777777-7777-4777-8777-000000000003'),
  'a player with no matches has no career average'
);

-- ---------------------------------------------------------------------------
-- Clamping
-- ---------------------------------------------------------------------------

select is(
  public.to_card_stat(12.5::numeric),
  99,
  'card stats are clamped to 99'
);

select is(
  public.to_card_stat(-3::numeric),
  0,
  'card stats are clamped to 0'
);

-- ---------------------------------------------------------------------------
-- Per-metric averages
-- ---------------------------------------------------------------------------

select is(
  (select career_average from public.player_metric_averages
   where player_id = '77777777-7777-4777-8777-000000000001'
     and metric_code = 'attack'),
  8.5::numeric,
  'metric averages expose the 50/50 metric form score'
);

select is(
  (select (metric_card_stats ->> 'attack')::integer from public.player_cards
   where id = '77777777-7777-4777-8777-000000000001'),
  85,
  'player_cards exposes per-metric card stats from the weighted metric score'
);

select * from finish();
rollback;
