import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const StepperMotorNode = ({ data }) => {
    const pins = [
        { id: 'A+', label: 'A+', color: 'bg-purple-500' },
        { id: 'A-', label: 'A-', color: 'bg-purple-500' },
        { id: 'B+', label: 'B+', color: 'bg-purple-500' },
        { id: 'B-', label: 'B-', color: 'bg-purple-500' },
    ];

    return (
        <div className="relative w-[120px] h-[80px] select-none filter drop-shadow-xl">
            {/* Stepper Motor Body */}
            <div className="absolute inset-0 top-0 h-[60px] bg-gray-700 rounded-sm shadow-md border border-gray-900 flex items-center justify-center">
                <div className="w-10 h-10 bg-gray-500 rounded-full border-2 border-gray-600 flex items-center justify-center">
                    <div className="text-[8px] text-white font-mono font-bold">STEP</div>
                </div>
            </div>

            {/* Mounting Holes */}
            <div className="absolute top-2 left-2 w-2 h-2 bg-gray-900 rounded-full"></div>
            <div className="absolute top-2 right-2 w-2 h-2 bg-gray-900 rounded-full"></div>
            <div className="absolute bottom-[22px] left-2 w-2 h-2 bg-gray-900 rounded-full"></div>
            <div className="absolute bottom-[22px] right-2 w-2 h-2 bg-gray-900 rounded-full"></div>

            {/* Horizontal Wire Connector Pins (Bottom) */}
            {pins.map((pin, index) => (
                <div
                    key={pin.id}
                    className="absolute flex flex-col items-center"
                    style={{ bottom: 8, left: 15 + index * 24 }}
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

export default memo(StepperMotorNode);
