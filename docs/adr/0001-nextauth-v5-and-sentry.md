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
- [x] Vars ajoutées au `.env.example` et au CI (valeurs factices)
- [ ] Vérifier le DSN réel + org/project slug lors de la mise en production
- [ ] Penser à ajouter `SENTRY_AUTH_TOKEN` aux secrets GitHub/CI pour l'upload des
      source maps