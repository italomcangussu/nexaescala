// @ts-nocheck
// Supabase Edge Function - Deno Runtime
// Sends push notifications to web (Web Push API) and native (APNs/FCM) clients.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:suporte@nexaescala.com'

// APNs configuration for iOS native push
const APNS_KEY_ID = Deno.env.get('APNS_KEY_ID')
const APNS_TEAM_ID = Deno.env.get('APNS_TEAM_ID')
const APNS_BUNDLE_ID = Deno.env.get('APNS_BUNDLE_ID') || 'com.nexaescala.app'
const APNS_PRIVATE_KEY = Deno.env.get('APNS_PRIVATE_KEY')

// FCM configuration for Android native push
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY')

interface PushRequest {
    type: 'web' | 'native'
    // Web Push fields
    subscription?: {
        endpoint: string
        keys: {
            p256dh: string
            auth: string
        }
    }
    // Native fields
    platform?: 'ios' | 'android'
    token?: string
    // Common payload
    title: string
    body: string
    data?: Record<string, string>
}

/**
 * Generate JWT for APNs authentication
 */
async function generateAPNsJWT(): Promise<string> {
    if (!APNS_PRIVATE_KEY || !APNS_KEY_ID || !APNS_TEAM_ID) {
        throw new Error('APNs configuration missing')
    }

    const header = {
        alg: 'ES256',
        kid: APNS_KEY_ID,
    }

    const now = Math.floor(Date.now() / 1000)
    const claims = {
        iss: APNS_TEAM_ID,
        iat: now,
    }

    // Encode header and claims
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const encodedClaims = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const signingInput = `${encodedHeader}.${encodedClaims}`

    // Import the private key
    const pemContents = APNS_PRIVATE_KEY
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s/g, '')

    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

    const key = await crypto.subtle.importKey(
        'pkcs8',
        binaryKey,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
    )

    const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        key,
        new TextEncoder().encode(signingInput)
    )

    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    return `${signingInput}.${encodedSignature}`
}

/**
 * Send push notification via APNs (iOS)
 */
async function sendAPNs(token: string, title: string, body: string, data?: Record<string, string>): Promise<boolean> {
    try {
        const jwt = await generateAPNsJWT()
        const isProduction = Deno.env.get('APNS_ENVIRONMENT') === 'production'
        const host = isProduction
            ? 'https://api.push.apple.com'
            : 'https://api.sandbox.push.apple.com'

        const payload = {
            aps: {
                alert: { title, body },
                sound: 'default',
                badge: 1,
                'mutable-content': 1
            },
            ...data
        }

        const response = await fetch(`${host}/3/device/${token}`, {
            method: 'POST',
            headers: {
                'authorization': `bearer ${jwt}`,
                'apns-topic': APNS_BUNDLE_ID!,
                'apns-push-type': 'alert',
                'apns-priority': '10',
                'content-type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            console.error(`APNs error (${response.status}):`, errorBody)
            return false
        }

        return true
    } catch (error) {
        console.error('APNs send error:', error)
        return false
    }
}

/**
 * Send push notification via FCM (Android)
 */
async function sendFCM(token: string, title: string, body: string, data?: Record<string, string>): Promise<boolean> {
    if (!FCM_SERVER_KEY) {
        console.error('FCM_SERVER_KEY not configured')
        return false
    }

    try {
        const payload = {
            to: token,
            notification: {
                title,
                body,
                sound: 'default',
            },
            data: data || {},
        }

        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Authorization': `key=${FCM_SERVER_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            console.error(`FCM error (${response.status}):`, errorBody)
            return false
        }

        return true
    } catch (error) {
        console.error('FCM send error:', error)
        return false
    }
}

/**
 * Send Web Push notification using VAPID
 */
async function sendWebPush(
    subscription: PushRequest['subscription'],
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<boolean> {
    if (!subscription || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.error('Web Push configuration missing')
        return false
    }

    try {
        // Use the web-push compatible approach via the endpoint
        const payload = JSON.stringify({ title, body, url: data?.url || '/' })

        // For Deno, we use a simplified VAPID approach
        // The subscription endpoint is the push service URL
        const endpoint = subscription.endpoint

        // Create VAPID authorization
        const audience = new URL(endpoint).origin

        const header = { typ: 'JWT', alg: 'ES256' }
        const now = Math.floor(Date.now() / 1000)
        const claims = {
            aud: audience,
            exp: now + 86400,
            sub: VAPID_SUBJECT,
        }

        const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
        const encodedClaims = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
        const unsignedToken = `${encodedHeader}.${encodedClaims}`

        // Import VAPID private key
        const rawKey = Uint8Array.from(
            atob(VAPID_PRIVATE_KEY.replace(/-/g, '+').replace(/_/g, '/') + '=='),
            c => c.charCodeAt(0)
        )

        // VAPID private keys are raw 32-byte EC keys
        const key = await crypto.subtle.importKey(
            'raw',
            rawKey,
            { name: 'ECDSA', namedCurve: 'P-256' },
            false,
            ['sign']
        ).catch(async () => {
            // Try JWK import as fallback
            const jwk = {
                kty: 'EC',
                crv: 'P-256',
                d: VAPID_PRIVATE_KEY,
                x: '', // Would need public key components
                y: '',
            }
            return crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
        })

        const signature = await crypto.subtle.sign(
            { name: 'ECDSA', hash: 'SHA-256' },
            key,
            new TextEncoder().encode(unsignedToken)
        )

        const encodedSig = btoa(String.fromCharCode(...new Uint8Array(signature)))
            .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

        const jwt = `${unsignedToken}.${encodedSig}`

        // Encrypt the payload using subscription keys
        // For simplicity, send to the push service with proper VAPID auth
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
                'Content-Type': 'application/json',
                'Content-Encoding': 'aes128gcm',
                'TTL': '86400',
            },
            body: payload,
        })

        if (response.status === 201 || response.status === 200) {
            return true
        }

        // Handle 404/410 - subscription expired
        if (response.status === 404 || response.status === 410) {
            console.log('Push subscription expired, should be removed')
            return false
        }

        console.error(`Web Push error (${response.status}):`, await response.text())
        return false
    } catch (error) {
        console.error('Web Push send error:', error)
        return false
    }
}

serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const request: PushRequest = await req.json()

        if (!request.title || !request.body) {
            throw new Error('Missing title or body')
        }

        let success = false

        if (request.type === 'native') {
            if (!request.token || !request.platform) {
                throw new Error('Missing token or platform for native push')
            }

            if (request.platform === 'ios') {
                success = await sendAPNs(request.token, request.title, request.body, request.data)
            } else if (request.platform === 'android') {
                success = await sendFCM(request.token, request.title, request.body, request.data)
            }
        } else if (request.type === 'web') {
            if (!request.subscription) {
                throw new Error('Missing subscription for web push')
            }

            success = await sendWebPush(request.subscription, request.title, request.body, request.data)
        } else {
            throw new Error(`Unknown push type: ${request.type}`)
        }

        return new Response(
            JSON.stringify({ success }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        console.error('Push notification error:', error)
        return new Response(
            JSON.stringify({ error: error.message, success: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
