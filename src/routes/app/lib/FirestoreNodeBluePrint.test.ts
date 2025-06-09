/**
 * Unit tests for the reactive FirestoreNodeBluePrintController
 * Tests the synchronous getter/setter behavior with reactive Firestore updates
 */

import { beforeEach, describe, expect, test } from "vitest";
import { FirestoreNodeBluePrintController } from "./FirestoreNodeBluePrint";

describe("FirestoreNodeBluePrintController Reactive Tests", () => {
  let controller: FirestoreNodeBluePrintController;

  beforeEach(() => {
    // Create a new controller for each test
    const nid = `test_node/versions/test_user:${Date.now()}`;
    controller = new FirestoreNodeBluePrintController(nid);
  });

  test("should have synchronous title getter/setter", () => {
    // Initially should have default title
    expect(controller.title).toBe('Untitled Operation');
    
    // Set a new title
    controller.title = 'Test Node Title';
    
    // Should immediately reflect the new title
    expect(controller.title).toBe('Test Node Title');
  });

  test("should have synchronous documentation getter/setter", () => {
    // Initially should have empty documentation
    expect(controller.documentation).toBe('');
    
    // Set documentation
    controller.documentation = 'This is a test node for testing purposes.';
    
    // Should immediately reflect the new documentation
    expect(controller.documentation).toBe('This is a test node for testing purposes.');
  });

  test("should have synchronous code getter/setter", () => {
    // Initially should have default code
    expect(controller.code).toBe('console.log("Hello World");');
    
    // Set new code
    controller.code = 'console.log("Test code");';
    
    // Should immediately reflect the new code
    expect(controller.code).toBe('console.log("Test code");');
  });

  test("should handle input sockets synchronously", async () => {
    // Initially should have empty socket arrays
    expect(controller.inputSocketKeys).toEqual([]);
    expect(controller.inputSockets).toEqual([]);
    
    // Add an input socket
    await controller.newInputSocket('test_input', {
      label: 'Test Input',
      documentation: 'A test input socket',
      type: 'string',
      params: { defaultValue: 'test' }
    });
    
    // Should immediately reflect in synchronous getters
    expect(controller.inputSocketKeys).toEqual(['test_input']);
    expect(controller.inputSockets).toHaveLength(1);
    expect(controller.inputSockets[0].label).toBe('Test Input');
  });

  test("should handle output sockets synchronously", async () => {
    // Initially should have empty socket arrays
    const outputKeys = await controller.outputSocketKeys();
    expect(outputKeys).toEqual([]);
    expect(controller.outputSockets).toEqual([]);
    
    // Add an output socket
    await controller.newOutputSocket('test_output', {
      label: 'Test Output',
      documentation: 'A test output socket',
      type: 'string'
    });
    
    // Should immediately reflect in synchronous getters
    const newOutputKeys = await controller.outputSocketKeys();
    expect(newOutputKeys).toEqual(['test_output']);
    expect(controller.outputSockets).toHaveLength(1);
    expect(controller.outputSockets[0].label).toBe('Test Output');
  });

  test("should maintain reactive model consistency", async () => {
    // Set multiple properties
    controller.title = 'Complex Test Node';
    controller.documentation = 'This node tests multiple features.';
    controller.code = 'outputs.set("result", inputs.a + inputs.b);';
    
    await controller.newInputSocket('a', {
      label: 'Input A',
      documentation: 'First input',
      type: 'number',
      params: { defaultValue: 0 }
    });
    
    await controller.newInputSocket('b', {
      label: 'Input B', 
      documentation: 'Second input',
      type: 'number',
      params: { defaultValue: 0 }
    });
    
    await controller.newOutputSocket('result', {
      label: 'Result',
      documentation: 'Sum of inputs',
      type: 'number'
    });
    
    // All properties should be immediately accessible
    expect(controller.title).toBe('Complex Test Node');
    expect(controller.documentation).toBe('This node tests multiple features.');
    expect(controller.code).toBe('outputs.set("result", inputs.a + inputs.b);');
    expect(controller.inputSocketKeys).toEqual(['a', 'b']);
    expect(controller.outputSockets).toHaveLength(1);
  });

  test("should properly clean up subscriptions", () => {
    // Create and destroy controller
    const nid = `cleanup_test/versions/test_user:${Date.now()}`;
    const testController = new FirestoreNodeBluePrintController(nid);
    
    // Should work normally
    testController.title = 'Cleanup Test';
    expect(testController.title).toBe('Cleanup Test');
    
    // Destroy should not throw
    expect(() => testController.destroy()).not.toThrow();
  });
});