export default {
  "nodes": [
    {
      "id": "default-intro-node",
      "data": {
        "markdown": "# Welcome to noodler.xyz!\nA project by Charles Strauss (c-shelby-07@proton.me <-- reach out for support)\n\n* Pan around by clicking and dragging on the canvas.\n* Scroll to zoom.\n* Add a node by clicking on one of the buttons above. Wire nodes together to create flow functionality.\n\n## TODO:\n1. Node search tool --> KNN over embeddings of node code, name, and descriptions. Also just plain old text comparison.\n2. More standard nodes\n3. Oauth integrations to cut costs\n4. NodeAI for developing new nodes\n5. FlowAI for developing flows"
      },
      "measured": {
        "height": 531,
        "width": 251
      },
      "position": {
        "x": 0,
        "y": 100
      },
      "selected": false,
      "type": "note"
    },
    {
      "id": "image_1750473207103_iqe1dac9s",
      "data": {
        "nid": "image_loader"
      },
      "dragging": false,
      "measured": {
        "height": 196,
        "width": 281
      },
      "position": {
        "x": 965.1527836274951,
        "y": 378.12262632395755
      },
      "selected": false,
      "type": "image"
    },
    {
      "id": "image_1750474392374_pzoc0h7re",
      "data": {
        "nid": "image_loader"
      },
      "dragging": false,
      "measured": {
        "height": 196,
        "width": 281
      },
      "position": {
        "x": 2139.5401671525674,
        "y": -19.73889636928007
      },
      "selected": false,
      "type": "image"
    },
    {
      "id": "image_1750474545182_fyemica1z",
      "data": {
        "nid": "image_loader"
      },
      "dragging": true,
      "measured": {
        "height": 196,
        "width": 281
      },
      "position": {
        "x": 2928.385336741936,
        "y": 8.374943953735453
      },
      "selected": false,
      "type": "image"
    },
    {
      "id": "image_1750474572917_ec1ksn90s",
      "data": {
        "nid": "image_loader"
      },
      "dragging": false,
      "measured": {
        "height": 196,
        "width": 281
      },
      "position": {
        "x": 3363.6683994756363,
        "y": 363.55207681279086
      },
      "selected": false,
      "type": "image"
    },
    {
      "id": "node_1750472673916_yyzglsnod",
      "data": {
        "input": {
          "url": "http://noodler.xyz/demophotos/utah/IMG_9240.jpeg"
        },
        "nid": "fetch_url",
        "title": "Fetch URL"
      },
      "dragging": false,
      "measured": {
        "height": 315,
        "width": 400
      },
      "position": {
        "x": 398.11874121573817,
        "y": 375.65561195601555
      },
      "selected": false,
      "type": "node"
    },
    {
      "id": "node_1750474332059_78585pyj9",
      "data": {
        "errorMessage": "",
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
      "dragging": true,
      "measured": {
        "height": 599,
        "width": 231
      },
      "position": {
        "x": 1725.5358481544022,
        "y": 402.7008507336894
      },
      "selected": false,
      "type": "node"
    },
    {
      "id": "node_1750474408442_d7jx9vwex",
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
      "measured": {
        "height": 599,
        "width": 231
      },
      "position": {
        "x": 2478.0012247039585,
        "y": 415.2750361064795
      },
      "selected": false,
      "type": "node"
    },
    {
      "id": "node_1750474556976_j7sjt9yw9",
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
      "measured": {
        "height": 414,
        "width": 239
      },
      "position": {
        "x": 2970.8289824518474,
        "y": 391.8046384178448
      },
      "selected": false,
      "type": "node"
    },
    {
      "id": "textTemplate_1750473184312_xxon8glam",
      "data": {
        "input": {
          "template": "data:image/jpeg;base64,@fillin_variable"
        },
        "nid": "template"
      },
      "dragging": false,
      "measured": {
        "height": 131,
        "width": 375
      },
      "position": {
        "x": 673.5136173735513,
        "y": 217.37656953090345
      },
      "selected": false,
      "type": "textTemplate"
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
      "id": "xy-edge__node_1750472673916_yyzglsnodtext-textTemplate_1750473184312_xxon8glamfillin_variable",
      "selected": false,
      "source": "node_1750472673916_yyzglsnod",
      "sourceHandle": "text",
      "target": "textTemplate_1750473184312_xxon8glam",
      "targetHandle": "fillin_variable"
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
      "source": "node_1750474408442_d7jx9vwex",
      "sourceHandle": "edited_image",
      "target": "image_1750474545182_fyemica1z",
      "targetHandle": "imageOrFileOrString"
    },
    {
      "id": "xy-edge__node_1750474408442_d7jx9vwexedited_image-node_1750474556976_j7sjt9yw9img",
      "source": "node_1750474408442_d7jx9vwex",
      "sourceHandle": "edited_image",
      "target": "node_1750474556976_j7sjt9yw9",
      "targetHandle": "img"
    },
    {
      "id": "xy-edge__node_1750474556976_j7sjt9yw9img-image_1750474572917_ec1ksn90simageOrFileOrString",
      "source": "node_1750474556976_j7sjt9yw9",
      "sourceHandle": "img",
      "target": "image_1750474572917_ec1ksn90s",
      "targetHandle": "imageOrFileOrString"
    },
    {
      "id": "xy-edge__textTemplate_1750473184312_xxon8glamtext-image_1750473207103_iqe1dac9simageOrFileOrString",
      "selected": false,
      "source": "textTemplate_1750473184312_xxon8glam",
      "sourceHandle": "text",
      "target": "image_1750473207103_iqe1dac9s",
      "targetHandle": "imageOrFileOrString"
    }
  ],
  "metadata": {
    "exportedAt": "2025-06-21T22:41:27.978Z",
    "title": "AI Image Editing Demo"
  }
}