import { config as loadEnv } from "dotenv";
import path from "path";
import type { NextConfig } from "next";

// Load the shared root .env.local (repo root) so frontend and backend use one file.
loadEnv({ path: path.resolve(process.cwd(), "../.env.local") });

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Explicitly point Turbopack at the frontend directory. Otherwise it
    // detects multiple lockfiles (root + frontend) and infers the repo root
    // as the workspace root, which triggers a startup warning.
    root: __dirname,
  },
};

export default nextConfig;
