<script>
    export let textSize = 10;
    export let font = 'Inter';

    // Reactive variable to control the blur state.
    // It starts as false, meaning the logo is in focus.
    let isBlurred = false;

    // Reactive variable to hold the dynamically generated text-shadow style.
    // Initialized to the in-focus shadow.
    let dynamicTextShadow = '-1px 0 2px rgba(255, 0, 0, 0.4), 1px 0 2px rgba(0, 255, 0, 0.4), 0 0 5px rgba(255, 255, 255, 0.5)';

    // Reference to the noodler-text element, used to get its position and dimensions.
    let noodlerTextElement;

    /**
     * Generates a random integer within a specified range (inclusive).
     * @param {number} min - The minimum value for the random number.
     * @param {number} max - The maximum value for the random number.
     * @returns {number} A random integer within the given range.
     */
    function getRandomOffset(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function handleMouseEnter() {
        isBlurred = true;
    }

    /**
     * Handles the mouse entering the logo area.
     * Sets the logo to a blurred state and generates new random text-shadows,
     * biased by the mouse's entry position relative to the element's center.
     * @param {MouseEvent} event - The mouse event object.
     */
    function handleMouseOver(event) {

        if (!noodlerTextElement) return; // Ensure the element reference is available

        // Get the bounding rectangle of the logo element
        const rect = noodlerTextElement.getBoundingClientRect();

        // Calculate mouse position relative to the element's top-left corner
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Normalize mouse position to a range of 0 to 1, where 0.5 is the center
        const normalizedX = mouseX / rect.width;
        const normalizedY = mouseY / rect.height;

        // Calculate bias factors:
        // - If normalizedX is < 0.5, mouse is on the left, bias X offsets negatively.
        // - If normalizedX is > 0.5, mouse is on the right, bias X offsets positively.
        // - Similar logic for Y.
        // The factor (normalizedX - 0.5) ranges from -0.5 to 0.5.
        // Multiplying by a scale (e.g., 30) gives a directional push.
        const c = -2;
        const biasX = (normalizedX - 0.5) * 30 * c; // Scale the directional influence
        const biasY = (normalizedY - 0.5) * 30 * c; // Scale the directional influence

        // Generate random offsets and blur radii for each color channel (Red, Green, Blue)
        // These ranges are chosen to create a noticeable, yet controlled, aberration effect.
        // The directional bias is added to the random offset.
        const redX = getRandomOffset(-15, 15) + biasX;   // X offset for red shadow
        const redY = getRandomOffset(-8, 8) + biasY;     // Y offset for red shadow
        const redBlur = getRandomOffset(10, 20);         // Blur radius for red shadow

        const greenX = getRandomOffset(-15, 15) + biasX; // X offset for green shadow
        const greenY = getRandomOffset(-8, 8) + biasY;   // Y offset for green shadow
        const greenBlur = getRandomOffset(10, 20);       // Blur radius for green shadow

        const blueX = getRandomOffset(-15, 15) + biasX;  // X offset for blue shadow
        const blueY = getRandomOffset(-8, 8) + biasY;    // Y offset for blue shadow
        const blueBlur = getRandomOffset(10, 20);        // Blur radius for blue shadow

        // Construct the new text-shadow string using the generated random values.
        // The opacity for each color channel is set to 0.9 for a strong effect.
        dynamicTextShadow = `
            ${redX}px ${redY}px ${redBlur}px rgba(255, 0, 0, 0.9),
            ${greenX}px ${greenY}px ${greenBlur}px rgba(0, 255, 0, 0.9),
            ${blueX}px ${blueY}px ${blueBlur}px rgba(0, 0, 255, 0.9)
        `;
    }

    /**
     * Handles the mouse leaving the logo area.
     * Resets the logo to its in-focus state and restores the default text-shadow.
     */
    function handleMouseLeave() {
        isBlurred = false;
        // Reset to the consistent in-focus shadow when the mouse leaves.
        dynamicTextShadow = '-1px 0 2px rgba(255, 0, 0, 0.4), 1px 0 2px rgba(0, 255, 0, 0.4), 0 0 5px rgba(255, 255, 255, 0.5)';
    }
</script>

<!--
  The main container for the logo.
  Uses Tailwind CSS classes for responsive width, text color, font weight,
  tracking, and user-select behavior.
-->
<div class="relative text-white font-extrabold tracking-wider select-none w-full">
    <!--
      This div contains the "Noodler" text.
      - `bind:this={noodlerTextElement}`: Binds the DOM element to the `noodlerTextElement` variable in the script.
      - `text-center w-full align-middle`: Tailwind classes for centering and full width.
      - `style`: Inline styles for font size and family are set from props.
                 The `text-shadow` is dynamically bound to `dynamicTextShadow`.
      - `on:mouseenter` and `on:mouseleave`: Event listeners to trigger blur/focus and random shadow generation.
      - `class:blurred={isBlurred}`: Conditionally applies the 'blurred' CSS class based on the `isBlurred` state.
    -->
    <div
            bind:this={noodlerTextElement}
            class="noodler-text text-center w-full align-middle"
            style="font-size: {textSize}vw; font-family: '{font}', sans-serif; text-shadow: {dynamicTextShadow};"
            on:mouseenter={handleMouseEnter}
            on:mousemove={handleMouseOver}
            on:mouseleave={handleMouseLeave}
            class:blurred={isBlurred}
    >
        <slot></slot>
    </div>
</div>

<style>
    /*
      Base styles for the noodler-text.
      - `will-change`: Optimizes for animation performance by hinting to the browser.
      - `transition`: Ensures smooth visual changes for `filter`, `text-shadow`, and `opacity`
                      over 0.3 seconds with an ease-out timing function.
      - Default state: In-focus (no blur, full opacity).
    */
    .noodler-text {
        will-change: filter, text-shadow, opacity;
        transition: filter 0.3s ease-out, text-shadow 0.3s ease-out, opacity 0.3s ease-out;

        /* Default in-focus state */
        filter: blur(0px);
        opacity: 1;
    }

    /*
      Styles applied when the 'blurred' class is active (i.e., when the mouse is over the logo).
      - `filter: blur(5px)`: Applies a consistent blur effect.
      - `opacity: 0.1`: Fades out the text significantly, matching the original "out of focus" visual.
      - The `text-shadow` is controlled dynamically by JavaScript and is not defined here.
    */
    .noodler-text.blurred {
        filter: blur(5px);
        opacity: 1;
    }
</style>
