<template>
  <div>
    <div class="mb-8">
      <h1 class="text-base font-semibold text-foreground">Invoice Factory</h1>
      <p class="text-xs text-muted-foreground mt-1">Personal invoicing tools for PA and OM contracts</p>
    </div>
    <div class="flex flex-col gap-2">
      <NuxtLink
        v-for="tool in tools"
        :key="tool.id"
        :to="tool.href"
        class="flex items-center justify-between gap-4 bg-card border border-border rounded-lg px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent group max-w-2xl cursor-pointer"
      >
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded bg-background flex items-center justify-center">
            <svg class="w-4 h-4 text-muted-foreground shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-foreground">{{ tool.title }}</p>
            <p class="text-xs text-muted-foreground">Generate monthly PA and OM invoices as PDF</p>
          </div>
        </div>
        <span class="text-muted-foreground group-hover:text-primary transition-colors text-sm">→</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tools } from '~/utils/tools'
</script>
