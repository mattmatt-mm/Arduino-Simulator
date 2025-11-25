import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const RaspberryPiNode = ({ data }) => {
    // Standard 40-pin GPIO header layout (simplified for visualization)
    const leftPins = [
        { id: '3V3_1', label: '3V3', type: 'power' },
        { id: 'GPIO2', label: 'GPIO2', type: 'signal' },
        { id: 'GPIO3', label: 'GPIO3', type: 'signal' },
        { id: 'GPIO4', label: 'GPIO4', type: 'signal' },
        { id: 'GND_1', label: 'GND', type: 'ground' },
        { id: 'GPIO17', label: 'GPIO17', type: 'signal' },
        { id: 'GPIO27', label: 'GPIO27', type: 'signal' },
        { id: 'GPIO22', label: 'GPIO22', type: 'signal' },
        { id: '3V3_2', label: '3V3', type: 'power' },
        { id: 'GPIO10', label: 'GPIO10', type: 'signal' },
        { id: 'GPIO9', label: 'GPIO9', type: 'signal' },
        { id: 'GPIO11', label: 'GPIO11', type: 'signal' },
        { id: 'GND_2', label: 'GND', type: 'ground' },
        { id: 'ID_SD', label: 'ID_SD', type: 'signal' },
        { id: 'GPIO5', label: 'GPIO5', type: 'signal' },
        { id: 'GPIO6', label: 'GPIO6', type: 'signal' },
        { id: 'GPIO13', label: 'GPIO13', type: 'signal' },
        { id: 'GPIO19', label: 'GPIO19', type: 'signal' },
        { id: 'GPIO26', label: 'GPIO26', type: 'signal' },
        { id: 'GND_3', label: 'GND', type: 'ground' },
    ];

    const rightPins = [
        { id: '5V_1', label: '5V', type: 'power' },
        { id: '5V_2', label: '5V', type: 'power' },
        { id: 'GND_4', label: 'GND', type: 'ground' },
        { id: 'GPIO14', label: 'GPIO14', type: 'signal' },
        { id: 'GPIO15', label: 'GPIO15', type: 'signal' },
        { id: 'GPIO18', label: 'GPIO18', type: 'signal' },
        { id: 'GND_5', label: 'GND', type: 'ground' },
        { id: 'GPIO23', label: 'GPIO23', type: 'signal' },
        { id: 'GPIO24', label: 'GPIO24', type: 'signal' },
        { id: 'GND_6', label: 'GND', type: 'ground' },
        { id: 'GPIO25', label: 'GPIO25', type: 'signal' },
        { id: 'GPIO8', label: 'GPIO8', type: 'signal' },
        { id: 'GPIO7', label: 'GPIO7', type: 'signal' },
        { id: 'ID_SC', label: 'ID_SC', type: 'signal' },
        { id: 'GND_7', label: 'GND', type: 'ground' },
        { id: 'GPIO12', label: 'GPIO12', type: 'signal' },
        { id: 'GND_8', label: 'GND', type: 'ground' },
        { id: 'GPIO16', label: 'GPIO16', type: 'signal' },
        { id: 'GPIO20', label: 'GPIO20', type: 'signal' },
        { id: 'GPIO21', label: 'GPIO21', type: 'signal' },
    ];

    const getPinColor = (type) => {
        switch (type) {
            case 'power': return '!bg-red-500 hover:!bg-red-400';
            case 'ground': return '!bg-gray-800 hover:!bg-gray-600';
            default: return '!bg-green-500 hover:!bg-green-400';
        }
    };

    return (
        <div className="relative w-64 h-auto select-none filter drop-shadow-xl">
            {/* PCB Board */}
            <div className="absolute inset-0 bg-green-700 rounded-lg shadow-xl border-2 border-green-800 opacity-90"></div>

            <div className="relative p-4 flex flex-col items-center">
                {/* Header */}
                <div className="w-full flex justify-between items-center mb-4 border-b border-green-600 pb-2">
                    <span className="text-xs font-bold text-white/90 font-mono">Raspberry Pi 4</span>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse delay-75"></div>
                    </div>
                </div>

                {/* Main Processor */}
                <div className="w-16 h-16 bg-gray-900 rounded-sm mb-6 flex items-center justify-center border border-gray-700 shadow-inner">
                    <div className="text-[8px] text-gray-400 font-mono text-center leading-tight">
                        BROADCOM<br />BCM2711
                    </div>
                </div>

                {/* Ports Visualization (Decorative) */}
                <div className="w-full flex justify-between gap-2 mb-4 px-2">
                    <div className="h-6 w-8 bg-gray-400 rounded-sm border border-gray-500 shadow-sm"></div> {/* USB */}
                    <div className="h-6 w-8 bg-gray-400 rounded-sm border border-gray-500 shadow-sm"></div> {/* USB */}
                    <div className="h-6 w-8 bg-gray-400 rounded-sm border border-gray-500 shadow-sm"></div> {/* Ethernet */}
                </div>

                {/* GPIO Header */}
                <div className="w-full bg-gray-900/50 rounded p-2 border border-gray-700/50">
                    <div className="flex justify-between gap-8">
                        {/* Left Column (Odd Pins) */}
                        <div className="flex flex-col gap-1 relative">
                            {leftPins.map((pin, i) => (
                                <div key={pin.id} className="relative h-3 flex items-center justify-end">
                                    <span className="text-[6px] text-gray-300 font-mono mr-2">{pin.label}</span>
                                    <Handle
                                        type="source"
                                        position={Position.Left}
                                        id={pin.id}
                                        className={`!w-2 !h-2 !border-none transition-colors ${getPinColor(pin.type)}`}
                                        style={{ left: -6, top: '50%', transform: 'translateY(-50%)' }}
                                    />
                                    <div className="w-1 h-1 rounded-full bg-yellow-600/50"></div>
                                </div>
                            ))}
                        </div>

                        {/* Right Column (Even Pins) */}
                        <div className="flex flex-col gap-1 relative">
                            {rightPins.map((pin, i) => (
                                <div key={pin.id} className="relative h-3 flex items-center justify-start">
                                    <div className="w-1 h-1 rounded-full bg-yellow-600/50"></div>
                                    <Handle
                                        type="source"
                                        position={Position.Right}
                                        id={pin.id}
                                        className={`!w-2 !h-2 !border-none transition-colors ${getPinColor(pin.type)}`}
                                        style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }}
                                    />
                                    <span className="text-[6px] text-gray-300 font-mono ml-2">{pin.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(RaspberryPiNode);
