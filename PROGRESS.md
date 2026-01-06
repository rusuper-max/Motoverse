# Motoverse - Development Progress

A social network for car enthusiasts, inspired by drive2.ru.

## What Has Been Done

### Project Setup
- [x] Created Next.js 15 project with TypeScript
- [x] Configured Tailwind CSS for styling
- [x] Set up project folder structure (`components`, `lib`, `types`, `hooks`, `actions`)
- [x] Initialized Git repository

### Database
- [x] Set up Prisma ORM with SQLite (for development)
- [x] Created database schema with the following models:
  - **User** - profiles with username, bio, avatar, location
  - **CarMake** - car manufacturer catalog (55+ brands)
  - **CarModel** - model database linked to makes (150+ models)
  - **Car** - user's garage entries linked to catalog
  - **Post** - build logs, maintenance records, journeys
  - **Comment** - discussions on posts
  - **Like** - post reactions
  - **Follow** - user following system
  - **Listing** - car marketplace listings
- [x] Ran database migrations
- [x] Seeded car catalog with popular makes and models

### Car Catalog (drive2.ru-style)
- [x] **55+ Car Makes** including:
  - Popular: BMW, Mercedes, Audi, VW, Toyota, Honda, Nissan, Ford, Chevrolet, Porsche
  - Premium: Ferrari, Lamborghini, Aston Martin, Bentley, Rolls-Royce, McLaren
  - Asian: Hyundai, Kia, Mazda, Subaru, Mitsubishi, Suzuki
  - European: Volvo, Peugeot, Renault, Opel, Škoda, Seat, Fiat, Alfa Romeo
  - American: Tesla, Jeep, Cadillac, Lincoln, Dodge, Ram, GMC

- [x] **150+ Car Models** with metadata:
  - Body types (sedan, hatchback, SUV, coupe, wagon, convertible, truck, van)
  - Production years (start/end)
  - Examples: BMW 3/5/7 Series, M3, X5 | Mercedes C/E/S-Class, AMG GT | etc.

### Core Components
- [x] **UI Components**
  - Button (primary, secondary, outline, ghost variants)
  - Card (container component)
  - Avatar (with fallback initials)

- [x] **Layout Components**
  - Navbar (responsive with mobile menu, Cars link)

- [x] **Feature Components**
  - PostCard (feed posts with likes, comments, car badge)
  - CarCard (garage car display with specs)

### Pages
- [x] **Landing page** (`/`)
  - Hero section with gradient background
  - Feature highlights (Garage, Builds, Community, Marketplace)
  - "How it works" section
  - Stats display
  - Call-to-action sections
  - Footer

- [x] **Car Catalog** (`/cars`)
  - Popular makes grid with icons
  - Alphabetical make listing (A-Z)
  - Quick alphabet navigation
  - Search bar (UI ready)

- [x] **Make Page** (`/cars/[make]`)
  - Make header with country info
  - Models grouped by body type
  - Model cards with year ranges

- [x] **Model Page** (`/cars/[make]/[model]`)
  - Model details with production years
  - "Add to Garage" CTA
  - Community cars grid (ready for data)
  - Stats (cars in garages, posts count)

### Authentication (Basic Setup)
- [x] Auth utility functions scaffolded
- [x] NextAuth dependency installed

### Internationalization (i18n)
- [x] **Multi-language support** with 4 locales:
  - English (en) - default
  - Serbian (sr)
  - German (de)
  - Russian (ru)
- [x] **i18n Infrastructure**:
  - Locale configuration (`src/i18n/config.ts`)
  - Dictionary system (`src/i18n/index.ts`)
  - Full translation files for each locale
- [x] **Middleware** for automatic locale detection:
  - Cookie-based preference
  - Accept-Language header fallback
  - Automatic redirect to locale-prefixed paths
- [x] **Language Switcher** in Navbar with flags
- [x] **Translated Sections**:
  - Navigation
  - Landing page (hero, features, how it works, CTA)
  - Car catalog pages
  - Body type labels
  - Post categories
  - Footer
  - Garage and Profile sections

---

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: SQLite with LibSQL adapter (dev) / PostgreSQL (prod ready)
- **ORM**: Prisma 7
- **Auth**: NextAuth.js (prepared)
- **State**: Zustand (installed)
- **Icons**: Lucide React
- **Date Utils**: date-fns

---

## Project Structure
```
motoverse/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Car catalog seed data
│   └── migrations/        # Database migrations
├── src/
│   ├── app/
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── [locale]/      # Locale-prefixed routes
│   │       ├── layout.tsx         # Locale layout with Navbar
│   │       ├── page.tsx           # Landing page
│   │       └── cars/
│   │           ├── page.tsx           # Car catalog
│   │           ├── [make]/
│   │           │   ├── page.tsx       # Make detail
│   │           │   └── [model]/
│   │           │       └── page.tsx   # Model detail
│   ├── components/
│   │   ├── ui/            # Reusable UI components
│   │   ├── layout/        # Layout components (Navbar w/ language switcher)
│   │   ├── feed/          # Feed-related components
│   │   ├── garage/        # Garage-related components
│   │   └── profile/       # Profile components
│   ├── i18n/
│   │   ├── config.ts      # Locale configuration
│   │   ├── index.ts       # Dictionary utilities
│   │   └── locales/       # Translation files (en, sr, de, ru)
│   ├── lib/
│   │   ├── prisma.ts      # Prisma client
│   │   └── auth.ts        # Auth utilities
│   ├── middleware.ts      # Locale detection middleware
│   ├── types/
│   │   └── index.ts       # TypeScript types
│   ├── hooks/             # Custom React hooks
│   └── actions/           # Server actions
└── PROGRESS.md            # This file
```

---

## Running the Project

```bash
cd motoverse
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Database Commands
```bash
npm run db:seed     # Seed car catalog
npm run db:reset    # Reset database
```

---

## Next Steps (Roadmap)

### Phase 1 - Core Features (Current Priority)
- [ ] Complete authentication flow (login, register, logout)
- [ ] User profile pages (`/u/[username]`)
- [ ] Garage page (`/garage`) - add, edit, delete cars
- [ ] Create post page (`/new`)
- [ ] Post detail page (`/post/[id]`)
- [ ] Feed page with posts

### Phase 2 - Social Features
- [ ] Follow/unfollow users
- [ ] Like posts
- [ ] Comment on posts
- [ ] User search
- [ ] Explore page with filters

### Phase 3 - Marketplace
- [ ] List car for sale
- [ ] Marketplace browse page (`/marketplace`)
- [ ] Listing detail page
- [ ] Contact seller

### Phase 4 - Enhancements
- [ ] Image upload (Cloudinary/S3)
- [ ] Notifications
- [ ] Direct messages
- [ ] Advanced search filters
- [ ] Car catalog search

### Phase 5 - Detailed Car Specs & Power Estimation
- [ ] **Detailed Car Specs** (extend Car model)
  - Weight (curb weight, with driver)
  - Wheels (size, brand, model)
  - Tires (size, brand, compound)
  - Suspension setup
  - Brake specs
  - Intake/exhaust modifications
  - Tuning stage
- [ ] **Power Estimation Tool**
  - Base HP from car specs
  - Modification multipliers (intake +1.5%, tune +15%, etc.)
  - Estimated HP/torque display
  - "Virtual dyno" visualization

### Phase 6 - Performance Leaderboards
- [ ] **Performance Submission System**
  - Submit time + proof (video/screenshot/telemetry)
  - Categories: 0-100, 100-200, 200-300, 402m, track times
  - Capture: date, location, weather, mods at time
- [ ] **Admin Review Queue**
  - Moderator dashboard at `/admin/reviews`
  - Approve/reject submissions
  - Email notifications (`reviews@motoverse.com`)
- [ ] **Leaderboard Pages**
  - `/leaderboards` - main hub
  - Filter by: brand, model, power class, drivetrain, mod level
  - Verified badge for approved times
  - Track times (Nürburgring, Spa, Laguna Seca, etc.)

### Phase 7 - Subscription System
- [ ] **Stripe Integration**
  - Subscription checkout
  - Customer portal (manage, cancel)
  - Webhook handling
- [ ] **Tier System**
  - Free: 3 cars, 5 images/car, 5 posts/month
  - Premium: 10 cars, 20 images/car, 30 posts/month
  - Pro: Unlimited cars, 50 images/car, unlimited posts
- [ ] **Limit Enforcement**
  - Check limits before upload/create
  - Graceful upgrade prompts
  - Grandfathering early users

### Phase 8 - Production
- [ ] Switch to PostgreSQL
- [ ] Deploy to Vercel
- [ ] Set up proper auth providers (Google, GitHub)
- [ ] Performance optimization
- [ ] SEO improvements

---

## Internationalization Usage

### Adding a New Language
1. Add locale code to `src/i18n/config.ts` locales array
2. Create new translation file in `src/i18n/locales/[locale].ts`
3. Import and add to dictionary map in `src/i18n/index.ts`

### Using Translations in Pages
```tsx
import { getDictionary } from '@/i18n'
import { Locale } from '@/i18n/config'

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const dict = getDictionary(locale as Locale)

  return <h1>{dict.landing.hero.title1}</h1>
}
```

### Locale-Prefixed Links
```tsx
const localePath = (path: string) => `/${locale}${path}`
<Link href={localePath('/cars')}>Cars</Link>
```
