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

### SvelteFlow
- Examples and documentation for svelteflow are in examplesAndDocs/svelteflow.dev/

### Svelte Language
- Alwaus use runes. When using runes, make sure you don't introduce any infinite loops.
- Use untrack to break reactivit within an $effect.

### Testing
- Tests use Vitest framework (configured in package.json)
- Test files follow pattern: `*.test.ts`

### TypeScript
- All Svelte components use `<script lang="ts">`
- Explicit return types on functions
- No `any` types - use proper type constraints
- Firebase types imported from respective packages

## Architecture

This is a SvelteKit application that implements a visual node-based flow editor with Firebase backend integration.

### Core Components

**FlowGraph System**: The main application (`src/routes/app/`) implements a visual node editor using @xyflow/svelte. Nodes represent executable units that can be connected to create data flows.

**Node Architecture**: 
- `NodeBluePrint.ts` - Defines the interface and model for node types with input/output sockets
- `StemNode.svelte` - Wrapper component for all node types in the flow graph
- `SocketStem.svelte` - Handles socket connections and data propagation
- Individual node implementations in `src/routes/app/nodes/` (text, images, html, etc.)

**Node Search & Discovery**:
- `src/lib/services/NodeSearchService.ts` - Firestore-based node search with text matching and categorization
- `src/lib/components/NodeSearch.svelte` - Modal search interface with live filtering
- Search by text, category, trust level, and socket compatibility
- Accessible via Tab key or "Add Node" button
- Click on empty canvas space to add nodes at specific positions

**State Management**:
- `src/lib/stores/AppState.ts` - Central application state using Svelte stores
- `src/lib/stores/ProjectState.ts` - Project-specific state with Firebase RTDB sync
- All state changes go through centralized actions
- Auto-save functionality with 2-second debounce

**Project Management**:
- `FirebaseRTDBProjectController.ts` - Manages project persistence using Firebase Realtime Database
- `ProjectModels.ts` & `ProjectInterfaces.ts` - Define project data structures and interfaces
- Projects are identified by URL parameter `pid` and stored per-user in Firebase
- Real-time synchronization via Firebase RTDB listeners

**Firebase Integration**:
- Authentication with anonymous sign-in support
- Realtime Database for project storage and real-time collaboration
- Firestore for node blueprints and metadata
- Firebase emulators configured for local development

### Key Patterns

- Node types are defined as Svelte components with standardized socket interfaces
- Centralized state management using Svelte stores with Firebase synchronization
- All UI state changes go through centralized actions for predictability
- Real-time collaboration via Firebase RTDB listeners
- Auto-save with debouncing to prevent excessive Firebase writes
- TypeScript throughout with proper type safety
- Each node type has input/output socket definitions that determine what data it accepts/produces
