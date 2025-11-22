import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const CustomComponentNode = ({ data }) => {
    const { name, pins = [], color = '#4B5563' } = data;

    return (
        <div className="relative select-none filter drop-shadow-xl" style={{ width: '100px', minHeight: '80px' }}>
            {/* Component Body */}
            <div
                className="px-4 py-6 rounded-lg shadow-md border-2 flex flex-col items-center justify-center"
                style={{ backgroundColor: color, borderColor: color }}
            >
                <div className="text-xs text-white font-mono font-bold text-center break-words max-w-full">
                    {name || 'Custom'}
                </div>
            </div>

            {/* Pins */}
            {pins.map((pin, index) => {
                const position = pin.position || 'bottom';
                const isBottom = position === 'bottom';
                const isTop = position === 'top';
                const isLeft = position === 'left';
                const isRight = position === 'right';

                return (
                    <div
                        key={pin.id}
                        className="absolute flex items-center"
                        style={{
                            ...(isBottom && { bottom: 8, left: 10 + index * 20 }),
                            ...(isTop && { top: 8, left: 10 + index * 20 }),
                            ...(isLeft && { left: 8, top: 30 + index * 15 }),
                            ...(isRight && { right: 8, top: 30 + index * 15 }),
                        }}
                    >
                        <Handle
                            type="source"
                            position={Position[position.charAt(0).toUpperCase() + position.slice(1)]}
                            id={pin.id}
                            className={`!w-2 !h-2 !border-none transition-colors ${pin.id.includes('GND') || pin.label.includes('GND') ? '!bg-gray-700 hover:!bg-gray-500' :
                                    ['3V3', '5V', 'VIN', 'VCC'].some(p => pin.id.includes(p) || pin.label.includes(p)) ? '!bg-red-500 hover:!bg-red-300' :
                                        (pin.id.startsWith('A') || pin.label.startsWith('A')) && !pin.id.includes('AREF') ? '!bg-green-500 hover:!bg-green-300' :
                                            '!bg-purple-500 hover:!bg-purple-300'
                                }`}
                            style={{
                                ...(isBottom && { bottom: -4 }),
                                ...(isTop && { top: -4 }),
                                ...(isLeft && { left: -4 }),
                                ...(isRight && { right: -4 }),
                            }}
                        />
                        <span
                            className="text-[6px] text-white font-mono absolute whitespace-nowrap"
                            style={{
                                ...(isBottom && { bottom: 2 }),
                                ...(isTop && { top: 2 }),
                                ...(isLeft && { left: 4 }),
                                ...(isRight && { right: 4 }),
                            }}
                        >
                            {pin.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default memo(CustomComponentNode);
