const edgeStyle = 'stroke:#D2D2D2; stroke-width:4;';

export const nodesVersion2 = [
    {
        id: 'constraints_instruction_join_text_key_features_to_list',
        type: 'node',
        data: {
            nid: 'official_node_join_text',
            input: {
                text: '',
                text1: '',
                text2: '',
                text3: '',
                text4: '',
            },
            currentText: '',
            output: {
                text: '',
            },
        },
        position: {
            x: 1156,
            y: 860,
        },
        width: 200,
        height: 50,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1095,
        x: 1162,
        y: 652,
        measured: {
            width: 200,
            height: 50,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'product_name',
        type: 'markdownTextEditor',
        data: {
            input: {
                inputText: 'noodler.xyz',
            },
        },
        position: {
            x: 254,
            y: 472,
        },
        width: 200,
        height: 50,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1069,
        x: 762,
        y: 218,
        measured: {
            width: 200,
            height: 50,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'target_audience',
        type: 'markdownTextEditor',
        data: {
            input: {
                inputText: 'Artists, Gen AI Ops, and AI Engineers',
            },
        },
        position: {
            x: 234,
            y: 318,
        },
        width: 250,
        height: 50,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1071,
        x: 712,
        y: 404,
        measured: {
            width: 250,
            height: 50,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'campaign_goal',
        type: 'markdownTextEditor',
        data: {
            input: {
                inputText:
                    'Entertain, demonstrate product potential, build connections',
            },
        },
        position: {
            x: 214,
            y: 184,
        },
        width: 300,
        height: 50,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1073,
        x: 662,
        y: 524,
        measured: {
            width: 300,
            height: 50,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'key_features',
        type: 'markdownTextEditor',
        data: {
            input: {
                inputText:
                    'Flow-designer, no-code, no setup, plug-n-play interface, explainable, extendable',
            },
        },
        position: {
            x: 296,
            y: 1140,
        },
        width: 400,
        height: 50,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1075,
        x: 12,
        y: 644,
        measured: {
            width: 400,
            height: 50,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'call_to_action',
        type: 'markdownTextEditor',
        data: {
            input: {
                inputText:
                    'build with me, democratize AI design, create art, visualize your code',
            },
        },
        position: {
            x: 1648,
            y: 1202,
        },
        width: 350,
        height: 50,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1077,
        x: 612,
        y: 984,
        measured: {
            width: 350,
            height: 50,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'tone_and_style',
        type: 'markdownTextEditor',
        data: {
            input: {
                inputText: 'engaging, informative, slightly humorous',
            },
        },
        position: {
            x: 200,
            y: 710,
        },
        width: 280,
        height: 50,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1079,
        x: 132,
        y: 884,
        measured: {
            width: 280,
            height: 50,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'word_count_range',
        type: 'markdownTextEditor',
        data: {
            input: {
                inputText: '250-300 words',
            },
        },
        position: {
            x: 280,
            y: 806,
        },
        width: 180,
        height: 50,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1081,
        x: 232,
        y: 764,
        measured: {
            width: 180,
            height: 50,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'output_format',
        type: 'markdownTextEditor',
        data: {
            input: {
                inputText: 'linkedin connection request',
            },
        },
        position: {
            x: 246,
            y: 598,
        },
        width: 250,
        height: 50,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1083,
        x: 712,
        y: 54,
        measured: {
            width: 250,
            height: 50,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'role_instruction',
        type: 'markdownTextEditor',
        data: {
            input: {
                inputText:
                    'You are an expert marketing content creator specializing in persuasive and engaging copy. Your task is to craft compelling content for a specific product launch.',
            },
        },
        position: {
            x: 2042,
            y: 462,
        },
        width: 500,
        height: 80,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1085,
        x: 1062,
        y: 332,
        measured: {
            width: 500,
            height: 80,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'context_instruction',
        type: 'textTemplate',
        data: {
            input: {
                text: '',
            },
            template:
                'We are launching a new product called "@product_name". The primary goal of this campaign is to @campaign_goal. Our target audience is: @target_audience.',
            output: {
                text: 'We are launching a new product called "@product_name". The primary goal of this campaign is to @campaign_goal. Our target audience is: @target_audience.',
            },
        },
        position: {
            x: 1065,
            y: 362,
        },
        width: 400,
        height: 100,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1087,
        x: 1087,
        y: 482,
        measured: {
            width: 400,
            height: 100,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'task_instruction',
        type: 'textTemplate',
        data: {
            input: {
                text: '',
            },
            template:
                'Your main objective is to write a detailed and persuasive @output_format that highlights the benefits of "@product_name".',
            output: {
                text: 'Your main objective is to write a detailed and persuasive @output_format that highlights the benefits of "@product_name".',
            },
        },
        position: {
            x: 1111.3333333333333,
            y: 524,
        },
        width: 400,
        height: 80,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1089,
        x: 1095.3333333333333,
        y: 182,
        measured: {
            width: 400,
            height: 80,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'constraints_instruction',
        type: 'textTemplate',
        data: {
            input: {
                text: '',
            },
            template:
                'Please adhere to the following guidelines:\nThe tone should be @tone_and_style.\nThe content should be approximately @word_count_range long.\nFocus on explaining *how* the product solves a problem for the target audience.\nIntegrate the following key features/benefits seamlessly:',
            output: {
                text: 'Please adhere to the following guidelines:\nThe tone should be @tone_and_style.\nThe content should be approximately @word_count_range long.\nFocus on explaining *how* the product solves a problem for the target audience.\nIntegrate the following key features/benefits seamlessly:',
            },
        },
        position: {
            x: 706,
            y: 782,
        },
        width: 450,
        height: 150,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1091,
        x: 512,
        y: 764,
        measured: {
            width: 450,
            height: 150,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'key_features_to_list',
        type: 'textTransformLLM',
        data: {
            input: {
                text: '',
            },
            currentText: '',
            output: {
                text: '',
            },
        },
        position: {
            x: 805,
            y: 1088,
        },
        width: 200,
        height: 50,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1093,
        x: 637,
        y: 644,
        measured: {
            width: 200,
            height: 50,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'inclusion_instruction',
        type: 'textTemplate',
        data: {
            input: {
                text: '',
            },
            template:
                "- Ensure the call to action is prominent: '@call_to_action'.\n- Avoid jargon where possible, or explain it clearly if necessary.\n- Emphasize value proposition over just features.",
            output: {
                text: "- Ensure the call to action is prominent: '@call_to_action'.\n- Avoid jargon where possible, or explain it clearly if necessary.\n- Emphasize value proposition over just features.",
            },
        },
        position: {
            x: 1804,
            y: 995,
        },
        width: 400,
        height: 100,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1097,
        x: 1112,
        y: 959,
        measured: {
            width: 400,
            height: 100,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'format_specification',
        type: 'textTemplate',
        data: {
            input: {
                text: '',
            },
            template:
                'The output must be a well-structured @output_format with a catchy title, an engaging introduction, several body paragraphs, and a strong conclusion.',
            output: {
                text: 'The output must be a well-structured @output_format with a catchy title, an engaging introduction, several body paragraphs, and a strong conclusion.',
            },
        },
        position: {
            x: 1093.3333333333333,
            y: 682,
        },
        width: 400,
        height: 100,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1099,
        x: 1095.3333333333333,
        y: 12,
        measured: {
            width: 400,
            height: 100,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'full_prompt',
        type: 'textTemplate',
        data: {
            input: {
                text: '',
            },
            template:
                '### Role:\n@role_instruction\n\n\n### Context:@context_instruction\n\n\n### Task:\n\n\n@task_instruction\n\n\n### Guidelines & Constraints:\n@constraints_instruction}\n\n@inclusion_instruction\n\n### Output Format:\n@format_specification\n\n\n### BEGIN CONTENT GENERATION ###\n',
            output: {
                text: '### Role:\n@role_instruction\n\n\n### Context:@context_instruction\n\n\n### Task:\n\n\n@task_instruction\n\n\n### Guidelines & Constraints:\n@constraints_instruction}\n\n@inclusion_instruction\n\n### Output Format:\n@format_specification\n\n\n### BEGIN CONTENT GENERATION ###\n',
            },
        },
        position: {
            x: 2200,
            y: 597,
        },
        width: 500,
        height: 300,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1101,
        x: 1662,
        y: 243,
        measured: {
            width: 500,
            height: 300,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'full_prompt_viewer',
        type: 'textEditor',
        data: {
            input: {
                text: '',
            },
            currentText: '',
            output: {
                text: '',
            },
        },
        position: {
            x: 2800,
            y: 597,
        },
        width: 500,
        height: 300,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1101,
        x: 1662,
        y: 243,
        measured: {
            width: 500,
            height: 300,
        },
        selected: false,
        dragging: false,
    },
    {
        id: 'note',
        type: 'note',
        data: {
            markdown:
                '# Noodler.xyz allows you to build with AI visually\n\nThe following is a prompt composition. It takes several variables (product_name, target_audience, campaign_goal, key_features, call_to_action, and more), and preprocesses these with templates and other LLM tools. It then compiles these into the final prompt, and sends this off to a Huggingface LLM. We then use another LLM to render an HTML webpage from this output.',
        },
        position: {
            x: 2200,
            y: 70.70263146508717,
        },
        width: 350,
        height: 250,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1103,
        x: 37,
        y: 1004,
        measured: {
            width: 350,
            height: 250,
        },
        selected: true,
        dragging: false,
    },
    {
        id: 'note2',
        type: 'note',
        data: {
            markdown: '# This is the compiled prompt.',
        },
        position: {
            x: 2900,
            y: 360,
        },
        width: 350,
        height: 250,
        targetPosition: 'left',
        sourcePosition: 'right',
        $H: 1103,
        x: 37,
        y: 1004,
        measured: {
            width: 350,
            height: 250,
        },
        selected: true,
        dragging: false,
    },
];

export const edgesVersion2 = [
    {
        id: 'a1',
        source: 'full_prompt',
        sourceHandle: 'output',
        target: 'full_prompt_viewer',
        targetHandle: 'input',
        style: 'stroke:#D2D2D2; stroke-width:4;',
    },
    {
        id: '1',
        source: 'product_name',
        target: 'context_instruction',
        targetHandle: 'product_name',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'product_name',
        sections: [
            {
                id: '1_s0',
                startPoint: {
                    x: 962,
                    y: 251,
                },
                endPoint: {
                    x: 1087,
                    y: 507,
                },
                bendPoints: [
                    {
                        x: 982,
                        y: 251,
                    },
                    {
                        x: 982,
                        y: 507,
                    },
                ],
                incomingShape: 'product_name',
                outgoingShape: 'context_instruction',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: '2',
        source: 'product_name',
        target: 'task_instruction',
        targetHandle: 'product_name',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'product_name',
        sections: [
            {
                id: '2_s0',
                startPoint: {
                    x: 962,
                    y: 235,
                },
                endPoint: {
                    x: 1095.3333333333333,
                    y: 235,
                },
                incomingShape: 'product_name',
                outgoingShape: 'task_instruction',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: '3',
        source: 'target_audience',
        target: 'context_instruction',
        targetHandle: 'target_audience',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'target_audience',
        sections: [
            {
                id: '3_s0',
                startPoint: {
                    x: 962,
                    y: 429,
                },
                endPoint: {
                    x: 1087,
                    y: 532,
                },
                bendPoints: [
                    {
                        x: 972,
                        y: 429,
                    },
                    {
                        x: 972,
                        y: 532,
                    },
                ],
                incomingShape: 'target_audience',
                outgoingShape: 'context_instruction',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: '4',
        source: 'campaign_goal',
        target: 'context_instruction',
        targetHandle: 'campaign_goal',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'campaign_goal',
        sections: [
            {
                id: '4_s0',
                startPoint: {
                    x: 962,
                    y: 549,
                },
                endPoint: {
                    x: 1087,
                    y: 557,
                },
                bendPoints: [
                    {
                        x: 972,
                        y: 549,
                    },
                    {
                        x: 972,
                        y: 557,
                    },
                ],
                incomingShape: 'campaign_goal',
                outgoingShape: 'context_instruction',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: '5',
        source: 'key_features',
        target: 'key_features_to_list',
        targetHandle: 'messy_text',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'messy_text',
        sections: [
            {
                id: '5_s0',
                startPoint: {
                    x: 412,
                    y: 669,
                },
                endPoint: {
                    x: 637,
                    y: 669,
                },
                incomingShape: 'key_features',
                outgoingShape: 'key_features_to_list',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: '6',
        source: 'key_features_to_list',
        sourceHandle: 'formatted_text',
        target: 'constraints_instruction_join_text_key_features_to_list',
        targetHandle: 'text2',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'formatted_text',
        targetPort: 'text2',
        sections: [
            {
                id: '6_s0',
                startPoint: {
                    x: 837,
                    y: 669,
                },
                endPoint: {
                    x: 1162,
                    y: 669,
                },
                incomingShape: 'key_features_to_list',
                outgoingShape:
                    'constraints_instruction_join_text_key_features_to_list',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: '7',
        source: 'call_to_action',
        target: 'inclusion_instruction',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'default',
        sections: [
            {
                id: '7_s0',
                startPoint: {
                    x: 962,
                    y: 1009,
                },
                endPoint: {
                    x: 1112,
                    y: 1009,
                },
                incomingShape: 'call_to_action',
                outgoingShape: 'inclusion_instruction',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: '8',
        source: 'tone_and_style',
        target: 'constraints_instruction',
        targetHandle: 'tone_and_style',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'tone_and_style',
        sections: [
            {
                id: '8_s0',
                startPoint: {
                    x: 412,
                    y: 909,
                },
                endPoint: {
                    x: 512,
                    y: 864,
                },
                bendPoints: [
                    {
                        x: 422,
                        y: 909,
                    },
                    {
                        x: 422,
                        y: 864,
                    },
                ],
                incomingShape: 'tone_and_style',
                outgoingShape: 'constraints_instruction',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: '9',
        source: 'word_count_range',
        target: 'constraints_instruction',
        targetHandle: 'word_count_range',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'word_count_range',
        sections: [
            {
                id: '9_s0',
                startPoint: {
                    x: 412,
                    y: 789,
                },
                endPoint: {
                    x: 512,
                    y: 814,
                },
                bendPoints: [
                    {
                        x: 422,
                        y: 789,
                    },
                    {
                        x: 422,
                        y: 814,
                    },
                ],
                incomingShape: 'word_count_range',
                outgoingShape: 'constraints_instruction',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: '9b',
        source: 'constraints_instruction',
        target: 'constraints_instruction_join_text_key_features_to_list',
        targetHandle: 'text1',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'text1',
        sections: [
            {
                id: '9b_s0',
                startPoint: {
                    x: 962,
                    y: 839,
                },
                endPoint: {
                    x: 1162,
                    y: 685,
                },
                bendPoints: [
                    {
                        x: 972,
                        y: 839,
                    },
                    {
                        x: 972,
                        y: 685,
                    },
                ],
                incomingShape: 'constraints_instruction',
                outgoingShape:
                    'constraints_instruction_join_text_key_features_to_list',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: '10',
        source: 'output_format',
        target: 'task_instruction',
        targetHandle: 'output_format',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'output_format',
        sections: [
            {
                id: '10_s0',
                startPoint: {
                    x: 962,
                    y: 92,
                },
                endPoint: {
                    x: 1095.3333333333333,
                    y: 209,
                },
                bendPoints: [
                    {
                        x: 972,
                        y: 92,
                    },
                    {
                        x: 972,
                        y: 209,
                    },
                ],
                incomingShape: 'output_format',
                outgoingShape: 'task_instruction',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: '11',
        source: 'output_format',
        target: 'format_specification',
        targetHandle: 'output_format',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'output_format',
        sections: [
            {
                id: '11_s0',
                startPoint: {
                    x: 962,
                    y: 79,
                },
                endPoint: {
                    x: 1095.3333333333333,
                    y: 79,
                },
                incomingShape: 'output_format',
                outgoingShape: 'format_specification',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: '12',
        source: 'output_format',
        target: 'format_specification',
        targetHandle: 'output_format',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'output_format',
        sections: [
            {
                id: '12_s0',
                startPoint: {
                    x: 962,
                    y: 67,
                },
                endPoint: {
                    x: 1095.3333333333333,
                    y: 45,
                },
                bendPoints: [
                    {
                        x: 972,
                        y: 67,
                    },
                    {
                        x: 972,
                        y: 45,
                    },
                ],
                incomingShape: 'output_format',
                outgoingShape: 'format_specification',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: 'c',
        source: 'role_instruction',
        target: 'full_prompt',
        targetHandle: 'role_instruction',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'role_instruction',
        sections: [
            {
                id: 'c_s0',
                startPoint: {
                    x: 1562,
                    y: 372,
                },
                endPoint: {
                    x: 1662,
                    y: 372,
                },
                incomingShape: 'role_instruction',
                outgoingShape: 'full_prompt',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: 'd',
        source: 'context_instruction',
        target: 'full_prompt',
        targetHandle: 'context_instruction',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'context_instruction',
        sections: [
            {
                id: 'd_s0',
                startPoint: {
                    x: 1487,
                    y: 532,
                },
                endPoint: {
                    x: 1662,
                    y: 414,
                },
                bendPoints: [
                    {
                        x: 1572,
                        y: 532,
                    },
                    {
                        x: 1572,
                        y: 414,
                    },
                ],
                incomingShape: 'context_instruction',
                outgoingShape: 'full_prompt',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: 'e',
        source: 'task_instruction',
        target: 'full_prompt',
        targetHandle: 'task_instruction',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'task_instruction',
        sections: [
            {
                id: 'e_s0',
                startPoint: {
                    x: 1495.3333333333333,
                    y: 222,
                },
                endPoint: {
                    x: 1662,
                    y: 329,
                },
                bendPoints: [
                    {
                        x: 1572,
                        y: 222,
                    },
                    {
                        x: 1572,
                        y: 329,
                    },
                ],
                incomingShape: 'task_instruction',
                outgoingShape: 'full_prompt',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: 'f',
        source: 'constraints_instruction_join_text_key_features_to_list',
        sourceHandle: 'text',
        target: 'full_prompt',
        targetHandle: 'constraints_instruction',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'text',
        targetPort: 'constraints_instruction',
        sections: [
            {
                id: 'f_s0',
                startPoint: {
                    x: 1362,
                    y: 677,
                },
                endPoint: {
                    x: 1662,
                    y: 457,
                },
                bendPoints: [
                    {
                        x: 1582,
                        y: 677,
                    },
                    {
                        x: 1582,
                        y: 457,
                    },
                ],
                incomingShape:
                    'constraints_instruction_join_text_key_features_to_list',
                outgoingShape: 'full_prompt',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: 'g',
        source: 'inclusion_instruction',
        target: 'full_prompt',
        targetHandle: 'inclusion_instruction',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'inclusion_instruction',
        sections: [
            {
                id: 'g_s0',
                startPoint: {
                    x: 1512,
                    y: 1009,
                },
                endPoint: {
                    x: 1662,
                    y: 500,
                },
                bendPoints: [
                    {
                        x: 1592,
                        y: 1009,
                    },
                    {
                        x: 1592,
                        y: 500,
                    },
                ],
                incomingShape: 'inclusion_instruction',
                outgoingShape: 'full_prompt',
            },
        ],
        container: 'root',
        selected: false,
    },
    {
        id: 'h',
        source: 'format_specification',
        target: 'full_prompt',
        targetHandle: 'format_specification',
        style: 'stroke:#D2D2D2; stroke-width:4;',
        sourcePort: 'default',
        targetPort: 'format_specification',
        sections: [
            {
                id: 'h_s0',
                startPoint: {
                    x: 1495.3333333333333,
                    y: 62,
                },
                endPoint: {
                    x: 1662,
                    y: 286,
                },
                bendPoints: [
                    {
                        x: 1582,
                        y: 62,
                    },
                    {
                        x: 1582,
                        y: 286,
                    },
                ],
                incomingShape: 'format_specification',
                outgoingShape: 'full_prompt',
            },
        ],
        container: 'root',
        selected: false,
    },
];
