import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: true,
    port: 5173,

    // Proxy ayarları — Herkül Modu
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
        ws: true,                            // WebSocket destek
        timeout: 60000,                      // 60s timeout
        proxyTimeout: 60000,                 // Proxy timeout
        configure: (proxy) => {
          // Bağlantı kopma hatalarını önleyen güçlendirme
          proxy.on("error", (err, req, res) => {
            console.error("🔴 Proxy Hatası:", err.message);
            if (!res.headersSent) {
              res.writeHead(500, { "Content-Type": "application/json" });
            }
            res.end(JSON.stringify({ ok: false, error: "Proxy Error" }));
          });

          proxy.on("proxyReq", () => {
            // Her istek için canlı tutma — server çökme önleyici
          });
        },

        // URL rewrite — değişmeden kalıyor
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
});
