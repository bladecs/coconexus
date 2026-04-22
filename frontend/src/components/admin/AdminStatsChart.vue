<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';

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

const props = defineProps({
  type: {
    type: String,
    default: 'bar',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  chartData: {
    type: Object,
    default: () => ({
      labels: [],
      datasets: [],
    }),
  },
  heightClass: {
    type: String,
    default: 'h-80',
  },
});

const canvasRef = ref(null);
let chartInstance = null;

const hasData = computed(() =>
  Array.isArray(props.chartData?.datasets) &&
  props.chartData.datasets.some(
    (dataset) => Array.isArray(dataset?.data) && dataset.data.some((value) => Number(value) > 0)
  )
);

function buildPalette(type) {
  if (type === 'doughnut') {
    return {
      backgroundColor: ['#ff7c35', '#c26939', '#ffa56f', '#6a4a3a', '#ffcfb2', '#8f5b41'],
      borderColor: '#303030',
      borderWidth: 2,
      hoverOffset: 10,
    };
  }

  return {
    backgroundColor: 'rgba(255, 124, 53, 0.82)',
    borderColor: '#c26939',
    borderWidth: 1.5,
    borderRadius: 14,
    maxBarThickness: 44,
  };
}

function renderChart() {
  if (!canvasRef.value) {
    return;
  }

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  if (!hasData.value) {
    return;
  }

  const palette = buildPalette(props.type);
  const datasets = (props.chartData.datasets || []).map((dataset) => ({
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
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: props.type === 'doughnut',
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 10,
            padding: 18,
            color: '#e7ddd6',
            font: {
              size: 12,
              weight: '600',
            },
          },
        },
        tooltip: {
          backgroundColor: '#1f1f1f',
          titleColor: '#fff7f0',
          bodyColor: '#fff7f0',
          padding: 12,
          cornerRadius: 12,
          displayColors: props.type === 'doughnut',
        },
      },
      scales:
        props.type === 'bar'
          ? {
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  color: '#e7ddd6',
                  font: {
                    size: 11,
                    weight: '600',
                  },
                },
              },
              y: {
                beginAtZero: true,
                border: {
                  dash: [4, 4],
                },
                ticks: {
                  precision: 0,
                  stepSize: 1,
                  color: '#cbbeb5',
                  font: {
                    size: 11,
                  },
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.08)',
                },
              },
            }
          : undefined,
    },
  });
}

onMounted(() => {
  renderChart();
});

watch(
  () => [props.type, props.chartData],
  () => {
    renderChart();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>

<template>
  <article class="rounded-[2rem] border border-white/10 bg-[#303030] p-6 shadow-soft">
    <div class="flex flex-col gap-2">
      <p class="text-sm font-semibold uppercase tracking-[0.22em] text-[#ffb084]">
        Visual Analytics
      </p>
      <h3 class="text-2xl font-bold text-stone-50">{{ title }}</h3>
      <p class="max-w-2xl text-sm leading-7 text-stone-300">
        {{ description }}
      </p>
    </div>

    <div class="mt-6" :class="heightClass">
      <canvas v-if="hasData" ref="canvasRef" />

      <div
        v-else
        class="flex h-full items-center justify-center rounded-3xl border border-dashed border-white/12 bg-[#383838] px-6 text-center text-sm leading-7 text-stone-400"
      >
        Data grafik belum tersedia. Aktivitas artikel dan komentar akan muncul di sini setelah data masuk.
      </div>
    </div>
  </article>
</template>
