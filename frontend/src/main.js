import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import './assets/main.css';
import 'katex/dist/katex.min.css';

const app = createApp(App);
const pinia = createPinia();

const authStore = useAuthStore(pinia);
authStore.hydrate();

app.use(pinia);
app.use(router);
app.mount('#app');
