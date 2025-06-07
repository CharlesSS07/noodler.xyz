<script lang="ts">
	import { SignedIn, SignedOut } from 'sveltefire';
	import { signInAnonymously } from 'firebase/auth';
	import FlowGraph from '$lib/components/FlowGraph.svelte';
	import { goto } from '$app/navigation';
	import { auth } from '../../firebase';
	import './nodes.css';

	import { FirebaseRTDBProjectCollection, type FirebaseRTDBProjectKey } from './lib/FirebaseRTDBProjectController.js';
	import type { ProjectCollectionInterface } from './lib/ProjectInterfaces.js';
	import { appActions, currentUser } from '../../lib/stores/AppState.js';
	import { onMount } from "svelte";

	export const ACTIVE_PROJECT_COLLECTION: ProjectCollectionInterface<FirebaseRTDBProjectKey> =
		new FirebaseRTDBProjectCollection();

	const project_key_not_assigned = 'project_key_not_assigned';
	let project_key: string = project_key_not_assigned;

	onMount(() => {
		const url = new URL(window.location.href);
		const params = new URLSearchParams(url.search);
		project_key = params.get('pid') || project_key;

		console.log('project_key from URL:', project_key);

		// If we have a project_key from URL, use it directly
		if (project_key && project_key !== project_key_not_assigned) {
			console.log('Using project_key from URL:', project_key);
		} else {
			// Only create new project if user is authenticated and no project_key
			auth.authStateReady().then(() => {
				if (auth.currentUser && (!project_key || project_key === project_key_not_assigned || project_key === '')) {
					console.log('Creating new project for authenticated user');
					ACTIVE_PROJECT_COLLECTION.newProject('New Flow', '').then(
						(newProject: FirebaseRTDBProjectKey) => {
							project_key = newProject.project_key;
							goto(`/app?pid=${project_key}`);
						}
					);
				}
			});
		}
	});

</script>

<!--Project Key: {project_key}-->
{#if project_key!==project_key_not_assigned}
	<!-- Allow direct access to projects with valid project_key for collaboration testing -->
	<FlowGraph {project_key}></FlowGraph>
{:else}
	<!-- Require auth only when creating new projects -->
	<SignedIn>
		<FlowGraph {project_key}></FlowGraph>
	</SignedIn>
{/if}

<SignedOut let:auth>
	<style>
		body {
			margin: 0;
			display: flex;
			justify-content: center;
			align-items: center;
			min-height: 100vh; /* Ensures the body takes at least the full viewport height */
			font-family: sans-serif; /* A clear, common font */
		}

		.centered-container {
			position: fixed; /* Keeps the container fixed relative to the viewport */
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%); /* Centers the element precisely */
			width: 25%; /* Adjust as needed, e.g., 300px for a fixed width */
			height: auto; /* Allows the height to adjust based on content */
			border: 1px solid #ccc; /* Subtle border */
			padding: 20px;
			box-sizing: border-box; /* Includes padding and border in the element's total width */
			text-align: center; /* Centers inline content like text */
			background-color: #f9f9f9; /* Light background */
			display: flex;
			flex-direction: column; /* Stacks items vertically */
			justify-content: center; /* Centers items vertically within the flex container */
			align-items: center; /* Centers items horizontally within the flex container */
		}

		.centered-container img {
			max-width: 150px; /* Limits the logo width */
			height: auto; /* Maintains aspect ratio */
			margin-bottom: 20px; /* Space below the logo */
		}

		.link-button {
			background: none; /* Removes button background */
			border: none; /* Removes button border */
			padding: 0;
			font: inherit; /* Inherits font styles from parent */
			text-decoration: underline; /* Adds an underline like a link */
			cursor: pointer; /* Changes cursor to a pointer on hover */
			color: blue; /* Standard link color */
			margin-top: 10px; /* Space above each button */
		}

		.link-button:hover {
			color: darkblue; /* Darker color on hover */
		}
	</style>

	<div class="centered-container">
		<img src="/favicon.png" alt="Your Logo" />
		You are signed out.
		<button class="link-button" on:click={() => signInAnonymously(auth)}>
			Sign In Anonymously
		</button>
		or go to the
		<button class="link-button" on:click={() => goto('/login')}> Login/Sign Up page. </button>
	</div>
</SignedOut>
