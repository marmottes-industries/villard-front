<script setup lang="ts">
import Icon from '@/components/icons/Icon.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUi } from '@/composable/useUi'

const router = useRouter()
const authStore = useAuthStore()
const { sidebarOpen, closeSidebar } = useUi()

function onLogout() {
  authStore.logout()
  router.push({ name: 'login' })
}

function onNav() {
  closeSidebar()
}

interface NavItem {
  to: string
  label: string
  ico: string
  badge?: number
  warn?: boolean
}

const counts = { invReplace: 0, toBuy: 0 }

const gestion: NavItem[] = [
  { to: '/planning', label: 'Planning', ico: 'calendar' },
  { to: '/inventaire', label: 'Inventaire', ico: 'box', badge: counts.invReplace, warn: true },
  { to: '/courses', label: 'Courses', ico: 'cart', badge: counts.toBuy, warn: true },
  { to: '/notes', label: 'Notes', ico: 'note' },
  { to: '/travaux', label: 'Travaux', ico: 'hammer' },
]
</script>

<template>
  <aside class="sidebar" :class="{ open: sidebarOpen }" aria-label="Navigation principale">
    <div class="brand">
      <div class="brand-mark">
        <div class="brand-glyph" style="color: #a9c9a0">
          <Icon name="leaf" :size="20" />
        </div>
        <div class="brand-titles">
          <div class="brand-name">Les Marmottes</div>
          <div class="brand-sub">Villard-de-Lans</div>
        </div>
        <button
          type="button"
          class="brand-close"
          aria-label="Fermer le menu"
          @click="closeSidebar"
        >
          <Icon name="x" :size="16" />
        </button>
      </div>
    </div>

    <nav class="nav" @click="onNav">
      <div class="nav-label">Gestion</div>
      <RouterLink
        v-for="item in gestion"
        :key="item.to"
        v-slot="{ navigate, isActive }"
        :to="item.to"
        custom
      >
        <button class="nav-item" :class="{ active: isActive }" @click="navigate">
          <Icon :name="item.ico" :size="18" class="nav-ico" />
          <span>{{ item.label }}</span>
          <span v-if="item.badge" class="badge" :class="{ warn: item.warn }">
            {{ item.badge }}
          </span>
        </button>
      </RouterLink>

      <div class="nav-label">Projet</div>
      <RouterLink v-slot="{ navigate, isActive }" to="/architecture" custom>
        <button class="nav-item" :class="{ active: isActive }" @click="navigate">
          <Icon name="server" :size="18" class="nav-ico" />
          <span>Architecture</span>
        </button>
      </RouterLink>
    </nav>

    <div class="side-foot">
      <div class="host-pill">
        <span class="host-dot" />
        <div class="host-text">
          <b>Auto-hébergé</b><br />
          home.lan · vos données
        </div>
      </div>
      <button
        type="button"
        class="logout-btn"
        aria-label="Se déconnecter"
        @click="onLogout"
      >
        <Icon name="logout" :size="16" />
        <span>Déconnexion</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.brand-titles {
  flex: 1;
  min-width: 0;
}
.brand-close {
  display: none;
  border: 0;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(232, 239, 230, 0.75);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  transition: background 0.14s, color 0.14s;
}
.brand-close:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.side-foot {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(232, 239, 230, 0.78);
  font-family: var(--sans);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.14s, color 0.14s, border-color 0.14s;
}
.logout-btn:hover {
  background: rgba(176, 88, 74, 0.18);
  border-color: rgba(176, 88, 74, 0.35);
  color: #fff;
}
.logout-btn:active {
  transform: translateY(1px);
}

@media (max-width: 767.98px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: 280px;
    max-width: 84vw;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.22s cubic-bezier(0.22, 0.61, 0.36, 1);
    box-shadow: 0 24px 48px rgba(22, 34, 26, 0.4);
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .brand-close {
    display: flex;
  }
}
</style>
