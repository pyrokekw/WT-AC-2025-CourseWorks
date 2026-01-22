<template>
    <div>
        Loading<span class="dot dot1">.</span><span class="dot dot2">.</span
        ><span class="dot dot3">.</span>
    </div>
</template>

<style scoped>
.dot {
    opacity: 0.2;
    animation: dotPulse 1s infinite;
}

.dot1 {
    animation-delay: 0s;
}
.dot2 {
    animation-delay: 0.2s;
}
.dot3 {
    animation-delay: 0.4s;
}

@keyframes dotPulse {
    0%,
    80%,
    100% {
        opacity: 0.2;
    }
    40% {
        opacity: 1;
    }
}
</style>
