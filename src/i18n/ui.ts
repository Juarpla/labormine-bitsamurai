export const languages = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
} as const;

export type Locale = keyof typeof languages;
export const defaultLocale: Locale = 'es'; // español es el idioma principal: vive en la raíz
export const locales: Locale[] = ['es', 'en', 'pt'];

const en = {
  'nav.home': 'Home',
  'nav.jobs': 'Jobs',
  'nav.pathways': 'Visa pathways',
  'nav.about': 'About',
  'nav.contact': 'Contact',
  'nav.language': 'Language',

  'hero.kicker': 'Global mining jobs, mapped to your passport',
  'hero.title': 'Find mining work anywhere on Earth — starting with where you can legally work.',
  'hero.subtitle':
    'Labormine scans real listings from mining employers worldwide and matches them to your nationality: jobs in your country, jobs with visa support, and remote roles.',
  'hero.cta': 'Explore jobs',
  'hero.secondary': 'See visa pathways',
  'hero.nationality': 'Your passport',
  'hero.country': 'Where you want to work',
  'hero.detecting': 'Detecting your location…',
  'hero.choose': 'Choose…',

  'chapter.inCountry.kicker': 'Chapter 01',
  'chapter.inCountry.title': 'Mining jobs in your country',
  'chapter.inCountry.lead':
    'Opportunities close to home, ranked first because no visa is required.',
  'chapter.passport.kicker': 'Chapter 02',
  'chapter.passport.title': 'Your passport opens doors',
  'chapter.passport.lead':
    'Work & holiday visas, youth mobility, student routes and sponsorship — official pathways that let you take a mining job abroad.',
  'chapter.passport.cta': 'See all pathways for your nationality',
  'chapter.spotlight.kicker': 'Regional spotlight',
  'chapter.remote.kicker': 'Chapter 03',
  'chapter.remote.title': 'Remote, worldwide',
  'chapter.remote.lead':
    'Corporate, tech and engineering roles you can do from anywhere — including your home country.',
  'chapter.cta.title': 'Ready to dig in?',
  'chapter.cta.body': 'Filter every listing by country, role, visa support and work style.',
  'chapter.cta.button': 'Browse all jobs',

  'card.visa': 'Visa support reported',
  'job.autoTranslated': 'Auto-translated title',
  'card.remote': 'Remote',
  'card.details': 'Details',
  'card.posted': 'Posted',
  'card.global': 'Global',

  'jobs.title': 'All mining jobs',
  'jobs.lead': 'Real listings from public employer boards and job APIs. Every offer links back to the original source.',
  'jobs.filter.country': 'Country',
  'jobs.filter.category': 'Category',
  'jobs.filter.type': 'Work type',
  'jobs.filter.visa': 'Visa support only',
  'jobs.filter.search': 'Search role, company…',
  'jobs.filter.all': 'All',
  'jobs.type.onsite': 'On-site',
  'jobs.type.remote': 'Remote',
  'jobs.empty': 'No jobs match your filters.',
  'jobs.clear': 'Clear filters',
  'jobs.count': '{n} jobs',
  'jobs.found': 'Found',

  'pathways.title': 'Visa pathways',
  'pathways.lead':
    'Official work-visa routes for mining jobs, mapped to your nationality. Sourced from government immigration pages — always verify before applying.',
  'pathways.select': 'Your nationality',
  'pathways.choose': 'Choose your nationality…',
  'pathways.age': 'Age',
  'pathways.duration': 'Duration',
  'pathways.rights': 'Work rights',
  'pathways.official': 'Official source',
  'pathways.verified': 'Verified {date}',
  'pathways.any': 'Open to all nationalities',
  'pathways.none':
    'No curated pathways for this nationality yet — the sponsorship and student routes below are still open to you.',
  'pathways.forYou': 'Pathways for {nationality}',
  'pathway.working-holiday': 'Working holiday',
  'pathway.temporary': 'Temporary work',
  'pathway.student': 'Student route',
  'pathway.sponsorship': 'Employer sponsorship',
  'pathway.skilled': 'Skilled visa',
  'pathways.badge': 'Eligible via {name}',
  'pathways.notes': 'Notes',

  'ads.label': 'Ad',

  'drawer.quick': 'Quick view',
  'drawer.full': 'Full details',
  'drawer.apply': 'Apply at source',
  'drawer.close': 'Close',
  'drawer.visaNote': '“Visa support” is a heuristic signal from the listing text — always verify with the employer.',

  'footer.tagline': 'Mining jobs worldwide, matched to your nationality.',
  'footer.privacy': 'Privacy policy',
  'footer.about': 'About Labormine',
  'footer.contact': 'Contact',
  'footer.disclaimer':
    'Listings are aggregated from public employer boards and APIs and always link back to the original source.',
  'footer.adsDisclosure': 'Labormine is supported by advertising. Ads are always labeled.',
  'footer.rights': '© {year} Bit SamurAI — Labormine. All rights reserved.',
  'footer.ownership': 'A Bit SamurAI product.',

  'about.title': 'About Labormine',
  'about.body':
    'Labormine is a job hub for the global mining industry. We index public job boards from mining employers and match them to where you can legally work: your home country, countries whose youth-mobility visas accept your passport, employers that report visa sponsorship, and remote roles.',
  'about.realJobs': 'Every listing is real. We never generate or fabricate job offers; each one links back to the employer’s original posting.',
  'privacy.title': 'Privacy policy',
  'privacy.body':
    'Labormine stores your language and country preference in your browser (localStorage) to personalize listings. We use IP-based country detection (city-level data is never requested or stored). Advertising partners such as Google AdSense may use cookies to serve personalized ads; you can opt out through Google Ads Settings.',
  'contact.title': 'Contact',
  'contact.body': 'Questions, corrections, or an employer board we should index? Write to',
  'notfound.title': '404 — Lost in the pit',
  'notfound.body': 'The page you are looking for does not exist.',
  'notfound.cta': 'Back to home',

  'common.viewAll': 'View all',
  'common.back': 'Back to jobs',
  'common.related': 'Similar jobs',
  'common.loading': 'Loading…',
  'common.selectPrompt': 'Select to see your matches',
};

export type Dictionary = typeof en;

const es: Dictionary = {
  'nav.home': 'Inicio',
  'nav.jobs': 'Empleos',
  'nav.pathways': 'Rutas de visa',
  'nav.about': 'Acerca de',
  'nav.contact': 'Contacto',
  'nav.language': 'Idioma',

  'hero.kicker': 'Empleos mineros globales, según tu pasaporte',
  'hero.title': 'Encuentra trabajo en minería en cualquier parte del mundo — empezando por donde puedes trabajar legalmente.',
  'hero.subtitle':
    'Labormine rastrea ofertas reales de empleadores mineros de todo el mundo y las empareja con tu nacionalidad: empleos en tu país, empleos con apoyo de visa y roles remotos.',
  'hero.cta': 'Explorar empleos',
  'hero.secondary': 'Ver rutas de visa',
  'hero.nationality': 'Tu pasaporte',
  'hero.country': 'Dónde quieres trabajar',
  'hero.detecting': 'Detectando tu ubicación…',
  'hero.choose': 'Elegir…',

  'chapter.inCountry.kicker': 'Capítulo 01',
  'chapter.inCountry.title': 'Empleos mineros en tu país',
  'chapter.inCountry.lead':
    'Oportunidades cerca de casa, primero porque no requieren visa.',
  'chapter.passport.kicker': 'Capítulo 02',
  'chapter.passport.title': 'Tu pasaporte abre puertas',
  'chapter.passport.lead':
    'Visas working holiday, movilidad juvenil, rutas estudiantiles y patrocinio — rutas oficiales para trabajar en minería en el extranjero.',
  'chapter.passport.cta': 'Ver todas las rutas para tu nacionalidad',
  'chapter.spotlight.kicker': 'Foco regional',
  'chapter.remote.kicker': 'Capítulo 03',
  'chapter.remote.title': 'Remoto, en todo el mundo',
  'chapter.remote.lead':
    'Roles corporativos, técnicos y de ingeniería que puedes hacer desde cualquier lugar — incluido tu país.',
  'chapter.cta.title': '¿Listo para excavar?',
  'chapter.cta.body': 'Filtra cada oferta por país, rol, apoyo de visa y modalidad.',
  'chapter.cta.button': 'Ver todos los empleos',

  'card.visa': 'Apoyo de visa reportado',
  'job.autoTranslated': 'Título auto-traducido',
  'card.remote': 'Remoto',
  'card.details': 'Detalles',
  'card.posted': 'Publicado',
  'card.global': 'Global',

  'jobs.title': 'Todos los empleos mineros',
  'jobs.lead': 'Ofertas reales de bolsas públicas de empleadores y APIs de empleo. Cada oferta enlaza a la fuente original.',
  'jobs.filter.country': 'País',
  'jobs.filter.category': 'Categoría',
  'jobs.filter.type': 'Modalidad',
  'jobs.filter.visa': 'Solo con apoyo de visa',
  'jobs.filter.search': 'Buscar rol, empresa…',
  'jobs.filter.all': 'Todas',
  'jobs.type.onsite': 'Presencial',
  'jobs.type.remote': 'Remoto',
  'jobs.empty': 'Ningún empleo coincide con tus filtros.',
  'jobs.clear': 'Limpiar filtros',
  'jobs.count': '{n} empleos',
  'jobs.found': 'Encontrados',

  'pathways.title': 'Rutas de visa',
  'pathways.lead':
    'Rutas oficiales de visa de trabajo para minería, según tu nacionalidad. Fuente: páginas oficiales de inmigración — verifica siempre antes de aplicar.',
  'pathways.select': 'Tu nacionalidad',
  'pathways.choose': 'Elige tu nacionalidad…',
  'pathways.age': 'Edad',
  'pathways.duration': 'Duración',
  'pathways.rights': 'Derechos laborales',
  'pathways.official': 'Fuente oficial',
  'pathways.verified': 'Verificado {date}',
  'pathways.any': 'Abierto a todas las nacionalidades',
  'pathways.none':
    'Aún no hay rutas curadas para esta nacionalidad — las rutas de patrocinio y estudiantiles de abajo también te aplican.',
  'pathways.forYou': 'Rutas para {nationality}',
  'pathway.working-holiday': 'Working holiday',
  'pathway.temporary': 'Trabajo temporal',
  'pathway.student': 'Ruta estudiantil',
  'pathway.sponsorship': 'Patrocinio de empleador',
  'pathway.skilled': 'Visa calificada',
  'pathways.badge': 'Elegible vía {name}',
  'pathways.notes': 'Notas',

  'ads.label': 'Anuncio',

  'drawer.quick': 'Vista rápida',
  'drawer.full': 'Detalles completos',
  'drawer.apply': 'Postular en la fuente',
  'drawer.close': 'Cerrar',
  'drawer.visaNote': '“Apoyo de visa” es una señal heurística del texto de la oferta — verifica siempre con el empleador.',

  'footer.tagline': 'Empleos mineros mundiales, según tu nacionalidad.',
  'footer.privacy': 'Política de privacidad',
  'footer.about': 'Acerca de Labormine',
  'footer.contact': 'Contacto',
  'footer.disclaimer':
    'Las ofertas se agregan de bolsas públicas de empleadores y APIs, y siempre enlazan a la fuente original.',
  'footer.adsDisclosure': 'Labormine se financia con publicidad. Los anuncios siempre están etiquetados.',
  'footer.rights': '© {year} Bit SamurAI — Labormine. Todos los derechos reservados.',
  'footer.ownership': 'Un producto de Bit SamurAI.',

  'about.title': 'Acerca de Labormine',
  'about.body':
    'Labormine es un hub de empleo para la industria minera global. Indexamos bolsas de trabajo públicas de empleadores mineros y las emparejamos con dónde puedes trabajar legalmente: tu país, países cuyas visas de movilidad juvenil aceptan tu pasaporte, empleadores que reportan patrocinio de visa y roles remotos.',
  'about.realJobs': 'Cada oferta es real. Nunca generamos ni inventamos empleos; cada uno enlaza a la publicación original del empleador.',
  'privacy.title': 'Política de privacidad',
  'privacy.body':
    'Labormine guarda tus preferencias de idioma y país en tu navegador (localStorage) para personalizar las ofertas. Usamos detección de país por IP (nunca solicitamos ni almacenamos datos a nivel de ciudad). Socios publicitarios como Google AdSense pueden usar cookies para anuncios personalizados; puedes desactivarlo en la Configuración de anuncios de Google.',
  'contact.title': 'Contacto',
  'contact.body': '¿Preguntas, correcciones o una bolsa de empleo que deberíamos indexar? Escribe a',
  'notfound.title': '404 — Perdido en la mina',
  'notfound.body': 'La página que buscas no existe.',
  'notfound.cta': 'Volver al inicio',

  'common.viewAll': 'Ver todos',
  'common.back': 'Volver a empleos',
  'common.related': 'Empleos similares',
  'common.loading': 'Cargando…',
  'common.selectPrompt': 'Elige para ver tus coincidencias',
};

const pt: Dictionary = {
  'nav.home': 'Início',
  'nav.jobs': 'Vagas',
  'nav.pathways': 'Rotas de visto',
  'nav.about': 'Sobre',
  'nav.contact': 'Contato',
  'nav.language': 'Idioma',

  'hero.kicker': 'Vagas globais de mineração, mapeadas pelo seu passaporte',
  'hero.title': 'Encontre trabalho em mineração em qualquer lugar do mundo — começando por onde você pode trabalhar legalmente.',
  'hero.subtitle':
    'O Labormine vasculha vagas reais de empregadores de mineração no mundo todo e as cruza com sua nacionalidade: vagas no seu país, vagas com apoio de visto e cargos remotos.',
  'hero.cta': 'Explorar vagas',
  'hero.secondary': 'Ver rotas de visto',
  'hero.nationality': 'Seu passaporte',
  'hero.country': 'Onde você quer trabalhar',
  'hero.detecting': 'Detectando sua localização…',
  'hero.choose': 'Escolher…',

  'chapter.inCountry.kicker': 'Capítulo 01',
  'chapter.inCountry.title': 'Vagas de mineração no seu país',
  'chapter.inCountry.lead':
    'Oportunidades perto de casa, primeiro porque não exigem visto.',
  'chapter.passport.kicker': 'Capítulo 02',
  'chapter.passport.title': 'Seu passaporte abre portas',
  'chapter.passport.lead':
    'Visas working holiday, mobilidade juvenil, rotas estudantis e patrocínio — rotas oficiais para trabalhar em mineração no exterior.',
  'chapter.passport.cta': 'Ver todas as rotas para sua nacionalidade',
  'chapter.spotlight.kicker': 'Destaque regional',
  'chapter.remote.kicker': 'Capítulo 03',
  'chapter.remote.title': 'Remoto, no mundo todo',
  'chapter.remote.lead':
    'Cargos corporativos, técnicos e de engenharia que você pode fazer de qualquer lugar — inclusive do seu país.',
  'chapter.cta.title': 'Pronto para escavar?',
  'chapter.cta.body': 'Filtre cada vaga por país, função, apoio de visto e modalidade.',
  'chapter.cta.button': 'Ver todas as vagas',

  'card.visa': 'Apoio de visto informado',
  'job.autoTranslated': 'Título traduzido automaticamente',
  'card.remote': 'Remoto',
  'card.details': 'Detalhes',
  'card.posted': 'Publicado',
  'card.global': 'Global',

  'jobs.title': 'Todas as vagas de mineração',
  'jobs.lead': 'Vagas reais de painéis públicos de empregadores e APIs de emprego. Cada vaga aponta para a fonte original.',
  'jobs.filter.country': 'País',
  'jobs.filter.category': 'Categoria',
  'jobs.filter.type': 'Modalidade',
  'jobs.filter.visa': 'Somente com apoio de visto',
  'jobs.filter.search': 'Buscar função, empresa…',
  'jobs.filter.all': 'Todas',
  'jobs.type.onsite': 'Presencial',
  'jobs.type.remote': 'Remoto',
  'jobs.empty': 'Nenhuma vaga corresponde aos seus filtros.',
  'jobs.clear': 'Limpar filtros',
  'jobs.count': '{n} vagas',
  'jobs.found': 'Encontradas',

  'pathways.title': 'Rotas de visto',
  'pathways.lead':
    'Rotas oficiais de visto de trabalho para mineração, mapeadas pela sua nacionalidade. Fonte: páginas oficiais de imigração — sempre verifique antes de se candidatar.',
  'pathways.select': 'Sua nacionalidade',
  'pathways.choose': 'Escolha sua nacionalidade…',
  'pathways.age': 'Idade',
  'pathways.duration': 'Duração',
  'pathways.rights': 'Direitos trabalhistas',
  'pathways.official': 'Fonte oficial',
  'pathways.verified': 'Verificado em {date}',
  'pathways.any': 'Aberto a todas as nacionalidades',
  'pathways.none':
    'Ainda não há rotas curadas para esta nacionalidade — as rotas de patrocínio e estudantis abaixo também se aplicam a você.',
  'pathways.forYou': 'Rotas para {nationality}',
  'pathway.working-holiday': 'Working holiday',
  'pathway.temporary': 'Trabalho temporário',
  'pathway.student': 'Rota estudantil',
  'pathway.sponsorship': 'Patrocínio de empregador',
  'pathway.skilled': 'Visto qualificado',
  'pathways.badge': 'Elegível via {name}',
  'pathways.notes': 'Notas',

  'ads.label': 'Anúncio',

  'drawer.quick': 'Visualização rápida',
  'drawer.full': 'Detalhes completos',
  'drawer.apply': 'Candidatar-se na fonte',
  'drawer.close': 'Fechar',
  'drawer.visaNote': '“Apoio de visto” é um sinal heurístico do texto da vaga — sempre verifique com o empregador.',

  'footer.tagline': 'Vagas de mineração no mundo todo, pela sua nacionalidade.',
  'footer.privacy': 'Política de privacidade',
  'footer.about': 'Sobre o Labormine',
  'footer.contact': 'Contato',
  'footer.disclaimer':
    'As vagas são agregadas de painéis públicos de empregadores e APIs, e sempre apontam para a fonte original.',
  'footer.adsDisclosure': 'O Labormine é sustentado por publicidade. Os anúncios são sempre rotulados.',
  'footer.rights': '© {year} Bit SamurAI — Labormine. Todos os direitos reservados.',
  'footer.ownership': 'Um produto Bit SamurAI.',

  'about.title': 'Sobre o Labormine',
  'about.body':
    'O Labormine é um hub de vagas para a indústria global de mineração. Indexamos painéis públicos de empregadores de mineração e os cruzamos com onde você pode trabalhar legalmente: seu país, países cujos vistos de mobilidade juvenil aceitam seu passaporte, empregadores que informam patrocínio de visto e vagas remotas.',
  'about.realJobs': 'Cada vaga é real. Nunca geramos ou inventamos ofertas; cada uma aponta para a publicação original do empregador.',
  'privacy.title': 'Política de privacidade',
  'privacy.body':
    'O Labormine armazena suas preferências de idioma e país no seu navegador (localStorage) para personalizar as vagas. Usamos detecção de país por IP (dados no nível de cidade nunca são solicitados ou armazenados). Parceiros de publicidade como o Google AdSense podem usar cookies para anúncios personalizados; você pode desativá-lo nas Configurações de anúncios do Google.',
  'contact.title': 'Contato',
  'contact.body': 'Perguntas, correções ou um painel de vagas que deveríamos indexar? Escreva para',
  'notfound.title': '404 — Perdido na mina',
  'notfound.body': 'A página que você procura não existe.',
  'notfound.cta': 'Voltar ao início',

  'common.viewAll': 'Ver todas',
  'common.back': 'Voltar às vagas',
  'common.related': 'Vagas semelhantes',
  'common.loading': 'Carregando…',
  'common.selectPrompt': 'Escolha para ver suas correspondências',
};

const dictionaries: Record<Locale, Dictionary> = { en, es, pt };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
