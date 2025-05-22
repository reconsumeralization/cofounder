# Cofounder Architecture

## Introduction

Cofounder is a system designed to generate full-stack web applications based on user descriptions and design inputs. It aims to automate large parts of the development process, from UI mockups to backend logic and database setup. The system is composed of several core components that work together to interpret user requests, manage project generation workflows, and produce runnable applications.

## Core Components

### 1. CLI (`npx @openinterface/cofounder`)

Users primarily interact with Cofounder through its Command Line Interface (CLI). This is the entry point for initializing new projects.

*   **Usage:**
    *   Global execution: `npx @openinterface/cofounder -p "ProjectName" -d "Project description" -a "Aesthetic instructions"`
    *   Local API execution (from `./cofounder/api`): `npm run start -- -p "ProjectName" -f "description.txt" -a "Design details"`
*   **Key Flags:** (Refer to `README.md` "CLI Reference" for more details)
    *   `-p <name>` / `--project <name>`: Specifies the project name.
    *   `-d <description>` / `--desc <description>`: Provides a textual description of the app.
    *   `-f <filepath>` / `--file <filepath>`: Path to a file containing the description.
    *   `-a <instructions>` / `--aesthetic <instructions>`: Optional design instructions.

### 2. Cofounder API (`cofounder/api`)

The Cofounder API is the central nervous system of the project. It is a Node.js application built with Express.

*   **Role:**
    *   Receives project generation requests from the CLI or the Dashboard.
    *   Orchestrates the entire project generation workflow by utilizing the System Core (nodes and sequences).
    *   Manages project state, configurations, and interactions with the project database.
    *   Serves as the backend for the Cofounder Dashboard.

### 3. System Core (`cofounder/api/system`)

This is where the low-level logic and definitions for project generation reside.

*   **Nodes (`cofounder/api/system/structure/nodes`):**
    *   Nodes are YAML-defined atomic units of work. Each node represents a specific task or operation within the generation process (e.g., generating code for a component, calling an LLM, writing a file).
    *   **Structure:** Typically defined by `desc` (description), `in` (input parameters), `out` (output parameters), and `queue` (concurrency, retry, timeout settings).
    *   **Schema Validation:** Node YAML files are validated against a JSON schema (`cofounder/api/system/structure/node.schema.json`) to ensure correctness.
    *   **Example:** `cofounder/api/system/structure/nodes/op/llm.yaml` configures parameters for Large Language Model operations, including concurrency limits.
*   **Sequences (`cofounder/api/system/structure/sequences`):**
    *   Sequences define Directed Acyclic Graphs (DAGs) of nodes. They orchestrate complex operations by chaining multiple nodes together, managing dependencies and parallel execution where possible.
    *   For example, generating a full backend might involve a sequence of nodes for setting up the server, defining database schema, creating API endpoints, etc.
*   **Functions (`cofounder/api/system/functions`):**
    *   These are JavaScript modules that contain the actual code implementing the logic for each corresponding node. When a node is executed in a sequence, its linked function in this directory is called.

### 4. Project Database (`cofounder/api/db`)

This component is responsible for storing project-specific information.

*   **Storage:** Primarily uses YAML files for storing configurations, states of generated projects, and potentially other metadata.
*   **Cloud Aspects:** While not fully detailed here, Firebase might be used for certain cloud-based functionalities or persistence layers, especially for user accounts or shared project data if applicable.

### 5. Generated Applications (`apps/{YourApp}`)

The ultimate output of the Cofounder system is a runnable, full-stack application tailored to the user's request.

*   **Structure:** Typically includes a backend (e.g., Node.js/Express) and a frontend (e.g., Vite+React).
*   **Self-Contained:** Each generated application in the `apps/` directory is a separate project with its own dependencies, build scripts, and runtime. Users usually run `npm i && npm run dev` (or similar commands as per the generated app's README) within the app's directory to start it.

### 6. Dashboard (`cofounder/dashboard`)

A web-based interface that provides an alternative way to interact with Cofounder.

*   **Functionality:** Allows users to create new projects, view existing ones, potentially monitor generation progress, and manage Cofounder settings.
*   **Technology:** Likely a modern frontend framework (e.g., React with Vite) that communicates with the Cofounder API.

## Data Flow

A typical project generation request flows through the system as follows:

1.  **User Input:** The user initiates a request via the CLI (e.g., `npx @openinterface/cofounder ...`) or the Dashboard.
2.  **API Receives Request:** The Cofounder API (`cofounder/api`) receives the project parameters (name, description, design instructions).
3.  **Workflow Orchestration:** The API triggers a relevant sequence defined in `cofounder/api/system/structure/sequences`.
4.  **Node Execution:** The sequence executes a series of nodes. Each node performs a specific task:
    *   Interacting with LLMs for code generation, planning, or design.
    *   Writing/modifying files for the new application.
    *   Updating project state in the database.
5.  **File Generation:** Nodes write code, configuration files, and other assets into the `apps/{YourAppName}` directory.
6.  **Completion:** Once the sequence completes, the user has a new, runnable application in the `apps/` directory.

## Architecture Diagram

(As referenced in `README.md`)

![Architecture Diagram](https://github.com/user-attachments/assets/b2d8b70e-7a6d-45c9-a706-0cf955d13451)

## Future Considerations / Roadmap Highlights

This section outlines potential future architectural developments and system capabilities. (Points adapted from `TODO.md` and general project direction):

*   **Enhanced Project Iteration:** Modules for iterating on all dimensions of generated projects (beyond initial generation).
*   **Admin Interface:** A more comprehensive admin interface for event streams and deeper project iterations.
*   **Full GenUI Plugin Integration:**
    *   Generative design systems.
    *   Deployment and serving of fine-tuned models from `api.cofounder`.
*   **Local, Browser-Based Dev Environment:** Support for a fully browser-based development environment for the entire project scope.
*   **Expanded Framework Support:** Addition of other web frameworks (e.g., React Native, Flutter).
*   **Advanced Code Quality Features:**
    *   Automated code validations.
    *   Swarm code review and autofix capabilities.
    *   Code optimization modules.
*   **Improved Modularity and Extensibility:** Continuously refining the node and sequence architecture for better modularity and easier contributions.
*   **Cloud-Native Features:** Deeper integration with cloud services for deployment, scaling, and managed services for generated applications.
*   **Sophisticated State Management:** More robust state management for long-running generation processes and iterative development cycles.
*   **Plugin Architecture:** A more formal plugin architecture to allow easier extension of Cofounder's capabilities.
*   **Enhanced AI Capabilities:** Integration of more advanced AI models and techniques for code generation, UI design, and architectural decision-making.
*   **Multi-Modal Inputs:** Support for multi-modal inputs for project descriptions (e.g., images, wireframes).

This list represents a high-level overview of potential directions and is subject to change as the project evolves.Okay, `docs/ARCHITECTURE.md` has been created. The `docs/` directory was implicitly created by `create_file_with_block`.

Now, I'll move on to **3. Enhance `CONTRIBUTING.md`**.
I will overwrite the existing `CONTRIBUTING.md` with the new content.
