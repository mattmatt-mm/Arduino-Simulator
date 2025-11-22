import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const ArduinoUnoNode = ({ data }) => {
    // Pin definitions
    const digitalPins1 = [
        { id: 'SCL', label: 'SCL' },
        { id: 'SDA', label: 'SDA' },
        { id: 'AREF', label: 'REF' },
        { id: 'GND_D', label: 'GND' },
        { id: 'D13', label: '13' },
        { id: 'D12', label: '12' },
        { id: 'D11', label: '11' },
        { id: 'D10', label: '10' },
        { id: 'D9', label: '9' },
        { id: 'D8', label: '8' },
    ];

    const digitalPins2 = [
        { id: 'D7', label: '7' },
        { id: 'D6', label: '6' },
        { id: 'D5', label: '5' },
        { id: 'D4', label: '4' },
        { id: 'D3', label: '3' },
        { id: 'D2', label: '2' },
        { id: 'D1', label: '1' },
        { id: 'D0', label: '0' },
    ];

    const powerPins = [
        { id: 'IOREF', label: 'IOREF' },
        { id: 'RST', label: 'RST' },
        { id: '3V3', label: '3V3' },
        { id: '5V', label: '5V' },
        { id: 'GND_1', label: 'GND' },
        { id: 'VIN', label: 'VIN' },
    ];

    const analogPins = [
        { id: 'A0', label: 'A0' },
        { id: 'A1', label: 'A1' },
        { id: 'A2', label: 'A2' },
        { id: 'A3', label: 'A3' },
        { id: 'A4', label: 'A4' },
        { id: 'A5', label: 'A5' },
    ];

    return (
        <div className="relative w-[210px] h-[150px] select-none filter drop-shadow-xl">
            {/* PCB Board */}
            <svg viewBox="0 0 210 150" className="w-full h-full pointer-events-none">
                <path d="M 0 5 L 0 145 L 5 150 L 205 150 L 210 145 L 210 35 L 200 25 L 200 5 L 195 0 L 5 0 Z" fill="#00658D" stroke="#004A66" strokeWidth="1" />
                <rect x="-10" y="20" width="30" height="35" fill="#C0C0C0" stroke="#808080" />
                <rect x="-5" y="100" width="35" height="40" fill="#1a1a1a" stroke="#000" />
                <rect x="90" y="80" width="80" height="25" fill="#1a1a1a" rx="2" />
                <circle cx="95" cy="92.5" r="3" fill="#333" />
                <rect x="45" y="5" width="85" height="15" fill="#000" />
                <rect x="138" y="5" width="62" height="15" fill="#000" />
                <rect x="115" y="135" width="80" height="15" fill="#000" />
                <rect x="40" y="135" width="65" height="15" fill="#000" />
                <text x="150" y="50" fill="white" fontSize="20" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">UNO</text>
                <text x="150" y="65" fill="white" fontSize="12" fontFamily="sans-serif" textAnchor="middle">ARDUINO</text>
            </svg>

            {/* Digital Pins Block 1 (Top) - SCL to 8 */}
            {digitalPins1.map((pin, index) => (
                <div
                    key={pin.id}
                    className="absolute flex items-center"
                    style={{ top: 8, left: 49 + index * 8 }}
                >
                    <Handle
                        type="source"
                        position="top"
                        id={pin.id}
                        className={`!w-2 !h-2 !border-none transition-colors ${pin.id.includes('GND') ? '!bg-gray-700 hover:!bg-gray-500' :
                                '!bg-purple-500 hover:!bg-purple-300'
                            }`}
                        style={{ top: -4 }}
                    />
                    <span className="text-[6px] text-white font-mono opacity-70 absolute top-2">{pin.label}</span>
                </div>
            ))}

            {/* Digital Pins Block 2 (Top) - 7 to 0, positioned below the yellow pins */}
            {digitalPins2.map((pin, index) => (
                <div
                    key={pin.id}
                    className="absolute flex flex-col items-center"
                    style={{ top: 20, left: 142 + index * 8 }}
                >
                    <Handle
                        type="source"
                        position="top"
                        id={pin.id}
                        className="!w-2 !h-2 !bg-purple-500 !border-none hover:!bg-purple-300 transition-colors"
                        style={{ top: -4 }}
                    />
                    <span className="text-[6px] text-white font-mono opacity-70 mt-0.5">{pin.label}</span>
                </div>
            ))}

            {/* Power Pins (Bottom) */}
            {powerPins.map((pin, index) => (
                <div
                    key={pin.id}
                    className="absolute flex items-center"
                    style={{ bottom: 8, left: 41 + index * 10 }}
                >
                    <Handle
                        type="source"
                        position="bottom"
                        id={pin.id}
                        className={`!w-2 !h-2 !border-none transition-colors ${pin.id.includes('GND') ? '!bg-gray-700 hover:!bg-gray-500' :
                                ['3V3', '5V', 'VIN', 'IOREF'].includes(pin.id) ? '!bg-red-500 hover:!bg-red-300' :
                                    '!bg-purple-500 hover:!bg-purple-300' // RST
                            }`}
                        style={{ bottom: -4 }}
                    />
                    <span className="text-[5px] text-white font-mono opacity-70 absolute bottom-2">{pin.label}</span>
                </div>
            ))}

            {/* Analog Pins (Bottom) */}
            {analogPins.map((pin, index) => (
                <div
                    key={pin.id}
                    className="absolute flex items-center"
                    style={{ bottom: 8, left: 116 + index * 10 }}
                >
                    <Handle
                        type="source"
                        position="bottom"
                        id={pin.id}
                        className="!w-2 !h-2 !bg-green-500 !border-none hover:!bg-green-300 transition-colors"
                        style={{ bottom: -4 }}
                    />
                    <span className="text-[5px] text-white font-mono opacity-70 absolute bottom-2">{pin.label}</span>
                </div>
            ))}
        </div>
    );
};

export default memo(ArduinoUnoNode);
