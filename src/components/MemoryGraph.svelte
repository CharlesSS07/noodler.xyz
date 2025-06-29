<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { writable, derived } from 'svelte/store';
import * as echarts from 'echarts/core';
import {
    LineChart,
} from 'echarts/charts';
import {
    TitleComponent,
    TooltipComponent,
    GridComponent,
    DataZoomComponent,
    LegendComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
    LineChart,
    TitleComponent,
    TooltipComponent,
    GridComponent,
    DataZoomComponent,
    LegendComponent,
    CanvasRenderer
]);

interface MemoryData {
    timestamp: number;
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    usedPercent: number;
}

class MemoryMonitor {
    private data: MemoryData[] = [];
    private maxDataPoints = 3600;
    private intervalId: number | null = null;

    public dataStore = writable<MemoryData[]>([]);
    public isMonitoring = writable(false);

    constructor() {
        this.startMonitoring();
    }

    private getMemoryInfo(): MemoryData | null {
        const timestamp = Date.now();

        if ('performance' in window && 'memory' in performance) {
            const memory = (performance as any).memory;

            return {
                timestamp,
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit,
                usedPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
            };
        }
        return null;
    }

    public startMonitoring() {
        if (this.intervalId) return;

        this.isMonitoring.set(true);
        this.intervalId = window.setInterval(() => {
            const memoryInfo = this.getMemoryInfo();
            if (memoryInfo) {
                this.data.push(memoryInfo);

                if (this.data.length > this.maxDataPoints) {
                    this.data = this.data.slice(-this.maxDataPoints);
                }

                this.dataStore.set([...this.data]);
            }
        }, 2000);
    }

    public stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.isMonitoring.set(false);
        }
    }

    public destroy() {
        this.stopMonitoring();
    }
}

export const memoryMonitor = new MemoryMonitor();
export const memoryData = memoryMonitor.dataStore;
export const isMonitoring = memoryMonitor.isMonitoring;

export const recentMemoryData = derived(memoryData, ($memoryData) => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return $memoryData.filter(item => item.timestamp >= fiveMinutesAgo);
});

let chartContainer: HTMLDivElement;
let chart: echarts.ECharts;
let showFullHistory = false;
let userHasInteracted = false;
let currentDataZoomStart = 80;
let currentDataZoomEnd = 100;

$: currentData = showFullHistory ? $memoryData : $recentMemoryData;
$: {
    if (chart && currentData.length > 0) {
        updateChart();
    }
}

onMount(() => {
    initializeChart();
});

onDestroy(() => {
    if (chart) {
        chart.dispose();
    }
});

function initializeChart() {
    chart = echarts.init(chartContainer, 'dark');
    
    // Listen for dataZoom events to track user interactions
    chart.on('datazoom', (params: any) => {
        if (showFullHistory) {
            userHasInteracted = true;
            if (params.start !== undefined) currentDataZoomStart = params.start;
            if (params.end !== undefined) currentDataZoomEnd = params.end;
        }
    });
    
    updateChart();
    
    window.addEventListener('resize', () => {
        chart.resize();
    });
}

function updateChart() {
    if (!chart || currentData.length === 0) return;

    const timeData = currentData.map(d => new Date(d.timestamp));
    const usedData = currentData.map(d => d.usedJSHeapSize);
    const totalData = currentData.map(d => d.totalJSHeapSize);
    const limitData = currentData.map(d => d.jsHeapSizeLimit);

    const option = {
        backgroundColor: 'transparent',
        title: {
            text: 'JavaScript Memory Usage',
            textStyle: {
                color: '#fff',
                fontSize: 16
            },
            top: 10,
            left: 20
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            },
            formatter: (params: any) => {
                const time = new Date(params[0].axisValue).toLocaleTimeString();
                let content = `<div style="margin-bottom: 5px;">${time}</div>`;
                params.forEach((param: any) => {
                    const value = formatBytes(param.value);
                    content += `<div style="color:${param.color};">
                        <span style="display:inline-block;margin-right:5px;border-radius:10px;width:9px;height:9px;background-color:${param.color}"></span>
                        ${param.seriesName}: ${value}
                    </div>`;
                });
                return content;
            }
        },
        legend: {
            data: ['Used JS Heap', 'Total JS Heap', 'JS Heap Limit'],
            top: 40,
            textStyle: {
                color: '#fff'
            }
        },
        grid: {
            left: '80px',
            right: '50px',
            bottom: '100px',
            top: '80px',
            containLabel: false
        },
        xAxis: {
            type: 'time',
            boundaryGap: false,
            axisLine: {
                lineStyle: {
                    color: '#444'
                }
            },
            axisLabel: {
                color: '#888',
                formatter: (value: number) => {
                    return new Date(value).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit' 
                    });
                }
            },
            splitLine: {
                show: true,
                lineStyle: {
                    color: '#333'
                }
            }
        },
        yAxis: {
            type: 'value',
            axisLine: {
                lineStyle: {
                    color: '#444'
                }
            },
            axisLabel: {
                color: '#888',
                formatter: (value: number) => formatBytes(value)
            },
            splitLine: {
                lineStyle: {
                    color: '#333'
                }
            }
        },
        dataZoom: showFullHistory ? [
            {
                type: 'inside',
                start: userHasInteracted ? currentDataZoomStart : 80,
                end: userHasInteracted ? currentDataZoomEnd : 100
            },
            {
                start: userHasInteracted ? currentDataZoomStart : 80,
                end: userHasInteracted ? currentDataZoomEnd : 100,
                height: 30,
                bottom: 20,
                textStyle: {
                    color: '#888'
                },
                borderColor: '#555',
                fillerColor: 'rgba(59, 130, 246, 0.2)',
                handleStyle: {
                    color: '#3B82F6'
                }
            }
        ] : undefined,
        series: [
            {
                name: 'Used JS Heap',
                type: 'line',
                data: timeData.map((time, index) => [time, usedData[index]]),
                smooth: true,
                symbol: 'none',
                lineStyle: {
                    width: 2
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        {
                            offset: 0,
                            color: 'rgba(59, 130, 246, 0.8)'
                        },
                        {
                            offset: 1,
                            color: 'rgba(59, 130, 246, 0.1)'
                        }
                    ])
                },
                itemStyle: {
                    color: '#3B82F6'
                }
            },
            {
                name: 'Total JS Heap',
                type: 'line',
                data: timeData.map((time, index) => [time, totalData[index]]),
                smooth: true,
                symbol: 'none',
                lineStyle: {
                    width: 2
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        {
                            offset: 0,
                            color: 'rgba(16, 185, 129, 0.6)'
                        },
                        {
                            offset: 1,
                            color: 'rgba(16, 185, 129, 0.05)'
                        }
                    ])
                },
                itemStyle: {
                    color: '#10B981'
                }
            },
            {
                name: 'JS Heap Limit',
                type: 'line',
                data: timeData.map((time, index) => [time, limitData[index]]),
                smooth: true,
                symbol: 'none',
                lineStyle: {
                    width: 2,
                    type: 'dashed'
                },
                itemStyle: {
                    color: '#F59E0B'
                }
            }
        ]
    };

    chart.setOption(option, true);
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function toggleHistoryView() {
    showFullHistory = !showFullHistory;
    userHasInteracted = false;
    currentDataZoomStart = 80;
    currentDataZoomEnd = 100;
    updateChart();
}

function resetView() {
    showFullHistory = false;
    userHasInteracted = false;
    currentDataZoomStart = 80;
    currentDataZoomEnd = 100;
    updateChart();
}
</script>

<div class="memory-graph">
    <div class="controls">
        <button
            class="toggle-btn"
            class:active={showFullHistory}
            on:click={toggleHistoryView}
            on:mousedown|stopPropagation
            on:pointerdown|stopPropagation
        >
            {showFullHistory ? 'Live View (5min)' : 'Full History'}
        </button>

        <button 
            class="reset-btn" 
            on:click={resetView}
            on:mousedown|stopPropagation
            on:pointerdown|stopPropagation
        >
            Reset View
        </button>

        <div class="status">
            <div class="status-dot" class:active={$isMonitoring}></div>
            <span>{$isMonitoring ? 'Monitoring' : 'Stopped'}</span>
        </div>
    </div>

    <div 
        bind:this={chartContainer} 
        class="chart-container"
        on:mousedown|stopPropagation
        on:pointerdown|stopPropagation
    ></div>

    {#if showFullHistory}
        <div class="help-text">
            Mouse wheel to zoom • Drag to pan • Use slider to navigate • Click "Live View" to return to real-time monitoring
        </div>
    {:else if currentData.length > 0}
        <div 
            class="current-stats"
            on:mousedown|stopPropagation
            on:pointerdown|stopPropagation
        >
            {#if currentData.length > 0}
                {@const latest = currentData[currentData.length - 1]}
                <div class="stat">
                    <span class="label">Used:</span>
                    <span class="value used">{formatBytes(latest.usedJSHeapSize)}</span>
                </div>
                <div class="stat">
                    <span class="label">Total:</span>
                    <span class="value total">{formatBytes(latest.totalJSHeapSize)}</span>
                </div>
                <div class="stat">
                    <span class="label">Limit:</span>
                    <span class="value limit">{formatBytes(latest.jsHeapSizeLimit)}</span>
                </div>
                <div class="stat">
                    <span class="label">Usage:</span>
                    <span class="value usage">{latest.usedPercent.toFixed(1)}%</span>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
.memory-graph {
    background: #1a1a1a;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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

.chart-container {
    width: 100%;
    height: 400px;
    border-radius: 8px;
    background: #242424;
    overflow: hidden;
}

.help-text {
    text-align: center;
    color: #666;
    font-size: 12px;
    margin-top: 10px;
}

.current-stats {
    display: flex;
    justify-content: space-around;
    align-items: center;
    margin-top: 15px;
    padding: 12px;
    background: #242424;
    border-radius: 8px;
    gap: 10px;
}

.stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.stat .label {
    color: #888;
    font-size: 12px;
    font-weight: 500;
}

.stat .value {
    font-size: 14px;
    font-weight: 600;
}

.value.used {
    color: #3B82F6;
}

.value.total {
    color: #10B981;
}

.value.limit {
    color: #F59E0B;
}

.value.usage {
    color: #888;
}

@media (max-width: 768px) {
    .memory-graph {
        padding: 15px;
    }

    .controls {
        flex-direction: column;
        align-items: stretch;
    }

    .chart-container {
        height: 300px;
    }

    .current-stats {
        flex-wrap: wrap;
        gap: 8px;
    }

    .stat {
        flex: 1;
        min-width: 80px;
    }
}
</style>