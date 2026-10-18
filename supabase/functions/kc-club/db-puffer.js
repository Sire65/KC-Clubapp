// KC-CLUB-NOTPAKET-PUFFER (2.449.0): Lese-Puffer nur für den eigenen Aufruf (AsyncLocalStorage aus Deno/Node, kostenlos, keine Abhängigkeit).
// Eigene kleine Datei, damit die Node-Typen nicht die Typen des ganzen Servers verändern.
import { AsyncLocalStorage } from "node:async_hooks";
export const DB_PUFFER = new AsyncLocalStorage();
