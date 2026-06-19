
-- Add UPI and QR code columns to vendors table
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS upi_id text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS qr_code_url text;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS owner_name text;

-- Create storage bucket for vendor assets (logos, banners, QR codes, product images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('vendor-assets', 'vendor-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for vendor-assets bucket
CREATE POLICY "Anyone can view vendor assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vendor-assets');

CREATE POLICY "Authenticated users can upload vendor assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vendor-assets');

CREATE POLICY "Users can update their own vendor assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vendor-assets');

CREATE POLICY "Users can delete their own vendor assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vendor-assets');
