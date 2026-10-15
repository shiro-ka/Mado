<script lang="ts">
  import { Home } from "lucide-svelte";
  import DashboardHome from "$lib/components/DashboardHome.svelte";
  import Skeleton from "$lib/components/ui/Skeleton.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>ホーム | Mado</title>
</svelte:head>

{#await data.dashboard}
  <div data-suisou-layout="stack gap-4" data-suisou="container" class="page">
    <div data-suisou-layout="row" class="head">
      <Home data-suisou-text="fs-20" data-suisou="accent" />
      <h1 data-suisou-text="fs-24 fw-700">ホーム</h1>
    </div>
    <div data-suisou-layout="even gap-3" class="row">
      {#each Array(3) as _}
        <Skeleton height="5.5rem" heightWide="6.5rem" />
      {/each}
    </div>
    <div data-suisou-layout="stack md:even gap-3" class="row">
      <Skeleton height="13rem" />
      <Skeleton height="13rem" />
    </div>
  </div>
{:then d}
  <DashboardHome
    session={data.session}
    boxes={d.boxes}
    questions={d.questions}
    sessionTtl={data.sessionTtl}
    replyCount={d.replyCount}
  />
{/await}

<style>
  .page {
    --suisou-measure: 56rem;
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
</style>
