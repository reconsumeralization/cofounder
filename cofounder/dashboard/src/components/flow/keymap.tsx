export default {
	meta: {
		"pm.details": {
			type: "pm",
			name: "Details",
			desc: "User-submitted Project Details",
			"inputs": [
				{
					"name": "project_description",
					"label": "Project Description",
					"type": "textarea",
					"defaultValue": "Please describe your project in detail.",
					"placeholder": "Enter all relevant details about your project...",
					"rows": 5,
					"required": true
				},
				{
					"name": "llm_model",
					"label": "LLM Model (for generation assistance, if applicable)",
					"type": "text",
					"defaultValue": "gpt-4o-mini",
					"placeholder": "e.g., gpt-4o-mini, gpt-4"
				},
				{
					"name": "llm_messages",
					"label": "LLM Messages (JSON string, for advanced use)",
					"type": "json",
					"defaultValue": "[{\"role\": \"user\", \"content\": \"Provide a summary of the project description.\"}]",
					"rows": 3,
					"placeholder": "Enter messages in JSON format"
				},
				{
					"name": "max_tokens",
					"label": "Max Tokens (for LLM)",
					"type": "number",
					"defaultValue": 256,
					"placeholder": "e.g., 256"
				},
				{
					"name": "use_streaming",
					"label": "Use Streaming (for LLM)",
					"type": "boolean",
					"defaultValue": true
				},
				{
					"name": "project_priority",
					"label": "Project Priority",
					"type": "select",
					"defaultValue": "medium",
					"options": [
						{ "value": "low", "label": "Low" },
						{ "value": "medium", "label": "Medium" },
						{ "value": "high", "label": "High" }
					],
					"required": false
				}
			]
		},

		"pm.prd": {
			type: "pm",
			name: "PRD",
			desc: "Product Requirements Document",
			"inputs": [
				{
					"name": "prd_content",
					"label": "Product Requirements",
					"type": "textarea",
					"defaultValue": "# Product Requirements Document\n\n## 1. Introduction\n\n## 2. Goals\n\n## 3. Target Audience\n\n## 4. Features\n",
					"rows": 10,
					"placeholder": "Define the product requirements...",
					"required": true
				}
			]
		},
		"pm.frd": { type: "pm", name: "FRD", desc: "Features Requirements Document" },
		"pm.drd": { type: "pm", name: "DRD", desc: "Database Requirements Document" },
		"pm.brd": { type: "pm", name: "BRD", desc: "Backend Requirements Document" },
		"pm.uxsmd": { type: "pm", name: "UXSMD", desc: "UX Sitemap Document" },
		"pm.uxdmd": { type: "pm", name: "UXDMD", desc: "UX Datamap Document" },

		"db.schemas": {
			type: "db",
			name: "DB/schemas",
			desc: "Database Tables Schemas",
			"inputs": [
				{
					"name": "schema_yaml",
					"label": "Database Schemas (YAML format)",
					"type": "textarea",
					"defaultValue": "tables:\n  - name: users\n    columns:\n      - name: id\n        type: integer\n        primary_key: true\n      - name: username\n        type: varchar(255)\n        unique: true\n      - name: email\n        type: varchar(255)\n        unique: true\n      - name: created_at\n        type: timestamp\n        default: current_timestamp",
					"rows": 10,
					"placeholder": "Define your table schemas in YAML...",
					"required": true
				}
			]
		},
		"db.postgres": {
			type: "db",
			name: "DB/postgres",
			desc: "Database Postgresql Commands",
		},

		"backend.specifications.openapi": {
			type: "backend",
			name: "backend/define:openapi",
			desc: "Backend Definition : openAPI",
		},
		"backend.specifications.asyncapi": {
			type: "backend",
			name: "backend/define:asyncapi",
			desc: "Backend Definition : asyncAPI",
		},

		"backend.server.main": {
			type: "backend",
			name: "backend/server:main",
			desc: "Backend Server : Main",
		},

		"uxsitemap.structure": {
			type: "ux",
			name: "ux/sitemap:structure",
			desc: "UX Sitemap",
		},
		"uxdatamap.structure": {
			type: "ux",
			name: "ux/datamap:structure",
			desc: "UX Datamap Structure",
		},
		"uxdatamap.views": {
			type: "ux",
			name: "ux/datamap:views",
			desc: "UX Datamap Views",
		},

		"webapp.react.root": {
			type: "webapp-structure",
			name: "webapp/react:root",
			desc: "Webapp App Root Component",
		},
		"webapp.react.store": {
			type: "webapp-structure",
			name: "webapp/react:store",
			desc: "Webapp Data Store",
		},
		"webapp.react.views": {
			type: "webapp-view",
			name: "webapp/react:views",
			desc: "Webapp View",
		},
		"settings.config.package": {
			type: "ux",
			name: "settings/config:package",
			desc: "Dependencies & .env for package.json",
		},
		"settings.preferences.versions": {
			type: "ux",
			name: "settings/preferences:versions",
			desc: "Components versions preferences",
		},
	},
	types: {
		"pm.details": "yaml", // is kinda ignored , hardcoded fix in "@/components/flow/nodes/cofounder-node"
		pm: "markdown",
		db: "yaml",
		backend: "complex",
		uxsitemap: "yaml",
		uxdatamap: "yaml",
		"webapp-structure": "complex",
		"webapp-view": "complex",
		settings: "yaml",
	},
};
