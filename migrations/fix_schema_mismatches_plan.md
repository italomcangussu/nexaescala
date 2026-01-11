# Fix Schema Mismatches and Missing Tables

The services tab is empty because the `getUserGroups` query fails with a 400 Bad Request due to missing columns in the `group_members` table. Additionally, the notifications feature is failing due to a missing `notifications` table.

## Proposed Changes

### Database Migration

#### [NEW] [fix_schema_mismatches.sql](file:///Users/italomendescangussu/Downloads/nexaescala/nexaescala/migrations/fix_schema_mismatches.sql)

This migration will:
1. Add `personal_color` and `has_seen_color_banner` to `group_members`.
2. Create the `notifications` table.
3. Add RLS policies for the new table.

## Verification Plan

### Automated Tests
- Run `getUserGroups` via `api.ts` (manually or by refreshing the app).
- Check API logs for 200 responses.

### Manual Verification
- Verify that the "Services" tab correctly displays the user's groups.
- Verify that the error message "Você não está em nenhum serviço" no longer appears if the user has memberships.
