// vite.config.mts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig(async ({ command }) => {
  const plugins = [react()]

  // 개발 서버에서만 로드 (배포/빌드 단계에서는 제외)
  if (command === "serve") {
    const mod = await import("@replit/vite-plugin-runtime-error-modal")
    const replitPlugin = (mod.default ?? mod)()
    plugins.push(replitPlugin)
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": resolve(__dirname, "client", "src"),
        "@shared": resolve(__dirname, "shared"),
        "@assets": resolve(__dirname, "attached_assets"),
      },
    },
    root: resolve(__dirname, "client"),
    build: {
      outDir: resolve(__dirname, "dist/public"),
      emptyOutDir: true,
      target: "esnext",
    },
    server: {
      fs: { strict: true, deny: ["**/.*"] },
    },
  }
})
