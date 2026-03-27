// open-next.config.ts - Cloudflare Workers Configuration
// ⚠️ For best production results, consider enabling R2 caching
// See: https://opennext.js.org/cloudflare/caching

import { defineCloudflareConfig } from "@opennextjs/cloudflare";
// import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
  // For best results in production, enable R2 caching
  // This serves cached pages from Cloudflare's edge locations
  // Requires R2 bucket setup at https://dash.cloudflare.com
  // incrementalCache: r2IncrementalCache
});
