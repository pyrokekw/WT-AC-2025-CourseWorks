<script setup lang="ts">
import AppButton from '@/shared/ui/AppButton.vue'
import { useModalStore } from '@/stores/modal'

const modal = useModalStore()

function handleOpenContactModal() {
    modal.open('contact')
}

function handleOpenResumeModal() {
    modal.open('resume')
}
</script>

<template>
    <div class="app-wrapper">
        <div class="app-about">
            <div class="app-about-photo">
                <img src="/images/designer_photo.png" alt="" />
            </div>
            <div class="app-about-text">
                <h3 class="app-about-text-title">ABOUT ME</h3>
                <h4 class="app-about-text-subtitle">WHO AM I</h4>
                <p class="app-about-text-description text-description">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas pellentesque
                    eu enim eget luctus. Sed augue felis, facilisis et elementum vitae, aliquam sit
                    amet ante. Sed iaculis eros sem, elementum consequat est consequat eu. Quisque
                    aliquet a ipsum nec tincidunt. Nulla vitae rhoncus leo. Praesent dui sapien,
                    bibendum quis tempus dictum, auctor ac dui. Vestibulum ante ipsum primis in
                    faucibus orci luctus et ultrices posuere cubilia Curae; Donec at mauris porta,
                    ullamcorper sem quis, lobortis sem. Donec sit amet aliquet dui, at varius est.
                    Phasellus porttitor finibus neque vel vehicula. Duis in nulla egestas, dignissim
                    elit at, imperdiet eros. Integer tristique posuere purus. Suspendisse placerat,
                    quam vitae ullamcorper sollicitudin, dui ligula molestie massa, sit amet laoreet
                    nibh ex vitae dui. Aenean laoreet pellentesque lacus, eget varius massa mattis
                    quis. Nunc ultrices urna eu nunc lobortis pulvinar. Duis viverra, quam non
                    imperdiet scelerisque, urna nunc consequat velit, in mollis erat nibh in libero.
                </p>

                <div class="app-about-text-buttons">
                    <AppButton @click="handleOpenContactModal">HIRE ME</AppButton>
                    <AppButton @click="handleOpenResumeModal">SEE MY RESUME</AppButton>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.app-about {
    display: grid;
    grid-template-columns: 1fr 490px;
    align-items: center;
    column-gap: 60px;
    margin-top: 120px;
}

.app-about-photo {
    max-width: 540px;
    width: 100%;
    position: relative;
}

.app-about-photo::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20px;
    width: 77%;
    height: 68.8%;
    background-color: #efefef;
    z-index: -1;
}

.app-about-photo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.app-about-text-title {
    font-size: 45px;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 10px;
}

.app-about-text-subtitle {
    font-size: 82px;
    color: #dedede;
    line-height: 1;
    font-weight: 700;
    margin-bottom: 50px;
}

.app-about-text-description {
    margin-bottom: 60px;
    font-size: 12px;
    color: var(--gray-color);
}

.app-about-text-buttons {
    display: flex;
    flex-wrap: wrap;
    column-gap: 16px;
    row-gap: 8px;
}

@media (max-width: 985px) {
    .app-about {
        grid-template-columns: 1fr;
    }

    .app-about-photo {
        display: none;
    }
}

@media (max-width: 487px) {
    .app-about-text-title {
        font-size: 32px;
    }

    .app-about-text-subtitle {
        font-size: 58px;
        margin-bottom: 32px;
    }

    .app-about-text-description {
        margin-bottom: 32px;
    }
}
</style>
