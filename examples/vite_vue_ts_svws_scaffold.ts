// Project: svws-import-spa
// =========================
// Setup:
// npm create vite@latest svws-import-spa -- --template vue-ts
// cd svws-import-spa
// npm install
// npm install pinia axios vue-router
// npm run dev

// =========================
// FILE: src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// =========================
// FILE: src/App.vue
<template>
  <router-view />
</template>

<script setup lang="ts"></script>

// =========================
// FILE: src/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'
import ImportView from '../views/ImportView.vue'

const routes = [
  { path: '/', component: ImportView }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})

// =========================
// FILE: src/views/ImportView.vue
<template>
  <div>
    <h1>SVWS Import Tool</h1>

    <input type="file" @change="onFileUpload" />

    <table v-if="students.length">
      <tr>
        <th>Name</th>
        <th>Email</th>
      </tr>
      <tr v-for="s in students" :key="s.id">
        <td>{{ s.name }}</td>
        <td>{{ s.email }}</td>
      </tr>
    </table>

    <button @click="upload">Upload to SVWS</button>
  </div>
</template>

<script setup lang="ts">
import { useStudentStore } from '../stores/studentStore'
import { parseCSV } from '../utils/csv'
import { svwsService } from '../services/svwsService'

const store = useStudentStore()
const students = store.students

function onFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const text = reader.result as string
    store.setStudents(parseCSV(text))
  }
  reader.readAsText(file)
}

async function upload() {
  await svwsService.uploadStudents(students.value)
}
</script>

// =========================
// FILE: src/stores/studentStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Student } from '../models/Student'

export const useStudentStore = defineStore('students', () => {
  const students = ref<Student[]>([])

  function setStudents(data: Student[]) {
    students.value = data
  }

  return { students, setStudents }
})

// =========================
// FILE: src/models/Student.ts
export interface Student {
  id: number
  name: string
  email: string
}

// =========================
// FILE: src/utils/csv.ts
import type { Student } from '../models/Student'

export function parseCSV(text: string): Student[] {
  const lines = text.split('\n').slice(1)

  return lines.map((line, index) => {
    const [name, email] = line.split(',')
    return {
      id: index,
      name: name?.trim(),
      email: email?.trim()
    }
  })
}

// =========================
// FILE: src/services/apiClient.ts
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '',
})

export function setAuth(username: string, password: string) {
  apiClient.defaults.headers.common['Authorization'] =
    'Basic ' + btoa(`${username}:${password}`)
}

// =========================
// FILE: src/services/svwsService.ts
import { apiClient } from './apiClient'
import type { Student } from '../models/Student'

export const svwsService = {
  async uploadStudents(students: Student[]) {
    return apiClient.post('/students', students)
  }
}

// =========================
// FILE: vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})

// =========================
// RESULT STRUCTURE AFTER BUILD
// dist/
//   index.html
//   assets/
//     main.js
//     style.css
