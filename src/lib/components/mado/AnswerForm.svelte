<script lang="ts">
  import { postAnswer } from "$lib/api.js";
  import { onMount } from "svelte";
  import { AlertCircle, ExternalLink } from "lucide-svelte";
  import PostForm from "$lib/components/mado/PostForm.svelte";
  import { bskyPostUrl } from "$lib/utils.js";

  interface Props {
    koeUri: string;
    onSuccess?: (answerUri: string, answerBody: string) => void;
  }

  let { koeUri, onSuccess }: Props = $props();

  const CROSSPOST_KEY = "mado:crosspost";

  function lastCrosspost(): boolean {
    try {
      return localStorage.getItem(CROSSPOST_KEY) === "1";
    } catch {
      return false;
    }
  }

  function rememberCrosspost(value: boolean) {
    try {
      localStorage.setItem(CROSSPOST_KEY, value ? "1" : "0");
    } catch {
      return;
    }
  }

  let crosspost = $state(false);
  let crosspostFailed = $state(false);
  let crosspostLink = $state<string | null>(null);

  onMount(() => {
    crosspost = lastCrosspost();
  });

  async function submit(body: string) {
    const data = await postAnswer(koeUri, body, crosspost);
    crosspostFailed = crosspost && data.crossposted === false;
    crosspostLink = data.crosspostUri ? bskyPostUrl(data.crosspostUri) : null;
    rememberCrosspost(crosspost);
    onSuccess?.(data.uri, body);
  }

  function reset() {
    crosspost = lastCrosspost();
    crosspostFailed = false;
    crosspostLink = null;
  }
</script>

<PostForm
  label="返信"
  rows={4}
  submitLabel="返信を投稿"
  failMessage="返信の投稿に失敗しました"
  successTitle="返信を投稿しました"
  againLabel="続けて返信する"
  {submit}
  onReset={reset}
>
  {#snippet successDetail()}
    {#if crosspostFailed}
      <p data-suisou-layout="row" data-suisou-text="fs-14" data-suisou="warning">
        <AlertCircle />
        Blueskyへの転載は失敗しました
      </p>
    {:else if crosspostLink}
      <a
        data-suisou-layout="row"
        data-suisou-text="fs-14 link"
        href={crosspostLink}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink />
        Blueskyの投稿を見る
      </a>
    {/if}
  {/snippet}
  {#snippet options(busy)}
    <label data-suisou-layout="row" class="check">
      <input type="checkbox" bind:checked={crosspost} disabled={busy} />
      <span data-suisou-text="fs-12" data-suisou="note">Bskyにもポスト</span>
    </label>
  {/snippet}
</PostForm>

<style>
  .check {
    cursor: pointer;
    user-select: none;
  }
</style>
