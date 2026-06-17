# Astrolabis — dépôt Eleventy exécutable

Mémoire du réel : bibliothèque vivante de mystères réels, documentés et résolus.
Site statique Eleventy. **Subordonné à l'État figé** (source unique de vérité).

## Lancer

```bash
npm install
npm run serve     # dev, http://localhost:8080
npm run build     # genere _site/
npm run verify    # build propre + verification des invariants (echoue si contournables)
```

## Arborescence (responsabilité unique par dossier)

```
eleventy.config.js              Pipeline : collections (INV-1), exclusion brouillons (INV-4), filtres de presentation
eleventyComputed.js             LOGIQUE METIER PURE : isColdCase (INV-2), showResolution, ogDescription (INV-3)
scripts/verify-invariants.js    Verifie sur _site que les invariants sont incontournables (exit 1 sinon)
src/
  _data/site.js                 Constantes (COLD_CASE_DAYS, categories, baseline, accent) — definies une seule fois
  _includes/components/         Composants reutilisables (macros Nunjucks, presentation pure) :
                                  badge-statut, carte, timeline, bloc-hypotheses, bloc-preuves,
                                  bloc-resolution, bloc-sources, bloc-contributeurs, appel-contrib
  _layouts/                     base.njk (OG verrouille) · enquete.njk (gabarit 6 blocs, assemble les composants)
  assets/css/astrolabis.css     Charte FIGEE (fond sombre chaud, terracotta #B85C00, serif, calme)
  content/mysteries/            Les dossiers (.md) + mysteries.11tydata.js (cable eleventyComputed — SEUL endroit)
  content/drafts/               Brouillons — IGNORES au build (INV-4)
  index.njk                     Accueil (enquete du moment + grille)
  enquetes.njk                  Archive + filtres cumulables theme x statut  -> /enquetes/
  cold-cases.njk                Filtre isColdCase = true                       -> /cold-cases/
  resolutions.njk               Filtre status = RESOLVED                       -> /resolutions/
  recherche.njk                 Recherche statique (index JSON)                -> /recherche/
  deposer.njk                   Depot controle                                 -> /deposer/
  404.njk                       Page introuvable                               -> /404.html
  search-index.njk              -> /search-index.json (title, tags, category, location, status — jamais la resolution)
```

## Règle d'architecture (stricte)

**Aucune logique métier dans les templates.** Toute décision est calculée dans `eleventyComputed.js`
ou `eleventy.config.js`, et les templates consomment des flags précalculés :
`isColdCase`, `showResolution`, `ogDescription`. Le masquage de la résolution n'est jamais
décidé par un template : il lit `showResolution`.

## Les 4 invariants de build (priment sur toute interprétation)

- **INV-1** Collections filtrées sur les bons champs : `coldCase` sur le flag dérivé, jamais un statut.
- **INV-2** `isColdCase` calculé dans `eleventyComputed.js`, ACTIVE uniquement.
- **INV-3** `ogDescription` construite UNIQUEMENT depuis title + description + category. Jamais la résolution.
- **INV-4** `eleventyConfig.ignores.add("src/content/drafts/**")` — verrou de modération.
  (Chemin adapté à l'arborescence ; mécanisme du verrou strictement préservé vs spec `src/drafts/**`.)

## Verrou de diffusion

Résolution (blocs 3-4-5) visible UNIQUEMENT si `status: RESOLVED`. Sinon le scroll s'arrête
après le bloc 2 sur l'appel à contribution Facebook. Le `search-index.json` et l'`ogDescription`
n'exposent jamais la résolution.

## Données d'un dossier (front matter)

```yaml
title, slug, status (ACTIVE|IN_REVIEW|RESOLVED|UNRESOLVED), createdAt, updatedAt,
category (8 themes), location {city, region}, description, images[], soumisPar, facebookUrl,
timeline[{date,text,type}], hypotheses[{text,status,author,date}],
resolution {statusLevel, tournant, summary, reasoning, preuves[]}, sources[], contributeurs{}, tags[]
```
Flags calculés au build (jamais en front matter) : `isColdCase`, `showResolution`, `ogDescription`.

## À brancher ensuite (non figé)

- Vrai logo terracotta (mémoire Cowork) dans `_layouts/base.njk`.
- Formulaire de dépôt -> crée un brouillon dans `src/content/drafts/` (déjà exclu par INV-4).
- Domaine final dans `src/_data/site.js` (`url`) + `CNAME` GitHub Pages.
- Discipline de tagage : un tag trop explicite peut divulguer la réponse via la recherche.
