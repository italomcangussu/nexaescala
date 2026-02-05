// @ts-nocheck
// Supabase Edge Function - Deno Runtime
// Deletes a user account completely: profile data + auth.users record.
// Requires SUPABASE_SERVICE_ROLE_KEY env var.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Verify the request has a valid JWT
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        // 2. Create a client with the user's JWT to verify identity
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: userError } = await userClient.auth.getUser()
        if (userError || !user) {
            throw new Error('Invalid or expired token')
        }

        const userId = user.id

        // 3. Create admin client with service_role key for privileged operations
        const adminClient = createClient(supabaseUrl, serviceRoleKey)

        // 4. Delete user data in order (respecting foreign key constraints)

        // 4a. Delete shift_assignments where the user is assigned
        await adminClient
            .from('shift_assignments')
            .delete()
            .eq('profile_id', userId)

        // 4b. Delete shift_exchanges where the user is involved
        await adminClient
            .from('shift_exchanges')
            .delete()
            .or(`requesting_profile_id.eq.${userId},target_profile_id.eq.${userId},requesting_user_id.eq.${userId},target_user_id.eq.${userId}`)

        // 4c. Delete notifications
        await adminClient
            .from('notifications')
            .delete()
            .eq('user_id', userId)

        // 4d. Delete financial records and configs
        await adminClient
            .from('financial_records')
            .delete()
            .eq('user_id', userId)

        await adminClient
            .from('financial_configs')
            .delete()
            .eq('user_id', userId)

        // 4e. Delete chat messages
        await adminClient
            .from('chat_messages')
            .delete()
            .eq('profile_id', userId)

        // 4f. Delete group memberships
        await adminClient
            .from('group_members')
            .delete()
            .eq('profile_id', userId)

        // 4g. Transfer ownership of groups or delete empty ones
        const { data: ownedGroups } = await adminClient
            .from('groups')
            .select('id')
            .eq('owner_id', userId)

        if (ownedGroups && ownedGroups.length > 0) {
            for (const group of ownedGroups) {
                // Check if group has other members
                const { data: members } = await adminClient
                    .from('group_members')
                    .select('profile_id')
                    .eq('group_id', group.id)
                    .neq('profile_id', userId)
                    .limit(1)

                if (members && members.length > 0) {
                    // Transfer ownership to first remaining member
                    await adminClient
                        .from('groups')
                        .update({ owner_id: members[0].profile_id })
                        .eq('id', group.id)
                } else {
                    // Delete shifts and the empty group
                    await adminClient
                        .from('shifts')
                        .delete()
                        .eq('group_id', group.id)

                    await adminClient
                        .from('groups')
                        .delete()
                        .eq('id', group.id)
                }
            }
        }

        // 4h. Delete support messages
        await adminClient
            .from('support_messages')
            .delete()
            .eq('user_id', userId)

        // 4i. Delete app logs
        await adminClient
            .from('app_logs')
            .delete()
            .eq('user_id', userId)

        // 4j. Delete profile
        await adminClient
            .from('profiles')
            .delete()
            .eq('id', userId)

        // 5. Delete from auth.users (the critical step the client can't do)
        const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId)
        if (deleteAuthError) {
            console.error('Error deleting auth user:', deleteAuthError)
            throw new Error(`Failed to delete auth user: ${deleteAuthError.message}`)
        }

        // 6. Log the deletion (fire-and-forget)
        await adminClient
            .from('app_logs')
            .insert({
                level: 'info',
                message: `Account fully deleted: ${userId}`,
                metadata: { deleted_at: new Date().toISOString() }
            })
            .then(() => {})
            .catch(() => {})

        return new Response(
            JSON.stringify({ success: true, message: 'Account deleted successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Delete user error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
