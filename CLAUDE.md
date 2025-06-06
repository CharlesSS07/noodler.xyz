# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn check` - Run Svelte type checking
- `yarn check:watch` - Run Svelte type checking in watch mode
- `yarn format` - Format code with Prettier

### Firebase
- `yarn emulators` - Start Firebase emulators (auth:9099, database:9000, firestore:8080, storage:9199)
- `yarn deploy` - Build and deploy to Firebase

### Testing
- Tests use Vitest framework (configured in package.json)
- Test files follow pattern: `*.test.ts`

## Architecture

This is a SvelteKit application that implements a visual node-based flow editor with Firebase backend integration.

### Core Components

**FlowGraph System**: The main application (`src/routes/app/`) implements a visual node editor using @xyflow/svelte. Nodes represent executable units that can be connected to create data flows.

**Node Architecture**: 
- `NodeBluePrint.ts` - Defines the interface and model for node types with input/output sockets
- `StemNode.svelte` - Wrapper component for all node types in the flow graph
- `SocketStem.svelte` - Handles socket connections and data propagation
- Individual node implementations in `src/routes/app/nodes/` (text, images, html, etc.)

**Project Management**:
- `FirebaseRTDBProjectController.ts` - Manages project persistence using Firebase Realtime Database
- `ProjectModels.ts` & `ProjectInterfaces.ts` - Define project data structures and interfaces
- Projects are identified by URL parameter `pid` and stored per-user in Firebase

**Execution System**:
- `Execution.ts` - Handles running node graphs and data propagation between connected nodes
- Nodes can have user-defined code snippets that execute when the node runs
- Output from one node flows to connected input sockets of other nodes

**Firebase Integration**:
- Authentication with anonymous sign-in support
- Realtime Database for project storage and real-time collaboration
- Firestore for node blueprints and metadata
- Firebase emulators configured for local development

### Key Patterns

- Node types are defined as Svelte components with standardized socket interfaces
- Data flows through the graph via socket connections
- Project state is synchronized in real-time via Firebase
- Each node type has input/output socket definitions that determine what data it accepts/produces