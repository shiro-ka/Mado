<script lang="ts">
  import { sendKoe } from "$lib/api.js";
  import PostForm from "$lib/components/mado/PostForm.svelte";

  interface Props {
    boxOwnerDid: string;
    boxRkey: string;
    senderHandle: string;
  }

  let { boxOwnerDid, boxRkey, senderHandle }: Props = $props();
</script>

<PostForm
  label="声の内容"
  rows={5}
  helper={`この声は @${senderHandle} からの声として窓のオーナーに届きます。`}
  submitLabel="声を送る"
  failMessage="送信に失敗しました"
  successTitle="声を送信しました！"
  againLabel="別の声を送る"
  submit={async (body) => {
    await sendKoe(boxOwnerDid, boxRkey, body);
  }}
>
  {#snippet successDetail()}
    <p data-suisou-text="fs-14" data-suisou="note">相手に届くまでしばらくお待ちください。</p>
  {/snippet}
</PostForm>
