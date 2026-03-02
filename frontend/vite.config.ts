// import { defineConfig, ServerOptions } from "vite";
// import react from "@vitejs/plugin-react-swc";
// import path from "path";
// import { componentTagger } from "lovable-tagger";
// import fs from "fs";

// // https://vitejs.dev/config/
// export default defineConfig(({ mode }) => {
//   // Check if SSL certificates exist for local HTTPS development
//   const keyPath = path.resolve(__dirname, "localhost-key.pem");
//   const certPath = path.resolve(__dirname, "localhost.pem");
//   const hasSSL = fs.existsSync(keyPath) && fs.existsSync(certPath);

//   const serverConfig: ServerOptions = {
//     host: "::",
//     port: 8080,
//   };

//   // Enable HTTPS if certificates exist (required for Facebook SDK)
//   if (hasSSL) {
//     serverConfig.https = {
//       key: fs.readFileSync(keyPath),
//       cert: fs.readFileSync(certPath),
//     };
//   }

//   return {
//     server: serverConfig,
//     plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
//     resolve: {
//       alias: {
//         "@": path.resolve(__dirname, "./src"),
//       },
//     },
//   };
// });

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
