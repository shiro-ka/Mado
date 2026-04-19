<script lang="ts">
  import DashboardHome from "$lib/components/DashboardHome.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>ダッシュボード | Mado</title>
</svelte:head>

<DashboardHome
  session={data.session}
  boxes={data.boxes}
  questions={data.questions}
  sessionTtl={data.sessionTtl}
/>
