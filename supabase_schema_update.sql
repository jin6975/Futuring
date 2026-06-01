-- =============================================
-- Futuring 추가 스키마 (기존 스키마에 추가 실행)
-- =============================================

-- 경제 설정 테이블
create table if not exists economy_settings (
  id text primary key default 'global',
  daily_reward int default 200,
  house_edge numeric default 2,
  max_bet_pct int default 50,
  decay_rate numeric default 1,
  burn_rate numeric default 5,
  updated_at timestamptz default now()
);

-- 초기 데이터
insert into economy_settings (id, daily_reward, house_edge, max_bet_pct, decay_rate, burn_rate)
values ('global', 200, 2, 50, 1, 5)
on conflict (id) do nothing;

-- RLS
alter table economy_settings enable row level security;
create policy "economy_read" on economy_settings for select using (true);
create policy "economy_update" on economy_settings for update using (auth.uid() is not null);
create policy "economy_insert" on economy_settings for insert with check (auth.uid() is not null);

-- 현상금 테이블
create table if not exists bounties (
  id text primary key,
  topic text not null,
  reward bigint not null,
  sponsor text not null,
  condition text not null,
  deadline timestamptz not null,
  participants int default 0,
  status text default 'live',
  winner_id text,
  market_id text,
  created_at timestamptz default now()
);

alter table bounties enable row level security;
create policy "bounties_read" on bounties for select using (true);
create policy "bounties_insert" on bounties for insert with check (auth.uid() is not null);
create policy "bounties_update" on bounties for update using (auth.uid() is not null);

-- 현상금 참여자 테이블
create table if not exists bounty_participants (
  id text primary key,
  bounty_id text references bounties(id) on delete cascade,
  username text not null,
  created_at timestamptz default now(),
  unique (bounty_id, username)
);

alter table bounty_participants enable row level security;
create policy "bounty_part_read" on bounty_participants for select using (true);
create policy "bounty_part_insert" on bounty_participants for insert with check (auth.uid() is not null);

-- whale_battles에 winner_id 컬럼 추가 (없으면)
alter table whale_battles add column if not exists winner_id text;

-- 예시 현상금 데이터
insert into bounties (id, topic, reward, sponsor, condition, deadline, participants, status) values
('bounty-001', 'Fed 금리 2026년 4% 미만', 30000, 'fed_watch', '정답 베터 중 최상위 1명', now() + interval '15 days', 42, 'live'),
('bounty-002', '비트코인 2억원 돌파', 50000, 'btc_maxi', '정답 + 최대 베팅자', now() + interval '30 days', 128, 'live')
on conflict (id) do nothing;
