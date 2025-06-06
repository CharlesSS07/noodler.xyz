# noodler.xyz

noodler.xyz is the platform for noodling around. We provide a visual node-based coding webapp where users can draw "noodles" (links) to describe data flow between functions. The platform is built to help content creators with routine edits by assembling resable workflows, photoshop/phoeditor professionals with doing high-fidelity editing in a procedural+non-destrictive manner, AI engineers in building easy-to-understand prompt designs that flow, and data scientists for loading, transforming, processing, and visualizing data. To summarize, we intend to server artist, developers, and researchers all at once.

The following is a highly ambitious vision for what this project needs to be in order to fulfill this gargantuan focus. Implement what is possible! Rome was not built in a day. Some of this is here to act as the future-looking guide which tells us where it is best to invest our time in the current moment.

## The FlowGraph ==> "Noodle Board"
The "Noodle Board" is the area where users create their logic, and view their results. It contains the procedural flow graph. Nodes in this graph can be move around. The input sockets to the nodes can have UI's designed for manipulating the value, or the input socket can be overridden by a link "noodle" setting it's value.

### Nodes

Nodes should perfecly explain the spec of a function, and have features for helping the user understand what it does. The input/output sockets should all be labelled, list a datatype, and be coloured accordingly, in addition to displaying the underlying handle variable name for the socket. Some nodes are hard-coded, specialized UI's specifically for a given task such as providing text input, image input, or even drawing input (drawing masks, etc.). Other nodes are described entirley using information in a database. These are stem nodes because they can become almost any node given just the "DNA", or some information in the database.

### Finding/searching/adding nodes

For every specific user, being able to find the nodes for their use case is an essential part of saving them time and providing a good user experiences. Creativity may be lost if the user has to spend too much time searching for the functionality they need. Therefore, here are some ideas for assisting the user with discovering a node.
1. Embed all nodes (using description, spec, probable use case, predicted keywords, etc.) in a vectordb, and then use an agentic system to find probable nodes whilst the user builds/ponders.
2. Use the project description to predict what nodes the user might want and suggest these in the node search tool.
3. Suggest nodes based on what nodes the use is currently focused on. If the use clicks on a socket, show a popup list of nodes which have the datatype input/output which would fit in there, and take context into account.
4. Plain and simple: categorize all nodes (possibly with aliases for highly-reused nodes), and let the user select their node from a dropdown of dropdown of dropdowns...
5. Node search tool. Lookup nodes by text matching, or by embedding matching. Maybe even use agentic system to build better lookups.


## General Nodes

1. Load+view file
2. Load+view image
3. Load+view csv/tsv/excel spreadsheet file
4. Raw Text node -- for inputting text
5. Markdown text node
6. Fetch URL node
7. 

## Use-case specific nodes

### Image Processing & Compositing (non-ai)

1. All Jimp Image Operations (client side, fast, simple)
2. gmic image operations
3. image magick operations
4. Blender3D image compositing operations (will have to be reimplemented)
5. Green screening

### AI Engineering

ComfyUI is an early example of how procedual flows are good for compositing together complex AI logic. ComfyUI is missing tools for compositing text, but has several useful features which should be replicated (great artists steal). All of the following nodes should be implemented in JS through the stem node, and stored in the database. There is no need for custom node svelte code for any of these. Not all of these are necessary at the moment, but are here to describe the vision.

1. VertexAI nodes
2. Huggingface nodes
  a. image-to-image -- arbitrary ai image manipulations
  b. LLM
  c. chatbot (includes chat formatting nodes)
  d. agents
3. Text Compositing
  a. Text Template fillins for building prompts.
  b. Joining text.
  c. "Transforming" text according to arbitrary wish
4. Agentic nodes
5. add to vector db
6. Google Veo 3 for video generation --> for building films, etc.

## Web Development

1. Render HTML
2. HTML Compositing nodes
3. CSS nodes?
4. Web hosting API endpoint (you build a project then plug the output into a magical web hosting node which runs your workflow and hosts the static page.

## Making the tool something people want to use

Procedual workflows are tricky so it is important to get the marketing right so we get to enough of the right people. Our mission is to build the best tool for noodling around on something quick, or something complex, and to make that tool extremley flexibile and simple to use. There are four ways I have thought of for getting the idea of the tool across:

1. Show people procedural node workflows as soon as they are on the landing page --- make the landing page mostly a proceduarl workflow. let people drag things around. provide explaination, and calls to action
2. In-tool tutorials which explain click here... then here for the FlowGraph
3. Lots of good demos people can start with and spinn off. These provide reference points. This would require a template noodle project index for finding them, and then a chatbot that could assist with this.
4. An agentic chatbot that builds out the thing you want. It can search up nodes, stop to think, do research, start building, think, and takes inputs from the user, and then uses ELK.js to organize the nodes.
