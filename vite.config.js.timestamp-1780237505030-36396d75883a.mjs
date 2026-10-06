// vite.config.js
import { defineConfig } from "file:///sessions/wizardly-trusting-ritchie/mnt/event-platform/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/wizardly-trusting-ritchie/mnt/event-platform/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src"
    }
  },
  // Pre-bundle the heavy deps Vite would otherwise discover on first request.
  // Cuts the dev-server "compiling…" pause when you hit a new route.
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "lucide-react",
      "react-hot-toast",
      "date-fns"
    ]
  },
  build: {
    target: "es2020",
    // Avoid loading every vendor in the initial chunk.
    rollupOptions: {
      output: {
        manualChunks: {
          // React itself — almost never changes between builds, perfect cache hit.
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // Supabase is heavy; keep it isolated so the rest of the app loads fast.
          "supabase": ["@supabase/supabase-js"],
          // Icons + tiny UI libs grouped together.
          "ui": ["lucide-react", "react-hot-toast", "date-fns"]
        }
      }
    },
    // Slight bump — large source maps are not worth shipping to prod.
    sourcemap: false,
    chunkSizeWarningLimit: 700
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvd2l6YXJkbHktdHJ1c3Rpbmctcml0Y2hpZS9tbnQvZXZlbnQtcGxhdGZvcm1cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9zZXNzaW9ucy93aXphcmRseS10cnVzdGluZy1yaXRjaGllL21udC9ldmVudC1wbGF0Zm9ybS92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vc2Vzc2lvbnMvd2l6YXJkbHktdHJ1c3Rpbmctcml0Y2hpZS9tbnQvZXZlbnQtcGxhdGZvcm0vdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiAnL3NyYycsXG4gICAgfSxcbiAgfSxcbiAgLy8gUHJlLWJ1bmRsZSB0aGUgaGVhdnkgZGVwcyBWaXRlIHdvdWxkIG90aGVyd2lzZSBkaXNjb3ZlciBvbiBmaXJzdCByZXF1ZXN0LlxuICAvLyBDdXRzIHRoZSBkZXYtc2VydmVyIFwiY29tcGlsaW5nXHUyMDI2XCIgcGF1c2Ugd2hlbiB5b3UgaGl0IGEgbmV3IHJvdXRlLlxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbXG4gICAgICAncmVhY3QnLFxuICAgICAgJ3JlYWN0LWRvbScsXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbScsXG4gICAgICAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJyxcbiAgICAgICdsdWNpZGUtcmVhY3QnLFxuICAgICAgJ3JlYWN0LWhvdC10b2FzdCcsXG4gICAgICAnZGF0ZS1mbnMnLFxuICAgIF0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgdGFyZ2V0OiAnZXMyMDIwJyxcbiAgICAvLyBBdm9pZCBsb2FkaW5nIGV2ZXJ5IHZlbmRvciBpbiB0aGUgaW5pdGlhbCBjaHVuay5cbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgLy8gUmVhY3QgaXRzZWxmIFx1MjAxNCBhbG1vc3QgbmV2ZXIgY2hhbmdlcyBiZXR3ZWVuIGJ1aWxkcywgcGVyZmVjdCBjYWNoZSBoaXQuXG4gICAgICAgICAgJ3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAvLyBTdXBhYmFzZSBpcyBoZWF2eTsga2VlcCBpdCBpc29sYXRlZCBzbyB0aGUgcmVzdCBvZiB0aGUgYXBwIGxvYWRzIGZhc3QuXG4gICAgICAgICAgJ3N1cGFiYXNlJzogICAgIFsnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ10sXG4gICAgICAgICAgLy8gSWNvbnMgKyB0aW55IFVJIGxpYnMgZ3JvdXBlZCB0b2dldGhlci5cbiAgICAgICAgICAndWknOiAgICAgICAgICAgWydsdWNpZGUtcmVhY3QnLCAncmVhY3QtaG90LXRvYXN0JywgJ2RhdGUtZm5zJ10sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgLy8gU2xpZ2h0IGJ1bXAgXHUyMDE0IGxhcmdlIHNvdXJjZSBtYXBzIGFyZSBub3Qgd29ydGggc2hpcHBpbmcgdG8gcHJvZC5cbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNzAwLFxuICB9LFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBb1YsU0FBUyxvQkFBb0I7QUFDalgsT0FBTyxXQUFXO0FBRWxCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLO0FBQUEsSUFDUDtBQUFBLEVBQ0Y7QUFBQTtBQUFBO0FBQUEsRUFHQSxjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUE7QUFBQSxJQUVSLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQTtBQUFBLFVBRVosZ0JBQWdCLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBO0FBQUEsVUFFekQsWUFBZ0IsQ0FBQyx1QkFBdUI7QUFBQTtBQUFBLFVBRXhDLE1BQWdCLENBQUMsZ0JBQWdCLG1CQUFtQixVQUFVO0FBQUEsUUFDaEU7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSxXQUFXO0FBQUEsSUFDWCx1QkFBdUI7QUFBQSxFQUN6QjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
