/* Pigeon Express — funny writing (all ages). Pure data, no logic.
 * Letter rewards: { coins: seconds of income } | { gems: n } | { egg: type } | { boost: minutes }. */
(function (root) {
  "use strict";

  const LETTERS = [
    { from: "Gaston, escargot", text: "Bonjour ! Je voudrais envoyer un colis à ma cousine. Elle habite à trois mètres. Je suis parti il y a deux semaines.",
      choices: [{ label: "Livrer en 2 secondes", reward: { coins: 1 }, outcome: "Gaston est arrivé avant la fin de sa phrase. Il pleure de joie (très lentement)." },
                { label: "Lui prêter un skate", reward: { gems: 5 }, outcome: "Gaston est devenu champion du skatepark. Personne ne comprend comment." }] },
    { from: "Le Père Noël", text: "Mes rennes font la sieste. Vous pourriez livrer quelques cadeaux ? Pas tous. Juste… un milliard.",
      choices: [{ label: "On s'en occupe !", reward: { coins: 1.5 }, outcome: "Mission accomplie. Bob a porté le traîneau. Avec les rennes dedans." },
                { label: "Réveiller les rennes", reward: { gems: 6 }, outcome: "Les rennes sont réveillés. Ils sont de très mauvaise humeur, mais ils te remercient avec des gemmes." }] },
    { from: "Un petit fantôme", text: "Bouh ! Je veux envoyer une lettre d'amitié, mais elle passe à travers le papier…",
      choices: [{ label: "Papier spécial fantôme", reward: { coins: 1 }, outcome: "La lettre est arrivée. Elle est un peu transparente, mais très gentille." },
                { label: "Livrer un câlin à la place", reward: { gems: 5 }, outcome: "Le câlin a traversé tout le monde. Tout le monde a eu froid, mais tout le monde a souri." }] },
    { from: "Marguerite, vache", text: "Meuh. Meuh meuh ? MEUH. (Traduction : vous livrez du lait ? Je suis débordée.)",
      choices: [{ label: "Livrer le lait", reward: { coins: 1.2 }, outcome: "Livré ! Paulette a fait un milk-shake en route. Sans le vouloir." },
                { label: "Lui apprendre à voler", reward: { egg: "common" }, outcome: "Marguerite n'a pas volé. Mais elle a pondu… non, attends, c'est un œuf trouvé dans le pré !" }] },
    { from: "Robot B-0P", text: "BIP. VEUILLEZ LIVRER : UN (1) CÂLIN. FORMAT : GRAND. BIP BIP.",
      choices: [{ label: "Livrer le câlin", reward: { gems: 6 }, outcome: "CÂLIN REÇU. NIVEAU DE BONHEUR : 9000. BIP." },
                { label: "Livrer un tournevis", reward: { coins: 1 }, outcome: "B-0P a resserré ses boulons. Il dit que c'est presque pareil qu'un câlin." }] },
    { from: "Capitaine Barbe-Molle, pirate", text: "Arrr ! Livrez ce trésor à… euh… j'ai perdu la carte. Et le trésor. Et mon bateau.",
      choices: [{ label: "Chercher le trésor", reward: { coins: 2 }, outcome: "Kevin s'est trompé de chemin et l'a trouvé ! C'était sous le chapeau du capitaine." },
                { label: "Livrer une nouvelle carte", reward: { gems: 5 }, outcome: "Le capitaine a la carte. Il la tient à l'envers, mais il est content." }] },
    { from: "Madame Girafe", text: "Livraison au 5e étage, s'il vous plaît. Ne prenez pas l'escalier, je vous tends le cou.",
      choices: [{ label: "Atterrir sur le cou", reward: { coins: 1.2 }, outcome: "Atterrissage parfait. Madame Girafe dit que ça chatouille." },
                { label: "Passer par la fenêtre", reward: { gems: 5 }, outcome: "C'était la fenêtre du voisin. Il a offert des gemmes pour s'excuser d'être surpris." }] },
    { from: "Arc-en-ciel, licorne", text: "Je voudrais un colis arc-en-ciel. Le vôtre est marron. MARRON !",
      choices: [{ label: "Repeindre le colis", reward: { gems: 6 }, outcome: "Le colis brille de sept couleurs. Les pigeons ont des paillettes partout." },
                { label: "Expliquer que marron, c'est joli", reward: { coins: 1.5 }, outcome: "Arc-en-ciel a réfléchi. Elle commande maintenant une licorne marron." }] },
    { from: "Le Lapin de Pâques", text: "C'est la saison calme. Vous voulez bien garder un de mes œufs ? Il bouge un peu, c'est normal.",
      choices: [{ label: "Garder l'œuf", reward: { egg: "rare" }, outcome: "L'œuf est dans la couveuse. Il fait des petits bruits de pigeon. Bizarre." },
                { label: "Livrer des chocolats", reward: { coins: 2 }, outcome: "Les chocolats sont livrés. Il en manque deux. Bob dit que ce n'est pas lui." }] },
    { from: "Zorglub, extraterrestre", text: "Salutations, Terriens. Livrez ce message à ma planète. C'est la troisième à gauche après la Lune.",
      choices: [{ label: "Livrer dans l'espace", reward: { coins: 2.5 }, outcome: "Turbo a fait l'aller-retour avant le goûter. Zorglub est impressionné." },
                { label: "Envoyer une carte postale", reward: { gems: 6 }, outcome: "La carte dit « Bisous de la Terre ». Toute la planète l'a encadrée." }] },
    { from: "Albertine, tortue de 200 ans", text: "Bonjour jeune pigeon. Ma lettre de 1826 est-elle arrivée ? Je ne suis pas pressée.",
      choices: [{ label: "Chercher la lettre", reward: { gems: 8 }, outcome: "Trouvée derrière une armoire ! Elle disait : « Pense à acheter du pain. »" },
                { label: "Livrer une lettre neuve", reward: { coins: 1.5 }, outcome: "Albertine répondra. Prévois de passer la chercher vers 2226." }] },
    { from: "Dr Croc, dentiste", text: "Je suis le dentiste des crocodiles. Livrez-moi une brosse à dents. Une TRÈS grande.",
      choices: [{ label: "Livrer un balai", reward: { coins: 1.5 }, outcome: "Parfait. Le crocodile a les dents qui brillent. Il sourit à tout le monde. C'est un peu effrayant." },
                { label: "Livrer du dentifrice à la fraise", reward: { gems: 5 }, outcome: "Le crocodile adore. Il en a mangé la moitié." }] },
    { from: "Mme Pingouin", text: "Mon fils veut une pizza. Froide. Très froide. Vous avez un frigo volant ?",
      choices: [{ label: "Passer par un nuage de neige", reward: { coins: 1.5 }, outcome: "Pizza glacée livrée. Le petit pingouin l'a appelée « pizzaglace ». C'est un succès." },
                { label: "Livrer une glace à la place", reward: { gems: 5 }, outcome: "Il a dit « c'est une pizza ronde et froide ». Tout le monde est d'accord." }] },
    { from: "Pas le chat Moustache", text: "Je ne suis PAS un voleur de colis. Je les GARDE AU CHAUD. Nuance. Signé : quelqu'un qui n'est pas Moustache.",
      choices: [{ label: "Lui offrir un coussin", reward: { boost: 5 }, outcome: "Moustache dort sur le coussin. Les pigeons livrent deux fois plus vite pendant 5 minutes." },
                { label: "Lui écrire une réponse", reward: { gems: 6 }, outcome: "Réponse envoyée : « Cher pas-Moustache, on sait que c'est toi. » Il fait semblant de ne pas comprendre." }] },
    { from: "Rex, dinosaure (en retard)", text: "Bonjour, je sors d'une longue sieste. Il s'est passé quelque chose d'important pendant que je dormais ?",
      choices: [{ label: "Livrer un journal", reward: { coins: 2 }, outcome: "Rex a tout lu. Il ne savait pas qu'il y avait des pizzas maintenant. Il en commande 400." },
                { label: "Livrer un réveil", reward: { gems: 6 }, outcome: "Rex l'a mis à sonner dans 65 millions d'années. Au cas où." }] },
    { from: "Mlle Abeille", text: "Bzz ! J'ai une commande urgente de miel pour la reine. Elle est très royale et très pressée.",
      choices: [{ label: "Livraison express", reward: { coins: 1.5 }, outcome: "Livrée ! La reine a dit « bzz » ce qui veut dire « merci » ou « encore ». On ne sait pas." },
                { label: "Ajouter une fleur", reward: { egg: "common" }, outcome: "La reine adore. Elle t'offre un œuf trouvé dans son jardin. Pas un œuf d'abeille, promis." }] },
    { from: "Le Monstre du placard", text: "Je fais peur aux enfants la nuit, mais en vrai j'ai peur du noir. Vous livrez des veilleuses ?",
      choices: [{ label: "Livrer une veilleuse", reward: { gems: 8 }, outcome: "Le monstre dort comme un bébé. Les enfants aussi. Tout le monde est gagnant." },
                { label: "Livrer un doudou", reward: { coins: 1.5 }, outcome: "Il l'a appelé Bernard. Il ne le lâche plus." }] },
    { from: "Mme Nuage", text: "Je voudrais envoyer de la pluie à mon amie la Fleur. Pas trop. Juste un petit arrosage.",
      choices: [{ label: "Livrer un arrosoir", reward: { coins: 1.2 }, outcome: "La Fleur est ravie. Elle a grandi d'un coup et a fait un câlin au pigeon." },
                { label: "Livrer un arc-en-ciel", reward: { boost: 5 }, outcome: "Un arc-en-ciel au-dessus de la ville ! Tous les pigeons volent ×2 pendant 5 minutes." }] },
  ];

  const CAT_ARRIVE = [
    "Le chat Moustache fait la sieste sur la piste !",
    "Moustache s'est installé sur la piste. Il dit qu'elle est chaude.",
    "Moustache garde un colis « au chaud ». Chatouille-le !",
    "Un chat sauvage est apparu ! (C'est encore Moustache.)",
  ];
  const CAT_LEAVE = [
    "Moustache s'enfuit en riant. Il a laissé tomber quelque chose !",
    "Trop de chatouilles ! Moustache part bouder ailleurs.",
    "Moustache s'en va. Il dit qu'il reviendra. Il revient toujours.",
  ];
  const CAT_BORED = ["Moustache s'ennuie et part tout seul. Ouf !", "Moustache a fini sa sieste. Il s'étire et s'en va."];
  const KEVIN = [
    "Kevin a livré la pizza au zoo. Les pingouins ont laissé un gros pourboire !",
    "Kevin s'est trompé de planète. Les extraterrestres ont adoré le colis !",
    "Kevin a livré la lettre à la reine d'Angleterre. Elle a répondu avec un cadeau !",
    "Kevin a pris un raccourci par l'arc-en-ciel. Le colis est revenu doré !",
  ];
  const GERARD = ["Gérard ronfle… Touche-le pour le réveiller !", "ZZZ… Gérard rêve de graines. Réveille-le !"];
  const MILESTONE_JOKES = [
    "Le pigeonnier s'agrandit ! Les pigeons ont maintenant une salle de jeux.",
    "Nouvel étage ! Les voisins sont jaloux.",
    "Les pigeons ont reçu des casquettes neuves. Ils se trouvent très élégants.",
    "Le pigeonnier a un drapeau. Personne ne sait ce qu'il veut dire, mais il est beau.",
    "Toit doré ! On le voit depuis la Lune. Zorglub a fait coucou.",
  ];
  const OFFLINE_JOKES = [
    "Pendant ton absence, tes chefs ont livré sans toi. Ils ont même rangé le bureau.",
    "Pendant ton absence, les pigeons ont travaillé. Enfin, surtout pas Gérard.",
    "Pendant ton absence, Moustache a essayé d'entrer. Les pigeons ont fermé la fenêtre.",
  ];
  const PAUSE_TEXT = "Ça fait un moment que tu joues ! Les pigeons font une pause goûter. Et si tu en faisais une aussi ? Tes chefs continuent de livrer pendant ce temps.";

  root.CONTENT = { LETTERS, CAT_ARRIVE, CAT_LEAVE, CAT_BORED, KEVIN, GERARD, MILESTONE_JOKES, OFFLINE_JOKES, PAUSE_TEXT };
})(typeof window !== "undefined" ? window : globalThis);
