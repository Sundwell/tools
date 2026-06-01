<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarDate } from '@internationalized/date'
import type { DateRange } from 'reka-ui'
import { RangeCalendar } from '~/components/ui/range-calendar'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'

const props = defineProps<{
  start: string // DD.MM.YYYY
  end: string   // DD.MM.YYYY
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:start': [value: string]
  'update:end': [value: string]
}>()

const open = ref(false)

function parseDate(s: string): CalendarDate | undefined {
  if (!s || s.length < 10) return undefined
  const [dd, mm, yyyy] = s.split('.')
  if (!dd || !mm || !yyyy) return undefined
  return new CalendarDate(Number(yyyy), Number(mm), Number(dd))
}

function fmt(d: { day: number; month: number; year: number }): string {
  return `${String(d.day).padStart(2, '0')}.${String(d.month).padStart(2, '0')}.${d.year}`
}

const rangeValue = computed<DateRange>(() => ({
  start: parseDate(props.start),
  end: parseDate(props.end),
}))

function onUpdate(v: DateRange) {
  emit('update:start', v.start ? fmt(v.start) : '')
  emit('update:end', v.end ? fmt(v.end) : '')
  if (v.start && v.end) open.value = false
}

const displayText = computed(() => {
  if (!props.start) return 'Pick period'
  if (!props.end) return props.start
  return `${props.start} – ${props.end}`
})
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        :disabled="disabled"
        class="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground text-left focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        {{ displayText }}
      </button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <RangeCalendar :model-value="rangeValue" @update:model-value="onUpdate" />
    </PopoverContent>
  </Popover>
</template>
