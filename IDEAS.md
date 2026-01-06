# Motoverse - Feature Ideas & Roadmap

## Core Concept
A social network for car enthusiasts where **the car is the main character**, not the person.
Inspired by Drive2.ru - "Car Passport" concept where each car has its own profile, history, and story.

---

## Phase 1: Foundation (Current)

### Authentication
- [x] User registration (email, username, password)
- [x] User login/logout
- [x] Session management (JWT)
- [ ] Password reset flow
- [ ] Email verification

### My Garage
- [ ] View all your cars
- [ ] Add car to garage (pick make/model from catalog)
- [ ] Car details: year, nickname, specs, photos
- [ ] Car status: "In Garage", "Sold", "Wrecked", "Dream Car"
- [ ] Edit/delete car

### Car Profile Page
- [ ] Public car page (`/car/[id]`)
- [ ] Specs display (engine, HP, transmission, etc.)
- [ ] Photo gallery
- [ ] Timeline/history view

---

## Phase 2: Social Features

### Logbook (Bortzhurnal)
Posts linked to specific cars - the heart of the platform.

**Post Categories:**
- DIY / How-To
- Tuning / Modification
- Repair / Maintenance
- Photoshoot
- Road Trip / Journey
- Review
- For Sale (parts)

**Post Features:**
- Rich text content
- Multiple photos
- Part tagging (links to parts database)
- Cost tracking (optional)
- Mileage at time of post

### Car Timeline/History
Visual timeline showing car's life:
```
┌─────────────────┐
│ 01.01.2024      │
│ Bought the car  │──────┐
│ 45,000 km       │      │
└─────────────────┘      │
                         ▼
┌─────────────────┐      │
│ 15.03.2024      │      │
│ Oil change      │◄─────┘
│ 48,500 km       │──────┐
└─────────────────┘      │
                         ▼
┌─────────────────┐      │
│ 20.06.2024      │      │
│ Installed       │◄─────┘
│ coilovers       │
│ 52,000 km       │
└─────────────────┘
```
- Card-based nodes connected by lines
- Date-based ordering
- Each card links to full post
- Filter by category (maintenance only, mods only, etc.)

### Social Interactions
- [ ] Follow users
- [ ] Follow specific cars
- [ ] Like posts
- [ ] Comments
- [ ] Share/repost

### Feed
- [ ] Home feed (posts from followed users/cars)
- [ ] Explore feed (discover new builds)
- [ ] Filter by make/model
- [ ] Filter by category

---

## Phase 3: Advanced Features

### Previous Owners Chain
**The killer feature** - car history persists across owners.

When someone buys a car that was on Motoverse:
1. New owner "claims" the car
2. Car profile transfers to new owner
3. ALL previous history remains attached
4. Previous owner gets "alumni" badge on that car

**Result:** A car with 10-year documented history becomes MORE valuable.

### Parts Database & Tagging
When posting about mods, tag specific parts:
- Brand: Brembo
- Product: GT Kit
- Part Number: 1A2.8002A
- Price paid: $2,500

Benefits:
- Search "who has Brembo brakes on E46"
- Price comparison across users
- "Parts used on this car" summary

### Performance Estimator (Virtual Dyno)
User selects installed parts → system estimates:
- Horsepower gain
- Torque gain
- 0-60 time estimate
- Quarter mile estimate

**How it works:**
```
Base HP: 200 (from car specs)
+ Cold Air Intake: +1.5%
+ Stage 1 Tune: +15%
+ Exhaust: +3%
─────────────────────
Estimated HP: ~239
```

Not perfectly accurate, but fun and engaging.

### Interactive Car Tuner (2D Diagram)
Visual, clickable car diagram for learning about modifications.

**Concept:**
```
     ┌─────────────────────────────────┐
     │    [Click any part to learn]    │
     │                                 │
     │   🔴 Intake    ⚙️ Engine       │
     │      ┌──────────────┐          │
     │   ══╪══════════════╪══         │
     │     │   ┌──────┐   │  🔴 Exhaust│
     │  ◯──┤   │      │   ├──◯        │
     │     │   └──────┘   │           │
     │   ══╪══════════════╪══         │
     │   🔴 Brakes    🔴 Suspension   │
     └─────────────────────────────────┘
```

**Clickable Parts:**
- **Intake** → "Cold Air Intake - Improves airflow, +5-15 HP"
- **Turbo/Supercharger** → "Forced induction - +30-100% power"
- **Exhaust** → "Performance exhaust - Better flow, +5-10 HP, louder sound"
- **Brakes** → "Big brake kit - Improved stopping, better heat dissipation"
- **Suspension** → "Coilovers - Adjustable height/damping, better handling"
- **Wheels/Tires** → "Lightweight wheels - Reduced unsprung mass"
- **ECU** → "Tune/remap - Optimized fueling and timing"

**Implementation:**
- Interactive SVG diagram (cutaway view of car)
- Click zones for each component
- Info panel slides in with: description, typical gains, price range, difficulty
- Links to posts tagged with that modification
- "Who has this mod?" → shows community cars with it installed

### Marketplace
- [ ] List car for sale (links to your car profile with full history)
- [ ] List parts for sale
- [ ] "Wanted" posts
- [ ] Price history / valuation estimates

### Events Engine (The Retention Driver) 🚀

**The Big Idea:** Move from "online profiles" (content) to "real-life meetups" (experiences).
People check an app once a week for photos, but **daily** if they're planning their weekend.

#### A. Event Types

**1. Global "Spectator" Events (F1, WRC, Le Mans)**
- Manually curated top ~50 global motorsport events per year
- Future: Ticketmaster Discovery API for major ticketed events
- Future: SportMonks API for live racing stats

**2. Participatory Events (Track Days, Autocross)**
- Future: MotorsportReg API for track day listings
- Integration with local track day providers

**3. Local "User-Generated" Meets (THE CORE)**
- Any verified user can create a public meet
- GPS location + date/time + description
- "Anti-Chaos" rules: require verified car or reputation score to host

---

#### B. Social Features Around Events

**"Who's Going?" Algorithm**
Don't just list attendees. Group them smart:
- *"3 people near you are going."*
- *"12 other Golf GTI owners are going."*
- *"2 friends are attending."*

**The "Rally Point" (Convoy System)** 🚗🚗🚗
When clicking "I'm Going" to an event:
1. **Start a Convoy:** "Leaving Munich at 8AM, cruising 130km/h to Spielberg"
2. **Route Overlay:** Show convoy route on map
3. **Join Request:** Others can request to join
4. **Car Match:** "3 other M3 owners driving from your city - join them?"

**The "Co-Pilot" Finder**
- "I have a ticket but no car" → `[Looking for Ride]`
- "I have a car but want to split gas" → `[Has Empty Seat]`
- Match passengers with drivers automatically

---

#### C. Event Features

**Event Page:**
- [ ] Cover image + description
- [ ] Date, time, location (map)
- [ ] Organizer profile
- [ ] Attendee list (grouped by car make/model)
- [ ] Comments / discussion
- [ ] "Who else from your city?"

**Map Discovery:**
- [ ] Browse events on a map
- [ ] Filter by: distance, date, event type
- [ ] "Pin drop" to create new meet

**Post-Event:**
- [ ] Photo gallery (tagged to attendees' cars)
- [ ] "I was there" badge on car profiles
- [ ] Automatic post prompt: "How was [Event Name]?"

---

#### D. Technical Stack for Events

**Map Provider: Mapbox GL JS**
- Dark mode styling (looks like a video game)
- Clustering for many events in one area
- Custom markers for event types

**Geospatial Queries: PostGIS** (future, for scale)
- "Find all WRX owners within 50km of this location"
- Required for convoy matching at scale

**MVP: Use simple lat/lng with Haversine distance calculation**

---

#### E. Events Monetization

1. **Affiliate Tickets:** Commission on F1/etc ticket sales
2. **Promoted Meets:** Shops pay to pin their meet at the top ($30-50/week)
3. **Convoy Sponsorship:** "This convoy to Wörthersee by Motul" (future)
4. **Premium Event Features:** Private events, unlimited attendees, analytics


---

## Phase 4: Gamification & Community

### Achievements / Badges
- "First Oil Change" - documented first maintenance
- "Modifier" - 5+ modification posts
- "Road Warrior" - 10+ road trip posts
- "Helpful" - 50 helpful votes on DIY posts
- "Verified Fast" - submitted verified drag time

### Leaderboards & Performance Tracking

**Performance Categories:**
- 0-100 km/h (0-62 mph)
- 100-200 km/h (rolling)
- 200-300 km/h (rolling)
- 402m (1/4 mile)
- 1000m (1/2 mile)
- Top speed

**Track Times:**
- Nürburgring Nordschleife
- Spa-Francorchamps
- Laguna Seca
- Tsukuba Circuit
- Hockenheim
- Custom/local tracks

**Leaderboard Groupings:**
- By brand (Fastest Audi, BMW, etc.)
- By model (Fastest Golf, M3, etc.)
- By power class (<200hp, 200-400hp, 400-600hp, 600+hp)
- By modification level (Stock, Stage 1, Stage 2, Built)
- By drivetrain (FWD, RWD, AWD)
- By body type (Sedan, Hatchback, Coupe, SUV)

**Other Leaderboards:**
- Most documented car (post count)
- Most helpful user
- Best build of the month (community voted)
- Highest mileage cars

### Performance Verification System

**Proof Types (ranked by credibility):**
1. GPS/Telemetry data (Dragy, RaceBox, RaceChrono) - highest trust
2. Video proof (dashcam, phone recording)
3. Screenshot from timing equipment

**Verification Flow:**
1. User submits time + proof
2. System queues for moderator review
3. Admin reviews at `reviews@motoverse.com`
4. Approved → "Verified" badge, added to leaderboard
5. Rejected → feedback sent to user

**Data Captured:**
- Time (e.g., 4.2s)
- Date of run
- Location/track
- Weather conditions
- Elevation/altitude
- Car specs at time of run
- Mods list at time of run

---

## Technical Notes

### Database
- Development: SQLite (current)
- Production: PostgreSQL (Neon/Supabase)

### Media Storage
- Use Cloudinary or AWS S3
- Never store images in database
- Auto-resize for mobile/desktop

### Search
- Consider Meilisearch for fast car/post search
- Full-text search on posts

### APIs to Consider
- Car specs: Auto-Data.net, CarQuery API
- VIN decoder for verification
- Image recognition for car make/model detection

---

## UI/UX Principles

1. **Car-centric, not user-centric** - Car profiles are first-class citizens
2. **Timeline is king** - Everything is chronological, documented history
3. **Mobile-first** - Most car photos taken on phones
4. **Dark mode default** - Looks better with car photos
5. **Fast image loading** - Lazy load, progressive JPEGs

---

## Subscription System

### Tiers
| Feature | Free | Premium | Pro |
|---------|------|---------|-----|
| Cars in garage | 3 | 10 | Unlimited |
| Images per car | 5 | 20 | 50 |
| Blog posts/month | 5 | 30 | Unlimited |
| Performance submissions | 1/month | 5/month | Unlimited |
| Detailed car specs | Basic | Full | Full + Export |
| Power estimation tool | ❌ | ✅ | ✅ (Advanced) |
| Badge on profile | - | "Premium" | "Pro" |

### Subscription Features
- [ ] Stripe integration for payments
- [ ] Free trial (7 days Premium)
- [ ] Annual discount (20% off)
- [ ] Grandfathering early adopters

---

## Monetization Ideas (Future)

- Subscription tiers (see above)
- Promoted listings in marketplace
- Verified dealer accounts
- API access for automotive businesses
- "Featured build" sponsorships

---

## Competition Analysis

| Platform | Strength | Weakness |
|----------|----------|----------|
| Drive2.ru | Car-centric, great logbook | Russian only, dated UI |
| Instagram | Great for photos | Not car-focused, no structure |
| Facebook Groups | Community | Messy, no car profiles |
| Bring a Trailer | History documentation | Auction only, not social |

**Motoverse advantage:** Combine Drive2's structure with modern UX and English market.
