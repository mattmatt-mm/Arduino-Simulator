import React, { useState, useEffect } from 'react';
import { Tooltip } from "@heroui/react";
import ComponentManager from './ComponentManager';
import { getIcon } from '../constants/icons.jsx';

const SidebarItem = ({ type, label, color, onDragStart, customData, onViewDetails, isDefault }) => (
    <div className="relative group">
        <Tooltip content={label} placement="right">
            <div
                className="w-10 h-10 rounded-lg cursor-grab flex items-center justify-center shadow-sm hover:shadow-md transition-all hover:scale-105 border border-divider bg-content1"
                onDragStart={(event) => onDragStart(event, type, customData)}
                draggable
            >
                <div className={`w-6 h-6 rounded-md ${color} flex items-center justify-center text-white p-1`} style={customData ? { backgroundColor: customData.color } : {}}>
                    {customData && customData.icon ? (
                        getIcon(customData.icon)
                    ) : (
                        <span className="text-[8px] font-bold">{label.substring(0, 2).toUpperCase()}</span>
                    )}
                </div>
            </div>
        </Tooltip>
        {onViewDetails && (
            <button
                onClick={onViewDetails}
                className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-blue-600"
                title="View Details"
            >
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
        )}
    </div>
);

const Sidebar = () => {
    const [customComponents, setCustomComponents] = useState([]);
    const [hiddenDefaults, setHiddenDefaults] = useState([]);
    const [defaultOverrides, setDefaultOverrides] = useState({});
    const [isManagerOpen, setIsManagerOpen] = useState(false);

    const defaultComponents = [
        { type: 'arduinoNano', label: 'Arduino Nano', color: 'bg-blue-500' },
        { type: 'esp32', label: 'ESP32', color: 'bg-gray-900' },
        { type: 'raspberryPi', label: 'Raspberry Pi', color: 'bg-green-600' },
        { type: 'servoMotor', label: 'Servo Motor', color: 'bg-gray-700' },
        { type: 'stepperMotor', label: 'Stepper Motor', color: 'bg-gray-500' },
    ];

    useEffect(() => {
        loadCustomComponents();
        loadCustomComponents();
        loadHiddenDefaults();
        loadDefaultOverrides();
    }, []);

    const loadCustomComponents = () => {
        const stored = localStorage.getItem('customComponents');
        if (stored) {
            setCustomComponents(JSON.parse(stored));
        }
    };

    const loadHiddenDefaults = () => {
        const stored = localStorage.getItem('hiddenDefaultComponents');
        if (stored) {
            setHiddenDefaults(JSON.parse(stored));
        }
    };

    const loadDefaultOverrides = () => {
        const stored = localStorage.getItem('defaultComponentOverrides');
        if (stored) {
            setDefaultOverrides(JSON.parse(stored));
        }
    };

    const handleOverrideDefault = (type, newProps) => {
        const updated = { ...defaultOverrides, [type]: { ...defaultOverrides[type], ...newProps } };
        localStorage.setItem('defaultComponentOverrides', JSON.stringify(updated));
        setDefaultOverrides(updated);
    };

    const hideDefaultComponent = (type) => {
        const updated = [...hiddenDefaults, type];
        localStorage.setItem('hiddenDefaultComponents', JSON.stringify(updated));
        setHiddenDefaults(updated);
    };

    const restoreDefaultComponent = (type) => {
        const updated = hiddenDefaults.filter(t => t !== type);
        localStorage.setItem('hiddenDefaultComponents', JSON.stringify(updated));
        setHiddenDefaults(updated);
    };

    const onDragStart = (event, nodeType, customData) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        if (customData) {
            event.dataTransfer.setData('customComponentData', JSON.stringify(customData));
        }
        event.dataTransfer.effectAllowed = 'move';
    };

    const getDefaultComponentPins = (type) => {
        // Simplified pin data for default components
        const pinData = {
            arduinoNano: [
                { id: 'D2', label: 'D2', position: 'left' },
                { id: 'D3', label: 'D3', position: 'left' },
                { id: 'D13', label: 'D13', position: 'right' },
                { id: 'A0', label: 'A0', position: 'right' },
                { id: 'GND', label: 'GND', position: 'left' },
                { id: '5V', label: '5V', position: 'right' },
            ],
            esp32: [
                { id: 'D0', label: 'D0', position: 'right' },
                { id: 'D2', label: 'D2', position: 'right' },
                { id: 'GND', label: 'GND', position: 'left' },
                { id: 'VIN', label: 'VIN', position: 'left' },
            ],
            servoMotor: [
                { id: 'GND', label: 'GND', position: 'bottom' },
                { id: 'VCC', label: 'VCC', position: 'bottom' },
                { id: 'SIG', label: 'SIG', position: 'bottom' },
            ],
            stepperMotor: [
                { id: 'A+', label: 'A+', position: 'bottom' },
                { id: 'A-', label: 'A-', position: 'bottom' },
                { id: 'B+', label: 'B+', position: 'bottom' },
                { id: 'B-', label: 'B-', position: 'bottom' },
            ],
        };
        return pinData[type] || [];
    };

    const visibleDefaults = defaultComponents.filter(comp => !hiddenDefaults.includes(comp.type));

    const [startInSettings, setStartInSettings] = useState(false);

    useEffect(() => {
        const handleOpenSettings = () => {
            setStartInSettings(true);
            setIsManagerOpen(true);
        };
        window.addEventListener('openSettings', handleOpenSettings);
        return () => window.removeEventListener('openSettings', handleOpenSettings);
    }, []);

    return (
        <>
            <div className="w-16 flex flex-col items-center py-6 gap-4 bg-background border-r border-divider h-full z-10 shadow-sm">
                {/* Built-in Components */}
                {visibleDefaults.map((comp) => {
                    const override = defaultOverrides[comp.type] || {};
                    const displayLabel = override.label || comp.label;
                    const displayColor = override.color || comp.color;
                    const displayIcon = override.icon; // Could be undefined

                    return (
                        <SidebarItem
                            key={comp.type}
                            type={comp.type}
                            label={displayLabel}
                            color={displayColor}
                            onDragStart={onDragStart}
                            customData={{ ...comp, ...override }} // Pass merged data
                            onViewDetails={() => {
                                setIsManagerOpen(true);
                                // Pass component info to manager to show details
                                setTimeout(() => {
                                    window.dispatchEvent(new CustomEvent('viewComponentDetails', {
                                        detail: { ...comp, ...override, pins: getDefaultComponentPins(comp.type) }
                                    }));
                                }, 100);
                            }}
                            isDefault={true}
                        />
                    );
                })}

                {/* Divider */}
                {customComponents.length > 0 && (
                    <div className="w-8 h-px bg-divider my-2"></div>
                )}

                {/* Custom Components */}
                {customComponents.map((comp) => (
                    <SidebarItem
                        key={comp.id}
                        type="customComponent"
                        label={comp.name}
                        color={comp.color}
                        onDragStart={onDragStart}
                        customData={comp}
                        onViewDetails={() => {
                            setIsManagerOpen(true);
                            setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('viewComponentDetails', {
                                    detail: comp
                                }));
                            }, 100);
                        }}
                    />
                ))}

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Manage Components Button */}
                <Tooltip content="Manage Components" placement="right">
                    <button
                        onClick={() => {
                            setStartInSettings(false);
                            setIsManagerOpen(true);
                        }}
                        className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm hover:shadow-md transition-all hover:scale-105 border border-divider bg-content1 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                        <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </button>
                </Tooltip>
            </div>

            <ComponentManager
                isOpen={isManagerOpen}
                onClose={() => {
                    setIsManagerOpen(false);
                    setStartInSettings(false);
                }}
                onComponentsChange={(comps) => setCustomComponents(comps)}
                hiddenDefaults={hiddenDefaults}
                onRestoreDefault={restoreDefaultComponent}
                onHideDefault={hideDefaultComponent}
                defaultOverrides={defaultOverrides}
                onOverrideDefault={handleOverrideDefault}
                defaultComponents={defaultComponents}
                startInSettings={startInSettings}
            />
        </>
    );
};

export default Sidebar;
