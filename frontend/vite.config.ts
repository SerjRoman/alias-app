import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
	plugins: [
		react(),
		tsconfigPaths(),
		visualizer({
			filename: "dist/stats.html",
			gzipSize: true,
			brotliSize: true,
		}),
	],
	server: {
		allowedHosts: true,
	},
});
