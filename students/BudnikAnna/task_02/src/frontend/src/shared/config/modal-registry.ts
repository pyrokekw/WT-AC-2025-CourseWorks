import type { Component } from 'vue'

import LoginModal from '@/shared/modals/LoginModal.vue'
import RegisterModal from '@/shared/modals/RegisterModal.vue'
import LogoutModal from '@/shared/modals/LogoutModal.vue'
import EditUserModal from '@/shared/modals/EditUserModal.vue'
import EditTagModal from '@/shared/modals/EditTagModal.vue'
import EditProjectModal from '@/shared/modals/EditProjectModal.vue'
import EditCollectionModal from '@/shared/modals/EditCollectionModal.vue'
import ProjectModal from '@/shared/modals/ProjectModal.vue'
import ContactModal from '@/shared/modals/ContactModal.vue'
import ResumeModal from '@/shared/modals/ResumeModal.vue'

export const modalRegistry = {
    login: LoginModal,
    register: RegisterModal,
    logout: LogoutModal,
    editUser: EditUserModal,
    editTag: EditTagModal,
    editProject: EditProjectModal,
    editCollection: EditCollectionModal,
    project: ProjectModal,
    contact: ContactModal,
    resume: ResumeModal,
} as const satisfies Record<string, Component>

export type ModalName = keyof typeof modalRegistry
