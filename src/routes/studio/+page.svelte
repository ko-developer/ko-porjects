<script>
  import { onMount } from 'svelte';
  let { data } = $props();
  onMount(() => {
    const s = document.createElement('script');
    s.src = '/studio.js';
    document.body.appendChild(s);
  });
</script>

<svelte:head>
  <title>KO Studio — תכנון הסאונד שלך</title>
  {@html `<style>${data.css}</style>`}
</svelte:head>

{@html data.bodyInner}
