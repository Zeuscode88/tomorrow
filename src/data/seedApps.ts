import { AppIdea } from '../types/app';

export const SEED_APPS: AppIdea[] = [
  // --- 4 NOUVEAUTÉS DU JOUR EN AFRIQUE (AI DAILY DROP) ---
  {
    id: 'daily-2026-09-26-1',
    title: 'SunuRécolte',
    tagline: 'Bourse maraîchère vocale et logistique partagée pour le Sahel',
    description:
      'Une plateforme mobile audio-first (Wolof, Sérère, Français) permettant aux petits producteurs maraîchers des Niayes et du bassin arachidier de connaître les prix en temps réel sur les marchés urbains et de mutualiser les camionnettes de transport pour éliminer les pertes post-récolte.',
    icon: 'Wheat',
    gradient: 'bg-black',
    continent: 'Afrique',
    country: 'Sénégal',
    countryCode: 'SN',
    flag: 'SN',
    sector: 'Agriculture & Alimentation',
    targetAudience: 'Producteurs maraîchers ruraux, coopératives agricoles et transporteurs indépendants',
    problemSolved: 'Près de 35% des récoltes pourrissent faute d\'accès aux prix réels et de transports frigorifiques groupés abordables.',
    impactPotential: 'Augmentation de 40% des revenus des exploitants et réduction massive du gaspillage alimentaire.',
    techStackSuggested: ['React Native / Expo', 'Node.js / Express', 'Whisper / Gemini Voice API', 'Twilio WhatsApp API', 'PostgreSQL / PostGIS'],
    difficulty: 'Accessible',
    status: 'Idée IA du Jour',
    votes: 0,
    isDailyDrop: true,
    dailyDropDate: '2026-09-26',
    createdAt: '2026-09-26T06:00:00Z',
    devPledges: [],
    comments: [],
    developerBrief: {
      mvpScope: [
        'Module de consultation des prix par message vocal WhatsApp interactif',
        'Carte interactive des groupages de transport avec calcul d\'itinéraire',
        'Système d\'alerte SMS pour les invendus urgents à brader',
        'Authentification simple par numéro de téléphone (OTP)'
      ],
      localConstraints: [
        'Doit fonctionner avec une connexion 2G/3G instable (offline-first)',
        'Interface utilisable sans savoir lire ni écrire (guidage vocal intégral)',
        'Support des paiements mobiles Orange Money & Wave'
      ],
      monetization: 'Commission minime de 1% sur le fret partagé rentabilisé ou abonnement coopérative subventionné',
      openSourceFriendly: true,
      architecturalTip: 'Utiliser SQLite / WatermelonDB côté client pour synchroniser en tâche de fond dès qu\'un réseau GSM est capté.'
    }
  },
  {
    id: 'daily-2026-09-26-2',
    title: 'KivuCare Direct',
    tagline: 'Coordination maternelle hors-ligne et alerte sang rare par SMS/USSD',
    description:
      'Dans les zones rurales et périurbaines d\'Afrique centrale, KivuCare relie les maternités de proximité, les sages-femmes communautaires et les banques de sang régionales grâce à un protocole SMS/USSD ultra-léger pour réduire les urgences obstétricales.',
    icon: 'HeartHandshake',
    gradient: 'bg-black',
    continent: 'Afrique',
    country: 'RDC',
    countryCode: 'CD',
    flag: 'CD',
    sector: 'Santé & Urgence',
    targetAudience: 'Sages-femmes rurales, centres de santé de quartier et donneurs de sang volontaires',
    problemSolved: 'Retards critiques de prise en charge obstétricale et pénuries non anticipées de poches de sang compatibles.',
    impactPotential: 'Réduction de 65% du délai de mobilisation des poches sanguines et suivi continu de 120 000 grossesses à risque.',
    techStackSuggested: ['PWA Offline-First', 'Passerelle USSD / SMS', 'Node.js', 'PostgreSQL', 'SQLite'],
    difficulty: 'Modéré',
    status: 'Idée IA du Jour',
    votes: 0,
    isDailyDrop: true,
    dailyDropDate: '2026-09-26',
    createdAt: '2026-09-26T06:00:00Z',
    devPledges: [],
    comments: [],
    developerBrief: {
      mvpScope: [
        'Déclenchement d\'alerte sang rare en 3 touches USSD sans internet',
        'Carnet de suivi prénatal synchronisé en local pour les agents communautaires',
        'Tableau de disponibilité des ambulances et mototaxis médicalisés'
      ],
      localConstraints: [
        'Fonctionnement garanti sans smartphone ni 4G via SMS/USSD',
        'Langues locales (Lingala, Swahili, Français)',
        'Chiffrement strict des données médicales patient'
      ],
      monetization: 'Partenariat avec les ministères provinciaux de la santé et ONG médicales',
      openSourceFriendly: true,
      architecturalTip: 'Concevoir un moteur d\'état USSD stateless avec file d\'attente SMS multi-opérateurs.'
    }
  },
  {
    id: 'daily-2026-09-26-3',
    title: 'AtlasEau Oasis',
    tagline: 'Gestion participative de l\'irrigation et alerte stress hydrique',
    description:
      'Conçue pour les coopératives oasiennes et petits agriculteurs d\'Afrique du Nord, AtlasEau coordonne les tours d\'eau traditionnels (khettaras), détecte les fuites sur les canaux et ajuste l\'irrigation goutte-à-goutte selon l\'évapotranspiration locale.',
    icon: 'Droplets',
    gradient: 'bg-black',
    continent: 'Afrique',
    country: 'Maroc',
    countryCode: 'MA',
    flag: 'MA',
    sector: 'Énergie, Eau & Climat',
    targetAudience: 'Associations d\'usagers d\'eau agricole, oasiens et techniciens hydrauliques',
    problemSolved: 'Perte de 40% de l\'eau d\'irrigation par évaporation ou fuites non signalées et conflits de répartition.',
    impactPotential: 'Économie de 35% d\'eau agricole par saison tout en préservant les palmeraies familiales.',
    techStackSuggested: ['React / Vite PWA', 'LoRaWAN', 'ESP32 Solaires', 'Node.js', 'Leaflet'],
    difficulty: 'Modéré',
    status: 'Idée IA du Jour',
    votes: 0,
    isDailyDrop: true,
    dailyDropDate: '2026-09-26',
    createdAt: '2026-09-26T06:00:00Z',
    devPledges: [],
    comments: [],
    developerBrief: {
      mvpScope: [
        'Calendrier transparent des tours d\'eau par parcelle et famille',
        'Alertes automatiques de baisse de pression ou fuite sur conduite principale',
        'Recommandation hebdomadaire d\'arrosage en Arabe dialectal et Amazighe (audio)'
      ],
      localConstraints: [
        'Capteurs autonomes alimentés par petit panneau solaire sous fortes chaleurs',
        'Interface vocale Arabe / Amazighe pour les anciens agriculteurs'
      ],
      monetization: 'Subventions agricoles nationales et cotisation annuelle symbolique par coopérative',
      openSourceFriendly: true,
      architecturalTip: 'Utiliser des capteurs ultrasoniques basse consommation reliés par passerelle LoRa solaire.'
    }
  },
  {
    id: 'daily-2026-09-26-4',
    title: 'YéLé Fret Rural',
    tagline: 'Coordination de tricycles et camionnettes pour désenclaver les pistes',
    description:
      'Plateforme vocale de mise en relation entre planteurs de cacao, vivriers et conducteurs de tricycles motorisés ou bâchées pour évacuer les récoltes des campements isolés avant la dégradation des pistes pendant la saison des pluies.',
    icon: 'Compass',
    gradient: 'bg-black',
    continent: 'Afrique',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    flag: 'CI',
    sector: 'Mobilité & Logistique',
    targetAudience: 'Planteurs ruraux, coopératives villageoises et conducteurs de tricycles/camionnettes',
    problemSolved: 'Enclavement des campements ruraux obligeant les producteurs à brader leurs vivres sur place.',
    impactPotential: 'Réduction de 45% du coût du transport rural et hausse directe des revenus paysans.',
    techStackSuggested: ['Flutter', 'Node.js', 'Wave / Orange Money API', 'OpenStreetMap Offline'],
    difficulty: 'Accessible',
    status: 'Idée IA du Jour',
    votes: 0,
    isDailyDrop: true,
    dailyDropDate: '2026-09-26',
    createdAt: '2026-09-26T06:00:00Z',
    devPledges: [],
    comments: [],
    developerBrief: {
      mvpScope: [
        'Réservation de chargement par note vocale ou code USSD',
        'Suivi communautaire de l\'état des pistes (boue, pont endommagé)',
        'Paiement sécurisé à la livraison via Mobile Money'
      ],
      localConstraints: [
        'Cartographie des pistes non répertoriées en mode hors-ligne',
        'Support des notes vocales en Dioula, Baoulé, Bété et Français'
      ],
      monetization: 'Frais de service de 2% sur les trajets validés',
      openSourceFriendly: true,
      architecturalTip: 'Intégrer des tuiles vectorielles légères OpenStreetMap compressées par région.'
    }
  },

  // --- CATALOGUE AFRICAIN DES BESOINS LOCAUX ---
  {
    id: 'app-idea-5',
    title: 'MedTrace Africa',
    tagline: 'Vérification instantanée de faux médicaments par vision ultra-légère',
    description:
      'Application d\'inspection de blisters et de boîtes de médicaments par micro-détails d\'impression holographiques et codes-barres chiffrés, connectée au registre sanitaire de l\'OMS et des ministères de la santé africains.',
    icon: 'ShieldCheck',
    gradient: 'bg-black',
    continent: 'Afrique',
    country: 'Nigeria',
    countryCode: 'NG',
    flag: 'NG',
    sector: 'Santé & Urgence',
    targetAudience: 'Patients, pharmaciens de quartier et distributeurs de médicaments',
    problemSolved: 'Jusqu\'à 40% des antibiotiques et antipaludiques en circulation en Afrique de l\'Ouest sont sous-dosés ou contrefaits.',
    impactPotential: 'Sauvegarde estimée de plus de 100 000 vies par an victimes de traitements falsifiés.',
    techStackSuggested: ['React Native', 'On-device Computer Vision', 'FastAPI', 'Redis', 'PostgreSQL'],
    difficulty: 'Modéré',
    status: 'Recherche Développeurs',
    votes: 0,
    createdAt: '2026-09-24T10:00:00Z',
    devPledges: [],
    comments: [],
    developerBrief: {
      mvpScope: [
        'Scanner de code-barre et matrice datamatrix avec validation cryptographique',
        'Vérification optique des polices et logos de fabricants agréés',
        'Signalement anonyme géolocalisé des lots suspects',
        'Annuaire des pharmacies certifiées à proximité'
      ],
      localConstraints: [
        'Doit fonctionner même avec des caméras d\'entrée de gamme (5 mégapixels floues)',
        'Base de données locale des numéros de lots d\'urgence mise à jour en P2P'
      ],
      monetization: 'Subventionné par les laboratoires pharmaceutiques légitimes et les gouvernements',
      openSourceFriendly: true,
      architecturalTip: 'Combiner un modèle de vision par ordinateur quantifié INT8 avec un hachage visuel perceptuel (pHash).'
    }
  },
  {
    id: 'app-idea-6',
    title: 'SimbaGrid',
    tagline: 'Marché P2P d\'électricité solaire rurale via Mobile Money',
    description:
      'Système permettant aux foyers ruraux dotés de panneaux solaires avec batteries pleines de revendre leurs surplus d\'ampères aux voisins, écoles et moulins du village via micropaiements M-Pesa.',
    icon: 'Zap',
    gradient: 'bg-black',
    continent: 'Afrique',
    country: 'Kenya',
    countryCode: 'KE',
    flag: 'KE',
    sector: 'Énergie, Eau & Climat',
    targetAudience: 'Foyers hors-réseau (off-grid), artisans et petites échoppes villageoises',
    problemSolved: 'Gaspillage de l\'énergie solaire produite en journée pendant que les ateliers voisins manquent d\'électricité pour leurs outils.',
    impactPotential: 'Rentabilisation des installations solaires et électrification productive des villages.',
    techStackSuggested: ['ESP32 Firmware (C++)', 'Flutter', 'Elixir / Phoenix Channels', 'M-Pesa Daraja API'],
    difficulty: 'Avancé',
    status: 'Recherche Développeurs',
    votes: 0,
    createdAt: '2026-09-23T11:00:00Z',
    devPledges: [],
    comments: [],
    developerBrief: {
      mvpScope: [
        'Protocole d\'ouverture de vanne électrique par relais commandé',
        'Application mobile de crédit énergétique prépayé',
        'Tableau de bord de production et état des batteries',
        'Passerelle SMS pour les téléphones basiques'
      ],
      localConstraints: ['Composants de comptage abordables (<10$)', 'Fiabilité face aux surtensions et poussières'],
      monetization: '2% sur les transactions de transfert d\'énergie',
      openSourceFriendly: true,
      architecturalTip: 'Utiliser MQTT over TLS pour la télémesure et le protocole de communication avec les compteurs connectés.'
    }
  },
  {
    id: 'app-idea-7',
    title: 'LinguaSahel',
    tagline: 'Alphabétisation audio-first en langues nationales sahéliennes hors-ligne',
    description:
      'Application éducative hors-ligne permettant aux jeunes déscolarisés et adultes ruraux d\'apprendre à lire, compter et gérer une micro-comptabilité commerciale en Bambara, Peul, Soninké et Français grâce à des contes audio interactifs.',
    icon: 'BookOpen',
    gradient: 'bg-black',
    continent: 'Afrique',
    country: 'Mali',
    countryCode: 'ML',
    flag: 'ML',
    sector: 'Éducation & Langues',
    targetAudience: 'Écoles communautaires, associations de femmes rurales et jeunes apprentis',
    problemSolved: 'Exclusion numérique et bancaire des commerçants et producteurs ne maîtrisant pas l\'écrit administratif.',
    impactPotential: 'Autonomisation pratique en calcul et lecture fonctionnelle pour plus de 500 000 apprenants.',
    techStackSuggested: ['React / Capacitor', 'IndexedDB', 'Web Audio API', 'Opus Audio Codec'],
    difficulty: 'Accessible',
    status: 'Recherche Développeurs',
    votes: 0,
    createdAt: '2026-09-22T08:30:00Z',
    devPledges: [],
    comments: [],
    developerBrief: {
      mvpScope: [
        'Modules vocaux progressifs de calcul marchand et lecture d\'ordonnances',
        'Synchronisation complète sans connexion internet en classe de village',
        'Partage de paquets de cours via Bluetooth / Wi-Fi Direct entre téléphones'
      ],
      localConstraints: [
        'Tablettes et smartphones Android à faible mémoire (1 Go RAM)',
        'Audio ultra-compressé pour tenir sur moins de 150 Mo'
      ],
      monetization: 'Licences institutionnelles ONG et programmes nationaux d\'alphabétisation',
      openSourceFriendly: true,
      architecturalTip: 'Compresser toutes les séquences vocales en Opus 12 kbps et pré-cacher les exercices en IndexedDB.'
    }
  },
  {
    id: 'app-idea-8',
    title: 'ZébuTrace',
    tagline: 'Identité numérique bovine et alerte communautaire contre le vol de bétail',
    description:
      'Système d\'enregistrement biométrique (empreinte du mufle par photo ou boucle RFID) et d\'alerte villageoise instantanée par SMS pour sécuriser les troupeaux contre les vols de bétail (dahalo) et certifier la santé vétérinaire lors des foires.',
    icon: 'Radio',
    gradient: 'bg-black',
    continent: 'Afrique',
    country: 'Madagascar',
    countryCode: 'MG',
    flag: 'MG',
    sector: 'Agriculture & Alimentation',
    targetAudience: 'Éleveurs ruraux, comités de sécurité villageois (fokonolona) et vétérinaires',
    problemSolved: 'Les vols organisés de zébus ruinent des familles entières et paralysent le travail agricole dans les zones rurales.',
    impactPotential: 'Traçabilité de 300 000 têtes de bétail et blocage rapide de la revente sur les marchés illégaux.',
    techStackSuggested: ['Kotlin / Flutter', 'Passerelle SMS / USSD', 'Edge Vision TFLite', 'PostgreSQL'],
    difficulty: 'Modéré',
    status: 'Recherche Développeurs',
    votes: 0,
    createdAt: '2026-09-21T09:00:00Z',
    devPledges: [],
    comments: [],
    developerBrief: {
      mvpScope: [
        'Fiche d\'identité animale associée au numéro de téléphone du propriétaire',
        'Alerte SMS géolocalisée diffusée aux marchés aux bestiaux dans un rayon de 80 km',
        'Certificat de vaccination vérifiable par code court lors de la vente'
      ],
      localConstraints: [
        'Zones rurales isolées sans 4G (bascule SMS automatique)',
        'Interface en Malgache facile à prendre en main sur téléphone basique'
      ],
      monetization: 'Micro-forfait annuel par tête enregistrée financé avec les communes rurales',
      openSourceFriendly: true,
      architecturalTip: 'Coupler la reconnaissance visuelle du mufle hors-ligne à un code court alphanumérique transmissible par SMS.'
    }
  },
  {
    id: 'app-idea-9',
    title: 'KenteDirect',
    tagline: 'Vitrine authentifiée et paiement équitable pour artisans africains',
    description:
      'Plateforme permettant aux coopératives de tisserands, potiers et sculpteurs d\'Afrique de l\'Ouest de certifier l\'origine authentique de leurs pièces par QR code et de vendre sans intermédiaires spoliateurs avec paiement Mobile Money instantané.',
    icon: 'Briefcase',
    gradient: 'bg-black',
    continent: 'Afrique',
    country: 'Ghana',
    countryCode: 'GH',
    flag: 'GH',
    sector: 'Artisanat, Commerce & Tourisme',
    targetAudience: 'Coopératives d\'artisans, tisserands Kente, acheteurs locaux et diaspora',
    problemSolved: 'Les artisans ne perçoivent souvent que 15% du prix final de leurs créations face aux copies industrielles et intermédiaires.',
    impactPotential: 'Triplement de la marge nette des ateliers familiaux et préservation des savoir-faire.',
    techStackSuggested: ['Next.js', 'Mobile Money APIs (MTN MoMo)', 'PostgreSQL', 'QR Cryptographique'],
    difficulty: 'Accessible',
    status: 'Recherche Développeurs',
    votes: 0,
    createdAt: '2026-09-20T14:00:00Z',
    devPledges: [],
    comments: [],
    developerBrief: {
      mvpScope: [
        'Catalogue photo optimisé bas débit créé en 2 minutes depuis WhatsApp ou mobile',
        'Certificat numérique d\'authenticité lié à l\'atelier d\'origine',
        'Séquestre Mobile Money libéré à l\'expédition du colis'
      ],
      localConstraints: ['Forte compression d\'images (WebP)', 'Support multi-devises Mobile Money Cedi / FCFA'],
      monetization: 'Commission transparente de 3% sur les ventes réalisées',
      openSourceFriendly: true,
      architecturalTip: 'Permettre l\'ajout de produits directement par bot WhatsApp pour éviter toute barrière technique.'
    }
  },
  {
    id: 'app-idea-10',
    title: 'FoncierClair',
    tagline: 'Vérification citoyenne des parcelles et prévention des litiges fonciers',
    description:
      'Outil de consultation simplifiée des limites cadastrales et d\'enregistrement d\'accords fonciers communautaires signés par témoins afin de protéger les petits propriétaires et agricultrices contre les doubles ventes de terrains.',
    icon: 'ShieldCheck',
    gradient: 'bg-black',
    continent: 'Afrique',
    country: 'Rwanda',
    countryCode: 'RW',
    flag: 'RW',
    sector: 'Citoyenneté & Droits',
    targetAudience: 'Ménages ruraux, acquéreurs de parcelles, chefs de village et médiateurs fonciers',
    problemSolved: 'Les doubles ventes de terrains et litiges de bornage paralysent l\'investissement familial et l\'accès au crédit.',
    impactPotential: 'Sécurisation juridique de dizaines de milliers de parcelles familiales.',
    techStackSuggested: ['React PWA', 'PostGIS', 'Cryptographic Hash Signatures', 'SMS OTP'],
    difficulty: 'Modéré',
    status: 'Recherche Développeurs',
    votes: 0,
    createdAt: '2026-09-19T10:00:00Z',
    devPledges: [],
    comments: [],
    developerBrief: {
      mvpScope: [
        'Relevé GPS des bornes d\'une parcelle avec horodatage et signatures de témoins voisins',
        'Vérification rapide par USSD/Web si un terrain fait déjà l\'objet d\'un litige ou hypothèque',
        'Archivage horodaté infalsifiable des reçus de vente'
      ],
      localConstraints: ['Précision GPS adaptée aux smartphones courants', 'Explications juridiques en Kinyarwanda / Anglais / Français'],
      monetization: 'Frais modiques d\'attestation ou intégration avec les guichets fonciers communaux',
      openSourceFriendly: true,
      architecturalTip: 'Stocker une empreinte SHA-256 des documents et coordonnées polygonales pour garantir la non-répudiation.'
    }
  },
  {
    id: 'app-idea-12',
    title: 'TontineTrust',
    tagline: 'Digitalisation transparente des tontines traditionnelles rotatives',
    description:
      'Plateforme sécurisée respectant à 100% les coutumes de tontines d\'Afrique centrale et de l\'Ouest, avec tirage au sort vérifiable, calendrier des levées de fonds et micro-garanties communautaires sans intermédiaire bancaire usuraire.',
    icon: 'Coins',
    gradient: 'bg-black',
    continent: 'Afrique',
    country: 'Cameroun',
    countryCode: 'CM',
    flag: 'CM',
    sector: 'Inclusion Financière & Tontines',
    targetAudience: 'Commerçantes de marché, cercles familiaux, associations d\'épargne villageoise',
    problemSolved: 'Vols physiques des cagnottes tenues en espèces et conflits lors des litiges sur l\'ordre des bénéficiaires.',
    impactPotential: 'Sécurisation de 40 milliards de FCFA d\'épargne informelle pour les femmes entrepreneures.',
    techStackSuggested: ['Flutter', 'Node.js', 'PostgreSQL', 'MTN Mobile Money / Orange Money APIs'],
    difficulty: 'Modéré',
    status: 'Recherche Développeurs',
    votes: 0,
    createdAt: '2026-09-17T12:00:00Z',
    devPledges: [],
    comments: [],
    developerBrief: {
      mvpScope: [
        'Création d\'un cercle d\'épargne avec règles personnalisées (montant, périodicité)',
        'Gestion des versements automatiques par portefeuille mobile',
        'Registre public infalsifiable des cotisations visible par tous les membres',
        'Rappels conviviaux par messages vocaux WhatsApp'
      ],
      localConstraints: ['Confiance culturelle primordiale : les règles ne doivent pas imposer un modèle bancaire occidental', 'Fonctionne sur téléphones peu puissants'],
      monetization: 'Frais forfaitaires de 0.5% sur la cagnotte versée au bénéficiaire du tour',
      openSourceFriendly: true,
      architecturalTip: 'Utiliser un log immuable avec signatures cryptographiques des membres pour garantir qu\'aucun administrateur ne peut falsifier les comptes.'
    }
  }
];

export const CONTINENTS = ['Afrique'] as const;

export const SECTORS = [
  'Tous',
  'Agriculture & Alimentation',
  'Santé & Urgence',
  'Éducation & Langues',
  'Inclusion Financière & Tontines',
  'Énergie, Eau & Climat',
  'Mobilité & Logistique',
  'Artisanat, Commerce & Tourisme',
  'Citoyenneté & Droits'
] as const;
