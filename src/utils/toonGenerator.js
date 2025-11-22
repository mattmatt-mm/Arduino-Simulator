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
    let output = "# NODES\n";
    output += "id, type, label\n";

    nodes.forEach(node => {
        // Clean up label if needed
        const label = node.data.label || node.type;
        output += `${node.id}, ${node.type}, ${label}\n`;
    });

    output += "\n# CONNECTIONS\n";
    output += "source, source_pin, target, target_pin\n";

    edges.forEach(edge => {
        output += `${edge.source}, ${edge.sourceHandle}, ${edge.target}, ${edge.targetHandle}\n`;
    });

    return output;
};
