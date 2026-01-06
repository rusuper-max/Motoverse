'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Calendar, MapPin, Clock, Users, ChevronRight, Star, Share2, Flag, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Locale } from '@/i18n/config'

// --- TRACK LAYOUTS ---
// Track IDs that have SVG files in public/tracks/
const AVAILABLE_TRACK_SVGS = ['aut'] // Add more as you download them

// Check if track has SVG file
const hasTrackSvg = (id: string) => AVAILABLE_TRACK_SVGS.includes(id)


// --- RACE DATA ---
interface Race {
    id: string
    round: number
    name: string
    shortName: string
    date: string
    dateRange: string
    location: string
    circuit: string
    country: string
    flag: string
    length: string
    laps: number
    record: { time: string; driver: string; year: string }
    series: 'f1' | 'wrc' | 'gt3'
}

const F1_RACES: Race[] = [
    { id: 'bhr', round: 1, name: 'Bahrain Grand Prix', shortName: 'Bahrain', date: '2026-03-15', dateRange: 'Mar 13-15', location: 'Sakhir', circuit: 'Bahrain International Circuit', country: 'Bahrain', flag: '🇧🇭', length: '5.412 km', laps: 57, record: { time: '1:31.447', driver: 'Pedro de la Rosa', year: '2005' }, series: 'f1' },
    { id: 'sau', round: 2, name: 'Saudi Arabian Grand Prix', shortName: 'Jeddah', date: '2026-03-22', dateRange: 'Mar 20-22', location: 'Jeddah', circuit: 'Jeddah Corniche Circuit', country: 'Saudi Arabia', flag: '🇸🇦', length: '6.174 km', laps: 50, record: { time: '1:27.472', driver: 'Lewis Hamilton', year: '2021' }, series: 'f1' },
    { id: 'aus', round: 3, name: 'Australian Grand Prix', shortName: 'Melbourne', date: '2026-04-05', dateRange: 'Apr 3-5', location: 'Melbourne', circuit: 'Albert Park Circuit', country: 'Australia', flag: '🇦🇺', length: '5.278 km', laps: 58, record: { time: '1:19.813', driver: 'Charles Leclerc', year: '2024' }, series: 'f1' },
    { id: 'jpn', round: 4, name: 'Japanese Grand Prix', shortName: 'Suzuka', date: '2026-04-12', dateRange: 'Apr 10-12', location: 'Suzuka', circuit: 'Suzuka Circuit', country: 'Japan', flag: '🇯🇵', length: '5.807 km', laps: 53, record: { time: '1:30.983', driver: 'Lewis Hamilton', year: '2019' }, series: 'f1' },
    { id: 'chn', round: 5, name: 'Chinese Grand Prix', shortName: 'Shanghai', date: '2026-04-19', dateRange: 'Apr 17-19', location: 'Shanghai', circuit: 'Shanghai International Circuit', country: 'China', flag: '🇨🇳', length: '5.451 km', laps: 56, record: { time: '1:32.238', driver: 'Michael Schumacher', year: '2004' }, series: 'f1' },
    { id: 'mia', round: 6, name: 'Miami Grand Prix', shortName: 'Miami', date: '2026-05-03', dateRange: 'May 1-3', location: 'Miami', circuit: 'Miami International Autodrome', country: 'USA', flag: '🇺🇸', length: '5.412 km', laps: 57, record: { time: '1:29.708', driver: 'Max Verstappen', year: '2023' }, series: 'f1' },
    { id: 'mon', round: 7, name: 'Monaco Grand Prix', shortName: 'Monaco', date: '2026-05-24', dateRange: 'May 22-24', location: 'Monte Carlo', circuit: 'Circuit de Monaco', country: 'Monaco', flag: '🇲🇨', length: '3.337 km', laps: 78, record: { time: '1:12.909', driver: 'Lewis Hamilton', year: '2021' }, series: 'f1' },
    { id: 'esp', round: 8, name: 'Spanish Grand Prix', shortName: 'Barcelona', date: '2026-06-07', dateRange: 'Jun 5-7', location: 'Barcelona', circuit: 'Circuit de Barcelona-Catalunya', country: 'Spain', flag: '🇪🇸', length: '4.657 km', laps: 66, record: { time: '1:18.149', driver: 'Max Verstappen', year: '2021' }, series: 'f1' },
    { id: 'can', round: 9, name: 'Canadian Grand Prix', shortName: 'Montreal', date: '2026-06-14', dateRange: 'Jun 12-14', location: 'Montreal', circuit: 'Circuit Gilles Villeneuve', country: 'Canada', flag: '🇨🇦', length: '4.361 km', laps: 70, record: { time: '1:13.078', driver: 'Valtteri Bottas', year: '2019' }, series: 'f1' },
    { id: 'aut', round: 10, name: 'Austrian Grand Prix', shortName: 'Spielberg', date: '2026-06-28', dateRange: 'Jun 26-28', location: 'Spielberg', circuit: 'Red Bull Ring', country: 'Austria', flag: '🇦🇹', length: '4.318 km', laps: 71, record: { time: '1:05.619', driver: 'Carlos Sainz', year: '2020' }, series: 'f1' },
    { id: 'gbr', round: 11, name: 'British Grand Prix', shortName: 'Silverstone', date: '2026-07-05', dateRange: 'Jul 3-5', location: 'Silverstone', circuit: 'Silverstone Circuit', country: 'UK', flag: '🇬🇧', length: '5.891 km', laps: 52, record: { time: '1:27.097', driver: 'Max Verstappen', year: '2020' }, series: 'f1' },
    { id: 'hun', round: 12, name: 'Hungarian Grand Prix', shortName: 'Budapest', date: '2026-07-19', dateRange: 'Jul 17-19', location: 'Budapest', circuit: 'Hungaroring', country: 'Hungary', flag: '🇭🇺', length: '4.381 km', laps: 70, record: { time: '1:16.627', driver: 'Lewis Hamilton', year: '2020' }, series: 'f1' },
    { id: 'bel', round: 13, name: 'Belgian Grand Prix', shortName: 'Spa', date: '2026-07-26', dateRange: 'Jul 24-26', location: 'Spa', circuit: 'Circuit de Spa-Francorchamps', country: 'Belgium', flag: '🇧🇪', length: '7.004 km', laps: 44, record: { time: '1:46.286', driver: 'Valtteri Bottas', year: '2018' }, series: 'f1' },
    { id: 'ned', round: 14, name: 'Dutch Grand Prix', shortName: 'Zandvoort', date: '2026-08-30', dateRange: 'Aug 28-30', location: 'Zandvoort', circuit: 'Circuit Zandvoort', country: 'Netherlands', flag: '🇳🇱', length: '4.259 km', laps: 72, record: { time: '1:11.097', driver: 'Lewis Hamilton', year: '2021' }, series: 'f1' },
    { id: 'ita', round: 15, name: 'Italian Grand Prix', shortName: 'Monza', date: '2026-09-06', dateRange: 'Sep 4-6', location: 'Monza', circuit: 'Autodromo Nazionale Monza', country: 'Italy', flag: '🇮🇹', length: '5.793 km', laps: 53, record: { time: '1:21.046', driver: 'Rubens Barrichello', year: '2004' }, series: 'f1' },
    { id: 'aze', round: 16, name: 'Azerbaijan Grand Prix', shortName: 'Baku', date: '2026-09-20', dateRange: 'Sep 18-20', location: 'Baku', circuit: 'Baku City Circuit', country: 'Azerbaijan', flag: '🇦🇿', length: '6.003 km', laps: 51, record: { time: '1:43.009', driver: 'Charles Leclerc', year: '2019' }, series: 'f1' },
    { id: 'sin', round: 17, name: 'Singapore Grand Prix', shortName: 'Singapore', date: '2026-10-04', dateRange: 'Oct 2-4', location: 'Singapore', circuit: 'Marina Bay Street Circuit', country: 'Singapore', flag: '🇸🇬', length: '4.940 km', laps: 62, record: { time: '1:35.867', driver: 'Lewis Hamilton', year: '2023' }, series: 'f1' },
    { id: 'usa', round: 18, name: 'United States Grand Prix', shortName: 'Austin', date: '2026-10-18', dateRange: 'Oct 16-18', location: 'Austin', circuit: 'Circuit of the Americas', country: 'USA', flag: '🇺🇸', length: '5.513 km', laps: 56, record: { time: '1:36.169', driver: 'Charles Leclerc', year: '2019' }, series: 'f1' },
    { id: 'mex', round: 19, name: 'Mexico City Grand Prix', shortName: 'Mexico', date: '2026-10-25', dateRange: 'Oct 23-25', location: 'Mexico City', circuit: 'Autódromo Hermanos Rodríguez', country: 'Mexico', flag: '🇲🇽', length: '4.304 km', laps: 71, record: { time: '1:17.774', driver: 'Valtteri Bottas', year: '2021' }, series: 'f1' },
    { id: 'bra', round: 20, name: 'São Paulo Grand Prix', shortName: 'Interlagos', date: '2026-11-08', dateRange: 'Nov 6-8', location: 'São Paulo', circuit: 'Autódromo José Carlos Pace', country: 'Brazil', flag: '🇧🇷', length: '4.309 km', laps: 71, record: { time: '1:10.540', driver: 'Valtteri Bottas', year: '2018' }, series: 'f1' },
    { id: 'lvg', round: 21, name: 'Las Vegas Grand Prix', shortName: 'Vegas', date: '2026-11-22', dateRange: 'Nov 20-22', location: 'Las Vegas', circuit: 'Las Vegas Strip Circuit', country: 'USA', flag: '🇺🇸', length: '6.201 km', laps: 50, record: { time: '1:35.490', driver: 'Oscar Piastri', year: '2023' }, series: 'f1' },
    { id: 'qat', round: 22, name: 'Qatar Grand Prix', shortName: 'Lusail', date: '2026-11-29', dateRange: 'Nov 27-29', location: 'Lusail', circuit: 'Lusail International Circuit', country: 'Qatar', flag: '🇶🇦', length: '5.419 km', laps: 57, record: { time: '1:24.319', driver: 'Max Verstappen', year: '2023' }, series: 'f1' },
    { id: 'abu', round: 23, name: 'Abu Dhabi Grand Prix', shortName: 'Yas Marina', date: '2026-12-06', dateRange: 'Dec 4-6', location: 'Abu Dhabi', circuit: 'Yas Marina Circuit', country: 'UAE', flag: '🇦🇪', length: '5.281 km', laps: 58, record: { time: '1:26.103', driver: 'Max Verstappen', year: '2021' }, series: 'f1' },
]

const WRC_RACES: Race[] = [
    { id: 'wrc-mon', round: 1, name: 'Rallye Monte-Carlo', shortName: 'Monte Carlo', date: '2026-01-22', dateRange: 'Jan 22-25', location: 'Monaco', circuit: 'French Alps', country: 'Monaco', flag: '🇲🇨', length: '312.44 km', laps: 18, record: { time: '2:56:03', driver: 'Sébastien Ogier', year: '2023' }, series: 'wrc' },
    { id: 'wrc-swe', round: 2, name: 'Rally Sweden', shortName: 'Sweden', date: '2026-02-12', dateRange: 'Feb 12-15', location: 'Umeå', circuit: 'Snow Stages', country: 'Sweden', flag: '🇸🇪', length: '280.52 km', laps: 19, record: { time: '2:42:18', driver: 'Kalle Rovanperä', year: '2022' }, series: 'wrc' },
    { id: 'wrc-ken', round: 3, name: 'Safari Rally Kenya', shortName: 'Kenya', date: '2026-03-19', dateRange: 'Mar 19-22', location: 'Naivasha', circuit: 'Safari Stages', country: 'Kenya', flag: '🇰🇪', length: '348.26 km', laps: 19, record: { time: '3:18:44', driver: 'Kalle Rovanperä', year: '2022' }, series: 'wrc' },
    { id: 'wrc-cro', round: 4, name: 'Croatia Rally', shortName: 'Croatia', date: '2026-04-23', dateRange: 'Apr 23-26', location: 'Zagreb', circuit: 'Tarmac Stages', country: 'Croatia', flag: '🇭🇷', length: '295.78 km', laps: 20, record: { time: '2:38:52', driver: 'Thierry Neuville', year: '2023' }, series: 'wrc' },
    { id: 'wrc-por', round: 5, name: 'Rally Portugal', shortName: 'Portugal', date: '2026-05-14', dateRange: 'May 14-17', location: 'Porto', circuit: 'Gravel Stages', country: 'Portugal', flag: '🇵🇹', length: '319.15 km', laps: 21, record: { time: '3:05:22', driver: 'Elfyn Evans', year: '2021' }, series: 'wrc' },
    { id: 'wrc-fin', round: 6, name: 'Rally Finland', shortName: 'Finland', date: '2026-07-30', dateRange: 'Jul 30-Aug 2', location: 'Jyväskylä', circuit: 'Gravel Stages', country: 'Finland', flag: '🇫🇮', length: '286.47 km', laps: 22, record: { time: '2:24:31', driver: 'Kalle Rovanperä', year: '2022' }, series: 'wrc' },
]

const GT3_RACES: Race[] = [
    { id: 'gt3-spa', round: 1, name: '24 Hours of Spa', shortName: 'Spa 24h', date: '2026-07-25', dateRange: 'Jul 25-26', location: 'Spa', circuit: 'Circuit de Spa-Francorchamps', country: 'Belgium', flag: '🇧🇪', length: '7.004 km', laps: 500, record: { time: '2:17.421', driver: 'Raffaele Marciello', year: '2022' }, series: 'gt3' },
    { id: 'gt3-nbr', round: 2, name: '24 Hours of Nürburgring', shortName: 'N24', date: '2026-05-28', dateRange: 'May 28-29', location: 'Nürburg', circuit: 'Nürburgring Nordschleife', country: 'Germany', flag: '🇩🇪', length: '25.378 km', laps: 150, record: { time: '8:01.447', driver: 'Manthey Racing', year: '2022' }, series: 'gt3' },
    { id: 'gt3-bat', round: 3, name: 'Bathurst 12 Hour', shortName: 'Bathurst', date: '2026-02-01', dateRange: 'Feb 1', location: 'Bathurst', circuit: 'Mount Panorama Circuit', country: 'Australia', flag: '🇦🇺', length: '6.213 km', laps: 300, record: { time: '2:01.567', driver: 'Shane van Gisbergen', year: '2020' }, series: 'gt3' },
    { id: 'gt3-mon', round: 4, name: 'GTWC Monza', shortName: 'Monza', date: '2026-04-11', dateRange: 'Apr 11-12', location: 'Monza', circuit: 'Autodromo Nazionale Monza', country: 'Italy', flag: '🇮🇹', length: '5.793 km', laps: 60, record: { time: '1:46.882', driver: 'Dries Vanthoor', year: '2023' }, series: 'gt3' },
]

// --- COMPONENTS ---
// Simple flag display instead of inaccurate track layouts
const FlagDisplay = ({ flag, className }: { flag: string; className?: string }) => (
    <div className={`flex items-center justify-center ${className}`}>
        <span className="text-6xl">{flag}</span>
    </div>
)

const RaceCard = ({ race, onClick }: { race: Race; onClick: (race: Race) => void }) => (
    <div
        onClick={() => onClick(race)}
        className="group relative bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-orange-500/50 rounded-xl p-4 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm"
    >
        {/* Hover Accent Line */}
        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />

        <div className="flex justify-between items-start mb-3">
            <div className="flex flex-col">
                <span className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">Round {race.round}</span>
                <h3 className="text-lg font-bold text-white leading-tight group-hover:text-orange-400 transition-colors">{race.shortName}</h3>
                <span className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                    <span className="text-lg">{race.flag}</span> {race.location}
                </span>
            </div>
            <div className="text-right">
                <span className="text-sm font-bold text-white bg-zinc-800 px-2 py-1 rounded border border-zinc-700">
                    {race.dateRange}
                </span>
            </div>
        </div>

        {/* Track/Flag Display */}
        <div className="h-20 flex items-center justify-center">
            {hasTrackSvg(race.id) ? (
                <img
                    src={`/tracks/${race.id}.svg`}
                    alt={race.circuit}
                    className="h-16 w-auto opacity-60 group-hover:opacity-100 transition-opacity invert"
                />
            ) : (
                <span className="text-5xl group-hover:scale-110 transition-transform">{race.flag}</span>
            )}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
            <span>{race.length} • {race.laps} laps</span>
            <span className="group-hover:text-orange-400 transition-colors flex items-center gap-1">
                Details <ChevronRight className="w-3 h-3" />
            </span>
        </div>
    </div>
)

const DetailModal = ({ race, onClose }: { race: Race; onClose: () => void }) => {
    const totalDistance = (parseFloat(race.length) * race.laps).toFixed(1)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">

                {/* Track/Flag Display */}
                <div className="w-full md:w-1/2 bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-zinc-700">
                    {hasTrackSvg(race.id) ? (
                        <img
                            src={`/tracks/${race.id}.svg`}
                            alt={race.circuit}
                            className="w-64 h-64 object-contain invert opacity-90"
                        />
                    ) : (
                        <span className="text-9xl">{race.flag}</span>
                    )}
                    <div className="absolute bottom-6 w-full px-8 flex justify-between text-xs text-zinc-500 uppercase tracking-widest font-mono">
                        <span>{race.circuit}</span>
                        <span>2026</span>
                    </div>
                </div>

                {/* Right: Info */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col bg-zinc-900 overflow-y-auto">

                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded uppercase">Round {race.round}</span>
                                <span className="text-zinc-400 text-xs font-mono">{race.dateRange}</span>
                            </div>
                            <h2 className="text-2xl font-black text-white">{race.name}</h2>
                            <div className="flex items-center gap-2 text-zinc-400 mt-1">
                                <MapPin className="w-4 h-4" /> {race.location}, {race.country} {race.flag}
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                            <div className="flex items-center gap-2 text-orange-400 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Lap Record</span>
                            </div>
                            <div className="text-xl font-bold text-white">{race.record.time}</div>
                            <div className="text-xs text-zinc-500 mt-1">{race.record.driver} ({race.record.year})</div>
                        </div>

                        <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                            <div className="flex items-center gap-2 text-blue-400 mb-1">
                                <Flag className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Race Distance</span>
                            </div>
                            <div className="text-xl font-bold text-white">{race.laps} Laps</div>
                            <div className="text-xs text-zinc-500 mt-1">Total: {totalDistance} km</div>
                        </div>

                        <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                            <div className="flex items-center gap-2 text-green-400 mb-1">
                                <MapPin className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Track Length</span>
                            </div>
                            <div className="text-xl font-bold text-white">{race.length}</div>
                        </div>


                    </div>

                    <div className="mt-auto space-y-3">
                        <Button className="w-full">
                            <Star className="w-5 h-5 mr-2 fill-current" />
                            I&apos;m Going
                        </Button>
                        <div className="flex gap-3">
                            <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                                <Share2 className="w-4 h-4" /> Share
                            </button>
                            <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                                <Calendar className="w-4 h-4" /> Add to Cal
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function RacingCalendarPage() {
    const params = useParams()
    const locale = params.locale as Locale

    const [activeTab, setActiveTab] = useState<'f1' | 'wrc' | 'gt3'>('f1')
    const [selectedRace, setSelectedRace] = useState<Race | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const races = activeTab === 'f1' ? F1_RACES : activeTab === 'wrc' ? WRC_RACES : GT3_RACES
    const filteredRaces = races.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.location.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen pt-20 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <Link href={`/${locale}/events`} className="text-zinc-400 hover:text-white text-sm mb-2 inline-block">
                            ← Back to Events
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            2026 <span className="text-orange-500">RACING</span> CALENDAR
                        </h1>
                        <p className="text-zinc-400 max-w-lg">
                            Join the community at the world&apos;s most prestigious motorsport events.
                        </p>
                    </div>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search circuits..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 block w-full md:w-64 pl-4 pr-10 py-3 transition-all"
                        />
                    </div>
                </div>

                {/* Series Tabs */}
                <nav className="flex space-x-1 bg-zinc-900 p-1 rounded-full border border-zinc-800 w-fit mb-8">
                    {(['f1', 'wrc', 'gt3'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-full text-sm font-bold uppercase transition-all ${activeTab === tab
                                ? 'bg-orange-500 text-white shadow-lg'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                }`}
                        >
                            {tab === 'f1' ? '🏎️ Formula 1' : tab === 'wrc' ? '🚗 WRC Rally' : '🏁 GT3'}
                        </button>
                    ))}
                </nav>

                {/* Race Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredRaces.map((race) => (
                        <RaceCard key={race.id} race={race} onClick={setSelectedRace} />
                    ))}
                </div>

                {filteredRaces.length === 0 && (
                    <div className="text-center py-20 text-zinc-500">
                        <p className="text-xl">No races found matching &quot;{searchTerm}&quot;</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedRace && (
                <DetailModal race={selectedRace} onClose={() => setSelectedRace(null)} />
            )}
        </div>
    )
}
