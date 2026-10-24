<script lang="ts">
  import type { SVGAttributes } from "svelte/elements";

  let props: SVGAttributes<SVGSVGElement> = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  {...props}
>
  <path d="M17 4 a4 4 0 0 1 4 4 v6 a4 4 0 0 1 -4 4 h-4 l-5 3 v-3 h-1 a4 4 0 0 1 -4 -4 V8 a4 4 0 0 1 4 -4 z" />
  <line x1="12" y1="7" x2="12" y2="14" />
  <circle cx="9" cy="10.5" r="1.05" fill="currentColor" stroke="none" />
  <circle cx="15" cy="10.5" r="1.05" fill="currentColor" stroke="none" />
</svg>
