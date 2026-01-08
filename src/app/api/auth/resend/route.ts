import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidEmail } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        if (!email || !isValidEmail(email)) {
            return NextResponse.json(
                { error: 'invalid_email', message: 'Please provide a valid email address' },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Resend confirmation email
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
        })

        if (error) {
            // Don't expose specific error details if user not found for security, 
            // but commonly resend might error if user is already confirmed or rate limited.
            // For UX we might want to be honest if it fails significantly.
            console.error('Resend error:', error)

            if (error.status === 429) {
                return NextResponse.json(
                    { error: 'rate_limit', message: 'Too many requests. Please wait a bit.' },
                    { status: 429 }
                )
            }

            return NextResponse.json(
                { error: 'resend_failed', message: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('[auth.resend] failed', error)
        return NextResponse.json(
            { error: 'server_error', message: 'Something went wrong. Please try again.' },
            { status: 500 }
        )
    }
}
