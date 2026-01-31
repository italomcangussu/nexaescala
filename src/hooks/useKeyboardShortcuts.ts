import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    action: () => void;
    description: string;
}

interface UseKeyboardShortcutsOptions {
    enabled?: boolean;
}

/**
 * Hook for managing keyboard shortcuts in the desktop version
 * 
 * @example
 * useKeyboardShortcuts([
 *   { key: 's', ctrlKey: true, action: handleSave, description: 'Salvar' },
 *   { key: 'p', ctrlKey: true, action: handlePublish, description: 'Publicar' },
 * ]);
 */
export const useKeyboardShortcuts = (
    shortcuts: KeyboardShortcut[],
    options: UseKeyboardShortcutsOptions = {}
) => {
    const { enabled = true } = options;

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            // Don't trigger shortcuts when typing in inputs/textareas
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            for (const shortcut of shortcuts) {
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatch = shortcut.ctrlKey ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
                const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
                const altMatch = shortcut.altKey ? event.altKey : !event.altKey;

                if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                    event.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        },
        [shortcuts, enabled]
    );

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown, enabled]);

    // Return shortcuts list for documentation/help display
    return { shortcuts };
};

// Pre-defined common shortcuts for the desktop editor
export const createEditorShortcuts = (handlers: {
    onSave?: () => void;
    onPublish?: () => void;
    onReplicate?: () => void;
    onPrint?: () => void;
    onEscape?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
}): KeyboardShortcut[] => {
    const shortcuts: KeyboardShortcut[] = [];

    if (handlers.onSave) {
        shortcuts.push({
            key: 's',
            ctrlKey: true,
            action: handlers.onSave,
            description: 'Salvar escala'
        });
    }

    if (handlers.onPublish) {
        shortcuts.push({
            key: 'p',
            ctrlKey: true,
            shiftKey: true,
            action: handlers.onPublish,
            description: 'Publicar escala'
        });
    }

    if (handlers.onReplicate) {
        shortcuts.push({
            key: 'r',
            ctrlKey: true,
            shiftKey: true,
            action: handlers.onReplicate,
            description: 'Replicar escala'
        });
    }

    if (handlers.onPrint) {
        shortcuts.push({
            key: 'p',
            ctrlKey: true,
            action: handlers.onPrint,
            description: 'Imprimir'
        });
    }

    if (handlers.onEscape) {
        shortcuts.push({
            key: 'Escape',
            action: handlers.onEscape,
            description: 'Fechar modal / Voltar'
        });
    }

    if (handlers.onUndo) {
        shortcuts.push({
            key: 'z',
            ctrlKey: true,
            action: handlers.onUndo,
            description: 'Desfazer'
        });
    }

    if (handlers.onRedo) {
        shortcuts.push({
            key: 'z',
            ctrlKey: true,
            shiftKey: true,
            action: handlers.onRedo,
            description: 'Refazer'
        });
    }

    return shortcuts;
};

export default useKeyboardShortcuts;
