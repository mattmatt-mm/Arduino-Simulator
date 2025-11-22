import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const ESP32Node = ({ data }) => {
    // ESP32 Dev Module (30 pin version)
    // Left side (top to bottom): EN, VP, VN, D34, D35, D32, D33, D25, D26, D27, D14, D12, D13, GND, VIN
    // Right side (top to bottom): D23, D22, TX0, RX0, D21, D19, D18, D5, D17, D16, D4, D0, D2, D15, GND

    const leftPins = [
        { id: 'EN', label: 'EN' },
        { id: 'VP', label: 'VP' },
        { id: 'VN', label: 'VN' },
        { id: 'D34', label: 'D34' },
        { id: 'D35', label: 'D35' },
        { id: 'D32', label: 'D32' },
        { id: 'D33', label: 'D33' },
        { id: 'D25', label: 'D25' },
        { id: 'D26', label: 'D26' },
        { id: 'D27', label: 'D27' },
        { id: 'D14', label: 'D14' },
        { id: 'D12', label: 'D12' },
        { id: 'D13', label: 'D13' },
        { id: 'GND_L', label: 'GND' },
        { id: 'VIN', label: 'VIN' },
    ];

    const rightPins = [
        { id: 'D23', label: 'D23' },
        { id: 'D22', label: 'D22' },
        { id: 'TX0', label: 'TX0' },
        { id: 'RX0', label: 'RX0' },
        { id: 'D21', label: 'D21' },
        { id: 'D19', label: 'D19' },
        { id: 'D18', label: 'D18' },
        { id: 'D5', label: 'D5' },
        { id: 'D17', label: 'D17' },
        { id: 'D16', label: 'D16' },
        { id: 'D4', label: 'D4' },
        { id: 'D0', label: 'D0' },
        { id: 'D2', label: 'D2' },
        { id: 'D15', label: 'D15' },
        { id: 'GND_R', label: 'GND' },
    ];

    return (
        <div className="relative w-[100px] h-[280px] select-none filter drop-shadow-xl">
            {/* PCB Board */}
            <svg viewBox="0 0 100 280" className="w-full h-full">
                <rect x="0" y="0" width="100" height="280" rx="4" fill="#1a1a1a" stroke="#000" strokeWidth="1" />

                {/* Metal Shield */}
                <rect x="20" y="40" width="60" height="70" fill="#C0C0C0" stroke="#808080" rx="2" />
                <text x="50" y="75" textAnchor="middle" fill="#666" fontSize="8" fontFamily="sans-serif" fontWeight="bold">ESP-WROOM-32</text>

                {/* USB Connector */}
                <rect x="30" y="240" width="40" height="30" fill="#C0C0C0" stroke="#808080" />

                {/* Buttons */}
                <rect x="10" y="220" width="10" height="15" fill="#333" stroke="#666" /> {/* EN */}
                <rect x="80" y="220" width="10" height="15" fill="#333" stroke="#666" /> {/* BOOT */}

                {/* Headers Background */}
                <rect x="0" y="10" width="10" height="200" fill="#000" />
                <rect x="90" y="10" width="10" height="200" fill="#000" />

                <text x="50" y="150" textAnchor="middle" fill="white" fontSize="12" fontFamily="sans-serif" fontWeight="bold">ESP32</text>
            </svg>

            {/* Left Pins */}
            {leftPins.map((pin, index) => (
                <div
                    key={pin.id}
                    className="absolute left-0 flex items-center"
                    style={{ top: 15 + index * 13 }}
                >
                    <Handle
                        type="source"
                        position={Position.Left}
                        id={pin.id}
                        className={`!w-2 !h-2 !border-none transition-colors ${pin.id.includes('GND') ? '!bg-gray-700 hover:!bg-gray-500' :
                                ['VIN', '3V3', '5V'].includes(pin.id) ? '!bg-red-500 hover:!bg-red-300' :
                                    ['VP', 'VN'].includes(pin.id) ? '!bg-green-500 hover:!bg-green-300' :
                                        '!bg-purple-500 hover:!bg-purple-300'
                            }`}
                        style={{ left: -4 }}
                    />
                    <span className="text-[6px] text-white font-mono ml-3 opacity-70">{pin.label}</span>
                </div>
            ))}

            {/* Right Pins */}
            {rightPins.map((pin, index) => (
                <div
                    key={pin.id}
                    className="absolute right-0 flex items-center justify-end"
                    style={{ top: 15 + index * 13 }}
                >
                    <span className="text-[6px] text-white font-mono mr-3 opacity-70">{pin.label}</span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id={pin.id}
                        className={`!w-2 !h-2 !border-none transition-colors ${pin.id.includes('GND') ? '!bg-gray-700 hover:!bg-gray-500' :
                                ['VIN', '3V3', '5V'].includes(pin.id) ? '!bg-red-500 hover:!bg-red-300' :
                                    '!bg-purple-500 hover:!bg-purple-300'
                            }`}
                        style={{ right: -4 }}
                    />
                </div>
            ))}
        </div>
    );
};

export default memo(ESP32Node);
