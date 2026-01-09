# MachineBio

A social platform for car enthusiasts to share their builds, track modifications, and connect with other gearheads.

## Features

- **Garage Management**: Add and manage your cars with detailed specs, modifications, and photo albums
- **Car Spotting**: Spot rare cars in the wild, share locations, and play guess-the-car challenges
- **Social Feed**: Follow users and cars, like posts, and engage with the community
- **Events**: Discover and organize car meets, track days, and road trips
- **Leaderboards**: Track performance times for 0-100, quarter mile, and lap times
- **Car Database**: Extensive database with 124+ brands, 7000+ models, and 30000+ engine configurations

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Supabase project (for auth and storage)

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd machinebio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
   - `SESSION_SECRET` - Secret for JWT signing

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. (Optional) Import car database:
   ```bash
   # Download automobile data
   curl -L "https://github.com/ilyasozkurt/automobile-models-and-specs/raw/master/automobiles.json.zip" -o /tmp/automobiles.json.zip
   unzip -o /tmp/automobiles.json.zip -d /tmp/

   # Run import script
   npx tsx scripts/import-cars.ts
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── [locale]/        # i18n routes (en, de, ru, sr)
│   │   ├── admin/       # Admin panel (founders only)
│   │   ├── cars/        # Car catalog browser
│   │   ├── events/      # Events listing
│   │   ├── garage/      # User garage management
│   │   ├── spots/       # Car spotting feature
│   │   └── u/           # User profiles
│   └── api/             # API routes
├── components/
│   ├── layout/          # Navbar, sidebar, etc.
│   ├── spots/           # Car spotting components
│   └── ui/              # Reusable UI components
├── hooks/               # React hooks
├── i18n/                # Internationalization
├── lib/                 # Utilities (auth, prisma, supabase)
└── scripts/             # Data import scripts
```

## Admin Access

Founder emails configured in `src/lib/auth.ts` get automatic "God Mode" access with ability to:
- Verify/unverify any user
- Change user roles (user, moderator, admin)
- Delete users and content
- View platform statistics

Access the admin panel at `/admin` when logged in as founder.

## License

MIT
