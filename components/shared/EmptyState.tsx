import React from 'react';

interface EmptyStateProps {
    title: string;
    message: string;
    action: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message, action }) => {
    return (
        <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-on-surface">{title}</h3>
            <p className="mt-2 text-on-surface-secondary">{message}</p>
            <div className="mt-6">
                {action}
            </div>
        </div>
    );
};

export default EmptyState;