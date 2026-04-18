<script lang="ts">
  import { Trash2 } from "lucide-svelte";
  import { goto, invalidateAll } from "$app/navigation";
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
        const res = await fetch(`/api/questions/${rkey}`, { method: "DELETE" });
        if (!res.ok) {
          state = "error";
        } else {
          await goto("/dashboard/questions");
          await invalidateAll();
        }
      } catch {
        state = "error";
      }
    }
  }
</script>

<Button
  variant="destructive"
  size="sm"
  class="flex-1 sm:flex-none"
  loading={state === "submitting"}
  onclick={handleClick}
>
  {#snippet leftIcon()}<Trash2 size={14} />{/snippet}
  {state === "confirm" ? "本当に削除しますか？" : state === "error" ? "再試行" : "削除"}
</Button>
