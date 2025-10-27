-- Create the User table for authentication
CREATE TABLE IF NOT EXISTS public."User" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NULL,
  email text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  "Roleid" uuid NULL,
  hashed_password text NOT NULL,
  CONSTRAINT User_pkey PRIMARY KEY (id),
  CONSTRAINT User_email_key UNIQUE (email)
) TABLESPACE pg_default;

-- Example: Create a test user (password: "password123")
-- The hashed password for "password123" using bcrypt is provided below
-- To create your own password hash, use: node -e "console.log(require('bcryptjs').hashSync('yourpassword', 10))"
-- OR use an online bcrypt generator
INSERT INTO public."User" (name, email, hashed_password)
VALUES (
  'Admin User',
  'admin@example.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
)
ON CONFLICT (email) DO NOTHING;

-- Note: The hashed password above is for "password123"
-- Change this before deploying to production!

