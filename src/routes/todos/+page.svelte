<script lang="ts">
  import { afterNavigate, goto, invalidate, replaceState } from '$app/navigation'
  import { page } from '$app/state'
  import { Inbox, ListPlus, LogOut, Pencil, Plus, Trash2 } from '@lucide/svelte'
  import { tick } from 'svelte'
  import { api, ApiError, type Account, type Todo } from '$lib/api'
  import { FREE_TODO_LIMIT, planName } from '$lib/rules'
  import { showToast } from '$lib/toast.svelte'
  import BrandMark from '$lib/components/BrandMark.svelte'
  import Modal from '$lib/components/Modal.svelte'
  import PlanCard from '$lib/components/PlanCard.svelte'
  import UpgradeDialog from '$lib/components/UpgradeDialog.svelte'

  let { data } = $props()

  let newTitle = $state('')
  let editing = $state<Todo | null>(null)
  let editTitle = $state('')
  let upgradeOpen = $state(false)
  let cancelOpen = $state(false)

  const atLimit = $derived(data.account.used >= data.account.todoLimit)
  const doneCount = $derived(data.todos.filter((t) => t.completed).length)

  // Deep links land here as ?msg= (a result to show) and ?sheet=upgrade.
  // afterNavigate, not onMount: replaceState needs the router, which isn't
  // ready yet while the page is still hydrating.
  afterNavigate(() => {
    const params = page.url.searchParams
    const msg = params.get('msg')
    if (msg) showToast(msg)
    if (params.get('sheet') === 'upgrade') upgradeOpen = true
    if (msg || params.has('sheet')) replaceState('/todos', {})
  })

  const refresh = () => invalidate('app:todos')

  async function run(action: () => Promise<unknown>) {
    try {
      await action()
      return true
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Something went wrong.')
      return false
    } finally {
      await refresh()
    }
  }

  async function add(e: SubmitEvent) {
    e.preventDefault()
    if (await run(() => api('/todos', { method: 'POST', body: { title: newTitle } }))) newTitle = ''
  }

  const toggle = (t: Todo) => run(() => api(`/todos/${t.id}`, { method: 'PATCH', body: { completed: !t.completed } }))
  const remove = (t: Todo) => run(() => api(`/todos/${t.id}`, { method: 'DELETE' }))

  async function openEdit(t: Todo) {
    editing = t
    editTitle = t.title
    await tick()
    document.querySelector<HTMLInputElement>('[data-testid="edit_todo_field"]')?.select()
  }

  async function saveEdit(e?: SubmitEvent) {
    e?.preventDefault()
    const t = editing!
    editing = null
    await run(() => api(`/todos/${t.id}`, { method: 'PATCH', body: { title: editTitle } }))
  }

  async function confirmCancel() {
    cancelOpen = false
    if (await run(() => api<Account>('/subscription', { method: 'DELETE' }))) showToast('Subscription cancelled.')
  }

  async function onUpgraded(_: Account, limit: number) {
    upgradeOpen = false
    showToast(`Upgraded to ${planName(limit)} — you can now have ${limit} todos.`)
    await refresh()
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' })
    await goto('/login', { invalidateAll: true })
  }
</script>

<nav class="topbar">
  <div class="topbar-inner">
    <div data-testid="app_brand"><BrandMark size={34} tagline={false} /></div>
    <div class="user">
      <span class="avatar" aria-hidden="true">{page.data.user?.email?.[0]?.toUpperCase()}</span>
      <span class="email">{page.data.user?.email}</span>
      <button class="btn outline sm" title="Log out" data-testid="logout_button" onclick={logout}>
        <LogOut size={16} /> Log out
      </button>
    </div>
  </div>
</nav>

<div class="page">
  <header class="page-head">
    <div>
      <h1>My todos</h1>
      <p class="muted">
        {data.account.used} of {data.account.todoLimit} used · {data.account.plan} plan
        {#if doneCount > 0}· {doneCount} completed{/if}
      </p>
    </div>
  </header>

  <div class="layout">
    <main>
      <form class="add card" onsubmit={add}>
        <div class="input-icon">
          <ListPlus size={18} />
          <input
            type="text"
            aria-label="New todo"
            data-testid="new_todo_field"
            placeholder={atLimit ? 'Limit reached — upgrade to add more' : 'What needs doing?'}
            disabled={atLimit}
            bind:value={newTitle}
          />
        </div>
        <button class="btn primary" type="submit" aria-label="Add todo" data-testid="add_todo_button" disabled={atLimit}>
          <Plus size={18} /> Add todo
        </button>
      </form>

      {#if data.todos.length === 0}
        <div class="empty card" data-testid="todo_empty_state">
          <Inbox size={56} strokeWidth={1.5} />
          <strong>No todos yet</strong>
          <span>Add your first one above.</span>
        </div>
      {:else}
        <ul class="list card" data-testid="todo_list">
          {#each data.todos as todo, i (todo.id)}
            <li data-testid="todo_item_{i}" data-todo-id={todo.id}>
              <input
                type="checkbox"
                aria-label={todo.completed ? 'Mark as not done' : 'Mark as done'}
                data-testid="todo_checkbox_{i}"
                checked={todo.completed}
                onchange={() => toggle(todo)}
              />
              <span class="title" class:done={todo.completed} data-testid="todo_title_{i}">{todo.title}</span>
              <span class="date muted">{new Date(todo.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              <div class="row-actions">
                <button class="icon-btn" title="Edit" aria-label="Edit" data-testid="todo_edit_button_{i}" onclick={() => openEdit(todo)}>
                  <Pencil size={17} />
                </button>
                <button class="icon-btn danger" title="Delete" aria-label="Delete" data-testid="todo_delete_button_{i}" onclick={() => remove(todo)}>
                  <Trash2 size={17} />
                </button>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </main>

    <aside>
      <PlanCard account={data.account} onupgrade={() => (upgradeOpen = true)} oncancel={() => (cancelOpen = true)} />
    </aside>
  </div>
</div>

{#if editing}
  <Modal testid="edit_todo_dialog" title="Edit todo" onclose={() => (editing = null)}>
    <form id="edit-form" onsubmit={saveEdit}>
      <input type="text" aria-label="Todo title" data-testid="edit_todo_field" bind:value={editTitle} />
    </form>
    {#snippet actions()}
      <button class="btn text" data-testid="edit_todo_cancel_button" onclick={() => (editing = null)}>Cancel</button>
      <button class="btn primary" type="submit" form="edit-form" data-testid="edit_todo_save_button">Save</button>
    {/snippet}
  </Modal>
{/if}

{#if cancelOpen}
  <Modal testid="cancel_subscription_dialog" title="Cancel subscription?" onclose={() => (cancelOpen = false)}>
    <p class="muted">You will go back to the free plan with {FREE_TODO_LIMIT} todos.</p>
    {#snippet actions()}
      <button class="btn text" data-testid="cancel_subscription_keep_button" onclick={() => (cancelOpen = false)}>Keep plan</button>
      <button class="btn primary" data-testid="cancel_subscription_confirm_button" onclick={confirmCancel}>Cancel plan</button>
    {/snippet}
  </Modal>
{/if}

{#if upgradeOpen}
  <UpgradeDialog onclose={() => (upgradeOpen = false)} onupgraded={onUpgraded} />
{/if}

<style>
  .topbar { position: sticky; top: 0; z-index: 10; background: var(--surface); border-bottom: 1px solid var(--surface-3); }
  .topbar-inner { max-width: 1120px; margin: 0 auto; padding: 14px 32px; display: flex; align-items: center; gap: 16px; }
  .user { margin-left: auto; display: flex; align-items: center; gap: 12px; min-width: 0; }
  .avatar {
    width: 32px; height: 32px; border-radius: 50%; flex: none; display: grid; place-items: center;
    background: var(--surface-2); color: var(--primary); font-weight: 700; font-size: 14px;
  }
  .email { font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .page { max-width: 1120px; margin: 0 auto; padding: 56px 32px 80px; }
  .page-head { margin-bottom: 32px; }
  h1 { font-size: 34px; margin: 0 0 6px; }
  .page-head p { margin: 0; }

  .layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 32px; align-items: start; }
  aside { position: sticky; top: 96px; }

  .add { display: flex; gap: 10px; padding: 10px; margin-bottom: 20px; }
  .input-icon { position: relative; flex: 1; color: var(--muted); }
  .input-icon :global(svg) { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); }
  .input-icon input { padding-left: 42px; background: transparent; }
  .add .btn { flex: none; }

  .list { list-style: none; margin: 0; padding: 0; overflow: hidden; }
  li { display: flex; align-items: center; gap: 14px; padding: 14px 12px 14px 20px; border-top: 1px solid var(--surface-3); transition: background 0.15s; }
  li:first-child { border-top: 0; }
  li:hover { background: var(--surface-2); }
  .title { flex: 1; font-weight: 500; overflow-wrap: anywhere; }
  .title.done { text-decoration: line-through; color: var(--muted); }
  .date { font-size: 13px; flex: none; }
  .row-actions { display: flex; gap: 2px; opacity: 0.55; transition: opacity 0.15s; }
  li:hover .row-actions, .row-actions:focus-within { opacity: 1; }

  .empty { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 64px 16px; color: var(--muted); }
  .empty strong { margin-top: 8px; font-size: 16px; color: var(--text); }

  @media (max-width: 860px) {
    .topbar-inner { padding: 12px 16px; }
    .page { padding: 32px 16px 56px; }
    h1 { font-size: 28px; }
    .layout { grid-template-columns: 1fr; gap: 20px; }
    aside { position: static; order: -1; }
    .email, .date { display: none; }
  }
</style>
