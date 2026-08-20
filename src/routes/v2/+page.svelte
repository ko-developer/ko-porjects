<script>
  import { onMount } from 'svelte';
  let { data } = $props();

  onMount(() => {
    document.body.classList.add('v2');
    const s = document.createElement('script');
    s.src = '/app.js';
    s.onload = () => {
      const t = setInterval(() => {
        if (typeof window.wizardStart === 'function') { clearInterval(t); window.wizardStart(); }
      }, 120);
    };
    document.body.appendChild(s);
  });
</script>

<svelte:head>
  <title>KO Projects V2 — אשף מהיר</title>
  {@html `<style>${data.css}</style>`}
</svelte:head>

{@html data.bodyInner}
