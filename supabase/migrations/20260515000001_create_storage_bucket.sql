-- Create storage bucket for images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- Enable RLS on storage.objects
drop policy if exists "Allow public read access" on storage.objects;
create policy "Allow public read access" on storage.objects
for select using (bucket_id = 'images');

-- Allow authenticated users to upload
drop policy if exists "Allow authenticated uploads" on storage.objects;
create policy "Allow authenticated uploads" on storage.objects
for insert with check (bucket_id = 'images' and auth.role() in ('authenticated', 'anon'));

-- Allow authenticated users to delete their own files
drop policy if exists "Allow authenticated deletes" on storage.objects;
create policy "Allow authenticated deletes" on storage.objects
for delete using (bucket_id = 'images' and auth.role() in ('authenticated', 'anon'));
