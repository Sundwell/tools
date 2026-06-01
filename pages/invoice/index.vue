<template>
  <div class="max-w-2xl mx-auto py-10 px-4">
    <!-- Nav -->
    <div class="flex items-center justify-between mb-6">
      <NuxtLink to="/" class="text-sm text-blue-600 hover:underline">&larr; Back to Tools</NuxtLink>
      <NuxtLink to="/invoice/history" class="text-sm text-blue-600 hover:underline">Invoice History &rarr;</NuxtLink>
    </div>

    <h1 class="text-2xl font-bold text-gray-900 mb-1">New Monthly Invoices</h1>
    <p class="text-gray-500 mb-8">{{ monthLabel || 'Loading...' }}</p>

    <!-- Step indicator -->
    <div class="flex items-center gap-3 mb-8">
      <div
        v-for="(label, i) in ['PA Invoice', 'OM Invoice']"
        :key="i"
        class="flex items-center gap-2"
      >
        <div
          :class="[
            'w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold',
            step === i + 1
              ? 'bg-blue-600 text-white'
              : step > i + 1
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 text-gray-500',
          ]"
        >
          {{ step > i + 1 ? '✓' : i + 1 }}
        </div>
        <span :class="step === i + 1 ? 'text-gray-900 font-medium' : 'text-gray-400'" class="text-sm">
          {{ label }}
        </span>
        <span v-if="i < 1" class="text-gray-300 mx-1">→</span>
      </div>
    </div>

    <!-- Done state -->
    <div v-if="done" class="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
      <div class="text-4xl mb-4">✓</div>
      <h2 class="text-xl font-semibold text-green-800 mb-2">Both invoices generated!</h2>
      <p class="text-green-600 mb-6">PA and OM invoices have been downloaded.</p>
      <div class="flex gap-3 justify-center">
        <NuxtLink to="/invoice/history" class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          View History
        </NuxtLink>
        <button @click="restart" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          New Month
        </button>
      </div>
    </div>

    <!-- Step 1: PA Invoice -->
    <form v-else-if="step === 1" @submit.prevent="handleGeneratePA" class="space-y-5">
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 class="font-semibold text-gray-800 text-lg border-b pb-3">PA Invoice</h2>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Invoice Number</label>
            <input v-model="paInvoiceNumber" type="text" class="input" placeholder="INV-00038" />
          </div>
          <div>
            <label class="label">Invoice Date</label>
            <input v-model="paInvoiceDate" type="text" class="input" placeholder="DD.MM.YYYY" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Period Start</label>
            <input v-model="periodStart" type="text" class="input" placeholder="DD.MM.YYYY" />
          </div>
          <div>
            <label class="label">Period End</label>
            <input v-model="periodEnd" type="text" class="input" placeholder="DD.MM.YYYY" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Hours</label>
            <input v-model.number="paHours" type="number" step="0.5" min="0" class="input" />
          </div>
          <div>
            <label class="label">Rate (€/hr)</label>
            <input v-model.number="paRate" type="number" step="0.01" min="0" class="input" />
          </div>
        </div>

      </div>

      <!-- Computed totals -->
      <div class="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">Line Amount</span>
          <span class="font-mono font-medium">{{ fmtTable(paLineAmount) }}</span>
        </div>
        <div class="flex justify-between border-t pt-2">
          <span class="text-gray-700 font-semibold">Balance Due</span>
          <span class="font-mono font-semibold text-blue-700">{{ fmtHeader(paBalanceDue) }}</span>
        </div>
      </div>

      <div v-if="errorMsg" class="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
        {{ errorMsg }}
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {{ loading ? 'Generating...' : 'Generate PA PDF' }}
      </button>
    </form>

    <!-- Step 2: OM Invoice -->
    <form v-else-if="step === 2" @submit.prevent="handleGenerateOM" class="space-y-5">
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h2 class="font-semibold text-gray-800 text-lg border-b pb-3">OM Invoice</h2>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Invoice Number</label>
            <input v-model="omInvoiceNumber" type="text" class="input" />
          </div>
          <div>
            <label class="label">Invoice Date</label>
            <input v-model="omInvoiceDate" type="text" class="input" placeholder="DD.MM.YYYY" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Period Start</label>
            <input :value="periodStart" readonly class="input bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label class="label">Period End</label>
            <input :value="periodEnd" readonly class="input bg-gray-50 text-gray-500" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Hours <span class="text-xs text-gray-400">(total − PA)</span></label>
            <input :value="omHours" readonly class="input bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label class="label">Rate (€/hr)</label>
            <input v-model.number="omRate" type="number" step="0.01" min="0" class="input" />
          </div>
        </div>

      </div>

      <!-- Computed totals -->
      <div class="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-500">Line Amount</span>
          <span class="font-mono font-medium">{{ fmtTable(omLineAmount) }}</span>
        </div>
        <div class="flex justify-between border-t pt-2">
          <span class="text-gray-700 font-semibold">Balance Due</span>
          <span class="font-mono font-semibold text-blue-700">{{ fmtHeader(omBalanceDue) }}</span>
        </div>
      </div>

      <div v-if="errorMsg" class="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
        {{ errorMsg }}
      </div>

      <div class="flex gap-3">
        <button
          type="button"
          @click="step = 1"
          class="px-4 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50"
        >
          &larr; Back
        </button>
        <button
          type="submit"
          :disabled="loading"
          class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {{ loading ? 'Generating...' : 'Generate OM PDF' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInvoiceSession } from '~/composables/useInvoiceSession'

const {
  monthLabel, periodStart, periodEnd,
  paInvoiceNumber, paInvoiceDate, paHours, paRate,
  paLineAmount, paBalanceDue,
  omInvoiceNumber, omInvoiceDate, omHours, omRate,
  omLineAmount, omBalanceDue,
  fmtHeader, fmtTable,
  loadDefaults, generatePA, generateOM,
} = useInvoiceSession()

const step = ref(1)
const loading = ref(false)
const errorMsg = ref('')
const done = ref(false)

onMounted(loadDefaults)

function triggerDownload(downloadUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

async function handleGeneratePA() {
  loading.value = true
  errorMsg.value = ''
  try {
    const result = await generatePA()
    triggerDownload(result.downloadUrl, result.filename)
    step.value = 2
  } catch (e: any) {
    errorMsg.value = e?.data?.message || e?.message || 'Failed to generate invoice'
  } finally {
    loading.value = false
  }
}

async function handleGenerateOM() {
  loading.value = true
  errorMsg.value = ''
  try {
    const result = await generateOM()
    triggerDownload(result.downloadUrl, result.filename)
    done.value = true
  } catch (e: any) {
    errorMsg.value = e?.data?.message || e?.message || 'Failed to generate invoice'
  } finally {
    loading.value = false
  }
}

async function restart() {
  done.value = false
  step.value = 1
  errorMsg.value = ''
  await loadDefaults()
}
</script>

<style scoped>
.label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}
.input {
  @apply w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500;
}
</style>
