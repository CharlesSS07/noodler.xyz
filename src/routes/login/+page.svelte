<!-- functions/routes/auth/FlowGraph.svelte -->
<script lang="ts">
	import { userStore } from 'sveltefire';
	import {
		signInWithEmailAndPassword,
		createUserWithEmailAndPassword,
		signInWithPopup,
		GoogleAuthProvider,
		signOut,
		type AuthError
	} from 'firebase/auth';
	import { goto } from '$app/navigation';
	import { auth } from '../../firebase/index.js';
	import { onMount } from "svelte";

	const user = userStore(auth);
	const googleProvider = new GoogleAuthProvider();

	let email: string = '';
	let password: string = '';
	let isLogin: boolean = true;
	let loading: boolean = false;
	let error: string = '';
	let redirectBackTo: string = '/app';

	onMount(() => {
		const url = new URL(window.location.href);
		const params = new URLSearchParams(url.search);
		redirectBackTo = params.get('from') || redirectBackTo;
	});

	async function handleEmailAuth(): Promise<void> {
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}

		loading = true;
		error = '';

		try {
			if (isLogin) {
				await signInWithEmailAndPassword(auth, email, password);
			} else {
				await createUserWithEmailAndPassword(auth, email, password);
			}
			goto(redirectBackTo);
		} catch (err) {
			const authError = err as AuthError;
			error = authError.message;
		} finally {
			loading = false;
		}
	}

	async function handleGoogleAuth(): Promise<void> {
		loading = true;
		error = '';

		try {
			await signInWithPopup(auth, googleProvider);
			goto(redirectBackTo);
		} catch (err) {
			const authError = err as AuthError;
			error = authError.message;
		} finally {
			loading = false;
		}
	}

	async function handleSignOut(): Promise<void> {
		try {
			await signOut(auth);
		} catch (err) {
			const authError = err as AuthError;
			error = authError.message;
		}
	}

	function toggleMode(): void {
		isLogin = !isLogin;
		error = '';
		email = '';
		password = '';
	}
</script>

<svelte:head>
	<title>{isLogin ? 'Sign In' : 'Sign Up'} - My App</title>
</svelte:head>

<div class="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
			{#if $user}
				Welcome back!
			{:else}
				{isLogin ? 'Sign in to your account' : 'Create your account'}
			{/if}
		</h2>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
			{#if $user}
				<!-- Authenticated State -->
				<div class="text-center">
					<div class="mb-4">
						{#if $user.photoURL}
							<img src={$user.photoURL} alt="Profile" class="mx-auto h-16 w-16 rounded-full" />
						{/if}
						<p class="mt-2 text-lg font-medium text-gray-900">
							Hello, {$user.displayName || $user.email}!
						</p>
						<p class="text-sm text-gray-500">UID: {$user.uid}</p>
					</div>

					<div class="space-y-4">
						<button
							on:click={() => goto(redirectBackTo)}
							class="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
						>
							Go to Dashboard
						</button>

						<button
							on:click={handleSignOut}
							class="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
						>
							Sign Out
						</button>
					</div>
				</div>
			{:else}
				<!-- Authentication Form -->
				<form on:submit|preventDefault={handleEmailAuth} class="space-y-6">
					{#if error}
						<div class="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
							{error}
						</div>
					{/if}

					<div>
						<label for="email" class="block text-sm font-medium text-gray-700">
							Email address
						</label>
						<div class="mt-1">
							<input
								id="email"
								name="email"
								type="email"
								autocomplete="email"
								required
								bind:value={email}
								class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
								placeholder="Enter your email"
							/>
						</div>
					</div>

					<div>
						<label for="password" class="block text-sm font-medium text-gray-700"> Password </label>
						<div class="mt-1">
							<input
								id="password"
								name="password"
								type="password"
								autocomplete={isLogin ? 'current-password' : 'new-password'}
								required
								bind:value={password}
								class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
								placeholder="Enter your password"
							/>
						</div>
					</div>

					<div>
						<button
							type="submit"
							disabled={loading}
							class="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						>
							{loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
						</button>
					</div>
				</form>

				<div class="mt-6">
					<div class="relative">
						<div class="absolute inset-0 flex items-center">
							<div class="w-full border-t border-gray-300" />
						</div>
						<div class="relative flex justify-center text-sm">
							<span class="bg-white px-2 text-gray-500">Or continue with</span>
						</div>
					</div>

					<div class="mt-6">
						<button
							on:click={handleGoogleAuth}
							disabled={loading}
							class="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<svg class="mr-2 h-5 w-5" viewBox="0 0 24 24">
								<path
									fill="#4285F4"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="#34A853"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="#FBBC05"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							Continue with Google
						</button>
					</div>
				</div>

				<div class="mt-6 text-center">
					<button on:click={toggleMode} class="text-sm text-indigo-600 hover:text-indigo-500">
						{isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	/* Add any custom styles here if needed */
</style>
