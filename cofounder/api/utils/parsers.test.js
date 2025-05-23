import assert from 'assert';
// Assuming the parsers.js file is in the same directory for simplicity in this example.
// Adjust the path if it's different, e.g., './parsers.js' or '../utils/parsers.js'
// The actual path to use will be './parsers.js' since the test file is in the same directory.
// However, the original file is in ./utils/parsers.js, and this test file is also in ./utils/
// So, the import should be from './parsers.js'
// The functions are exported as `export default { parse: { mermaid: parseMermaidDiagramWithMetadata }}`
// So we need to import the default and then access the function.
import parsers from './parsers.js';

const { parseMermaidDiagramWithMetadata } = parsers.parse;

export async function testValidDiagramWithMetadata() {
  console.log('Running testValidDiagramWithMetadata...');
  const mermaidString = `
graph TD
  A[User --- { "nodeType": "user", "role": "admin", "id": 123 }] --> B(Service X --- { "serviceId": "SVC001", "version": "1.2" });
  B --> C{DB --- { "type": "Postgres", "replicaCount": 3 }};
`;
  const result = await parseMermaidDiagramWithMetadata(mermaidString);

  assert.ok(result, 'Result should not be null for a valid diagram.');
  assert.strictEqual(result.nodes.length, 3, 'Should parse 3 nodes.');
  assert.strictEqual(result.edges.length, 2, 'Should parse 2 edges.');

  const nodeA = result.nodes.find(n => n.id === 'A');
  assert.ok(nodeA, 'Node A should exist.');
  assert.strictEqual(nodeA.label, 'User', 'Node A label is incorrect.');
  assert.deepStrictEqual(nodeA.metadata, { nodeType: 'user', role: 'admin', id: 123 }, 'Node A metadata is incorrect.');

  const nodeB = result.nodes.find(n => n.id === 'B');
  assert.ok(nodeB, 'Node B should exist.');
  assert.strictEqual(nodeB.label, 'Service X', 'Node B label is incorrect.');
  assert.deepStrictEqual(nodeB.metadata, { serviceId: 'SVC001', version: '1.2' }, 'Node B metadata is incorrect.');
  
  const nodeC = result.nodes.find(n => n.id === 'C');
  assert.ok(nodeC, 'Node C should exist.');
  assert.strictEqual(nodeC.label, 'DB', 'Node C label is incorrect.');
  assert.deepStrictEqual(nodeC.metadata, { type: 'Postgres', replicaCount: 3 }, 'Node C metadata is incorrect.');

  const edgeAB = result.edges.find(e => e.source === 'A' && e.target === 'B');
  assert.ok(edgeAB, 'Edge A->B should exist.');
  console.log('testValidDiagramWithMetadata PASSED');
}

export async function testDiagramWithNoMetadata() {
  console.log('Running testDiagramWithNoMetadata...');
  const mermaidString = `
graph LR
  X[Node X] --> Y(Node Y);
  Y --> Z((Node Z));
`;
  const result = await parseMermaidDiagramWithMetadata(mermaidString);

  assert.ok(result, 'Result should not be null.');
  assert.strictEqual(result.nodes.length, 3, 'Should parse 3 nodes.');
  assert.strictEqual(result.edges.length, 2, 'Should parse 2 edges.');

  const nodeX = result.nodes.find(n => n.id === 'X');
  assert.ok(nodeX, 'Node X should exist.');
  assert.strictEqual(nodeX.label, 'Node X', 'Node X label is incorrect.');
  assert.deepStrictEqual(nodeX.metadata, {}, 'Node X metadata should be empty.');

  const nodeY = result.nodes.find(n => n.id === 'Y');
  assert.ok(nodeY, 'Node Y should exist.');
  assert.strictEqual(nodeY.label, 'Node Y', 'Node Y label is incorrect.');
  assert.deepStrictEqual(nodeY.metadata, {}, 'Node Y metadata should be empty.');
  
  const nodeZ = result.nodes.find(n => n.id === 'Z');
  assert.ok(nodeZ, 'Node Z should exist.');
  assert.strictEqual(nodeZ.label, 'Node Z', 'Node Z label is incorrect.');
  assert.deepStrictEqual(nodeZ.metadata, {}, 'Node Z metadata should be empty.');
  console.log('testDiagramWithNoMetadata PASSED');
}

export async function testDiagramWithMalformedMetadata() {
  console.log('Running testDiagramWithMalformedMetadata...');
  const mermaidString = `
graph TD
  A[Node A --- { "key": "value", malformedYaml: 'missing quote }] --> B(Node B);
`;
  // The current parser implementation uses js-yaml which might throw or return null.
  // Based on the implementation in parsers.js: `metadata = yaml.parse(metadataString) || {};`
  // It should result in empty metadata if parsing fails.
  const result = await parseMermaidDiagramWithMetadata(mermaidString);
  
  assert.ok(result, 'Result should not be null even with malformed metadata.');
  const nodeA = result.nodes.find(n => n.id === 'A');
  assert.ok(nodeA, 'Node A should exist.');
  assert.strictEqual(nodeA.label, 'Node A', 'Node A label should be parsed.');
  assert.deepStrictEqual(nodeA.metadata, {}, 'Metadata should be empty for malformed YAML.');
  console.log('testDiagramWithMalformedMetadata PASSED');
}

export async function testInvalidMermaidSyntax() {
  console.log('Running testInvalidMermaidSyntax...');
  const mermaidString = `graph TD A - B -> C`; // Invalid syntax
  try {
    const result = await parseMermaidDiagramWithMetadata(mermaidString);
    // Depending on mermaid.parse's strictness and error handling, it might throw or return null/error structure.
    // The current implementation of parseMermaidDiagramWithMetadata catches errors and returns null.
    assert.strictEqual(result, null, 'Result should be null for invalid Mermaid syntax.');
  } catch (error) {
    // If it were to throw, this block would catch it.
    // For now, we expect null as per the function's try/catch.
    assert.fail('Should not throw an error, but return null based on current implementation.');
  }
  console.log('testInvalidMermaidSyntax PASSED');
}

export async function testEmptyDiagramString() {
  console.log('Running testEmptyDiagramString...');
  const result = await parseMermaidDiagramWithMetadata("");
  assert.strictEqual(result, null, "Result should be null for an empty string.");
  console.log('testEmptyDiagramString PASSED');
}

export async function testDiagramWithOnlyNodes() {
    console.log('Running testDiagramWithOnlyNodes...');
    const mermaidString = `
graph TD
    A[Node A --- { "data": "valueA" }]
    B(Node B)
    C((Node C --- { "data": "valueC" }))
    `;
    const result = await parseMermaidDiagramWithMetadata(mermaidString);
    assert.ok(result, 'Result should not be null.');
    assert.strictEqual(result.nodes.length, 3, 'Should parse 3 nodes.');
    assert.strictEqual(result.edges.length, 0, 'Should parse 0 edges.');

    const nodeA = result.nodes.find(n => n.id === 'A');
    assert.ok(nodeA, 'Node A should exist.');
    assert.strictEqual(nodeA.label, 'Node A', 'Node A label is incorrect.');
    assert.deepStrictEqual(nodeA.metadata, { data: 'valueA' }, 'Node A metadata is incorrect.');

    const nodeB = result.nodes.find(n => n.id === 'B');
    assert.ok(nodeB, 'Node B should exist.');
    assert.strictEqual(nodeB.label, 'Node B', 'Node B label is incorrect.');
    assert.deepStrictEqual(nodeB.metadata, {}, 'Node B metadata should be empty.');
    
    console.log('testDiagramWithOnlyNodes PASSED');
}


// Simple test runner
async function runTests() {
  const tests = [
    testValidDiagramWithMetadata,
    testDiagramWithNoMetadata,
    testDiagramWithMalformedMetadata,
    testInvalidMermaidSyntax,
    testEmptyDiagramString,
    testDiagramWithOnlyNodes,
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

// To run tests: node cofounder/api/utils/parsers.test.js
runTests();
