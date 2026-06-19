
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_emails text;
  _email text;
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  SELECT value INTO _admin_emails
  FROM public.store_settings
  WHERE key = 'admin_emails';
  
  _email := lower(NEW.email);
  
  IF _admin_emails IS NOT NULL AND _email = ANY(string_to_array(lower(_admin_emails), ',')) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$$;
