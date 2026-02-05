# Baby Tracker

A modern Progressive Web App for tracking your baby's daily activities - sleep, feeding, diaper changes, and pumping sessions.

## Features

- 📊 Track sleep, feeding, diaper changes & pumping
- 👥 Share access with multiple caregivers
- 📱 Works offline as a Progressive Web App
- 🔄 Real-time sync across all devices
- 🔒 Secure authentication with Supabase

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (Auth, Database, Realtime)
- **PWA**: next-pwa

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key

4. Set up the database:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the SQL script from `supabase/schema.sql`

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The app uses two main tables:

- **babies**: Stores baby profiles with owner and caregiver relationships
- **events**: Stores all tracking events (sleep, feed, diaper, pumping)

Row-Level Security (RLS) policies ensure that users can only access data for babies they own or care for.

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and configs
│   ├── supabase/   # Supabase client configs
│   └── types.ts    # TypeScript type definitions
└── styles/         # Global styles
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
