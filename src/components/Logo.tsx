import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Defined Colors/Gradients */}
      <defs>
        <linearGradient id="clockGradient" x1="0" y1="0" x2="120" y2="120">
          <stop offset="0%" stopColor="#ECFDF5" />
          <stop offset="100%" stopColor="#D1FAE5" />
        </linearGradient>
      </defs>

      {/* Main Medical Cross Shape (Outline) */}
      <path 
        d="M45 15C45 9.477 49.477 5 55 5H65C70.523 5 75 9.477 75 15V35H95C100.523 35 105 39.477 105 45V55C105 60.523 100.523 65 95 65H75V85C75 90.523 70.523 95 65 95H55C49.477 95 45 90.523 45 85V65H25C19.477 65 15 60.523 15 55V45C15 39.477 19.477 35 25 35H45V15Z" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="text-primaryDark"
      />

      {/* Clock Face (Inset in the cross intersection) */}
      <circle cx="60" cy="50" r="22" className="fill-surface stroke-primaryDark" strokeWidth="4" />
      
      {/* Clock Hands (Time aspect) */}
      <path d="M60 50V38" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
      <path d="M60 50L68 58" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />

      {/* Network Nodes (Tech/Connection aspect) */}
      {/* Connecting lines */}
      <path d="M78 35L95 20" stroke="currentColor" strokeWidth="3" className="text-primary" />
      <path d="M95 20L105 45" stroke="currentColor" strokeWidth="3" className="text-primary" />
      <path d="M78 65L105 85" stroke="currentColor" strokeWidth="3" className="text-primary" />
      
      {/* Nodes dots */}
      <circle cx="95" cy="20" r="5" fill="#F59E0B" className="stroke-surface" strokeWidth="1.5" />
      <circle cx="105" cy="45" r="4" fill="#F59E0B" className="stroke-surface" strokeWidth="1.5" />
      <circle cx="105" cy="85" r="4" fill="#F59E0B" className="stroke-surface" strokeWidth="1.5" />
      
    </svg>
  );
};

export default Logo;