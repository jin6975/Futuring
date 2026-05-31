-- =============================================
-- Futuring 전체 스키마
-- Supabase SQL Editor에서 한번에 실행하세요
-- =============================================

-- 1. profiles (유저 프로필)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  is_admin boolean default false,
  wallet_balance bigint default 5000,
  win_rate numeric default 0,
  total_pnl bigint default 0,
  last_daily_reward_at timestamptz,
  equipped_frame text,
  equipped_badge text,
  equipped_theme text,
  created_at timestamptz default now()
);

-- 2. follows (팔로우)
create table if not exists follows (
  follower text not null,
  following text not null,
  created_at timestamptz default now(),
  primary key (follower, following)
);

-- 3. markets (마켓)
create table if not exists markets (
  id text primary key,
  topic text not null,
  description text,
  type text not null default 'binary',
  owner text,
  side_a_name text,
  side_b_name text,
  side_a_pool bigint default 0,
  side_b_pool bigint default 0,
  options jsonb,
  status text default 'live',
  resolved_side text,
  resolved_option_id text,
  category text,
  ticker text,
  resolves_at timestamptz,
  created_at timestamptz default now()
);

-- 4. bets (베팅)
create table if not exists bets (
  id text primary key,
  user_id uuid references profiles(id) on delete cascade,
  username text not null,
  market_id text references markets(id) on delete cascade,
  side text not null,
  amount bigint not null,
  balance_before bigint,
  balance_after bigint,
  action text default 'PLEDGE',
  created_at timestamptz default now()
);

-- 5. community_posts (커뮤니티 피드)
create table if not exists community_posts (
  id text primary key,
  username text not null,
  content text not null,
  market_id text,
  market_topic text,
  side text,
  amount bigint,
  likes int default 0,
  created_at timestamptz default now()
);

-- 6. post_likes (좋아요)
create table if not exists post_likes (
  post_id text not null,
  username text not null,
  primary key (post_id, username)
);

-- 7. shop_items (구매 아이템)
create table if not exists user_items (
  id text primary key,
  user_id uuid references profiles(id) on delete cascade,
  item_id text not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- 8. whale_battles (고래 배틀)
create table if not exists whale_battles (
  id text primary key,
  challenger text not null,
  challenger_color text,
  challenger_badge text,
  defender text not null,
  defender_color text,
  defender_badge text,
  condition text,
  duration int,
  start_at timestamptz,
  end_at timestamptz,
  prize bigint default 0,
  status text default 'live',
  pool_for bigint default 0,
  pool_against bigint default 0,
  created_at timestamptz default now()
);

-- 9. whale_battle_bets (고래 배틀 베팅)
create table if not exists whale_battle_bets (
  id text primary key,
  battle_id text references whale_battles(id) on delete cascade,
  username text not null,
  side text not null,
  amount bigint not null,
  created_at timestamptz default now()
);

-- 10. auctions (경매)
create table if not exists auctions (
  id text primary key,
  title text not null,
  description text,
  end_at timestamptz,
  top_bid bigint default 0,
  top_bidder text,
  min_increment bigint default 1000,
  status text default 'live',
  created_at timestamptz default now()
);

-- 11. lp_positions (LP 예치)
create table if not exists lp_positions (
  id text primary key,
  user_id uuid references profiles(id) on delete cascade,
  pool_id text not null,
  amount bigint not null,
  created_at timestamptz default now()
);

-- =============================================
-- RLS (Row Level Security) 설정
-- =============================================

alter table profiles enable row level security;
alter table follows enable row level security;
alter table markets enable row level security;
alter table bets enable row level security;
alter table community_posts enable row level security;
alter table post_likes enable row level security;
alter table user_items enable row level security;
alter table whale_battles enable row level security;
alter table whale_battle_bets enable row level security;
alter table auctions enable row level security;
alter table lp_positions enable row level security;

-- profiles: 누구나 읽기, 본인만 수정
create policy "profiles_read" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- follows: 누구나 읽기, 본인만 추가/삭제
create policy "follows_read" on follows for select using (true);
create policy "follows_insert" on follows for insert with check (auth.uid() is not null);
create policy "follows_delete" on follows for delete using (auth.uid() is not null);

-- markets: 누구나 읽기, 관리자만 생성/수정
create policy "markets_read" on markets for select using (true);
create policy "markets_insert" on markets for insert with check (auth.uid() is not null);
create policy "markets_update" on markets for update using (auth.uid() is not null);

-- bets: 누구나 읽기, 로그인한 유저만 베팅
create policy "bets_read" on bets for select using (true);
create policy "bets_insert" on bets for insert with check (auth.uid() is not null);

-- community_posts: 누구나 읽기, 로그인한 유저만 작성
create policy "posts_read" on community_posts for select using (true);
create policy "posts_insert" on community_posts for insert with check (auth.uid() is not null);

-- post_likes
create policy "likes_read" on post_likes for select using (true);
create policy "likes_insert" on post_likes for insert with check (auth.uid() is not null);
create policy "likes_delete" on post_likes for delete using (auth.uid() is not null);

-- user_items
create policy "items_read" on user_items for select using (auth.uid() = user_id);
create policy "items_insert" on user_items for insert with check (auth.uid() = user_id);

-- whale_battles
create policy "battles_read" on whale_battles for select using (true);
create policy "battles_insert" on whale_battles for insert with check (auth.uid() is not null);
create policy "battles_update" on whale_battles for update using (auth.uid() is not null);

-- whale_battle_bets
create policy "battle_bets_read" on whale_battle_bets for select using (true);
create policy "battle_bets_insert" on whale_battle_bets for insert with check (auth.uid() is not null);

-- auctions
create policy "auctions_read" on auctions for select using (true);
create policy "auctions_insert" on auctions for insert with check (auth.uid() is not null);
create policy "auctions_update" on auctions for update using (auth.uid() is not null);

-- lp_positions
create policy "lp_read" on lp_positions for select using (auth.uid() = user_id);
create policy "lp_insert" on lp_positions for insert with check (auth.uid() = user_id);
create policy "lp_delete" on lp_positions for delete using (auth.uid() = user_id);

-- =============================================
-- 초기 마켓 데이터 삽입
-- =============================================

insert into markets (id, topic, description, type, owner, side_a_name, side_b_name, side_a_pool, side_b_pool, status, resolved_side, category, resolves_at, created_at) values
('debate-001', '2026년 내 연준 기준금리 4% 미만 인하', '연방준비제도가 2026년 3분기 말 이전에 기준금리를 4.00% 미만으로 인하할까요?', 'binary', 'cjdmadldpdy123', 'YES — 4% 미만', 'NO — 4% 유지', 3200, 1800, 'live', null, '거시경제', now() + interval '60 days', now() - interval '3 days'),
('debate-002', '2026년 비트코인 도미넌스 60% 돌파', '비트코인 시장 점유율이 2026년 중 60%를 넘을까요?', 'binary', 'cjdmadldpdy123', 'YES — 60% 초과', 'NO — 60% 미만', 5500, 4100, 'live', null, '크립토', now() + interval '45 days', now() - interval '7 days'),
('debate-003', '비트코인 2027년 전 2억원 돌파', '비트코인이 2027년 1월 1일 이전에 2억원을 기록할까요?', 'binary', 'cjdmadldpdy123', 'YES — 2억원 돌파', 'NO — 2억원 미달', 8200, 6100, 'live', null, '크립토', now() + interval '90 days', now() - interval '2 days'),
('debate-004', '2027년까지 엔비디아 AI칩 1위 유지', '엔비디아가 2027년 말까지 AI 가속기 시장점유율 1위를 유지할까요?', 'binary', 'cjdmadldpdy123', 'YES — 1위 유지', 'NO — 순위 하락', 7400, 2600, 'live', null, '테크 / AI', now() + interval '120 days', now() - interval '5 days'),
('debate-005', '애플 AR 글래스 2026년 출시', '애플이 2026년 12월 31일 이전에 소비자용 AR 글래스를 출시할까요?', 'binary', 'cjdmadldpdy123', 'YES — 2026년 출시', 'NO — 출시 연기', 2900, 5800, 'live', null, '테크', now() + interval '75 days', now() - interval '1 days'),
('debate-006', '코스피 2026년 중 3,500 돌파', '코스피 지수가 2026년 중 3,500포인트를 기록할까요?', 'binary', 'cjdmadldpdy123', 'YES — 3,500 돌파', 'NO — 3,500 미달', 4100, 3900, 'live', null, '주식', now() + interval '50 days', now() - interval '4 days'),
('debate-007', 'GPT-5 2026년 3분기 전 공개 출시', '오픈AI가 2026년 7월 1일 이전에 GPT-5를 공개할까요?', 'binary', 'cjdmadldpdy123', 'YES — 3분기 전 출시', 'NO — 출시 지연', 6300, 3700, 'live', null, '테크 / AI', now() + interval '40 days', now() - interval '6 days'),
('debate-008', '2026년 이더리움 시총이 비트코인 추월', '이더리움의 시가총액이 2026년 중 비트코인을 넘어설까요?', 'binary', 'cjdmadldpdy123', 'YES — 이더 역전', 'NO — 비트코인 우위', 1800, 7200, 'live', null, '크립토', now() + interval '80 days', now() - interval '10 days')
on conflict (id) do nothing;

insert into markets (id, topic, description, type, owner, side_a_name, side_b_name, side_a_pool, side_b_pool, options, status, resolved_side, category, resolves_at, created_at) values
('debate-009', '2026 KBO 한국시리즈 우승팀', '2026년 KBO 한국시리즈 우승팀을 예측하세요.', 'multi', 'cjdmadldpdy123', '', '', 0, 0,
'[{"id":"opt-lg","name":"LG 트윈스","pool":2800},{"id":"opt-kia","name":"KIA 타이거즈","pool":3200},{"id":"opt-samsung","name":"삼성 라이온즈","pool":1500},{"id":"opt-kt","name":"KT 위즈","pool":1200},{"id":"opt-other","name":"기타 팀","pool":800}]',
'live', null, '스포츠', now() + interval '150 days', now() - interval '2 days')
on conflict (id) do nothing;

-- 초기 경매 데이터
insert into auctions (id, title, description, end_at, top_bid, top_bidder, min_increment, status) values
('a1', '🏰 시즌 군주 칭호', '30일간 👑 배지 + 예측 확률 선점권', now() + interval '18 hours', 120000, 'whale_89', 5000, 'live'),
('a2', '⚡ 마켓 스폰서 슬롯', '홈 히어로 배너 + 최상단 노출 7일', now() + interval '36 hours', 80000, 'alpha_kim', 3000, 'live')
on conflict (id) do nothing;

-- 초기 고래 배틀 데이터
insert into whale_battles (id, challenger, challenger_color, challenger_badge, defender, defender_color, defender_badge, condition, duration, start_at, end_at, prize, status, pool_for, pool_against) values
('b1', 'whale_89', '#7C3AED', '👑 군주', 'btc_maxi', '#F59E0B', '🔮 오라클', '수익률 대결', 168, now() - interval '24 hours', now() + interval '144 hours', 100000, 'live', 320000, 280000),
('b2', 'alpha_kim', '#0891B2', '🏆 마스터', 'macro_pro', '#10B981', '✅ 검증됨', '예측 적중률', 336, now() - interval '48 hours', now() + interval '288 hours', 200000, 'live', 180000, 420000)
on conflict (id) do nothing;

-- =============================================
-- RPC 함수
-- =============================================

-- 좋아요 카운터 증가
create or replace function increment_likes(post_id text)
returns void language plpgsql as $$
begin
  update community_posts set likes = likes + 1 where id = post_id;
end;
$$;

-- 포인트 송금
create or replace function transfer_points(from_username text, to_username text, amount bigint)
returns void language plpgsql security definer as $$
begin
  update profiles set wallet_balance = wallet_balance - amount where username = from_username and wallet_balance >= amount;
  update profiles set wallet_balance = wallet_balance + amount where username = to_username;
end;
$$;
