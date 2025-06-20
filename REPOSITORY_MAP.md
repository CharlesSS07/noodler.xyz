# Repository Map - SvelteKit Visual Node Editor

This document provides a comprehensive map of the entire repository structure, detailing the purpose and responsibilities of each file and directory.

## 📁 Root Configuration Files

### `package.json`
**Dependencies & Scripts Management**
- Project configuration with SvelteKit, Firebase, TailwindCSS, and @xyflow/svelte
- Development scripts for build, test, format, and Firebase operations
- Key frameworks: Svelte 5 with runes, Firebase integration, HuggingFace AI services

### `svelte.config.js`
**SvelteKit Configuration**
- Static adapter configuration for Firebase hosting
- File routing setup pointing to `src/routes`
- Build output configuration for Firebase deployment
- Warning suppression for examplesAndDocs folder

### `vite.config.ts`
**Build Tool Configuration**
- SvelteKit and TailwindCSS plugin setup
- Test environment configuration with jsdom
- Firebase emulator host setup for testing
- Development server configuration with file watching

### `tailwind.config.js`
**Styling Framework Configuration**
- Flowbite plugin integration for UI components
- Custom color palette (primary orange, secondary blue)
- Dark mode class configuration
- Content path scanning for styles

### `firebase.json`
**Firebase Services Configuration**
- Hosting setup for static site deployment
- Database, Firestore, Storage, and Functions configuration
- Emulator ports setup (auth:9099, database:9000, firestore:8080, storage:9199)
- Build and deployment rules

### `tsconfig.json`
**TypeScript Configuration**
- Modern TypeScript configuration with strict mode
- SvelteKit path mapping and module resolution
- Build target and library configurations

### `vitest.config.ts`
**Testing Framework Configuration**
- Test environment setup with jsdom
- Firebase emulator integration for testing
- Test file patterns and setup configuration

---

## 📁 src/ - Main Application Source

### Core Application Files

#### `src/app.html`
**HTML Template**
- Root HTML template for SvelteKit application
- Meta tags, viewport, and favicon configuration
- Application mount point and theme setup

#### `src/app.css`
**Global Styles**
- TailwindCSS imports and global styles
- Application-wide CSS variables and utilities
- Base styling for the node editor interface

#### `src/app.d.ts`
**TypeScript App Declarations**
- Global type definitions for SvelteKit
- Application-specific type extensions
- Firebase and third-party library type augmentations

---

## 📁 src/firebase/ - Firebase Integration

### `src/firebase/index.ts`
**Firebase Configuration & Initialization**
- Firebase app initialization with config
- Authentication, Firestore, Realtime Database, and Storage setup
- Environment-specific configuration (production vs emulator)
- Service initialization and exports

---

## 📁 src/lib/ - Core Application Library

### 📁 src/lib/stores/ - State Management

#### `src/lib/stores/AppState.ts`
**Global Application State Management**
- User authentication state tracking
- Current project ID management
- Loading states and error handling
- Firebase connection status monitoring
- Centralized actions for state updates
- Real-time Firebase synchronization

#### `src/lib/stores/ProjectState.ts`
**Project-Specific State Management**
- Node and edge data management for flow graphs
- Project metadata (title, description) handling
- Output socket data caching
- Auto-save functionality with debouncing (50ms)
- Firebase Realtime Database synchronization
- Dirty state tracking for unsaved changes

### 📁 src/lib/compositor/ - Core Data Processing Engine

#### `src/lib/compositor/NodeBluePrint.ts`
**Node Blueprint Interface & Factory**
- Abstract class defining node structure and behavior
- Input/output socket management interfaces
- Node execution and lifecycle methods
- Reactive store wrapper for node blueprints
- Code execution, documentation, and trust level management

#### `src/lib/compositor/FirebaseRTDBProjectController.ts`
**Firebase Project Management**
- Project creation and deletion operations
- User access control and permissions
- Firebase Realtime Database project storage
- Project metadata management with timestamps

#### `src/lib/compositor/DataTypes.ts`
**Core Data Type Definitions**
- Type definitions for data flowing through nodes
- Socket data type specifications
- Validation and serialization interfaces

#### `src/lib/compositor/Interpreter.ts` & `src/lib/compositor/Interpreter.test.ts`
**Flow Execution Engine**
- Node graph execution logic
- Data flow processing between connected nodes
- Asynchronous operation handling
- Error handling and execution state management

#### `src/lib/compositor/BigData.ts` & `src/lib/compositor/BigData.test.ts`
**Large Data Handling**
- Memory management for large data sets
- Data chunking and streaming operations
- Performance optimization for data-intensive nodes

#### `src/lib/compositor/BigDataCleanup.ts` & `src/lib/compositor/BigDataCleanup.test.ts`
**Memory Management**
- Automatic cleanup of unused data
- Memory leak prevention
- Resource optimization strategies

#### `src/lib/compositor/OutputSocketDataCache.ts` & `src/lib/compositor/OutputSocketDataCache.test.ts`
**Socket Data Caching**
- Caching system for node output data
- Performance optimization for repeated computations
- Memory-efficient data storage

#### `src/lib/compositor/SocketModels.ts`
**Socket Data Models**
- Input and output socket data structures
- Socket parameter validation
- Data type conversion and serialization

#### `src/lib/compositor/SocketParamBuilders.ts` & `src/lib/compositor/SocketParamBuilders.test.ts`
**Socket Parameter Construction**
- Dynamic parameter building for sockets
- Type-safe parameter validation
- Runtime parameter generation

#### `src/lib/compositor/ProjectInterfaces.ts`
**Project Type Interfaces**
- TypeScript interfaces for project data structures
- API contract definitions
- Cross-component type consistency

#### `src/lib/compositor/ProjectModels.ts`
**Project Data Models**
- Concrete implementations of project interfaces
- Data validation and transformation logic
- Model lifecycle management

#### `src/lib/compositor/FirestoreNodeBluePrint.ts` & `src/lib/compositor/FirestoreNodeBluePrint.test.ts`
**Node Blueprint Database Management**
- Firestore storage for node blueprints
- Node versioning and history tracking
- Blueprint search and retrieval operations

#### `src/lib/compositor/FirestoreStandardNodeSet.ts`
**Standard Node Library Management**
- Pre-built node collection management
- Standard node registration and discovery
- Default node library maintenance

#### `src/lib/compositor/UnitTestProjects.ts`
**Test Project Definitions**
- Pre-configured projects for testing
- Test data generation utilities
- Automated testing support

### 📁 src/lib/compositor/NodeAPIConnector/ - External API Integration

#### `src/lib/compositor/NodeAPIConnector/NodeAPIConnectorManager.ts`
**API Connector Management**
- Central management of external API connections
- Connection pooling and lifecycle management
- Error handling and retry logic

#### `src/lib/compositor/NodeAPIConnector/AIServiceConnector.ts`
**AI Service Integration**
- Generic AI service connection interface
- Request/response handling for AI APIs
- Authentication and rate limiting

#### `src/lib/compositor/NodeAPIConnector/HuggingfaceNodeAPIConnector.ts`
**HuggingFace API Integration**
- Specific connector for HuggingFace inference API
- Model loading and execution
- Parameter handling for different AI models

#### `src/lib/compositor/NodeAPIConnector/GradioNodeAPIConnector.ts`
**Gradio API Integration**
- Connection to Gradio-based AI services
- Space and model interaction
- File upload and processing support

### 📁 src/lib/services/ - Business Logic Services

#### `src/lib/services/index.ts`
**Service Exports**
- Central export point for all services
- Service registration and initialization

#### `src/lib/services/NodeSearchService.ts`
**Node Search & Discovery**
- Firestore-based node blueprint search
- Text matching and categorization
- Filter by trust level, category, and socket compatibility
- Search result ranking and relevance

#### `src/lib/services/AIInferenceService.ts`
**AI Inference Service**
- Centralized AI model interaction
- Multiple AI provider support
- Request queuing and processing
- Response caching and optimization

#### `src/lib/services/AIInferenceTypes.ts`
**AI Service Type Definitions**
- Type definitions for AI service interactions
- Request/response model interfaces
- Error handling type specifications

### 📁 src/lib/standardNodes/ - Standard Node Definitions

#### `src/lib/standardNodes/index.ts`
**Standard Node Registry**
- Central registration of all standard nodes
- Node category organization
- Export management for node library

#### `src/lib/standardNodes/aiInferenceNodes.ts`
**AI Inference Node Definitions**
- Text generation, classification, and processing nodes
- Image generation and analysis nodes
- Multi-modal AI operation nodes

#### `src/lib/standardNodes/huggingfaceNodes.ts`
**HuggingFace Integration Nodes**
- Specific nodes for HuggingFace models
- Model parameter configuration
- Response formatting and handling

#### `src/lib/standardNodes/basicMathNodes.ts`
**Mathematical Operation Nodes**
- Arithmetic and algebraic operations
- Statistical calculations
- Data transformation utilities

#### `src/lib/standardNodes/jsonNodes.ts`
**JSON Data Processing Nodes**
- JSON parsing and serialization
- Object manipulation and querying
- Data structure transformations

#### `src/lib/standardNodes/htmlNodes.ts`
**HTML Generation & Processing Nodes**
- HTML element creation and manipulation
- Template processing and rendering
- Web content generation

#### `src/lib/standardNodes/fileNodes.ts`
**File I/O Operation Nodes**
- File reading and writing operations
- Format conversion utilities
- Batch file processing

#### `src/lib/standardNodes/jimpNodes.ts`
**Image Processing Nodes**
- Image manipulation using Jimp library
- Resize, crop, filter operations
- Format conversion and optimization

#### `src/lib/standardNodes/googleDriveNodes.ts`
**Google Drive Integration Nodes**
- File upload and download from Google Drive
- Authentication and authorization handling
- Folder management operations

#### `src/lib/standardNodes/dropboxNodes.ts`
**Dropbox Integration Nodes**
- Dropbox API interaction nodes
- File synchronization operations
- Cloud storage management

#### `src/lib/standardNodes/fileLoadingNodes.ts`
**File Loading Utilities**
- Various file format loaders
- Streaming file operations
- Memory-efficient file processing

#### `src/lib/standardNodes/promptDesignNodes.ts`
**AI Prompt Engineering Nodes**
- Prompt template creation and management
- Dynamic prompt generation
- Prompt optimization utilities

#### `src/lib/standardNodes/simpleImageModificationNodes.ts`
**Basic Image Editing Nodes**
- Simple image transformation operations
- Color adjustment and filtering
- Basic drawing and annotation tools

#### `src/lib/standardNodes/specialtyDataInputNodes.ts`
**Specialized Data Input Nodes**
- Custom data format readers
- API data ingestion nodes
- Real-time data stream processors

#### `src/lib/standardNodes/worldStateDataNodes.ts`
**Global State Management Nodes**
- Application state manipulation nodes
- Cross-project data sharing
- Global variable management

#### `src/lib/standardNodes/aiDemoNodes.ts`
**AI Demonstration Nodes**
- Example AI integration implementations
- Tutorial and learning nodes
- Showcase functionality nodes

### 📁 src/lib/components/ - Reusable UI Components

#### `src/lib/components/FlowGraph.svelte`
**Main Flow Graph Component**
- Primary visual node editor interface using @xyflow/svelte
- Canvas rendering and interaction handling
- Node positioning and connection management
- Zoom, pan, and selection operations

#### `src/lib/components/NodeSearch.svelte`
**Node Search Modal Interface**
- Modal search interface with live filtering
- Category-based node browsing
- Search by text, trust level, and socket compatibility
- Node addition to canvas at specific positions

#### `src/lib/components/StemNode.svelte`
**Core Node Wrapper Component**
- Universal wrapper for all node types in the flow graph
- Socket rendering and connection handling
- Node selection and drag operations
- Visual state management (selected, highlighted, etc.)

#### `src/lib/components/StemNodeComponent.svelte`
**Node Component Implementation**
- Specific node rendering and interaction logic
- Input parameter handling and validation
- Output display and formatting
- Node-specific UI controls

#### `src/lib/components/NodeWrapper.svelte`
**Node Container Component**
- Additional wrapper layer for nodes
- Layout and positioning management
- Event handling and propagation

#### `src/lib/components/TallTextArea.svelte`
**Extended Text Input Component**
- Multi-line text input with enhanced features
- Auto-resizing functionality
- Rich text editing capabilities

### 📁 src/lib/components/sockets/ - Socket Connection Components

#### `src/lib/components/sockets/TargetSocket.svelte`
**Input Socket Component**
- Visual representation of node input connections
- Drag and drop connection handling
- Data type validation and compatibility checking
- Connection state visualization

#### `src/lib/components/sockets/SourceSocket.svelte`
**Output Socket Component**
- Visual representation of node output connections
- Data emission and propagation
- Multiple connection support
- Output data preview and debugging

### 📁 src/lib/components/sockets/socket-inputs/ - Socket Input Types

#### `src/lib/components/sockets/socket-inputs/SocketInputMapping.ts`
**Socket Input Type Registry**
- Mapping of socket types to input components
- Dynamic component loading based on socket type
- Type validation and conversion utilities

#### `src/lib/components/sockets/socket-inputs/StringInput.svelte`
**String Input Component**
- Text input for string socket parameters
- Validation and formatting
- Multi-line support for long strings

#### `src/lib/components/sockets/socket-inputs/NumberInput.svelte`
**Numeric Input Component**
- Number input with validation
- Range constraints and step controls
- Scientific notation support

#### `src/lib/components/sockets/socket-inputs/BooleanInput.svelte`
**Boolean Input Component**
- Checkbox/toggle input for boolean values
- Visual state indication
- Click handling and state management

#### `src/lib/components/sockets/socket-inputs/EnumInput.svelte`
**Enumeration Input Component**
- Dropdown selection for predefined options
- Multi-select support
- Custom option validation

#### `src/lib/components/sockets/socket-inputs/FileInput.svelte`
**File Upload Input Component**
- File selection and upload interface
- Drag and drop support
- File type validation and preview

#### `src/lib/components/sockets/socket-inputs/ImageInput.svelte`
**Image Input Component**
- Image upload and preview
- Image format conversion
- Thumbnail generation and display

#### `src/lib/components/sockets/socket-inputs/BlenderSlider.svelte`
**Advanced Slider Component**
- Blender-style numeric slider with precision controls
- Logarithmic and linear scaling options
- Fine-tuning and coarse adjustment modes

### 📁 src/lib/components/nodes/ - Production Node Implementations

#### `src/lib/components/nodes/NoteNode.svelte`
**Note-Taking Node**
- Text annotation and documentation node
- Rich text editing with markdown support
- Comment and documentation features

### 📁 src/lib/components/nodes/text/ - Text Processing Nodes

#### `src/lib/components/nodes/text/TextEditorRawNode.svelte`
**Raw Text Editor Node**
- Plain text editing and manipulation
- Large text handling capabilities
- Text transformation utilities

#### `src/lib/components/nodes/text/TextEditorMarkdownNode.svelte`
**Markdown Text Editor Node**
- Markdown editing with live preview
- Syntax highlighting and validation
- Export to various formats

#### `src/lib/components/nodes/text/TextTemplateFillinNode.svelte`
**Text Template Processing Node**
- Template engine for dynamic text generation
- Variable substitution and formatting
- Conditional text generation

### 📁 src/lib/components/nodes/images/ - Image Processing Nodes

#### `src/lib/components/nodes/images/ImageNode.svelte`
**Image Display and Processing Node**
- Image rendering and manipulation
- Format conversion and optimization
- Basic editing operations

### 📁 src/lib/components/nodes/html/ - HTML Generation Nodes

#### `src/lib/components/nodes/html/HTMLRendererNode.svelte`
**HTML Rendering Node**
- HTML content rendering and preview
- Live HTML editing and validation
- CSS styling integration

### 📁 src/lib/components/nodes/huggingface/ - HuggingFace Integration Nodes

#### `src/lib/components/nodes/huggingface/CompleteTextLLM.svelte`
**HuggingFace LLM Integration Node**
- Large language model interaction
- Text completion and generation
- Model parameter configuration

### 📁 src/lib/components/dummynodes/ - Demo Node Implementations

#### `src/lib/components/dummynodes/LlmContentGenerator.svelte`
**LLM Content Generation Demo Node**
- Example implementation of LLM content generation
- Template-based content creation
- Multi-format output support

#### `src/lib/components/dummynodes/ImagePromptComposer.svelte`
**Image Prompt Composition Demo Node**
- AI image generation prompt builder
- Style and parameter composition
- Prompt optimization suggestions

#### `src/lib/components/dummynodes/StringToImageConverter.svelte`
**Text-to-Image Conversion Demo Node**
- String input to image generation
- Font and styling options
- Image format output selection

#### `src/lib/components/dummynodes/HtmlBoilerplateNode.svelte`
**HTML Boilerplate Generation Demo Node**
- Standard HTML template generation
- Configurable boilerplate options
- SEO and accessibility features

#### `src/lib/components/dummynodes/HtmlTagNode.svelte`
**HTML Tag Generation Demo Node**
- Dynamic HTML element creation
- Attribute and content management
- Nested element support

#### `src/lib/components/dummynodes/WebNavbarNode.svelte`
**Web Navigation Bar Demo Node**
- Navigation component generation
- Responsive design options
- Link and menu management

#### `src/lib/components/dummynodes/SplitString.svelte`
**String Splitting Demo Node**
- Text parsing and segmentation
- Multiple delimiter support
- Output format options

#### `src/lib/components/dummynodes/TextFormatterLLM.svelte`
**LLM Text Formatting Demo Node**
- AI-powered text formatting
- Style and structure improvements
- Multiple output formats

#### `src/lib/components/dummynodes/BackgroundGenerator.svelte`
**Background Generation Demo Node**
- Procedural background creation
- Color and pattern options
- Export in multiple formats

#### `src/lib/components/dummynodes/ForegroundSplitter.svelte`
**Foreground Separation Demo Node**
- Image foreground/background separation
- AI-powered segmentation
- Mask generation and refinement

#### `src/lib/components/dummynodes/CompositeGenerator.svelte`
**Image Composition Demo Node**
- Multi-layer image composition
- Blending mode options
- Layer management and ordering

#### `src/lib/components/dummynodes/InpaintingNode.svelte`
**Image Inpainting Demo Node**
- AI-powered image completion
- Mask-based editing
- Context-aware filling

#### `src/lib/components/dummynodes/StyleTransferNode.svelte`
**Style Transfer Demo Node**
- AI-powered artistic style transfer
- Multiple style options
- Intensity and blend controls

#### `src/lib/components/dummynodes/SmartCompositor.svelte`
**Smart Image Composition Demo Node**
- Intelligent image combination
- Automatic alignment and blending
- Context-aware composition rules

### 📁 src/lib/css/ - Component Styles

#### `src/lib/css/nodes.css`
**Node-Specific Styling**
- Visual styling for node components
- Socket appearance and connection styles
- Interactive state styling (hover, selected, connected)
- Theme support and color schemes

---

## 📁 src/components/ - Global Application Components

### `src/components/Logo.svelte`
**Application Logo Component**
- Brand logo rendering and styling
- Responsive sizing and positioning
- Link handling to home page

### `src/components/BugReportButton.svelte`
**Bug Reporting Interface**
- User feedback and bug reporting form
- Issue submission to tracking system
- User contact information collection

### `src/components/EmailSignup.svelte`
**Email Newsletter Signup**
- Email collection for updates and newsletters
- Validation and subscription management
- Integration with email marketing services

### `src/components/DiscordJoin.svelte`
**Discord Community Integration**
- Discord server invitation and links
- Community engagement features
- Social interaction prompts

### `src/components/ChrommaticAbberationDefocusText.svelte`
**Visual Effect Text Component**
- Artistic text rendering with visual effects
- Chromatic aberration and defocus effects
- Animation and transition support

### `src/components/BlenderSlider.svelte`
**Advanced Slider Control**
- Blender-style numeric input slider
- Precision control with different interaction modes
- Visual feedback and real-time updates

---

## 📁 src/routes/ - SvelteKit Route Structure

### Core Layout & Error Handling

#### `src/routes/+layout.svelte`
**Main Application Layout**
- Global layout structure and navigation
- Authentication state management
- Theme switching and dark mode support
- Global component placement (header, footer, modals)

#### `src/routes/+layout.js`
**Layout Configuration**
- Route-level configuration and data loading
- Authentication requirements
- Global state initialization

#### `src/routes/+page.svelte`
**Home Page**
- Landing page with application introduction
- Feature highlights and navigation
- User onboarding and getting started guides

#### `src/routes/+error.svelte`
**Error Page**
- Global error handling and display
- User-friendly error messages
- Recovery options and support links

### Application Routes

#### `src/routes/app/+page.svelte`
**Main Application Interface**
- Primary node editor application
- Project loading and management
- Canvas and tool integration

### Demo Applications

#### `src/routes/app/demos/+page.svelte`
**Demo Gallery**
- Showcase of example applications
- Interactive demonstrations
- Template project access

#### `src/routes/app/demos/promptdesign/+page.svelte`
**Prompt Design Demo**
- AI prompt engineering demonstration
- Template and example library
- Interactive prompt building tools

#### `src/routes/app/demos/promptdesign/projectVersions.ts`
**Prompt Design Project Versions**
- Version management for prompt design projects
- Template storage and retrieval
- Project evolution tracking

#### `src/routes/app/demos/imagegen/+page.svelte`
**Image Generation Demo**
- AI image generation showcase
- Parameter tuning and style options
- Generated image gallery

#### `src/routes/app/demos/webdev/+page.svelte`
**Web Development Demo**
- Web development workflow demonstration
- HTML/CSS/JS code generation
- Live preview and editing

#### `src/routes/app/demos/deepfakedesign/+page.svelte`
**AI Content Design Demo**
- Advanced AI content creation tools
- Multi-modal content generation
- Ethics and responsible AI usage

### Utility Pages

#### `src/routes/fridge/+page.svelte`
**Project Storage Interface**
- Project management and organization
- File storage and retrieval
- Project sharing and collaboration

#### `src/routes/fridge/ProjectManager.svelte`
**Project Management Component**
- Project CRUD operations
- User access control
- Project metadata management

#### `src/routes/hub/+page.svelte`
**Community Hub**
- Community projects and sharing
- User-generated content gallery
- Collaboration features

#### `src/routes/login/+page.svelte`
**User Authentication**
- User login and registration
- OAuth integration (Google, GitHub, etc.)
- Anonymous access options

#### `src/routes/admin/+page.svelte`
**Administrative Interface**
- Admin-only features and controls
- User management and moderation
- System monitoring and analytics

### Information Pages

#### `src/routes/about/+page.svelte`
**About Application**
- Application description and features
- Technology stack information
- Development team and credits

#### `src/routes/about-me/+page.svelte`
**About Developer**
- Developer profile and background
- Contact information and social links
- Professional experience and projects

#### `src/routes/about-me/my-projects/+page.svelte`
**Developer Projects Showcase**
- Portfolio of developer's other projects
- Project descriptions and links
- Technology demonstrations

#### `src/routes/contact/+page.svelte`
**Contact Information**
- Contact form and communication options
- Business inquiries and support
- Location and availability information

#### `src/routes/tutorials/+page.svelte`
**Tutorial and Documentation**
- Step-by-step usage tutorials
- Feature documentation and guides
- Video tutorials and examples

#### `src/routes/privacy/+page.svelte`
**Privacy Policy**
- Data collection and usage policies
- User privacy rights and protections
- Compliance with data protection regulations

#### `src/routes/terms/+page.svelte`
**Terms of Service**
- Application usage terms and conditions
- User responsibilities and limitations
- Legal disclaimers and liability

#### `src/routes/404/+page.svelte`
**404 Not Found Page**
- Custom 404 error page
- Navigation suggestions and search
- User-friendly error messaging

---

## 📁 src/scripts/ - Utility Scripts

### `src/scripts/createTestProject.js`
**Test Project Generator**
- Automated test project creation
- Sample data generation for testing
- Development environment setup

### `src/scripts/populateAINodes.js`
**AI Node Population Script**
- Populate database with AI node blueprints
- Standard AI model integration setup
- Batch node registration and configuration

### `src/scripts/populateTestNodes.js`
**Test Node Population Script**
- Create test node blueprints for development
- Mock data generation for testing
- Development database seeding

---

## 📁 src/tests/ - Test Suite

### `src/tests/setup.ts`
**Test Environment Setup**
- Test configuration and initialization
- Mock service setup and utilities
- Global test helper functions

### `src/tests/ai-inference-nodes.test.ts`
**AI Inference Node Testing**
- Comprehensive tests for AI integration nodes
- API mocking and response validation
- Performance and reliability testing

### `src/tests/comprehensive-node-tests.test.ts`
**Comprehensive Node Testing Suite**
- Full test coverage for node implementations
- Integration testing for node interactions
- Edge case and error handling tests

---

## 📁 functions/ - Firebase Cloud Functions

### `functions/package.json`
**Cloud Functions Dependencies**
- Node.js dependencies for cloud functions
- Firebase functions framework setup
- External API integration packages

### `functions/src/index.ts`
**Cloud Functions Entry Point**
- HTTP triggered functions for AI inference
- Background functions for data processing
- Webhook handlers and API endpoints

### `functions/deploy.sh`
**Deployment Script**
- Automated cloud function deployment
- Environment configuration management
- Build and test pipeline execution

### `functions/lib/` - Compiled Functions
**Compiled JavaScript Output**
- TypeScript compilation output
- Deployment-ready function code
- Source maps for debugging

---

## 📁 static/ - Static Assets

### `static/favicon.png`
**Application Icon**
- Browser favicon and app icon
- Multiple sizes for different platforms
- Brand identity representation

### `static/robots.txt`
**Search Engine Instructions**
- Web crawler permissions and restrictions
- SEO optimization settings
- Sitemap references

---

## 📁 build/ - Build Output
**Production Build Artifacts**
- Compiled application for deployment
- Optimized assets and bundles
- Static files for hosting

---

## 📁 examplesAndDocs/ - Documentation & Examples
**External Documentation**
- SvelteFlow documentation mirror
- Example implementations and tutorials
- Reference materials and guides

---

## 📁 dataconnect/ - Firebase Data Connect
**GraphQL API Configuration**
- Schema definitions for structured queries
- Database connection configuration
- API endpoint generation

---

## Additional Configuration Files

### Database & Storage Rules
- `database.rules.json` - Firebase Realtime Database security rules
- `firestore.rules` - Firestore security rules  
- `firestore.indexes.json` - Firestore query optimization indexes
- `storage.rules` - Firebase Storage security rules

### Development Utilities
- `scripts/kill-emulators.js` - Firebase emulator cleanup utility
- `how-to-make-demos-by-claude.txt` - Development documentation
- Various log files for debugging and monitoring

---

## Architecture Summary

This SvelteKit application implements a **visual node-based flow editor** with the following core architectural patterns:

### **🎯 Core Concepts**
- **Visual Programming**: Drag-and-drop node editor for creating data processing workflows
- **Real-time Collaboration**: Firebase-powered real-time project synchronization
- **AI Integration**: Extensive AI service integration via HuggingFace and custom APIs
- **Modular Nodes**: Extensible node system with standardized input/output sockets

### **🏗️ Key Architectural Layers**
1. **Presentation Layer**: Svelte components with @xyflow/svelte for visual editing
2. **State Management**: Centralized Svelte stores with Firebase synchronization  
3. **Business Logic**: Compositor engine for node execution and data flow
4. **Data Layer**: Firebase services (Auth, Firestore, Realtime DB, Storage)
5. **External APIs**: AI services, cloud storage, and third-party integrations

### **🔧 Technology Stack**
- **Frontend**: SvelteKit 2.0 with Svelte 5 runes
- **Styling**: TailwindCSS 4.0 with Flowbite components
- **Backend**: Firebase (Authentication, Firestore, Realtime Database, Cloud Functions)
- **AI Integration**: HuggingFace Inference API, Gradio, TensorFlow.js
- **Build Tools**: Vite, TypeScript, Vitest for testing
- **Deployment**: Firebase Hosting with static adapter

This architecture enables users to create complex data processing workflows through an intuitive visual interface while maintaining real-time collaboration and extensive AI integration capabilities.