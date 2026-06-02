<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="sticky top-0 z-40 bg-background border-b border-border">
      <div class="max-w-[1200px] mx-auto px-6 h-12 flex items-center justify-between">
        <NuxtLink to="/" class="font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
          Toolbox
        </NuxtLink>
        <nav class="flex items-center gap-6">
          <NuxtLink
            to="/invoice"
            class="text-sm transition-colors pb-px"
            :class="route.path === '/invoice' ? 'text-foreground border-b border-primary' : 'text-muted-foreground hover:text-foreground'"
          >
            Invoices
          </NuxtLink>
          <NuxtLink
            to="/invoice/history"
            class="text-sm transition-colors pb-px"
            :class="route.path.startsWith('/invoice/history') ? 'text-foreground border-b border-primary' : 'text-muted-foreground hover:text-foreground'"
          >
            History
          </NuxtLink>
        </nav>
      </div>
    </header>
    <main class="max-w-[1200px] mx-auto px-6 py-8">
      <NuxtPage />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
</script>
