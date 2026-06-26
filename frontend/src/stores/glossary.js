import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/lib/api';

export const useGlossaryStore = defineStore('glossary', () => {
  const terms = ref([]);
  const meta = ref({ page: 1, limit: 20, total_items: 0, total_pages: 1 });
  const isLoading = ref(false);
  const error = ref('');

  async function fetchTerms(params = {}) {
    isLoading.value = true;
    error.value = '';
    try {
      const res = await api.get('/glossary', { params });
      terms.value = res.data.data.terms;
      meta.value = res.data.data.meta;
    } catch (err) {
      error.value = err.response?.data?.message || 'Gagal memuat glosarium.';
    } finally {
      isLoading.value = false;
    }
  }

  async function createTerm(payload) {
    const res = await api.post('/glossary', payload);
    return res.data.data.term;
  }

  async function updateTerm(id, payload) {
    const res = await api.put(`/glossary/${id}`, payload);
    return res.data.data.term;
  }

  async function deleteTerm(id) {
    await api.delete(`/glossary/${id}`);
    terms.value = terms.value.filter((t) => t.id !== id);
  }

  return { terms, meta, isLoading, error, fetchTerms, createTerm, updateTerm, deleteTerm };
});
