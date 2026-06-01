<template>
  <div class="max-w-4xl mx-auto py-12 px-4">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Tools</h1>
    <p class="text-gray-500 mb-8">Select a tool to get started</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      <NuxtLink
        v-for="tool in tools"
        :key="tool.id"
        :to="tool.href"
        class="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow hover:shadow-md border border-gray-100 transition-all hover:-translate-y-0.5"
      >
        <span class="text-5xl mb-4">{{ tool.icon }}</span>
        <span class="text-lg font-semibold text-gray-800">{{ tool.title }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { tools } from '~/utils/tools'
</script>
