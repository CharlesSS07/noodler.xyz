export default {
  "nodes": [
    {
      "data": {
        "markdown": "# Welcome to noodler.xyz!\nA project by Charles Strauss (c-shelby-07@proton.me <-- reach out for support)\n\n* Pan around by clicking and dragging on the canvas.\n* Scroll to zoom.\n* Add a node by clicking on one of the buttons above. Wire nodes together to create flow functionality.\n\n## TODO:\n1. Node search tool --> KNN over embeddings of node code, name, and descriptions. Also just plain old text comparison.\n2. More standard nodes\n3. Oauth integrations to cut costs\n4. NodeAI for developing new nodes\n5. FlowAI for developing flows"
      },
      "id": "default-intro-node",
      "measured": {
        "height": 531,
        "width": 251
      },
      "position": {
        "x": -542.1575037147104,
        "y": 265.6820208023774
      },
      "selected": false,
      "type": "note",
      "dragging": false
    },
    {
      "data": {
        "nid": "image_loader"
      },
      "dragging": false,
      "id": "image_1750473207103_iqe1dac9s",
      "measured": {
        "height": 342,
        "width": 400
      },
      "position": {
        "x": 160.85540918739855,
        "y": 135.64241119464884
      },
      "selected": false,
      "type": "image"
    },
    {
      "data": {
        "nid": "image_loader"
      },
      "dragging": false,
      "id": "image_1750474392374_pzoc0h7re",
      "measured": {
        "height": 342,
        "width": 400
      },
      "position": {
        "x": 1799.5401671525674,
        "y": 57.54874247421313
      },
      "selected": false,
      "type": "image"
    },
    {
      "data": {
        "nid": "image_loader"
      },
      "dragging": true,
      "id": "image_1750474545182_fyemica1z",
      "measured": {
        "height": 197,
        "width": 282
      },
      "position": {
        "x": 2928.385336741936,
        "y": 8.374943953735453
      },
      "selected": false,
      "type": "image"
    },
    {
      "data": {
        "nid": "image_loader"
      },
      "dragging": false,
      "id": "image_1750474572917_ec1ksn90s",
      "measured": {
        "height": 197,
        "width": 282
      },
      "position": {
        "x": 3363.6683994756363,
        "y": 363.55207681279086
      },
      "selected": false,
      "type": "image"
    },
    {
      "data": {
        "errorMessage": "",
        "input": {
          "url": "https://noodler.xyz/demophotos/utah/IMG_9240.jpeg"
        },
        "nid": "fetch_url",
        "title": "Fetch URL"
      },
      "dragging": false,
      "id": "node_1750472673916_yyzglsnod",
      "measured": {
        "height": 173,
        "width": 181
      },
      "position": {
        "x": -179.65672454781378,
        "y": 159.00203173520958
      },
      "selected": false,
      "type": "node"
    },
    {
      "data": {
        "errorMessage": "While executing ai_image_editor id=node_1750474332059_78585pyj9:\nError during execution of ai_image_editor: Error: AI Image Editor node is not yet implemented. This node would use image-to-image models like InstructPix2Pix to apply text-based modifications to images.",
        "input": {
          "guidance_scale": 4.5,
          "image": "empty_jimp_image",
          "image_guidance_scale": 2,
          "instructions": "Remove the telephone wires.",
          "model": "timbrooks/instruct-pix2pix",
          "num_inference_steps": 79
        },
        "nid": "ai_image_editor",
        "title": "AI Image Editor"
      },
      "dragging": false,
      "id": "node_1750474332059_78585pyj9",
      "measured": {
        "height": 822,
        "width": 400
      },
      "position": {
        "x": 633.0991489688502,
        "y": 197.54964190408361
      },
      "selected": true,
      "type": "node"
    },
    {
      "data": {
        "errorMessage": "",
        "input": {
          "guidance_scale": 7.5,
          "image": "empty_jimp_image",
          "image_guidance_scale": 1.5,
          "instructions": "Add the UofU crimson dragon flying through the sky.",
          "model": "timbrooks/instruct-pix2pix",
          "num_inference_steps": 20
        },
        "nid": "ai_image_editor",
        "title": "AI Image Editor"
      },
      "dragging": false,
      "id": "node_1750474408442_d7jx9vwex",
      "measured": {
        "height": 604,
        "width": 224
      },
      "position": {
        "x": 2390.7301523989886,
        "y": 452.9602718745346
      },
      "selected": false,
      "type": "node"
    },
    {
      "data": {
        "errorMessage": "",
        "input": {
          "hue": 57.5,
          "img": "empty_jimp_image",
          "saturation": 16.400000000000002,
          "value": 5.2
        },
        "nid": "hsv",
        "title": "HSV Shift Change"
      },
      "dragging": false,
      "id": "node_1750474556976_j7sjt9yw9",
      "measured": {
        "height": 418,
        "width": 233
      },
      "position": {
        "x": 2970.8289824518474,
        "y": 391.8046384178448
      },
      "selected": false,
      "type": "node"
    }
  ],
  "edges": [
    {
      "id": "xy-edge__image_1750473207103_iqe1dac9simage-node_1750474332059_78585pyj9image",
      "selected": false,
      "source": "image_1750473207103_iqe1dac9s",
      "sourceHandle": "image",
      "target": "node_1750474332059_78585pyj9",
      "targetHandle": "image"
    },
    {
      "id": "xy-edge__node_1750474332059_78585pyj9edited_image-image_1750474392374_pzoc0h7reimageOrFileOrString",
      "selected": false,
      "source": "node_1750474332059_78585pyj9",
      "sourceHandle": "edited_image",
      "target": "image_1750474392374_pzoc0h7re",
      "targetHandle": "imageOrFileOrString"
    },
    {
      "id": "xy-edge__node_1750474332059_78585pyj9edited_image-node_1750474408442_d7jx9vweximage",
      "selected": false,
      "source": "node_1750474332059_78585pyj9",
      "sourceHandle": "edited_image",
      "target": "node_1750474408442_d7jx9vwex",
      "targetHandle": "image"
    },
    {
      "id": "xy-edge__node_1750474408442_d7jx9vwexedited_image-image_1750474545182_fyemica1zimageOrFileOrString",
      "selected": false,
      "source": "node_1750474408442_d7jx9vwex",
      "sourceHandle": "edited_image",
      "target": "image_1750474545182_fyemica1z",
      "targetHandle": "imageOrFileOrString"
    },
    {
      "id": "xy-edge__node_1750474408442_d7jx9vwexedited_image-node_1750474556976_j7sjt9yw9img",
      "selected": false,
      "source": "node_1750474408442_d7jx9vwex",
      "sourceHandle": "edited_image",
      "target": "node_1750474556976_j7sjt9yw9",
      "targetHandle": "img"
    },
    {
      "id": "xy-edge__node_1750474556976_j7sjt9yw9img-image_1750474572917_ec1ksn90simageOrFileOrString",
      "selected": false,
      "source": "node_1750474556976_j7sjt9yw9",
      "sourceHandle": "img",
      "target": "image_1750474572917_ec1ksn90s",
      "targetHandle": "imageOrFileOrString"
    },
    {
      "id": "xy-edge__node_1750472673916_yyzglsnodtext-image_1750473207103_iqe1dac9simageOrFileOrString",
      "source": "node_1750472673916_yyzglsnod",
      "sourceHandle": "text",
      "target": "image_1750473207103_iqe1dac9s",
      "targetHandle": "imageOrFileOrString"
    }
  ],
  "metadata": {
    "exportedAt": "2025-06-23T03:08:45.064Z",
    "projectId": "ai_image_editing",
    "title": "AI Image Editing Demo"
  }
}