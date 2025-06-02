<script>
	// Contact Information
	const mobile = '5053095360'; // [cite: 1]
	const email = 'charlessstrauss@gmail.com'; // [cite: 1]
	const linkedin = 'www.linkedin.com/in/charles-strauss'; // [cite: 1]

	// Personal Details
	const name = 'Charles Strauss'; // [cite: 2]
	const title = 'Machine Learning Scientist'; // [cite: 2]
	const secondaryTitles = ['BTech in Data Science', 'CGI Generalist (Blender Cult Follower)']; // [cite: 2]
	const location = 'Salt Lake City, Utah, United States'; // [cite: 2]

	// Summary
	const summary = [
		"I'm a Data Scientist and creative technologist passionate about-me merging deep learning with the visual arts-specifically CGI and film. [cite: 3]",
		'With a strong foundation in neural networks, diffusion models, and computer vision, I specialize in applying cutting-edge AI techniques to cinematic storytelling, generative visuals, and emotional scene analysis. [cite: 3]',
		'From modeling antibody structures using VAEs and diffusion pipelines at Genentech, to analyzing emotional tropes in film using facial recognition and GPU-optimized inference, my work bridges the technical with the artistic. [cite: 4]',
		"I've built AI toolkits, led cross-functional teams, and published research in experimental deep learning, always with a focus on pushing boundaries. [cite: 5]",
		"Now, I'm seeking opportunities that live at the edge of innovation- where film meets AI, and creativity meets computation. [cite: 6]",
		"If your team is exploring the future of visual effects, generative cinema, or AI-enhanced storytelling, I'd love to connect. [cite: 7]"
	];

	// Top Skills
	const topSkills = [
		'Google Cloud Platform (GCP)', // [cite: 1]
		'Cloud-Native Architecture', // [cite: 1]
		'AI Software Development' // [cite: 1]
	];

	// Honors & Awards
	const honorsAwards = [
		'2024 Best Scientific Visualization Project', // [cite: 1]
		'2018 Intel Excellence in Computer Science Award' // [cite: 1]
	];

	// Publications
	const publications = [
		'Transfer Learning using Denoising Auto-Encoders for Cellular-Level Annotation of Tumor in Pathology Slides', // [cite: 1]
		'Comparing Sparse and Deep Neural Networks: Using AI to Detect Cancer Sparse MP4', // [cite: 1]
		'Classifiers Based on Deep Sparse Coding Architectures are Robust to Deep Learning Transferable Examples' // [cite: 1]
	];

	// Experience
	const experiences = [
		{
			company: 'Prescient Design', // [cite: 8]
			role: 'Intern Machine Learning Scientist', // [cite: 8]
			duration: 'May 2024 - September 2024 (5 months)', // [cite: 8]
			location: 'South San Francisco, California, United States', // [cite: 8]
			description:
				'Implemented diffusion-based antibody conformation sampling deep-learning pipeline. [cite: 9]'
		},
		{
			company: 'Spanish Red Cross', // [cite: 9]
			role: 'Consulting for Catalunya Red Cross', // [cite: 9]
			duration: 'June 2023 - July 2023 (2 months)', // [cite: 9]
			location: 'Barcelona, Catalonia, Spain', // [cite: 9]
			description:
				'Researched innovative changes to the Catalunya Red Cross for better engaging their community. [cite: 10]'
		},
		{
			company: 'Los Alamos National Laboratory', // [cite: 11]
			role: 'Research Experience: Using DNNs to Explainably Detect Tumors', // [cite: 11]
			duration: 'January 2021 - September 2021 (9 months)', // [cite: 11]
			location: 'Los Alamos, New Mexico, United States', // [cite: 11]
			description:
				"Advancing the frontiers of medical imaging as an intern, I took on a research endeavor to replicate and innovate on pixel-level tumor detection using deep neural networks. [cite: 11] Leveraging the CAMELYON 17 dataset, I replicated and expanded upon Google's research to conduct robustness analysis, successfully training and evaluating various neural network architectures (Inception, U-Net, VGG, CycleGAN) on tumor detection tasks. [cite: 12] To assess model robustness, I employed statistical analysis techniques (FROC, ROC, PR) and tested multiple adversarial attack methods, providing valuable insights into model reliability and vulnerability. [cite: 13]"
		},
		{
			company: 'New Mexico Consortium', // [cite: 14]
			role: 'Surveying the Robustness & Performance of Biologically Inspired Deep Learning Methods', // [cite: 14]
			duration: 'May 2019 - January 2021 (1 year 9 months)', // [cite: 14]
			location: 'Los Alamos, New Mexico, United States', // [cite: 14]
			description:
				'Discovered and implemented method for adversarially attacking sparse coding based neural networks layers. [cite: 14] Paper accepted to Medical NeuralPS. [cite: 15]'
		},
		{
			company: 'New Mexico Consortium', // [cite: 15]
			role: 'Explainable AI Research Intern', // [cite: 15]
			duration: 'May 2018 - August 2018 (4 months)', // [cite: 15]
			location: 'Los Alamos, New Mexico, United States', // [cite: 15]
			description:
				'Published "Classifiers Based on Deep Sparse Coding Architectures are Robust to Deep Learning Transferable Examples", https://arxiv.org/abs/1811.07211 [cite: 15]'
		},
		{
			company: 'Local Companies', // [cite: 16]
			role: 'Ad Creation', // [cite: 16]
			duration: '2015-2015 (less than a year)', // [cite: 16]
			description:
				'Made ads for local companies. [cite: 16] Shown at local movie theater. [cite: 16]'
		}
	];

	// Education
	const education = [
		{
			institution: 'University of Utah John and Marcia Price College of Engineering', // [cite: 17]
			degree: 'Bachelor of Technology - BTech, Data Science', // [cite: 17]
			duration: 'August 2022 - April 2025' // [cite: 17]
		},
		{
			institution: 'University of Utah - David Eccles School of Business', // [cite: 17]
			degree: 'Minor, Entrepreneurship/Entrepreneurial Studies', // [cite: 17]
			duration: 'May 2023 - July 2023' // [cite: 17]
		},
		{
			institution: 'University of Washington College of Engineering', // [cite: 17]
			degree: 'Computer Science', // [cite: 17]
			duration: 'September 2021 - June 2022' // [cite: 17]
		},
		{
			institution: 'Los Alamos High School', // [cite: 17]
			degree: '',
			duration: '2016-2020' // [cite: 17]
		}
	];
</script>

<div class="container">
	<div class="header-info">
		<h1>{name}</h1>
		<p>
			{title} | {#each secondaryTitles as secTitle}{secTitle}{#if secTitle !== secondaryTitles[secondaryTitles.length - 1]}
					|
				{/if}{/each}
		</p>
		<p>{location}</p>
	</div>

	<div class="contact-info">
		<h2>Contact</h2>
		<p>Mobile: {mobile} [cite: 1]</p>
		<p>Email: <a href="mailto:{email}">{email}</a> [cite: 1]</p>
		<p>
			LinkedIn: <a href="https://{linkedin}" target="_blank" rel="noopener noreferrer">{linkedin}</a
			> [cite: 1]
		</p>
	</div>

	<div class="summary">
		<h2>Summary</h2>
		{#each summary as paragraph}
			<p>{@html paragraph}</p>
		{/each}
	</div>

	<div class="top-skills">
		<h2>Top Skills</h2>
		<ul class="skills-list">
			{#each topSkills as skill}
				<li>{skill} [cite: 1]</li>
			{/each}
		</ul>
	</div>

	<div class="honors-awards">
		<h2>Honors & Awards</h2>
		<ul class="awards-list">
			{#each honorsAwards as award}
				<li>{award} [cite: 1]</li>
			{/each}
		</ul>
	</div>

	<div class="publications">
		<h2>Publications</h2>
		<ul class="publications-list">
			{#each publications as publication}
				<li>{publication} [cite: 1]</li>
			{/each}
		</ul>
	</div>

	<div class="experience">
		<h2>Experience</h2>
		{#each experiences as exp}
			<div class="experience-item">
				<h3>{exp.company}</h3>
				<p>
					<span class="role">{exp.role}</span>
					<span class="duration">{exp.duration}</span>
				</p>
				{#if exp.location}
					<p class="location">{exp.location}</p>
				{/if}
				<p class="description">{@html exp.description}</p>
			</div>
		{/each}
	</div>

	<div class="education">
		<h2>Education</h2>
		{#each education as edu}
			<div class="education-item">
				<h3>{edu.institution} [cite: 17]</h3>
				<p>
					{#if edu.degree}
						<span class="degree">{edu.degree}</span>
					{/if}
					<span class="duration">{edu.duration}</span> [cite: 17]
				</p>
			</div>
		{/each}
	</div>
</div>

<style>
	:global(body) {
		font-family: Arial, sans-serif;
		line-height: 1.6;
		margin: 0;
		padding: 20px;
		background-color: #f4f4f4;
		color: #333;
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
		background: #fff;
		padding: 30px;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	h1,
	h2 {
		color: #0056b3;
		border-bottom: 2px solid #eee;
		padding-bottom: 10px;
		margin-top: 30px;
	}

	h1 {
		text-align: center;
		margin-bottom: 10px;
	}

	h2 {
		margin-top: 25px;
		margin-bottom: 15px;
	}

	.header-info {
		text-align: center;
		margin-bottom: 20px;
	}

	.contact-info p {
		margin: 5px 0;
	}

	.contact-info a {
		color: #007bff;
		text-decoration: none;
	}

	.contact-info a:hover {
		text-decoration: underline;
	}

	.summary p {
		margin-bottom: 10px;
	}

	.skills-list,
	.awards-list,
	.publications-list {
		list-style: none;
		padding: 0;
	}

	.skills-list li,
	.awards-list li,
	.publications-list li {
		background: #e9ecef;
		margin-bottom: 5px;
		padding: 8px 12px;
		border-radius: 4px;
		display: inline-block;
		margin-right: 8px;
	}

	.experience-item,
	.education-item {
		margin-bottom: 20px;
		padding-bottom: 15px;
		border-bottom: 1px dashed #eee;
	}

	.experience-item:last-child,
	.education-item:last-child {
		border-bottom: none;
	}

	.experience-item h3,
	.education-item h3 {
		margin: 0 0 5px 0;
		color: #333;
	}

	.experience-item p,
	.education-item p {
		margin: 0;
		font-size: 0.95em;
	}

	.experience-item .role,
	.education-item .degree {
		font-weight: bold;
		color: #555;
	}

	.experience-item .duration,
	.education-item .duration {
		font-style: italic;
		color: #777;
		margin-left: 10px;
	}

	.experience-item .location {
		color: #777;
	}

	.experience-item .description {
		margin-top: 8px;
		color: #444;
	}
</style>
