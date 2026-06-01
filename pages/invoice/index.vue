<template>
  <div class="max-w-[1200px] mx-auto py-10 px-4">
    <!-- Nav -->
    <div class="flex items-center justify-between mb-6">
      <NuxtLink to="/" class="text-sm text-muted-foreground hover:text-foreground">&larr; Back to Tools</NuxtLink>
      <NuxtLink to="/invoice/history" class="text-sm text-muted-foreground hover:text-foreground">Invoice History &rarr;</NuxtLink>
    </div>

    <h1 class="text-2xl font-bold text-foreground mb-6">New Monthly Invoices</h1>

    <!-- Month selector + stats -->
    <div class="flex flex-wrap items-center gap-4 mb-4">
      <div class="w-52">
        <Select :model-value="selectedMonth" @update:model-value="loadMonth">
          <SelectTrigger>
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in monthOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <span v-if="weekdays" class="text-sm text-muted-foreground">
        {{ weekdays }} weekdays · {{ totalHours }} hrs
      </span>
    </div>

    <!-- Shared billing period (read-only, driven by month selector) -->
    <div class="mb-6 max-w-xs">
      <label class="block text-xs font-medium text-muted-foreground mb-1">Billing Period</label>
      <div class="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        {{ periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : '—' }}
      </div>
    </div>

    <!-- Two-column grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- PA Card -->
      <div class="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <h2 class="font-semibold text-foreground text-lg">PA Invoice</h2>
          <span v-if="paStatus === 'done'" class="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-300 font-medium">Generated</span>
          <span v-else-if="paStatus === 'error'" class="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-medium">Failed</span>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1">Invoice Number</label>
            <input
              v-model="paInvoiceNumber"
              v-maska="'INV-#####'"
              type="text"
              :disabled="paStatus === 'done'"
              class="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1">Invoice Date</label>
            <DatePicker v-model="paInvoiceDate" :disabled="paStatus === 'done'" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1">Hours</label>
            <input
              v-model.number="paHours"
              type="number"
              step="0.5"
              min="0"
              :disabled="paStatus === 'done'"
              class="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1">Rate (€/hr)</label>
            <input
              v-model.number="paRate"
              type="number"
              step="0.01"
              min="0"
              :disabled="paStatus === 'done'"
              class="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>

        <div class="bg-muted/50 rounded-lg border border-border p-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Line Amount</span>
            <span class="font-mono font-medium text-foreground">{{ fmtTable(paLineAmount) }}</span>
          </div>
          <div class="flex justify-between border-t border-border pt-2">
            <span class="text-foreground font-semibold">Balance Due</span>
            <span class="font-mono font-semibold text-primary">{{ fmtHeader(paBalanceDue) }}</span>
          </div>
        </div>

        <div v-if="paError" class="text-sm bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3">{{ paError }}</div>

        <button
          @click="handleGeneratePA"
          :disabled="paStatus === 'done' || paStatus === 'generating'"
          class="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition"
        >{{ paStatus === 'done' ? 'Generated ✓' : paStatus === 'generating' ? 'Generating...' : 'Generate PA PDF' }}</button>
      </div>

      <!-- OM Card -->
      <div class="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <h2 class="font-semibold text-foreground text-lg">OM Invoice</h2>
          <span v-if="omStatus === 'done'" class="text-xs px-2 py-0.5 rounded-full bg-green-900/50 text-green-300 font-medium">Generated</span>
          <span v-else-if="omStatus === 'error'" class="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-medium">Failed</span>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1">Invoice Number</label>
            <input
              v-model="omInvoiceNumber"
              v-maska="'INV-#####'"
              type="text"
              :disabled="omStatus === 'done'"
              class="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1">Invoice Date</label>
            <DatePicker v-model="omInvoiceDate" :disabled="omStatus === 'done'" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1">Hours</label>
            <input
              v-model.number="omHours"
              type="number"
              step="0.5"
              min="0"
              :disabled="omStatus === 'done'"
              class="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1">Rate (€/hr)</label>
            <input
              v-model.number="omRate"
              type="number"
              step="0.01"
              min="0"
              :disabled="omStatus === 'done'"
              class="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>

        <div class="bg-muted/50 rounded-lg border border-border p-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Line Amount</span>
            <span class="font-mono font-medium text-foreground">{{ fmtTable(omLineAmount) }}</span>
          </div>
          <div class="flex justify-between border-t border-border pt-2">
            <span class="text-foreground font-semibold">Balance Due</span>
            <span class="font-mono font-semibold text-primary">{{ fmtHeader(omBalanceDue) }}</span>
          </div>
        </div>

        <div v-if="omError" class="text-sm bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3">{{ omError }}</div>

        <button
          @click="handleGenerateOM"
          :disabled="omStatus === 'done' || omStatus === 'generating'"
          class="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition"
        >{{ omStatus === 'done' ? 'Generated ✓' : omStatus === 'generating' ? 'Generating...' : 'Generate OM PDF' }}</button>
      </div>
    </div>

    <!-- Generate All -->
    <div class="flex justify-center">
      <button
        @click="handleGenerateAll"
        :disabled="(paStatus === 'done' && omStatus === 'done') || paStatus === 'generating' || omStatus === 'generating'"
        class="px-8 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition"
      >{{ (paStatus === 'done' && omStatus === 'done') ? 'All Generated ✓' : 'Generate All Invoices' }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useInvoiceSession } from '~/composables/useInvoiceSession'

const {
  selectedMonth, totalHours, weekdays, periodStart, periodEnd, monthLabel,
  paInvoiceNumber, paInvoiceDate, paHours, paRate,
  paStatus, paError,
  paLineAmount, paBalanceDue,
  omInvoiceNumber, omInvoiceDate, omHours, omRate,
  omStatus, omError,
  omLineAmount, omBalanceDue,
  fmtHeader, fmtTable,
  loadDefaults, loadMonth, generatePA, generateOM,
} = useInvoiceSession()

onMounted(loadDefaults)

const monthOptions = computed(() => {
  const now = new Date()
  const opts = []
  for (let i = -6; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    opts.push({ value, label })
  }
  return opts
})

function triggerDownload(downloadUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

async function handleGeneratePA() {
  try {
    const result = await generatePA()
    triggerDownload(result.downloadUrl, result.filename)
  } catch {
    // error state set in composable
  }
}

async function handleGenerateOM() {
  try {
    const result = await generateOM()
    triggerDownload(result.downloadUrl, result.filename)
  } catch {
    // error state set in composable
  }
}

async function handleGenerateAll() {
  // Generate in parallel, but download sequentially — browsers block simultaneous programmatic downloads
  const paNeeded = paStatus.value !== 'done'
  const omNeeded = omStatus.value !== 'done'

  const [paResult, omResult] = await Promise.allSettled([
    paNeeded ? generatePA() : Promise.resolve(null),
    omNeeded ? generateOM() : Promise.resolve(null),
  ])

  if (paResult.status === 'fulfilled' && paResult.value) {
    triggerDownload(paResult.value.downloadUrl, paResult.value.filename)
  }
  if (omResult.status === 'fulfilled' && omResult.value) {
    await new Promise(r => setTimeout(r, 300))
    triggerDownload(omResult.value.downloadUrl, omResult.value.filename)
  }
}
</script>
