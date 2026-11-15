# Bande-annonce Pigeon Express (30 s)

`pigeon-express-trailer.mp4` : 1080×1920 (vertical, 9:16), 30 images/s, H.264 + AAC, son normalisé à −14 LUFS (crêtes à −1,5 dB).
Formats visés : aperçus App Store et Google Play, TikTok, Reels, Shorts.

Toutes les images viennent du vrai jeu, filmé dans Chromium. La musique et les bruitages viennent du moteur audio du jeu.

## Plans

| # | Plan | Ce qu'on voit |
|---|---|---|
| 1 | Titre | Logo, pigeons qui traversent l'écran, « La Lettre d'Or » |
| 2 | Histoire | Capucine se présente |
| 3 | Tap | Envoi, achats de niveaux, palier ×2, œuf gagné |
| 4 | Croissance | 6 routes, achat « MAX », pistes arc-en-ciel en boost |
| 5 | Tampon | 5 tampons parfaits d'affilée, super combo |
| 6 | Couveuse | Éclosion de Turbo (légendaire) |
| 7 | Chat | Moustache bloque une piste, chatouilles, il s'enfuit |
| 8 | Courrier | Lettre du Père Noël, récompense |
| 9 | Bonus | Pigeon doré attrapé, bannière de niveau |
| 10 | Ville | Déménagement vers Bourg |
| 11 | Augustin | Les retrouvailles avec Papi Augustin |
| 12 | Fin | Personnages, slogan, « Bientôt sur iPhone et Android » |

## Regénérer

```bash
cd marketing/trailer
node capture.js /tmp/frames            # filme les 12 plans (Playwright + Chromium)
node audio.js /tmp/frames/audio.wav    # bande-son (musique + bruitages du jeu)
node build.js /tmp/frames /tmp/frames/audio.wav pigeon-express-trailer.mp4   # montage ffmpeg
```

Pour modifier les durées, les titres, les transitions ou les sons, édite `plan.js`. Pour changer ce qui se passe à l'écran dans un plan, édite `capture.js` (`SCRIPTS` et `SETUP`).
