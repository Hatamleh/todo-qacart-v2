<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    testid,
    title,
    onclose,
    children,
    actions,
  }: { testid: string; title: string; onclose: () => void; children: Snippet; actions?: Snippet } = $props()
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={(e) => e.target === e.currentTarget && onclose()}>
  <div class="modal" role="dialog" aria-modal="true" aria-label={title} data-testid={testid}>
    <h2>{title}</h2>
    {@render children()}
    {#if actions}<div class="actions">{@render actions()}</div>{/if}
  </div>
</div>

<style>
  .backdrop {
    position: fixed; inset: 0; z-index: 20;
    background: rgb(15 15 30 / 0.45);
    display: grid; place-items: center; padding: 16px;
  }
  .modal {
    width: min(460px, 100%);
    background: var(--surface); color: var(--text);
    border-radius: 18px; padding: 24px;
    box-shadow: 0 20px 60px rgb(0 0 0 / 0.25);
  }
  h2 { margin: 0 0 12px; font-family: var(--font-display); font-size: 22px; }
  .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
</style>
