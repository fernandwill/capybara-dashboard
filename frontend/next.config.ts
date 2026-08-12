import { config as loadEnv } from "dotenv";
import path from "path";
import type { NextConfig } from "next";

// Load the shared root .env.local (repo root) so frontend and backend use one file.
loadEnv({ path: path.resolve(process.cwd(), "../.env.local") });

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
