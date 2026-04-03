"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupabaseBrowserClient = createSupabaseBrowserClient;
const ssr_1 = require("@supabase/ssr");
function createSupabaseBrowserClient() {
    return (0, ssr_1.createBrowserClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
