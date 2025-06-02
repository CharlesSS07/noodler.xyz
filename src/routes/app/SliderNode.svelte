<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import NodeWrapper from './NodeWrapper.svelte';
</script>

<NodeWrapper label="Slider">
	<div class="relative w-full">
		<Handle type="source" position={Position.Right} />
		<input class="nodrag accent-[#ff4000]" style="direction: rtl;" type="range" />
		<!--        <Handle type="source" position={Position.Right} />-->
		<!--        <br><br>-->
		<!--        <input-->
		<!--          class="accent-[#ff4000]"-->
		<!--          type="text"-->
		<!--        />-->
		<!--        <Handle type="source" position={Position.Right} />-->
		<!--        <br><br>-->
		<!--        <input-->
		<!--          class="accent-[#ff4000]"-->
		<!--          type="password"-->
		<!--        />-->
		<!--        <br><br>-->
		<!--        <input-->
		<!--          class="accent-[#ff4000]"-->
		<!--          type="email"-->
		<!--        />-->
		<!--        <br><br>-->
		<!--        <input-->
		<!--          class="accent-[#ff4000]"-->
		<!--          type="number"-->
		<!--        />-->
		<!--        <br><br>-->
		<!--        <input-->
		<!--          class="accent-[#ff4000]"-->
		<!--          type="tel"-->
		<!--        />-->
		<!--        <br><br>-->
		<!--        <input-->
		<!--          class="accent-[#ff4000]"-->
		<!--          type="url"-->
		<!--        />-->
		<!--        <br><br>-->
		<!--        <input-->
		<!--          class="accent-[#ff4000]"-->
		<!--          type="search"-->
		<!--        />-->
		<!--        <br><br>-->
		<!--        <input-->
		<!--          class="accent-[#ff4000]"-->
		<!--          type="color"-->
		<!--        />-->
		<!--        <br><br>-->
		<!--        <input-->
		<!--          class="accent-[#ff4000]"-->
		<!--          type="date"-->
		<!--        />-->
		<!--        <br><br>-->
		<!--        <input-->
		<!--          class="accent-[#ff4000]"-->
		<!--          type="time"-->
		<!--        />-->
		<!--        <br><br>-->
		<!--        <input-->
		<!--          class="accent-[#ff4000]"-->
		<!--          type="datetime-local"-->
		<!--        />-->
		<!--        <br><br>-->
		<!--        <input-->
		<!--          class="accent-[#ff4000]"-->
		<!--          type="month"-->
		<!--        />-->
		<!--        <br><br>-->
		<!--        <input-->
		<!--          class="accent-[#ff4000]"-->
		<!--          type="week"-->
		<!--        />-->
		<!--        <br><br>-->
		<!--        <input-->
		<!--          class="accent-[#ff4000]"-->
		<!--          type="checkbox"-->
		<!--        />-->
		<!--        <br><br>-->
		<!--        <input-->
		<!--          class="accent-[#ff4000]"-->
		<!--          type="radio"-->
		<!--        />-->
		<!--        <br><br>-->
		<!--        <input-->
		<!--          class="accent-[#ff4000]"-->
		<!--          type="file"-->
		<!--        />-->
	</div>
</NodeWrapper>
