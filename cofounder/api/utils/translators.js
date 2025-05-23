// Mock keymap data (representative for this backend translator)
// In a real scenario, this data would ideally be sourced from a shared JSON/config
// derived from the frontend's keymap.tsx or a common definition.
const mockKeymap = {
  meta: {
    'custom-code': { name: 'Custom Code', desc: 'Executes custom JavaScript code.', contentType: 'javascript' },
    'api-call': { name: 'API Call', desc: 'Makes an HTTP request to an API.', contentType: 'json' },
    'data-transform': { name: 'Data Transformation', desc: 'Transforms data using a defined script.', contentType: 'javascript' },
    'generic': { name: 'Generic Node', desc: 'A generic node.', contentType: 'text' },
    'user-input': { name: 'User Input', desc: 'Prompts for user input.', contentType: 'json' },
    'llm-prompt': { name: 'LLM Prompt', desc: 'Sends a prompt to an LLM.', contentType: 'text' },
  },
  types: { // Simplified mapping for content_type based on nodeType
    'custom-code': 'javascript',
    'api-call': 'json',
    'data-transform': 'javascript',
    'user-input': 'json',
    'llm-prompt': 'text',
    'service': 'yaml', // Example, if service nodes have YAML configs
    'database': 'sql', // Example
  }
};

/**
 * Translates parsed Mermaid diagram data (from parseMermaidDiagramWithMetadata)
 * to a React Flow compatible structure.
 *
 * @param {object} parsedMermaidData - The output from parseMermaidDiagramWithMetadata.
 *   Expected structure: {
 *     nodes: [ { id: 'A', label: 'User', metadata: { nodeType: 'user', role: 'admin' } }, ... ],
 *     edges: [ { source: 'A', target: 'B', type: 'arrow_point', label: '' }, ... ]
 *   }
 * @returns {object} An object containing arrays of React Flow nodes and edges.
 *   { nodes: reactFlowNodesArray, edges: reactFlowEdgesArray }
 *
 * @example
 * const parsedMermaid = {
 *   nodes: [
 *     { id: 'A', label: 'User Input', metadata: { nodeType: 'user-input', prompt: "Enter your name" } },
 *     { id: 'B', label: 'Process Data', metadata: { nodeType: 'custom-code', scriptId: "script123" } },
 *     { id: 'C', label: 'External API', metadata: { nodeType: 'api-call', url: "https://api.example.com/data", method: "POST" } }
 *   ],
 *   edges: [
 *     { source: 'A', target: 'B', type: 'arrow_point', label: 'Submit' },
 *     { source: 'B', target: 'C', type: 'arrow_point', label: 'Processed Data' }
 *   ]
 * };
 *
 * const reactFlowData = translateMermaidToReactFlow(parsedMermaid);
 * console.log(JSON.stringify(reactFlowData, null, 2));
 *
 * Expected React Flow output structure (simplified):
 * {
 *   "nodes": [
 *     {
 *       "id": "A",
 *       "type": "cofounder_node",
 *       "data": {
 *         "key": "A",
 *         "meta": {
 *           "name": "User Input",
 *           "type": "user-input",
 *           "desc": "Prompts for user input.", // or "Generated from Mermaid" if not in mockKeymap
 *           "content_type": "json"
 *         },
 *         "executionParams": { "nodeType": "user-input", "prompt": "Enter your name" }
 *       },
 *       "position": { "x": 0, "y": 100 }
 *     },
 *     {
 *       "id": "B",
 *       "type": "cofounder_node",
 *       "data": {
 *         "key": "B",
 *         "meta": {
 *           "name": "Process Data",
 *           "type": "custom-code",
 *           "desc": "Executes custom JavaScript code.",
 *           "content_type": "javascript"
 *         },
 *         "executionParams": { "nodeType": "custom-code", "scriptId": "script123" }
 *       },
 *       "position": { "x": 250, "y": 100 }
 *     },
 *     {
 *       "id": "C",
 *       "type": "cofounder_node",
 *       "data": {
 *         "key": "C",
 *         "meta": {
 *           "name": "External API",
 *           "type": "api-call",
 *           "desc": "Makes an HTTP request to an API.",
 *           "content_type": "json"
 *         },
 *         "executionParams": { "nodeType": "api-call", "url": "https://api.example.com/data", "method": "POST" }
 *       },
 *       "position": { "x": 500, "y": 100 }
 *     }
 *   ],
 *   "edges": [
 *     {
 *       "id": "e-A-B",
 *       "source": "A",
 *       "target": "B",
 *       "type": "floating",
 *       "animated": true,
 *       "style": { "stroke": "#999" },
 *       "markerEnd": { "type": "arrowclosed", "width": 30, "height": 30 }
 *     },
 *     {
 *       "id": "e-B-C",
 *       "source": "B",
 *       "target": "C",
 *       "type": "floating",
 *       "animated": true,
 *       "style": { "stroke": "#999" },
 *       "markerEnd": { "type": "arrowclosed", "width": 30, "height": 30 }
 *     }
 *   ]
 * }
 */
export function translateMermaidToReactFlow(parsedMermaidData) {
  if (!parsedMermaidData || !parsedMermaidData.nodes || !parsedMermaidData.edges) {
    console.error("Invalid parsedMermaidData input");
    return { nodes: [], edges: [] };
  }

  const reactFlowNodesArray = [];
  const reactFlowEdgesArray = [];

  // Implement Node Translation
  parsedMermaidData.nodes.forEach((mermaidNode, index) => {
    const nodeTypeFromMetadata = mermaidNode.metadata?.nodeType || 'generic';
    const keymapEntry = mockKeymap.meta[nodeTypeFromMetadata] || mockKeymap.meta['generic'];
    const contentType = mockKeymap.types[nodeTypeFromMetadata] || 'text';

    const reactFlowNode = {
      id: mermaidNode.id,
      type: 'cofounder_node', // Custom node type registered in flow.tsx
      data: {
        key: mermaidNode.id,
        meta: {
          name: mermaidNode.label, // Display text part
          type: nodeTypeFromMetadata,
          desc: keymapEntry.desc || "Generated from Mermaid",
          content_type: contentType,
        },
        executionParams: mermaidNode.metadata || {}, // Full metadata from Mermaid node
      },
      position: { x: index * 250, y: 100 }, // Simple horizontal positioning
    };
    reactFlowNodesArray.push(reactFlowNode);
  });

  // Implement Edge Translation
  parsedMermaidData.edges.forEach(mermaidEdge => {
    const reactFlowEdge = {
      id: `e-${mermaidEdge.source}-${mermaidEdge.target}`, // Generate a unique ID
      source: mermaidEdge.source,
      target: mermaidEdge.target,
      type: 'floating', // As used in flow.tsx
      animated: true,
      style: { stroke: '#999' },
      markerEnd: { type: 'arrowclosed', width: 30, height: 30 }, // Using string for MarkerType
    };
    reactFlowEdgesArray.push(reactFlowEdge);
  });

  return { nodes: reactFlowNodesArray, edges: reactFlowEdgesArray };
}

// Future: Potentially export other translator functions if this file expands.
// For now, default export or named export is fine.
// export default { translateMermaidToReactFlow }; // Alternative
