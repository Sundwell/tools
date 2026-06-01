<template>
  <div class="max-w-5xl mx-auto py-10 px-4">
    <div class="flex items-center justify-between mb-6">
      <NuxtLink to="/invoice" class="text-sm text-blue-600 hover:underline">&larr; Back to Invoice Form</NuxtLink>
    </div>

    <h1 class="text-2xl font-bold text-foreground mb-6">Invoice History</h1>

    <!-- Empty state -->
    <div v-if="invoices.length === 0" class="text-center py-20 text-muted-foreground">
      <p class="text-lg">No invoices yet.</p>
      <p class="text-sm mt-1">
        <NuxtLink to="/invoice" class="text-primary hover:underline">Generate your first invoice.</NuxtLink>
      </p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto rounded-xl border border-border shadow-sm">
      <table class="w-full text-sm text-left">
        <thead class="bg-muted text-muted-foreground uppercase text-xs tracking-wide">
          <tr>
            <th class="px-4 py-3">#</th>
            <th class="px-4 py-3">Invoice #</th>
            <th class="px-4 py-3">Template</th>
            <th class="px-4 py-3">Date</th>
            <th class="px-4 py-3">Period</th>
            <th class="px-4 py-3 text-right">Hours</th>
            <th class="px-4 py-3 text-right">Total</th>
            <th class="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border bg-card">
          <tr v-for="(inv, i) in invoices" :key="inv.id" class="hover:bg-muted/50 transition-colors">
            <td class="px-4 py-3 text-muted-foreground">{{ i + 1 }}</td>
            <td class="px-4 py-3 font-mono font-medium text-foreground">{{ inv.invoiceNumber }}</td>
            <td class="px-4 py-3">
              <span
                :class="[
                  'inline-block px-2 py-0.5 rounded text-xs font-semibold',
                  inv.template === 'PA' ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300',
                ]"
              >{{ inv.template }}</span>
            </td>
            <td class="px-4 py-3 text-muted-foreground">{{ inv.invoiceDate }}</td>
            <td class="px-4 py-3 text-muted-foreground whitespace-nowrap">{{ inv.periodStart }} – {{ inv.periodEnd }}</td>
            <td class="px-4 py-3 text-right font-mono text-foreground">{{ inv.hours }}</td>
            <td class="px-4 py-3 text-right font-mono font-semibold text-foreground">{{ formatTotal(inv) }}</td>
            <td class="px-4 py-3 text-center">
              <div class="flex items-center justify-center gap-2">
                <a
                  :href="`/api/invoices/${inv.id}/download`"
                  download
                  class="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
                >Download</a>
                <button
                  @click="confirmDelete(inv)"
                  class="px-3 py-1.5 text-xs bg-card border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition"
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
      <div class="bg-card border border-border rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
        <h2 class="text-lg font-semibold text-foreground mb-2">Delete Invoice?</h2>
        <p class="text-sm text-muted-foreground mb-6">
          This will permanently delete invoice <strong>{{ deleteTarget.invoiceNumber }}</strong> and its PDF file.
          This cannot be undone.
        </p>
        <div class="flex gap-3 justify-end">
          <button
            @click="deleteTarget = null"
            class="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition"
          >Cancel</button>
          <button
            @click="doDelete"
            :disabled="deleting"
            class="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition"
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
