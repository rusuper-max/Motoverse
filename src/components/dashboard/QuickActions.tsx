'use client'

import Link from 'next/link'
import { PlusCircle, Camera, MessageSquare, Gamepad2, Users, Car } from 'lucide-react'

interface QuickActionsProps {
  locale: string
}

export default function QuickActions({ locale }: QuickActionsProps) {
  const actions = [
    {
      label: 'Add Car',
      icon: Car,
      href: `/${locale}/garage/add`,
      color: 'from-orange-500 to-red-600',
      hoverBg: 'hover:bg-orange-500/10',
    },
    {
      label: 'New Post',
      icon: MessageSquare,
      href: `/${locale}/new`,
      color: 'from-blue-500 to-cyan-600',
      hoverBg: 'hover:bg-blue-500/10',
    },
    {
      label: 'Spot Car',
      icon: Camera,
      href: `/${locale}/spots/new`,
      color: 'from-purple-500 to-pink-600',
      hoverBg: 'hover:bg-purple-500/10',
    },
    {
      label: 'Lap Time',
      icon: Gamepad2,
      href: `/${locale}/simracing/submit`,
      color: 'from-green-500 to-emerald-600',
      hoverBg: 'hover:bg-green-500/10',
    },
    {
      label: 'New Group',
      icon: Users,
      href: `/${locale}/groups/create`,
      color: 'from-yellow-500 to-orange-600',
      hoverBg: 'hover:bg-yellow-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-5 gap-2">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className={`flex flex-col items-center gap-2 p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 ${action.hoverBg} hover:border-zinc-700 transition-all group`}
        >
          <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} group-hover:scale-110 transition-transform`}>
            <action.icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  )
}
