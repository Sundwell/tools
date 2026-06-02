<template>
  <div>
    <p class="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Invoice History</p>

    <!-- Empty state -->
    <div v-if="invoices.length === 0" class="text-center py-16 text-muted-foreground">
      <p class="text-sm">No invoices yet.</p>
      <p class="text-xs mt-1">
        <NuxtLink to="/invoice" class="text-primary hover:underline">Generate your first invoice.</NuxtLink>
      </p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto rounded-lg border border-border">
      <table class="w-full text-xs text-left">
        <thead class="bg-muted text-muted-foreground">
          <tr>
            <th class="px-4 py-2 text-[10px] uppercase tracking-widest font-medium">#</th>
            <th class="px-4 py-2 text-[10px] uppercase tracking-widest font-medium">Invoice #</th>
            <th class="px-4 py-2 text-[10px] uppercase tracking-widest font-medium">Template</th>
            <th class="px-4 py-2 text-[10px] uppercase tracking-widest font-medium">Date</th>
            <th class="px-4 py-2 text-[10px] uppercase tracking-widest font-medium">Period</th>
            <th class="px-4 py-2 text-[10px] uppercase tracking-widest font-medium text-right">Hours</th>
            <th class="px-4 py-2 text-[10px] uppercase tracking-widest font-medium text-right">Total</th>
            <th class="px-4 py-2 text-[10px] uppercase tracking-widest font-medium text-center">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border bg-card">
          <tr v-for="(inv, i) in invoices" :key="inv.id" class="hover:bg-muted/50 transition-colors">
            <td class="px-4 py-2 text-muted-foreground">{{ i + 1 }}</td>
            <td class="px-4 py-2 font-mono font-medium text-foreground">{{ inv.invoiceNumber }}</td>
            <td class="px-4 py-2">
              <span
                :class="[
                  'inline-block text-[10px] px-1.5 py-0.5 rounded-sm font-medium border',
                  inv.template === 'PA'
                    ? 'bg-violet-950/60 text-violet-300 border-violet-800/30'
                    : 'bg-blue-950/60 text-blue-300 border-blue-800/30',
                ]"
              >{{ inv.template }}</span>
            </td>
            <td class="px-4 py-2 text-muted-foreground">{{ inv.invoiceDate }}</td>
            <td class="px-4 py-2 font-mono text-muted-foreground whitespace-nowrap">{{ inv.periodStart }} – {{ inv.periodEnd }}</td>
            <td class="px-4 py-2 text-right font-mono text-foreground">{{ inv.hours }}</td>
            <td class="px-4 py-2 text-right font-mono font-medium text-foreground">{{ formatTotal(inv) }}</td>
            <td class="px-4 py-2 text-center">
              <div class="flex items-center justify-center gap-2">
                <a
                  :href="`/api/invoices/${inv.id}/download`"
                  download
                  class="text-[11px] px-2 py-1 rounded-sm text-primary hover:bg-accent transition"
                >Download</a>
                <button
                  @click="confirmDelete(inv)"
                  class="text-[11px] px-2 py-1 rounded-sm border border-destructive/50 text-destructive hover:bg-destructive/10 transition"
                >Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete confirmation modal -->
    <div
      v-if="deleteTarget"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      @click.self="deleteTarget = null"
    >
      <div class="bg-card border border-border rounded-lg p-5 max-w-sm w-full mx-4">
        <h2 class="text-sm font-semibold text-foreground mb-1.5">Delete Invoice?</h2>
        <p class="text-xs text-muted-foreground mb-5">
          This will permanently delete invoice <strong class="text-foreground font-medium">{{ deleteTarget.invoiceNumber }}</strong> and its PDF file.
          This cannot be undone.
        </p>
        <div class="flex gap-2 justify-end">
          <button
            @click="deleteTarget = null"
            class="px-3 py-1.5 text-xs border border-border rounded-sm hover:bg-muted transition"
          >Cancel</button>
          <button
            @click="doDelete"
            :disabled="deleting"
            class="px-3 py-1.5 text-xs bg-destructive text-destructive-foreground rounded-sm hover:opacity-90 disabled:opacity-50 transition"
          >{{ deleting ? 'Deleting…' : 'Delete' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Invoice {
  id: string
  template: string
  invoiceNumber: string
  invoiceDate: string
  periodStart: string
  periodEnd: string
  hours: number
  rate: number
  status: string
  pdfPath: string | null
  createdAt: string
}

const { data, refresh } = await useFetch<Invoice[]>('/api/invoices')
const invoices = computed(() => data.value ?? [])

function formatTotal(inv: Invoice): string {
  return `€${(inv.hours * inv.rate).toFixed(2)}`
}

const deleteTarget = ref<Invoice | null>(null)
const deleting = ref(false)

function confirmDelete(inv: Invoice) {
  deleteTarget.value = inv
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/invoices/${deleteTarget.value.id}`, { method: 'DELETE' })
    deleteTarget.value = null
    await refresh()
  } finally {
    deleting.value = false
  }
}
</script>
