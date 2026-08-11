<script setup lang="ts">
import AppTopbar from '@/components/shell/AppTopbar.vue'
import Icon from '@/components/icons/Icon.vue'

type StackRow = {
  k: string
  label: string
  detail: string
  href: string
}

const stack: StackRow[] = [
  { k: 'Frontend',         label: 'Vue 3 · TypeScript · Vite',   detail: 'SPA statique, build typé',         href: 'https://vuejs.org' },
  { k: 'État & routing',   label: 'Pinia · Vue Router',          detail: 'store auth + navigation',          href: 'https://pinia.vuejs.org' },
  { k: 'Client HTTP',      label: 'Axios + intercepteur JWT',    detail: 'baseURL via VITE_API_URL',         href: 'https://axios-http.com' },
  { k: 'API',              label: 'Symfony 8 · API Platform 4',  detail: 'REST auto-documenté (Swagger)',    href: 'https://api-platform.com' },
  { k: 'Authentification', label: 'LexikJWT',                    detail: 'stateless · TTL 1 h',              href: 'https://github.com/lexik/LexikJWTAuthenticationBundle' },
  { k: 'Persistance',      label: 'Doctrine ORM · MariaDB',      detail: 'migrations versionnées',           href: 'https://mariadb.org' },
  { k: 'Hébergement',      label: 'Infomaniak Web mutualisé',    detail: 'datacenter Suisse · Europe',       href: 'https://www.infomaniak.com/fr/hebergement' },
]

type Principle = {
  ico: string
  title: string
  body: string
}

const principles: Principle[] = [
  {
    ico: 'server',
    title: 'Découplé',
    body: "Front et back vivent dans deux dépôts distincts, reliés par un contrat REST stable. La SPA n'est qu'un client parmi d'autres possibles — la même API peut nourrir un widget, un script, un autre front.",
  },
  {
    ico: 'leaf',
    title: 'Sobre & européen',
    body: 'Aucun service tiers : pas de Google Agenda, pas de cloud propriétaire, pas de tracker. Données hébergées en Suisse chez un opérateur indépendant, sur une infrastructure à faible empreinte.',
  },
  {
    ico: 'users',
    title: 'Standard & portable',
    body: "Stack la plus classique possible — PHP, MariaDB, SPA statique. Aucun service managé spécifique, aucun lock-in : l'application peut être redéployée sur n'importe quel hébergeur mutualisé compatible PHP.",
  },
]
</script>

<template>
  <AppTopbar
    eyebrow="Note d'architecture"
    title="Vos données, chez vous."
    sub="Stack & décisions techniques"
  />

  <div class="content">
    <div class="content-inner view">
      <p class="arc-lede">
        Cette application personnelle <b>découplée</b> gère l'occupation et
        l'inventaire d'un ou plusieurs logements familiaux. Construite
        comme une démonstration d'architecture moderne : un front Vue 3 statique, une
        API Symfony stateless, une base relationnelle classique — et zéro dépendance à
        un service tiers.
      </p>

      <!-- Diagramme -->
      <div class="arc-diagram card">
        <div class="arc-diagram-head">
          <div class="eyebrow">Flux de données</div>
          <span class="arc-badge mono">
            <span class="host-dot" />0 service tiers
          </span>
        </div>

        <div class="arc-clients">
          <div class="arc-node">
            <span class="arc-node-k mono">CLIENTS</span>
            <span class="arc-node-n">Navigateur</span>
            <span class="arc-node-s mono muted">desktop · mobile</span>
          </div>
          <div class="arc-flow vert">
            <span class="arc-line" />
            <span class="mono arc-proto">HTTPS · JWT Bearer</span>
            <span class="arc-line" />
          </div>
        </div>

        <div class="arc-enclosure">
          <span class="arc-enclosure-tag mono">
            <Icon name="pin" :size="12" />
            Infomaniak · mutualisé · Suisse
          </span>
          <div class="arc-row">
            <div class="arc-node">
              <span class="arc-node-k mono">CLIENT</span>
              <span class="arc-node-n">SPA Vue 3</span>
              <span class="arc-node-s mono muted">statique · Vite</span>
            </div>
            <div class="arc-flow">
              <span class="arc-line" />
              <Icon name="chevR" :size="15" />
            </div>
            <div class="arc-node">
              <span class="arc-node-k mono">API</span>
              <span class="arc-node-n">Symfony 8</span>
              <span class="arc-node-s mono muted">API Platform · JWT</span>
            </div>
            <div class="arc-flow">
              <span class="arc-line" />
              <Icon name="chevR" :size="15" />
            </div>
            <div class="arc-node">
              <span class="arc-node-k mono">DONNÉES</span>
              <span class="arc-node-n">MariaDB</span>
              <span class="arc-node-s mono muted">Doctrine ORM</span>
            </div>
          </div>
          <div class="arc-backup">
            <span class="arc-line dashed" />
            <span class="mono muted">
              <Icon name="refresh" :size="12" />
              sauvegardes quotidiennes Infomaniak
            </span>
          </div>
        </div>
      </div>

      <!-- Principes -->
      <div class="arc-principles">
        <div v-for="p in principles" :key="p.title" class="arc-card card">
          <div class="arc-card-ico">
            <Icon :name="p.ico" :size="20" />
          </div>
          <h3>{{ p.title }}</h3>
          <p>{{ p.body }}</p>
        </div>
      </div>

      <!-- Stack -->
      <div class="arc-stack">
        <div class="sec-head">
          <h2>Stack technique</h2>
          <div class="eyebrow">sept briques, deux dépôts</div>
        </div>
        <div class="card arc-stack-table">
          <a
            v-for="row in stack"
            :key="row.k"
            :href="row.href"
            target="_blank"
            rel="noopener noreferrer"
            class="arc-stack-row arc-stack-link"
          >
            <span class="arc-stack-k">{{ row.k }}</span>
            <span class="arc-stack-v">
              <span class="arc-stack-label">{{ row.label }}</span>
              <span class="arc-stack-detail mono muted">{{ row.detail }}</span>
            </span>
          </a>
        </div>
      </div>

      <div class="arc-foot mono">
        <Icon name="leaf" :size="14" />
        Conçu comme pièce de portfolio — code, schéma et démarche disponibles sur demande.
      </div>
    </div>
  </div>
</template>

<style scoped>
.arc-stack-link {
  text-decoration: none;
  color: inherit;
  transition: background 0.14s;
}
.arc-stack-link:hover {
  background: var(--card-2);
}
.arc-stack-v {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.arc-stack-label {
  font-size: 13px;
  color: var(--ink);
  font-weight: 500;
}
.arc-stack-detail {
  font-size: 11px;
}
</style>
