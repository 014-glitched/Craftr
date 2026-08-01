import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@craftr/database", "@craftr/validation", "better-auth"],
};

export default nextConfig;
