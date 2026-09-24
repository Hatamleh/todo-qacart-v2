<script lang="ts">
  /** Same mark as todo-flutter/lib/widgets/brand_mark.dart: a "QA" badge, "QAcart", "Todo". */
  let { size = 40, tagline = true }: { size?: number; tagline?: boolean } = $props()
</script>

<div class="brand">
  <div class="badge" style="width: {size}px; height: {size}px; font-size: {size * 0.4}px">QA</div>
  <div>
    <div class="name">QA<span>cart</span></div>
    {#if tagline}<div class="tag">Todo</div>{/if}
  </div>
</div>

<style>
  .brand { display: flex; align-items: center; gap: 12px; }
  .badge {
    display: grid; place-items: center; border-radius: 28%;
    background: linear-gradient(135deg, var(--primary-light), var(--primary-dark));
    color: #fff; font-family: var(--font-display); font-weight: 700;
  }
  .name { font-family: var(--font-display); font-weight: 700; font-size: 20px; letter-spacing: -0.01em; line-height: 1.1; }
  .name span { color: var(--primary); }
  .tag { font-size: 13px; color: var(--muted); font-weight: 500; }
</style>
