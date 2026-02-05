import { Profile } from '../../types';

// --- FILTER SANITIZATION ---
// Supabase PostgREST filter syntax uses special characters: , . ( )
// User input must be sanitized to prevent filter injection.
export const sanitizeFilterValue = (value: string): string => {
    return value.replace(/[,.()"'\\]/g, '');
};

// --- INPUT VALIDATION ---
export const MAX_NAME_LENGTH = 100;
export const MAX_BIO_LENGTH = 500;
export const MAX_FIELD_LENGTH = 255;

export const ALLOWED_PROFILE_FIELDS: (keyof Profile)[] = [
    'full_name', 'avatar_url', 'crm', 'specialty', 'bio', 'company',
    'education', 'academic_title', 'post_grad', 'onboarding_completed',
    'notification_preferences', 'push_subscription'
];

export const validateString = (value: unknown, maxLength: number): string | null => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return null;
    return value.slice(0, maxLength);
};

export const validateProfileUpdates = (updates: Partial<Profile>): Partial<Profile> => {
    const validated: Partial<Profile> = {};
    for (const key of Object.keys(updates) as (keyof Profile)[]) {
        if (!ALLOWED_PROFILE_FIELDS.includes(key)) continue;
        const value = updates[key];
        switch (key) {
            case 'full_name':
                validated.full_name = validateString(value, MAX_NAME_LENGTH) || undefined;
                break;
            case 'bio':
                validated.bio = validateString(value, MAX_BIO_LENGTH) || undefined;
                break;
            case 'crm':
            case 'specialty':
            case 'company':
            case 'education':
            case 'academic_title':
            case 'post_grad':
                validated[key] = validateString(value, MAX_FIELD_LENGTH) || undefined;
                break;
            case 'avatar_url':
                const url = validateString(value, 1000);
                if (url && (url.startsWith('https://') || url.startsWith('data:image/'))) {
                    validated.avatar_url = url;
                }
                break;
            case 'onboarding_completed':
                if (typeof value === 'boolean') validated.onboarding_completed = value;
                break;
            case 'notification_preferences':
            case 'push_subscription':
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                validated[key] = value as any;
                break;
        }
    }
    return validated;
};

export const validateServiceInput = (name: string, institution: string): { name: string; institution: string } => {
    const validatedName = validateString(name, MAX_NAME_LENGTH);
    const validatedInstitution = validateString(institution, MAX_FIELD_LENGTH);
    if (!validatedName || validatedName.trim().length === 0) {
        throw new Error('Nome do serviço é obrigatório');
    }
    if (!validatedInstitution || validatedInstitution.trim().length === 0) {
        throw new Error('Instituição é obrigatória');
    }
    return { name: validatedName.trim(), institution: validatedInstitution.trim() };
};

export const validateColorHex = (color: string, defaultColor = '#10b981'): string => {
    return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : defaultColor;
};
