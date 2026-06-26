<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  Chart,
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';

// Registrasi modul Chart.js
Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  Title,
  Tooltip
);

function getCssVar(name, alpha) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const [r, g, b] = raw.split(/\s+/).map(Number);
  return alpha != null ? `rgba(${r},${g},${b},${alpha})` : `rgb(${r},${g},${b})`;
}

const props = defineProps({
  type: { type: String, default: 'bar' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  chartData: {
    type: Object,
    default: () => ({ labels: [], datasets: [] }),
  },
  heightClass: { type: String, default: 'h-80' },
});

const canvasRef = ref(null);
let chartInstance = null;

// Validasi apakah dataset benar-benar memiliki isi
const hasData = computed(() => {
  const datasets = props.chartData?.datasets;
  if (!Array.isArray(datasets) || datasets.length === 0) return false;
  
  return datasets.some(
    (dataset) => Array.isArray(dataset?.data) && dataset.data.some((value) => Number(value) > 0)
  );
});

// Konfigurasi palet warna berdasarkan tipe chart
const getPaletteConfig = (type) => {
  if (type === 'doughnut') {
    return {
      backgroundColor: [
        getCssVar('--color-secondary'),
        getCssVar('--color-primary'),
        getCssVar('--color-secondary-container'),
        getCssVar('--color-primary-container'),
        getCssVar('--color-on-primary-container'),
        getCssVar('--color-on-secondary-container'),
      ],
      borderColor: getCssVar('--color-surface-container-low'),
      borderWidth: 2,
      hoverOffset: 8,
    };
  }
  return {
    backgroundColor: getCssVar('--color-secondary', 0.75),
    borderColor: getCssVar('--color-secondary'),
    borderWidth: 1.5,
    borderRadius: 10,
    maxBarThickness: 44,
  };
};

function renderChart() {
  if (!canvasRef.value || !hasData.value) return;

  // Hancurkan instance lama sebelum membuat yang baru
  if (chartInstance) chartInstance.destroy();

  const palette = getPaletteConfig(props.type);
  const datasets = props.chartData.datasets.map((dataset) => ({
    ...palette,
    ...dataset,
  }));

  chartInstance = new Chart(canvasRef.value, {
    type: props.type,
    data: {
      labels: props.chartData.labels || [],
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: props.type === 'doughnut',
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 10,
            padding: 18,
            color: getCssVar('--color-on-surface-variant'),
            font: { size: 12, weight: '600' },
          },
        },
        tooltip: {
          backgroundColor: getCssVar('--color-surface-container-highest'),
          titleColor: getCssVar('--color-on-surface'),
          bodyColor: getCssVar('--color-on-surface-variant'),
          padding: 12,
          cornerRadius: 12,
          displayColors: props.type === 'doughnut',
        },
      },
      scales: props.type === 'bar' ? {
        x: {
          grid: { display: false },
          ticks: { color: getCssVar('--color-on-surface-variant'), font: { size: 11, weight: '600' } },
        },
        y: {
          beginAtZero: true,
          border: { dash: [4, 4] },
          ticks: { precision: 0, stepSize: 1, color: getCssVar('--color-outline'), font: { size: 11 } },
          grid: { color: getCssVar('--color-outline-variant') + '40' },
        },
      } : undefined,
    },
  });
}

onMounted(() => renderChart());

watch(
  () => props.chartData,
  async () => {
    await nextTick();
    renderChart();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (chartInstance) chartInstance.destroy();
});
</script>

<template>
  <article class="premium-panel flex flex-col rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6">
    <header class="mb-6 flex flex-col gap-2">
      <p class="text-xs font-bold uppercase tracking-widest text-secondary">Visual Analytics</p>
      <h3 class="text-xl font-bold text-on-surface">{{ title }}</h3>
      <p class="text-sm leading-relaxed text-on-surface-variant max-w-2xl">{{ description }}</p>
    </header>

    <div class="relative w-full flex-1" :class="heightClass">
      <canvas v-if="hasData" ref="canvasRef" />

      <div
        v-else
        class="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-outline-variant/40 bg-surface-container px-6 text-center text-sm text-outline"
      >
        Data grafik belum tersedia. Aktivitas akan muncul setelah data masuk.
      </div>
    </div>
  </article>
</template>