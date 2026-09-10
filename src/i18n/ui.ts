export const languages = {
  es: 'Español',
} as const;

export type Locale = keyof typeof languages;
export const defaultLocale: Locale = 'es'; // español es el idioma principal: vive en la raíz
export const locales: Locale[] = ['es'];

const en = {
  'nav.home': 'Home',
  'nav.jobs': 'Jobs',
  'nav.pathways': 'Visa pathways',
  'nav.eventos': 'Events',
  'nav.guias': 'Guides',
  'nav.about': 'About',
  'nav.contact': 'Contact',

  'hero.kicker': 'Mining jobs for Peruvians',
  'hero.title': 'Start in a Peruvian mine. Save for your future.',
  'hero.subtitle':
    'Labormin gathers real listings from mining employers and orders them by what you can actually get: Peru first, then remote roles from home, and finally jobs abroad that report visa support.',
  'hero.cta': 'Browse jobs',
  'hero.secondary': 'See visa pathways',

  'chapter.inCountry.kicker': 'Chapter 01',
  'chapter.inCountry.title': 'Mining in Peru',
  'chapter.inCountry.lead':
    'Vacancies at Peruvian operations — apply directly at the source, no visa required.',
  'chapter.events.kicker': 'Chapter 02',
  'chapter.events.title': 'Mining events',
  'chapter.events.lead':
    'Job fairs, expos and conferences: in person in Peru, virtual from the mining powers.',
  'chapter.remote.kicker': 'Chapter 03',
  'chapter.remote.title': 'Remote from Peru',
  'chapter.remote.lead':
    'Corporate and technical roles at foreign mining companies you can do from home while you save.',
  'chapter.abroad.kicker': 'Chapter 04',
  'chapter.abroad.title': 'Mining abroad — visa reported',
  'chapter.abroad.lead':
    'Listings in Canada, the US, Australia and Chile that mention visa support or are open to international candidates — always verify with the employer.',
  'chapter.passport.kicker': 'Chapter 05',
  'chapter.passport.title': 'Visa pathways for Peruvians',
  'chapter.passport.lead':
    'Working holiday visas, temporary routes and sponsorship — official sources for Peruvians to work abroad legally.',
  'chapter.passport.cta': 'See all pathways',
  'chapter.guides.kicker': 'Kit',
  'chapter.guides.title': 'Guides and answers before you apply',
  'chapter.guides.lead': 'How to get into a mine without experience, medical requirements, salaries — plain, verified content.',
  'chapter.cta.title': 'Ready to dig in?',
  'chapter.cta.body': 'Filter every listing by country, role, visa support and work style.',
  'chapter.cta.button': 'Browse all jobs',

  'card.visa': 'Visa support reported',
  'card.international': 'Open to international candidates',
  'job.autoTranslated': 'AI translated',
  'job.clarityCta': 'Clear version with AI',
  'job.clarityCtaTranslate': 'Translate + clear version with AI',
  'job.showOriginal': 'View original description',
  'job.aiWorking': 'Generating with AI…',
  'job.aiWorkingHint': 'This can take a few seconds the first time.',
  'job.aiDisclaimer': 'Clear version generated with AI from the original posting — verify with the employer.',
  'job.aiError': 'Could not generate the AI version. Showing the original.',
  'card.remote': 'Remote',
  'card.details': 'Details',
  'card.posted': 'Posted',
  'card.global': 'Global',

  'jobs.title': 'All mining jobs',
  'jobs.lead': 'Real listings, ordered by priority: Peru first, then remote, then abroad with visa reported. Every offer links back to the original source.',
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
    'Official visa routes for Peruvians to work abroad legally. Sourced from government pages — always verify before applying.',
  'pathways.age': 'Age',
  'pathways.duration': 'Duration',
  'pathways.rights': 'Work rights',
  'pathways.official': 'Official source',
  'pathways.verified': 'Verified {date}',
  'pathways.any': 'Open to all nationalities',
  'pathways.none':
    'No curated pathways yet — the sponsorship and student routes below are still open to you.',
  'pathways.badge': 'Eligible via {name}',
  'pathways.notes': 'Notes',
  'pathway.working-holiday': 'Working holiday',
  'pathway.temporary': 'Temporary work',
  'pathway.student': 'Student route',
  'pathway.sponsorship': 'Employer sponsorship',
  'pathway.skilled': 'Skilled visa',

  'events.title': 'Mining events',
  'events.lead':
    'Job fairs, expos and conferences for mining job seekers: in person in Peru, virtual from Peru and the mining powers. Official source listed for every event.',
  'events.upcoming': 'Upcoming events',
  'events.mode.presencial': 'In person',
  'events.mode.virtual': 'Virtual',
  'events.type.feria-laboral': 'Job fair',
  'events.type.expo': 'Expo',
  'events.type.conferencia': 'Conference',
  'events.type.webinar': 'Webinar',
  'events.city': 'City',
  'events.updated': 'List verified {date}',
  'events.empty': 'No events published yet — check back soon.',
  'events.official': 'Official source',

  'faq.teaser': 'Straight answers about salaries, medical requirements and first jobs in mining.',

  'ads.label': 'Ad',

  'drawer.quick': 'Quick view',
  'drawer.full': 'Full details',
  'drawer.apply': 'Apply at source',
  'drawer.close': 'Close',
  'drawer.visaNote': '“Visa support” is a heuristic signal from the listing text — always verify with the employer.',

  'footer.tagline': 'Mining jobs for Peruvians: Peru first, then remote, then abroad.',
  'footer.privacy': 'Privacy policy',
  'footer.terms': 'Terms and conditions',
  'footer.about': 'About Labormin',
  'footer.contact': 'Contact',
  'footer.disclaimer':
    'Listings are aggregated from public employer boards and APIs and always link back to the original source.',
  'footer.adsDisclosure': 'Labormin is supported by advertising. Ads are always labeled.',
  'footer.rights': '© {year} Bit SamurAI — Labormin. All rights reserved.',
  'footer.ownership': 'A Bit SamurAI product.',

  'about.title': 'About Labormin',
  'about.body':
    'Labormin is a mining-jobs hub for Peruvians. We aggregate real listings from public boards — operations in Peru and in the mining powers (Chile, Canada, the US and Australia) — and order them by what you can actually get: your country first, then remote roles from home, and finally jobs abroad with reported visa support.',
  'about.realJobs': 'Every listing is real. We never generate or fabricate job offers; each one links back to the employer’s original posting.',
  'privacy.title': 'Privacy policy',
  'privacy.body':
    'Labormin is a static site: we do not ask for personal data, we do not detect your country by IP and we do not store your location. We only store your language preference in your browser (localStorage). Advertising partners such as Google AdSense may use cookies to serve personalized ads; you can opt out through Google Ads Settings.',
  'contact.title': 'Contact',
  'contact.body': 'Questions, corrections, or an employer board we should index? Write to',
  'notfound.title': '404 — Lost in the pit',
  'notfound.body': 'The page you are looking for does not exist.',
  'notfound.cta': 'Back to home',

  'common.viewAll': 'View all',
  'common.back': 'Back to jobs',
  'common.related': 'Similar jobs',
  'common.loading': 'Loading…',
};

export type Dictionary = typeof en;

const es: Dictionary = {
  'nav.home': 'Inicio',
  'nav.jobs': 'Empleos',
  'nav.pathways': 'Rutas de visa',
  'nav.eventos': 'Eventos',
  'nav.guias': 'Guías',
  'nav.about': 'Acerca de',
  'nav.contact': 'Contacto',

  'hero.kicker': 'Empleos mineros para peruanos',
  'hero.title': 'Empieza en una mina peruana. Ahorra para tu futuro.',
  'hero.subtitle':
    'Labormin junta ofertas reales de empleadores mineros y las ordena por lo que puedes conseguir: primero Perú, luego roles remotos desde casa y, al final, vacantes en el extranjero que reportan apoyo de visa.',
  'hero.cta': 'Ver empleos',
  'hero.secondary': 'Ver rutas de visa',

  'chapter.inCountry.kicker': 'Capítulo 01',
  'chapter.inCountry.title': 'Minería en Perú',
  'chapter.inCountry.lead':
    'Vacantes en operaciones peruanas: postula directo a la fuente original, sin visa de por medio.',
  'chapter.events.kicker': 'Capítulo 02',
  'chapter.events.title': 'Eventos mineros',
  'chapter.events.lead':
    'Ferias laborales, expos y conferencias donde el sector contrata: presenciales en Perú y virtuales desde las potencias mineras.',
  'chapter.remote.kicker': 'Capítulo 03',
  'chapter.remote.title': 'Remoto desde Perú',
  'chapter.remote.lead':
    'Roles corporativos y técnicos de empresas mineras del extranjero que puedes ejercer desde casa mientras ahorras.',
  'chapter.abroad.kicker': 'Capítulo 04',
  'chapter.abroad.title': 'Minería en el extranjero',
  'chapter.abroad.lead':
    'Vacantes en Canadá, EE. UU., Australia y Chile que mencionan apoyo de visa o están abiertas a candidatos internacionales — verifica con el empleador antes de postular.',
  'chapter.passport.kicker': 'Capítulo 05',
  'chapter.passport.title': 'Rutas de visa para peruanos',
  'chapter.passport.lead':
    'Working holiday, rutas temporales y de patrocinio — fuentes oficiales para que los peruanos trabajen legalmente en el extranjero.',
  'chapter.passport.cta': 'Ver todas las rutas',
  'chapter.guides.kicker': 'Kit del postulante',
  'chapter.guides.title': 'Guías y respuestas antes de postular',
  'chapter.guides.lead': 'Cómo entrar a mina sin experiencia, requisitos médicos y de seguridad, salarios — contenido propio y verificable.',
  'chapter.cta.title': '¿Listo para excavar?',
  'chapter.cta.body': 'Filtra cada oferta por país, rol, apoyo de visa y modalidad.',
  'chapter.cta.button': 'Ver todos los empleos',

  'card.visa': 'Apoyo de visa reportado',
  'card.international': 'Abierto a candidatos internacionales',
  'job.autoTranslated': 'IA traducido',
  'job.clarityCta': 'Versión clara con IA',
  'job.clarityCtaTranslate': 'Traducir + versión clara con IA',
  'job.showOriginal': 'Ver descripción original',
  'job.aiWorking': 'Generando con IA…',
  'job.aiWorkingHint': 'Puede tardar unos segundos la primera vez.',
  'job.aiDisclaimer': 'Versión clara generada con IA a partir de la publicación original — verifica con el empleador.',
  'job.aiError': 'No se pudo generar la versión con IA. Mostrando el original.',
  'card.remote': 'Remoto',
  'card.details': 'Detalles',
  'card.posted': 'Publicado',
  'card.global': 'Global',

  'jobs.title': 'Todos los empleos mineros',
  'jobs.lead': 'Ofertas reales, ordenadas por prioridad: Perú primero, luego remoto y después el extranjero con visa reportada. Cada oferta enlaza a la fuente original.',
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
    'Rutas oficiales para que peruanos trabajen legalmente en el extranjero. Fuente: páginas oficiales de gobierno — verifica siempre antes de postular.',
  'pathways.age': 'Edad',
  'pathways.duration': 'Duración',
  'pathways.rights': 'Derechos laborales',
  'pathways.official': 'Fuente oficial',
  'pathways.verified': 'Verificado {date}',
  'pathways.any': 'Abierto a todas las nacionalidades',
  'pathways.none':
    'Aún no hay rutas curadas — las rutas de patrocinio y estudiantiles también pueden aplicarte.',
  'pathways.badge': 'Elegible vía {name}',
  'pathways.notes': 'Notas',
  'pathway.working-holiday': 'Working holiday',
  'pathway.temporary': 'Trabajo temporal',
  'pathway.student': 'Ruta estudiantil',
  'pathway.sponsorship': 'Patrocinio de empleador',
  'pathway.skilled': 'Visa calificada',

  'events.title': 'Eventos mineros',
  'events.lead':
    'Ferias, expos y conferencias para quien busca trabajo en minería: presenciales en Perú, virtuales desde Perú y las potencias mineras. Cada evento enlaza a su fuente oficial.',
  'events.upcoming': 'Próximos eventos',
  'events.mode.presencial': 'Presencial',
  'events.mode.virtual': 'Virtual',
  'events.type.feria-laboral': 'Feria laboral',
  'events.type.expo': 'Expo',
  'events.type.conferencia': 'Conferencia',
  'events.type.webinar': 'Webinar',
  'events.city': 'Ciudad',
  'events.updated': 'Lista revisada {date}',
  'events.empty': 'No hay eventos publicados todavía — revisa pronto.',
  'events.official': 'Fuente oficial',

  'faq.teaser': 'Respuestas directas sobre salarios, requisitos médicos y cómo entrar a mina sin experiencia.',

  'ads.label': 'Anuncio',

  'drawer.quick': 'Vista rápida',
  'drawer.full': 'Detalles completos',
  'drawer.apply': 'Postular en la fuente',
  'drawer.close': 'Cerrar',
  'drawer.visaNote': '“Apoyo de visa” es una señal heurística del texto de la oferta — verifica siempre con el empleador.',

  'footer.tagline': 'Empleos mineros para peruanos: Perú primero, remoto y el extranjero.',
  'footer.privacy': 'Política de privacidad',
  'footer.terms': 'Términos y condiciones',
  'footer.about': 'Acerca de Labormin',
  'footer.contact': 'Contacto',
  'footer.disclaimer':
    'Las ofertas se agregan de bolsas públicas de empleadores y APIs, y siempre enlazan a la fuente original.',
  'footer.adsDisclosure': 'Labormin se financia con publicidad. Los anuncios siempre están etiquetados.',
  'footer.rights': '© {year} Bit SamurAI — Labormin. Todos los derechos reservados.',
  'footer.ownership': 'Un producto de Bit SamurAI.',

  'about.title': 'Acerca de Labormin',
  'about.body':
    'Labormin es el hub de empleo minero para peruanos. Agregamos ofertas reales de bolsas públicas — operaciones en Perú y en las potencias mineras (Chile, Canadá, EE. UU. y Australia) — y las ordenamos por lo que puedes conseguir: tu país primero, luego remoto desde casa y después el extranjero con visa reportada.',
  'about.realJobs': 'Cada oferta es real. Nunca generamos ni inventamos empleos; cada uno enlaza a la publicación original del empleador.',
  'privacy.title': 'Política de privacidad',
  'privacy.body':
    'Labormin es un sitio estático: no pedimos datos personales, no detectamos tu país por IP y no almacenamos tu ubicación. Solo guardamos tu preferencia de idioma en tu navegador (localStorage). Socios publicitarios como Google AdSense pueden usar cookies para anuncios personalizados; puedes desactivarlos en la Configuración de anuncios de Google.',
  'contact.title': 'Contacto',
  'contact.body': '¿Preguntas, correcciones o una bolsa de empleo que deberíamos indexar? Escribe a',
  'notfound.title': '404 — Perdido en la mina',
  'notfound.body': 'La página que buscas no existe.',
  'notfound.cta': 'Volver al inicio',

  'common.viewAll': 'Ver todos',
  'common.back': 'Volver a empleos',
  'common.related': 'Empleos similares',
  'common.loading': 'Cargando…',
};

const pt: Dictionary = {
  'nav.home': 'Início',
  'nav.jobs': 'Vagas',
  'nav.pathways': 'Rotas de visto',
  'nav.eventos': 'Eventos',
  'nav.guias': 'Guias',
  'nav.about': 'Sobre',
  'nav.contact': 'Contato',

  'hero.kicker': 'Vagas de mineração para peruanos',
  'hero.title': 'Comece em uma mina peruana. Poupe para o seu futuro.',
  'hero.subtitle':
    'O Labormin reúne vagas reais de empregadores de mineração e as ordena pelo que você pode conseguir: primeiro Peru, depois vagas remotas de casa e por fim vagas no exterior com apoio de visto.',
  'hero.cta': 'Explorar vagas',
  'hero.secondary': 'Ver rotas de visto',

  'chapter.inCountry.kicker': 'Capítulo 01',
  'chapter.inCountry.title': 'Mineração no Peru',
  'chapter.inCountry.lead':
    'Vagas em operações peruanas — candidate-se direto na fonte original, sem visto.',
  'chapter.events.kicker': 'Capítulo 02',
  'chapter.events.title': 'Eventos de mineração',
  'chapter.events.lead':
    'Feiras de emprego, expos e conferências onde o setor contrata: presenciais no Peru e virtuais das potências mineradoras.',
  'chapter.remote.kicker': 'Capítulo 03',
  'chapter.remote.title': 'Remoto do Peru',
  'chapter.remote.lead':
    'Cargos corporativos e técnicos de empresas mineradoras do exterior que você pode fazer de casa enquanto poupa.',
  'chapter.abroad.kicker': 'Capítulo 04',
  'chapter.abroad.title': 'Mineração no exterior',
  'chapter.abroad.lead':
    'Vagas no Canadá, EUA, Austrália e Chile que mencionam apoio de visto ou estão abertas a candidatos internacionais — sempre verifique com o empregador.',
  'chapter.passport.kicker': 'Capítulo 05',
  'chapter.passport.title': 'Rotas de visto para peruanos',
  'chapter.passport.lead':
    'Working holiday, rotas temporárias e patrocínio — fontes oficiais para peruanos trabalharem legalmente no exterior.',
  'chapter.passport.cta': 'Ver todas as rotas',
  'chapter.guides.kicker': 'Kit do candidato',
  'chapter.guides.title': 'Guias e respostas antes de se candidatar',
  'chapter.guides.lead': 'Como entrar em mina sem experiência, requisitos médicos e de segurança, salários — conteúdo próprio e verificável.',
  'chapter.cta.title': 'Pronto para escavar?',
  'chapter.cta.body': 'Filtre cada vaga por país, função, apoio de visto e modalidade.',
  'chapter.cta.button': 'Ver todas as vagas',

  'card.visa': 'Apoio de visto informado',
  'card.international': 'Aberto a candidatos internacionais',
  'job.autoTranslated': 'IA traduzido',
  'job.clarityCta': 'Versão clara com IA',
  'job.clarityCtaTranslate': 'Traduzir + versão clara com IA',
  'job.showOriginal': 'Ver descrição original',
  'job.aiWorking': 'Gerando com IA…',
  'job.aiWorkingHint': 'Pode demorar alguns segundos na primeira vez.',
  'job.aiDisclaimer': 'Versão clara gerada com IA a partir da publicação original — verifique com o empregador.',
  'job.aiError': 'Não foi possível gerar a versão com IA. Mostrando o original.',
  'card.remote': 'Remoto',
  'card.details': 'Detalhes',
  'card.posted': 'Publicado',
  'card.global': 'Global',

  'jobs.title': 'Todas as vagas de mineração',
  'jobs.lead': 'Vagas reais, ordenadas por prioridade: Peru primeiro, depois remoto e por fim o exterior com apoio de visto. Cada vaga aponta para a fonte original.',
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
    'Rotas oficiais para peruanos trabalharem legalmente no exterior. Fonte: páginas oficiais de governo — sempre verifique antes de se candidatar.',
  'pathways.age': 'Idade',
  'pathways.duration': 'Duração',
  'pathways.rights': 'Direitos trabalhistas',
  'pathways.official': 'Fonte oficial',
  'pathways.verified': 'Verificado em {date}',
  'pathways.any': 'Aberto a todas as nacionalidades',
  'pathways.none':
    'Ainda não há rotas curadas — as rotas de patrocínio e estudantis também podem se aplicar a você.',
  'pathways.badge': 'Elegível via {name}',
  'pathways.notes': 'Notas',
  'pathway.working-holiday': 'Working holiday',
  'pathway.temporary': 'Trabalho temporário',
  'pathway.student': 'Rota estudantil',
  'pathway.sponsorship': 'Patrocínio de empregador',
  'pathway.skilled': 'Visto qualificado',

  'events.title': 'Eventos de mineração',
  'events.lead':
    'Feiras, expos e conferências para quem busca emprego em mineração: presenciais no Peru, virtuais do Peru e das potências mineradoras. Cada evento aponta para sua fonte oficial.',
  'events.upcoming': 'Próximos eventos',
  'events.mode.presencial': 'Presencial',
  'events.mode.virtual': 'Virtual',
  'events.type.feria-laboral': 'Feira de emprego',
  'events.type.expo': 'Expo',
  'events.type.conferencia': 'Conferência',
  'events.type.webinar': 'Webinar',
  'events.city': 'Cidade',
  'events.updated': 'Lista verificada em {date}',
  'events.empty': 'Nenhum evento publicado ainda — volte em breve.',
  'events.official': 'Fonte oficial',

  'faq.teaser': 'Respostas diretas sobre salários, requisitos médicos e primeiros empregos em mineração.',

  'ads.label': 'Anúncio',

  'drawer.quick': 'Visualização rápida',
  'drawer.full': 'Detalhes completos',
  'drawer.apply': 'Candidatar-se na fonte',
  'drawer.close': 'Fechar',
  'drawer.visaNote': '“Apoio de visto” é um sinal heurístico do texto da vaga — sempre verifique com o empregador.',

  'footer.tagline': 'Vagas de mineração para peruanos: Peru primeiro, remoto e exterior.',
  'footer.privacy': 'Política de privacidade',
  'footer.terms': 'Termos e condições',
  'footer.about': 'Sobre o Labormin',
  'footer.contact': 'Contato',
  'footer.disclaimer':
    'As vagas são agregadas de painéis públicos de empregadores e APIs, e sempre apontam para a fonte original.',
  'footer.adsDisclosure': 'O Labormin é sustentado por publicidade. Os anúncios são sempre rotulados.',
  'footer.rights': '© {year} Bit SamurAI — Labormin. Todos os direitos reservados.',
  'footer.ownership': 'Um produto Bit SamurAI.',

  'about.title': 'Sobre o Labormin',
  'about.body':
    'O Labormin é o hub de vagas de mineração para peruanos. Agregamos vagas reais de painéis públicos — operações no Peru e nas potências mineradoras (Chile, Canadá, EUA e Austrália) — e as ordenamos pelo que você pode conseguir: seu país primeiro, depois remoto de casa e por fim o exterior com apoio de visto informado.',
  'about.realJobs': 'Cada vaga é real. Nunca geramos ou inventamos ofertas; cada uma aponta para a publicação original do empregador.',
  'privacy.title': 'Política de privacidade',
  'privacy.body':
    'O Labormin é um site estático: não pedimos dados pessoais, não detectamos seu país por IP e não armazenamos sua localização. Guardamos apenas sua preferência de idioma no navegador (localStorage). Parceiros de publicidade como o Google AdSense podem usar cookies para anúncios personalizados; você pode desativá-los nas Configurações de anúncios do Google.',
  'contact.title': 'Contato',
  'contact.body': 'Perguntas, correções ou um painel de vagas que deveríamos indexar? Escreva para',
  'notfound.title': '404 — Perdido na mina',
  'notfound.body': 'A página que você procura não existe.',
  'notfound.cta': 'Voltar ao início',

  'common.viewAll': 'Ver todas',
  'common.back': 'Voltar às vagas',
  'common.related': 'Vagas semelhantes',
  'common.loading': 'Carregando…',
};

const dictionaries: Record<Locale, Dictionary> = { en, es, pt };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
