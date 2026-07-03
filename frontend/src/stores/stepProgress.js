import { ref } from 'vue';
import { defineStore } from 'pinia';
import api from '@/lib/api';

export const useStepProgressStore = defineStore('stepProgress', () => {
  // Map: articleId → Set of completed step indices
  const progressMap = ref({});
  const isLoading = ref(false);

  async function fetchProgress(articleId) {
    isLoading.value = true;
    try {
      const { data } = await api.get(`/step-progress/${articleId}`);
      progressMap.value[articleId] = new Set(data.data.completed_steps || []);
      return [...progressMap.value[articleId]];
    } catch {
      progressMap.value[articleId] = new Set();
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  async function toggleStep(articleId, stepIndex) {
    try {
      const { data } = await api.post(`/step-progress/${articleId}/${stepIndex}`);
      const set = progressMap.value[articleId] || new Set();
      if (data.data.completed) {
        set.add(stepIndex);
      } else {
        set.delete(stepIndex);
      }
      progressMap.value[articleId] = new Set(set);
      return data.data.completed;
    } catch {
      return null;
    }
  }

  async function resetProgress(articleId) {
    try {
      await api.delete(`/step-progress/${articleId}`);
      progressMap.value[articleId] = new Set();
    } catch {
      // silent
    }
  }

  function getCompletedSteps(articleId) {
    return [...(progressMap.value[articleId] || new Set())];
  }

  function isStepCompleted(articleId, stepIndex) {
    return (progressMap.value[articleId] || new Set()).has(stepIndex);
  }

  return { progressMap, isLoading, fetchProgress, toggleStep, resetProgress, getCompletedSteps, isStepCompleted };
});
