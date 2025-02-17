
import { defineStore } from 'pinia';
import axios from '../plugins/axios';
import { useAuthStore } from './authStore';

export const useBranchStore = defineStore('credit', {   
    state: () => ({
        selectedBranch: localStorage.getItem('workingBranch') || null,        
        branches: [],
    }),
    getters: {
        isBranchSelected: (state) => state.selectedBranch !== null,
    },
    actions: {
        async loadBranches() {
            const authStore = useAuthStore();
            if (!authStore.user) return;
            const { data } = await axios.get('/branches/');
            this.branches = data;
        },
        setWorkingBranch(branch) {
            this.selectedBranch = branch;
            localStorage.setItem('workingBranch', branch);
        },
    },
});
