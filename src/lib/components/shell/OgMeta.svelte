<script lang="ts">
  interface Props {
    title: string;
    description: string;
    url: string;
    image: string;
    type?: "website" | "article";
  }

  let { title, description, url, image, type = "website" }: Props = $props();
</script>

<svelte:head>
  <meta property="og:type" content={type} />
  <meta property="og:site_name" content="Mado" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta property="og:image" content={image} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={image} />
</svelte:head>
