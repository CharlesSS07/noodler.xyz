import { DirectedGraph } from "graphology";
import willCreateCycle from "graphology-dag/will-create-cycle";

export class CyclicDependencyException extends Error {}

export class DependencyGraph<T extends object> {
    private graph: DirectedGraph;
    private nodeToId: Map<T, string>;
    private idToNode: Map<string, T>;
    private idCounter: number;

    constructor() {
        this.graph = new DirectedGraph();
        this.nodeToId = new Map();
        this.idToNode = new Map();
        this.idCounter = 0;
    }

    private getNodeId(node: T): string {
        if (!this.nodeToId.has(node)) {
            const id = `node_${this.idCounter++}`;
            this.nodeToId.set(node, id);
            this.idToNode.set(id, node);
        }
        return this.nodeToId.get(node)!;
    }

    private getNodeFromId(id: string): T {
        return this.idToNode.get(id)!;
    }

    hasNode(node: T): boolean {
        return this.nodeToId.has(node);
    }

    hasEdge(from: T, to: T) {
        const toId = this.nodeToId.get(to);
        const fromId = this.nodeToId.get(from);

        // @ts-expect-error this is how hasEdge is called in graphology
        return this.graph.hasEdge(fromId, toId);
    }

    addNode(node: T): void {
        const nodeId = this.getNodeId(node);
        // @ts-expect-error hasEdge is a valid function of graphology
        if (!this.graph.hasNode(nodeId)) {
            // @ts-expect-error addNode is a valid function of graphology
            this.graph.addNode(nodeId);
        }
    }

    removeNode(node: T): void {
        const nodeId = this.getNodeId(node);
        // @ts-expect-error hasEdge is a valid function of graphology
        if (!this.graph.hasNode(nodeId)) {
            // @ts-expect-error addNode is a valid function of graphology
            this.graph.dropNode(nodeId);
        }
    }

    addDependency(from: T, to: T): void {
        const fromId = this.getNodeId(from);
        const toId = this.getNodeId(to);
        if (willCreateCycle(this.graph, fromId, toId)) {
            throw new CyclicDependencyException();
        }
        this.addNode(from);
        this.addNode(to);
        // @ts-expect-error hasEdge is a valid function of graphology
        if (!this.graph.hasEdge(fromId, toId)) {
            // @ts-expect-error addDirectedEdge is a valid function of graphology
            this.graph.addDirectedEdge(fromId, toId);
        }
    }

    /**
     * Removes a dependency (edge) between two ops.
     * @param from - The source node (depends on the target node).
     * @param to - The target node (is a dependency of the source node).
     */
    removeDependency(from: T, to: T): void {
        const fromId = this.getNodeId(from);
        const toId = this.getNodeId(to);
        // @ts-expect-error hasEdge is a valid function of graphology
        if (this.graph.hasEdge(fromId, toId)) {
            // @ts-expect-error dropEdge is a valid function of graphology
            this.graph.dropEdge(fromId, toId);
        }
    }

    /**
     * Gets all dependencies (inbound edges) of a node.
     * @param node - The node to get dependencies for.
     * @returns An array of ops that the given node depends on.
     */
    getDependencies(node: T): T[] {
        const nodeId = this.getNodeId(node);
        // @ts-expect-error hasNode is a valid function of graphology
        if (!this.graph.hasNode(nodeId)) {
            throw new Error(`Node does not exist in the graph: ${node}`);
        }

        return (
            this.graph
                // @ts-expect-error outboundNeighbors is a valid function of graphology
                .inboundNeighbors(nodeId)
                .map((id: string) => this.getNodeFromId(id))
        );
    }

    /**
     * Gets all directed edges (links) in the graph.
     * @returns An array of tuples representing all directed edges in the graph.
     */
    getAllLinks(): Array<[T, T]> {
        // @ts-expect-error mapDirectedEdges is a valid function of graphology
        return this.graph.mapDirectedEdges((edge: string, attributes: object, source: string, target: string): [T, T] => {
            return [this.getNodeFromId(source), this.getNodeFromId(target)];
        });
    }

    /**
     * Gets all dependents (outbound edges) of a node.
     * @param node - The node to get dependents for.
     * @returns An array of nodes that depend on the given node.
     */
    getDependents(node: T): T[] {
        const nodeId = this.getNodeId(node);
        // @ts-expect-error hasNode is a valid function of graphology
        if (!this.graph.hasNode(nodeId)) {
            throw new Error(`Node does not exist in the graph.`);
        }

        return (
            this.graph
                // @ts-expect-error inboundNeighbors is a valid function of graphology
                .outboundNeighbors(nodeId)
                .map((id: string) => this.getNodeFromId(id))
        );
    }

    getTopologicalOrder(): T[] {
        const sorted: string[] = [];
        const visited = new Set<string>();
        const tempMark = new Set<string>();

        const visit = (node: string): void => {
            if (tempMark.has(node)) {
                throw new Error(`Graph contains a cycle involving node: ${node}`);
            }
            if (!visited.has(node)) {
                tempMark.add(node);
                // @ts-ignore
                for (const neighbor of this.graph.outboundNeighbors(node)) {
                    visit(neighbor);
                }
                tempMark.delete(node);
                visited.add(node);
                sorted.push(node);
            }
        };

        // @ts-expect-error this is how nodes is accessed
        for (const node of this.graph.nodes()) {
            if (!visited.has(node)) {
                visit(node);
            }
        }

        return sorted.reverse().map((id) => this.getNodeFromId(id));
    }

    getUpstreamDependencies(node: T): Array<Set<T>> {
        const nodeId = this.getNodeId(node);
        // @ts-expect-error hasNope indeed exists on graphology graph
        if (!this.graph.hasNode(nodeId)) {
            throw new Error(`Node does not exist in the graph.`);
        }

        const visited = new Set<string>();
        const layers: Array<Set<T>> = [];
        const queue: Array<[string, number]> = [[nodeId, 0]];

        while (queue.length > 0) {
            const [currentNode, depth] = queue.shift()!;

            if (!visited.has(currentNode)) {
                visited.add(currentNode);

                if (layers.length <= depth) {
                    layers.push(new Set<T>());
                }

                layers[depth].add(this.getNodeFromId(currentNode));

                // @ts-ignore
                for (const neighbor of this.graph.inboundNeighbors(currentNode)) {
                    queue.push([neighbor, depth + 1]);
                }
            }
        }

        return layers;
    }

    getDownstreamDependents(node: T): Array<Set<T>> {
        const nodeId = this.getNodeId(node);
        // @ts-expect-error graphology obj will have hasNode
        if (!this.graph.hasNode(nodeId)) {
            throw new Error(`Node does not exist in the graph: ${node}`);
        }

        const visited = new Set<string>();
        const layers: Array<Set<T>> = [];
        const queue: Array<[string, number]> = [[nodeId, 0]];

        while (queue.length > 0) {
            const [currentNode, depth] = queue.shift()!;

            if (!visited.has(currentNode)) {
                visited.add(currentNode);

                if (layers.length <= depth) {
                    layers.push(new Set<T>());
                }

                layers[depth].add(this.getNodeFromId(currentNode));

                // @ts-expect-error graphology obj will have outboundNeighbors(...)
                for (const neighbor of this.graph.outboundNeighbors(currentNode)) {
                    queue.push([neighbor, depth + 1]);
                }
            }
        }

        return layers;
    }
}
