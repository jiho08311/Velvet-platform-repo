"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = exports.createServerSupabaseClient = void 0;
exports.createSupabaseServerClient = createSupabaseServerClient;
const headers_1 = require("next/headers");
const ssr_1 = require("@supabase/ssr");
async function createSupabaseServerClient() {
    const cookieStore = await (0, headers_1.cookies)();
    return (0, ssr_1.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            get(name) {
                return cookieStore.get(name)?.value;
            },
            set(name, value, options) {
                try {
                    cookieStore.set({ name, value, ...options });
                }
                catch { }
            },
            remove(name, options) {
                try {
                    cookieStore.set({ name, value: "", ...options });
                }
                catch { }
            },
        },
    });
}
exports.createServerSupabaseClient = createSupabaseServerClient;
exports.createClient = createSupabaseServerClient;
