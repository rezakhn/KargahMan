
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-surface rounded-lg shadow-md border border-gray-700/50 p-4 ${className}`}>
      {children}
    </div>
  );
};

export default Card;