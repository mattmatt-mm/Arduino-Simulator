import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const ServoMotorNode = ({ data }) => {
    const pins = [
        { id: 'GND', label: 'GND', color: 'bg-gray-700' },
        { id: 'VCC', label: 'VCC', color: 'bg-red-500' },
        { id: 'SIG', label: 'SIG', color: 'bg-purple-500' },
    ];

    return (
        <div className="relative w-[80px] h-[80px] select-none filter drop-shadow-xl">
            {/* Servo Body */}
            <div className="absolute inset-0 top-0 h-[60px] bg-gray-800 rounded-sm shadow-md border border-gray-900 flex flex-col justify-center pl-3">
                <div className="text-[8px] text-white font-mono opacity-70 font-bold">SERVO</div>
            </div>

            {/* Mounting Tabs */}
            <div className="absolute -left-2 top-4 w-2 h-8 bg-gray-800 rounded-l-sm border border-gray-900"></div>
            <div className="absolute -right-2 top-4 w-2 h-8 bg-gray-800 rounded-r-sm border border-gray-900"></div>

            {/* Gear/Horn */}
            <div className="absolute top-2 right-4 w-8 h-8 bg-white rounded-full border-2 border-gray-300 shadow-sm flex items-center justify-center">
                <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                <div className="w-4 h-1 bg-gray-400 rounded-full absolute"></div>
            </div>

            {/* Wire Connector Pins (Bottom) */}
            {pins.map((pin, index) => (
                <div
                    key={pin.id}
                    className="absolute flex flex-col items-center"
                    style={{ bottom: 8, left: 10 + index * 20 }}
                >
                    <Handle
                        type="target"
                        position={Position.Bottom}
                        id={pin.id}
                        className={`!w-2 !h-2 !${pin.color} !border-none hover:!opacity-70 transition-opacity`}
                        style={{ bottom: -4 }}
                    />
                    <span className="text-[6px] text-gray-600 dark:text-gray-400 font-mono absolute bottom-2">{pin.label}</span>
                </div>
            ))}
        </div>
    );
};

export default memo(ServoMotorNode);
