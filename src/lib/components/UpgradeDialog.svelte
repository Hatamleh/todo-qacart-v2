<script lang="ts">
  import { api, ApiError, type Account } from '$lib/api'
  import { CANCEL_KEEP_LIMIT, PLAN_TODO_LIMITS, planName } from '$lib/rules'
  import Modal from './Modal.svelte'

  let { onclose, onupgraded }: { onclose: () => void; onupgraded: (a: Account, limit: number) => void } =
    $props()

  let acceptedTerms = $state(false)
  let selected = $state<number>(PLAN_TODO_LIMITS[0])
  let busy = $state(false)
  let error = $state('')

  async function confirm() {
    busy = true
    error = ''
    try {
      const account = await api<Account>('/subscription', {
        method: 'POST',
        body: { todoLimit: selected, acceptedTerms },
      })
      onupgraded(account, selected)
    } catch (e) {
      error = e instanceof ApiError ? e.message : 'Something went wrong.'
      busy = false
    }
  }
</script>

<Modal testid="upgrade_sheet" title="Upgrade your plan" {onclose}>
  <p class="muted">Choose how many todos you want to be able to create.</p>

  <div class="terms">
    <strong>Terms of service</strong>
    <p data-testid="terms_text">
      Your plan renews monthly until you cancel. You can cancel at any time, but you must first
      delete your todos down to {CANCEL_KEEP_LIMIT} or fewer. You cannot switch to a different plan
      without cancelling your current one first.
    </p>
    <label class="check">
      <input type="checkbox" data-testid="terms_checkbox" bind:checked={acceptedTerms} disabled={busy} />
      I accept the terms
    </label>
  </div>

  <label class="field-label" for="plan">Number of todos</label>
  <select id="plan" data-testid="plan_dropdown" bind:value={selected} disabled={busy}>
    {#each PLAN_TODO_LIMITS as limit (limit)}
      <option value={limit} data-testid="plan_option_{limit}">{limit} todos · {planName(limit)}</option>
    {/each}
  </select>

  {#if error}<div class="error" data-testid="upgrade_error_message">{error}</div>{/if}

  <button
    class="btn primary block"
    data-testid="upgrade_confirm_button"
    disabled={!acceptedTerms || busy}
    onclick={confirm}
  >
    {busy ? 'Upgrading…' : `Upgrade to ${selected} todos`}
  </button>
</Modal>

<style>
  .terms { background: var(--surface-2); border-radius: 12px; padding: 14px; margin: 16px 0 18px; }
  .terms p { font-size: 13px; line-height: 1.45; color: var(--muted); margin: 6px 0 8px; }
  .check { display: flex; gap: 10px; align-items: center; font-weight: 500; cursor: pointer; }
  .field-label { display: block; font-weight: 600; margin-bottom: 8px; }
  .block { width: 100%; margin-top: 20px; }
  .error { margin-top: 14px; }
</style>
