import React from 'react';

/**
 * Skip to Main Content link - Essential for keyboard navigation
 * Allows users to skip navigation and go directly to main content
 */
const SkipToMain: React.FC = () => {
    const handleSkip = (e: React.MouseEvent) => {
        e.preventDefault();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.focus();
            mainContent.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <a
            href="#main-content"
            onClick={handleSkip}
            className="skip-to-main"
            tabIndex={0}
        >
            Pular para o conteúdo principal
        </a>
    );
};

export default SkipToMain;
