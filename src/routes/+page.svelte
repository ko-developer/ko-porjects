<script>
  import { onMount } from 'svelte';
  let { data } = $props();

  // האפליקציה הישנה נטענת כסקריפט קלאסי (גלובלים + onclick מוטבעים) אחרי שה-DOM קיים.
  // הגירה הדרגתית: רכיבים ייחתכו מכאן החוצה ל-lib/ בהמשך.
  onMount(() => {
    const s = document.createElement('script');
    s.src = '/app.js';
    document.body.appendChild(s);
  });
</script>

<svelte:head>
  <title>KO Projects — מתכנן הקמות וחיווט</title>
  {@html `<style>${data.css}</style>`}
</svelte:head>

{@html data.bodyInner}
