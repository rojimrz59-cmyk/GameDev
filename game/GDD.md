# Pigeon Express — document de conception (MVP)

Statut : MVP jouable dans le navigateur (iPhone, Android, ordinateur). Chiffres issus de `economy.js`, rythme vérifié par `sim.js`.

## 1. Trois concepts

| Concept | Principe en une phrase | Force | Faiblesse |
|---|---|---|---|
| **Pigeon Express** | Tu montes une messagerie à pigeons voyageurs : lettres, puis colis, pizzas, bouquets, bijoux. | Compris en 5 s (un pigeon livre = des pièces). Personnages attachants qui portent les cosmétiques. Thème peu exploité. | Le thème « courrier » peut paraître enfantin pour un public de plus de 35 ans. |
| **Répar'Empire** | Tu répares des objets cassés que les clients déposent, du grille-pain au robot. | Angle écolo dans l'air du temps, grande variété d'objets. | Il faut expliquer la boucle (diagnostic, pièces, réparation), et les objets se prêtent mal aux cosmétiques. |
| **Serre lunaire** | Tu cultives des plantes lumineuses sur la Lune et tu les expédies vers la Terre. | Très visuel, ambiance relaxante. | Des plantes forment des personnages faibles, la fantaisie spatiale demande un temps de compréhension, et l'art coûte plus cher. |

## 2. Choix : Pigeon Express

- **Compréhension immédiate.** L'action (envoyer un pigeon), le retour (il traverse l'écran et une pièce sort) et la progression (le pigeonnier grandit) sont visibles sans aucun texte.
- **Monétisation cosmétique naturelle.** Chaque pigeon à l'écran porte la tenue achetée (casquette, lunettes, couronne, écharpe). Le joueur voit ce qu'il a payé des milliers de fois par session. C'est le levier le moins agressif, et il ne casse pas l'équilibre.
- **Production peu coûteuse.** Tout le jeu tient en formes vectorielles simples, sans animation squelettale ni 3D.
- **Contenu extensible.** Chaque nouvelle ville ou nouveau colis est un ajout de données, pas de code.

Confiance : moyenne. Ce choix repose sur un raisonnement, pas sur des données de marché. Ce qui le ferait changer : un test d'icône ou de créa publicitaire (CPI sur 3 visuels) où Répar'Empire convertirait nettement mieux.

## 3. Règles et boucle de jeu

**Boucle de 10 secondes** : toucher une piste → le pigeon livre → +pièces → acheter un niveau.
**Boucle de 10 minutes** : engager un chef (la route devient automatique) → ouvrir la route suivante → franchir un palier (×2) → acheter une amélioration.
**Boucle quotidienne** : revenir → toucher les gains hors ligne (8 h max, 50 %) → ouvrir le coffre du jour (série de 7 jours) → remplir les objectifs → déménager quand le revenu stagne.

Règles :
- 6 routes. Une route rapporte `revenu × niveau × 2^paliers × améliorations × bonus`.
- Prix du niveau suivant : `prix_base × croissance^niveau`, avec une croissance de 1,12 à 1,17.
- Paliers aux niveaux 10, 25, 50, 100, 150, 200, 300 et 400 : chacun double le revenu de la route et ajoute un élément au pigeonnier (drapeau, étage, horloge, toit doré, étoiles, guirlande).
- Un chef automatise sa route, et seules les routes avec chef produisent hors ligne.
- Le pigeon doré traverse l'écran toutes les 70 à 150 s. Si on le touche, il donne soit un boost ×3 pendant 30 s, soit 90 s de revenus.
- Déménagement (prestige) : on repart de zéro, on gagne `floor(√(pièces gagnées dans la ville / 40 M))` plumes d'or, et chaque plume rapporte +5 % de revenus pour toujours.
- Niveau joueur : chaque livraison donne de l'XP (de 1 à 6 selon la route), et chaque niveau donne 5 gemmes.

## 4. Économie

| Route | Prix de base | Croissance | Revenu par livraison (niv 1) | Durée | Chef |
|---|---:|---:|---:|---:|---:|
| Lettres | 4 | 1,12 | 1 | 1 s | 100 |
| Cartes postales | 100 | 1,13 | 14 | 3 s | 2 500 |
| Colis express | 2 500 | 1,14 | 150 | 6 s | 60 K |
| Pizzas volantes | 70 K | 1,15 | 1 900 | 12 s | 1,6 M |
| Bouquets | 2,2 M | 1,16 | 26 K | 24 s | 50 M |
| Bijoux précieux | 80 M | 1,17 | 380 K | 48 s | 1,8 B |

Il y a 10 améliorations à usage unique, de 6 K à 100 T pièces, avec des multiplicateurs ×2 à ×3, ciblant une route ou toutes.

**Rythme simulé** (joueur actif qui achète toujours le meilleur rapport gain/prix, `node game/sim.js 4`) :

| Moment | 1re ville | 2e ville (12 plumes) |
|---|---|---|
| Premier chef | 41 s | 41 s |
| Route 2 | 1 min 50 | 1 min 16 |
| Route 3 | 3 min 30 | 1 min 50 |
| Route 4 | 9 min | 6 min |
| Route 5 | 19 min | 11 min |
| Route 6 | 1 h 10 | 45 min |
| Plumes disponibles à 2 h | 8 (+40 %) | 13 |

Après environ 2 h, le revenu plafonne : c'est le moment voulu pour déménager. Les gains hors ligne sont plafonnés à 8 h et payés à 50 %, pour que jouer rapporte plus qu'attendre sans pénaliser la nuit.

**Gemmes gratuites** : environ 100 le premier jour (niveaux + objectifs), puis 10 à 50 par jour avec le coffre. Utilisations : saut temporel de 1 h (30), skins (60 à 300).

## 5. Progression et contenus à débloquer

- **Villes** : Village → Bourg → Ville → Cité → Métropole → Capitale → Mégapole. Chaque déménagement teinte le ciel.
- **Pigeonniers** : 8 paliers visuels par route.
- **Objectifs** : 20 objectifs en chaîne (3 visibles à la fois), du tutoriel jusqu'au 3e déménagement.
- **Skins** : Classique, Facteur, Aviateur, Royal, Flamboyant.
- **Prochaines couches** (hors MVP) : événements hebdomadaires (Saint-Valentin : la route Bouquets ×5 et un skin limité), managers à pouvoirs, cartes de ville à décorer, classement entre amis.

## 6. Identité visuelle

- **Ciel jour / nuit** : thème clair en bleu ciel, thème sombre en ciel nocturne, qui suit le réglage du téléphone.
- **Couleurs** : chaque route a sa couleur (corail, orange, menthe, rose, lilas, bleu). Les boutons d'achat sont corail, les chefs menthe, les récompenses jaune soleil, les gemmes violettes.
- **Typographie** : Fredoka (titres, chiffres ronds et lisibles), Nunito (textes).
- **Formes** : grosses cartes arrondies et boutons épais avec une ombre portée (effet « bouton à presser »), tous dans la zone du pouce.
- **Mouvement** : le pigeon bat des ailes et traverse la piste (c'est la barre de progression), les pièces montent, le pigeonnier fait un rebond à chaque palier. Les animations sont coupées si l'option « réduire les animations » est active.

## 7. Monétisation (prévue, simulée dans le MVP)

| Levier | Où | Garde-fou |
|---|---|---|
| Pub récompensée | Gains hors ligne ×2, boost ×2 30 min (cumul 4 h), coffre du jour ×2 | Toujours facultative, aucune pub imposée |
| Achats de gemmes | 500 gemmes à 4,99 € | Tout s'obtient aussi en jouant |
| Pack de démarrage | 1,99 €, proposé une fois | — |
| Cosmétiques | Skins de pigeons | Aucun effet sur l'économie |
| Pass Premium | 4,99 €/mois : ×2 permanent, hors ligne 12 h, bonus sans pub | Le ×2 n'est pas nécessaire pour finir le contenu |

## 8. Ce que contient le MVP

Inclus et testé :
- les 6 routes, les chefs, les paliers, les 10 améliorations ;
- les objectifs, le niveau joueur, le coffre du jour, le pigeon doré, le déménagement ;
- les 5 skins ;
- la sauvegarde automatique (appareil, plus le compte Claude quand c'est disponible) et les gains hors ligne ;
- le tutoriel interactif, les thèmes clair et sombre, la mise en page pour une seule main.

Simulé : les publicités (compte à rebours de 3 s) et les achats intégrés (désactivés).

Manquant pour publier sur l'App Store et le Play Store :
- une coque native (Capacitor) ;
- un SDK publicitaire (AdMob ou AppLovin MAX) ;
- les achats natifs (StoreKit et Play Billing) ;
- l'analytique (rétention J1/J7, entonnoir du tutoriel) ;
- une horloge serveur pour les gains hors ligne, aujourd'hui basés sur l'horloge du téléphone (triche possible en avançant l'heure) ;
- de la musique.

## Lancer et tester

- Jouer : ouvrir `index.html` (avec `economy.js` et `game.js` à côté) via n'importe quel serveur web statique.
- Tests de l'économie : `node game/test.js`.
- Simulation de rythme : `node game/sim.js <heures> <plumes>`.
