import { ref, computed, watchEffect } from 'vue'

type ThemeMode = 'light' | 'dark' | 'system'

const storedValue = localStorage.getItem('theme-mode') as ThemeMode | null
const mode = ref<ThemeMode>(storedValue ?? 'system')

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
const systemIsDark = ref(mediaQuery.matches)
mediaQuery.addEventListener('change', (e) => { systemIsDark.value = e.matches })

const isDark = computed(() => {
  if (mode.value === 'dark') return true
  if (mode.value === 'light') return false
  return systemIsDark.value
})

watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme-mode', mode.value)
})

export function useDarkMode() {
  function toggle() {
    const order: ThemeMode[] = ['light', 'dark', 'system']
    mode.value = order[(order.indexOf(mode.value) + 1) % order.length]
  }
  return { isDark, mode, toggle }
}
