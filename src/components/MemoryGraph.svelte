<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { writable, derived } from 'svelte/store';

interface MemoryData {
    timestamp: number;
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    usedPercent: number;
}

class MemoryMonitor {
    private data: MemoryData[] = [];
    private maxDataPoints = 3600; // 1 hour of data at 1 second intervals
    private intervalId: number | null = null;

    public dataStore = writable<MemoryData[]>([]);
    public isMonitoring = writable(false);

    constructor() {
        this.startMonitoring();
    }

    private getMemoryInfo(): MemoryData | null {
        // Check if performance.memory is available (Chrome/Edge)
        if ('performance' in window && 'memory' in performance) {
            const memory = (performance as any).memory;
            const timestamp = Date.now();

            return {
                timestamp,
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit,
                usedPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
            };
        }

        // Fallback for browsers without performance.memory
        // Generate simulated data for demonstration
        const timestamp = Date.now();
        const baseUsage = 20 * 1024 * 1024; // 20MB base
        const randomVariation = Math.random() * 10 * 1024 * 1024; // Up to 10MB variation
        const usedJSHeapSize = baseUsage + randomVariation;
        const jsHeapSizeLimit = 100 * 1024 * 1024; // 100MB limit

        return {
            timestamp,
            usedJSHeapSize,
            totalJSHeapSize: usedJSHeapSize * 1.2,
            jsHeapSizeLimit,
            usedPercent: (usedJSHeapSize / jsHeapSizeLimit) * 100
        };
    }

    public startMonitoring() {
        if (this.intervalId) return;

        this.isMonitoring.set(true);
        this.intervalId = window.setInterval(() => {
            const memoryInfo = this.getMemoryInfo();
            if (memoryInfo) {
                this.data.push(memoryInfo);

                // Keep only the last maxDataPoints
                if (this.data.length > this.maxDataPoints) {
                    this.data = this.data.slice(-this.maxDataPoints);
                }

                this.dataStore.set([...this.data]);
            }
        }, 1000);
    }

    public stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isMonitoring.set(false);
        }
    }

    public getDataInRange(startTime: number, endTime: number): MemoryData[] {
        return this.data.filter(item =>
            item.timestamp >= startTime && item.timestamp <= endTime
        );
    }

    public destroy() {
        this.stopMonitoring();
    }
}

export const memoryMonitor = new MemoryMonitor();
export const memoryData = memoryMonitor.dataStore;
export const isMonitoring = memoryMonitor.isMonitoring;

// Derived store for the last 5 minutes of data
export const recentMemoryData = derived(memoryData, ($memoryData) => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return $memoryData.filter(item => item.timestamp >= fiveMinutesAgo);
});
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let animationFrame: number;

// Chart settings
let viewStartTime = 0;
let viewEndTime = 0;
let isDragging = false;
let lastMouseX = 0;
let zoomLevel = 1;

// Display options
let showFullHistory = false;

$: currentData = showFullHistory ? $memoryData : $recentMemoryData;

onMount(() => {
    ctx = canvas.getContext('2d')!;
    updateViewTime();
    startAnimation();

    // Set initial view to last 5 minutes
    const now = Date.now();
    viewEndTime = now;
    viewStartTime = now - (5 * 60 * 1000);
});

onDestroy(() => {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
});

function updateViewTime() {
    if (!showFullHistory) {
        const now = Date.now();
        viewEndTime = now;
        viewStartTime = now - (5 * 60 * 1000);
    }
}

function startAnimation() {
    function animate() {
        if (!showFullHistory) {
            updateViewTime();
        }
        drawChart();
        animationFrame = requestAnimationFrame(animate);
    }
    animate();
}

function drawChart() {
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    if (currentData.length === 0) {
        // Show "No data" message
        ctx.fillStyle = '#888';
        ctx.font = '16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Collecting memory data...', width / 2, height / 2);
        return;
    }

    // Filter data for current view
    const visibleData = currentData.filter(item =>
        item.timestamp >= viewStartTime && item.timestamp <= viewEndTime
    );

    if (visibleData.length === 0) return;

    // Calculate scales
    const timeRange = viewEndTime - viewStartTime;
    const maxMemory = Math.max(...visibleData.map(d => d.jsHeapSizeLimit));

    const padding = 60;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw grid
    drawGrid(padding, chartWidth, chartHeight, maxMemory, timeRange);

    // Draw memory lines
    drawMemoryLines(visibleData, padding, chartWidth, chartHeight, maxMemory, timeRange);

    // Draw legend
    drawLegend(padding, width);

    // Draw current values
    drawCurrentValues(visibleData, padding, height);
}

function drawGrid(padding: number, chartWidth: number, chartHeight: number, maxMemory: number, timeRange: number) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    // Horizontal grid lines (memory)
    const memorySteps = 5;
    for (let i = 0; i <= memorySteps; i++) {
        const y = padding + (chartHeight * i / memorySteps);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();

        // Memory labels
        const memoryValue = maxMemory * (1 - i / memorySteps);
        ctx.fillStyle = '#888';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(formatBytes(memoryValue), padding - 10, y + 4);
    }

    // Vertical grid lines (time)
    const timeSteps = 6;
    for (let i = 0; i <= timeSteps; i++) {
        const x = padding + (chartWidth * i / timeSteps);
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + chartHeight);
        ctx.stroke();

        // Time labels
        const timeValue = viewStartTime + (timeRange * i / timeSteps);
        const timeStr = formatTime(timeValue);
        ctx.fillStyle = '#888';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, x, padding + chartHeight + 20);
    }
}

function drawMemoryLines(data: MemoryData[], padding: number, chartWidth: number, chartHeight: number, maxMemory: number, timeRange: number) {
    if (data.length < 2) return;

    const lines = [
        { key: 'usedJSHeapSize', color: '#3B82F6', label: 'Used Heap' },
        { key: 'totalJSHeapSize', color: '#10B981', label: 'Total Heap' },
        { key: 'jsHeapSizeLimit', color: '#F59E0B', label: 'Heap Limit' }
    ];

    lines.forEach(line => {
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((point, index) => {
            const x = padding + ((point.timestamp - viewStartTime) / timeRange) * chartWidth;
            const y = padding + chartHeight - ((point[line.key as keyof MemoryData] as number / maxMemory) * chartHeight);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    });
}

function drawLegend(padding: number, width: number) {
    const legendItems = [
        { color: '#3B82F6', label: 'Used JS Heap' },
        { color: '#10B981', label: 'Total JS Heap' },
        { color: '#F59E0B', label: 'JS Heap Limit' }
    ];

    const startX = width - 200;
    let startY = padding;

    legendItems.forEach((item, index) => {
        const y = startY + index * 20;

        // Color box
        ctx.fillStyle = item.color;
        ctx.fillRect(startX, y - 6, 12, 12);

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(item.label, startX + 18, y + 3);
    });
}

function drawCurrentValues(data: MemoryData[], padding: number, height: number) {
    if (data.length === 0) return;

    const latest = data[data.length - 1];
    const values = [
        { label: 'Used:', value: formatBytes(latest.usedJSHeapSize), color: '#3B82F6' },
        { label: 'Total:', value: formatBytes(latest.totalJSHeapSize), color: '#10B981' },
        { label: 'Limit:', value: formatBytes(latest.jsHeapSizeLimit), color: '#F59E0B' },
        { label: 'Usage:', value: latest.usedPercent.toFixed(1) + '%', color: '#888' }
    ];

    const startX = padding;
    const startY = height - 30;

    values.forEach((item, index) => {
        const x = startX + index * 120;

        ctx.fillStyle = '#888';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(item.label, x, startY);

        ctx.fillStyle = item.color;
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText(item.value, x + 40, startY);
    });
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Mouse interaction handlers
function handleMouseDown(event: MouseEvent) {
    isDragging = true;
    lastMouseX = event.clientX;
}

function handleMouseMove(event: MouseEvent) {
    if (!isDragging || !showFullHistory) return;

    const deltaX = event.clientX - lastMouseX;
    const timeRange = viewEndTime - viewStartTime;
    const timeDelta = (deltaX / canvas.clientWidth) * timeRange;

    viewStartTime -= timeDelta;
    viewEndTime -= timeDelta;

    // Constrain to available data
    const minTime = $memoryData.length > 0 ? $memoryData[0].timestamp : 0;
    const maxTime = Date.now();

    if (viewStartTime < minTime) {
        const shift = minTime - viewStartTime;
        viewStartTime += shift;
        viewEndTime += shift;
    }

    if (viewEndTime > maxTime) {
        const shift = viewEndTime - maxTime;
        viewStartTime -= shift;
        viewEndTime -= shift;
    }

    lastMouseX = event.clientX;
}

function handleMouseUp() {
    isDragging = false;
}

function handleWheel(event: WheelEvent) {
    if (!showFullHistory) return;

    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 1.1 : 0.9;
    const timeRange = viewEndTime - viewStartTime;
    const newTimeRange = timeRange * zoomFactor;
    const center = (viewStartTime + viewEndTime) / 2;

    viewStartTime = center - newTimeRange / 2;
    viewEndTime = center + newTimeRange / 2;

    // Constrain zoom
    const minRange = 30 * 1000; // 30 seconds minimum
    const maxRange = 60 * 60 * 1000; // 1 hour maximum

    if (newTimeRange < minRange) {
        viewStartTime = center - minRange / 2;
        viewEndTime = center + minRange / 2;
    } else if (newTimeRange > maxRange) {
        viewStartTime = center - maxRange / 2;
        viewEndTime = center + maxRange / 2;
    }
}

function toggleHistoryView() {
    showFullHistory = !showFullHistory;
    if (showFullHistory && $memoryData.length > 0) {
        viewStartTime = $memoryData[0].timestamp;
        viewEndTime = Date.now();
    }
}

function resetView() {
    const now = Date.now();
    viewEndTime = now;
    viewStartTime = now - (5 * 60 * 1000);
    showFullHistory = false;
}
</script>

<div class="memory-graph">
<div class="controls">
<button
    class="toggle-btn"
class:active={showFullHistory}
on:click={toggleHistoryView}
    >
    {showFullHistory ? 'Live View (5min)' : 'Full History'}
    </button>

    <button class="reset-btn" on:click={resetView}>
    Reset View
</button>

<div class="status">
<div class="status-dot" class:active={$isMonitoring}></div>
    <span>{$isMonitoring ? 'Monitoring' : 'Stopped'}</span>
    </div>
    </div>

    <canvas
bind:this={canvas}
class="chart-canvas"
on:mousedown={handleMouseDown}
on:mousemove={handleMouseMove}
on:mouseup={handleMouseUp}
on:mouseleave={handleMouseUp}
on:wheel={handleWheel}
    ></canvas>

{#if showFullHistory}
<div class="help-text">
    Scroll to zoom • Drag to pan • Click "Live View" to return to real-time monitoring
</div>
{/if}
</div>

<style>
.memory-graph {
    background: #1a1a1a;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin: 20px 0;
}

.controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    gap: 10px;
}

.toggle-btn, .reset-btn {
    background: #333;
    color: #fff;
    border: 1px solid #555;
    border-radius: 6px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
}

.toggle-btn:hover, .reset-btn:hover {
    background: #444;
    border-color: #666;
}

.toggle-btn.active {
    background: #3B82F6;
    border-color: #3B82F6;
}

.status {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #888;
    font-size: 14px;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #555;
    transition: background-color 0.2s ease;
}

.status-dot.active {
    background: #10B981;
    box-shadow: 0 0 4px rgba(16, 185, 129, 0.5);
}

.chart-canvas {
    width: 100%;
    height: 400px;
    border-radius: 8px;
    cursor: grab;
    background: #242424;
}

.chart-canvas:active {
    cursor: grabbing;
}

.help-text {
    text-align: center;
    color: #666;
    font-size: 12px;
    margin-top: 10px;
}

@media (max-width: 768px) {
.memory-graph {
        padding: 15px;
    }

.controls {
        flex-direction: column;
        align-items: stretch;
    }

.chart-canvas {
        height: 300px;
    }
}
    </style>