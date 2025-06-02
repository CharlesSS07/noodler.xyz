<script>
	const projects = [
		{
			title: 'Noodler',
			description: 'AI Engineering for Business Majors.',
			link: '/app'
		},
		{
			title: 'AI for Movie Analysis',
			description: 'Extracting emotional tropes from movies via AI.'
			// link: "https://github.com/yourusername/vue-tutorial-overlay"
		},
		{
			title: 'TumorAI',
			description:
				'Typed node interfaces for Jimp/HuggingFace image tasks in a visual node compositor.'
			// link: "https://github.com/yourusername/image-node-interfaces"
		},
		{
			title: 'Asteroid Visualization in Blender3D',
			description: 'Blender-based Visualization of NASA JPL CNEOS Fireball Dataset',
			link: 'https://github.com/CharlesSS07/blender-asteroid-vis'
		},
		{
			title: 'git-autocommit',
			description: 'The once-ler harvests websites like truffula trees. There is no Lorax. UNLESS.',
			link: 'https://u1319464.wixsite.com/git-auto-commit'
		},
		{
			title: 'Onceler',
			description: 'The once-ler harvests websites like truffula trees. There is no Lorax. UNLESS.',
			link: 'https://github.com/CharlesSS07/once-ler'
		},
		{
			title: 'Psychic Enigma',
			description: 'The AI text editor from the future.',
			link: 'https://github.com/CharlesSS07/psychic-enigma'
		},
		{
			title: 'Abstract Renaissance Art',
			description: '2020 ProgressiveGANN generations of Renaissance Art',
			link: 'https://www.artpal.com/gkonabaada88'
		}
	];
</script>

<div class="min-h-screen bg-gray-50 p-6 text-gray-800">
	<header class="mb-12 text-center">
		<h1 class="mb-2 text-4xl font-bold">Charles Strauss' Portfolio</h1>
		<p class="text-lg text-gray-600">Welcome to my personal project hub</p>
	</header>

	<section class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each projects as project}
			<a
				href={project.link}
				target="_blank"
				class="block rounded-xl bg-white p-6 shadow transition hover:shadow-md"
			>
				<h2 class="mb-2 text-xl font-semibold">{project.title}</h2>
				<p class="text-sm text-gray-600">{project.description}</p>
			</a>
		{/each}
	</section>
</div>
