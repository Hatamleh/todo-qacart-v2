<script lang="ts">
  import '../app.css'
  import { toast } from '$lib/toast.svelte'

  let { children } = $props()
</script>

<svelte:head><title>QAcart Todo</title></svelte:head>

{@render children()}

{#if toast.message}
  {#key toast.id}
    <div class="toast" role="status" data-testid="toast">{toast.message}</div>
  {/key}
{/if}

<style>
  .toast {
    position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 30;
    max-width: min(520px, calc(100vw - 32px));
    background: #1e1e30; color: #fff; padding: 12px 18px; border-radius: 12px;
    box-shadow: 0 10px 30px rgb(0 0 0 / 0.25); font-size: 14px;
  }
</style>
