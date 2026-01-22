<template>
    <p class="app-error">
        <slot />
    </p>
</template>

<style scoped>
.app-error {
    margin: 0;
    font-size: 14px;
    color: var(--error-color);
}
</style>
