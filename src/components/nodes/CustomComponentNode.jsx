import React, { memo, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import { getIcon } from '../../constants/icons.jsx';

const CustomComponentNode = ({ data }) => {
    const { name, pins = [], color = '#4B5563' } = data;

    // Calculate dimensions based on pin counts
    const dimensions = useMemo(() => {
        const counts = { top: 0, bottom: 0, left: 0, right: 0 };
        pins.forEach(p => {
            const pos = p.position || 'bottom';
            counts[pos] = (counts[pos] || 0) + 1;
        });

        const PIN_SPACING = 15;
        const MIN_WIDTH = 100;
        const MIN_HEIGHT = 80;
        const PADDING = 40; // Space for corners/edges

        const requiredWidth = Math.max(
            MIN_WIDTH,
            Math.max(counts.top, counts.bottom) * PIN_SPACING + PADDING
        );

        const requiredHeight = Math.max(
            MIN_HEIGHT,
            Math.max(counts.left, counts.right) * PIN_SPACING + PADDING
        );

        return { width: requiredWidth, height: requiredHeight };
    }, [pins]);

    return (
        <div
            className="relative select-none filter drop-shadow-xl"
            style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
        >
            {/* Component Body */}
            <div
                className="absolute inset-0 rounded-lg shadow-md border-2 flex flex-col items-center justify-center"
                style={{ backgroundColor: color, borderColor: color }}
            >
                {data.icon && (
                    <div className="w-8 h-8 text-white/80 mb-1">
                        {getIcon(data.icon)}
                    </div>
                )}
                <div className="text-xs text-white font-mono font-bold text-center break-words max-w-full px-2">
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

                // Determine pin layout based on position
                let containerStyle = {};
                let handleStyle = {};
                let labelClass = "text-[5px] text-white font-mono whitespace-nowrap";
                let containerClass = "absolute flex items-center";

                // Calculate index for this specific side to stack correctly
                // We need to know the index relative to the side, not the global index
                // But the global index is passed. 
                // To fix this properly, we should filter pins by side first, but that changes the map structure.
                // For now, let's assume the user adds pins in order or we just use the global index?
                // No, global index will cause gaps if we mix positions.
                // We need to calculate the side-specific index.

                // Let's find the index of this pin among pins on the same side
                const sidePins = pins.filter(p => (p.position || 'bottom') === position);
                const sideIndex = sidePins.findIndex(p => p.id === pin.id);

                // Center the pins on the side? Or start from corner?
                // Nano starts from corner (top/left). Let's stick to that.

                if (isBottom) {
                    containerClass += " flex-col-reverse";
                    containerStyle = { bottom: 1, left: 20 + sideIndex * 15 };
                    handleStyle = { bottom: -4 };
                    labelClass += " mb-1";
                } else if (isTop) {
                    containerClass += " flex-col";
                    containerStyle = { top: 1, left: 20 + sideIndex * 15 };
                    handleStyle = { top: -4 };
                    labelClass += " mt-1";
                } else if (isLeft) {
                    containerClass += " flex-row";
                    containerStyle = { left: 1, top: 20 + sideIndex * 15 };
                    handleStyle = { left: -4 };
                    labelClass += " ml-1";
                } else if (isRight) {
                    containerClass += " flex-row-reverse";
                    containerStyle = { right: 1, top: 20 + sideIndex * 15 };
                    handleStyle = { right: -4 };
                    labelClass += " mr-1";
                }

                return (
                    <div
                        key={pin.id}
                        className={containerClass}
                        style={containerStyle}
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
                            style={handleStyle}
                        />
                        <span className={labelClass}>
                            {pin.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default memo(CustomComponentNode);
