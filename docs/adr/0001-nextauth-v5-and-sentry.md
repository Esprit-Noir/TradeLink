# ADR 0001 — NextAuth v5 (beta) et observabilité Sentry

Date : 2026-08-31
Statut : **Accepté** (avec risques documentés)

## Contexte

La revue de code tierce a identifié deux points de risque structurels :

1. **NextAuth v5** : le projet utilise `next-auth@^5.0.0-beta.32`. Auth.js v5 est
   toujours en bêta et son API peut changer (migration `@next-auth` → `@auth/core`,
   `auth()` vs `getServerSession`, etc.).
2. **Observabilité** : aucune instrumentation d'erreurs ni de tracing en production.

## Décision

- **NextAuth v5 beta est conservé** pour l'instant : c'est le pré-requis de la
  migration officielle, `@auth/prisma-adapter` est compatible, et une migration
  vers une alternative (Clerk / Lucia / rollback v4) représenterait un chantier
  disproportionné. Les types sont déjà dupliqués dans `src/types/next-auth.d.ts`
  pour désensibiliser l'app du shape exact de la session.
- **Sentry est intégré** (SDK `@sentry/nextjs`, instrumentation `src/instrumentation.ts`,
  `global-error.tsx`) pour la capture d'erreurs et le tracing.

## Risques & Mitigations

### NextAuth v5 beta

| Risque | Impact | Mitigation |
| --- | --- | --- |
| Breaking change dans une beta mineure | Logout/session cassé en prod | Pinner la version (voir `package.json`), maîtriser les upgrades |
| `next-auth@beta` non recommandée en prod | Surface d'attaque / bugs auth | Vérifier les release notes avant upgrade ; rester sur une version connue |
| Gestion des sessions multiples / `tokenVersion` | Logout de toutes les sessions | Champs déjà présents dans `src/types/next-auth.d.ts` + `auth.ts` |

### Sentry

| Risque | Impact | Mitigation |
| --- | --- | --- |
| DSN mal configuré | Fausses alertes / données sensibles | DSN par env vars `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`, jamais en dur |
| Upload source maps | Détails internes exposés | `SENTRY_AUTH_TOKEN` stocké via les secrets du VCS/hébergeur, jamais commité |
| Coût / quota | Facture inattendue en prod | `tracesSampleRate` à 0.1 en production (configurable) |

## Actions associées

- [x] Intégration SDK Sentry (fichiers `sentry.*.config.ts`, `instrumentation.ts`,
      `global-error.tsx`, `withSentryConfig` dans `next.config.ts`)
- [x] Vars ajoutées au `.env.example` (placeholders) et au CI (valeurs factices)
- [x] DSN réel + `environment`/`release` configurés (DSN via `.env.local`, jamais commité)
- [x] Incident de sécurité traité : token `sntrys_` collé dans `.env.example` (commitable)
      → purge + déplacement vers `.env.local` (ignoré). Vérifié : aucun secret dans git.
- [ ] **Slug de projet** (`SENTRY_PROJECT`) : à renseigner dans `.env.local` et les secrets
      du déploiement (Settings → Projects → <project> dans Sentry). Tant qu'il est vide,
      l'upload des source maps est skip (warning, pas de crash) et les stack traces restent
      minifiés.
- [ ] Confirmer la première erreur vue sur https://sentry.io/issues/
- [ ] Ajouter `SENTRY_AUTH_TOKEN` (+ `SENTRY_ORG`/`SENTRY_PROJECT`) aux secrets du
      déploiement CI pour l'upload des source maps