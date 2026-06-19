
-- Add 'vendor' to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'vendor';

-- Create vendors table
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  store_name text NOT NULL,
  store_slug text NOT NULL UNIQUE,
  store_description text,
  logo_url text,
  banner_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  commission_rate numeric NOT NULL DEFAULT 10,
  total_earnings numeric NOT NULL DEFAULT 0,
  total_paid numeric NOT NULL DEFAULT 0,
  phone text,
  email text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add vendor_id to products
ALTER TABLE public.products ADD COLUMN vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL;

-- Add is_approved column to products for vendor product approval
ALTER TABLE public.products ADD COLUMN is_approved boolean DEFAULT true;

-- Create vendor_earnings table to track per-order earnings
CREATE TABLE public.vendor_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  commission numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_earnings ENABLE ROW LEVEL SECURITY;

-- Vendors RLS policies
CREATE POLICY "Approved vendors are viewable by everyone" ON public.vendors
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view their own vendor profile" ON public.vendors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vendor profile" ON public.vendors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendor profile" ON public.vendors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage vendors" ON public.vendors
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Vendor earnings RLS
CREATE POLICY "Vendors can view their own earnings" ON public.vendor_earnings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = vendor_earnings.vendor_id AND vendors.user_id = auth.uid())
  );

CREATE POLICY "Admins can manage earnings" ON public.vendor_earnings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Update products policy: vendors can manage their own products
CREATE POLICY "Vendors can manage their own products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = products.vendor_id AND vendors.user_id = auth.uid() AND vendors.status = 'approved')
  );

-- Add realtime for vendors
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendors;
