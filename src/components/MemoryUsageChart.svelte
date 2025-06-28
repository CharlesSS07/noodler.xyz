<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as d3 from 'd3';

	interface MemoryData {
		timestamp: Date;
		usedJSHeapSize: number;
		totalJSHeapSize: number;
		jsHeapSizeLimit: number;
	}

	let chartContainer: HTMLDivElement;
	let memoryData: MemoryData[] = [];
	let intervalId: number;
	
	const maxDataPoints = 50;
	const updateInterval = 1000; // 1 second
	
	// Chart dimensions
	const margin = { top: 20, right: 30, bottom: 40, left: 60 };
	const width = 600 - margin.left - margin.right;
	const height = 300 - margin.top - margin.bottom;

	function getMemoryInfo(): MemoryData | null {
		if ('memory' in performance) {
			const memory = (performance as any).memory;
			return {
				timestamp: new Date(),
				usedJSHeapSize: memory.usedJSHeapSize / (1024 * 1024), // Convert to MB
				totalJSHeapSize: memory.totalJSHeapSize / (1024 * 1024),
				jsHeapSizeLimit: memory.jsHeapSizeLimit / (1024 * 1024)
			};
		}
		return null;
	}

	function updateChart() {
		if (!chartContainer) return;

		// Clear previous chart
		d3.select(chartContainer).selectAll('*').remove();

		if (memoryData.length === 0) return;

		// Create SVG
		const svg = d3
			.select(chartContainer)
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);

		const g = svg
			.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);

		// Scales
		const xScale = d3
			.scaleTime()
			.domain(d3.extent(memoryData, (d) => d.timestamp) as [Date, Date])
			.range([0, width]);

		const yScale = d3
			.scaleLinear()
			.domain([0, d3.max(memoryData, (d) => Math.max(d.usedJSHeapSize, d.totalJSHeapSize)) || 0])
			.range([height, 0]);

		// Line generators
		const usedLine = d3
			.line<MemoryData>()
			.x((d) => xScale(d.timestamp))
			.y((d) => yScale(d.usedJSHeapSize))
			.curve(d3.curveMonotoneX);

		const totalLine = d3
			.line<MemoryData>()
			.x((d) => xScale(d.timestamp))
			.y((d) => yScale(d.totalJSHeapSize))
			.curve(d3.curveMonotoneX);

		// Add axes
		g.append('g')
			.attr('transform', `translate(0,${height})`)
			.call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%H:%M:%S')));

		g.append('g').call(d3.axisLeft(yScale));

		// Add axis labels
		g.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', 0 - margin.left)
			.attr('x', 0 - height / 2)
			.attr('dy', '1em')
			.style('text-anchor', 'middle')
			.text('Memory (MB)');

		g.append('text')
			.attr('transform', `translate(${width / 2}, ${height + margin.bottom})`)
			.style('text-anchor', 'middle')
			.text('Time');

		// Add lines
		g.append('path')
			.datum(memoryData)
			.attr('fill', 'none')
			.attr('stroke', '#ff6b6b')
			.attr('stroke-width', 2)
			.attr('d', usedLine);

		g.append('path')
			.datum(memoryData)
			.attr('fill', 'none')
			.attr('stroke', '#4ecdc4')
			.attr('stroke-width', 2)
			.attr('d', totalLine);

		// Add legend
		const legend = g
			.append('g')
			.attr('transform', `translate(${width - 120}, 20)`);

		legend
			.append('rect')
			.attr('width', 110)
			.attr('height', 50)
			.attr('fill', 'white')
			.attr('stroke', '#ccc')
			.attr('rx', 3);

		legend
			.append('line')
			.attr('x1', 10)
			.attr('x2', 25)
			.attr('y1', 15)
			.attr('y2', 15)
			.attr('stroke', '#ff6b6b')
			.attr('stroke-width', 2);

		legend
			.append('text')
			.attr('x', 30)
			.attr('y', 19)
			.text('Used Heap')
			.style('font-size', '12px');

		legend
			.append('line')
			.attr('x1', 10)
			.attr('x2', 25)
			.attr('y1', 35)
			.attr('y2', 35)
			.attr('stroke', '#4ecdc4')
			.attr('stroke-width', 2);

		legend
			.append('text')
			.attr('x', 30)
			.attr('y', 39)
			.text('Total Heap')
			.style('font-size', '12px');
	}

	function collectMemoryData() {
		const memInfo = getMemoryInfo();
		if (memInfo) {
			memoryData = [...memoryData, memInfo].slice(-maxDataPoints);
			updateChart();
		}
	}

	onMount(() => {
		// Check if memory API is available
		if (!('memory' in performance)) {
			console.warn('Memory API not available in this browser');
			return;
		}

		// Start collecting data
		collectMemoryData();
		intervalId = setInterval(collectMemoryData, updateInterval);
	});

	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId);
		}
	});
</script>

<div class="memory-chart-container">
	<h3 class="chart-title">Browser Memory Usage</h3>
	{#if !('memory' in performance)}
		<div class="error-message">
			Memory monitoring is not available in this browser. 
			This feature requires Chrome or a Chromium-based browser.
		</div>
	{:else}
		<div bind:this={chartContainer} class="chart-container"></div>
		{#if memoryData.length > 0}
			<div class="memory-stats">
				<div class="stat">
					<span class="label">Current Used:</span>
					<span class="value">{memoryData[memoryData.length - 1].usedJSHeapSize.toFixed(2)} MB</span>
				</div>
				<div class="stat">
					<span class="label">Current Total:</span>
					<span class="value">{memoryData[memoryData.length - 1].totalJSHeapSize.toFixed(2)} MB</span>
				</div>
				<div class="stat">
					<span class="label">Heap Limit:</span>
					<span class="value">{memoryData[memoryData.length - 1].jsHeapSizeLimit.toFixed(2)} MB</span>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.memory-chart-container {
		padding: 20px;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background-color: #fafafa;
		font-family: Arial, sans-serif;
	}

	.chart-title {
		margin: 0 0 15px 0;
		font-size: 18px;
		font-weight: bold;
		color: #333;
		text-align: center;
	}

	.chart-container {
		margin: 20px 0;
		display: flex;
		justify-content: center;
	}

	.error-message {
		padding: 15px;
		background-color: #fff3cd;
		border: 1px solid #ffecb5;
		border-radius: 4px;
		color: #856404;
		text-align: center;
	}

	.memory-stats {
		display: flex;
		justify-content: space-around;
		margin-top: 15px;
		padding: 10px;
		background-color: white;
		border-radius: 4px;
		border: 1px solid #e0e0e0;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.label {
		font-size: 12px;
		color: #666;
		margin-bottom: 4px;
	}

	.value {
		font-size: 16px;
		font-weight: bold;
		color: #333;
	}
</style>