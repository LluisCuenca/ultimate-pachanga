-- ============================================================================
-- Guest players and the estimated market value
--
-- Both are administrator-supplied facts, and the interesting question about
-- each is what it does *not* do. The estimate must vanish behind the first real
-- result rather than anchoring a player forever, and being a guest must change
-- nothing about how anybody is scored or valued — the standings are a reading
-- of the league, and leaving somebody out of the reading is the whole feature.
--
-- Built on a league of its own, like 06_views, so the figures are exact rather
-- than relative to whatever the seeded roster happens to have done.
-- ============================================================================

begin;
select plan(14);

delete from public.league_members;

insert into auth.users (id, instance_id, aud, role, email)
values
  ('99999999-9999-4999-8999-00000000000a',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'admin@test.local'),
  ('99999999-9999-4999-8999-00000000000b',
   '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated', 'member@test.local');

insert into public.league_members (league_id, user_id, role)
values
  (app.initial_league_id(), '99999999-9999-4999-8999-00000000000a', 'admin'),
  (app.initial_league_id(), '99999999-9999-4999-8999-00000000000b', 'member');

-- ---------------------------------------------------------------------------
-- A league of four: one who has played, and three who have not — one priced by
-- the administrator, one a guest, one neither.
--
-- The constant is a round million so a score reads directly as a valuation.
-- ---------------------------------------------------------------------------

insert into public.leagues (id, title, market_constant_gbp)
values ('66666666-6666-4666-8666-000000000002', 'Liga de invitados', 1000000);

insert into public.league_metrics
  (league_id, code, label, display_order, minimum_score, maximum_score)
values
  ('66666666-6666-4666-8666-000000000002', 'attack',  'Ataque',  1, 0, 10),
  ('66666666-6666-4666-8666-000000000002', 'defence', 'Defensa', 2, 0, 10);

insert into public.players (
  id, league_id, player_code, first_name, last_name, preferred_position,
  is_guest, estimated_market_value_gbp
)
values
  ('77777777-7777-4777-8777-00000000000a',
   '66666666-6666-4666-8666-000000000002',
   'GST-0001', 'Ya', 'Jugado', 'CM', false, null),
  ('77777777-7777-4777-8777-00000000000b',
   '66666666-6666-4666-8666-000000000002',
   'GST-0002', 'Tasado', 'Sin Jugar', 'ST', false, 95000000),
  ('77777777-7777-4777-8777-00000000000c',
   '66666666-6666-4666-8666-000000000002',
   'GST-0003', 'Sin', 'Tasar', 'GK', false, null),
  ('77777777-7777-4777-8777-00000000000d',
   '66666666-6666-4666-8666-000000000002',
   'GST-0004', 'Un', 'Invitado', 'LW', true, null);

insert into public.matches (
  id, league_id, title, location, played_at,
  home_team_name, away_team_name, status, results_imported_at
)
values (
  '88888888-8888-4888-8888-00000000000a',
  '66666666-6666-4666-8666-000000000002', 'P1', 'Sitio',
  now() - interval '10 days', 'A', 'B', 'scored', now()
);

insert into public.match_players (match_id, player_id)
values ('88888888-8888-4888-8888-00000000000a',
        '77777777-7777-4777-8777-00000000000a');

insert into public.player_match_scores
  (match_id, player_id, metric_scores, base_score, attribute_points,
   final_score)
values (
  '88888888-8888-4888-8888-00000000000a',
  '77777777-7777-4777-8777-00000000000a',
  '{"attack": 6, "defence": 6}', 6.0, 0, 6.0
);

-- ---------------------------------------------------------------------------
-- The estimate stands in for a rating nobody has earned yet
-- ---------------------------------------------------------------------------

select is(
  (select market_value_gbp from public.player_market_values
   where player_id = '77777777-7777-4777-8777-00000000000b'),
  85000000.00::numeric,
  'a player with no matches is worth exactly what the administrator said'
);

-- The estimate is stored in pounds but read as a rating, so it no longer
-- invents a metric score before the player has played.
select is(
  (select weighted_performance_score from public.player_market_values
   where player_id = '77777777-7777-4777-8777-00000000000b'),
  0::numeric,
  'and does not invent a weighted rating score of its own'
);

select is(
  (select market_value_gbp from public.player_market_values
   where player_id = '77777777-7777-4777-8777-00000000000c'),
  62000000.00::numeric,
  'a player with no matches and no estimate sits at the centre rating'
);

-- Nothing about an estimate is a result, but it can be converted into a
-- provisional rating for balancing before the first match.
select is(
  (select card_rating from public.player_market_values
   where player_id = '77777777-7777-4777-8777-00000000000b'),
  85,
  'an estimate becomes a provisional rating while there is no match history'
);

-- ---------------------------------------------------------------------------
-- The first real result retires it
-- ---------------------------------------------------------------------------

insert into public.match_players (match_id, player_id)
values ('88888888-8888-4888-8888-00000000000a',
        '77777777-7777-4777-8777-00000000000b');

insert into public.player_match_scores
  (match_id, player_id, metric_scores, base_score, attribute_points,
   final_score)
values (
  '88888888-8888-4888-8888-00000000000a',
  '77777777-7777-4777-8777-00000000000b',
  '{"attack": 2, "defence": 2}', 2.0, 0, 2.0
);

select is(
  (select market_value_gbp from public.player_market_values
   where player_id = '77777777-7777-4777-8777-00000000000b'),
  45000000.00::numeric,
  'one match played and the estimate is gone, however wrong it turned out'
);

select is(
  (select estimated_market_value_gbp from public.players
   where id = '77777777-7777-4777-8777-00000000000b'),
  95000000.00::numeric,
  'though the estimate itself is kept, as the record of what was thought'
);

-- ---------------------------------------------------------------------------
-- Being a guest changes nothing the database computes
--
-- Deliberate: the standings hide a guest, the arithmetic does not. They played
-- the match, and taking their score out of the population would rewrite
-- everybody else's afternoon.
-- ---------------------------------------------------------------------------

select is(
  (select is_guest from public.players
   where id = '77777777-7777-4777-8777-00000000000a'),
  false,
  'a player is not a guest unless somebody says so'
);

insert into public.match_players (match_id, player_id)
values ('88888888-8888-4888-8888-00000000000a',
        '77777777-7777-4777-8777-00000000000d');

insert into public.player_match_scores
  (match_id, player_id, metric_scores, base_score, attribute_points,
   final_score)
values (
  '88888888-8888-4888-8888-00000000000a',
  '77777777-7777-4777-8777-00000000000d',
  '{"attack": 10, "defence": 10}', 10.0, 0, 10.0
);

select is(
  (select market_value_gbp from public.player_market_values
   where player_id = '77777777-7777-4777-8777-00000000000d'),
  85000000.00::numeric,
  'a guest is valued like anybody else'
);

-- Weighted rating scores are now 3.0, 1.0 and 5.0: mean 3.0, population spread
-- 1.633. The guest is in that population, so the player on 3.0 sits exactly at
-- the centre. Drop the guest and the mean would be 4.0 and this would not be 72.
select is(
  (select card_rating from public.player_market_values
   where player_id = '77777777-7777-4777-8777-00000000000a'),
  63,
  'and still counts towards the spread everybody else is rated against'
);

-- ---------------------------------------------------------------------------
-- Both reach the card the application reads
-- ---------------------------------------------------------------------------

select is(
  (select is_guest from public.player_cards
   where id = '77777777-7777-4777-8777-00000000000d'),
  true,
  'player_cards carries the guest flag, which is what the pages filter on'
);

select is(
  (select estimated_market_value_gbp from public.player_cards
   where id = '77777777-7777-4777-8777-00000000000b'),
  95000000.00::numeric,
  'and the estimate, so the edit dialog can show what was entered'
);

-- ---------------------------------------------------------------------------
-- A negative price is not an opinion
-- ---------------------------------------------------------------------------

select throws_ok(
  $$update public.players set estimated_market_value_gbp = -1
    where id = '77777777-7777-4777-8777-00000000000c'$$,
  '23514',
  null,
  'an estimate cannot be negative'
);

-- ---------------------------------------------------------------------------
-- Neither field is a member's to set
-- ---------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to
  '{"sub": "99999999-9999-4999-8999-00000000000b", "role": "authenticated"}';

with attempted as (
  update public.players
  set is_guest = true
  where player_code = 'JORDI'
  returning 1
)
select is(
  (select count(*)::integer from attempted),
  0,
  'a member cannot make somebody a guest'
);

with attempted as (
  update public.players
  set estimated_market_value_gbp = 99000000
  where player_code = 'JORDI'
  returning 1
)
select is(
  (select count(*)::integer from attempted),
  0,
  'nor price them'
);

select * from finish();
rollback;
