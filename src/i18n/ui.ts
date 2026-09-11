export const languages = {
  es: 'Español',
} as const;

export type Locale = keyof typeof languages;
export const defaultLocale: Locale = 'es'; // español es el idioma principal: vive en la raíz
export const locales: Locale[] = ['es'];

const en = {
  'nav.home': 'Home',
  'nav.jobs': 'Jobs',
  'nav.practicas': 'Internships',
  'nav.pathways': 'Visa pathways',
  'nav.eventos': 'Events',
  'nav.guias': 'Guides',
  'nav.contact': 'Contact',

  'hero.kicker': 'Mining jobs for Peruvians',
  'hero.title': 'Every mining job you can apply for today.',
  'hero.subtitle':
    'Real listings from public sources, ordered by what you can get: Peru first, then remote from home, and finally jobs abroad that report visa support. Apply at the original source.',
  'hero.cta': 'Browse jobs',
  'hero.secondary': 'See visa pathways',
  'hero.tier.pe': 'Peru',
  'hero.tier.pe.desc': 'No visa required',
  'hero.tier.remote': 'Remote',
  'hero.tier.remote.desc': 'From home in Peru',
  'hero.tier.abroad': 'Abroad',
  'hero.tier.abroad.desc': 'Reported visa support',
  'hero.fresh.title': 'Latest jobs in Peru',

  'pulse.title': 'The pulse of the sector',
  'pulse.lead':
    'Official figures worth knowing before you apply: the copper and gold price, the postings published on Labormin, the formal employment that sustains the sector, and where producing units are operating.',
  'pulse.postings': 'Listings published',
  'pulse.ofertasActivas': 'active listings',
  'pulse.interanual': 'year over year',
  'pulse.fuente': 'Source',
  'pulse.verificado': 'verified {date}',
  'pulse.actualizado': 'updated {date}',

  'stocks.title': 'The best mining companies on the market',
  'stocks.lead':
    'Shares of the mining companies that operate in Peru move with metal prices and with what happens at each mine. Here is each company’s year — no finance jargon.',
  'stocks.snapshot': 'Quotes as of {date} · monthly refresh',
  'stocks.year': 'over the year',
  'stocks.analysis.title': 'The year in review',
  'stocks.analysis.top': 'Top gainer of the year',
  'stocks.analysis.bottom': 'Biggest laggard',
  'stocks.analysis.nearHigh': 'Near their best price of the year',
  'stocks.analysis.nearHighHint': 'less than 10% below their highest price',
  'stocks.nearMax': 'today {pct}% off its 52-week high',
  'stocks.mines': 'Mines in Peru',

  'stocks.top3.title': 'The 3 growing the most',
  'stocks.top3.lead': 'The miners with the biggest share-price rise over the last 12 months.',
  'stocks.cta': 'See more analysis',
  'stocks.disclaimer':
    'Reference quotes in US dollars · Not investment advice.',
  'bolsa.title': 'How the mining companies are trading',
  'bolsa.lead':
    'The full year of the 12 mining companies operating in Peru, explained without jargon: who is growing, who fell behind, and what that says about your next job.',
  'bolsa.snapshot': 'Quotes as of {date} · monthly refresh · {n} miners with mines in Peru',
  'bolsa.empleos': 'See this company’s jobs',
  'bolsa.termometro.title': 'The year’s thermometer',
  'bolsa.termometro.desc':
    'Each miner on its own 12-month journey: from the coldest point (its lowest price of the year) to the hottest (its high).',
  'bolsa.caida.title': 'The fall from the peak',
  'bolsa.caida.desc':
    'How far each share dropped from its best moment of the year. A miner near the peak often matches operations in full production.',
  'bolsa.meses.title': 'The best and the worst month',
  'bolsa.meses.desc':
    'The month with the biggest rise and the biggest fall for each miner, over a full year.',
  'bolsa.meses.nota': 'All bars share one scale across the 12 miners: amber, best month; gray, worst month. Compare across rows.',
  'bolsa.metales.title': 'The metals that move everything',
  'bolsa.metales.desc':
    'Copper and gold are the sector’s thermometers: when they rise, the miners producing them tend to follow.',
  'bolsa.metales.cobre': 'Copper price',
  'bolsa.metales.oro': 'Gold price',
  'bolsa.tabla.title': 'The {n} at a glance',
  'bolsa.tabla.empresa': 'Miner',
  'bolsa.tabla.metal': 'Metal',
  'bolsa.tabla.ano': 'Year',
  'bolsa.tabla.precio': 'Today',
  'bolsa.tabla.rango': '52w range',
  'bolsa.tabla.minas': 'Mines in Peru',
  'bolsa.tabla.ordenar': 'Sort table by {col}',
  'bolsa.glosario.title': 'What does this mean?',
  'bolsa.glosario.accion':
    'Share — a small piece of the company. When the mine does well, that piece is usually worth more.',
  'bolsa.glosario.variacion':
    'Annual change — how much the share rose or fell over the last 12 months. It decides the ranking.',
  'bolsa.glosario.rango':
    '52-week range — the road between the year’s lowest and highest price. Today the share sits somewhere on that road.',
  'bolsa.glosario.maximo':
    'Yearly high — the highest price the share reached over the last 12 months.',
  'bolsa.glosario.adr':
    'Foreign exchanges — quotes come in US dollars, normalized to USD so you can compare them.',
  'bolsa.disclaimer': 'Reference quotes in US dollars (Yahoo Finance) · Not investment advice · The market does not guarantee vacancies: apply at the original source.',

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
  'jobs.filter.searchLabel': 'Search',
  'jobs.filter.all': 'All',
  'jobs.type.onsite': 'On-site',
  'jobs.type.remote': 'Remote',
  'jobs.empty.title': 'Nothing here… yet',
  'jobs.empty.body': 'No jobs match these filters. Try widening your search or removing one filter — the right offer may be one click away.',
  'jobs.empty.hint': 'The feed is refreshed daily with new listings from official sources.',
  'jobs.clear': 'Clear filters',
  'jobs.count': '{n} jobs',
  'jobs.found': 'Found',

  'practicas.title': 'Mining internships',
  'practicas.lead':
    'Internships, trainee programs and entry grants posted by Peruvian mining companies and job platforms. Every listing links to the original source — you apply directly, no middlemen.',
  'practicas.count': '{n} active internships',
  'practicas.empty.title': 'No active internships today',
  'practicas.empty.body':
    'No company in the feed has an internship open right now. The feed refreshes daily — check back soon or browse the full job board.',
  'practicas.empty.jobs': 'Browse all jobs',
  'practicas.guide': 'No experience? Start with the guide: working on a mine site with no experience',

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
  'events.type.otro': 'Other',
  'events.city': 'City',
  'events.updated': 'List verified {date}',
  'events.empty': 'No events published yet — check back soon.',
  'events.official': 'Official source',
  'events.scraped.title': 'Job fairs & recruiting',
  'events.scraped.lead':
    'Events detected automatically from the official websites of organizers and from Facebook. Always verify with the organizer before attending or applying.',
  'events.scraped.badge': 'Auto-added',
  'events.scraped.cta': 'Verify with the organizer',
  'events.scraped.source.web-oficial': 'Official website',
  'events.scraped.source.facebook-post': 'Facebook post',
  'events.scraped.detected': 'Detected {date}',
  'events.scraped.organizer': 'Organized by: {name}',
  'events.scraped.empty': 'No events detected yet — the weekly tracker keeps looking.',

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
  'nav.practicas': 'Prácticas',
  'nav.pathways': 'Rutas de visa',
  'nav.eventos': 'Eventos',
  'nav.guias': 'Guías',
  'nav.contact': 'Contacto',

  'hero.kicker': 'Empleos mineros para peruanos',
  'hero.title': 'Todas las ofertas mineras a las que puedes postular hoy.',
  'hero.subtitle':
    'Vacantes reales de fuentes públicas, ordenadas por lo que puedes conseguir: primero Perú, luego remoto desde casa y, al final, el extranjero con visa reportada. Postulas directo en la fuente original.',
  'hero.cta': 'Ver empleos',
  'hero.secondary': 'Ver rutas de visa',
  'hero.tier.pe': 'Perú',
  'hero.tier.pe.desc': 'Sin visa de por medio',
  'hero.tier.remote': 'Remoto',
  'hero.tier.remote.desc': 'Desde casa en Perú',
  'hero.tier.abroad': 'Extranjero',
  'hero.tier.abroad.desc': 'Con visa reportada',
  'hero.fresh.title': 'Últimas vacantes en Perú',

  'pulse.title': 'El pulso del sector',
  'pulse.lead':
    'Cifras oficiales que conviene conocer antes de postular: el precio del cobre y del oro, las ofertas que publica Labormin, el empleo formal que sostiene al sector y dónde están operando las unidades en producción.',
  'pulse.postings': 'Ofertas publicadas',
  'pulse.ofertasActivas': 'ofertas activas',
  'pulse.interanual': 'interanual',
  'pulse.fuente': 'Fuente',
  'pulse.verificado': 'verificado {date}',
  'pulse.actualizado': 'actualizado {date}',

  'stocks.title': 'Las mejores mineras en bolsa',
  'stocks.lead':
    'Las acciones de las mineras que operan en el Perú se mueven con el precio de los metales y con lo que pasa en cada mina. Aquí, el año de cada una, sin jerga financiera.',
  'stocks.snapshot': 'Cotizaciones al {date} · refresco mensual',
  'stocks.year': 'en el año',
  'stocks.analysis.title': 'El año en revisión',
  'stocks.analysis.top': 'La ganadora del año',
  'stocks.analysis.bottom': 'La más rezagada',
  'stocks.analysis.nearHigh': 'Cerca de su mejor precio del año',
  'stocks.analysis.nearHighHint': 'menos del 10% debajo de su precio más alto',
  'stocks.nearMax': 'hoy a {pct}% de su máximo del año',
  'stocks.mines': 'Minas en Perú',

  'stocks.top3.title': 'Las 3 que más crecen',
  'stocks.top3.lead': 'Las mineras con la mayor subida de su acción en los últimos 12 meses.',
  'stocks.cta': 'Ver más análisis',
  'stocks.disclaimer':
    'Cotizaciones de referencia en dólares · No es asesoría de inversión.',
  'bolsa.title': 'Cómo van las mineras en la bolsa',
  'bolsa.lead':
    'El año completo de las 12 mineras con operaciones en el Perú, explicado sin jerga: cuál crece, cuál se quedó atrás y qué dice eso de su próxima vacante.',
  'bolsa.snapshot': 'Cotizaciones al {date} · refresco mensual · {n} mineras con minas en el Perú',
  'bolsa.empleos': 'Ver empleos de esta minera',
  'bolsa.termometro.title': 'El termómetro del año',
  'bolsa.termometro.desc':
    'Cada minera, en su propio recorrido de 12 meses: del punto más frío (su precio más bajo del año) al más caliente (su máximo).',
  'bolsa.caida.title': 'La caída desde la cima',
  'bolsa.caida.desc':
    'Cuánto bajó cada acción desde su mejor momento del año. Una minera cerca de la cima suele coincidir con operaciones en plena producción.',
  'bolsa.meses.title': 'El mejor y el peor mes',
  'bolsa.meses.desc':
    'El mes con la mayor subida y el de la mayor caída de cada minera, en un año completo.',
  'bolsa.meses.nota':
    'Todas las barras comparten una misma escala entre las 12 mineras: ámbar, mejor mes; gris, peor mes. Compara entre filas.',
  'bolsa.metales.title': 'Los metales que mueven todo',
  'bolsa.metales.desc':
    'El cobre y el oro son los termómetros del sector: cuando suben, las mineras que los producen suelen ir detrás.',
  'bolsa.metales.cobre': 'Precio del cobre',
  'bolsa.metales.oro': 'Precio del oro',
  'bolsa.tabla.title': 'Las {n} de un vistazo',
  'bolsa.tabla.empresa': 'Minera',
  'bolsa.tabla.metal': 'Metal',
  'bolsa.tabla.ano': 'Año',
  'bolsa.tabla.precio': 'Hoy',
  'bolsa.tabla.rango': 'Rango 52s',
  'bolsa.tabla.minas': 'Minas en el Perú',
  'bolsa.tabla.ordenar': 'Ordenar tabla por {col}',
  'bolsa.glosario.title': '¿Qué significa esto?',
  'bolsa.glosario.accion':
    'Acción — una parte pequeña de la empresa. Si la mina va bien, esa parte suele valer más.',
  'bolsa.glosario.variacion':
    'Variación anual — cuánto subió o bajó la acción en los últimos 12 meses. Es la cifra que decide el ranking.',
  'bolsa.glosario.rango':
    'Rango de 52 semanas — el camino entre el precio más bajo y el más alto del año. Hoy, la acción está en algún punto de ese camino.',
  'bolsa.glosario.maximo':
    'Máximo del año — el precio más alto que alcanzó la acción en los últimos 12 meses.',
  'bolsa.glosario.adr':
    'Bolsas del extranjero — las cotizaciones vienen en dólares y normalizadas a USD para que puedas compararlas entre sí.',
  'bolsa.disclaimer': 'Cotizaciones de referencia en dólares (Yahoo Finance) · No es asesoría de inversión · La bolsa no garantiza vacantes: postula en la fuente original.',

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
  'jobs.filter.searchLabel': 'Buscar',
  'jobs.filter.all': 'Todas',
  'jobs.type.onsite': 'Presencial',
  'jobs.type.remote': 'Remoto',
  'jobs.empty.title': 'Nada por aquí… todavía',
  'jobs.empty.body': 'Ningún empleo coincide con estos filtros. Prueba ampliar la búsqueda o quitar uno: la oferta que buscas puede estar a un clic.',
  'jobs.empty.hint': 'El feed se actualiza a diario con nuevas ofertas de fuentes oficiales.',
  'jobs.clear': 'Limpiar filtros',
  'jobs.count': '{n} empleos',
  'jobs.found': 'Encontrados',

  'practicas.title': 'Prácticas en minería',
  'practicas.lead':
    'Prácticas preprofesionales y profesionales, trainee y puestos de becario publicados por empresas y plataformas del sector minero peruano. Cada puesto enlaza a la fuente original: postulas directo, sin intermediarios.',
  'practicas.count': '{n} prácticas activas',
  'practicas.empty.title': 'Sin prácticas activas hoy',
  'practicas.empty.body':
    'Ahora mismo ninguna empresa del feed tiene una práctica publicada. El feed se actualiza a diario: vuelve pronto o explora el tablero completo de empleos.',
  'practicas.empty.jobs': 'Explorar todos los empleos',
  'practicas.guide': '¿Sin experiencia? Empieza por la guía: trabajar en mina sin experiencia',

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
  'events.type.otro': 'Otro',
  'events.city': 'Ciudad',
  'events.updated': 'Lista revisada {date}',
  'events.empty': 'No hay eventos publicados todavía — revisa pronto.',
  'events.official': 'Fuente oficial',
  'events.scraped.title': 'Ferias y reclutamiento',
  'events.scraped.lead':
    'Eventos detectados automáticamente en las webs oficiales de los organizadores y en Facebook. Verifica siempre con el organizador antes de asistir o postular.',
  'events.scraped.badge': 'Agregado automáticamente',
  'events.scraped.cta': 'Verificar con el organizador',
  'events.scraped.source.web-oficial': 'Web oficial',
  'events.scraped.source.facebook-post': 'Publicación de Facebook',
  'events.scraped.detected': 'Detectado {date}',
  'events.scraped.organizer': 'Organiza: {name}',
  'events.scraped.empty': 'Sin eventos detectados por ahora — el rastreo semanal sigue activo.',

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
  'nav.practicas': 'Estágios',
  'nav.pathways': 'Rotas de visto',
  'nav.eventos': 'Eventos',
  'nav.guias': 'Guias',
  'nav.contact': 'Contato',

  'hero.kicker': 'Vagas de mineração para peruanos',
  'hero.title': 'Todas as vagas de mineração a que você pode se candidatar hoje.',
  'hero.subtitle':
    'Vagas reais de fontes públicas, ordenadas pelo que você pode conseguir: primeiro Peru, depois remoto de casa e, por fim, o exterior com visto reportado. Candidate-se direto na fonte original.',
  'hero.cta': 'Explorar vagas',
  'hero.secondary': 'Ver rotas de visto',
  'hero.tier.pe': 'Peru',
  'hero.tier.pe.desc': 'Sem visto no caminho',
  'hero.tier.remote': 'Remoto',
  'hero.tier.remote.desc': 'De casa no Peru',
  'hero.tier.abroad': 'Exterior',
  'hero.tier.abroad.desc': 'Com visto reportado',
  'hero.fresh.title': 'Últimas vagas no Peru',

  'pulse.title': 'O pulso do setor',
  'pulse.lead':
    'Números oficiais que vale a pena conhecer antes de se candidatar: o preço do cobre e do ouro, as vagas publicadas no Labormin, o emprego formal que sustenta o setor e onde operam as unidades em produção.',
  'pulse.postings': 'Vagas publicadas',
  'pulse.ofertasActivas': 'vagas ativas',
  'pulse.interanual': 'interanual',
  'pulse.fuente': 'Fonte',
  'pulse.verificado': 'verificado {date}',
  'pulse.actualizado': 'atualizado {date}',

  'stocks.title': 'As melhores mineradoras na bolsa',
  'stocks.lead':
    'As ações das mineradoras que operam no Peru se movem com o preço dos metais e com o que acontece em cada mina. Aqui, o ano de cada uma, sem jargão financeiro.',
  'stocks.snapshot': 'Cotações em {date} · atualização mensal',
  'stocks.year': 'no ano',
  'stocks.analysis.title': 'O ano em revisão',
  'stocks.analysis.top': 'A vencedora do ano',
  'stocks.analysis.bottom': 'A mais atrasada',
  'stocks.analysis.nearHigh': 'Perto do melhor preço do ano',
  'stocks.analysis.nearHighHint': 'menos de 10% abaixo do preço mais alto',
  'stocks.nearMax': 'hoje a {pct}% da máxima do ano',
  'stocks.mines': 'Minas no Peru',

  'stocks.top3.title': 'As 3 que mais crescem',
  'stocks.top3.lead': 'As mineradoras com a maior alta de suas ações nos últimos 12 meses.',
  'stocks.cta': 'Ver mais análises',
  'stocks.disclaimer':
    'Cotações de referência em dólares · Não é recomendação de investimento.',
  'bolsa.title': 'Como vão as mineradoras na bolsa',
  'bolsa.lead':
    'O ano completo das 12 mineradoras com operações no Peru, explicado sem jargão: qual cresce, qual ficou para trás e o que isso diz sobre sua próxima vaga.',
  'bolsa.snapshot': 'Cotações em {date} · atualização mensal · {n} mineradoras com minas no Peru',
  'bolsa.empleos': 'Ver vagas desta mineradora',
  'bolsa.termometro.title': 'O termômetro do ano',
  'bolsa.termometro.desc':
    'Cada mineradora na própria jornada de 12 meses: do ponto mais frio (seu preço mais baixo do ano) ao mais quente (sua máxima).',
  'bolsa.caida.title': 'A queda do topo',
  'bolsa.caida.desc':
    'Quanto cada ação caiu do seu melhor momento do ano. Uma mineradora perto do topo costuma coincidir com operações em plena produção.',
  'bolsa.meses.title': 'O melhor e o pior mês',
  'bolsa.meses.desc':
    'O mês de maior alta e o de maior queda de cada mineradora, em um ano completo.',
  'bolsa.meses.nota':
    'Todas as barras compartilham a mesma escala entre as 12 mineradoras: âmbar, melhor mês; cinza, pior mês. Compare entre as linhas.',
  'bolsa.metales.title': 'Os metais que movem tudo',
  'bolsa.metales.desc':
    'O cobre e o ouro são os termômetros do setor: quando sobem, as mineradoras que os produzem costumam ir junto.',
  'bolsa.metales.cobre': 'Preço do cobre',
  'bolsa.metales.oro': 'Preço do ouro',
  'bolsa.tabla.title': 'As {n} de relance',
  'bolsa.tabla.empresa': 'Mineradora',
  'bolsa.tabla.metal': 'Metal',
  'bolsa.tabla.ano': 'Ano',
  'bolsa.tabla.precio': 'Hoje',
  'bolsa.tabla.rango': 'Faixa 52s',
  'bolsa.tabla.minas': 'Minas no Peru',
  'bolsa.tabla.ordenar': 'Ordenar tabela por {col}',
  'bolsa.glosario.title': 'O que isso significa?',
  'bolsa.glosario.accion':
    'Ação — uma pequena parte da empresa. Quando a mina vai bem, essa parte costuma valer mais.',
  'bolsa.glosario.variacion':
    'Variação anual — quanto a ação subiu ou caiu nos últimos 12 meses. É ela que decide o ranking.',
  'bolsa.glosario.rango':
    'Faixa de 52 semanas — o caminho entre o preço mais baixo e o mais alto do ano. Hoje a ação está em algum ponto desse caminho.',
  'bolsa.glosario.maximo':
    'Máxima do ano — o preço mais alto que a ação alcançou nos últimos 12 meses.',
  'bolsa.glosario.adr':
    'Bolsas do exterior — as cotações vêm em dólares, normalizadas em USD para você comparar.',
  'bolsa.disclaimer': 'Cotações de referência em dólares (Yahoo Finance) · Não é recomendação de investimento · A bolsa não garante vagas: candidate-se na fonte original.',

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
  'jobs.filter.searchLabel': 'Buscar',
  'jobs.filter.all': 'Todas',
  'jobs.type.onsite': 'Presencial',
  'jobs.type.remote': 'Remoto',
  'jobs.empty.title': 'Nada por aqui… ainda',
  'jobs.empty.body': 'Nenhuma vaga corresponde a estes filtros. Tente ampliar a busca ou remover um: a vaga certa pode estar a um clique.',
  'jobs.empty.hint': 'O feed é atualizado diariamente com novas vagas de fontes oficiais.',
  'jobs.clear': 'Limpar filtros',
  'jobs.count': '{n} vagas',
  'jobs.found': 'Encontradas',

  'practicas.title': 'Estágios em mineração',
  'practicas.lead':
    'Estágios, programas de trainee e vagas para aprendizes publicados por empresas e plataformas do setor de mineração peruano. Cada vaga aponta para a fonte original: você se candidata direto, sem intermediários.',
  'practicas.count': '{n} estágios ativos',
  'practicas.empty.title': 'Sem estágios ativos hoje',
  'practicas.empty.body':
    'Nenhuma empresa do feed tem um estágio aberto agora. O feed é atualizado diariamente — volte em breve ou explore o painel completo de vagas.',
  'practicas.empty.jobs': 'Explorar todas as vagas',
  'practicas.guide': 'Sem experiência? Comece pelo guia: trabalhar em mina sem experiência',

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
  'events.type.otro': 'Outro',
  'events.city': 'Cidade',
  'events.updated': 'Lista verificada em {date}',
  'events.empty': 'Nenhum evento publicado ainda — volte em breve.',
  'events.official': 'Fonte oficial',
  'events.scraped.title': 'Feiras e recrutamento',
  'events.scraped.lead':
    'Eventos detectados automaticamente nos sites oficiais dos organizadores e no Facebook. Verifique sempre com o organizador antes de participar ou candidatar.',
  'events.scraped.badge': 'Adicionado automaticamente',
  'events.scraped.cta': 'Verificar com o organizador',
  'events.scraped.source.web-oficial': 'Site oficial',
  'events.scraped.source.facebook-post': 'Publicação no Facebook',
  'events.scraped.detected': 'Detectado {date}',
  'events.scraped.organizer': 'Organizado por: {name}',
  'events.scraped.empty': 'Nenhum evento detectado por enquanto — o rastreamento semanal continua.',

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
