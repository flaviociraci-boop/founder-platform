-- ============================================================
-- Founder Platform — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Profiles (founders / users)
create table if not exists profiles (
  id         serial primary key,
  name       text not null,
  age        integer,
  category   text,
  role       text,
  location   text,
  followers  integer default 0,
  following  integer default 0,
  tags       text[] default '{}',
  bio        text,
  seeking    text,
  avatar     text,
  color      text
);

-- Companies linked to a profile
create table if not exists companies (
  id         serial primary key,
  profile_id integer references profiles(id) on delete cascade,
  name       text not null,
  role       text,
  year       text,
  type       text,
  active     boolean default true
);

-- Projects / collaboration posts
create table if not exists projects (
  id          serial primary key,
  user_id     integer references profiles(id),
  title       text not null,
  description text,
  category    text,
  location    text,
  model       text,
  tags        text[] default '{}',
  applicants  integer default 0,
  color       text,
  avatar      text,
  user_name   text,
  created_at  timestamptz default now()
);

-- Follow relationships
create table if not exists follows (
  follower_id  integer references profiles(id) on delete cascade,
  following_id integer references profiles(id) on delete cascade,
  primary key (follower_id, following_id)
);

-- Connect / Match requests
create table if not exists connections (
  user_id    integer references profiles(id) on delete cascade,
  target_id  integer references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, target_id)
);

-- Project applications
create table if not exists applications (
  project_id integer references projects(id) on delete cascade,
  user_id    integer references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (project_id, user_id)
);

-- ============================================================
-- Seed Data
-- ============================================================

insert into profiles (id, name, age, category, role, location, followers, following, tags, bio, seeking, avatar, color) values
  (1, 'Lena Hoffmann', 24, 'ecommerce', 'E-Commerce Gründerin', 'München', 1240, 380, '{"Shopify","Amazon FBA","Dropshipping"}', 'Ich baue E-Commerce Brands von 0 auf. Gerade skaliere ich meinen 3. Shop.', 'Investoren', 'LH', '#f97316'),
  (2, 'Max Berger',    27, 'apps',      'Indie App Developer',   'Berlin',  890,  210, '{"React Native","iOS","Startup"}',         'Solo-Founder. Baue Apps die echte Probleme lösen. 2 Apps im App Store.',    'Mitgründer', 'MB', '#6366f1'),
  (3, 'Sara Kaya',     22, 'freelancer','Brand Designer',        'Wien',    2100, 560, '{"Branding","UI/UX","Figma"}',             'Helfe Gründern, professionell auszusehen — von Logo bis Website.',          'Kunden',     'SK', '#f59e0b'),
  (4, 'Jonas Müller',  26, 'trading',   'Trader & Mentor',       'Zürich',  3400, 120, '{"Forex","Krypto","Optionen"}',            'Full-time Trader seit 3 Jahren. Gebe mein Wissen weiter.',                  'Community',  'JM', '#10b981'),
  (5, 'Mia Schreiber', 23, 'marketing', 'Growth Marketerin',     'Hamburg', 1780, 430, '{"TikTok","Meta Ads","Content"}',          'Ich skaliere Brands mit paid & organic Social.',                            'Projektpartner', 'MS', '#ec4899'),
  (6, 'Finn Larsen',   29, 'saas',      'SaaS Founder',          'Berlin',  670,  290, '{"B2B","AI Tools","Bootstrapped"}',        'Baue mein erstes SaaS bootstrapped. Suche Co-Founder.',                     'Mitgründer', 'FL', '#3b82f6')
on conflict (id) do nothing;

-- Reset sequence after manual inserts
select setval('profiles_id_seq', (select max(id) from profiles));

insert into companies (profile_id, name, role, year, type, active) values
  (1, 'LunaWear',       'Gründerin & CEO', '2022', 'Fashion Brand',    true),
  (1, 'NordLight Store','Co-Founderin',    '2021', 'Home Decor',       false),
  (2, 'Focusly',        'Founder',         '2023', 'Productivity App', true),
  (2, 'TrackMate',      'Founder',         '2022', 'Fitness App',      true),
  (3, 'Kaya Studio',    'Inhaberin',       '2023', 'Design Agentur',   true),
  (4, 'AlphaDesk',      'Gründer',         '2021', 'Trading Education',true),
  (5, 'Schreiber Media','Gründerin',       '2022', 'Marketing Agentur',true),
  (6, 'Pipeflow',       'Founder & CTO',   '2023', 'B2B SaaS',         true)
on conflict do nothing;

insert into projects (user_id, title, description, category, location, model, tags, applicants, color, avatar, user_name, created_at) values
  (1, 'Marketing-Partner für Fashion Brand gesucht',
      'Suche jemanden mit TikTok & Instagram Erfahrung für LunaWear. Umsatzbeteiligung möglich.',
      'marketing', 'Remote', 'Umsatzbeteiligung', '{"TikTok","Instagram","Fashion"}', 3, '#f97316', 'LH', 'Lena Hoffmann',
      now() - interval '2 hours'),
  (2, 'iOS Developer für Fitness-App gesucht',
      'Meine App TrackMate braucht einen weiteren Dev. Equity-Deal für den richtigen Partner.',
      'apps', 'Berlin / Remote', 'Equity', '{"Swift","iOS","Fitness"}', 7, '#6366f1', 'MB', 'Max Berger',
      now() - interval '5 hours'),
  (4, 'Trading Community aufbauen — Co-Host gesucht',
      'Suche jemanden der mit mir einen Podcast + Discord für Trader im DACH-Raum aufbaut.',
      'trading', 'Remote', '50/50 Partnerschaft', '{"Podcast","Community","Trading"}', 2, '#10b981', 'JM', 'Jonas Müller',
      now() - interval '1 day'),
  (6, 'B2B Sales Partner für SaaS Produkt',
      'Pipeflow braucht jemanden mit B2B Sales Erfahrung. Attraktive Provision pro Abschluss.',
      'saas', 'DACH-Raum', 'Provision', '{"B2B","Sales","SaaS"}', 5, '#3b82f6', 'FL', 'Finn Larsen',
      now() - interval '2 days'),
  (3, 'Rebranding Projekt — E-Commerce Brand',
      'Biete komplettes Branding-Paket für einen aufstrebenden Shop an. Auf der Suche nach dem richtigen Projekt.',
      'freelancer', 'Wien / Remote', 'Bezahltes Projekt', '{"Branding","Logo","E-Commerce"}', 1, '#f59e0b', 'SK', 'Sara Kaya',
      now() - interval '3 days')
on conflict do nothing;
