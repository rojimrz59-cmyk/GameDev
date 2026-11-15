# Pigeon Express — document de conception (v2)

Statut : version 2 jouable dans le navigateur. Projet natif iOS/Android prêt à compiler dans `native/`. Chiffres issus de `economy.js`, textes de `content.js`, pubs et achats dans `ads.js`, rythme vérifié par `sim.js`.

## 1. Concept

Tu diriges une messagerie à pigeons voyageurs. Tu commences avec des lettres, puis tu ouvres les cartes postales, les colis, les pizzas volantes, les bouquets et les bijoux. Tu passes ensuite du Village à la Mégapole.

Public : tout public dès 6 ans (PEGI 3, App Store 4+), sans exclure les adultes. Humour bienveillant, pas de violence.

## 2. Mécaniques originales (v2)

| Mécanique | Règle | Pourquoi elle accroche |
|---|---|---|
| **Pigeons stars** | 12 pigeons à collectionner. Chacun a un défaut rigolo qui est aussi un pouvoir : Gérard livre ×3 mais s'endort, il faut le toucher pour le réveiller ; Kevin se trompe d'adresse et revient avec des cadeaux ×5 ; Mamie Plume livre ×3 pendant l'absence… Un pigeon star par route. Les doublons ajoutent des étoiles (3 max). | Collection, choix d'affectation (combo de pouvoirs), personnages mémorables |
| **Couveuse** | Les œufs (tacheté 5 min, étoilé 30 min, doré 2 h) se gagnent aux paliers 25/100/300, avec les objectifs, le coffre des jours 4 et 7, le courrier et le chat. Chances affichées. Jamais vendus contre de l'argent. | Raison de revenir (minuteurs), surprise à l'éclosion |
| **Tampon parfait** | Sur les routes de 1,5 s ou plus, la boîte aux lettres brille en fin de vol. La toucher à ce moment donne ×3. Combo de 5 : revenus ×2 pendant 30 s. Trop tôt : le combo retombe à zéro. | Un geste d'adresse dans un jeu idle : jouer activement rapporte plus |
| **Le chat Moustache** | Dès le niveau 7, il fait la sieste sur une piste et bloque les livraisons. 5 chatouilles le font fuir en lâchant des pièces (et un œuf dans 15 % des cas). Le Ninja Gris l'évite. | Antagoniste comique, événement à réaction rapide |
| **Courrier des clients** | Dès le niveau 5, des lettres arrivent toutes les 4 à 7 min (18 lettres : escargot pressé, fantôme timide, dinosaure en retard…). 2 choix, chacun avec sa récompense et une chute drôle. | Humour, narration, micro-décision |
| Pigeon doré | Passe toutes les 70 à 150 s. Le toucher donne un boost ×3 ou 90 s de revenus. | Réflexe, surprise |

## 3. Boucles de jeu

- **10 s** : envoyer, tamponner, acheter un niveau.
- **10 min** : chef, nouvelle route (fête d'ouverture), palier (×2 + œuf), lettre, chat.
- **Chaque jour** : gains d'absence (8 h à 50 %, 12 h en Premium), coffre (série de 7 jours), éclosions, objectifs, déménagement.

Les mécaniques arrivent une par une, pour que le jeu reste compréhensible en 30 s :

| Moment | Ce qui se débloque |
|---|---|
| Tutoriel | Envoyer, acheter, chef |
| Route 2 | Tampon parfait (explication à la première fenêtre) |
| Palier 25 | Premier œuf |
| Niveau 5 | Courrier |
| Niveau 7 | Chat Moustache |
| Environ 1 h | Déménagement |

## 4. Économie

| Route | Prix de base | Croissance | Revenu par livraison (niv 1) | Durée | Chef |
|---|---:|---:|---:|---:|---:|
| Lettres | 4 | 1,12 | 1 | 1 s | 100 |
| Cartes postales | 100 | 1,13 | 14 | 3 s | 2 500 |
| Colis express | 2 500 | 1,14 | 150 | 6 s | 60 K |
| Pizzas volantes | 140 K | 1,15 | 1 900 | 12 s | 3,2 M |
| Bouquets | 3,5 M | 1,16 | 26 K | 24 s | 80 M |
| Bijoux précieux | 120 M | 1,17 | 380 K | 48 s | 3 B |

Prestige : `plumes = floor(√(pièces gagnées dans la ville / 100 M))`, et chaque plume donne +5 % de revenus pour toujours.

Rythme simulé (`node game/sim.js 3`), avec l'équipage et les tampons :

| Moment | 1re ville | 2e ville (10 plumes) |
|---|---|---|
| Route 3 | 3 min 21 | 1 min 50 |
| Route 4 | 11 min | 8 min 43 |
| Route 5 | 15 min 36 | 11 min |
| Route 6 | 44 min | 33 min 41 |
| Plumes à 2 h | 8 | 12 |

## 5. Monétisation

Il n'y a que des pubs récompensées. Le joueur choisit toujours de les regarder, avec un plafond de 12 par jour :

| Moment | Récompense |
|---|---|
| Retour après absence | Gains ×2 |
| Coffre du jour | ×2 |
| Couveuse | Éclosion immédiate |
| Nouvelle route ouverte | Fête : ×2 pendant 10 min |
| Déménagement | Plumes ×1,5 |
| Lettre | Récompense ×2 |
| Boutique | Boost ×2 pendant 30 min (cumul 4 h) |

Achats intégrés (RevenueCat) :
- Pack de démarrage : 1,99 € ;
- 500 gemmes : 4,99 € ;
- 1 500 gemmes : 9,99 € ;
- Pass Premium : 4,99 €/mois. Il donne ×2 revenus, 12 h d'absence, une couveuse en plus et tous les bonus sans pub.

Les gemmes servent aux skins, aux sauts temporels et à l'éclosion rapide. Elles n'achètent jamais un œuf.

## 6. Protection des enfants (obligatoire pour les stores)

- Âge demandé au premier lancement, sans valeur par défaut.
- 13 ans ou moins :
  - pubs marquées pour enfants et non personnalisées ;
  - chaque achat demande la réponse d'un adulte (contrôle parental) ;
  - rappel de pause après 45 min.
- Aucune boîte surprise payante, aucune pub imposée, aucun compte à rebours d'offre payante.
- Politique de confidentialité : `docs/confidentialite.html`.

## 7. Direction artistique

- **Style cartoon « autocollant »** : contours prune épais, ombres pleines, boutons qu'on « enfonce ».
- **Polices** : Lilita One (titres, compteur), Nunito (textes).
- **Personnages** : pigeons ronds aux grands yeux et aux joues roses, chacun avec son accessoire (bonnet de nuit, bandeau, hélice, masque de ninja, couronne…).
- **Animations** : battement d'ailes, drapeaux qui flottent, pigeonniers qui « respirent » et rebondissent à chaque palier, confettis, pièces qui volent vers le compteur, tampon qui s'écrase, chat qui remue la queue, œufs qui tremblent puis se fendillent, transitions entre onglets, carte de bienvenue à chaque nouvelle ville.
- **Décor** : soleil souriant, nuages, ville en silhouette qui grandit à chaque déménagement, thème nuit automatique.

## 8. Son

- **Musique originale** synthétisée en direct (aucun fichier) : 16 mesures à 116 BPM, en Do majeur. Elle s'adapte au jeu en trois couches : calme (accueil), jeu (batterie et mélodie), boost (batterie plus dense et mélodie doublée à l'octave). Chaque ville change de tonalité.
- **28 bruitages** :
  - livraisons : roucoulement à l'envoi, pièces plus aiguës selon la route ;
  - achats et progression : arpège d'achat qui monte quand on enchaîne, fanfares de palier et de niveau ;
  - tampon : « thunk » plus une note qui monte avec le combo, « boing » quand c'est trop tôt ;
  - personnages : miaulement et chatouilles de Moustache, ronflement et sifflet de réveil de Gérard, « boing » de Kevin ;
  - événements : sonnette du courrier, papier froissé, œuf qui craque et éclosion, pigeon doré, caisse enregistreuse, fête, fanfare de déménagement.
- **Mixage** : bus musique, bruitages et volume global, avec limiteur. La musique baisse sous les fenêtres et se coupe pendant les pubs. Petites variations de hauteur pour éviter la répétition.
- **Niveaux mesurés** : crête à −3 dBFS, musique autour de −30 dB RMS, mélange chargé autour de −25 dB RMS. Le son se coupe quand l'app passe en arrière-plan. Les curseurs Musique et Bruitages sont dans les Réglages.

## Lancer et tester

- Tests de l'économie et des textes : `node game/test.js`.
- Rythme : `node game/sim.js <heures> <plumes>`.
- App native : voir `native/README.md`.
