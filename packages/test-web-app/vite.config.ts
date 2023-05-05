import path from 'path'
import { PluginOption, defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
<<<<<<< Updated upstream
    plugins: [react() as PluginOption],
=======
    plugins: [react() as PluginOption, splitVendorChunkPlugin()],
    server: {
        headers: {
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
        },
    },
>>>>>>> Stashed changes
})
