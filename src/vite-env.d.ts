/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SVWS_URL: string
  readonly VITE_SVWS_SCHEMA: string
  readonly VITE_SVWS_USERNAME: string
  readonly VITE_SVWS_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
