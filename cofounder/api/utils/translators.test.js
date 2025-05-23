import assert from 'assert';
// Adjust path as necessary. Assuming this test file is in cofounder/api/utils/
import { translateMermaidToReactFlow } from './translators.js';

// Helper to create mock parsed Mermaid data
function createMockParsedData(nodes, edges) {
  return { nodes, edges };
}

export async function testTranslationOfBasicNodeEdge() {
  console.log('Running testTranslationOfBasicNodeEdge...');
  const parsedMermaid = createMockParsedData(
    [
      { id: 'N1', label: 'First Node', metadata: { nodeType: 'custom-code', script: 'console.log("hello")' } }
    ],
    [
      { source: 'N1', target: 'N2', type: 'arrow_point', label: 'to N2' } 
      // N2 is not defined as a node here, but translator should still create the edge.
      // React Flow will render the edge but might not connect if N2 isn't in nodes array.
      // For this test, we primarily care about the edge structure itself.
    ]
  );

  const result = translateMermaidToReactFlow(parsedMermaid);

  assert.ok(result, 'Result should not be null.');
  assert.strictEqual(result.nodes.length, 1, 'Should translate 1 node.');
  assert.strictEqual(result.edges.length, 1, 'Should translate 1 edge.');

  // Test Node Structure
  const nodeN1 = result.nodes[0];
  assert.strictEqual(nodeN1.id, 'N1', 'Node ID is incorrect.');
  assert.strictEqual(nodeN1.type, 'cofounder_node', 'Node type is incorrect.');
  assert.strictEqual(nodeN1.data.key, 'N1', 'Node data.key is incorrect.');
  assert.strictEqual(nodeN1.data.meta.name, 'First Node', 'Node data.meta.name is incorrect.');
  assert.strictEqual(nodeN1.data.meta.type, 'custom-code', 'Node data.meta.type is incorrect.');
  // Description and content_type depend on the mockKeymap in translators.js
  assert.ok(nodeN1.data.meta.desc, 'Node data.meta.desc should exist.');
  assert.ok(nodeN1.data.meta.content_type, 'Node data.meta.content_type should exist.');
  assert.deepStrictEqual(nodeN1.data.executionParams, { nodeType: 'custom-code', script: 'console.log("hello")' }, 'Node data.executionParams are incorrect.');
  assert.deepStrictEqual(nodeN1.position, { x: 0, y: 100 }, 'Node position is incorrect for the first node.');

  // Test Edge Structure
  const edgeN1N2 = result.edges[0];
  assert.strictEqual(edgeN1N2.id, 'e-N1-N2', 'Edge ID is incorrect.');
  assert.strictEqual(edgeN1N2.source, 'N1', 'Edge source is incorrect.');
  assert.strictEqual(edgeN1N2.target, 'N2', 'Edge target is incorrect.');
  assert.strictEqual(edgeN1N2.type, 'floating', 'Edge type is incorrect.');
  assert.strictEqual(edgeN1N2.animated, true, 'Edge should be animated.');
  assert.deepStrictEqual(edgeN1N2.style, { stroke: '#999' }, 'Edge style is incorrect.');
  assert.deepStrictEqual(edgeN1N2.markerEnd, { type: 'arrowclosed', width: 30, height: 30 }, 'Edge markerEnd is incorrect.');
  console.log('testTranslationOfBasicNodeEdge PASSED');
}

export async function testTranslationWithMultipleNodesAndEdges() {
  console.log('Running testTranslationWithMultipleNodesAndEdges...');
  const parsedMermaid = createMockParsedData(
    [
      { id: 'Start', label: 'Start Event', metadata: { nodeType: 'event', eventType: 'trigger' } },
      { id: 'Task1', label: 'Process Data', metadata: { nodeType: 'api-call', url: '/data' } },
      { id: 'End', label: 'End Event', metadata: { nodeType: 'event', eventType: 'terminal' } }
    ],
    [
      { source: 'Start', target: 'Task1', type: 'arrow_point', label: '' },
      { source: 'Task1', target: 'End', type: 'arrow_point', label: 'done' }
    ]
  );
  const result = translateMermaidToReactFlow(parsedMermaid);

  assert.ok(result, 'Result should not be null.');
  assert.strictEqual(result.nodes.length, 3, 'Should translate 3 nodes.');
  assert.strictEqual(result.edges.length, 2, 'Should translate 2 edges.');

  // Check some properties of the second node for quick verification
  const nodeTask1 = result.nodes.find(n => n.id === 'Task1');
  assert.ok(nodeTask1, 'Node Task1 should exist.');
  assert.strictEqual(nodeTask1.data.meta.name, 'Process Data', 'Task1 name is incorrect.');
  assert.strictEqual(nodeTask1.data.meta.type, 'api-call', 'Task1 type is incorrect.');
  assert.deepStrictEqual(nodeTask1.data.executionParams, { nodeType: 'api-call', url: '/data' }, 'Task1 executionParams are incorrect.');
  
  const edgeTask1End = result.edges.find(e => e.source === 'Task1' && e.target === 'End');
  assert.ok(edgeTask1End, 'Edge Task1->End should exist.');
  assert.strictEqual(edgeTask1End.id, 'e-Task1-End', 'Edge Task1->End ID is incorrect.');
  console.log('testTranslationWithMultipleNodesAndEdges PASSED');
}

export async function testNodePositioning() {
  console.log('Running testNodePositioning...');
  const parsedMermaid = createMockParsedData(
    [
      { id: 'P1', label: 'Pos1', metadata: {} },
      { id: 'P2', label: 'Pos2', metadata: {} },
      { id: 'P3', label: 'Pos3', metadata: {} }
    ],
    []
  );
  const result = translateMermaidToReactFlow(parsedMermaid);

  assert.ok(result, 'Result should not be null.');
  assert.strictEqual(result.nodes.length, 3, 'Should have 3 nodes.');

  const pos1 = result.nodes[0].position;
  const pos2 = result.nodes[1].position;
  const pos3 = result.nodes[2].position;

  assert.deepStrictEqual(pos1, { x: 0, y: 100 }, 'Position of P1 is incorrect.');
  assert.deepStrictEqual(pos2, { x: 250, y: 100 }, 'Position of P2 is incorrect.'); // Based on index * 250
  assert.deepStrictEqual(pos3, { x: 500, y: 100 }, 'Position of P3 is incorrect.'); // Based on index * 250

  assert.notDeepStrictEqual(pos1, pos2, 'Positions of P1 and P2 should be different.');
  assert.notDeepStrictEqual(pos2, pos3, 'Positions of P2 and P3 should be different.');
  console.log('testNodePositioning PASSED');
}

export async function testEmptyInput() {
  console.log('Running testEmptyInput...');
  const result = translateMermaidToReactFlow(null);
  assert.deepStrictEqual(result, { nodes: [], edges: [] }, 'Should return empty arrays for null input.');

  const result2 = translateMermaidToReactFlow({ nodes: [], edges: [] });
  assert.deepStrictEqual(result2, { nodes: [], edges: [] }, 'Should return empty arrays for empty parsed data.');
  console.log('testEmptyInput PASSED');
}

export async function testMetadataContentTypeMapping() {
    console.log('Running testMetadataContentTypeMapping...');
    // Using nodeTypes defined in the mockKeymap in translators.js
    const parsedMermaid = createMockParsedData(
      [
        { id: 'JS', label: 'JS Code', metadata: { nodeType: 'custom-code' } },
        { id: 'API', label: 'API Call', metadata: { nodeType: 'api-call' } },
        { id: 'LLM', label: 'LLM', metadata: { nodeType: 'llm-prompt' } },
        { id: 'Unknown', label: 'Unknown Type', metadata: { nodeType: 'some-random-type' } }, // Should default
        { id: 'NoType', label: 'No Type Field', metadata: { } }, // Should default to 'generic' nodeType then 'text' contentType
      ],
      []
    );
    const result = translateMermaidToReactFlow(parsedMermaid);
    assert.strictEqual(result.nodes.length, 5);

    const nodeJS = result.nodes.find(n => n.id === 'JS');
    assert.strictEqual(nodeJS.data.meta.content_type, 'javascript', 'JS node content_type incorrect.');
    assert.strictEqual(nodeJS.data.meta.type, 'custom-code', 'JS node meta.type incorrect.');


    const nodeAPI = result.nodes.find(n => n.id === 'API');
    assert.strictEqual(nodeAPI.data.meta.content_type, 'json', 'API node content_type incorrect.');
    assert.strictEqual(nodeAPI.data.meta.type, 'api-call', 'API node meta.type incorrect.');


    const nodeLLM = result.nodes.find(n => n.id === 'LLM');
    assert.strictEqual(nodeLLM.data.meta.content_type, 'text', 'LLM node content_type incorrect.');
    assert.strictEqual(nodeLLM.data.meta.type, 'llm-prompt', 'LLM node meta.type incorrect.');

    const nodeUnknown = result.nodes.find(n => n.id === 'Unknown');
    assert.strictEqual(nodeUnknown.data.meta.content_type, 'text', 'Unknown node content_type should default to text.');
    assert.strictEqual(nodeUnknown.data.meta.type, 'some-random-type', 'Unknown node meta.type should be the provided type.');
    assert.strictEqual(nodeUnknown.data.meta.desc, 'Generated from Mermaid', 'Unknown node desc should be default.');


    const nodeNoType = result.nodes.find(n => n.id === 'NoType');
    assert.strictEqual(nodeNoType.data.meta.content_type, 'text', 'NoType node content_type should default to text (via generic).');
    assert.strictEqual(nodeNoType.data.meta.type, 'generic', 'NoType node meta.type should default to generic.');

    console.log('testMetadataContentTypeMapping PASSED');
}


// Simple test runner
async function runTests() {
  const tests = [
    testTranslationOfBasicNodeEdge,
    testTranslationWithMultipleNodesAndEdges,
    testNodePositioning,
    testEmptyInput,
    testMetadataContentTypeMapping,
  ];
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (error) {
      console.error(`${test.name} FAILED:`, error);
      failed++;
    }
  }

  console.log(`\n--- Test Summary ---`);
  console.log(`Total tests: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    // process.exit(1); // Indicate failure
  }
}

// To run tests: node cofounder/api/utils/translators.test.js
runTests();
