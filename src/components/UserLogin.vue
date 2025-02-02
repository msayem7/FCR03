<template>
  <div class="container mt-5">
    <h2>Login</h2>
    <form @submit.prevent="login">
      <div class="mb-3">
        <label for="username" class="form-label">Username</label>
        <input type="text" class="form-control" v-model="credentials.username" required>
      </div>
      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input type="password" class="form-control" v-model="credentials.password" required>
      </div>
      <button type="submit" class="btn btn-primary">Login</button>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const credentials = ref({ username: '', password: '' });
    const authStore = useAuthStore();
    const router = useRouter();

    const login = async () => {
      await authStore.login(credentials.value);
      router.push('/credit-sales');
    };

    return { credentials, login };
  },
};
</script>