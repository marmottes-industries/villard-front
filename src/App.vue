<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/layouts/AppShell.vue'
import { useAccentTheme } from '@/composable/useAccentTheme'

const route = useRoute()
const bare = computed(() => Boolean(route.meta.bare))

// Monté une seule fois pour toute l'application : la teinte suit le logement
// actif et se réinitialise à la déconnexion.
useAccentTheme()
</script>

<template>
  <AppShell v-if="!bare">
    <RouterView />
  </AppShell>
  <RouterView v-else />
</template>
