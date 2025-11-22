import React from 'react';
import { Button, Tooltip } from "@heroui/react";

const COLORS = [
    { label: 'Red', value: '#ef4444' },
    { label: 'Black', value: '#000000' },
    { label: 'Green', value: '#22c55e' },
    { label: 'Blue', value: '#3b82f6' },
    { label: 'Yellow', value: '#eab308' },
    { label: 'Brown', value: '#78350f' },
];

const WireToolbar = ({ position, onColorChange, onDelete }) => {
    if (!position) return null;

    return (
        <div
            className="absolute z-50 flex gap-2 p-2 bg-content1 rounded-full shadow-lg border border-divider animate-in fade-in zoom-in duration-200"
            style={{
                top: position.y - 60,
                left: position.x,
                transform: 'translateX(-50%)'
            }}
        >
            {COLORS.map((color) => (
                <Tooltip key={color.value} content={color.label}>
                    <button
                        className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform shadow-sm"
                        style={{ backgroundColor: color.value }}
                        onClick={() => onColorChange(color.value)}
                    />
                </Tooltip>
            ))}

            <div className="w-px bg-divider mx-1" />

            <Tooltip content="Delete Wire" color="danger">
                <button
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-danger/10 text-danger hover:bg-danger hover:text-white transition-colors"
                    onClick={onDelete}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                </button>
            </Tooltip>
        </div>
    );
};

export default WireToolbar;
