<script setup lang="ts">
import ContactComponent from '../components/ContactComponent.vue'
</script>

<template>
    <div class="contact-modal-head">
        <h3 class="contact-modal-title">Hire Me</h3>
    </div>
    <ContactComponent restrict-resize />
</template>

<style scoped>
.contact-modal-head {
    text-align: center;
    padding-top: 24px;
    margin-bottom: 12px;
}

.contact-modal-title {
    font-size: 24px;
    font-weight: 700;
    text-transform: uppercase;
}
</style>
