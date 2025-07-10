import type {
  NodeBluePrintControllerFactoryInterface} from "../NodeBluePrint.js";
import {
  FirestoreNodeBluePrintControllerFactoryInterface,
} from "../FirestoreNodeBluePrint.js";
import {
  NumberSocketParamsBuilder,
  GenericSocketParamsBuilder,
} from "../SocketParamBuilders.js";
import {STANDARD_DATATYPES} from "$shared/SocketDataTypes";

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

/**
 * Creates and configures basicMathNodes nodes.
 * @return {Promise<void>} Promise that resolves when nodes are created
 */
export async function basicMathNodes() {
  // Add node
  const addNode =
        await nodeBluePrintController.initOfficialNodeBluePrint("add");
  addNode.title = "Add Numbers";
  addNode.documentation = "Adds two numbers together";
  addNode.tags = [
    "math",
    "arithmetic",
    "basic",
    "calculator",
    "addition",
    "numbers",
    "computation",
    "binary-operation",
    "fundamental",
    "elementary",
  ];
  addNode.categories = [
    "/math/arithmetic",
    "/math/basic",
    "/computation/binary-operation",
  ];

  await addNode.newInputSocket("a", {
    label: "Number A",
    documentation: "First number to add",
    type: STANDARD_DATATYPES.NUMBER,
    params: new NumberSocketParamsBuilder(0).build()});

  await addNode.newInputSocket("b", {
    label: "Number B",
    documentation: "Second number to add",
    type: STANDARD_DATATYPES.NUMBER,
    params: new NumberSocketParamsBuilder(0).build()});

  await addNode.newOutputSocket("result", {
    label: "Sum",
    documentation: "The sum of A + B",
    type: STANDARD_DATATYPES.NUMBER});

  addNode.code = `
        const a = inputs.a ?? 0;
        const b = inputs.b ?? 0;
        const result = a + b;
        outputs.set('result', result);
    `;
  addNode.$_per_run = 0; // Local computation only

  // Subtract node
  const subtractNode =
        await nodeBluePrintController.initOfficialNodeBluePrint("subtract");
  subtractNode.title = "Subtract Numbers";
  subtractNode.documentation = "Subtracts second number from first number";
  subtractNode.tags = [
    "math",
    "arithmetic",
    "basic",
    "calculator",
    "subtraction",
    "numbers",
    "computation",
    "binary-operation",
    "fundamental",
    "elementary",
  ];
  subtractNode.categories = [
    "/math/arithmetic",
    "/math/basic",
    "/computation/binary-operation",
  ];

  await subtractNode.newInputSocket("a", {
    label: "Number A",
    documentation: "Number to subtract from",
    type: STANDARD_DATATYPES.NUMBER,
    params: new NumberSocketParamsBuilder(0).build()});

  await subtractNode.newInputSocket("b", {
    label: "Number B",
    documentation: "Number to subtract",
    type: STANDARD_DATATYPES.NUMBER,
    params: new NumberSocketParamsBuilder(0).build()});

  await subtractNode.newOutputSocket("result", {
    label: "Difference",
    documentation: "The result of A - B",
    type: STANDARD_DATATYPES.NUMBER});

  subtractNode.code = `
        const a = inputs.a ?? 0;
        const b = inputs.b ?? 0;
        const result = a - b;
        outputs.set('result', result);
    `;
  subtractNode.$_per_run = 0; // Local computation only

  // Multiply node
  const multiplyNode =
        await nodeBluePrintController.initOfficialNodeBluePrint("multiply");
  multiplyNode.title = "Multiply Numbers";
  multiplyNode.documentation = "Multiplies two numbers together";
  multiplyNode.tags = [
    "math",
    "arithmetic",
    "basic",
    "calculator",
    "multiplication",
    "numbers",
    "computation",
    "binary-operation",
    "fundamental",
    "elementary",
    "scaling",
  ];
  multiplyNode.categories = [
    "/math/arithmetic",
    "/math/basic",
    "/computation/binary-operation",
  ];

  await multiplyNode.newInputSocket("a", {
    label: "Number A",
    documentation: "First number to multiply",
    type: STANDARD_DATATYPES.NUMBER,
    params: new NumberSocketParamsBuilder(1).build()});

  await multiplyNode.newInputSocket("b", {
    label: "Number B",
    documentation: "Second number to multiply",
    type: STANDARD_DATATYPES.NUMBER,
    params: new NumberSocketParamsBuilder(1).build()});

  await multiplyNode.newOutputSocket("result", {
    label: "Product",
    documentation: "The product of A * B",
    type: STANDARD_DATATYPES.NUMBER});

  multiplyNode.code = `
        const a = inputs.a ?? 1;
        const b = inputs.b ?? 1;
        const result = a * b;
        outputs.set('result', result);
    `;
  multiplyNode.$_per_run = 0; // Local computation only

  // Divide node
  const divideNode =
        await nodeBluePrintController.initOfficialNodeBluePrint("divide");
  divideNode.title = "Divide Numbers";
  divideNode.documentation = "Divides first number by second number";
  divideNode.tags = [
    "math",
    "arithmetic",
    "basic",
    "calculator",
    "division",
    "numbers",
    "computation",
    "binary-operation",
    "fundamental",
    "elementary",
    "ratio",
    "quotient",
  ];
  divideNode.categories = [
    "/math/arithmetic",
    "/math/basic",
    "/computation/binary-operation",
  ];

  await divideNode.newInputSocket("a", {
    label: "Dividend",
    documentation: "Number to be divided",
    type: STANDARD_DATATYPES.NUMBER,
    params: new NumberSocketParamsBuilder(1).build()});

  await divideNode.newInputSocket("b", {
    label: "Divisor",
    documentation: "Number to divide by",
    type: STANDARD_DATATYPES.NUMBER,
    params: new NumberSocketParamsBuilder(1).build()});

  await divideNode.newOutputSocket("result", {
    label: "Quotient",
    documentation: "The result of A / B",
    type: STANDARD_DATATYPES.NUMBER});

  divideNode.code = `
        const a = inputs.a ?? 1;
        const b = inputs.b ?? 1;
        if (b === 0) {
            throw new Error('Division by zero is not allowed');
        }
        const result = a / b;
        outputs.set('result', result);
    `;
  divideNode.$_per_run = 0; // Local computation only

  // Countdown Passthrough node
  const countdownNode =
        await nodeBluePrintController.initOfficialNodeBluePrint(
          "countdown-passthrough"
        );
  countdownNode.title = "Wait Seconds then Execute";
  countdownNode.documentation = "Waits for a specified number of seconds " +
    "before passing the input value to the output";
  countdownNode.tags = [
    "timing",
    "delay",
    "wait",
    "countdown",
    "passthrough",
    "flow-control",
    "utility",
    "async",
    "time",
    "duration",
  ];
  countdownNode.categories = [
    "/utility/timing",
    "/flow-control/delay",
    "/async/timing",
  ];

  await countdownNode.newInputSocket("input", {
    label: "Input",
    documentation: "The value to pass through after the countdown",
    type: STANDARD_DATATYPES.UNKNOWN,
    params: new GenericSocketParamsBuilder(null).build(),
  });

  await countdownNode.newInputSocket("seconds", {
    label: "Countdown Seconds",
    documentation: "Number of seconds to wait before passing through input",
    type: STANDARD_DATATYPES.NUMBER,
    params: new NumberSocketParamsBuilder(3).build(),
  });

  await countdownNode.newOutputSocket("output", {
    label: "Output",
    documentation: "The input value after the countdown completes",
    type: STANDARD_DATATYPES.UNKNOWN,
  });

  countdownNode.code = `
        const inputValue = inputs.input;
        const seconds = inputs.seconds ?? 3;
        
        if (seconds < 0) {
            throw new Error('Countdown seconds must be non-negative');
        }
        
        // Create a promise that resolves after the specified seconds
        await new Promise(resolve => {
            let remainingSeconds = Math.ceil(seconds);
            
            console.log(\`Countdown starting: \${remainingSeconds} seconds\`);
            
            const countdownInterval = setInterval(() => {
                remainingSeconds--;
                if (remainingSeconds > 0) {
                    console.log(\`Countdown: \${remainingSeconds}s left\`);
                } else {
                    console.log('Countdown complete!');
                    clearInterval(countdownInterval);
                    resolve();
                }
            }, 1000);
            
            // Handle case where seconds is less than 1
            if (seconds < 1) {
                setTimeout(() => {
                    clearInterval(countdownInterval);
                    resolve();
                }, seconds * 1000);
            }
        });
        
        // Pass through the input value after countdown completes
        outputs.set('output', inputValue);
    `;
  countdownNode.$_per_run = 0; // Local computation only (timer)
}
