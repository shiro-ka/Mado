<script lang="ts">
  import { MessageCircle } from "lucide-svelte";
  import MadoIcon from "$lib/components/ui/MadoIcon.svelte";

  const uid = $props.id();
  const arrowId = `arrow-${uid}`;

  // 送り主ごとの色。Suisou の trench テーマの clown と konbu のアクセントの値を写している
  const senderColors = ["oklch(74% 0.1549 55)", "oklch(74% 0.1094 188)"];
</script>

{#snippet person(size: string, face: "smile" | "unknown" | null = null)}
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="person"
  >
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 0 0-16 0" />
    {#if face === "smile"}
      <path d="M10.5 6.5v1M13.5 6.5v1M10.3 9.3q1.7 1.3 3.4 0" />
    {:else if face === "unknown"}
      <path d="M10.8 6.6a1.3 1.3 0 1 1 1.7 1.3q-.5.2-.5.8v.3" />
      <circle cx="12" cy="10.6" r=".3" fill="currentColor" />
    {/if}
  </svg>
{/snippet}

{#snippet voice()}
  <span data-suisou-item="square"><MessageCircle data-suisou-text="fs-20" /></span>
{/snippet}

{#snippet senders(face: "unknown" | null)}
  <div data-suisou-layout="stack gap-3">
    {#each senderColors as color}
      <div data-suisou-layout="row gap-2" style="color: {color}">
        {@render voice()}
        {#if face === "unknown"}
          <span class="unknown">{@render person("1.5rem", face)}</span>
        {:else}
          {@render person("1.5rem", face)}
        {/if}
      </div>
    {/each}
  </div>
{/snippet}

<div data-suisou-tray data-suisou-layout="stack gap-5" data-suisou="p-4">
  <div data-suisou-layout="stack gap-3 center">
    <div data-suisou-layout="row middle gap-0">
      <div data-suisou-layout="stack gap-1 center">
        <MadoIcon data-suisou-text="fs-32" data-suisou="accent" />
        {@render person("3.5rem", "smile")}
      </div>
      <svg
        viewBox="0 0 80 96"
        width="80"
        height="96"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        data-suisou="note"
        aria-hidden="true"
      >
        <defs>
          <marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M1 1L8 5L1 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </marker>
        </defs>
        <path d="M76 28Q44 4 6 14" marker-end="url(#{arrowId})" />
        <path d="M76 76Q40 34 6 24" marker-end="url(#{arrowId})" />
      </svg>
      {@render senders(null)}
    </div>
    <p data-suisou-text="fs-14 s:fs-16 center">オーナーは、窓を開きます。<br />開いている窓に、ユーザーは声を届けます。</p>
  </div>

  <div data-suisou-layout="stack gap-3 center">
    <div data-suisou-layout="row middle gap-4">
      <div data-suisou-layout="stack gap-1">
        <MadoIcon data-suisou-text="fs-20" data-suisou="accent" />
        <div data-suisou-layout="row gap-2">
          {@render person("2.5rem", "smile")}
          {@render senders(null)}
        </div>
      </div>
      <div data-suisou="bd-start" class="divider"></div>
      <div data-suisou-layout="stack gap-1">
        <MadoIcon data-suisou-text="fs-20" data-suisou="accent" />
        <div data-suisou-layout="row gap-2">
          {@render person("2.5rem")}
          {@render senders("unknown")}
        </div>
      </div>
    </div>
    <p data-suisou-text="fs-14 s:fs-16 center">オーナーは、声がだれから届いたのかわかります。<br />第三者は、その声がだれが届けたものなのか分かりません。</p>
  </div>
</div>

<style>
  .unknown {
    display: contents;
    color: var(--suisou-color-text);
  }
  .person > * {
    vector-effect: non-scaling-stroke;
  }
  .divider {
    align-self: stretch;
  }
</style>
