// STILLGELEGT (01.10.2026): einmaliger Versand der Wunschzeiten-Bögen ist erledigt (Ergebnis in kc_club_protokoll, aktion wunschbogen_mail_ergebnis).
Deno.serve(() => new Response(JSON.stringify({ error: "stillgelegt – Versand ist erledigt" }), { status: 410, headers: { "Content-Type": "application/json" } }));
