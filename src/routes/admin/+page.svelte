<script lang="ts">
	import { generateStandardNodeSuite } from '../app/lib/FirestoreStandardNodeSet.js';
	import '../../app.css'; // Assuming this provides some base styles
	import { auth } from '../../firebase';
	import { SignedIn, SignedOut } from 'sveltefire'; // Import SignedOut for a better user experience
</script>

<div class="container">
	<SignedIn let:user={userData}>
		<div class="welcome-card">
			{#if userData}
				<h1>Welcome to the Admin Area, {userData.displayName || userData.email}!</h1>
				<p>You are signed in.</p>
				<button on:click={generateStandardNodeSuite} class="action-button">
					Generate Standard Node Suite
				</button>
				<button on:click={() => auth.signOut()} class="sign-out-button"> Sign Out </button>
			{:else}
				<p>Loading user data...</p>
			{/if}
		</div>
	</SignedIn>

	<SignedOut>
		<div class="not-signed-in-card">
			<h2>Please Sign In</h2>
			<p>You need to be signed in to access this page.</p>
			<a href="/login?from=/admin" class="signin-link">Go to Sign In</a>
		</div>
	</SignedOut>
</div>

<style>
	/* Basic styling for a more appealing look */
	.container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		background-color: #f0f2f5; /* Light gray background */
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	}

	.welcome-card,
	.not-signed-in-card {
		background-color: #ffffff;
		padding: 30px;
		border-radius: 10px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		text-align: center;
		max-width: 450px;
		width: 90%;
	}

	h1 {
		color: #333;
		margin-bottom: 15px;
		font-size: 2em;
	}

	h2 {
		color: #555;
		margin-bottom: 15px;
		font-size: 1.8em;
	}

	p {
		color: #666;
		margin-bottom: 25px;
		line-height: 1.6;
	}

	.action-button,
	.sign-out-button {
		background-color: #007bff; /* Primary blue */
		color: white;
		border: none;
		padding: 12px 25px;
		border-radius: 5px;
		cursor: pointer;
		font-size: 1em;
		transition: background-color 0.3s ease;
		margin: 10px; /* Add some margin between buttons */
	}

	.action-button:hover {
		background-color: #0056b3; /* Darker blue on hover */
	}

	.sign-out-button {
		background-color: #dc3545; /* Red for sign out */
	}

	.sign-out-button:hover {
		background-color: #c82333; /* Darker red on hover */
	}

	.signin-link {
		display: inline-block;
		margin-top: 20px;
		color: #007bff;
		text-decoration: none;
		font-weight: bold;
	}

	.signin-link:hover {
		text-decoration: underline;
	}

	/* Responsive adjustments */
	@media (max-width: 600px) {
		.welcome-card,
		.not-signed-in-card {
			padding: 20px;
		}

		h1 {
			font-size: 1.8em;
		}

		h2 {
			font-size: 1.6em;
		}

		.action-button,
		.sign-out-button {
			padding: 10px 20px;
			font-size: 0.9em;
		}
	}
</style>
