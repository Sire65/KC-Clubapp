// KC-CORE-NOTFALL-TRESOR: Der Cloudflare-Tresor gibt die Schlüssel-Kopie NUR an den Ablauf „Notfall – Sicherung lesen“ (main) heraus.
// Aufruf: node tests/notfall-tresor.test.mjs (offline: eigener RSA-Schlüssel statt GitHub, GitHub-JWKS wird nachgestellt)
import assert from "node:assert/strict";
import tresor from "../notfall-tresor/worker.js";

const { publicKey, privateKey } = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const jwk = { ...(await crypto.subtle.exportKey("jwk", publicKey)), kid: "k1", alg: "RS256", use: "sig" };
const fremd = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
globalThis.fetch = async (u) => { assert.equal(String(u), "https://token.actions.githubusercontent.com/.well-known/jwks"); return new Response(JSON.stringify({ keys: [jwk] })); };
const b64 = (x) => Buffer.from(typeof x === "string" ? x : new Uint8Array(x)).toString("base64url");
const jetzt = Math.floor(Date.now() / 1000);
const gut = { iss: "https://token.actions.githubusercontent.com", aud: "kc-notfall-tresor", iat: jetzt - 5, exp: jetzt + 300, repository: "Sire65/KC-Clubapp", repository_id: "1392489961", repository_owner_id: "297908448", ref: "refs/heads/main",
  workflow_ref: "Sire65/KC-Clubapp/.github/workflows/notfall-sicherung-lesen.yml@refs/heads/main" };
async function token(p, schl = privateKey, kopf = { alg: "RS256", kid: "k1", typ: "JWT" }) {
  const t = b64(JSON.stringify(kopf)) + "." + b64(JSON.stringify(p));
  return t + "." + b64(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", schl, new TextEncoder().encode(t)));
}
const env = { REPO: "Sire65/KC-Clubapp", REPO_ID: "1392489961", OWNER_ID: "297908448", ABLAEUFE: gut.workflow_ref, KC_BACKUP_KEY: "GEHEIM-SCHLUESSEL", KC_NEON_URL: "postgres://geheim" };
const rufe = async (t, e = env, m = "POST") => { const r = await tresor.fetch(new Request("https://t.example/", { method: m, headers: t ? { authorization: "Bearer " + t } : {} }), e); return { s: r.status, j: await r.json() }; };

let r = await rufe(await token(gut)); assert.equal(r.s, 200); assert.equal(r.j.schluessel, "GEHEIM-SCHLUESSEL"); assert.equal(r.j.neon, "postgres://geheim");
for (const [name, p] of [["anderes Repo", { repository: "fremd/KC-Clubapp" }], ["gleicher Name, andere Repo-Nummer", { repository_id: "1" }], ["andere Besitzer-Nummer", { repository_owner_id: "2" }], ["anderer Zweig", { ref: "refs/heads/dev" }], ["anderer Ablauf", { workflow_ref: "Sire65/KC-Clubapp/.github/workflows/tests.yml@refs/heads/main" }],
  ["andere Zielgruppe", { aud: "kc-db-einspielen" }], ["abgelaufen", { exp: jetzt - 1 }], ["zu alt", { iat: jetzt - 700 }], ["anderer Herausgeber", { iss: "https://boese.example" }]]) {
  r = await rufe(await token({ ...gut, ...p })); assert.equal(r.s, 401, name); assert.ok(!JSON.stringify(r.j).includes("GEHEIM"), name);
}
r = await rufe(await token(gut, fremd.privateKey)); assert.equal(r.s, 401, "fremde Signatur");
r = await rufe(await token(gut, privateKey, { alg: "none", kid: "k1" })); assert.equal(r.s, 401, "alg none");
r = await rufe(await token(gut, privateKey, { alg: "RS256", kid: "unbekannt" })); assert.equal(r.s, 401, "unbekannter Schlüssel");
r = await rufe(""); assert.equal(r.s, 401, "ohne Token"); r = await rufe("a.b.c"); assert.equal(r.s, 401, "Müll");
r = await rufe(null, env, "GET"); assert.equal(r.s, 405);
const st = await tresor.fetch(new Request("https://t.example/status"), env); const sj = await st.json(); assert.deepEqual(sj, { tresor: true, befuellt: true }); assert.ok(!JSON.stringify(sj).includes("GEHEIM"));
r = await rufe(await token(gut), { ...env, KC_BACKUP_KEY: "" }); assert.equal(r.s, 404, "leer = nicht befüllt");
assert.deepEqual(await (await tresor.fetch(new Request("https://t.example/status"), { ...env, KC_NEON_URL: "" })).json(), { tresor: true, befuellt: false });
console.log("OK – Notfall-Tresor: gibt nur dem richtigen Ablauf etwas heraus (15 Gegenproben)");
