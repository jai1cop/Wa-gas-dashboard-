import React from 'react';

const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-xl shadow-md p-4 sm:p-6 ${className}`}>
        {children}
    </div>
);

export default Card;
