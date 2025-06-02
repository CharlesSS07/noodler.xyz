<script lang="ts">
	import { FirebaseApp } from 'sveltefire';
	import { auth, firestore } from '../firebase/index.js';
	import '../app.css';
</script>

<FirebaseApp {auth} {firestore}>
	<slot />
</FirebaseApp>
