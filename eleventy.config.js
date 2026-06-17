// eleventy.config.js — Pipeline de build Astrolabis.
// Subordonne a l'ETAT FIGE. En cas de divergence, l'ETAT FIGE prevaut.
//
//   INV-1 — Collections filtrees sur les BONS champs (statut vs flag derive).
//   INV-4 — Exclusion des brouillons (verrou de moderation).
// (INV-2 isColdCase, INV-3 ogDescription, verrou showResolution -> eleventyComputed.js)
//
// Regle d'architecture : AUCUNE logique metier dans les templates.
// Les collections ne RECALCULENT jamais la logique metier : coldCase lit le flag derive.

module.exports = function (eleventyConfig) {
  // Support pathPrefix (domaine custom = "/", page projet github.io = "/astrolabis/").
  // Le plugin reecrit les URL absolues en sortie selon le pathPrefix.
  const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  // --------------------------------------------------------------------------
  // INV-4 — Exclusion des brouillons. Sans cette ligne, Eleventy publie les
  // brouillons et le systeme de moderation est factice.
  // Note : chemin adapte a l'arborescence (content/drafts) ; le mecanisme du
  // verrou de moderation est strictement preserve.
  // --------------------------------------------------------------------------
  eleventyConfig.ignores.add("src/content/drafts/**");

  // Assets statiques
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // --------------------------------------------------------------------------
  // INV-1 — Collections : filtrer sur les bons champs.
  //   active   = status in {ACTIVE, IN_REVIEW, UNRESOLVED}
  //   resolved = status === "RESOLVED"
  //   coldCase = item.data.isColdCase === true   // le COMPUTED flag, jamais un statut
  // Filtrer coldCase sur un statut inexistant => collection toujours vide.
  // --------------------------------------------------------------------------
  const estEnquete = (item) => item.data.type === "enquete";
  const parDateMaj = (a, b) => new Date(b.data.updatedAt) - new Date(a.data.updatedAt);

  eleventyConfig.addCollection("enquetes", (api) =>
    api.getAll().filter(estEnquete).sort(parDateMaj)
  );
  eleventyConfig.addCollection("active", (api) =>
    api.getAll().filter(estEnquete)
      .filter((i) => ["ACTIVE", "IN_REVIEW", "UNRESOLVED"].includes(i.data.status))
      .sort(parDateMaj)
  );
  eleventyConfig.addCollection("resolved", (api) =>
    api.getAll().filter(estEnquete).filter((i) => i.data.status === "RESOLVED").sort(parDateMaj)
  );
  eleventyConfig.addCollection("coldCase", (api) =>
    api.getAll().filter(estEnquete).filter((i) => i.data.isColdCase === true).sort(parDateMaj)
  );
  eleventyConfig.addCollection("nouveaux", (api) =>
    api.getAll().filter(estEnquete)
      .sort((a, b) => new Date(b.data.createdAt) - new Date(a.data.createdAt)).slice(0, 12)
  );

  // --------------------------------------------------------------------------
  // Filtres de PRESENTATION (tables de correspondance, pas de logique metier).
  // --------------------------------------------------------------------------
  const STATUT_LABELS = { ACTIVE: "En cours", IN_REVIEW: "En vérification", RESOLVED: "Classé", UNRESOLVED: "Classé" };
  const STATUT_DOT = { ACTIVE: "dot-vert", IN_REVIEW: "dot-jaune", RESOLVED: "dot-blanc", UNRESOLVED: "dot-blanc" };
  const QUESTION_THEME = {
    Objet: "À quoi servait cet objet ?",
    Lieu: "Où est-ce ?",
    Structure: "Qu'est-ce que cette ruine ?",
    Macro: "Que montre ce détail ?",
    Marque: "Que signifie cette marque ?",
    Scene: "Qu'est-ce qui s'est passé ici ?",
    Phenomene: "Qu'est-ce que c'est ?",
    Autre: "Quel est ce mystère ?",
  };
  const CATEGORIE_LABELS = { Phenomene: "Phénomène", Scene: "Scène" };
  const FIABILITE = { PROBABLE: "Probable", HIGHLY_PROBABLE: "Très probable", ESTABLISHED: "Établie" };

  eleventyConfig.addFilter("statutLabel", (s) => STATUT_LABELS[s] || s);
  eleventyConfig.addFilter("statutDot", (s) => STATUT_DOT[s] || "dot-blanc");
  eleventyConfig.addFilter("questionTheme", (c) => QUESTION_THEME[c] || QUESTION_THEME.Autre);
  eleventyConfig.addFilter("categorieLabel", (c) => CATEGORIE_LABELS[c] || c);
  eleventyConfig.addFilter("fiabiliteLabel", (n) => FIABILITE[n] || n);
  eleventyConfig.addFilter("dateFR", (d) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : ""
  );

  return {
    pathPrefix: process.env.PATH_PREFIX || "/",
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
