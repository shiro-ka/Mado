<script lang="ts">
  import { Send } from "lucide-svelte";
  import SentList from "$lib/components/mado/SentList.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>送信トレイ | Mado</title>
</svelte:head>

<div class="px-6 py-8 max-w-2xl mx-auto">
  <!-- Header -->
  <div class="flex items-center gap-3 mb-8">
    <div class="w-9 h-9 rounded-xl flex items-center justify-center bg-accent-light">
      <Send size={17} class="text-accent" />
    </div>
    <div>
      <h1 class="text-xl font-bold text-primary">送信トレイ</h1>
      <p class="text-xs text-muted">あなたが送った質問と返信</p>
    </div>
  </div>

  <SentList items={data.items} />
</div>
