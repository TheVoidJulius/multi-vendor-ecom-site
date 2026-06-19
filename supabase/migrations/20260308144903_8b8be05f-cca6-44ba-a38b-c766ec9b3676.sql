
-- Create vendor messages table
CREATE TABLE public.vendor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  message text NOT NULL,
  is_from_vendor boolean NOT NULL DEFAULT false,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_messages ENABLE ROW LEVEL SECURITY;

-- Sender can view their own messages
CREATE POLICY "Users can view their own messages" ON public.vendor_messages
  FOR SELECT USING (auth.uid() = sender_id);

-- Users can send messages
CREATE POLICY "Users can send messages" ON public.vendor_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id AND is_from_vendor = false);

-- Vendors can view messages to their store
CREATE POLICY "Vendors can view their store messages" ON public.vendor_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = vendor_messages.vendor_id AND vendors.user_id = auth.uid())
  );

-- Vendors can reply (insert as vendor)
CREATE POLICY "Vendors can reply to messages" ON public.vendor_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = vendor_messages.vendor_id AND vendors.user_id = auth.uid())
    AND is_from_vendor = true
  );

-- Vendors can mark messages as read
CREATE POLICY "Vendors can update message read status" ON public.vendor_messages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.vendors WHERE vendors.id = vendor_messages.vendor_id AND vendors.user_id = auth.uid())
  );

-- Admins can manage all messages
CREATE POLICY "Admins can manage messages" ON public.vendor_messages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_messages;
