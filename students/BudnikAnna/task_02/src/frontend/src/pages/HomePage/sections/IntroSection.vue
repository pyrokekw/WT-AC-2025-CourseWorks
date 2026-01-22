<script setup>
import { profile } from '@/shared/config/profile'
import { socials } from '@/shared/config/social'

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
        <section class="app-intro">
            <div class="app-intro-left">
                <h3 class="app-intro-greetings">
                    Hello, I&rsquo;m
                    <span class="app-intro-greetings-name">
                        {{ profile.firstName }} {{ profile.lastName }}
                    </span>
                </h3>
                <h4 class="app-intro-profession">
                    {{ profile.profession }}
                </h4>
                <div class="app-intro-social">
                    <a
                        v-for="(item, index) in socials"
                        :key="`app-intro-social-${index}`"
                        :href="item.href"
                        :title="item.title"
                        class="app-intro-social-item"
                        target="_blank"
                    >
                        <div
                            class="app-intro-social-item-content"
                            :style="`background-color: ${item.color}`"
                        >
                            <component :is="item.icon" class="app-intro-social-icon" />
                        </div>
                    </a>
                </div>
                <div class="app-intro-buttons">
                    <AppButton @click="handleOpenContactModal">HIRE ME</AppButton>
                    <AppButton @click="handleOpenResumeModal">SEE MY RESUME</AppButton>
                </div>
            </div>

            <div class="app-intro-right">
                <div class="app-intro-photo">
                    <div class="app-intro-photo-background">
                        <img src="/images/hero-objects.png" alt="" />
                    </div>
                    <div class="app-intro-photo-foreground">
                        <img src="/images/hero-person.png" alt="" />
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.app-intro {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--intro-border-bottom-color);
}

.app-intro-greetings {
    font-size: 32px;
}

.app-intro-greetings-name {
    display: block;
    font-size: 45px;
    line-height: 1;
    font-weight: 700;
    margin-top: 8px;
}

.app-intro-profession {
    font-size: 18px;
    font-weight: 600;
    color: var(--secondary-color);
    margin-top: 12px;
}

.app-intro-social {
    display: flex;
    column-gap: 6px;
    margin-top: 30px;
}

.app-intro-social-item {
    width: 40px;
    height: 40px;
}

.app-intro-social-item:hover .app-intro-social-item-content {
    transform: translateY(-4px);
}

.app-intro-social-item-content {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: #000;
    transition: transform 0.2s ease;
}

.app-intro-social-icon {
    width: 24px;
    height: 24px;
    fill: #fff;
}

.app-intro-buttons {
    display: flex;
    flex-wrap: wrap;
    column-gap: 16px;
    row-gap: 8px;
    margin-top: 42px;
}

.app-intro-right {
    max-width: 500px;
    width: 100%;
}

.app-intro-photo {
    max-width: 500px;
    width: 100%;
    height: 470px;
    position: relative;
}

.app-intro-photo-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.app-intro-photo-background img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.app-intro-photo-foreground {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.app-intro-photo-foreground img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

@media (max-width: 1024px) {
    .app-intro {
        position: relative;
    }

    .app-intro-left {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 2;
    }

    .app-intro-greetings,
    .app-intro-profession,
    .app-intro-social {
        max-width: 384px;
        width: 100%;
    }

    .app-intro-right {
        max-width: 100%;
        width: 100%;
        z-index: 1;
    }

    .app-intro-photo {
        margin: 0 auto;
    }

    .app-intro-photo-foreground {
        display: none;
    }
}

@media (max-width: 480px) {
    .app-intro-photo-background img {
        object-fit: contain;
        object-position: center bottom;
    }
}
</style>
