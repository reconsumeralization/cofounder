import { Server } from "socket.io";
import utils from "@/utils/index.js";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import yargs from "yargs";
import fs from "fs";
import yaml from "yaml";
import { hideBin } from "yargs/helpers";
import { merge } from "lodash-es";
import open, { openApp, apps } from "open";
import cofounder from "./build.js";
dotenv.config();

// -------------------------------------------------------------- HELPERS  ------------------------
function _slugify(text) {
	return text
		.toString()
		.toLowerCase()
		.replace(/\s+/g, "-") // Replace spaces with -
		.replace(/[^\w\-]+/g, "") // Remove all non-word chars
		.replace(/\-\-+/g, "-") // Replace multiple - with single -
		.replace(/^-+/, "") // Trim - from start
		.replace(/-+$/, ""); // Trim - from end
}
// ----------------------------------------------------------------------------------------------------

// -------------------------------------------------------------- ARGS CASE ------------------------
// init project from argv
// to be called like : npm run start -- -p "some-project-name" -d "app description"
const timestamp = Date.now();
const argv = yargs(hideBin(process.argv)).argv;
const new_project = {
	project:
		(!argv.p && !argv.project) ||
		!_slugify(argv.p || argv.project).length ||
		!_slugify(argv.p || argv.project).match(/[a-z0-9]/)
			? `project-${timestamp}`
			: _slugify(argv.p || argv.project),
	description: argv.description || argv.d || argv.desc || false,
	aesthetics: argv.aesthetics || argv.a || argv.aesthetic || false,
};
if (argv.file || argv.f) {
	new_project.description = fs.readFileSync(argv.file || argv.f, "utf-8");
}
async function create_new_project() {
	if (!new_project.description.length) {
		console.error(
			'Error: -d "project description" is required and cannot be empty.',
		);
		process.exit(1);
	}
	console.log(
		`\x1b[31minitialized generating app : ${new_project.project}\x1b[0m`,
	);
	console.log(
		`\x1b[34m(see ${process.env.EXPORT_APPS_ROOT}/${new_project.project}/README.md for more details)\x1b[0m` +
			`\n\x1b[38;5;37mto start app (api+frontend in parallel)` +
			`\n\t> cd ${process.env.EXPORT_APPS_ROOT}/${new_project.project}` +
			`\n\t> npm i && npm run dev\x1b[0m`,
	);

	const query = {
		pm: {
			details: {
				text: `${new_project.project != `project-${timestamp}` ? "Project '" + new_project.project + "' :" : ""} ${new_project.description}`,
				attachments: [],
				design: {
					aesthetics: {
						text: new_project.aesthetics,
					},
				},
			},
		},
	};
	console.dir({ query }, { depth: null });

	/*
	// debug : to resume ----------------------------------------------------------
	const data = await cofounder.system.run({
		id: "op:PROJECT::STATE:LOAD",
		context: {
			...context,
			project: new_project.project,
		},
		data: {},
	});
	await cofounder.system.run({
		id: `seq:project:init:v1:resume`,
		context: {
			...context,
			project: new_project.project,
		},
		data: merge(data, {
			...query,
			debug: {},
		}),
	});
	----------------------------------------------------------
	*/

	await cofounder.system.run({
		id: `seq:project:init:v1`,
		context: {
			...context,
			project: new_project.project,
		},
		data: query,
	});
}
// Call create_new_project if command args for init project are provided
if (new_project.project && new_project.description) {
	create_new_project();
}
// ----------------------------------------------------------------------------------------------------

// -------------------------------------------------------------- SERVER SETUP ------------------------
const app = express();
const PORT = process.env.PORT || 4200;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// convert the current module's URL to a file path - necessary in ES modules to get the equivalent of __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// serve static content from ./storage ; ie. for generated layout mockup images
app.use("/storage", express.static(path.join(__dirname, "db/storage")));
app.use(express.static(path.join(__dirname, "dist")));
app.use(/^\/(?!storage|api).*$/, express.static(path.join(__dirname, "dist")));

const server = app.listen(PORT, () => {
	console.log(
		"\x1b[33m\n> cofounder/api : server is running on port " + PORT + "\x1b[0m",
	);

	console.log(`> debug : open browser enabled : http://localhost:${PORT}/`);
	open(`http://localhost:${PORT}/`);
});

// -------------------------------------------------------- SERVER REST API PATHS ------------------------

app.get("/api/ping", (req, res) => {
	res.status(200).json({ message: "pong" });
});

app.get("/api/projects/list", (req, res) => {
	fs.readdir("./db/projects", (err, files) => {
		if (err) {
			return res.status(500).json({ error: "> cant read projects directory" });
		}
		const projects = files
			.filter((file) =>
				fs.statSync(path.join("./db/projects", file)).isDirectory(),
			)
			.map((projectDir) => {
				const yamlFilePath = path.join(
					"./db/projects",
					projectDir,
					"state/pm/user/details.yaml",
				);
				if (fs.existsSync(yamlFilePath)) {
					const fileContent = fs.readFileSync(yamlFilePath, "utf8");
					const parsedData = yaml.parse(fileContent);
					return { id: projectDir, data: parsedData.data || false };
				}
				return { id: projectDir, data: false };
			});
		res.status(200).json({ projects });
	});
});

app.post("/api/utils/transcribe", async (req, res) => {
	const uid = Math.random().toString(36).slice(2, 11); // Generate a random unique ID
	const tempFilePath = path.join(__dirname, "db/storage/temp", `${uid}.webm`);

	// Ensure the directory exists
	fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });

	try {
		if (!req.body || !req.body.audio) {
			throw new Error("No audio file uploaded");
		}

		const audioData = req.body.audio;
		const audioBuffer = Buffer.from(audioData.split(",")[1], "base64");

		// Write the audio buffer to the temporary path
		fs.writeFileSync(tempFilePath, audioBuffer);

		const { transcript } = await utils.openai.transcribe({ path: tempFilePath });
		res.status(200).json({ transcript });
	} catch (error) {
		console.error("Transcription error:", error);
		res.status(500).json({ error: "Failed to transcribe audio" });
	} finally {
		// Delete the temporary file
		fs.unlink(tempFilePath, (err) => {
			if (err) console.error("Error deleting temporary file:", err);
		});
	}
});

app.post("/api/projects/new", async (req, res) => {
	const request = req.body;
	/*
		request : {
			project? : "project-id" || {}
			description: "",
			aeshetics?: ""
		}
	*/
	if (!request.description?.length) {
		return res.status(500).json({ error: "> no project description provided" });
	}
	const timestamp = Date.now();
	const new_project_query = {
		project:
			!request.project?.length ||
			!_slugify(request.project).length ||
			!_slugify(request.project).match(/[a-z0-9]/)
				? `project-${timestamp}`
				: _slugify(request.project),
		description: request.description,
		aesthetics: request.aesthetics?.length ? request.aesthetics : false,
	};

	const query = {
		pm: {
			details: {
				text: `${new_project_query.project != `project-${timestamp}` ? "Project '" + new_project_query.project + "' :\n" : ""}${new_project_query.description}`,
				attachments: [],
				design: {
					aesthetics: {
						text: new_project_query.aesthetics,
					},
				},
				timestamp,
			},
		},
	};

	// call async
	cofounder.system.run({
		id: `seq:project:init:v1`,
		context: {
			...context, // {streams}
			project: new_project_query.project,
		},
		data: query,
	});

	res.status(200).json({ project: new_project_query.project });
});

app.post("/api/project/resume", async (req, res) => {
	const { project } = req.body;
	const resume_response = await resume_project({ project });
	console.dir({ "debug:server:project/resume": resume_response });
	setTimeout(async () => {
		await cofounder.system.run({
			id: `seq:project:init:v1`,
			context: {
				...context, // {streams}
				project,
				sequence: {
					resume: resume_response.resume,
				},
			},
			data: resume_response.data,
		});
	}, 2000);
	res.status(200).json({ project });
});

const actions = {
	// map action to function ; load means load project state before passing
	"update:settings:preferences:versions": {
		fn: _updateProjectPreferences,
		load: false,
	},
	"regenerate:ui": { fn: _regenerateUiComponent, load: true },
	"iterate:ui": { fn: _iterateUiComponent, load: true },
	/*
		later, single universal interface approach, 
		> should go through an analysis sequence ;
				ie. is is a new feature that needs db schemas & apis to be altered, or just at the layout level, etc
	*/
};
const actionsKeys = Object.keys(actions);
app.post("/api/project/actions", async (req, res) => {
	/*
		in : {
			project : `exampleproject`,
			query : {
				action : "example:action:whatever",
				data : {
				},
			},
		}
	*/
	console.dir(
		{ "cofounder:api:server:actions:debug": req.body },
		{ depth: null },
	);
	try {
		const { project, query } = req.body;
		const { action } = query;
		if (!actionsKeys.includes(action)) {
			throw new Error(`action ${action} not recognized`);
		}
		const { fn, load } = actions[action];
		const data = await fn({
			request: { project, query },
			data: !load
				? {}
				: await cofounder.system.run({
						id: "op:PROJECT::STATE:LOAD",
						context: {
							...context,
							project,
						},
						data: {},
					}),
		});
		res.status(200).json({ end: true });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "failed to process" });
	}
});
// ----------------------------------------------------------------------------------------------------

// -------------------------------------------------------------- SOCKET IO SETUP ------------------------
// socket.io instance attached to express
const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});
const subscriptions = {};
const projects = {};
// will be sent inside context{} for system nodes to stream to at various steps
const streams = {
	start: async ({ project, key, meta }) => {
		/*
			project , key , meta { name , desc }
		*/
		// console.dir({"debug:context:streams" : {subscriptions}} , {depth:null})
		if (subscriptions[project])
			io
				.to(subscriptions[project])
				.emit("stream$start", { timestamp: Date.now(), key, meta });
	},
	write: async ({ project, key, data }) => {
		if (subscriptions[project])
			io.to(subscriptions[project]).emit("stream$data", {
				key,
				data,
			});
	},
	end: async ({ project, key }) => {
		if (subscriptions[project])
			io
				.to(subscriptions[project])
				.emit("stream$end", { timestamp: Date.now(), key });
	},
	update: async ({ project, key, data }) => {
		if (!subscriptions[project]) return;
		// console.log('> debug:streams:update :', key)

		if (key.includes("webapp.")) {
			// reconstruct state
			let projectSubState = {};
			const keys = key.split(".");
			let newStateUpdate = projectSubState;
			keys.forEach((k, index) => {
				if (!newStateUpdate[k]) {
					newStateUpdate[k] = index === keys.length - 1 ? data : {};
				} else if (index === keys.length - 1) {
					newStateUpdate[k] = merge(newStateUpdate[k], data);
				}
				newStateUpdate = newStateUpdate[k];
			});
			const new_update_data = {};
			let mergedKey;
			Object.keys(projectSubState.webapp).map((_type) => {
				// _type : react || layout
				Object.keys(projectSubState.webapp[_type]).map((_category) => {
					// _category : root || store || views
					Object.keys(projectSubState.webapp[_type][_category]).map((_id) => {
						// _id : app || redux || GV_Whatever || ...
						mergedKey = `webapp.${_type}.${_category}.${_id}`;
						new_update_data[mergedKey] = {};
						Object.keys(projectSubState.webapp[_type][_category][_id]).map(
							(_version) => {
								// _version : latest || {timestamp}
								new_update_data[mergedKey][_version] =
									projectSubState.webapp[_type][_category][_id][_version];
							},
						);
					});
				});
			});
			key = mergedKey;
			data = new_update_data[mergedKey];
		}
		io.to(subscriptions[project]).emit("state$update", {
			key,
			data,
		});
	},
};
const context = { streams };

io.on("connection", async (socket) => {
	console.log("> user connected : ", socket.id);
	socket.on("subscribe", async (project) => {
		console.log(`> user ${socket.id} subscribed to project : ${project}`);
		if (!subscriptions[project]) {
			subscriptions[project] = [];
		}
		subscriptions[project].push(socket.id);
		try {
			await load_project({ project });
			io.to(subscriptions[project]).emit("state$load", {
				timestamp: Date.now(),
				state: projects[project],
			});
		} catch (e) {
			console.error("> cofounder/api : server error : ", e);
		}

		/*
			console.log("> ____debug : server : op:LLM::DEBUG : run");
			const inference_debug = await cofounder.system.run({
				id: "op:LLM::DEBUG:SIMULATE",
				context: {
					...context, // {streams}
					project,
					operation: {
						key: "pm.prd",
						meta: {
							name: "PRD",
							desc: "project requirements doc",
						},
					},
				},
				data: {}, // subscriptions[project]
			});
			const prd = inference_debug.generated;
			await cofounder.system.run({
				id: "op:PROJECT::STATE:UPDATE",
				context: {
					...context,
					project,
				},
				data: {
					operation: {
						id: "pm:prd",
					},
					type: `end`,
					content: {
						key: "pm.prd",
						data: prd,
					},
				},
			});
			const debug_webapp_data = yaml.parse(
				fs.readFileSync(
					`db/projects/foundermatchdevclone/state/webapp/code/react/views/GV_TopNav/versions/1726434529344.yaml`,
					"utf8",
				),
			);
			debug_webapp_data.data.tsx = `it be cool if this updated fr`;
			await cofounder.system.run({
				id: "op:PROJECT::STATE:UPDATE",
				context: {
					...context,
					project,
				},
				data: {
					operation: {
						id: `webapp:react:views`,
						refs: {
							id: "GV_TopNav",
							version: "1726434529344",
						},
					},
					type: `end`,
					content: {
						key: debug_webapp_data.key,
						data: debug_webapp_data.data,
					},
				},
			});
			console.log("> ____debug : server : op:LLM::DEBUG:2");
			const demo_messages = [
				{
					role: "system",
					content:
						"You are a helpful assistant that provides information about product requirements. in markdown format;",
				},
				{
					role: "user",
					content:
						"Can you help me outline the product requirements for our new project? It's a rizz helper",
				},
			];

			
			await cofounder.system.run({
				id: "op:LLM::GEN",
				context: {
					...context, // {streams}
					project,
					operation: {
						key: 'pm.prd',
						meta: {
							name: "PRD",
							desc: "product requirements document",
						},
					},
				},
				data: {
					model: `gpt-4o-mini`, //`gpt-4o`,
					messages: demo_messages,
					preparser: `backticks`,
					parser: false,
				},
			})
		*/
	});
	socket.on("disconnect", () => {
		console.log("> user disconnected : ", socket.id);
		for (const project in subscriptions) {
			subscriptions[project] = subscriptions[project].filter(
				(id) => id !== socket.id,
			);
		}
	});
});
const load_project = async ({ project }) => {
	console.log("> load_project : start : ", project);
	const fetchedProject = await utils.load.local({
		project,
		deconstructed: true,
	});
	const fetchedProjectState = fetchedProject.state;
	const _project = fetchedProject.keymap || {};
	let projectData = {};
	Object.keys(_project)
		.filter((key) => !key.startsWith("webapp."))
		.map((key) => {
			projectData[key] = _project[key];
		});
	if (fetchedProjectState.webapp) {
		Object.keys(fetchedProjectState.webapp).map((_type) => {
			// _type : react || layout
			Object.keys(fetchedProjectState.webapp[_type]).map((_category) => {
				// _category : root || store || views
				Object.keys(fetchedProjectState.webapp[_type][_category]).map((_id) => {
					// _id : app || redux || GV_Whatever || ...
					const mergedKey = `webapp.${_type}.${_category}.${_id}`;
					projectData[mergedKey] = {};
					Object.keys(fetchedProjectState.webapp[_type][_category][_id]).map(
						(_version) => {
							// _version : latest || {timestamp}
							projectData[mergedKey][_version] =
								fetchedProjectState.webapp[_type][_category][_id][_version];
						},
					);
				});
			});
		});
	}
	projects[project] = projectData;
	console.dir({
		load_project: project,
		data_keys: `${Object.keys(projects[project]).join(" , ")}`,
	});
	// only use in resume ; else check data stored in projects[project]
	return fetchedProjectState;
};

const seq_projectv1_dag = [
	// dumped from makeDag() in ./build
	[], // project setup , skip
	["pm.prd"],
	["pm.frd"],
	["pm.frd", "pm.uxsmd"],
	["db.schemas", "uxsitemap.structure"],
	["db.postgres"],
	["pm.brd"],
	["backend.specifications.openapi", "backend.specifications.asyncapi"],
	["backend.server.main"],
	["pm.uxdmd"],
	["uxdatamap.structure"],
	["uxdatamap.views"],
	["webapp.react.store.redux"],
	["webapp.react.root.app"],
	["webapp.react.app.views"], // views , latest
];

async function resume_project({ project }) {
	const project_data = await load_project({ project });
	const project_keys = Object.keys(projects[project]);
	let previous_phase_index = -1;
	for (let step of seq_projectv1_dag) {
		previous_phase_index++;
		if (step.length) {
			if (
				step.every((entry) => project_keys.some((key) => key.startsWith(entry)))
			) {
				continue;
			} else {
				break;
			}
		}
	}
	return {
		data: project_data,
		resume: previous_phase_index,
	};
}

// example of how to stream to client (needs 3 steps)
const stream_to_client = async ({ project, key, meta }) => {
	// if (!subscriptions[project]?.length) return;
	console.log(`> starting stream for project ${project}`);
	streams.start({ project, key, meta });
	const chunkSize = 20; // Define the size of each chunk
	let currentIndex = 0;
	const interval = setInterval(() => {
		const timestamp = Date.now();
		const data = texts[key].slice(currentIndex, currentIndex + chunkSize); // send chunk by chunk
		streams.write({ project, key, data });
		currentIndex += chunkSize; // Move to the next chunk
		if (currentIndex >= texts[key].length) {
			clearInterval(interval);
			streams.end({ project, key });
		}
	}, 100);
};
// ----------------------------------------------------------------------------------------------------

// Helper function to safely access nested properties from an object
function getValueFromPath(obj, path) {
  if (path === "" || typeof path === "undefined" || path === null) return obj; // Return the object itself if path is empty or undefined
  if (!obj) return null;

  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      console.warn(`getValueFromPath: Path [${path}] not found in object part [${part}]`, { object: obj } );
      return null;
    }
  }
  return current;
}

// Helper function for placeholder resolution
function resolvePlaceholders(parameters, projectData, workflowInputs) {
  console.log("resolvePlaceholders: Starting resolution with parameters:", JSON.stringify(parameters, null, 2));
  console.log("resolvePlaceholders: projectData keys:", Object.keys(projectData || {}));
  console.log("resolvePlaceholders: workflowInputs:", JSON.stringify(workflowInputs, null, 2));

  const resolvedParameters = {};

  for (const key in parameters) {
    if (Object.hasOwnProperty.call(parameters, key)) {
      const value = parameters[key];
      let resolvedValue = value;

      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const placeholder = value.substring(2, value.length - 2).trim(); // e.g., "workflow.input.X" or "data.node_id.path"
        console.log(`resolvePlaceholders: Found placeholder for key [${key}]: ${placeholder}`);

        if (placeholder.startsWith('workflow.input.')) {
          const workflowInputKey = placeholder.substring('workflow.input.'.length);
          if (workflowInputs && Object.hasOwnProperty.call(workflowInputs, workflowInputKey)) {
            resolvedValue = workflowInputs[workflowInputKey];
            console.log(`resolvePlaceholders: Resolved {{${placeholder}}} from workflowInputs to:`, resolvedValue);
          } else {
            resolvedValue = null;
            console.warn(`resolvePlaceholders: Workflow input key [${workflowInputKey}] not found in workflowInputs. Setting to null.`);
          }
        } else if (placeholder.startsWith('data.')) {
          const fullPath = placeholder.substring('data.'.length); // e.g., "node_id.path.to.value" or "node_id"
          const pathParts = fullPath.split('.');
          const nodeKey = pathParts.shift(); // First part is node_key
          const actualPathInNodeOutput = pathParts.join('.'); // Rest is the path within that node's data

          if (projectData && Object.hasOwnProperty.call(projectData, nodeKey)) {
            const nodeData = projectData[nodeKey];
            console.log(`resolvePlaceholders: Accessing projectData for nodeKey [${nodeKey}]. Path to resolve: [${actualPathInNodeOutput}]`);
            resolvedValue = getValueFromPath(nodeData, actualPathInNodeOutput);
            if (resolvedValue === null) {
                console.warn(`resolvePlaceholders: Path [${actualPathInNodeOutput}] for nodeKey [${nodeKey}] resolved to null.`);
            } else {
                console.log(`resolvePlaceholders: Resolved {{${placeholder}}} from projectData[${nodeKey}] to:`, JSON.stringify(resolvedValue, null, 2));
            }
          } else {
            resolvedValue = null;
            console.warn(`resolvePlaceholders: Node key [${nodeKey}] not found in projectData. Setting to null.`);
          }
        } else {
          console.warn(`resolvePlaceholders: Unrecognized placeholder format: {{${placeholder}}}. Keeping original.`);
          // Keep original value if format is not recognized but matches {{...}}
        }
      }
      resolvedParameters[key] = resolvedValue;
    }
  }
  console.log("resolvePlaceholders: Finished resolution. Resolved parameters:", JSON.stringify(resolvedParameters, null, 2));
  return resolvedParameters;
}

async function _executeNode({ request, data }) {
  try {
    const project_id = request.project;
    // Assuming request.query.data contains { node_key: "...", input_parameters: { ... } }
    const { node_key, input_parameters } = request.query.data;

    console.log("Executing _executeNode with:");
    console.dir({ project_id, node_key, input_parameters }, { depth: null });

    // Placeholder Resolution
    const resolved_parameters = resolvePlaceholders(input_parameters, data, {}); // Passing empty object for workflowInputs for now
    console.log("Resolved parameters:");
    console.dir({ resolved_parameters }, { depth: null });

    // --- Determine System Function ID ---
    if (!data || !data.keymap) {
      console.error("_executeNode: Error - data.keymap is missing. Cannot determine node metadata or operationId.");
      throw new Error("Project keymap is not loaded or missing, cannot execute node.");
    }
    // const keymap = data.keymap; // Not directly used for operationId in current strategy but good for future.

    // Default operationId is the node_key itself.
    let operationId = node_key;
    console.log(`_executeNode: Default operationId set to node_key: [${operationId}]`);

    // Check for operation_id_override in resolved_parameters
    // Attempt to parse 'messages' if it's a string
    if (resolved_parameters.messages && typeof resolved_parameters.messages === 'string') {
      try {
        resolved_parameters.messages = JSON.parse(resolved_parameters.messages);
        console.log(`Successfully parsed 'messages' parameter for node ${node_key}.`);
      } catch (e) {
        console.warn(`Failed to parse 'messages' input string for node ${node_key}: ${e.message}. Passing as string.`);
      }
    }
    
    let final_params_for_system_run = { ...resolved_parameters };

    if (resolved_parameters.use_operation_id_from_params === true) {
      if (typeof resolved_parameters.operation_id_override === 'string' && resolved_parameters.operation_id_override.length > 0) {
        operationId = resolved_parameters.operation_id_override;
        console.log(`_executeNode: Overriding operationId with value from params: [${operationId}]`);
      } else {
        console.warn("_executeNode: use_operation_id_from_params was true, but operation_id_override was missing or invalid. Using default operationId.");
      }
    }
    // Clean up override parameters so they are not passed to the system function
    delete final_params_for_system_run.use_operation_id_from_params;
    delete final_params_for_system_run.operation_id_override;
    
    if (!operationId) {
        console.error("_executeNode: Error - operationId could not be determined.");
        throw new Error("Could not determine the system function (operationId) to execute.");
    }
    console.log(`_executeNode: Final operationId: [${operationId}]`);

    // --- Prepare Data for System Function ---
    // resolved_parameters are used directly.
    // We also merge the full project data 'data' and add node_key for context.
    const system_run_data = { 
      ...data, // Full project data
      ...final_params_for_system_run, // Resolved input parameters for the node
      node_key_being_executed: node_key // Explicitly pass which node is being executed
    };

    // --- Call System Function ---
    console.log(`_executeNode: Calling cofounder.system.run with id: [${operationId}]`);
    console.dir({ system_run_data_payload: system_run_data }, { depth: null });

    const execution_result = await cofounder.system.run({
      id: operationId,
      context: { ...context, project: project_id }, // Global context + project_id
      data: system_run_data,
    });

    console.log("_executeNode: cofounder.system.run execution result:");
    console.dir({ execution_result }, { depth: null });

    return {
      success: true,
      message: `Node [${node_key}] execution successful with operation [${operationId}].`,
      operation_id: operationId,
      result: execution_result, // This might be a summary or confirmation
    };

  } catch (error) {
    console.error(`Error in _executeNode for node_key [${request.query?.data?.node_key || 'unknown'}]:`, error.message);
    // The error will be caught by the main actions route handler's try...catch,
    // which will then send a 500 response.
    // We re-throw to ensure it's handled there.
    throw error;
  }
}

// -------------------------------------------------------- SERVER REST API FUNCTION CALLS ------------------------
async function _updateProjectPreferences({ request }) {
	/*
		in : {
			project : `exampleproject`,
			query : {
				action : "example:action:whatever",
				data : {
					[views || sections] : {
						[id] : {version}
					}
				},
			},
		}
	*/
	const { project, query } = request;
	await cofounder.system.run({
		id: "op:PROJECT::STATE:UPDATE",
		context: { ...context, project },
		data: {
			operation: {
				id: `settings:preferences:versions`,
			},
			type: `end`,
			content: {
				key: `settings.preferences.versions`,
				data: query.data,
			},
		},
	});
}
async function _regenerateUiComponent({ request, data }) {
	const { project, query } = request;
	/*
		in : request: {
			project : `exampleproject`,
			query : {
				action : "regenerate:ui"
				data : {
					[views || sections] : `{id}`, // <--- update : sections stuff removed, is views only (for now)
				},
			},
		}
	*/

	const type = Object.keys(query.data)[0];
	const id = query.data[type];

	/*
		need to make :
		task {
			type: "view",
			view: {
				type: unique || shared,
				id,
			},
			passes: {
				functional: true,
				redesign: process.env.DESIGNER_ENABLE
					? JSON.parse(process.env.DESIGNER_ENABLE.toLowerCase())
					: true,
			}
		}
	*/
	const task = {
		type: "view",
		view: {
			type: id.startsWith(`UV_`) ? `unique` : `shared`,
			id,
		},
		passes: {
			functional: true,
			redesign: process.env.DESIGNER_ENABLE
				? JSON.parse(process.env.DESIGNER_ENABLE.toLowerCase())
				: false,
		},
	};
	console.dir({ "debug:server:task:regen:ui": { request, task } });
	await cofounder.system.run({
		id: "WEBAPP:VIEW::GENERATE",
		context: { ...context, project },
		data: {
			...data,
			task,
		},
	});
}
async function _iterateUiComponent({ request, data }) {
	console.dir({ "cofounder:api:server:iterate:ui": "starts" });
	/*
		designer/layoutv1 might be overkill, but its best way to have primitives to retrieve design system docs (if applies)
		
	*/

	/*
		in : {
			project: meta.project,
			query: {
				action: "iterate:ui",
				data: {
					views : {
						[id] : {
							[version] : {
								user : {
									text: editUserText,
									attachments: [], // later, can attach image
								},
								screenshot: { base64: image ? image : false},
								designer: bool
							}
						},
					}
				},
			},
		}),
		}
	*/
	const { project, query } = request;
	const id = Object.keys(query.data.views)[0];
	const version = Object.keys(query.data.views[id])[0];
	const { notes, screenshot, designer } = query.data.views[id][version];

	const task = {
		type: "view",
		view: {
			type: id.startsWith(`UV_`) ? `unique` : `shared`,
			id,
			version,
		},
		iteration: {
			notes, // {text,attachements}
			screenshot, // {base64 : "base64str" || false }
			designer: process.env.DESIGNER_ENABLE
				? JSON.parse(process.env.DESIGNER_ENABLE.toLowerCase()) && designer
					? true
					: false
				: false,
		},
	};
	console.dir({ "debug:server:task:regen:ui": { request, task } });
	await cofounder.system.run({
		id: "WEBAPP:VIEW::ITERATE",
		context: { ...context, project },
		data: {
			...data,
			task,
		},
	});
}
// ----------------------------------------------------------------------------------------------------
