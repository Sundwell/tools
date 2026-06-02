<template>
  <div>
    <!-- Page header -->
    <div class="mb-5">
      <h1 class="text-base font-semibold text-foreground">Monthly Invoices</h1>
      <p class="text-xs text-muted-foreground mt-0.5">{{ selectedMonth ? monthLabel : 'Select a month to get started' }}</p>
    </div>

    <!-- Workspace bar -->
    <div class="bg-card border border-border rounded-md px-4 py-2.5 mb-5 flex flex-wrap items-center gap-5">
      <div class="w-44">
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
      <span v-if="weekdays" class="text-xs text-muted-foreground">
        {{ weekdays }} days · {{ totalHours }} h
      </span>
      <span v-if="periodStart && periodEnd" class="text-xs font-mono text-muted-foreground">
        {{ periodStart }} – {{ periodEnd }}
      </span>
      <span v-else class="text-xs font-mono text-muted-foreground">—</span>
    </div>

    <!-- Two-column grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <!-- PA Card -->
      <div class="bg-card border border-border rounded-lg p-4 space-y-3">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <h2 class="text-sm font-medium text-foreground">PA Invoice</h2>
          <span v-if="paStatus === 'done'" class="text-[10px] px-1.5 py-0.5 rounded-sm bg-green-900/50 text-green-300 font-medium">Generated</span>
          <span v-else-if="paStatus === 'error'" class="text-[10px] px-1.5 py-0.5 rounded-sm bg-destructive/20 text-destructive font-medium">Failed</span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Invoice Number</label>
            <input
              v-model="paInvoiceNumber"
              v-maska="'INV-#####'"
              type="text"
              :disabled="paStatus === 'done'"
              class="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <div>
            <label class="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Invoice Date</label>
            <DatePicker v-model="paInvoiceDate" :disabled="paStatus === 'done'" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Hours</label>
            <input
              v-model.number="paHours"
              type="number"
              step="0.5"
              min="0"
              :disabled="paStatus === 'done'"
              class="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <div>
            <label class="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Rate (€/hr)</label>
            <input
              v-model.number="paRate"
              type="number"
              step="0.01"
              min="0"
              :disabled="paStatus === 'done'"
              class="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>

        <div class="bg-background/60 border border-border rounded-lg p-3 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Line Amount</span>
            <span class="font-mono font-medium text-foreground">{{ fmtTable(paLineAmount) }}</span>
          </div>
          <div class="flex justify-between border-t border-border pt-2">
            <span class="text-foreground font-medium">Balance Due</span>
            <span class="font-mono font-semibold text-primary">{{ fmtHeader(paBalanceDue) }}</span>
          </div>
        </div>

        <div v-if="paError" class="text-sm bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-3 py-2">{{ paError }}</div>

        <button
          @click="handleGeneratePA"
          :disabled="paStatus === 'done' || paStatus === 'generating'"
          class="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition cursor-pointer"
        >{{ paStatus === 'done' ? 'Generated ✓' : paStatus === 'generating' ? 'Generating...' : 'Generate PA PDF' }}</button>
      </div>

      <!-- OM Card -->
      <div class="bg-card border border-border rounded-lg p-4 space-y-3">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <h2 class="text-sm font-medium text-foreground">OM Invoice</h2>
          <span v-if="omStatus === 'done'" class="text-[10px] px-1.5 py-0.5 rounded-sm bg-green-900/50 text-green-300 font-medium">Generated</span>
          <span v-else-if="omStatus === 'error'" class="text-[10px] px-1.5 py-0.5 rounded-sm bg-destructive/20 text-destructive font-medium">Failed</span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Invoice Number</label>
            <input
              v-model="omInvoiceNumber"
              v-maska="'INV-#####'"
              type="text"
              :disabled="omStatus === 'done'"
              class="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <div>
            <label class="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Invoice Date</label>
            <DatePicker v-model="omInvoiceDate" :disabled="omStatus === 'done'" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Hours</label>
            <input
              v-model.number="omHours"
              type="number"
              step="0.5"
              min="0"
              :disabled="omStatus === 'done'"
              class="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <div>
            <label class="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Rate (€/hr)</label>
            <input
              v-model.number="omRate"
              type="number"
              step="0.01"
              min="0"
              :disabled="omStatus === 'done'"
              class="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>

        <div class="bg-background/60 border border-border rounded-lg p-3 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Line Amount</span>
            <span class="font-mono font-medium text-foreground">{{ fmtTable(omLineAmount) }}</span>
          </div>
          <div class="flex justify-between border-t border-border pt-2">
            <span class="text-foreground font-medium">Balance Due</span>
            <span class="font-mono font-semibold text-primary">{{ fmtHeader(omBalanceDue) }}</span>
          </div>
        </div>

        <div v-if="omError" class="text-sm bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-3 py-2">{{ omError }}</div>

        <button
          @click="handleGenerateOM"
          :disabled="omStatus === 'done' || omStatus === 'generating'"
          class="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition cursor-pointer"
        >{{ omStatus === 'done' ? 'Generated ✓' : omStatus === 'generating' ? 'Generating...' : 'Generate OM PDF' }}</button>
      </div>
    </div>

    <!-- Generate All -->
    <div class="flex items-center justify-end pt-3 mt-1 border-t border-border">
      <button
        @click="handleGenerateAll"
        :disabled="(paStatus === 'done' && omStatus === 'done') || paStatus === 'generating' || omStatus === 'generating'"
        class="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition cursor-pointer"
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
