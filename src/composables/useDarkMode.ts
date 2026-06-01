import { ref, watchEffect } from 'vue'

const storedValue = localStorage.getItem('dark-mode')
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
const isDark = ref(storedValue !== null ? storedValue === 'true' : systemPrefersDark)

watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('dark-mode', String(isDark.value))
})

export function useDarkMode() {
  function toggle() {
    isDark.value = !isDark.value
  }
  return { isDark, toggle }
}
