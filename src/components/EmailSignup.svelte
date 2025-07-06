<script lang="ts">

    import { firestore } from '../firebase';
    import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

    /**
     * Interface for the email signup data
     */
    interface EmailSignup {
        email: string;
        consent: boolean;
        createdAt: Date;
    }

    /**
     * Service for handling email signup operations
     */
    const emailService = {
        /**
         * Add a new email signup to Firestore
         * @param email - The email address to save
         * @param consent - Whether the user has given consent
         * @returns Promise resolving to the document ID
         */
        async addEmailSignup(email: string, consent: boolean): Promise<string> {
            try {

                // Add the email to Firestore
                const docRef = await addDoc(collection(firestore, 'emailSignups'), {
                    email,
                    consent,
                    createdAt: new Date()
                });

                return docRef.id;
            } catch (error) {
                console.error('Error adding email signup:', error);
                throw error;
            }
        },

    };



    import { fly, fade } from 'svelte/transition';

    // Props with default values
    export let title = "Stay Updated";
    export let subtitle = "Sign up for our newsletter to receive updates and exclusive offers.";
    export let buttonText = "Subscribe";
    export let successMessage = "Thanks for subscribing!";

    // Form state
    let email = '';
    let consent = false;
    let isSubmitting = false;
    let isSuccess = false;
    let errorMessage = '';
    let formElement: HTMLFormElement;

    // Email validation
    $: isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    $: canSubmit = isValidEmail && consent && !isSubmitting;

    /**
     * Handle form submission
     */
    async function handleSubmit() {
        if (!canSubmit) return;

        errorMessage = '';
        isSubmitting = true;

        try {
            await emailService.addEmailSignup(email, consent);
            isSuccess = true;
            email = '';
            consent = false;
        } catch (error) {
            if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage = 'An unexpected error occurred. Please try again.';
            }
        } finally {
            isSubmitting = false;
        }
    }

    /**
     * Reset the form
     */
    function resetForm() {
        isSuccess = false;
        errorMessage = '';
        email = '';
        consent = false;
        formElement.reset();
    }
</script>

<div class="signup-container">
    {#if isSuccess}
        <div class="success-message" in:fly={{ y: 20, duration: 400 }} out:fade>
            <div class="success-icon">✓</div>
            <h2>{successMessage}</h2>
            <button class="reset-button" on:click={resetForm}>Sign up another email</button>
        </div>
    {:else}
        <div class="signup-content" in:fade={{ duration: 300 }}>
            <h2>{title}</h2>
            <p>{subtitle}</p>

            <form bind:this={formElement} on:submit|preventDefault={handleSubmit}>
                <div class="form-group">
                    <input
                            type="email"
                            id="email"
                            placeholder="Your email address"
                            required
                            bind:value={email}
                            class:error={email && !isValidEmail}
                            autocomplete="email"
                    />
                    {#if email && !isValidEmail}
                        <small class="error-text" in:fly={{ y: -10, duration: 200 }}>Please enter a valid email address</small>
                    {/if}
                </div>

                <div class="form-group checkbox-group">
                    <label for="consent">
                        <input
                                type="checkbox"
                                id="consent"
                                bind:checked={consent}
                                required
                        />
                        <span>I agree to receive marketing emails and accept the <a href="/privacy">Privacy Policy</a></span>
                    </label>
                </div>

                {#if errorMessage}
                    <div class="error-message" in:fly={{ y: -10, duration: 200 }}>
                        {errorMessage}
                    </div>
                {/if}

                <button
                        type="submit"
                        class:disabled={!canSubmit}
                        disabled={!canSubmit}
                >
                    {#if isSubmitting}
                        <span class="spinner"></span>
                    {:else}
                        {buttonText}
                    {/if}
                </button>
            </form>
        </div>
    {/if}
</div>

<style>
    .signup-container {
        max-width: 480px;
        margin: 0 auto;
        padding: 2rem;
        border-radius: 12px;
        background-color: #ffffff;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        overflow: hidden;
        min-height: 340px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    h2 {
        font-size: 1.75rem;
        font-weight: 700;
        margin-bottom: 0.75rem;
        color: #111827;
        line-height: 1.2;
    }

    p {
        color: #4B5563;
        margin-bottom: 1.5rem;
        font-size: 1rem;
        line-height: 1.5;
    }

    .form-group {
        margin-bottom: 1.25rem;
    }

    input[type="email"] {
        width: 100%;
        padding: 0.875rem 1rem;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        font-size: 1rem;
        transition: all 0.2s ease;
        box-sizing: border-box;
        color: #111827;
        background-color: #F9FAFB;
    }

    input[type="email"]:focus {
        outline: none;
        border-color: #3563E9;
        background-color: #ffffff;
        box-shadow: 0 0 0 3px rgba(53, 99, 233, 0.15);
    }

    input[type="email"].error {
        border-color: #FF3B30;
        background-color: #FFF5F5;
    }

    input[type="email"].error:focus {
        box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.15);
    }

    .error-text {
        display: block;
        color: #FF3B30;
        font-size: 0.875rem;
        margin-top: 0.5rem;
    }

    .checkbox-group {
        display: flex;
        align-items: flex-start;
    }

    .checkbox-group label {
        display: flex;
        align-items: flex-start;
        cursor: pointer;
        user-select: none;
        font-size: 0.875rem;
        color: #4B5563;
    }

    input[type="checkbox"] {
        margin-right: 0.5rem;
        margin-top: 0.25rem;
        appearance: none;
        width: 18px;
        height: 18px;
        border: 1px solid #D1D5DB;
        border-radius: 4px;
        background-color: #F9FAFB;
        position: relative;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
    }

    input[type="checkbox"]:checked {
        background-color: #3563E9;
        border-color: #3563E9;
    }

    input[type="checkbox"]:checked::after {
        content: "";
        position: absolute;
        left: 6px;
        top: 2px;
        width: 5px;
        height: 10px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
    }

    input[type="checkbox"]:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(53, 99, 233, 0.15);
    }

    button {
        width: 100%;
        padding: 0.875rem 1.5rem;
        background-color: #3563E9;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 3.25rem;
    }

    button:hover:not(.disabled) {
        background-color: #2D56CF;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(53, 99, 233, 0.25);
    }

    button:active:not(.disabled) {
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(53, 99, 233, 0.25);
    }

    button.disabled {
        background-color: #A0AEC0;
        cursor: not-allowed;
        opacity: 0.7;
    }

    a {
        color: #3563E9;
        text-decoration: none;
        transition: color 0.2s ease;
    }

    a:hover {
        color: #2D56CF;
        text-decoration: underline;
    }

    .spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .error-message {
        background-color: #FEE2E2;
        color: #B91C1C;
        padding: 0.75rem 1rem;
        border-radius: 6px;
        margin-bottom: 1.25rem;
        font-size: 0.875rem;
    }

    .success-message {
        text-align: center;
        padding: 1rem;
    }

    .success-icon {
        width: 64px;
        height: 64px;
        background-color: #34C759;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        margin: 0 auto 1.5rem;
        animation: scale-in 0.3s ease;
    }

    @keyframes scale-in {
        0% { transform: scale(0); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
    }

    .reset-button {
        background-color: transparent;
        color: #3563E9;
        border: 1px solid #3563E9;
        margin-top: 1rem;
        font-weight: 500;
    }

    .reset-button:hover {
        background-color: rgba(53, 99, 233, 0.05);
        transform: none;
        box-shadow: none;
    }

    @media (max-width: 640px) {
        .signup-container {
            padding: 1.5rem;
            border-radius: 8px;
            min-height: 300px;
        }

        h2 {
            font-size: 1.5rem;
        }

        p {
            font-size: 0.875rem;
        }
    }
</style>