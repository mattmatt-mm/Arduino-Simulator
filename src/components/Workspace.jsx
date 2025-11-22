import React, { useCallback, useRef, useEffect, useState } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    ReactFlowProvider,
    useReactFlow,
    applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';

import ArduinoNanoNode from './nodes/ArduinoNanoNode';
import ArduinoUnoNode from './nodes/ArduinoUnoNode';
import ESP32Node from './nodes/ESP32Node';
import ServoMotorNode from './nodes/ServoMotorNode';
import StepperMotorNode from './nodes/StepperMotorNode';
import CustomComponentNode from './nodes/CustomComponentNode';
import WireToolbar from './WireToolbar';

import { generateTOON } from '../utils/toonGenerator';
import { generateArduinoCode } from '../utils/codeGenerator';
import { validateConnections } from '../utils/connectionValidator';

const nodeTypes = {
    arduinoNano: ArduinoNanoNode,
    arduinoUno: ArduinoUnoNode,
    esp32: ESP32Node,
    servoMotor: ServoMotorNode,
    stepperMotor: StepperMotorNode,
    customComponent: CustomComponentNode,
};

const initialNodes = [];
const initialEdges = [];

let id = 0;
const getId = () => `dndnode_${id++}`;

const WorkspaceContent = ({ onCodeChange, onTOONChange, onFeedbackChange }) => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
    const { screenToFlowPosition } = useReactFlow();
    const [contextMenu, setContextMenu] = useState(null);
    const [selectedNodeId, setSelectedNodeId] = useState(null);

    // State for wire selection
    const [selectedEdge, setSelectedEdge] = useState(null);

    // Trigger generation when nodes or edges change
    useEffect(() => {
        const toon = generateTOON(nodes, edges);
        const code = generateArduinoCode(nodes, edges);
        const feedback = validateConnections(nodes, edges);

        if (onTOONChange) onTOONChange(toon);
        if (onCodeChange) onCodeChange(code);
        if (onFeedbackChange) onFeedbackChange(feedback);
    }, [nodes, edges, onCodeChange, onTOONChange, onFeedbackChange]);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge({
            ...params,
            animated: false, // Realistic wires usually aren't animated dashed lines
            style: { stroke: '#555', strokeWidth: 2 }, // Default visible color
            type: 'default', // Bezier by default
        }, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // Check for custom component data
            const customDataStr = event.dataTransfer.getData('customComponentData');
            let nodeData = { label: `${type} node` };

            if (customDataStr) {
                try {
                    const customData = JSON.parse(customDataStr);
                    nodeData = { ...customData, label: customData.name };
                } catch (e) {
                    console.error('Failed to parse custom component data:', e);
                }
            }

            const newNode = {
                id: getId(),
                type,
                position,
                data: nodeData,
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes],
    );

    // Wire Management Handlers
    const onEdgeClick = useCallback((event, edge) => {
        event.stopPropagation();
        // Calculate position for toolbar (center of click or edge)
        // Using click event client coordinates converted to flow coordinates is tricky without the ref
        // Simpler: use the event client coordinates directly for fixed positioning or relative to wrapper
        // But WireToolbar expects absolute positioning.
        // Let's use the event clientX/Y relative to the viewport, but we need to offset for the canvas.
        // Actually, let's just use the click position relative to the screen and position fixed, 
        // OR relative to the flow pane.

        // Better approach: Use the event.clientX/Y and render toolbar in a Portal or just absolute on top.
        // We'll use absolute positioning relative to the wrapper.
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = {
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top
        };

        setSelectedEdge({ edge, position });
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedEdge(null);
        setContextMenu(null);
        setSelectedNodeId(null);
    }, []);

    const updateEdgeColor = (color) => {
        if (!selectedEdge) return;
        setEdges((eds) => eds.map((e) => {
            if (e.id === selectedEdge.edge.id) {
                return { ...e, style: { ...e.style, stroke: color } };
            }
            return e;
        }));
        // Keep selection open or close it? Let's keep it open to allow changing again
    };

    const deleteEdge = () => {
        if (!selectedEdge) return;
        setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.edge.id));
        setSelectedEdge(null);
    };

    const onNodeContextMenu = useCallback((event, node) => {
        event.preventDefault();
        setContextMenu({
            x: event.clientX,
            y: event.clientY,
        });
        setSelectedNodeId(node.id);
    }, []);

    const handleDeleteNode = useCallback(() => {
        if (selectedNodeId) {
            setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
            setEdges((eds) => eds.filter((edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId));
            setContextMenu(null);
            setSelectedNodeId(null);
        }
    }, [selectedNodeId, setNodes, setEdges]);

    return (
        <div className="h-full w-full bg-gray-50 dark:bg-gray-900 relative" ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChangeInternal}
                onEdgesChange={onEdgesChangeInternal}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                onNodeContextMenu={onNodeContextMenu}
                fitView
            >
                <Controls />
                <MiniMap />
                <Background variant="dots" gap={12} size={1} />
            </ReactFlow>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        zIndex: 1000,
                    }}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={handleDeleteNode}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Component
                    </button>
                </div>
            )}

            {selectedEdge && (
                <WireToolbar
                    position={selectedEdge.position}
                    onColorChange={updateEdgeColor}
                    onDelete={deleteEdge}
                />
            )}
        </div>
    );
};

const Workspace = (props) => (
    <ReactFlowProvider>
        <WorkspaceContent {...props} />
    </ReactFlowProvider>
);

export default Workspace;
