// eleventyComputed.js — LOGIQUE METIER PURE (racine du projet).
// Aucune logique metier ne vit dans les templates : ils consomment les flags calcules ici.
// Subordonne a l'ETAT FIGE. Applique les invariants de build figes.
//
//   INV-2 — isColdCase : ACTIVE uniquement (flag derive, jamais saisi a la main).
//   INV-3 — ogDescription : verrou de diffusion MECANIQUE.
//   Verrou d'affichage — showResolution : vrai UNIQUEMENT si RESOLVED.
//
// Ces fonctions sont pures et testables. Elles sont cablees dans la cascade de donnees
// via src/content/mysteries/mysteries.11tydata.js (et uniquement la).

const JOUR_MS = 1000 * 60 * 60 * 24;
const jours = (ms) => ms / JOUR_MS;

// Seuil Cold Case (jours). Source unique : src/_data/site.js. Repris ici sans le redefinir.
function coldCaseDays(data) {
  const fromSite = data && data.site && typeof data.site.COLD_CASE_DAYS === "number";
  return fromSite ? data.site.COLD_CASE_DAYS : 90;
}

// Date du dernier progres d'hypothese, si l'enquete en porte (sinon null).
function dernierProgresHypothese(data) {
  const hs = (data && data.hypotheses) || [];
  let max = null;
  for (const h of hs) {
    if (h && h.date) {
      const t = new Date(h.date).getTime();
      if (!Number.isNaN(t) && (max === null || t > max)) max = t;
    }
  }
  return max;
}

// --------------------------------------------------------------------------
// INV-2 — isColdCase. ACTIVE uniquement.
// IN_REVIEW (travail en cours), RESOLVED (termine), UNRESOLVED (mort actee)
// ne sont JAMAIS cold case. Une relance fait retomber le flag au build suivant.
// --------------------------------------------------------------------------
function isColdCase(data) {
  if (!data || data.type !== "enquete") return false;
  if (data.status !== "ACTIVE") return false;

  const now = Date.now();
  const updated = data.updatedAt ? new Date(data.updatedAt).getTime() : now;
  const seuil = coldCaseDays(data);
  const dormantDepuisLongtemps = jours(now - updated) > seuil;

  const dernierProgres = dernierProgresHypothese(data);
  const progresRecent = dernierProgres !== null && jours(now - dernierProgres) <= seuil;

  return dormantDepuisLongtemps && !progresRecent;
}

// --------------------------------------------------------------------------
// Verrou d'affichage — showResolution.
// La decision de masquer la resolution est calculee ICI, pas dans le template.
// Vrai UNIQUEMENT si RESOLVED. ACTIVE / IN_REVIEW / UNRESOLVED => faux.
// --------------------------------------------------------------------------
function showResolution(data) {
  return !!data && data.status === "RESOLVED";
}

// --------------------------------------------------------------------------
// INV-3 — ogDescription. Verrou de diffusion CODE.
// Construite UNIQUEMENT depuis title + description (mystere initial) + category.
// Ne reference JAMAIS : resolution, reasoning, ni l'issue des hypotheses.
// --------------------------------------------------------------------------
function ogDescription(data) {
  if (!data || data.type !== "enquete") {
    return (data && data.site && data.site.description) || "";
  }
  const desc = (data.description || "").replace(/\s+/g, " ").trim();
  if (desc) return desc.slice(0, 200);
  return `${data.title} — ${data.category}. Un mystère à élucider sur Astrolabis.`;
}

module.exports = { isColdCase, showResolution, ogDescription };
