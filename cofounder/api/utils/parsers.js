import yaml from "yaml";
import mermaid from "mermaid";

async function extractBackticks({ text }) {
	try {
		const lines = text.split("\n");
		const firstLineWithBackticksIndex = lines.findIndex((line) =>
			line.includes("```"),
		);
		const lastBackticksIndex =
			lines.length -
			1 -
			lines
				.slice()
				.reverse()
				.findIndex((line) => line.includes("```"));
		if (
			firstLineWithBackticksIndex === -1 ||
			lastBackticksIndex === -1 ||
			lastBackticksIndex <= firstLineWithBackticksIndex
		) {
			throw new Error("> invalid : no backticks found");
		}
		const extractedContent = lines
			.slice(firstLineWithBackticksIndex + 1, lastBackticksIndex)
			.join("\n")
			.trim();
		return { text: extractedContent };
	} catch (error) {
		console.error("utils/parsers:extractAndParse:error", error);
		return null;
	}
}
async function extractBackticksMultiple({ text, delimiters }) {
	try {
		let found = {};
		let cursor = 0;
		const lines = text.split("\n");
		for (let delim of delimiters) {
			const firstLine = lines
				.slice(cursor)
				.findIndex((line) => line.includes(`\`\`\`${delim}`));
			const textFromFirstLine = lines.slice(cursor).slice(firstLine);
			const lastLine = textFromFirstLine
				.slice(1)
				.findIndex((line) => line.includes("```"));
			// console.dir({ __debug__utils_parsers_backticksmultiple: `\`\`\`${delim}`, textFromFirstLine, lastLine })
			found[delim] = textFromFirstLine.slice(1, lastLine + 1).join(`\n`);
			cursor = lastLine - 1;
		}
		return found;
	} catch (error) {
		console.error("utils/parsers:extractAndParse:error", error);
		return null;
	}
}

async function parseYaml({ generated, query }) {
	const { text } = generated;
	return yaml.parse(text);
}

async function editGenUi({ tsx }) {
	// replace with p0 frontend editing blocks
	// (handles iterating on components in live view , and functionalities like screenshot passed into api etc ...)
	const genUi = {
		sections: false,
		views: false,
	};
	let newTsx = tsx
		.split(`\n`)
		.filter((line) => {
			if (line.includes(`@/components/sections/`)) {
				if (!genUi.sections) genUi.sections = [];
				const sectionId = line.split(` `)[1];
				genUi.sections = [...new Set([...genUi.sections, sectionId])];
				return false;
			}
			if (line.includes(`@/components/views/`)) {
				if (!genUi.views) genUi.views = [];
				const viewId = line.split(` `)[1];
				genUi.views = [...new Set([...genUi.views, viewId])];
				return false;
			}
			return true;
		})
		.join(`\n`);
	if (genUi.sections) {
		newTsx = `import GenUiSection from '@/p0/genui/GenUiSection';\n${newTsx}`;
		for (let sectionId of genUi.sections) {
			newTsx = newTsx.replaceAll(
				`<${sectionId}`,
				`<GenUiSection id="${sectionId}"`,
			);
		}
	}
	if (genUi.views) {
		newTsx = `import GenUiView from '@/p0/genui/GenUiView';\n${newTsx}`;
		for (let viewId of genUi.views) {
			newTsx = newTsx.replaceAll(`<${viewId}`, `<GenUiView id="${viewId}"`);
		}
	}
	return { tsx, ids: genUi };
}

async function extractCodeDecorators({ code }) {
	// swarm decorators from generated code to trigger swarm functions
	const { pre, post } = { pre: 5, post: 15 };
	const decorators = [];
	const lines = code.split("\n");

	lines.forEach((line, index) => {
		const decoratorMatch = line.match(/@need:([^:]+):(.+)/);
		if (decoratorMatch) {
			const type = decoratorMatch[1].trim();
			const description = decoratorMatch[2].trim();

			// Extract snippet with padding
			const startLine = Math.max(0, index - pre);
			const endLine = Math.min(lines.length, index + post + 1);
			const snippet =
				"{/*...*/}\n" + lines.slice(startLine, endLine).join("\n") + "\n{/*...*/}";

			decorators.push({
				type,
				description,
				snippet,
			});
		}
	});

	return decorators;
}
export default {
	extract: {
		backticks: extractBackticks,
		backticksMultiple: extractBackticksMultiple,
		decorators: extractCodeDecorators,
	},
	parse: {
		yaml: parseYaml,
		mermaid: parseMermaidDiagramWithMetadata,
	},
	edit: {
		genUi: editGenUi,
	},
};

/**
 * Parses a Mermaid diagram string with embedded metadata.
 *
 * @param {string} mermaidString The Mermaid diagram string.
 * @returns {Promise<object|null>} A structured object representing the diagram,
 * including nodes with parsed metadata and edges, or null if parsing fails.
 *
 * @example
 * const mermaidExample = `
 * graph TD
 *   A[User --- { "nodeType": "user", "role": "admin" }] --> B(Service X --- { "serviceId": "SVC001", "version": "1.2" });
 *   A --> C(Service Y --- { "serviceId": "SVC002", "environment": "production" });
 *   B --> D{End Point --- { "nodeType": "endpoint", "protocol": "HTTPS" }};
 *   C --> D;
 * `;
 *
 * // Assuming 'parsers' is the imported module from this file
 * parsers.parse.mermaid(mermaidExample)
 *   .then(diagram => {
 *     if (diagram) {
 *       console.log("Nodes:", diagram.nodes);
 *       console.log("Edges:", diagram.edges);
 *     }
 *   });
 *
 * Expected output structure (simplified):
 * {
 *   nodes: [
 *     { id: 'A', label: 'User', metadata: { nodeType: 'user', role: 'admin' } },
 *     { id: 'B', label: 'Service X', metadata: { serviceId: 'SVC001', version: '1.2' } },
 *     { id: 'C', label: 'Service Y', metadata: { serviceId: 'SVC002', environment: 'production' } },
 *     { id: 'D', label: 'End Point', metadata: { nodeType: 'endpoint', protocol: 'HTTPS' } }
 *   ],
 *   edges: [
 *     { source: 'A', target: 'B', type: 'arrow_point', label: '' },
 *     { source: 'A', target: 'C', type: 'arrow_point', label: '' },
 *     { source: 'B', target: 'D', type: 'arrow_point', label: '' },
 *     { source: 'C', target: 'D', type: 'arrow_point', label: '' }
 *   ]
 * }
 */
async function parseMermaidDiagramWithMetadata(mermaidString) {
	if (!mermaidString) return null;

	try {
		// mermaid.initialize({ startOnLoad: false }); // Might be needed for some environments or older versions

		const { db } = await mermaid.parse(mermaidString);
		
		const nodes = [];
		const edges = [];

		// The way to access vertices/nodes and edges can vary based on mermaid version and diagram type.
		// db.getVertices() and db.getEdges() are common for flowcharts/graphs.
		// Other diagram types might use db.getActors(), db.getMessages(), etc.
		// This implementation assumes a graph-like structure (e.g., flowchart).
		const vertices = db.getVertices ? db.getVertices() : (db.getNodes ? db.getNodes() : []);
		const diagramEdges = db.getEdges ? db.getEdges() : (db.getLinks ? db.getLinks() : []);
		
		// Process nodes
        // In some versions, getVertices() returns an object where keys are node IDs
        if (typeof vertices === 'object' && !Array.isArray(vertices)) {
            for (const id in vertices) {
                const vertex = vertices[id];
                let label = vertex.text || vertex.descr || id; // Fallback to ID if text/descr is not available
                let metadata = {};

                const separatorIndex = label.indexOf("---");
                if (separatorIndex !== -1) {
                    const metadataString = label.substring(separatorIndex + 3).trim();
                    label = label.substring(0, separatorIndex).trim();
                    if (metadataString) {
                        // Using the existing parseYaml structure
                        metadata = yaml.parse(metadataString) || {};
                    }
                }
                nodes.push({ id: vertex.id || id, label, metadata });
            }
        } else if (Array.isArray(vertices)) { // Or if it's an array directly
             vertices.forEach(vertex => {
                let label = vertex.text || vertex.descr || vertex.id;
                let metadata = {};
                const separatorIndex = label.indexOf("---");
                if (separatorIndex !== -1) {
                    const metadataString = label.substring(separatorIndex + 3).trim();
                    label = label.substring(0, separatorIndex).trim();
                    if (metadataString) {
                         metadata = yaml.parse(metadataString) || {};
                    }
                }
                nodes.push({ id: vertex.id, label, metadata });
            });
        }


		// Process edges
		diagramEdges.forEach(edge => {
			edges.push({
				source: edge.start || edge.source, // Property names can vary
				target: edge.end || edge.target,
				type: edge.type,
				label: edge.text || edge.label || '' // text or label for edge text
			});
		});

		return { nodes, edges };
	} catch (e) {
		console.error("Error parsing Mermaid diagram:", e.message);
		if (e instanceof TypeError && e.message.includes("mermaid.parse is not a function")) {
            console.error("mermaid.parse is not a function. Ensure Mermaid is correctly initialized for Node.js or the version being used supports this API directly. You might need to call mermaid.initialize({ startOnLoad: false, theme: 'neutral' }) or similar first, or ensure you're using a version that supports server-side parsing if in Node.js.");
        } else if (e.message && (e.message.toLowerCase().includes("invalid input") || e.message.toLowerCase().includes("syntax error"))) {
             console.error("Invalid Mermaid syntax provided:", mermaidString.substring(0, 100) + "..."); // Log first 100 chars
        }
		return null;
	}
}
