/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_URL?: string
  readonly VITE_WS_URL?: string
  readonly VITE_WS_HOST?: string
  readonly VITE_WS_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
