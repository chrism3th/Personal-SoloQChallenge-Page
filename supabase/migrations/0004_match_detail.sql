-- SoloQ Arena — detalle de partida: hechizos, runas, items, kill
-- participation y rival de línea, para el historial de partidas del
-- perfil de jugador.

alter table match_participants
  add column summoner_spell1_id int,
  add column summoner_spell2_id int,
  add column primary_rune_id int,        -- keystone (perk específico)
  add column primary_rune_style_id int,  -- árbol primario (ej. Domination)
  add column sub_rune_style_id int,      -- árbol secundario
  add column item0 int,
  add column item1 int,
  add column item2 int,
  add column item3 int,
  add column item4 int,
  add column item5 int,
  add column item6 int,                  -- trinket
  add column kill_participation numeric(4, 3),
  add column opponent_champion_id int,
  add column opponent_champion_name text;
