<script lang="ts">
  import { MessageCircle, UserCheck, Send, Inbox } from "lucide-svelte";
  import MadoIcon from "$lib/components/ui/MadoIcon.svelte";
  import LoginButton from "$lib/components/shell/LoginButton.svelte";
  import SemiAnonDiagram from "$lib/components/mado/SemiAnonDiagram.svelte";

  let { loggedIn = false }: { loggedIn?: boolean } = $props();

  const login = { icon: UserCheck, title: "Blueskyでログイン" };

  const guides = [
    {
      title: "声を送る",
      steps: [login, { icon: Send, title: "窓から声を送る" }],
    },
    {
      title: "声を受け取る",
      steps: [login, { icon: MessageCircle, title: "窓を開ける" }, { icon: Inbox, title: "声を受け取る" }],
    },
  ];
</script>

{#snippet loginBox(space: string)}
  <div data-suisou="{space} p-4" data-suisou-tray data-suisou-layout="stack gap-1 center">
    <LoginButton label="窓を開く" data-suisou-text="fs-16" style="--suisou-size-button: 3rem" />
    <LoginButton look="other" />
  </div>
{/snippet}

<div data-suisou-layout="stack gap-5" data-suisou="container-s py-4 px-3">
  <div data-suisou-layout="stack gap-4 center" data-suisou-text="center">
    <div data-suisou-layout="row">
      <MadoIcon data-suisou-text="fs-32" data-suisou="accent" />
      <p data-suisou-text="fs-28 fw-700">Mado</p>
    </div>
    <p data-suisou-text="fs-16 s:fs-20 fw-500">Blueskyで届ける半匿名のメッセージ</p>
    {#if !loggedIn}
      {@render loginBox("mt-4 mb-4")}
    {/if}
  </div>

  <SemiAnonDiagram />

  <div data-suisou-layout="stack gap-4">
    <h2 data-suisou-text="fs-24 s:fs-28 fw-700 center">つかいかた</h2>
    {#each guides as guide}
      <div data-suisou-tray data-suisou-layout="stack gap-5" data-suisou="p-4">
        <h3 data-suisou-text="fs-20 fw-700 center">{guide.title}</h3>
        <div data-suisou-layout="stack s:row middle gap-5">
          {#each guide.steps as step, i}
            <div data-suisou-layout="stack gap-3 center" data-suisou-text="center">
              <span class="tile">
                <span data-suisou-item="square"><step.icon data-suisou-text="fs-20" data-suisou="accent" /></span>
                <span data-suisou-text="fs-12 fw-700" data-suisou="accent" class="num">{i + 1}</span>
              </span>
              <h4 data-suisou-text="fs-16 fw-500">{step.title}</h4>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  {#if !loggedIn}
    <div data-suisou-layout="stack gap-4 center" data-suisou-text="center" data-suisou="mt-4">
      <h2 data-suisou-text="fs-24 s:fs-28 fw-700">はじめる</h2>
      {@render loginBox("mb-4")}
    </div>
  {/if}
</div>

<style>
  .tile {
    position: relative;
    flex: none;
  }
  .num {
    position: absolute;
    top: -0.375rem;
    inset-inline-end: -0.375rem;
    display: grid;
    place-items: center;
    width: 1.25rem;
    height: 1.25rem;
    border-radius: var(--suisou-radius-pill);
    background: var(--suisou-color-bg);
    border: 1px solid var(--suisou-color-accent);
  }
</style>
