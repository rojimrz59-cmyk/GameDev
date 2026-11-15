/* Pigeon Express — story: "La Lettre d'Or". Data only; game.js runs it.
 * Scene: { id, kind: "main"|"moment", chapter, title, trigger, goal, start, nodes }
 * Node:  { who, mood, text, next } | { ..., choices: [{ text, to, if, effect }] } | { branch: [{ if, to }] } | { end: true, effect }
 * if:     { hearts: { who: n } } | { flag: "name" }       effect: { hearts: { who: n }, flag, gems, skin }
 * who:    capucine | augustin | moustache | bzzz | narr | any star pigeon id. Moods: happy, sad, surprised. */
(function (root) {
  "use strict";

  const CHARACTERS = {
    capucine: { name: "Capucine", role: "Factrice en chef, ta guide", color: "#FF5A4E", hearts: true,
      perk: "+2 % de revenus par cœur" },
    moustache: { name: "Moustache", role: "Le chat du quartier", color: "#FFA94D", hearts: true,
      perk: "À 5 cœurs : il garde la poste au lieu de bloquer les pistes" },
    bzzz: { name: "Victor Bzzz", role: "PDG de Bzzz Drones", color: "#E8A400", hearts: true,
      perk: "Partenariat : +15 % de revenus" },
    augustin: { name: "Papi Augustin", role: "Fondateur de Pigeon Express", color: "#4D6BC9", hearts: false },
    narr: { name: "", role: "", color: "#6A5A86", hearts: false },
  };
  const MAX_HEARTS = 10;

  const n = (who, text, next, mood) => ({ who, text, next, mood });

  const SCENES = [
    { id: "prologue", kind: "main", chapter: 0, title: "La poste aux volets fermés", trigger: { type: "start" },
      goal: "Engage ton premier chef de pigeonnier", start: "a", nodes: {
        a: n("narr", "Plumeville. Au bout de la rue des Tilleuls, une vieille poste dort derrière ses volets fermés depuis dix ans…", "b"),
        b: n("capucine", "Oh ! Quelqu'un ! Bonjour, bonjour ! Attends, je retire la poussière de ma casquette…", "c", "surprised"),
        c: n("capucine", "Je m'appelle Capucine. Factrice en chef de Pigeon Express ! Enfin… factrice en chef de rien du tout, pour l'instant.", "d", "happy"),
        d: n("capucine", "Mon papi Augustin a fondé cette poste. Il y a dix ans, il est parti livrer une lettre très spéciale, la Lettre d'Or… et il n'est jamais revenu.", "e", "sad"),
        e: { who: "capucine", mood: "sad", text: "Depuis, plus personne n'écrit à Plumeville. Les voisins se croisent sans se parler. C'est tout gris.", choices: [
          { text: "On rouvre la poste ensemble !", to: "f1", effect: { hearts: { capucine: 1 } } },
          { text: "Ton papi a disparu ?", to: "f2", effect: { hearts: { capucine: 1 } } }] },
        f1: n("capucine", "C'est vrai ?! Oh là là, je vais pleurer… Non ! Pas le temps ! Au travail !", "g", "happy"),
        f2: n("capucine", "Papi disait : « Une lettre, c'est un petit morceau de cœur qui voyage. » Je suis sûre qu'il est quelque part. Et en attendant… on rouvre sa poste !", "g", "happy"),
        g: n("capucine", "Il nous reste un pigeonnier et quatre pièces. C'est un début ! Suis-moi, je te montre.", "z", "happy"),
        z: { end: true } } },

    { id: "ch1", kind: "main", chapter: 1, title: "La réouverture", trigger: { type: "manager", route: "lettres" },
      goal: "Ouvre la route Cartes postales", start: "a", nodes: {
        a: n("capucine", "Un chef ! On a un VRAI chef ! Il a même une casquette ! Bon, elle est trop grande, mais quand même !", "b", "happy"),
        b: n("capucine", "En rangeant le bureau de Papi, j'ai trouvé ça, coincé dans un tiroir…", "c"),
        c: n("narr", "Un morceau de carte déchiré. On y lit, d'une écriture penchée : « Lettre d'Or — 1re étape : Plumeville. »", "d"),
        d: n("capucine", "C'est l'écriture de Papi ! S'il y a une 1re étape, il y en a d'autres ! Il nous a laissé un jeu de piste !", "e", "surprised"),
        e: n("capucine", "Pour trouver la suite, la poste doit grandir. On ouvre la route des cartes postales ?", "z", "happy"),
        z: { end: true } } },

    { id: "ch2", kind: "main", chapter: 2, title: "Plumeville se remet à écrire", trigger: { type: "level", route: "cartes", n: 1 },
      goal: "Ouvre la route Colis express", start: "a", nodes: {
        a: n("capucine", "Des cartes postales ! Regarde, les gens recommencent à écrire !", "b", "happy"),
        b: n("capucine", "Madame Girafe a écrit à son cousin. Gaston l'escargot aussi… enfin, il a commencé. Il en est à « Cher ».", "c"),
        c: { who: "capucine", text: "Quand un client t'écrit, une enveloppe sautille en haut de l'écran. Tu les liras, dis ?", choices: [
          { text: "Toutes. C'est promis.", to: "d1", effect: { hearts: { capucine: 1 } } },
          { text: "Même celles de l'escargot ?", to: "d2", effect: { hearts: { capucine: 1 } } }] },
        d1: n("capucine", "Papi disait qu'une lettre lue, c'est une lettre heureuse. Les nôtres vont être très, très heureuses !", "z", "happy"),
        d2: n("capucine", "SURTOUT celles de l'escargot ! Il met trois semaines à les écrire. C'est un honneur !", "z", "happy"),
        z: { end: true } } },

    { id: "ch3", kind: "main", chapter: 3, title: "Le chat aux colis", trigger: { type: "level", route: "colis", n: 1 },
      goal: "Fais éclore ton premier œuf", start: "a", nodes: {
        a: n("narr", "Un colis disparaît. Puis un deuxième. Derrière les cartons, quelque chose ronronne très fort.", "b"),
        b: n("moustache", "Quoi ? Je ne vole rien du tout. Je GARDE les colis au chaud. Nuance.", "c"),
        c: n("capucine", "Moustache ! Le chat du quartier ! Rends ces colis tout de suite !", "d", "surprised"),
        d: { who: "moustache", mood: "sad", text: "Tout le monde reçoit des colis. Moi, jamais. Personne n'écrit aux chats.", choices: [
          { text: "Je t'écrirai une lettre, Moustache.", to: "e1", effect: { hearts: { moustache: 2 } } },
          { text: "Les colis, c'est pour les clients !", to: "e2" }] },
        e1: n("moustache", "… Vraiment ? Hum. Je vais y réfléchir. (Il ronronne si fort que les vitres tremblent.)", "f", "surprised"),
        e2: n("moustache", "Pfff. On en reparlera. (Il part avec la queue bien droite.)", "f"),
        f: n("capucine", "Quand il fait la sieste sur une piste, chatouille-le ! Il s'en va… et il devient un peu plus gentil à chaque fois.", "z", "happy"),
        z: { end: true } } },

    { id: "ch4", kind: "main", chapter: 4, title: "L'œuf du grenier", trigger: { type: "hatched", n: 1 },
      goal: "Ouvre la route Pizzas volantes", start: "a", nodes: {
        a: n("capucine", "Attends… je connais ce pigeon ! Il était dans l'équipe de Papi !", "b", "surprised"),
        b: n("capucine", "Papi élevait des pigeons stars. Avant de partir, il a caché leurs œufs partout dans la ville, pour les protéger.", "c"),
        c: n("capucine", "Chaque œuf qu'on trouve, c'est un morceau de la vieille équipe qui rentre à la maison.", "d", "happy"),
        d: n("capucine", "Il y en a douze en tout. On va tous les retrouver. Tous !", "z", "happy"),
        z: { end: true } } },

    { id: "ch5", kind: "main", chapter: 5, title: "Bzzz Drones", trigger: { type: "level", route: "pizzas", n: 1 },
      goal: "Ouvre la route Bouquets", start: "a", nodes: {
        a: n("narr", "Un vrombissement. Une guêpe en costume se pose sur le comptoir et époussette sa cravate.", "b"),
        b: n("bzzz", "Victor Bzzz, PDG de Bzzz Drones. Mes drones livrent en 0,3 seconde. Vos pigeons ? Ils s'arrêtent pour dire bonjour.", "c"),
        c: n("capucine", "Mais c'est ça le plus important, dire bonjour !", "d", "surprised"),
        d: { who: "bzzz", text: "Je rachète votre poste. Tout de suite. Je paie en miel. Beaucoup de miel.", choices: [
          { text: "Jamais. Pigeon Express ne se vend pas.", to: "e1", effect: { hearts: { capucine: 1 } } },
          { text: "Et si on faisait plutôt une course ?", to: "e2", effect: { hearts: { bzzz: 1 } } }] },
        e1: n("bzzz", "Têtus, hein ? Alors prouvez-le. Le premier qui livre des bouquets dans toute la ville a gagné.", "f"),
        e2: n("bzzz", "Une course ? J'adore gagner. Le premier qui livre des bouquets dans toute la ville a gagné.", "f", "happy"),
        f: n("capucine", "On va lui montrer de quoi nos pigeons sont capables !", "z", "happy"),
        z: { end: true } } },

    { id: "ch6", kind: "main", chapter: 6, title: "La course des bouquets", trigger: { type: "level", route: "fleurs", n: 1 },
      goal: "Ouvre la route Bijoux précieux", start: "a", nodes: {
        a: n("narr", "Les drones de Victor arrivent les premiers… et livrent tous les bouquets à un lampadaire.", "b"),
        b: n("bzzz", "Mes capteurs ont confondu le lampadaire avec Madame Rose. Ils sont… tous les deux grands et minces.", "c", "sad"),
        c: n("capucine", "Nos pigeons, eux, connaissent tout le monde par son prénom. Et le prénom de leur chien.", "d", "happy"),
        d: { who: "bzzz", text: "Hmpf. Mes drones vont vite, mais ils ne savent pas où va le cœur des gens. C'est… intéressant.", choices: [
          { text: "Tu veux qu'on t'apprenne ?", to: "e1", effect: { hearts: { bzzz: 2 } } },
          { text: "On a gagné ! Bzzz bzzz !", to: "e2", effect: { hearts: { capucine: 1 } } }] },
        e1: n("bzzz", "M'apprendre ? À moi ? … Je note ça dans mon agenda. En gros. Et souligné.", "z", "surprised"),
        e2: n("bzzz", "Profitez-en. Je reviendrai. (Il repart en zigzag, vexé.)", "z"),
        z: { end: true } } },

    { id: "ch7", kind: "main", chapter: 7, title: "Le sceau d'or", trigger: { type: "level", route: "bijoux", n: 1 },
      goal: "Déménage vers Bourg (onglet Empire)", start: "a", nodes: {
        a: n("narr", "Le vieux bijoutier de Plumeville fait signe à Capucine et lui chuchote quelque chose.", "b"),
        b: n("capucine", "Il dit que Papi est venu ici il y a dix ans, pour faire fabriquer un sceau en or… pour fermer la Lettre d'Or !", "c", "surprised"),
        c: n("capucine", "Et ensuite, il est parti vers Bourg. C'est la 2e étape de la carte !", "d"),
        d: { who: "capucine", mood: "sad", text: "Pour le suivre, il faudra déménager la poste. Tout recommencer là-bas…", choices: [
          { text: "On y va. Ensemble.", to: "e1", effect: { hearts: { capucine: 2 } } },
          { text: "On repartira encore plus forts.", to: "e2", effect: { hearts: { capucine: 1 } } }] },
        e1: n("capucine", "Ensemble ! Et nos pigeons stars viennent avec nous !", "f", "happy"),
        e2: n("capucine", "Tu as raison ! Chaque plume d'or nous rendra plus forts.", "f", "happy"),
        f: n("capucine", "Quand tu es prêt, va dans Empire et choisis « Déménager ».", "z"),
        z: { end: true } } },

    { id: "ch8", kind: "main", chapter: 8, title: "Bourg", trigger: { type: "prestige", n: 1 },
      goal: "Déménage vers la Ville", start: "a", nodes: {
        a: n("capucine", "Bourg ! Ça sent le pain chaud et les vieilles enveloppes. J'adore.", "b", "happy"),
        b: n("narr", "Dans la vieille gare, sous une pile de journaux, un 2e morceau de carte : « 2e étape : Bourg. Continue vers la Ville. »", "c"),
        c: n("bzzz", "Psst. Capucine. J'ai… un petit problème. C'est l'anniversaire de ma maman, et mes drones ont livré sa carte sur le toit d'une usine.", "d", "sad"),
        d: { who: "bzzz", mood: "sad", text: "Trois fois. Le même toit.", choices: [
          { text: "On livre la carte pour toi !", to: "e1", effect: { hearts: { bzzz: 2 } } },
          { text: "Tes drones savent tout faire, non ?", to: "e2" }] },
        e1: n("bzzz", "Vraiment ? … Merci. (Il renifle.) C'est le pollen. Je suis allergique au pollen.", "z", "happy"),
        e2: n("capucine", "Allez, on l'aide quand même. C'est pour sa maman !", "e3", "happy"),
        e3: { who: "bzzz", text: "… Merci. Vraiment.", next: "z", effect: { hearts: { bzzz: 1 } } },
        z: { end: true } } },

    { id: "ch9", kind: "main", chapter: 9, title: "Un passager clandestin", trigger: { type: "prestige", n: 2 },
      goal: "Déménage vers la Cité", start: "a", nodes: {
        a: n("narr", "Dans la Ville, le 3e morceau de carte attendait au fond d'une boîte aux lettres géante. Et une queue rousse dépasse d'un carton de déménagement.", "b"),
        b: { branch: [{ if: { hearts: { moustache: 3 } }, to: "c1" }, { to: "c2" }] },
        c1: n("moustache", "Je ne vous ai pas suivis. J'étais dans ce carton par hasard. Pendant 200 kilomètres.", "d", "happy"),
        c2: n("moustache", "Je… je m'ennuyais tout seul à Plumeville. Voilà. C'est dit.", "d", "sad"),
        d: { who: "capucine", mood: "happy", text: "Moustache ! Tu fais partie de l'équipe maintenant !", choices: [
          { text: "Bienvenue, Moustache !", to: "e1", effect: { hearts: { moustache: 2 } } },
          { text: "Pas de colis volés, hein ?", to: "e2", effect: { hearts: { moustache: 1 } } }] },
        e1: n("moustache", "… Ronron. Je veux dire : d'accord.", "z", "happy"),
        e2: n("moustache", "Gardés au chaud. GARDÉS. Bon, d'accord.", "z"),
        z: { end: true } } },

    { id: "ch10", kind: "main", chapter: 10, title: "Bzzz & Pigeons", trigger: { type: "prestige", n: 3 },
      goal: "Déménage vers la Métropole", start: "a", nodes: {
        a: n("narr", "Dans la Cité, un 4e morceau de carte. Et Victor Bzzz, qui attend, très droit, avec un dossier sous l'aile.", "b"),
        b: n("bzzz", "J'ai réfléchi. Mes drones portent les colis lourds. Vos pigeons portent… le reste. Les mots gentils. Les câlins.", "c"),
        c: { who: "bzzz", text: "Je propose un partenariat. Bzzz & Pigeons. Ou Pigeons & Bzzz. Je suis souple.", choices: [
          { text: "Marché conclu, Victor !", to: "d1", if: { hearts: { bzzz: 3 } }, effect: { flag: "partner", hearts: { bzzz: 2 } } },
          { text: "On se connaît encore trop peu…", to: "d2", effect: { hearts: { bzzz: 1 } } }] },
        d1: n("capucine", "Les drones portent les colis lourds, nos pigeons livrent plus vite : +15 % de revenus pour toujours !", "z", "happy"),
        d2: n("bzzz", "Je comprends. J'apprendrai à mieux vous connaître. Je repasserai.", "z"),
        z: { end: true } } },

    { id: "ch11", kind: "main", chapter: 11, title: "La tempête", trigger: { type: "prestige", n: 4 },
      goal: "Déménage vers la Capitale", start: "a", nodes: {
        a: n("narr", "Dans la Métropole, une tempête énorme cloue les pigeons au sol. Le 5e et le 6e morceau de carte sont là… mais il en manque encore un.", "b"),
        b: { who: "capucine", mood: "sad", text: "Et si on ne retrouvait jamais Papi ? Et si on faisait tout ça pour rien ?", choices: [
          { text: "On le retrouvera. Je te le promets.", to: "c", effect: { hearts: { capucine: 2 } } },
          { text: "Même sans lui, on a reconstruit sa poste.", to: "c", effect: { hearts: { capucine: 2 } } }] },
        c: n("moustache", "Et puis on a un chat très doué pour retrouver les choses perdues. Surtout celles qu'il a cachées lui-même.", "d", "happy"),
        d: n("capucine", "… Vous avez raison. Papi serait fier de nous. Allez, encore une ville !", "z", "happy"),
        z: { end: true } } },

    { id: "ch12", kind: "main", chapter: 12, title: "La Lettre d'Or", trigger: { type: "prestige", n: 5 },
      goal: "Histoire terminée : continue à livrer le monde entier !", start: "a", nodes: {
        a: n("narr", "La carte est complète. Elle mène au phare de l'île Plume, au bout de la Capitale.", "b"),
        b: n("narr", "Tout en haut du phare, un vieux pigeon à moustache blanche donne des miettes aux mouettes.", "c"),
        c: n("augustin", "Capucine ? … Ma petite plume ?", "d", "surprised"),
        d: n("capucine", "PAPI !", "e", "surprised"),
        e: n("augustin", "J'attendais ici. La Lettre d'Or ne devait être ouverte que par celui ou celle qui rouvrirait Pigeon Express.", "f"),
        f: n("augustin", "Je l'ai écrite il y a dix ans. Elle t'est adressée. À toi.", "g", "happy"),
        g: n("narr", "« À toi qui as rouvert la poste : les lettres relient les cœurs. Merci d'avoir pris soin de Capucine. Pigeon Express est à toi. — Augustin »", "h"),
        h: { who: "capucine", mood: "happy", text: "Papi… tu savais que quelqu'un viendrait ?", choices: [
          { text: "C'est la plus belle lettre du monde.", to: "i", effect: { hearts: { capucine: 2 } } },
          { text: "On rentre tous ensemble ?", to: "i", effect: { hearts: { capucine: 2 } } }] },
        i: n("augustin", "Avec plaisir. J'ai raté dix ans de pizzas volantes, moi !", "j", "happy"),
        j: n("capucine", "On a encore des milliers de lettres à livrer. Partout. Pour toujours !", "z", "happy"),
        z: { end: true, effect: { flag: "ending", gems: 200, skin: "augustin" } } } },

    // ---------------------------------------------------------------- friendship moments
    { id: "m_capucine_3", kind: "moment", title: "Le tampon de Papi", trigger: { type: "hearts", who: "capucine", n: 3, after: "ch1" }, start: "a", nodes: {
        a: n("capucine", "Quand j'étais petite, Papi me laissait tamponner les enveloppes. Je tamponnais tout. Les lettres, la table, le chat du voisin…", "b", "happy"),
        b: n("capucine", "Le chat du voisin, c'était Moustache. Il ne m'a jamais pardonné.", "c", "surprised"),
        c: { who: "capucine", text: "Merci de m'aider. Avant toi, je parlais toute seule aux pigeonniers.", choices: [
          { text: "Maintenant, tu me parles à moi.", to: "z", effect: { hearts: { capucine: 1 } } },
          { text: "Les pigeonniers t'écoutaient bien ?", to: "d", effect: { hearts: { capucine: 1 } } }] },
        d: n("capucine", "Très bien ! Mais ils ne répondaient jamais. Toi, c'est mieux.", "z", "happy"),
        z: { end: true } } },

    { id: "m_capucine_6", kind: "moment", title: "La casquette de rechange", trigger: { type: "hearts", who: "capucine", n: 6, after: "ch2" }, start: "a", nodes: {
        a: n("capucine", "J'ai quelque chose pour toi. C'est ma casquette de rechange, avec l'insigne de Pigeon Express.", "b", "happy"),
        b: n("capucine", "Maintenant, tous tes pigeons peuvent la porter. On est une vraie équipe !", "z", "happy"),
        z: { end: true, effect: { skin: "capucine" } } } },

    { id: "m_moustache_5", kind: "moment", title: "Moustache, gardien de la poste", trigger: { type: "hearts", who: "moustache", n: 5, after: "ch3" }, start: "a", nodes: {
        a: n("moustache", "Bon. J'ai bien réfléchi. Pendant au moins trois siestes.", "b"),
        b: n("moustache", "Je ne dormirai plus sur vos pistes. Je les GARDERAI. Contre les mouches. Et les pigeons sauvages. Et l'aspirateur.", "c", "happy"),
        c: n("capucine", "Moustache devient Gardien de la poste ! Quand il passe, touche-le : il t'apporte un cadeau.", "z", "happy"),
        z: { end: true, effect: { flag: "guardian" } } } },

    { id: "m_moustache_8", kind: "moment", title: "La lettre pour Moustache", trigger: { type: "hearts", who: "moustache", n: 8, after: "m_moustache_5" }, start: "a", nodes: {
        a: n("narr", "Ce matin, une lettre est arrivée. Adresse : « Moustache, Gardien de la poste ». Elle vient de toi.", "b"),
        b: n("moustache", "Une lettre… pour moi ? Personne ne m'a jamais… je… j'ai une poussière dans l'œil. Dans les deux yeux.", "c", "sad"),
        c: n("moustache", "Tiens. C'est mon trésor. Je le gardais au chaud depuis des années.", "z", "happy"),
        z: { end: true, effect: { gems: 50 } } } },

    { id: "m_bzzz_5", kind: "moment", title: "Le partenariat", trigger: { type: "hearts", who: "bzzz", n: 5, after: "ch6", notFlag: "partner" }, start: "a", nodes: {
        a: n("bzzz", "Ma maman a reçu sa carte. Elle l'a accrochée sur son frigo. Elle n'avait jamais rien accroché de moi sur son frigo.", "b", "happy"),
        b: n("bzzz", "Bzzz Drones et Pigeon Express, ensemble. Mes drones portent les colis lourds, vos pigeons portent le cœur. Marché conclu ?", "c"),
        c: n("capucine", "Marché conclu ! Revenus +15 % pour toujours !", "z", "happy"),
        z: { end: true, effect: { flag: "partner" } } } },
  ];

  root.STORY = { CHARACTERS, SCENES, MAX_HEARTS };
})(typeof window !== "undefined" ? window : globalThis);
