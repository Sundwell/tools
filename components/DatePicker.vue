<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarDate } from '@internationalized/date'
import type { DateValue } from 'reka-ui'
import { Calendar } from '~/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'

const props = defineProps<{
  modelValue: string // DD.MM.YYYY
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)

const calendarValue = computed<CalendarDate | undefined>(() => {
  const s = props.modelValue
  if (!s || s.length < 10) return undefined
  const [dd, mm, yyyy] = s.split('.')
  if (!dd || !mm || !yyyy) return undefined
  return new CalendarDate(Number(yyyy), Number(mm), Number(dd))
})

function onSelect(v: DateValue) {
  emit('update:modelValue', `${String(v.day).padStart(2, '0')}.${String(v.month).padStart(2, '0')}.${v.year}`)
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <button
        type="button"
        :disabled="disabled"
        class="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 text-sm text-foreground text-left focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 cursor-pointer"
      >
        {{ modelValue || 'DD.MM.YYYY' }}
      </button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar :model-value="calendarValue" @update:model-value="onSelect" />
    </PopoverContent>
  </Popover>
</template>
