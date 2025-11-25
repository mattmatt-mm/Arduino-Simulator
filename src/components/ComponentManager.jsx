import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { COMPONENT_ICONS, getIcon } from '../constants/icons.jsx';

const ComponentManager = ({ isOpen, onClose, onComponentsChange, hiddenDefaults = [], onRestoreDefault, onHideDefault, defaultOverrides = {}, onOverrideDefault, defaultComponents = [], startInSettings }) => {
    const [components, setComponents] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [viewingComponent, setViewingComponent] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [uploadProgress, setUploadProgress] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'validating', 'saved', 'error'
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [componentToDelete, setComponentToDelete] = useState(null);
    const [isEditingIcon, setIsEditingIcon] = useState(false);
    const [editingIconData, setEditingIconData] = useState({ color: '', icon: '', label: '' });

    useEffect(() => {
        if (isOpen) {
            setShowSettings(!!startInSettings);
            // Reset to main list view when opening in standard mode
            // The 'viewComponentDetails' event will override this if triggered
            if (!startInSettings) {
                setViewingComponent(null);
                setIsAdding(false);
            }
        }
    }, [isOpen, startInSettings]);
    const [newComponent, setNewComponent] = useState({
        name: '',
        type: 'custom',
        pins: [],
        color: '#4B5563'
    });
    const [newPin, setNewPin] = useState({ id: '', label: '', position: 'bottom' });

    useEffect(() => {
        loadComponents();
        loadApiKey();

        // Listen for component detail view requests from sidebar
        // Listen for component detail view requests from sidebar
        const handleViewDetails = (event) => {
            const comp = event.detail;
            // If it's a built-in component, merge with overrides
            if (comp.type && defaultComponents.find(c => c.type === comp.type)) {
                const override = defaultOverrides[comp.type] || {};
                setViewingComponent({ ...comp, ...override });
            } else {
                setViewingComponent(comp);
            }
        };

        window.addEventListener('viewComponentDetails', handleViewDetails);

        return () => {
            window.removeEventListener('viewComponentDetails', handleViewDetails);
        };
    }, []);

    const loadApiKey = () => {
        const stored = localStorage.getItem('geminiApiKey');
        if (stored) {
            setApiKey(stored);
        }
    };

    const saveApiKey = async () => {
        const trimmedKey = apiKey.trim();
        if (!trimmedKey) {
            alert('Please enter an API key');
            return;
        }
        if (!trimmedKey.startsWith('AIza')) {
            alert('Invalid API key format. Gemini API keys should start with "AIza".\n\nGet your API key from: https://aistudio.google.com/app/apikey');
            return;
        }

        setSaveStatus('validating');

        const isValid = await geminiService.validateApiKey(trimmedKey);

        if (isValid) {
            localStorage.setItem('geminiApiKey', trimmedKey);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } else {
            setSaveStatus('error');
            alert('Failed to validate API key. Please check if the key is correct and active.');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    const loadComponents = () => {
        const stored = localStorage.getItem('customComponents');
        if (stored) {
            const parsed = JSON.parse(stored);
            setComponents(parsed);
            onComponentsChange?.(parsed);
        }
    };

    const saveComponents = (comps) => {
        localStorage.setItem('customComponents', JSON.stringify(comps));
        setComponents(comps);
        onComponentsChange?.(comps);
    };

    const handlePDFUpload = async (event) => {
        if (isUploading) return;
        const file = event.target.files?.[0];
        if (!file || file.type !== 'application/pdf') {
            alert('Please upload a PDF file');
            return;
        }

        setIsUploading(true);
        setUploadProgress('Reading PDF file...');

        try {
            const base64 = await fileToBase64(file);
            console.log('PDF converted to base64, size:', base64.length);

            setUploadProgress('Analyzing schematic with AI...');

            // Extract base64 data (remove prefix)
            const base64Data = base64.split(',')[1];

            const componentData = await geminiService.analyzeComponentFromPdf(base64Data);
            console.log('Parsed component data:', componentData);

            // Validate the data
            if (!componentData.name || !componentData.pins || componentData.pins.length === 0) {
                throw new Error('Invalid component data from AI - missing name or pins');
            }

            // Save the component
            const newComp = {
                ...componentData,
                id: Date.now().toString(),
                type: 'custom'
            };

            const updated = [...components, newComp];
            saveComponents(updated);

            setUploadProgress('Component added successfully!');
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress('');
            }, 2000);

        } catch (error) {
            console.error('PDF upload error:', error);
            alert(`Failed to process PDF: ${error.message}\n\nPlease check:\n1. Your API key is valid\n2. You have API quota remaining\n3. The PDF is readable`);
            setIsUploading(false);
            setUploadProgress('');
        }

        // Reset file input
        event.target.value = '';
    };

    const handleImageUpload = async (event) => {
        if (isUploading) return;
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        setIsUploading(true);
        setUploadProgress('Reading image file...');

        try {
            const base64 = await fileToBase64(file);
            console.log('Image converted to base64, size:', base64.length);

            setUploadProgress('Analyzing image with AI...');

            const base64Data = base64.split(',')[1];

            const componentData = await geminiService.analyzeComponentFromImage(base64Data, file.type);

            if (!componentData.name || !componentData.pins) {
                throw new Error('Invalid component data from AI');
            }

            const newComp = {
                ...componentData,
                id: Date.now().toString(),
                type: 'custom'
            };

            const updated = [...components, newComp];
            saveComponents(updated);

            setUploadProgress('Component added successfully!');
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress('');
            }, 2000);

        } catch (error) {
            console.error('Image upload error:', error);
            alert(`Failed to process image: ${error.message}`);
            setIsUploading(false);
            setUploadProgress('');
        }
        event.target.value = '';
    };

    const handleWebsiteLink = async (url) => {
        setIsUploading(true);
        setUploadProgress('Fetching and analyzing webpage...');

        try {
            const componentData = await geminiService.analyzeComponentFromUrl(url);
            console.log('Website Link - Parsed component data:', componentData);

            // Check if AI returned an error or no data
            if (componentData.name === "Error" || componentData.name === "No Data") {
                throw new Error('AI could not extract component pinout data from this webpage.');
            }

            // Validate the data
            if (!componentData.name || !componentData.pins || componentData.pins.length === 0) {
                throw new Error('Invalid component data from AI - missing name or pins');
            }

            // Save the component
            const newComp = {
                ...componentData,
                id: Date.now().toString(),
                type: 'custom'
            };

            const updated = [...components, newComp];
            saveComponents(updated);

            setUploadProgress('Component added successfully!');
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress('');
            }, 2000);

        } catch (error) {
            console.error('Website link error:', error);
            alert(`Failed to process URL: ${error.message}`);
            setIsUploading(false);
            setUploadProgress('');
        }
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleAddPin = () => {
        if (!newPin.id || !newPin.label) return;
        setNewComponent(prev => ({
            ...prev,
            pins: [...prev.pins, { ...newPin }]
        }));
        setNewPin({ id: '', label: '', position: 'bottom' });
    };

    const handleRemovePin = (index) => {
        setNewComponent(prev => ({
            ...prev,
            pins: prev.pins.filter((_, i) => i !== index)
        }));
    };

    const handleSaveComponent = () => {
        if (!newComponent.name) {
            alert('Please enter a component name');
            return;
        }

        // Check for duplicates
        const isDuplicate = components.some(c => c.name.toLowerCase() === newComponent.name.toLowerCase() && c.id !== newComponent.id);
        if (isDuplicate) {
            alert('A component with this name already exists. Please choose a different name.');
            return;
        }

        const componentToSave = {
            ...newComponent,
            id: newComponent.id || `custom_${Date.now()}`,
            icon: newComponent.icon || 'chip'
        };

        const updatedComponents = newComponent.id
            ? components.map(c => c.id === newComponent.id ? componentToSave : c)
            : [...components, componentToSave];

        saveComponents(updatedComponents);
        setIsAdding(false);
        setNewComponent({ name: '', type: 'custom', pins: [], color: '#4B5563', icon: 'chip' });
    };

    const handleDeleteComponent = (id) => {
        setComponentToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (componentToDelete) {
            const updated = components.filter(c => c.id !== componentToDelete);
            saveComponents(updated);
            setComponentToDelete(null);
            setShowDeleteConfirm(false);
        }
    };

    const cancelDelete = () => {
        setComponentToDelete(null);
        setShowDeleteConfirm(false);
    };

    const handleRenameComponent = (id, newName) => {
        const updated = components.map(c => c.id === id ? { ...c, name: newName } : c);
        saveComponents(updated);
    };

    const getDefaultComponentPins = (type) => {
        // Return pin data for default components
        const pinData = {
            arduinoUno: [
                { id: 'D0', label: 'D0', position: 'top' },
                { id: 'D1', label: 'D1', position: 'top' },
                { id: 'D2', label: 'D2', position: 'top' },
                { id: 'D3', label: 'D3', position: 'top' },
                { id: 'D4', label: 'D4', position: 'top' },
                { id: 'D5', label: 'D5', position: 'top' },
                { id: 'D6', label: 'D6', position: 'top' },
                { id: 'D7', label: 'D7', position: 'top' },
                { id: 'D8', label: 'D8', position: 'top' },
                { id: 'D9', label: 'D9', position: 'top' },
                { id: 'D10', label: 'D10', position: 'top' },
                { id: 'D11', label: 'D11', position: 'top' },
                { id: 'D12', label: 'D12', position: 'top' },
                { id: 'D13', label: 'D13', position: 'top' },
                { id: 'A0', label: 'A0', position: 'bottom' },
                { id: 'A1', label: 'A1', position: 'bottom' },
                { id: 'A2', label: 'A2', position: 'bottom' },
                { id: 'A3', label: 'A3', position: 'bottom' },
                { id: 'A4', label: 'A4', position: 'bottom' },
                { id: 'A5', label: 'A5', position: 'bottom' },
                { id: '5V', label: '5V', position: 'bottom' },
                { id: '3V3', label: '3V3', position: 'bottom' },
                { id: 'GND', label: 'GND', position: 'bottom' },
                { id: 'VIN', label: 'VIN', position: 'bottom' },
            ],
            arduinoNano: [
                { id: 'D2', label: 'D2', position: 'left' },
                { id: 'D3', label: 'D3', position: 'left' },
                { id: 'D4', label: 'D4', position: 'left' },
                { id: 'D5', label: 'D5', position: 'left' },
                { id: 'D6', label: 'D6', position: 'left' },
                { id: 'D7', label: 'D7', position: 'left' },
                { id: 'D8', label: 'D8', position: 'left' },
                { id: 'D9', label: 'D9', position: 'left' },
                { id: 'D10', label: 'D10', position: 'left' },
                { id: 'D11', label: 'D11', position: 'left' },
                { id: 'D12', label: 'D12', position: 'left' },
                { id: 'D13', label: 'D13', position: 'right' },
                { id: 'A0', label: 'A0', position: 'right' },
                { id: 'A1', label: 'A1', position: 'right' },
                { id: 'A2', label: 'A2', position: 'right' },
                { id: 'A3', label: 'A3', position: 'right' },
                { id: 'A4', label: 'A4', position: 'right' },
                { id: 'A5', label: 'A5', position: 'right' },
                { id: '5V', label: '5V', position: 'right' },
                { id: '3V3', label: '3V3', position: 'right' },
                { id: 'GND', label: 'GND', position: 'left' },
                { id: 'VIN', label: 'VIN', position: 'right' },
            ],
            esp32: [
                { id: 'D0', label: 'D0', position: 'right' },
                { id: 'D2', label: 'D2', position: 'right' },
                { id: 'D4', label: 'D4', position: 'right' },
                { id: 'D5', label: 'D5', position: 'right' },
                { id: 'D12', label: 'D12', position: 'left' },
                { id: 'D13', label: 'D13', position: 'left' },
                { id: 'D14', label: 'D14', position: 'left' },
                { id: 'D15', label: 'D15', position: 'right' },
                { id: 'D16', label: 'D16', position: 'right' },
                { id: 'D17', label: 'D17', position: 'right' },
                { id: 'D18', label: 'D18', position: 'right' },
                { id: 'D19', label: 'D19', position: 'right' },
                { id: 'D21', label: 'D21', position: 'right' },
                { id: 'D22', label: 'D22', position: 'right' },
                { id: 'D23', label: 'D23', position: 'right' },
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

    const handleSaveIconEdit = () => {
        if (!viewingComponent) return;

        const updates = {
            color: editingIconData.color,
            icon: editingIconData.icon,
            // Only update label/name if it's not empty
            ...(editingIconData.label ? { [viewingComponent.type === 'custom' ? 'name' : 'label']: editingIconData.label } : {})
        };

        if (viewingComponent.type === 'custom') {
            // Update custom component
            const updated = components.map(c => c.id === viewingComponent.id ? { ...c, ...updates } : c);
            saveComponents(updated);
            setViewingComponent({ ...viewingComponent, ...updates });
        } else {
            // Update built-in component override
            onOverrideDefault && onOverrideDefault(viewingComponent.type, updates);
            setViewingComponent({ ...viewingComponent, ...updates });
        }
        setIsEditingIcon(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[600px] max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {(!showSettings && (isAdding || viewingComponent)) && (
                            <button
                                onClick={() => {
                                    setShowSettings(false);
                                    setIsAdding(false);
                                    setViewingComponent(null);
                                }}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                title="Back"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {showSettings ? 'Settings' : viewingComponent ? viewingComponent.name || viewingComponent.label : isAdding ? 'Add Component' : 'Custom Components'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                    {showSettings ? (
                        /* Settings Panel */
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Gemini API Key
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    Get your free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="Enter your Gemini API key"
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                    <button
                                        onClick={() => saveApiKey()}
                                        disabled={saveStatus === 'validating' || saveStatus === 'saved'}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${saveStatus === 'saved'
                                            ? 'bg-green-600 hover:bg-green-700 text-white'
                                            : saveStatus === 'error'
                                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                            }`}
                                    >
                                        {saveStatus === 'validating' ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Checking...
                                            </>
                                        ) : saveStatus === 'saved' ? (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Saved
                                            </>
                                        ) : (
                                            'Save'
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">About AI Features</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    The AI-powered component analysis uses Google's Gemini API to automatically extract pin information from PDF datasheets and web pages. Your API key is stored locally in your browser and never sent to our servers.
                                </p>
                            </div>
                        </div>
                    ) : viewingComponent ? (
                        /* Component Detail View */
                        <div className="space-y-4">
                            {/* Component Info */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg relative">
                                <div
                                    className={`w-16 h-16 rounded-lg flex items-center justify-center text-white p-3 cursor-pointer hover:opacity-80 transition-opacity relative group ${viewingComponent.color?.startsWith('#') ? '' : (viewingComponent.color || (viewingComponent.type && defaultComponents.find(c => c.type === viewingComponent.type)?.color) || 'bg-gray-600')}`}
                                    style={viewingComponent.color?.startsWith('#') ? { backgroundColor: viewingComponent.color } : {}}
                                    onClick={() => {
                                        setEditingIconData({
                                            color: viewingComponent.color || '#4B5563',
                                            icon: viewingComponent.icon || 'chip',
                                            label: viewingComponent.label || viewingComponent.name || ''
                                        });
                                        setIsEditingIcon(true);
                                    }}
                                >
                                    {getIcon(viewingComponent.icon || (viewingComponent.type && defaultComponents.find(c => c.type === viewingComponent.type)?.icon) || 'chip')}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{viewingComponent.name || viewingComponent.label}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {viewingComponent.type === 'custom' ? 'Custom Component' : 'Built-in Component'}
                                    </p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 cursor-pointer hover:underline" onClick={() => setIsEditingIcon(true)}>
                                        Click icon to customize
                                    </p>
                                </div>

                                {/* Icon Editor Popover */}
                                {isEditingIcon && (
                                    <div className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10 w-72">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Customize Appearance</h4>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={editingIconData.color.startsWith('#') ? editingIconData.color : '#4B5563'}
                                                        onChange={(e) => setEditingIconData(prev => ({ ...prev, color: e.target.value }))}
                                                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editingIconData.color}
                                                        onChange={(e) => setEditingIconData(prev => ({ ...prev, color: e.target.value }))}
                                                        className="flex-1 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-transparent"
                                                        placeholder="#RRGGBB or bg-class"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Label / Abbreviation</label>
                                                <input
                                                    type="text"
                                                    value={editingIconData.label}
                                                    onChange={(e) => setEditingIconData(prev => ({ ...prev, label: e.target.value }))}
                                                    className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-transparent"
                                                    placeholder="Component Name"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Icon</label>
                                                <div className="grid grid-cols-5 gap-1 max-h-32 overflow-y-auto p-1">
                                                    <button
                                                        onClick={() => setEditingIconData(prev => ({ ...prev, icon: '' }))}
                                                        className={`w-8 h-8 p-1 rounded border flex items-center justify-center text-[10px] font-bold ${!editingIconData.icon ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                                                        title="No Icon (Use Text)"
                                                    >
                                                        TXT
                                                    </button>
                                                    {Object.keys(COMPONENT_ICONS).map(iconName => (
                                                        <button
                                                            key={iconName}
                                                            onClick={() => setEditingIconData(prev => ({ ...prev, icon: iconName }))}
                                                            className={`w-8 h-8 p-1 rounded border ${editingIconData.icon === iconName ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                                                            title={iconName}
                                                        >
                                                            {COMPONENT_ICONS[iconName]}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={handleSaveIconEdit}
                                                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setIsEditingIcon(false)}
                                                    className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Pin Table */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Pin Configuration</h4>
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-100 dark:bg-gray-800">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Pin ID</th>
                                                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Label</th>
                                                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Position</th>
                                                <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Type</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {viewingComponent.pins && viewingComponent.pins.length > 0 ? (
                                                viewingComponent.pins.map((pin, index) => {
                                                    // Determine pin type based on ID
                                                    let pinType = 'Signal';
                                                    if (pin.id.includes('GND')) pinType = 'Ground';
                                                    else if (pin.id.includes('VCC') || pin.id.includes('5V') || pin.id.includes('3V3') || pin.id.includes('VIN')) pinType = 'Power';
                                                    else if (pin.id.startsWith('A')) pinType = 'Analog';
                                                    else if (pin.id.startsWith('D')) pinType = 'Digital';
                                                    else if (pin.id.includes('TX') || pin.id.includes('RX')) pinType = 'Serial';
                                                    else if (pin.id.includes('SCL') || pin.id.includes('SDA')) pinType = 'I2C';

                                                    return (
                                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                            <td className="px-4 py-2 font-mono text-gray-900 dark:text-white">{pin.id}</td>
                                                            <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{pin.label}</td>
                                                            <td className="px-4 py-2">
                                                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                                    {pin.position || 'bottom'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <span className={`px-2 py-1 text-xs rounded-full ${pinType === 'Power' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                                                    pinType === 'Ground' ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                                                                        pinType === 'Analog' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                                                            pinType === 'Digital' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                                                                                pinType === 'Serial' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                                                                                    pinType === 'I2C' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' :
                                                                                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                                    }`}>
                                                                    {pinType}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                                                        No pin information available
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Pin Type Legend</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">Power</span>
                                        <span className="text-gray-600 dark:text-gray-400">VCC, 5V, 3V3, VIN</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Ground</span>
                                        <span className="text-gray-600 dark:text-gray-400">GND</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">Digital</span>
                                        <span className="text-gray-600 dark:text-gray-400">D0-D13</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Analog</span>
                                        <span className="text-gray-600 dark:text-gray-400">A0-A7</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : isUploading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-700 dark:text-gray-300 font-medium">{uploadProgress}</p>
                        </div>
                    ) : !isAdding ? (
                        <>
                            {/* Upload Options */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {/* PDF Upload */}
                                <label className="relative cursor-pointer group">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handlePDFUpload}
                                        className="hidden"
                                    />
                                    <div className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-4 text-center hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all h-full flex flex-col justify-center items-center">
                                        <svg className="w-8 h-8 mb-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300">PDF</p>
                                    </div>
                                </label>

                                {/* Image Upload */}
                                <label className="relative cursor-pointer group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <div className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-4 text-center hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all h-full flex flex-col justify-center items-center">
                                        <svg className="w-8 h-8 mb-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Image</p>
                                    </div>
                                </label>

                                {/* Website Link */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const url = prompt('Enter component datasheet URL:');
                                        if (url) handleWebsiteLink(url);
                                    }}
                                    className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-4 text-center hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all h-full flex flex-col justify-center items-center"
                                >
                                    <svg className="w-8 h-8 mb-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">URL</p>
                                </button>
                            </div>

                            {/* Manual Add Button */}
                            <button
                                onClick={() => setIsAdding(true)}
                                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium mb-4 flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Manually
                            </button>

                            {/* All Components List */}
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">All Components</h3>

                                {/* Default Components */}
                                <div className="mb-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Built-in Components</p>
                                    <div className="space-y-2">
                                        {defaultComponents.filter(comp => !hiddenDefaults.includes(comp.type)).map((comp) => {
                                            // Apply overrides
                                            const override = defaultOverrides[comp.type] || {};
                                            const displayComp = { ...comp, ...override };

                                            // Get pins for default components
                                            const componentPins = getDefaultComponentPins(comp.type);
                                            return (
                                                <div
                                                    key={comp.type}
                                                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                                                    onClick={() => setViewingComponent({ ...comp, pins: componentPins })}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white p-2 ${displayComp.color?.startsWith('#') ? '' : displayComp.color}`} style={displayComp.color?.startsWith('#') ? { backgroundColor: displayComp.color } : {}}>
                                                            {displayComp.icon ? getIcon(displayComp.icon) : <span className="text-xs font-bold">{(displayComp.label || displayComp.name).substring(0, 2).toUpperCase()}</span>}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-medium text-gray-900 dark:text-white">{displayComp.label || displayComp.name}</h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">{componentPins.length} pins</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onHideDefault && onHideDefault(comp.type);
                                                        }}
                                                        className="px-3 py-1 text-xs rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                                                    >
                                                        Hide
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Hidden Components */}
                                {hiddenDefaults.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Hidden Components</p>
                                        <div className="space-y-2 opacity-75">
                                            {defaultComponents.filter(comp => hiddenDefaults.includes(comp.type)).map((comp) => {
                                                const componentPins = getDefaultComponentPins(comp.type);
                                                return (
                                                    <div
                                                        key={comp.type}
                                                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between bg-gray-50 dark:bg-gray-800/50"
                                                    >
                                                        <div className="flex items-center gap-3 opacity-50">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white p-2 ${comp.color?.startsWith('#') ? '' : comp.color}`} style={comp.color?.startsWith('#') ? { backgroundColor: comp.color } : {}}>
                                                                {comp.icon ? getIcon(comp.icon) : <span className="text-xs font-bold">{(comp.label || comp.name).substring(0, 2).toUpperCase()}</span>}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-medium text-gray-900 dark:text-white">{comp.label || comp.name}</h3>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">{componentPins.length} pins</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => onRestoreDefault(comp.type)}
                                                            className="px-3 py-1 text-xs rounded transition-colors bg-green-600 hover:bg-green-700 text-white"
                                                        >
                                                            Show
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Custom Components */}
                                {components.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Custom Components</p>
                                        <div className="space-y-2">
                                            {components.map((comp, index) => (
                                                <div
                                                    key={comp.id}
                                                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
                                                    onClick={() => setViewingComponent(comp)}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white p-2 ${comp.color?.startsWith('#') ? '' : comp.color}`} style={comp.color?.startsWith('#') ? { backgroundColor: comp.color } : {}}>
                                                                {getIcon(comp.icon || 'chip')}
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={comp.name}
                                                                onChange={(e) => handleRenameComponent(comp.id, e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex-1 font-medium text-sm text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteComponent(comp.id);
                                                                }}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                                title="Delete"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 pl-[52px]">
                                                        {comp.pins.length} pins
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Component Name</label>
                                <input
                                    type="text"
                                    value={newComponent.name}
                                    onChange={(e) => setNewComponent(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="e.g., LCD Display"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                                <input
                                    type="color"
                                    value={newComponent.color}
                                    onChange={(e) => setNewComponent(prev => ({ ...prev, color: e.target.value }))}
                                    className="w-full h-10 rounded-lg cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                                <div className="flex gap-2 flex-wrap">
                                    {Object.keys(COMPONENT_ICONS).map((iconName) => (
                                        <button
                                            key={iconName}
                                            onClick={() => setNewComponent(prev => ({ ...prev, icon: iconName }))}
                                            className={`w-10 h-10 p-2 rounded-lg border transition-all ${newComponent.icon === iconName
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500'
                                                }`}
                                            title={iconName.charAt(0).toUpperCase() + iconName.slice(1)}
                                        >
                                            {COMPONENT_ICONS[iconName]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pins</label>
                                <div className="space-y-2 mb-3">
                                    {newComponent.pins.map((pin, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                                            <span className="text-sm flex-1">{pin.label} ({pin.id}) - {pin.position}</span>
                                            <button onClick={() => handleRemovePin(index)} className="text-red-600 hover:text-red-700">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newPin.id}
                                        onChange={(e) => setNewPin(prev => ({ ...prev, id: e.target.value }))}
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        placeholder="Pin ID"
                                    />
                                    <input
                                        type="text"
                                        value={newPin.label}
                                        onChange={(e) => setNewPin(prev => ({ ...prev, label: e.target.value }))}
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                        placeholder="Label"
                                    />
                                    <select
                                        value={newPin.position}
                                        onChange={(e) => setNewPin(prev => ({ ...prev, position: e.target.value }))}
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    >
                                        <option value="bottom">Bottom</option>
                                        <option value="top">Top</option>
                                        <option value="left">Left</option>
                                        <option value="right">Right</option>
                                    </select>
                                    <button
                                        onClick={handleAddPin}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setIsAdding(false);
                                        setNewComponent({ name: '', type: 'custom', pins: [], color: '#4B5563' });
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveComponent}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                >
                                    Save Component
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Delete Confirmation Modal */}
            {
                showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-full mx-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Component?</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Are you sure you want to delete this component? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={cancelDelete}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ComponentManager;
