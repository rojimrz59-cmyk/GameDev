# Pigeon Express : publier sur l'App Store et Google Play

Ce dossier transforme le jeu web (`../game`) en vraies apps iPhone et Android avec Capacitor 8. Il contient aussi les pubs récompensées (AdMob) et les achats intégrés (RevenueCat).

État : le projet Android est généré (`android/`) et la page web se construit (`npm run build`). Rien n'a encore tourné sur un vrai téléphone : cet environnement n'a ni Mac ni Android Studio.

## Ce qui est déjà en place dans le code

- **Pubs** : uniquement des vidéos récompensées, toujours facultatives. Elles apparaissent à 7 endroits : gains d'absence ×2, coffre ×2, éclosion immédiate, fête d'ouverture d'une route, plumes ×1,5, lettre ×2 et boost 30 min. Elles sont plafonnées à 12 par jour.
- **Mode enfant** : on demande l'année de naissance au premier lancement. Si le joueur a 13 ans ou moins :
  - les pubs sont marquées pour enfants et non personnalisées ;
  - chaque achat demande la réponse d'un adulte (contrôle parental) ;
  - un rappel de pause s'affiche après 45 min.
- **Pas de boîtes surprises payantes** : les œufs se gagnent seulement en jouant.
- Les **identifiants de test** Google AdMob sont déjà configurés. Tu peux tester les pubs sans risque pour ton compte.

## Étapes (dans l'ordre)

| # | Étape | Lien | Coût |
|---|---|---|---|
| 1 | Créer un compte développeur Apple | https://developer.apple.com/programs/enroll/ | 99 $/an |
| 2 | Créer un compte développeur Google Play | https://play.google.com/console/signup | 25 $ une fois |
| 3 | Créer un compte AdMob, puis une app iOS et une app Android, chacune avec un bloc « Récompensé » | https://admob.google.com | gratuit |
| 4 | Dans AdMob, menu « Confidentialité et messages » : créer le message de consentement RGPD | https://admob.google.com | gratuit |
| 5 | Créer un compte RevenueCat et y relier les deux stores | https://app.revenuecat.com/signup | gratuit sous 2 500 $/mois |
| 6 | Dans App Store Connect, section « Business » : signer le contrat « Applications payantes » et renseigner banque et impôts | https://appstoreconnect.apple.com | — |
| 7 | Dans Play Console, créer un profil de paiement | https://play.google.com/console | — |
| 8 | Activer GitHub Pages (branche `main`, dossier `/docs`) pour héberger la politique de confidentialité | https://github.com/rojimrz59-cmyk/GameDev/settings/pages | gratuit |
| 9 | Installer Xcode (Mac obligatoire pour iOS) | https://apps.apple.com/app/xcode/id497799835 | gratuit |
| 10 | Installer Android Studio | https://developer.android.com/studio | gratuit |

Avant l'étape 8 :
- remplace `[NOM DU DÉVELOPPEUR]` et `[E-MAIL DE CONTACT]` dans `docs/confidentialite.html` ;
- merge la branche dans `main`.

La politique sera alors en ligne à `https://rojimrz59-cmyk.github.io/GameDev/confidentialite.html`.

## Produits à créer dans les deux stores (puis dans RevenueCat)

| Identifiant | Type | Prix conseillé |
|---|---|---|
| `pe_starter_pack` | consommable | 1,99 € |
| `pe_gems_500` | consommable | 4,99 € |
| `pe_gems_1500` | consommable | 9,99 € |
| `pe_premium_monthly` | abonnement mensuel, droit RevenueCat `premium` | 4,99 € |

## Brancher tes identifiants

1. `game/ads.js` :
   - remplace les deux identifiants `admobRewarded` par tes blocs « Récompensé » ;
   - colle tes clés publiques RevenueCat (`appl_…` et `goog_…`) dans `revenuecatKey` ;
   - passe `testing` à `false` seulement au moment de publier.
2. `native/android/app/src/main/AndroidManifest.xml` : remplace la valeur `APPLICATION_ID` par l'identifiant de ton app Android AdMob (il contient un `~`).
3. `native/capacitor.config.json` : remplace `com.pigeonexpress.game` par un identifiant à toi, par exemple `com.tonpseudo.pigeonexpress`. Fais-le **avant** de créer les apps dans les stores, car il ne peut plus changer ensuite.

## Construire

```bash
cd native
npm install
npm run android        # ouvre Android Studio : bouton ▶ pour lancer sur un téléphone
# sur un Mac uniquement :
npx cap add ios
npm run ios            # ouvre Xcode
```

Sur iOS, après `npx cap add ios`, ajoute dans `ios/App/App/Info.plist` :
- `GADApplicationIdentifier` : l'identifiant de ton app iOS AdMob (avec `~`). Le test officiel est `ca-app-pub-3940256099942544~1458002511`.
- `SKAdNetworkItems` : la liste fournie par Google (https://developers.google.com/admob/ios/quick-start).
- `NSUserTrackingUsageDescription` : « Permet d'afficher des publicités plus adaptées. Le jeu fonctionne sans. »

## Comment vérifier que ça marche

1. Lance l'app sur un téléphone avec les identifiants de test et indique une année de naissance adulte. Touche « Boost ×2 » dans la Boutique. Une vraie vidéo « Test Ad » doit s'afficher, et le boost doit s'activer à la fin.
2. Recommence avec une année de naissance d'enfant. La pub doit toujours s'afficher. Les achats doivent demander une multiplication à un adulte.
3. Achats : crée un compte testeur sandbox (App Store Connect, Utilisateurs et accès, Sandbox) et un testeur de licence (Play Console, Paramètres, Test de licence), puis achète `pe_gems_500`. Les gemmes doivent arriver.

## Déclarations aux stores

- **Google Play** : renseigne le questionnaire de classification IARC (contenu tout public, donc PEGI 3) et le « Public cible ». Choisis « mixte (enfants et adultes) », puisque l'âge est demandé. Les pubs doivent passer par des SDK certifiés Familles : AdMob l'est.
- **Apple** : classification 4+. Ne mets pas l'app dans la catégorie « Enfants » : Apple y interdit presque toutes les pubs tierces. Déclare dans « Confidentialité de l'app » les données collectées par AdMob (identifiants, données d'utilisation).
