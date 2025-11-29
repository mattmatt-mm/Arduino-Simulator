/**
 * Generates a TOON (Token-Oriented Object Notation) string from nodes and edges.
 * TOON is designed to be token-efficient for LLMs.
 * 
 * Format:
 * # NODES
 * id, type, label
 * ...
 * 
 * # CONNECTIONS
 * source_node, source_pin, target_node, target_pin
 * ...
 */
export const generateTOON = (nodes, edges) => {
    const data = {
        nodes: nodes.map(node => ({
            id: node.id,
            type: node.type,
            label: node.data.label || node.type
        })),
        connections: edges.map(edge => ({
            source: edge.source,
            sourcePin: edge.sourceHandle,
            target: edge.target,
            targetPin: edge.targetHandle
        }))
    };

    return JSON.stringify(data, null, 2);
};
