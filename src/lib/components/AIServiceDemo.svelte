<script lang="ts">
  import { onMount } from 'svelte';
  import { getAuth, type User } from 'firebase/auth';
  import { AIInferenceService, ImageUtils } from '$lib/services';
  import type { TextToImageRequest } from '$lib/services';
  import Jimp from 'jimp';

  // State
  let user: User | null = null;
  let aiService: AIInferenceService | null = null;
  let loading = false;
  let error = '';
  let generatedImageUrl = '';
  let prompt = 'A cute cat sitting on a red sofa';

  // Image processing
  let selectedFile: File | null = null;
  let classificationResults: { label: string; score: number }[] = [];
  let imagePreviewUrl = '';

  onMount(() => {
    const auth = getAuth();
    
    // Listen for auth changes
    const unsubscribe = auth.onAuthStateChanged((newUser) => {
      user = newUser;
      if (user) {
        // Initialize AI service when user is authenticated
        aiService = new AIInferenceService({ 
          user,
          // You'll need to update this URL to match your Firebase Functions
          functionUrl: 'https://us-central1-your-project-id.cloudfunctions.net'
        });
      } else {
        aiService = null;
      }
    });

    return unsubscribe;
  });

  async function generateImage() {
    if (!aiService || !prompt.trim()) return;

    loading = true;
    error = '';
    generatedImageUrl = '';

    try {
      const request: TextToImageRequest = {
        inputs: prompt,
        parameters: {
          num_inference_steps: 5, // Fast generation for demo
          guidance_scale: 7.5
        }
      };

      const jimpImage = await aiService.textToImage(request);
      
      // Convert JIMP image to data URL for display
      generatedImageUrl = await ImageUtils.jimpToDataUrl(jimpImage);
      
      console.log('Generated image:', jimpImage.getWidth(), 'x', jimpImage.getHeight());
    } catch (err: any) {
      error = err.message || 'Failed to generate image';
      console.error('Image generation error:', err);
    } finally {
      loading = false;
    }
  }

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;
    
    selectedFile = file;
    imagePreviewUrl = URL.createObjectURL(file);
    classificationResults = [];
  }

  async function classifyImage() {
    if (!aiService || !selectedFile) return;

    loading = true;
    error = '';
    classificationResults = [];

    try {
      // Convert file to JIMP
      const jimpImage = await ImageUtils.fileToJimp(selectedFile);

      // Optional: Resize for faster processing
      const resizedImage = await ImageUtils.resizeIfTooLarge(jimpImage, 512, 512);

      // Validate image
      const validation = ImageUtils.validateImageForAI(jimpImage);
      if (!validation.isValid) {
        console.warn('Image validation issues:', validation.issues);
      }
      
      // Classify the image
      const results = await aiService.imageClassification({
        inputs: resizedImage,
        model: 'google/vit-base-patch16-224'
      });

      classificationResults = results.slice(0, 5); // Top 5 results
      
    } catch (err: any) {
      error = err.message || 'Failed to classify image';
      console.error('Image classification error:', err);
    } finally {
      loading = false;
    }
  }

  // Cleanup object URLs when component is destroyed
  $: if (imagePreviewUrl && !selectedFile) {
    URL.revokeObjectURL(imagePreviewUrl);
  }
</script>

<div class="max-w-4xl mx-auto p-6 space-y-8">
  <h1 class="text-3xl font-bold text-center">AI Inference Service Demo</h1>
  
  <!-- Authentication Status -->
  <div class="bg-gray-100 p-4 rounded-lg">
    {#if user}
      <p class="text-green-600">✅ Authenticated as: {user.email || user.uid}</p>
    {:else}
      <p class="text-red-600">❌ Not authenticated. Please sign in to use AI services.</p>
    {/if}
  </div>

  {#if user && aiService}
    <!-- Text-to-Image Section -->
    <section class="border rounded-lg p-6">
      <h2 class="text-2xl font-semibold mb-4">🎨 Text-to-Image Generation</h2>
      
      <div class="space-y-4">
        <div>
          <label for="prompt" class="block text-sm font-medium mb-2">
            Enter a text prompt:
          </label>
          <input
            id="prompt"
            type="text"
            bind:value={prompt}
            class="w-full p-3 border rounded-md"
            placeholder="A beautiful sunset over mountains..."
            disabled={loading}
          />
        </div>
        
        <button
          on:click={generateImage}
          disabled={loading || !prompt.trim()}
          class="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Image'}
        </button>
        
        {#if generatedImageUrl}
          <div class="mt-4">
            <h3 class="text-lg font-medium mb-2">Generated Image:</h3>
            <img 
              src={generatedImageUrl} 
              alt="Generated from: {prompt}"
              class="max-w-md border rounded-lg shadow-md"
            />
          </div>
        {/if}
      </div>
    </section>

    <!-- Image Classification Section -->
    <section class="border rounded-lg p-6">
      <h2 class="text-2xl font-semibold mb-4">🔍 Image Classification</h2>
      
      <div class="space-y-4">
        <div>
          <label for="image-file" class="block text-sm font-medium mb-2">
            Select an image to classify:
          </label>
          <input
            id="image-file"
            type="file"
            accept="image/*"
            on:change={handleFileSelect}
            class="w-full p-3 border rounded-md"
            disabled={loading}
          />
        </div>
        
        {#if selectedFile}
          <button
            on:click={classifyImage}
            disabled={loading}
            class="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Classifying...' : 'Classify Image'}
          </button>
        {/if}
        
        <div class="grid md:grid-cols-2 gap-4">
          {#if imagePreviewUrl}
            <div>
              <h3 class="text-lg font-medium mb-2">Selected Image:</h3>
              <img 
                src={imagePreviewUrl} 
                alt="Selected for classification"
                class="max-w-full h-64 object-contain border rounded-lg"
              />
            </div>
          {/if}
          
          {#if classificationResults.length > 0}
            <div>
              <h3 class="text-lg font-medium mb-2">Classification Results:</h3>
              <div class="space-y-2">
                {#each classificationResults as result}
                  <div class="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <span class="font-medium">{result.label}</span>
                    <span class="text-sm text-gray-600">
                      {(result.score * 100).toFixed(1)}%
                    </span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </section>

    <!-- Error Display -->
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
      </div>
    {/if}

    <!-- Service Info -->
    <section class="bg-blue-50 p-6 rounded-lg">
      <h3 class="text-lg font-semibold mb-2">🔧 Service Information</h3>
      <p class="text-sm text-gray-600">
        Function URL: {aiService.getBaseUrl()}
      </p>
      <p class="text-xs text-gray-500 mt-2">
        This demo uses the AIInferenceService with JIMP image processing. 
        Images are automatically converted between formats and authenticated requests 
        are made to your Firebase Functions endpoints.
      </p>
    </section>
  {/if}
</div>

<style>
  /* Add any custom styles here */
</style>