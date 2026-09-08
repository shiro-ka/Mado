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
  <div class="px-6 py-8 max-w-4xl mx-auto">
    <div class="flex items-center gap-2.5 mb-8">
      <Home size={22} class="text-primary shrink-0" />
      <h1 data-suisou-text="s24 w700" class="text-foreground">ホーム</h1>
    </div>
    <div class="grid grid-cols-3 gap-2.5 sm:gap-4 mb-8">
      {#each Array(3) as _}
        <Skeleton height="5.5rem" heightWide="6.5rem" />
      {/each}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
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
