<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth'

type AsyncState = 'idle' | 'loading' | 'error'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const state = ref<AsyncState>('idle')
const errorMessage = ref<string | null>(null)

async function onSubmit() {
  state.value = 'loading'
  errorMessage.value = null

  try {
    await authStore.login({
      username: username.value,
      password: password.value,
    })
    await router.push({ name: 'planning' })
  } catch (err) {
    state.value = 'error'
    errorMessage.value = extractErrorMessage(err)
  }
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    if (err.response?.status === 401) {
      return 'Identifiants invalides.'
    }
    if (err.code === 'ERR_NETWORK') {
      return 'Impossible de joindre le serveur.'
    }
  }
  return 'Une erreur est survenue. Réessaie.'
}
</script>

<template>
  <div class="login-wrap">
    <form class="card login-card" @submit.prevent="onSubmit">
      <!-- Aucun logement n'est connu avant l'authentification : libellé générique. -->
      <div class="eyebrow" style="margin-bottom: 8px">Gestion de logements</div>
      <h1 style="font-size: 26px; margin-bottom: 24px">Connexion</h1>

      <div class="field">
        <label for="username">Identifiant</label>
        <input
            id="username"
            v-model="username"
            type="text"
            autocomplete="username"
            required
            :disabled="state === 'loading'"
        />
      </div>

      <div class="field">
        <label for="password">Mot de passe</label>
        <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            :disabled="state === 'loading'"
        />
      </div>

      <p v-if="state === 'error'" class="error-msg">
        {{ errorMessage }}
      </p>

      <button
          type="submit"
          class="submit"
          :disabled="state === 'loading'"
      >
        {{ state === 'loading' ? 'Connexion…' : 'Se connecter' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-wrap {
  display: grid;
  place-items: center;
  min-height: 100vh;
  background: var(--paper);
  padding: 24px;
}

.login-card {
  padding: 32px;
  min-width: 320px;
  max-width: 400px;
  width: 100%;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.field label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field input {
  font: inherit;
  font-size: 14px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--paper);
  color: var(--ink);
  outline: none;
  transition: border-color 0.12s;
}

.field input:focus {
  border-color: var(--accent);
}

.field input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  font-size: 13px;
  color: #b94343;
  margin: -4px 0 16px;
}

.submit {
  width: 100%;
  padding: 12px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  background: var(--ink);
  color: var(--paper);
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.12s;
}

.submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
