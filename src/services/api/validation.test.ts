import { describe, it, expect } from 'vitest';
import {
    sanitizeFilterValue,
    validateString,
    validateProfileUpdates,
    validateServiceInput,
    validateColorHex,
    MAX_NAME_LENGTH,
    MAX_BIO_LENGTH,
    MAX_FIELD_LENGTH
} from './validation';

describe('sanitizeFilterValue', () => {
    it('removes commas', () => {
        expect(sanitizeFilterValue('test,value')).toBe('testvalue');
    });

    it('removes periods', () => {
        expect(sanitizeFilterValue('test.value')).toBe('testvalue');
    });

    it('removes parentheses', () => {
        expect(sanitizeFilterValue('test(value)')).toBe('testvalue');
    });

    it('removes quotes', () => {
        expect(sanitizeFilterValue('test"value\'')).toBe('testvalue');
    });

    it('removes backslashes', () => {
        expect(sanitizeFilterValue('test\\value')).toBe('testvalue');
    });

    it('removes multiple special characters', () => {
        expect(sanitizeFilterValue('te,st.va(lu)e"\'\\')).toBe('testvalue');
    });

    it('preserves safe characters', () => {
        expect(sanitizeFilterValue('test value-123_abc')).toBe('test value-123_abc');
    });

    it('handles empty string', () => {
        expect(sanitizeFilterValue('')).toBe('');
    });
});

describe('validateString', () => {
    it('returns null for null input', () => {
        expect(validateString(null, 100)).toBeNull();
    });

    it('returns null for undefined input', () => {
        expect(validateString(undefined, 100)).toBeNull();
    });

    it('returns null for non-string input', () => {
        expect(validateString(123, 100)).toBeNull();
        expect(validateString({}, 100)).toBeNull();
        expect(validateString([], 100)).toBeNull();
    });

    it('truncates string to maxLength', () => {
        const longString = 'a'.repeat(200);
        expect(validateString(longString, 100)).toBe('a'.repeat(100));
    });

    it('returns string as-is when under maxLength', () => {
        expect(validateString('short', 100)).toBe('short');
    });

    it('returns empty string for empty input', () => {
        expect(validateString('', 100)).toBe('');
    });
});

describe('validateProfileUpdates', () => {
    it('filters out disallowed fields', () => {
        const updates = {
            full_name: 'Test User',
            // @ts-expect-error - testing disallowed field
            id: 'should-be-filtered',
            // @ts-expect-error - testing disallowed field
            email: 'test@test.com'
        };
        const result = validateProfileUpdates(updates);
        expect(result).toEqual({ full_name: 'Test User' });
        expect(result).not.toHaveProperty('id');
        expect(result).not.toHaveProperty('email');
    });

    it('truncates full_name to MAX_NAME_LENGTH', () => {
        const longName = 'a'.repeat(200);
        const result = validateProfileUpdates({ full_name: longName });
        expect(result.full_name).toBe('a'.repeat(MAX_NAME_LENGTH));
    });

    it('truncates bio to MAX_BIO_LENGTH', () => {
        const longBio = 'a'.repeat(1000);
        const result = validateProfileUpdates({ bio: longBio });
        expect(result.bio).toBe('a'.repeat(MAX_BIO_LENGTH));
    });

    it('truncates specialty to MAX_FIELD_LENGTH', () => {
        const longSpecialty = 'a'.repeat(500);
        const result = validateProfileUpdates({ specialty: longSpecialty });
        expect(result.specialty).toBe('a'.repeat(MAX_FIELD_LENGTH));
    });

    it('validates avatar_url starting with https://', () => {
        const result = validateProfileUpdates({ avatar_url: 'https://example.com/image.png' });
        expect(result.avatar_url).toBe('https://example.com/image.png');
    });

    it('validates avatar_url starting with data:image/', () => {
        const result = validateProfileUpdates({ avatar_url: 'data:image/png;base64,abc123' });
        expect(result.avatar_url).toBe('data:image/png;base64,abc123');
    });

    it('rejects avatar_url with invalid protocol', () => {
        const result = validateProfileUpdates({ avatar_url: 'http://example.com/image.png' });
        expect(result.avatar_url).toBeUndefined();
    });

    it('validates boolean onboarding_completed', () => {
        expect(validateProfileUpdates({ onboarding_completed: true })).toEqual({ onboarding_completed: true });
        expect(validateProfileUpdates({ onboarding_completed: false })).toEqual({ onboarding_completed: false });
    });

    it('rejects non-boolean onboarding_completed', () => {
        // @ts-expect-error - testing invalid type
        const result = validateProfileUpdates({ onboarding_completed: 'true' });
        expect(result.onboarding_completed).toBeUndefined();
    });
});

describe('validateServiceInput', () => {
    it('returns trimmed name and institution', () => {
        const result = validateServiceInput('  Test Service  ', '  Test Hospital  ');
        expect(result).toEqual({ name: 'Test Service', institution: 'Test Hospital' });
    });

    it('throws error for empty name', () => {
        expect(() => validateServiceInput('', 'Hospital')).toThrow('Nome do serviço é obrigatório');
    });

    it('throws error for whitespace-only name', () => {
        expect(() => validateServiceInput('   ', 'Hospital')).toThrow('Nome do serviço é obrigatório');
    });

    it('throws error for empty institution', () => {
        expect(() => validateServiceInput('Service', '')).toThrow('Instituição é obrigatória');
    });

    it('throws error for whitespace-only institution', () => {
        expect(() => validateServiceInput('Service', '   ')).toThrow('Instituição é obrigatória');
    });

    it('truncates long name to MAX_NAME_LENGTH', () => {
        const longName = 'a'.repeat(200);
        const result = validateServiceInput(longName, 'Hospital');
        expect(result.name.length).toBe(MAX_NAME_LENGTH);
    });

    it('truncates long institution to MAX_FIELD_LENGTH', () => {
        const longInst = 'a'.repeat(500);
        const result = validateServiceInput('Service', longInst);
        expect(result.institution.length).toBe(MAX_FIELD_LENGTH);
    });
});

describe('validateColorHex', () => {
    it('returns valid hex color', () => {
        expect(validateColorHex('#ff0000')).toBe('#ff0000');
        expect(validateColorHex('#FF0000')).toBe('#FF0000');
        expect(validateColorHex('#10b981')).toBe('#10b981');
    });

    it('returns default color for invalid hex', () => {
        expect(validateColorHex('invalid')).toBe('#10b981');
        expect(validateColorHex('#fff')).toBe('#10b981'); // 3-char hex not allowed
        expect(validateColorHex('ff0000')).toBe('#10b981'); // missing #
        expect(validateColorHex('#gggggg')).toBe('#10b981'); // invalid chars
    });

    it('uses custom default color', () => {
        expect(validateColorHex('invalid', '#000000')).toBe('#000000');
    });

    it('handles empty string', () => {
        expect(validateColorHex('')).toBe('#10b981');
    });
});
