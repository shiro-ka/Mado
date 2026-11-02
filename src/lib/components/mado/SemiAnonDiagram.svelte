<script lang="ts">
  import { MessageCircle } from "lucide-svelte";
  import MadoIcon from "$lib/components/ui/MadoIcon.svelte";

  const uid = $props.id();
  const arrowId = `arrow-${uid}`;

  // 送り主ごとの色。Suisou の trench テーマの indigo と coral のアクセントの値を写している
  const senderColors = ["oklch(74% 0.1171 282)", "oklch(74% 0.1495 308)"];
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
    class:unknown={face === "unknown"}
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

{#snippet senders(face: "unknown" | null)}
  <div data-suisou-layout="stack gap-3">
    {#each senderColors as color}
      <div data-suisou-layout="row gap-2" style="color: {color}">
        <span data-suisou-item="square" style="color: inherit"><MessageCircle data-suisou-text="fs-20" /></span>
        {@render person("1.5rem", face)}
      </div>
    {/each}
  </div>
{/snippet}

{#snippet view(owner: boolean)}
  <div data-suisou-layout="stack gap-1">
    <MadoIcon data-suisou-text="fs-20" data-suisou="accent" />
    <div data-suisou-layout="row gap-2">
      {@render person("2.5rem", owner ? "smile" : null)}
      {@render senders(owner ? null : "unknown")}
    </div>
  </div>
{/snippet}

<div data-suisou-layout="stack gap-1" data-suisou="mb-4">
  <div data-suisou-tray data-suisou-layout="stack gap-5" data-suisou="p-4">
    <div data-suisou-layout="stack gap-3 center">
      <div role="img" aria-label="図：窓を開いたオーナーに、2人のユーザーがそれぞれ声を届けている。" data-suisou-layout="row middle gap-0">
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
          stroke-linejoin="round"
          data-suisou="note"
          aria-hidden="true"
        >
          <defs>
            <marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M1 1L8 5L1 9" />
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
      <div role="img" aria-label="図：左はオーナーから見たところで、届いた2つの声それぞれに、だれが送ったかが結びついている。右は第三者から見たところで、同じ2つの声は見えるが、送った人はどちらも分からない。" data-suisou-layout="row middle gap-4">
        {@render view(true)}
        <div data-suisou="bd-start" class="divider"></div>
        {@render view(false)}
      </div>
      <p data-suisou-text="fs-14 s:fs-16 center">オーナーは、声がだれから届いたのかわかります。<br />第三者は、その声がだれが届けたものなのか分かりません。</p>
    </div>
  </div>
  <p data-suisou-text="fs-12 end">
    <a href="https://github.com/shiro-ka/Mado#readme" target="_blank" rel="noopener noreferrer">詳しい仕様はREADMEをお読みください</a>
  </p>
</div>

<style>
  .person > * {
    vector-effect: non-scaling-stroke;
  }
  .unknown {
    color: var(--suisou-color-text);
  }
  .divider {
    align-self: stretch;
  }
</style>
