<script lang="ts">
  import { deleteKoe } from "$lib/api.js";
  import { Trash2 } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/Button.svelte";

  interface Props {
    rkey: string;
  }

  let { rkey }: Props = $props();

  type State = "idle" | "confirm" | "submitting" | "error";
  let state = $state<State>("idle");

  async function handleClick() {
    if (state === "idle" || state === "error") {
      state = "confirm";
      return;
    }

    if (state === "confirm") {
      state = "submitting";
      try {
        await deleteKoe(rkey);
        await goto("/receive", { invalidateAll: true });
      } catch {
        state = "error";
      }
    }
  }
</script>

<Button
  variant="destructive"
  loading={state === "submitting"}
  onclick={handleClick}
>
  {#snippet leftIcon()}<Trash2 />{/snippet}
  {state === "confirm" ? "本当に削除しますか？" : state === "error" ? "再試行" : "削除"}
</Button>
