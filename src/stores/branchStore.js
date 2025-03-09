
import { defineStore } from 'pinia';
import axios from '../plugins/axios';
import { useAuthStore } from './authStore';

export const useBranchStore = defineStore('credit', {   
    state: () => ({
        selectedBranch: localStorage.getItem('workingBranch') || null,        
        branches: [],        
        refreshTrigger: 0,
    }), 
    getters: {
        isBranchSelected: (state) => state.selectedBranch !== null,
    },
    actions: {
        async loadBranches() {
            const authStore = useAuthStore();
            if (!authStore.user) return;
            const { data } = await axios.get('v1/chq/branches/');
            this.branches = data;
            if (this.selectedBranch && !this.branches.some(b => b.alias_id === this.selectedBranch)) {
                this.selectedBranch = null;
                localStorage.removeItem('workingBranch');
            }
        },
        setWorkingBranch(branch) {
            this.selectedBranch = branch;
            localStorage.setItem('workingBranch', branch);
            this.refreshTrigger++; // Increment the refresh trigger
        },
    },
});
