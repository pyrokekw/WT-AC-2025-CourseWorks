<script setup lang="ts">
import ContactComponent from '@/shared/components/ContactComponent.vue'
</script>

<template>
    <div class="app-wrapper">
        <section class="contacts-section">
            <div class="contacts-section-head">
                <h3 class="contacts-section-title">Hire Me</h3>
            </div>
            <div class="contacts-section-content">
                <ContactComponent restrict-resize />

                <div class="contacts-section-photo">
                    <img src="/images/contacts-section-photo.jpg" alt="" />
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.contacts-section {
    margin-top: 60px;
}

.contacts-section-title {
    font-size: 32px;
    font-weight: 700;
    text-transform: uppercase;
}

.contacts-section-content {
    display: grid;
    grid-template-columns: 720px 300px;
    justify-content: space-between;
    gap: 20px;
    margin-top: 30px;
}

.contacts-section-photo {
    position: relative;
    overflow: hidden;
    min-height: 0;
    border-radius: 12px;
}

.contacts-section-photo img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

@media (max-width: 1070px) {
    .contacts-section-head {
        max-width: 720px;
        margin: 0 auto;
    }

    .contacts-section-content {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .contacts-section-photo {
        display: none;
    }
}
</style>
