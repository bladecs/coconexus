<script setup>
import { computed, ref } from 'vue';
import RichTextPreview from './RichTextPreview.vue';
import { renderLatex } from '@/lib/richText';

const props = defineProps({
  section: { type: Object, required: true },
});

const sectionType = computed(() => props.section.section_type || 'info');

/* ── Procedure: todo-list state ── */
const stepDone = ref({});

function toggleStep(idx) {
  stepDone.value = { ...stepDone.value, [idx]: !stepDone.value[idx] };
}

const steps = computed(() =>
  Array.isArray(props.section.type_data?.steps) ? props.section.type_data.steps : []
);

const totalSteps     = computed(() => steps.value.length);
const completedSteps = computed(() => Object.values(stepDone.value).filter(Boolean).length);
const progressPct    = computed(() =>
  totalSteps.value ? Math.round((completedSteps.value / totalSteps.value) * 100) : 0
);
const allDone = computed(() => totalSteps.value > 0 && completedSteps.value === totalSteps.value);
const activeStepIdx = computed(() => steps.value.findIndex((_, i) => !stepDone.value[i]));

function getStepState(idx) {
  if (stepDone.value[idx]) return 'completed';
  if (idx === activeStepIdx.value) return 'active';
  return 'upcoming';
}

/* ── Warning config ── */
const warningConfig = computed(() => {
  const cfg = {
    info:    { icon: 'info',    label: 'Informasi', color: 'text-blue-700 dark:text-blue-300',  bg: 'bg-blue-50 dark:bg-blue-950/30',  border: 'border-blue-200 dark:border-blue-800/50',  accent: 'border-l-blue-500 dark:border-l-blue-400'  },
    warning: { icon: 'warning', label: 'Perhatian', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800/50', accent: 'border-l-amber-500 dark:border-l-amber-400' },
    danger:  { icon: 'error',   label: 'Bahaya',    color: 'text-red-700 dark:text-red-300',   bg: 'bg-red-50 dark:bg-red-950/30',   border: 'border-red-200 dark:border-red-800/50',   accent: 'border-l-red-500 dark:border-l-red-400'   },
  };
  return cfg[props.section.warning_level] || cfg.info;
});

/* ── Icon mapping (Material Symbols names, not emoji) ── */
function toolIcon(name = '') {
  const n = name.toLowerCase();
  if (/drum|tungku|kiln|karbonisasi|bakar|api|oven|pengering|furnace|muffle|reaktor/.test(n)) return 'local_fire_department';
  if (/press|cetak|pencetak|kempa/.test(n))                    return 'compress';
  if (/timbang|neraca|scale/.test(n))                          return 'scale';
  if (/termometer|suhu|thermocouple/.test(n))                  return 'thermostat';
  if (/blender|giling|grind|mill|penggiling|crusher|hancur/.test(n)) return 'settings';
  if (/saring|sieve|filter|ayak/.test(n))                      return 'filter_alt';
  if (/pipet|buret|erlenmeyer|labu|kimia/.test(n))             return 'science';
  if (/ph meter|conductivity|meter/.test(n))                   return 'speed';
  if (/gelas|beaker|tabung|wadah/.test(n))                     return 'water_drop';
  if (/spatula|pengaduk|stirrer/.test(n))                      return 'blender';
  if (/gergaji|potong|pisau/.test(n))                          return 'content_cut';
  if (/amplas|ukir/.test(n))                                   return 'brush';
  return 'build';
}

function materialIcon(name = '') {
  const n = name.toLowerCase();
  if (/air|cair|larutan/.test(n))     return 'water_drop';
  if (/perekat|resin|lem|lateks/.test(n)) return 'water_drop';
  if (/arang|karbon|batok|tempurung/.test(n)) return 'eco';
  return 'inventory_2';
}

/* ── Tools section: group items into Bahan / Alat / lainnya ── */
const toolItems = computed(() =>
  Array.isArray(props.section.type_data?.items) ? props.section.type_data.items : []
);
const materialItems = computed(() => toolItems.value.filter((item) => item.group === 'bahan'));
const equipmentItems = computed(() => toolItems.value.filter((item) => item.group === 'alat'));
const ungroupedItems = computed(() =>
  toolItems.value.filter((item) => item.group !== 'bahan' && item.group !== 'alat')
);
</script>

<template>

  <!-- ─────────────────────────────
       INFO (default)
  ───────────────────────────────── -->
  <div v-if="sectionType === 'info'">
    <RichTextPreview :content="section.body_content" />
  </div>

  <!-- ─────────────────────────────
       PROCEDURE — step cards
  ───────────────────────────────── -->
  <div v-else-if="sectionType === 'procedure'">

    <!-- Intro text (only shown alongside structured step cards; otherwise body_content renders once below) -->
    <div v-if="section.body_content && steps.length" class="mb-5">
      <RichTextPreview :content="section.body_content" />
    </div>

    <template v-if="steps.length">
      <!-- Progress bar -->
      <div class="mb-5 p-4 rounded-xl bg-surface-container-low border border-outline-variant/40">
        <div class="flex justify-between items-center mb-2 text-sm">
          <span class="font-semibold text-on-surface">
            {{ allDone ? '✓ Semua langkah selesai' : `${completedSteps} / ${totalSteps} langkah selesai` }}
          </span>
          <span class="font-bold text-primary">{{ progressPct }}%</span>
        </div>
        <div class="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="allDone ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-primary'"
            :style="{ width: progressPct + '%' }"
          />
        </div>
      </div>

      <!-- Step cards -->
      <div class="space-y-4">
        <div
          v-for="(step, idx) in steps"
          :key="idx"
          class="rounded-xl overflow-hidden border transition-all duration-300"
          :class="{
            'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20 opacity-80 hover:opacity-100': getStepState(idx) === 'completed',
            'border-primary bg-surface-container-lowest shadow-md shadow-primary/10':      getStepState(idx) === 'active',
            'border-outline-variant/40 bg-surface-container-lowest opacity-60 grayscale hover:grayscale-0 hover:opacity-100': getStepState(idx) === 'upcoming',
          }"
        >
          <!-- Step image (full width, at top) -->
          <div v-if="step.image_url" class="w-full h-40 relative overflow-hidden">
            <img
              :src="step.image_url"
              :alt="`Langkah ${idx + 1}`"
              class="absolute inset-0 w-full h-full object-cover transition-all duration-300"
              :class="getStepState(idx) === 'completed' ? 'grayscale sepia-[.15]' : ''"
              loading="lazy"
            />
            <div v-if="getStepState(idx) === 'completed'" class="absolute inset-0 bg-primary/10" />
          </div>

          <!-- Step content -->
          <div class="p-4 flex flex-col gap-3">
            <!-- Step label row -->
            <div class="flex items-center gap-2">
              <span
                class="text-xs font-bold uppercase tracking-wider"
                :class="{
                  'text-primary': getStepState(idx) === 'active',
                  'text-emerald-700 dark:text-emerald-400': getStepState(idx) === 'completed',
                  'text-on-surface-variant': getStepState(idx) === 'upcoming',
                }"
              >Langkah {{ idx + 1 }}</span>
              <!-- Active pulsing indicator -->
              <span v-if="getStepState(idx) === 'active'" class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary"></span>
              </span>
              <!-- Completed badge -->
              <span v-if="getStepState(idx) === 'completed'" class="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">Selesai</span>
              <!-- Upcoming badge -->
              <span v-if="getStepState(idx) === 'upcoming'" class="text-xs text-on-surface-variant">• Akan datang</span>
            </div>

            <!-- Step title & description -->
            <div>
              <p
                class="text-sm font-bold leading-snug mb-1"
                :class="{
                  'text-on-surface': getStepState(idx) !== 'completed',
                  'text-emerald-800 dark:text-emerald-300': getStepState(idx) === 'completed',
                }"
              >{{ step.action }}</p>
              <p v-if="step.note" class="text-xs text-on-surface-variant leading-relaxed">{{ step.note }}</p>
            </div>

            <!-- Tool chips -->
            <div v-if="step.tools && step.tools.length" class="flex flex-wrap items-center gap-1.5">
              <span class="text-xs font-semibold text-on-surface-variant">Alat:</span>
              <span
                v-for="(tool, ti) in step.tools" :key="ti"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/8 border border-secondary/15 text-secondary text-xs font-medium"
              >
                <span class="material-symbols-outlined" style="font-size:13px">{{ toolIcon(tool) }}</span>
                {{ tool }}
              </span>
            </div>

            <!-- Footer: duration + action button / upcoming notice -->
            <div
              class="flex items-center justify-between gap-3 pt-3 border-t"
              :class="getStepState(idx) === 'completed' ? 'border-emerald-200/60 dark:border-emerald-800/30' : 'border-outline-variant/30'"
            >
              <span v-if="step.parameter" class="flex items-center gap-1 text-xs text-on-surface-variant">
                <span class="material-symbols-outlined" style="font-size:13px">schedule</span>
                {{ step.parameter }}
              </span>
              <span v-else class="flex-1" />

              <!-- Action buttons -->
              <button
                v-if="getStepState(idx) === 'active'"
                type="button"
                class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
                @click="toggleStep(idx)"
              >
                <span class="material-symbols-outlined" style="font-size:14px;font-variation-settings:'FILL' 1">check_circle</span>
                Tandai Selesai
              </button>
              <button
                v-else-if="getStepState(idx) === 'completed'"
                type="button"
                class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg border-2 border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 text-xs font-semibold bg-transparent"
                @click="toggleStep(idx)"
              >
                <span class="material-symbols-outlined" style="font-size:14px;font-variation-settings:'FILL' 1">check_circle</span>
                Selesai
              </button>
              <span
                v-else
                class="inline-flex items-center gap-1 text-xs text-on-surface-variant"
              >
                <span class="material-symbols-outlined" style="font-size:13px">lock</span>
                Prasyarat: Selesaikan Langkah {{ idx }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="section.body_content">
      <RichTextPreview :content="section.body_content" />
    </div>
  </div>

  <!-- ─────────────────────────────
       TOOLS — Bahan & Alat, grouped grid cards
  ───────────────────────────────── -->
  <div v-else-if="sectionType === 'tools'">
    <div v-if="toolItems.length">
      <div v-if="section.body_content" class="mb-5">
        <RichTextPreview :content="section.body_content" />
      </div>

      <div v-if="materialItems.length" class="mb-5">
        <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-3">
          <span class="material-symbols-outlined" style="font-size:16px">eco</span>
          Bahan
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            v-for="(item, idx) in materialItems" :key="`bahan-${idx}`"
            class="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 hover:-translate-y-0.5 hover:shadow-sm transition-all"
          >
            <div class="w-10 h-10 flex items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
              <span class="material-symbols-outlined" style="font-size:20px">{{ materialIcon(item.name) }}</span>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-on-surface leading-snug">{{ item.name }}</p>
              <p v-if="item.quantity" class="text-xs font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">{{ item.quantity }} {{ item.unit }}</p>
              <p v-if="item.note" class="text-xs text-on-surface-variant mt-0.5 leading-snug">{{ item.note }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="equipmentItems.length">
        <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-secondary mb-3">
          <span class="material-symbols-outlined" style="font-size:16px">build</span>
          Alat
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            v-for="(item, idx) in equipmentItems" :key="`alat-${idx}`"
            class="flex items-start gap-3 p-3 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-secondary/30 hover:-translate-y-0.5 hover:shadow-sm transition-all"
          >
            <div class="w-10 h-10 flex items-center justify-center rounded-lg bg-secondary/10 text-secondary flex-shrink-0">
              <span class="material-symbols-outlined" style="font-size:20px">{{ toolIcon(item.name) }}</span>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-on-surface leading-snug">{{ item.name }}</p>
              <p v-if="item.spec" class="text-xs font-mono text-secondary mt-0.5">{{ item.spec }}</p>
              <p v-if="item.purpose" class="text-xs text-on-surface-variant mt-0.5 leading-snug">{{ item.purpose }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="ungroupedItems.length" class="grid grid-cols-2 sm:grid-cols-3 gap-3" :class="{ 'mt-5': materialItems.length || equipmentItems.length }">
        <div
          v-for="(item, idx) in ungroupedItems" :key="`item-${idx}`"
          class="flex items-start gap-3 p-3 rounded-xl bg-surface-container border border-outline-variant/30 hover:border-secondary/30 transition-colors"
        >
          <div class="w-10 h-10 flex items-center justify-center rounded-lg bg-secondary/10 text-secondary flex-shrink-0">
            <span class="material-symbols-outlined" style="font-size:20px">{{ toolIcon(item.name) }}</span>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-on-surface leading-snug">{{ item.name }}</p>
            <p v-if="item.spec" class="text-xs font-mono text-secondary mt-0.5">{{ item.spec }}</p>
            <p v-if="item.purpose" class="text-xs text-on-surface-variant mt-0.5 leading-snug">{{ item.purpose }}</p>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="section.body_content">
      <RichTextPreview :content="section.body_content" />
    </div>
  </div>

  <!-- ─────────────────────────────
       DATA TABLE
  ───────────────────────────────── -->
  <div v-else-if="sectionType === 'data_table'" class="overflow-x-auto">
    <table
      v-if="section.type_data?.headers && section.type_data?.rows"
      class="w-full border-collapse text-sm"
    >
      <thead>
        <tr>
          <th
            v-for="(h, i) in section.type_data.headers" :key="i"
            class="bg-surface-container text-on-surface font-bold text-xs uppercase tracking-wide px-4 py-2.5 text-left border border-outline-variant/40"
          >{{ h }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, ri) in section.type_data.rows" :key="ri"
          :class="ri % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low'"
        >
          <td
            v-for="(cell, ci) in row" :key="ci"
            class="px-4 py-2.5 border border-outline-variant/30 text-on-surface leading-relaxed"
          >{{ cell }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else-if="section.body_content">
      <RichTextPreview :content="section.body_content" />
    </div>
  </div>

  <!-- ─────────────────────────────
       WARNING
  ───────────────────────────────── -->
  <div
    v-else-if="sectionType === 'warning'"
    class="flex gap-3 p-4 rounded-xl border border-l-4"
    :class="[warningConfig.bg, warningConfig.border, warningConfig.accent]"
  >
    <span
      class="material-symbols-outlined flex-shrink-0 mt-0.5"
      :class="warningConfig.color"
      style="font-size:20px;font-variation-settings:'FILL' 1"
    >{{ warningConfig.icon }}</span>
    <div class="min-w-0">
      <div class="flex items-center gap-2 mb-1.5">
        <p class="text-xs font-bold uppercase tracking-wide" :class="warningConfig.color">
          {{ warningConfig.label }}
        </p>
        <p v-if="section.title" class="text-xs text-on-surface-variant italic">— {{ section.title }}</p>
      </div>
      <div :class="warningConfig.color">
        <RichTextPreview :content="section.body_content" />
      </div>
    </div>
  </div>

  <!-- ─────────────────────────────
       FORMULA (KaTeX)
  ───────────────────────────────── -->
  <div
    v-else-if="sectionType === 'formula'"
    class="rounded-xl bg-surface-container-low border border-outline-variant/40 p-5"
  >
    <div
      v-if="section.type_data?.latex"
      class="overflow-x-auto py-2 flex justify-center"
      v-html="renderLatex(section.type_data.latex, true)"
    />
    <div v-else-if="section.body_content">
      <RichTextPreview :content="section.body_content" />
    </div>
    <p v-if="section.type_data?.description" class="mt-3 text-xs text-on-surface-variant italic text-center">
      {{ section.type_data.description }}
    </p>
  </div>

  <!-- ─────────────────────────────
       TROUBLESHOOTING — accordion
  ───────────────────────────────── -->
  <div v-else-if="sectionType === 'troubleshooting'">
    <div v-if="section.body_content && Array.isArray(section.type_data?.pairs) && section.type_data.pairs.length" class="mb-4">
      <RichTextPreview :content="section.body_content" />
    </div>
    <div
      v-if="Array.isArray(section.type_data?.pairs) && section.type_data.pairs.length"
      class="space-y-2"
    >
      <details
        v-for="(pair, idx) in section.type_data.pairs" :key="idx"
        class="rounded-xl border border-outline-variant/40 bg-surface-container-lowest overflow-hidden group"
      >
        <summary class="flex items-center gap-3 px-4 py-3 cursor-pointer select-none list-none hover:bg-surface-container transition-colors">
          <span class="w-6 h-6 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold flex-shrink-0">?</span>
          <span class="flex-1 text-sm font-semibold text-on-surface">{{ pair.problem }}</span>
          <span class="material-symbols-outlined text-on-surface-variant transition-transform group-open:rotate-180" style="font-size:18px">expand_more</span>
        </summary>
        <div class="px-4 pb-4 pt-2 pl-[52px] border-t border-outline-variant/30 space-y-2">
          <p v-if="pair.cause" class="text-sm text-on-surface-variant leading-relaxed">
            <span class="font-semibold text-amber-700 dark:text-amber-300">Penyebab:</span> {{ pair.cause }}
          </p>
          <p class="text-sm text-on-surface-variant leading-relaxed">
            <span class="font-semibold text-emerald-700 dark:text-emerald-400">Solusi:</span> {{ pair.solution }}
          </p>
        </div>
      </details>
    </div>
    <div v-else-if="section.body_content && !section.type_data">
      <RichTextPreview :content="section.body_content" />
    </div>
  </div>

  <!-- Fallback -->
  <div v-else>
    <RichTextPreview :content="section.body_content" />
  </div>

</template>

<style scoped>
/* Material Symbols inside template */
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
details summary::-webkit-details-marker { display: none; }
</style>
