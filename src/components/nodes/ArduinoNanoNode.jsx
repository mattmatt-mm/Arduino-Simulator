import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const PIN_SPACING = 15;
const BOARD_WIDTH = 60;
const BOARD_HEIGHT = 200;

const LeftPins = [
    { id: 'D12', label: 'D12' },
    { id: 'D11', label: 'D11' },
    { id: 'D10', label: 'D10' },
    { id: 'D9', label: 'D9' },
    { id: 'D8', label: 'D8' },
    { id: 'D7', label: 'D7' },
    { id: 'D6', label: 'D6' },
    { id: 'D5', label: 'D5' },
    { id: 'D4', label: 'D4' },
    { id: 'D3', label: 'D3' },
    { id: 'D2', label: 'D2' },
    { id: 'GND_1', label: 'GND' },
    { id: 'RST_1', label: 'RST' },
    { id: 'RX0', label: 'RX0' },
    { id: 'TX1', label: 'TX1' },
];

const RightPins = [
    { id: 'D13', label: 'D13' },
    { id: '3V3', label: '3V3' },
    { id: 'AREF', label: 'REF' },
    { id: 'A0', label: 'A0' },
    { id: 'A1', label: 'A1' },
    { id: 'A2', label: 'A2' },
    { id: 'A3', label: 'A3' },
    { id: 'A4', label: 'A4' },
    { id: 'A5', label: 'A5' },
    { id: 'A6', label: 'A6' },
    { id: 'A7', label: 'A7' },
    { id: '5V', label: '5V' },
    { id: 'RST_2', label: 'RST' },
    { id: 'GND_2', label: 'GND' },
    { id: 'VIN', label: 'VIN' },
];

const ArduinoNanoNode = ({ data }) => {
    return (
        <div className="relative w-[60px] h-[260px] select-none">
            {/* Board PCB */}
            <div className="absolute inset-0 bg-blue-700 rounded-sm shadow-xl border border-blue-900 flex flex-col items-center">
                {/* USB Connector */}
                <div className="w-10 h-8 bg-gray-300 mt-1 rounded-sm border border-gray-400 shadow-inner"></div>

                {/* Main Chip */}
                <div className="w-8 h-8 bg-black mt-10 transform rotate-45 rounded-sm border border-gray-700"></div>

                {/* Labels */}
                <div className="mt-4 text-[8px] text-white font-mono tracking-widest opacity-80">ARDUINO</div>
                <div className="text-[6px] text-white font-mono opacity-80">NANO</div>
            </div>

            {/* Left Pins */}
            {LeftPins.map((pin, index) => (
                <div
                    key={pin.id}
                    className="absolute left-1 flex items-center"
                    style={{ top: 50 + index * 12 }}
                >
                    <Handle
                        type="source"
                        position={Position.Left}
                        id={pin.id}
                        className={`!w-2 !h-2 !border-none transition-colors ${pin.id.includes('GND') ? '!bg-gray-700 hover:!bg-gray-500' :
                                ['3V3', '5V', 'VIN'].includes(pin.id) ? '!bg-red-500 hover:!bg-red-300' :
                                    pin.id.startsWith('A') ? '!bg-green-500 hover:!bg-green-300' :
                                        '!bg-purple-500 hover:!bg-purple-300'
                            }`}
                        style={{ left: -4 }}
                    />
                    <span className="text-[5px] text-white font-mono ml-1">{pin.label}</span>
                </div>
            ))}

            {/* Right Pins */}
            {RightPins.map((pin, index) => (
                <div
                    key={pin.id}
                    className="absolute right-1 flex items-center justify-end"
                    style={{ top: 50 + index * 12 }}
                >
                    <span className="text-[5px] text-white font-mono mr-1">{pin.label}</span>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id={pin.id}
                        className={`!w-2 !h-2 !border-none transition-colors ${pin.id.includes('GND') ? '!bg-gray-700 hover:!bg-gray-500' :
                                ['3V3', '5V', 'VIN'].includes(pin.id) ? '!bg-red-500 hover:!bg-red-300' :
                                    pin.id.startsWith('A') && pin.id !== 'AREF' ? '!bg-green-500 hover:!bg-green-300' :
                                        '!bg-purple-500 hover:!bg-purple-300'
                            }`}
                        style={{ right: -4 }}
                    />
                </div>
            ))}
        </div>
    );
};

export default memo(ArduinoNanoNode);
