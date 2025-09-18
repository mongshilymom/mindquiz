/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_GA4_ID?: string
    readonly VITE_KAKAO_JS_KEY?: string
    readonly VITE_SITE_URL?: string
    readonly MODE: string
    readonly PROD: boolean
    readonly DEV: boolean
    readonly SSR: boolean
    readonly BASE_URL: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
    readonly url: string
    readonly hot?: {
      readonly data: any
      accept(): void
      accept(cb: (mod: any) => void): void
      accept(dep: string, cb: (mod: any) => void): void
      accept(deps: readonly string[], cb: (mods: any[]) => void): void
      dispose(cb: (data: any) => void): void
      decline(): void
      invalidate(): void
      on<T extends string>(event: T, cb: (data: any) => void): void
    }
  }
}