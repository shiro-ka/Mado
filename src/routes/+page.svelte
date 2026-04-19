<script lang="ts">
  import SmartShell from "$lib/components/shell/SmartShell.svelte";
  import DashboardHome from "$lib/components/DashboardHome.svelte";
  import LandingContent from "$lib/components/mado/LandingContent.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.session ? "ダッシュボード | Mado" : "Mado - 半匿名メッセージ"}</title>
  {#if !data.session}
    <meta name="description" content="ATProtocol基盤の半匿名メッセージサービス。Blueskyアカウントで声を送ろう。" />
  {/if}
</svelte:head>

<SmartShell session={data.session}>
  {#if data.session && data.boxes !== undefined}
    {@const session = data.session}
    <DashboardHome
      {session}
      boxes={data.boxes}
      questions={data.questions ?? []}
      sessionTtl={data.sessionTtl ?? null}
    />
  {:else}
    <LandingContent />
  {/if}
</SmartShell>
