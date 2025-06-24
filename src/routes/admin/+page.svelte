<script lang="ts">
	import { generateStandardNodeSuite } from '$lib/compositor/nodes/firestore/FirestoreStandardNodeSet.js';
	import '../../app.css'; // Assuming this provides some base styles
	import { auth } from '../../firebase';
	import { SignedIn, SignedOut } from 'sveltefire'; // Import SignedOut for a better user experience

	let activeTab = 'dashboard';
	let isGenerating = false;
	let generationComplete = false;

	async function handleGenerateNodes() {
		isGenerating = true;
		generationComplete = false;
		
		try {
			await generateStandardNodeSuite();
			generationComplete = true;
		} catch (error) {
			console.error('Error generating node suite:', error);
		} finally {
			isGenerating = false;
		}
	}
</script>

<div class="admin-container">
	<SignedIn let:user={userData}>
		{#if userData}
			<!-- Admin Navigation -->
			<nav class="admin-nav">
				<h1>Admin Panel</h1>
				<div class="user-info">
					{userData.displayName || userData.email}
					<button on:click={() => auth.signOut()} class="sign-out-button">Sign Out</button>
				</div>
			</nav>

			<!-- Tab Navigation -->
			<div class="tab-nav">
				<button 
					class="tab-button" 
					class:active={activeTab === 'dashboard'}
					on:click={() => activeTab = 'dashboard'}
				>
					Dashboard
				</button>
				<button 
					class="tab-button" 
					class:active={activeTab === 'node-manager'}
					on:click={() => activeTab = 'node-manager'}
				>
					Node Blueprint Manager
				</button>
			</div>

			<!-- Tab Content -->
			<main class="admin-content">
				{#if activeTab === 'dashboard'}
					<div class="dashboard">
						<h2>Admin Dashboard</h2>
						<p>Welcome to the admin area! Use the tabs above to navigate.</p>
						
						<div class="dashboard-actions">
							<button 
								on:click={handleGenerateNodes} 
								class="action-button"
								class:generating={isGenerating}
								class:complete={generationComplete}
								disabled={isGenerating}
							>
								{#if isGenerating}
									Generating...
								{:else if generationComplete}
									✓ Generation Complete
								{:else}
									Generate Standard Node Suite
								{/if}
							</button>
							<p class="action-description">
								Creates the default set of node blueprints in Firestore
							</p>
						</div>
					</div>
				{:else if activeTab === 'node-manager'}
					<div>Comming Soon</div>
				{/if}
			</main>
		{:else}
			<div class="loading">
				<p>Loading user data...</p>
			</div>
		{/if}
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
	.admin-container {
		min-height: 100vh;
		background-color: #f8f9fa;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	}

	.admin-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: white;
		padding: 1rem 2rem;
		border-bottom: 1px solid #e9ecef;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}

	.admin-nav h1 {
		margin: 0;
		color: #333;
		font-size: 1.5rem;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		color: #666;
	}

	.tab-nav {
		display: flex;
		background: white;
		border-bottom: 1px solid #e9ecef;
		padding: 0 2rem;
	}

	.tab-button {
		background: none;
		border: none;
		padding: 1rem 1.5rem;
		cursor: pointer;
		border-bottom: 3px solid transparent;
		color: #666;
		font-size: 1rem;
		transition: all 0.2s;
	}

	.tab-button:hover {
		color: #333;
		background: #f8f9fa;
	}

	.tab-button.active {
		color: #0066cc;
		border-bottom-color: #0066cc;
		background: #f8f9fa;
	}

	.admin-content {
		padding: 2rem;
	}

	.dashboard {
		max-width: 800px;
		margin: 0 auto;
	}

	.dashboard h2 {
		color: #333;
		margin-bottom: 1rem;
	}

	.dashboard p {
		color: #666;
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	.dashboard-actions {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}

	.action-button {
		background-color: #007bff;
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 6px;
		cursor: pointer;
		font-size: 1rem;
		transition: background-color 0.3s ease;
		margin-bottom: 1rem;
		display: block;
	}

	.action-button:hover:not(:disabled) {
		background-color: #0056b3;
	}

	.action-button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.action-button.generating {
		background-color: #ffc107;
		color: #212529;
	}

	.action-button.generating:hover {
		background-color: #e0a800;
	}

	.action-button.complete {
		background-color: #28a745;
		color: white;
	}

	.action-button.complete:hover {
		background-color: #218838;
	}

	.action-description {
		color: #666;
		font-size: 0.9rem;
		margin: 0;
	}

	.sign-out-button {
		background-color: #dc3545;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.3s ease;
	}

	.sign-out-button:hover {
		background-color: #c82333;
	}

	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 50vh;
	}

	.not-signed-in-card {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		text-align: center;
		padding: 2rem;
	}

	.not-signed-in-card h2 {
		color: #333;
		margin-bottom: 1rem;
	}

	.not-signed-in-card p {
		color: #666;
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	.signin-link {
		display: inline-block;
		background: #007bff;
		color: white;
		text-decoration: none;
		padding: 12px 24px;
		border-radius: 6px;
		font-weight: 500;
		transition: background-color 0.3s ease;
	}

	.signin-link:hover {
		background: #0056b3;
		text-decoration: none;
	}

	@media (max-width: 768px) {
		.admin-nav {
			flex-direction: column;
			gap: 1rem;
			padding: 1rem;
		}

		.tab-nav {
			padding: 0 1rem;
			overflow-x: auto;
		}

		.admin-content {
			padding: 1rem;
		}

		.user-info {
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>
