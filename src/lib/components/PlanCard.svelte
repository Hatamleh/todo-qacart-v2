<script lang="ts">
  import { Crown, User } from '@lucide/svelte'
  import type { Account } from '$lib/api'
  import { CANCEL_KEEP_LIMIT } from '$lib/rules'

  let { account, onupgrade, oncancel }: { account: Account; onupgrade: () => void; oncancel: () => void } =
    $props()

  const atLimit = $derived(account.used >= account.todoLimit)
</script>

<section class="card plan" data-testid="plan_card">
  <div class="row">
    {#if account.subscription}<Crown size={20} color="var(--primary)" />{:else}<User size={20} color="var(--primary)" />{/if}
    <strong data-testid="plan_name">{account.plan} plan</strong>
    <span class="usage" class:danger={atLimit} data-testid="plan_usage">{account.used} / {account.todoLimit}</span>
  </div>

  <p class="remaining muted">{account.remaining} slot{account.remaining === 1 ? '' : 's'} left</p>
  <div class="bar"><div class:danger={atLimit} style="width: {Math.min(100, (account.used / account.todoLimit) * 100)}%"></div></div>

  {#if !account.subscription}
    <button class="btn primary block" data-testid="upgrade_button" onclick={onupgrade}>Upgrade plan</button>
  {:else}
    <button class="btn outline block" data-testid="cancel_subscription_button" disabled={!account.canCancel} onclick={oncancel}>
      Cancel subscription
    </button>
    {#if !account.canCancel}
      <p class="hint danger" data-testid="cancel_blocked_hint">
        Delete {account.todosToDeleteBeforeCancel} more todo(s) to cancel — you can only cancel with {CANCEL_KEEP_LIMIT} or fewer todos.
      </p>
    {/if}
    <p class="hint" data-testid="switch_plan_hint">To choose a different plan, cancel this one first.</p>
  {/if}
</section>

<style>
  .plan { padding: 24px; }
  strong { font-family: var(--font-display); font-size: 18px; }
  .row { display: flex; align-items: center; gap: 10px; }
  .usage { margin-left: auto; font-weight: 700; color: var(--muted); }
  .usage.danger { color: var(--danger); }
  .remaining { font-size: 13px; margin: 14px 0 8px; }
  .bar { height: 8px; border-radius: 8px; background: var(--surface-3); margin: 0 0 20px; overflow: hidden; }
  .bar div { height: 100%; background: var(--primary); transition: width 0.2s; }
  .bar div.danger { background: var(--danger); }
  .block { width: 100%; }
  .hint { font-size: 13px; color: var(--muted); margin: 8px 0 0; }
  .hint.danger { color: var(--danger); }
</style>
