-- Images have their own cacheable URLs. Catalogue queries never fetch photo bytes.
create table if not exists catalog_photos (
  id text primary key,
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  bytes bytea not null check (octet_length(bytes) between 1 and 1000000),
  created_at timestamptz not null default now()
);

alter table catalog_items add column if not exists photo_id text references catalog_photos(id);
create index if not exists catalog_items_photo_idx on catalog_items(photo_id);

-- Preserve photos uploaded by the old panel; no reset of existing products.
insert into catalog_photos (id, content_type, bytes)
select distinct md5(image_url), split_part(substr(image_url, 6), ';', 1),
  decode(split_part(image_url, ',', 2), 'base64')
from catalog_items
where image_url ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$'
on conflict (id) do nothing;

update catalog_items
set photo_id = md5(image_url), image_url = '/media/' || md5(image_url)
where image_url like 'data:image/%'
  and exists (select 1 from catalog_photos where id = md5(catalog_items.image_url));

-- A malformed legacy photo fails the migration atomically instead of being discarded.
alter table catalog_items add constraint catalog_items_image_reference
  check (length(image_url) <= 2048 and image_url not like 'data:%');

create table if not exists atelier_login_limits (
  bucket_key text primary key,
  attempts integer not null check (attempts > 0),
  expires_at timestamptz not null
);
create index if not exists atelier_login_limits_expiry_idx on atelier_login_limits(expires_at);
