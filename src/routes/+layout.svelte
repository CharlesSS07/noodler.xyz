<script lang="ts">
	import { FirebaseApp } from 'sveltefire';
	import { auth, firestore } from '../firebase/index.js';
	import { startAutomaticCleanup } from '$lib/compositor/BigDataCleanup';
	import '../app.css';

	// Start automatic BigData cleanup (runs every 24 hours)
	startAutomaticCleanup(24);
</script>

<FirebaseApp {auth} {firestore}>
	<slot />
</FirebaseApp>
