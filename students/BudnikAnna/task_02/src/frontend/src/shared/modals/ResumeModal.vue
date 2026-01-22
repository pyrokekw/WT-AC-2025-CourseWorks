<script setup lang="ts">
import { useModalStore } from '@/stores/modal'
import AppButton from '../ui/AppButton.vue'

const modal = useModalStore()

function handleOpenContactModal() {
    modal.open('contact')
}
</script>

<template>
    <div class="resume-modal-content">
        <h3 class="resume-modal-title text-center">RESUME</h3>

        <div class="timeline">
            <div class="timeline-col timeline-col-left">
                <h4 class="timeline-title">EXPERIENCE</h4>

                <div class="timeline-item">
                    <time class="timeline-date" datetime="11-21-2019">2017 - <b>Present</b></time>
                    <h5 class="timeline-subtitle">Freelancer</h5>
                    <div class="timeline-position">Art Director</div>
                    <div class="timeline-text">
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Omnis debitis
                            autem aspernatur sed iusto maiores nihil magni provident dolore, animi
                            nemo est corporis in facilis eum quae sint aliquam, ipsam?
                        </p>
                    </div>
                </div>

                <div class="timeline-item">
                    <time class="timeline-date" datetime="11-21-2019">2017 - <b>Present</b></time>
                    <h5 class="timeline-subtitle">Freelancer</h5>
                    <div class="timeline-position">Art Director</div>
                    <div class="timeline-text">
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Omnis debitis
                            autem aspernatur sed iusto maiores nihil magni provident dolore, animi
                            nemo est corporis in facilis eum quae sint aliquam, ipsam?
                        </p>
                    </div>
                </div>

                <div class="timeline-item">
                    <time class="timeline-date" datetime="11-21-2019">2017 - <b>Present</b></time>
                    <h5 class="timeline-subtitle">Freelancer</h5>
                    <div class="timeline-position">Art Director</div>
                    <div class="timeline-text">
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Omnis debitis
                            autem aspernatur sed iusto maiores nihil magni provident dolore, animi
                            nemo est corporis in facilis eum quae sint aliquam, ipsam?
                        </p>
                    </div>
                </div>
            </div>

            <div class="timeline-col timeline-col-right">
                <h4 class="timeline-title">EDUCATION</h4>

                <div class="timeline-item">
                    <time class="timeline-date" datetime="11-21-2019">2005 - 2010</time>
                    <h5 class="timeline-subtitle">UI/UX Design</h5>
                    <div class="timeline-position">LA University, USA</div>
                </div>

                <div class="timeline-item">
                    <time class="timeline-date" datetime="11-21-2019">2005 - 2010</time>
                    <h5 class="timeline-subtitle">UI/UX Design</h5>
                    <div class="timeline-position">LA University, USA</div>
                </div>

                <h4 class="timeline-title">Skills</h4>
                <div class="progress-bar">
                    <div class="progress-bar-item">
                        <div class="progress-bar-left">
                            <div class="progress-bar-title">UI/UX Design</div>
                        </div>
                        <div class="progress-bar-right">
                            <div class="progress-bar-bar">
                                <div class="progress-bar-progress" style="width: 50%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="progress-bar-item">
                        <div class="progress-bar-left">
                            <div class="progress-bar-title">UI/UX Design</div>
                        </div>
                        <div class="progress-bar-right">
                            <div class="progress-bar-bar">
                                <div class="progress-bar-progress" style="width: 90%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="progress-bar-item">
                        <div class="progress-bar-left">
                            <div class="progress-bar-title">UI/UX Design</div>
                        </div>
                        <div class="progress-bar-right">
                            <div class="progress-bar-bar">
                                <div class="progress-bar-progress" style="width: 80%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <h4 class="timeline-title">Awards</h4>

                <div class="timeline-item">
                    <time class="timeline-date" datetime="11-21-2019">2010</time>
                    <h5 class="timeline-subtitle">UI/UX Design</h5>
                    <div class="timeline-position">LA University, USA</div>
                    <div class="timeline-text">
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Omnis debitis
                            autem aspernatur sed iusto maiores nihil magni provident dolore, animi
                            nemo est corporis in facilis eum quae sint aliquam, ipsam?
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div class="hire-btn-wrapper">
            <AppButton class="hire-btn" @click="handleOpenContactModal"> Hire me </AppButton>
        </div>
    </div>
</template>

<style scoped>
.resume-modal-content {
    padding: 32px 16px;
}

.resume-modal-title {
    margin-bottom: 48px;
    font-size: 32px;
    text-transform: uppercase;
    color: var(--primary-color);
    font-weight: 700;
    text-align: center;
}

.resume-modal-subtitle {
    text-transform: uppercase;
    font-size: 14px;
    color: var(--primary-color);
    font-weight: 400;
}

.timeline {
    display: flex;
    margin: 24px auto;
    margin-bottom: 48px;
    width: 100%;
    max-width: 768px;
    position: relative;
}

.timeline::before {
    content: '';
    display: block;
    width: 1px;
    height: 100%;

    background-color: var(--primary-color);

    position: absolute;
    top: 0;
    left: 50%;
    z-index: 1;
}

.timeline-col {
    width: 50%;
}

.timeline-col-left {
    text-align: right;
    padding-right: 24px;
}

.timeline-col-right {
    text-align: left;
    padding-left: 24px;
}

.timeline-title {
    margin-bottom: 12px;
    font-size: 12px;
    color: var(--primary-color);
    text-transform: uppercase;
    font-weight: 700;
}

.timeline-item {
    margin-bottom: 32px;
}

.timeline-item:last-child {
    margin-bottom: 0;
}

.timeline-date {
    display: block;
    margin-bottom: 8px;

    text-decoration: underline;
    font-size: 12px;
    color: var(--primary-color);
}

.timeline-subtitle {
    margin-bottom: 8px;

    font-size: 12px;
    color: var(--primary-color);
    font-weight: 700;
}

.timeline-position {
    font-size: 12px;
    color: var(--primary-color);
    font-style: italic;
}

.timeline-text {
    margin-top: 8px;

    font-size: 8px;
    line-height: 1.5;
    color: var(--secondary-color);
    font-weight: 300;
}

.progress-bar {
    margin-bottom: 32px;
}

.progress-bar-item {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}

.progress-bar-title {
    font-size: 8px;
    font-weight: 300;
}

.progress-bar-right {
    padding-left: 12px;
}

.progress-bar-bar {
    width: 139px;
    height: 6px;

    background-color: #efefef;
}

.progress-bar-progress {
    height: 100%;

    background-color: var(--secondary-color);

    transition: width 0.2s linear;
}

.hire-btn-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
}

.hire-btn {
    margin: 0 auto;
}

@media (max-width: 547px) {
    .resume-modal-content {
        padding: 32px 0;
    }

    .progress-bar-item {
        flex-direction: column;
        align-items: flex-start;
        row-gap: 4px;
    }

    .progress-bar-right {
        padding-left: 0;
    }
}
</style>
