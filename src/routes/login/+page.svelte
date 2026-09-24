<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation'
  import { page } from '$app/state'
  import { Check, Eye, EyeOff } from '@lucide/svelte'
  import { onMount } from 'svelte'
  import { api, ApiError } from '$lib/api'
  import { CANCEL_KEEP_LIMIT, FREE_TODO_LIMIT, PLAN_TODO_LIMITS } from '$lib/rules'
  import { showToast } from '$lib/toast.svelte'
  import BrandMark from '$lib/components/BrandMark.svelte'

  let isLogin = $state(page.url.searchParams.get('mode') !== 'register')
  let email = $state('')
  let password = $state('')
  let showPassword = $state(false)
  let busy = $state(false)
  let error = $state('')

  onMount(() => {
    const msg = page.url.searchParams.get('msg')
    if (msg) showToast(msg)
  })

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    busy = true
    error = ''
    try {
      await api(isLogin ? '/auth/login' : '/auth/register', { method: 'POST', body: { email, password } })
      const next = page.url.searchParams.get('next')
      await invalidateAll()
      await goto(next?.startsWith('/') && !next.startsWith('//') ? next : '/todos')
    } catch (err) {
      error = err instanceof ApiError ? err.message : 'Something went wrong.'
      busy = false
    }
  }

  function toggleMode() {
    isLogin = !isLogin
    error = ''
  }
</script>

<div class="split">
<aside class="hero">
  <div class="hero-inner">
    <h2>Plan it. Tick it off.<br />Test every rule.</h2>
    <ul>
      <li><Check size={18} /> Start free with {FREE_TODO_LIMIT} todos</li>
      <li><Check size={18} /> Upgrade to {PLAN_TODO_LIMITS.join(' / ')} todos any time</li>
      <li><Check size={18} /> Cancel once you are back to {CANCEL_KEEP_LIMIT} or fewer</li>
    </ul>
  </div>
  <p class="hero-foot">QAcart · a system under test for automation courses</p>
</aside>

<main>
  <div class="form-wrap">
  <div data-testid="auth_brand"><BrandMark size={48} /></div>

  <h1 data-testid="auth_title">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
  <p class="muted">{isLogin ? 'Log in to see your todos.' : `Sign up and start with ${FREE_TODO_LIMIT} free todos.`}</p>

  <form onsubmit={submit} novalidate>
    <label for="email">Email</label>
    <input id="email" type="email" autocomplete="email" data-testid="auth_email_field" bind:value={email} />

    <label for="password">Password</label>
    <div class="pw">
      <input
        id="password"
        type={showPassword ? 'text' : 'password'}
        autocomplete={isLogin ? 'current-password' : 'new-password'}
        data-testid="auth_password_field"
        bind:value={password}
      />
      <button
        type="button"
        class="icon-btn"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        data-testid="auth_password_visibility_toggle"
        onclick={() => (showPassword = !showPassword)}
      >
        {#if showPassword}<EyeOff size={18} />{:else}<Eye size={18} />{/if}
      </button>
    </div>

    {#if error}<div class="error" data-testid="auth_error_message">{error}</div>{/if}

    <button class="btn primary" type="submit" data-testid="auth_submit_button" disabled={busy}>
      {busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
    </button>
  </form>

  <button class="btn text" data-testid="auth_toggle_mode_button" onclick={toggleMode}>
    {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
  </button>
  </div>
</main>
</div>

<style>
  .split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); min-height: 100vh; }
  .hero {
    background: radial-gradient(circle at 20% 10%, var(--primary-light), transparent 55%),
      linear-gradient(145deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: #fff; padding: 64px; display: flex; flex-direction: column; justify-content: space-between;
  }
  .hero-inner { margin-top: 12vh; max-width: 460px; }
  .hero h2 { font-size: 40px; line-height: 1.15; margin: 0 0 32px; }
  .hero ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; font-size: 16px; }
  .hero li { display: flex; align-items: center; gap: 12px; }
  .hero li :global(svg) { background: rgb(255 255 255 / 0.18); border-radius: 50%; padding: 3px; width: 24px; height: 24px; }
  .hero-foot { font-size: 13px; opacity: 0.75; margin: 0; }

  main { display: flex; align-items: flex-start; justify-content: center; padding: 14vh 32px 64px; }
  .form-wrap { width: 100%; max-width: 400px; display: flex; flex-direction: column; }
  h1 { font-size: 32px; margin: 40px 0 6px; }
  p { margin: 0 0 32px; }
  form { display: flex; flex-direction: column; gap: 8px; }
  label { font-weight: 500; font-size: 14px; margin-top: 10px; }
  .pw { position: relative; }
  .pw input { padding-right: 48px; }
  .pw .icon-btn { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); }
  .error { margin-top: 8px; }
  button[type='submit'] { margin-top: 22px; }
  .btn.text { margin-top: 14px; align-self: center; }

  @media (max-width: 900px) {
    .split { grid-template-columns: 1fr; }
    .hero { display: none; }
    main { padding: 64px 16px; }
  }
</style>
