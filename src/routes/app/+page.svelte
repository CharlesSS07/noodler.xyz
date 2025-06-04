<script lang="ts">
	import { SignedIn, SignedOut } from 'sveltefire';
	import { signInAnonymously } from 'firebase/auth';
	import FlowGraph from './FlowGraph.svelte';
	import { goto } from '$app/navigation';
	import { auth } from '../../firebase';
	import './nodes.css';

	import { FirebaseRTDBProjectCollection } from './lib/FirebaseRTDBProjectController.js';
	import type { ProjectCollectionInterface } from './lib/ProjectInterfaces.js';
	export const ACTIVE_PROJECT_COLLECTION: ProjectCollectionInterface =
			new FirebaseRTDBProjectCollection();

	import type { ProjectControllerInterface } from './lib/ProjectInterfaces.js';
	import { FirebaseRTDBProjectController } from './lib/FirebaseRTDBProjectController.js';
	import {onMount} from "svelte";

	const project_key_not_assigned = 'project_key_not_assigned';
	let project_key = project_key_not_assigned;

	onMount(() => {

		const url = new URL(window.location.href);
		const params = new URLSearchParams(url.search);
		project_key = params.get('pid') || project_key;

		console.log('project_key', project_key);

		auth.authStateReady().then(() => {
			if ((auth.currentUser && (!project_key || project_key == project_key_not_assigned) || project_key == '')) {
				ACTIVE_PROJECT_COLLECTION.newProject('New Flow', '').then(
					(project: ProjectControllerInterface) => {
						project_key = (project as unknown as FirebaseRTDBProjectController).project_key;
						goto(`/app?pid=${project_key}`);
					}
				);
			}
		});
	})

</script>

Project Key: {project_key}
{#if project_key!==project_key_not_assigned}
	<SignedIn>
		User: {auth?.currentUser?.displayName}
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
