<script setup>
import ChatWidget from '@/components/chat/ChatWidget.vue';
</script>

<template>
  <div class="min-h-screen bg-background dark:bg-[#090f1c] text-on-background dark:text-[#eaf1ff]">
    <router-view />
    <ChatWidget />
  </div>
</template>
