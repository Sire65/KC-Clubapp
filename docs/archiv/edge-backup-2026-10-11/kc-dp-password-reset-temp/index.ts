import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(() => new Response(JSON.stringify({ ok: false, disabled: true, message: "Temporary KC-DP password reset has been disabled." }), {
  status: 410,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
}));
