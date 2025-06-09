/**
 * Unit tests for the Interpreter.ts execution engine
 * Tests basic math operations and dependency resolution
 */

import { beforeEach, describe, expect, test } from "vitest";
import { executeFlowGraph, OutputSocketDataCache } from "./Interpreter";
import type { Node, Edge } from "@xyflow/svelte";

describe("Interpreter Flow Graph Tests", () => {
  let mockNodes: Node[];
  let mockEdges: Edge[];

  beforeEach(() => {
    // Reset test data before each test
    mockNodes = [];
    mockEdges = [];
  });

  test("Simple addition: 9 + 6 = 15", async () => {
    // Create nodes for the calculation: 9 + 6
    mockNodes = [
      {
        id: 'const-9',
        type: 'node',
        position: { x: 0, y: 0 },
        data: {
          nid: 'official_node_add/versions/official:1749481786062',
          input: { a: 9, b: 6 },
          output: {}
        }
      }
    ];

    // No edges needed for a single node with internal inputs
    mockEdges = [];

    // Execute the flow graph
    await executeFlowGraph('const-9', mockNodes, mockEdges);

    // The result should be computed and stored in the node's output
    expect(mockNodes[0].data.output.result).toBe(15);
  });

  test("Chained addition: 9 + (5 + 6) = 20", async () => {
    // Create nodes for the calculation: 9 + (5 + 6)
    mockNodes = [
      {
        id: 'add-inner',
        type: 'node',
        position: { x: 0, y: 0 },
        data: {
          nid: 'official_node_add',
          input: { a: 5, b: 6 },
          output: {}
        }
      },
      {
        id: 'add-outer',
        type: 'node',
        position: { x: 100, y: 0 },
        data: {
          nid: 'official_node_add',
          input: { a: 9 },
          output: {}
        }
      }
    ];

    // Connect the inner addition result to the outer addition
    mockEdges = [
      {
        id: 'e1',
        source: 'add-inner',
        target: 'add-outer',
        sourceHandle: 'result',
        targetHandle: 'b'
      }
    ];

    // Execute the flow graph starting from the final node
    await executeFlowGraph('add-outer', mockNodes, mockEdges);

    // Check intermediate result: 5 + 6 = 11
    expect(mockNodes[0].data.output.result).toBe(11);
    
    // Check final result: 9 + 11 = 20
    expect(mockNodes[1].data.output.result).toBe(20);
  });

  test("Complex calculation: (9 + (5 + 6)) * 5 = 100", async () => {
    mockNodes = [
      {
        id: 'add-inner',
        type: 'node',
        position: { x: 0, y: 0 },
        data: {
          nid: 'official_node_add',
          input: { a: 5, b: 6 },
          output: {}
        }
      },
      {
        id: 'add-middle',
        type: 'node',
        position: { x: 100, y: 0 },
        data: {
          nid: 'official_node_add',
          input: { a: 9 },
          output: {}
        }
      },
      {
        id: 'multiply-final',
        type: 'node',
        position: { x: 200, y: 0 },
        data: {
          nid: 'official_node_multiply',
          input: { b: 5 },
          output: {}
        }
      }
    ];

    mockEdges = [
      {
        id: 'e1',
        source: 'add-inner',
        target: 'add-middle',
        sourceHandle: 'result',
        targetHandle: 'b'
      },
      {
        id: 'e2',
        source: 'add-middle',
        target: 'multiply-final',
        sourceHandle: 'result',
        targetHandle: 'a'
      }
    ];

    await executeFlowGraph('multiply-final', mockNodes, mockEdges);

    // Check all intermediate results
    expect(mockNodes[0].data.output.result).toBe(11); // 5 + 6
    expect(mockNodes[1].data.output.result).toBe(20); // 9 + 11
    expect(mockNodes[2].data.output.result).toBe(100); // 20 * 5
  });

  test("Division operation: 20 / 4 = 5", async () => {
    mockNodes = [
      {
        id: 'divide-test',
        type: 'node',
        position: { x: 0, y: 0 },
        data: {
          nid: 'official_node_divide',
          input: { a: 20, b: 4 },
          output: {}
        }
      }
    ];

    mockEdges = [];

    await executeFlowGraph('divide-test', mockNodes, mockEdges);

    expect(mockNodes[0].data.output.result).toBe(5);
  });

  test("Division by zero should throw error", async () => {
    mockNodes = [
      {
        id: 'divide-zero',
        type: 'node',
        position: { x: 0, y: 0 },
        data: {
          nid: 'official_node_divide',
          input: { a: 10, b: 0 },
          output: {}
        }
      }
    ];

    mockEdges = [];

    // This should throw an error
    await expect(executeFlowGraph('divide-zero', mockNodes, mockEdges))
      .rejects.toThrow('Division by zero is not allowed');
  });

  test("Subtraction operation: 15 - 7 = 8", async () => {
    mockNodes = [
      {
        id: 'subtract-test',
        type: 'node',
        position: { x: 0, y: 0 },
        data: {
          nid: 'official_node_subtract',
          input: { a: 15, b: 7 },
          output: {}
        }
      }
    ];

    mockEdges = [];

    await executeFlowGraph('subtract-test', mockNodes, mockEdges);

    expect(mockNodes[0].data.output.result).toBe(8);
  });

  test("Multiple independent calculations", async () => {
    mockNodes = [
      {
        id: 'add-1',
        type: 'node',
        position: { x: 0, y: 0 },
        data: {
          nid: 'official_node_add',
          input: { a: 3, b: 4 },
          output: {}
        }
      },
      {
        id: 'add-2',
        type: 'node',
        position: { x: 0, y: 100 },
        data: {
          nid: 'official_node_add',
          input: { a: 10, b: 20 },
          output: {}
        }
      },
      {
        id: 'multiply-combined',
        type: 'node',
        position: { x: 200, y: 50 },
        data: {
          nid: 'official_node_multiply',
          input: {},
          output: {}
        }
      }
    ];

    mockEdges = [
      {
        id: 'e1',
        source: 'add-1',
        target: 'multiply-combined',
        sourceHandle: 'result',
        targetHandle: 'a'
      },
      {
        id: 'e2',
        source: 'add-2',
        target: 'multiply-combined',
        sourceHandle: 'result',
        targetHandle: 'b'
      }
    ];

    await executeFlowGraph('multiply-combined', mockNodes, mockEdges);

    // First addition: 3 + 4 = 7
    expect(mockNodes[0].data.output.result).toBe(7);
    
    // Second addition: 10 + 20 = 30
    expect(mockNodes[1].data.output.result).toBe(30);
    
    // Final multiplication: 7 * 30 = 210
    expect(mockNodes[2].data.output.result).toBe(210);
  });

  test("Empty dependency graph should work", async () => {
    mockNodes = [
      {
        id: 'standalone',
        type: 'node',
        position: { x: 0, y: 0 },
        data: {
          nid: 'official_node_add',
          input: { a: 1, b: 1 },
          output: {}
        }
      }
    ];

    mockEdges = [];

    await executeFlowGraph('standalone', mockNodes, mockEdges);

    expect(mockNodes[0].data.output.result).toBe(2);
  });
});
