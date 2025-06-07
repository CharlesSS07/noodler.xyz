<script lang="ts">
    interface CropParams {
        x: number;
        y: number;
        width: number;
        height: number;
    }
    
    export let value: CropParams = { x: 0, y: 0, width: 100, height: 100 };
    export let disabled: boolean = false;
    export let socketId: string = '';
    
    function handleInputChange(field: keyof CropParams) {
        return (event: Event) => {
            const input = event.target as HTMLInputElement;
            const newValue = parseInt(input.value, 10);
            if (!isNaN(newValue) && newValue >= 0) {
                value = { ...value, [field]: newValue };
            }
        };
    }
</script>

<div class="crop-input">
    <div class="crop-header">
        <span class="crop-label">Crop Area</span>
    </div>
    
    <div class="crop-fields">
        <div class="field-row">
            <div class="field">
                <label for="crop-x-{socketId}">X:</label>
                <input
                    id="crop-x-{socketId}"
                    type="number"
                    value={value.x}
                    min="0"
                    {disabled}
                    oninput={handleInputChange('x')}
                    class="socket-input crop-number-input"
                />
            </div>
            
            <div class="field">
                <label for="crop-y-{socketId}">Y:</label>
                <input
                    id="crop-y-{socketId}"
                    type="number"
                    value={value.y}
                    min="0"
                    {disabled}
                    oninput={handleInputChange('y')}
                    class="socket-input crop-number-input"
                />
            </div>
        </div>
        
        <div class="field-row">
            <div class="field">
                <label for="crop-width-{socketId}">W:</label>
                <input
                    id="crop-width-{socketId}"
                    type="number"
                    value={value.width}
                    min="1"
                    {disabled}
                    oninput={handleInputChange('width')}
                    class="socket-input crop-number-input"
                />
            </div>
            
            <div class="field">
                <label for="crop-height-{socketId}">H:</label>
                <input
                    id="crop-height-{socketId}"
                    type="number"
                    value={value.height}
                    min="1"
                    {disabled}
                    oninput={handleInputChange('height')}
                    class="socket-input crop-number-input"
                />
            </div>
        </div>
    </div>
    
    <div class="crop-preview">
        <div class="preview-container">
            <div 
                class="crop-rectangle"
                style="
                    left: {Math.min(value.x / 4, 80)}px;
                    top: {Math.min(value.y / 4, 60)}px;
                    width: {Math.min(value.width / 4, 80)}px;
                    height: {Math.min(value.height / 4, 60)}px;
                "
            ></div>
        </div>
    </div>
    
    <div class="input-hints">
        <span class="hint">Area: {value.width} × {value.height}</span>
        <span class="hint">Position: ({value.x}, {value.y})</span>
    </div>
</div>

<style>
    .crop-input {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .crop-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .crop-label {
        font-size: 0.625rem;
        font-weight: 500;
        color: #374151;
    }
    
    .crop-fields {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .field-row {
        display: flex;
        gap: 0.5rem;
    }
    
    .field {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        flex: 1;
    }
    
    .field label {
        font-size: 0.625rem;
        font-weight: 500;
        color: #374151;
        min-width: 1rem;
    }
    
    .crop-number-input {
        flex: 1;
        padding: 0.25rem 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        background: white;
    }
    
    .crop-number-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6;
    }
    
    .crop-number-input:disabled {
        background: #f9fafb;
        color: #6b7280;
        cursor: not-allowed;
    }
    
    .crop-preview {
        margin-top: 0.5rem;
    }
    
    .preview-container {
        position: relative;
        width: 100px;
        height: 80px;
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        overflow: hidden;
    }
    
    .crop-rectangle {
        position: absolute;
        background: rgba(59, 130, 246, 0.3);
        border: 1px solid #3b82f6;
        pointer-events: none;
    }
    
    .input-hints {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.25rem;
    }
    
    .hint {
        font-size: 0.625rem;
        color: #6b7280;
        font-style: italic;
    }
</style>