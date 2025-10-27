# Dubsea Payment Portal

A secure payment portal with HMAC-protected payment links and NextAuth authentication.

## Features

- 🔐 **Secure Authentication** - NextAuth with Supabase
- 💳 **Payment Links** - Generate secure Stripe payment links
- 📧 **Email Integration** - Send payment links via email
- 🎫 **Invoice Management** - Create and manage invoices
- 📄 **Receipt Generation** - Download PDF receipts

## Routes

### Protected (Requires Login)
- `/` - Home page
- `/invoicing` - Payment link builder

### Public (Customer-facing)
- `/billing` - Customer registration
- `/pay` - Payment page
- `/success` - Payment success page
- `/login` - Login page

## Authentication

The application uses NextAuth for authentication with Supabase backend.

**Default Credentials:**
- Email: `admin@example.com`
- Password: `password123`

⚠️ **Change these credentials before deploying to production!**

## Environment Variables

Create a `.env.local` file with the following:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...

# Email Configuration
SENDGRID_API_KEY=SG...

# HMAC Configuration
HMAC_SECRET=your_hmac_secret
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm start
```

## Database Setup

Run the migration in your Supabase dashboard (see `supabase-migration.sql`).

## Security Features

✅ **No Search Engine Indexing** - All pages blocked from Google and other search engines
- robots.txt file (blocks all crawlers)
- robots meta tags on all pages
- X-Robots-Tag header
- Empty sitemap.xml

✅ **Route Protection** - Protected pages require authentication
✅ **HMAC Signature** - Payment links are signed and validated
✅ **JWT Sessions** - Secure session management

## Creating Users

To create additional users, use the password hash generator:

```bash
node scripts/generate-password-hash.js "yourpassword"
```

Then insert into your Supabase `User` table:

```sql
INSERT INTO public."User" (name, email, hashed_password)
VALUES ('User Name', 'user@example.com', '<generated-hash>');
```

## License

Private - All Rights Reserved
