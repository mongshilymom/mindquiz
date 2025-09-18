// vite.config.mts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig(async ({ command }) => {
  const plugins = [react()]

  // 개발 서버에서만 Replit 플러그인 로드 (빌드/배포 제외)
  if (command === "serve") {
    const [{ default: runtimeErrorOverlay }, cartoMod] = await Promise.all([
      import("@replit/vite-plugin-runtime-error-modal"),
      process.env.REPL_ID ? import("@replit/vite-plugin-cartographer") : Promise.resolve(null)
    ])
    plugins.push(runtimeErrorOverlay())
    if (cartoMod) {
      const cartographer = (cartoMod.cartographer ?? cartoMod.default ?? cartoMod)()
      plugins.push(cartographer)
    }
  }

  return {
    plugins,
    base: "/",
    resolve: {
      alias: {
        "@": resolve(__dirname, "client", "src"),
        "@shared": resolve(__dirname, "shared"),
        "@assets": resolve(__dirname, "attached_assets")
      }
    },
    root: resolve(__dirname, "client"),
    build: {
      outDir: resolve(__dirname, "dist/public"),
      emptyOutDir: true,
      target: "esnext"
    },
    optimizeDeps: {
      include: ['web-vitals']
    },
    server: {
      fs: { strict: true, deny: ["**/.*"] }
    }
  }
})
