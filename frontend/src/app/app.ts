import { Component, computed, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { FooterComponent } from './components/footer/footer.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FooterComponent, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {

  public selectedLanguage = signal<string>(localStorage.getItem('oracle_lang') || 'es');


  // 📝 Diccionario de Navegación (Vertex Localization Protocol)

  public navTranslationsOld = computed(() => {
    const lang = this.selectedLanguage();
    const translations: any = {
      es: { home: '🏠 Inicio', about: '📖 Acerca', docs: '📚 Docs', contact: '📧 Contacto' },
      en: { home: '🏠 Home', about: '📖 About', docs: '📚 Docs', contact: '📧 Contact' },
      fr: { home: '🏠 Accueil', about: '📖 À propos', docs: '📚 Docs', contact: '📧 Contact' },
      pt: { home: '🏠 Início', about: '📖 Sobre', docs: '📚 Docs', contact: '📧 Contato' },
      zh: { home: '🏠 首页', about: '📖 关于', docs: '📚 文档', contact: '📧 联系' },
      ko: { home: '🏠 홈', about: '📖 정보', docs: '📚 문서', contact: '📧 연락처' },
      hi: { home: '🏠 मुख्य पृष्ठ', about: '📖 विवरण', docs: '📚 दस्तावेज़', contact: '📧 संपर्क' },
      // 🔥 NUEVOS IDIOMAS
      ru: { home: '🏠 Главная', about: '📖 О нас', docs: '📚 Документы', contact: '📧 Контакты' },
      hu: { home: '🏠 Kezdőlap', about: '📖 Rólunk', docs: '📚 Dokumentumok', contact: '📧 Kapcsolat' },
      it: { home: '🏠 Home', about: '📖 Chi siamo', docs: '📚 Documenti', contact: '📧 Contatti' }
    };
    return translations[lang] || translations['es'];
  });

  public navTranslations = computed(() => {
    const lang = this.selectedLanguage();
    const translations: any = {
      es: {
        home: '🏠 Dashboard',
        about: '📖 Acerca',
        docs: '📚 Docs',
        contact: '📧 Contacto',
        sentinel: '🚨',
        settings: '⚙️'  // ✅ AGREGAR
      },
      en: {
        home: '🏠 Dashboard',
        about: '📖 About',
        docs: '📚 Docs',
        contact: '📧 Contact',
        sentinel: '🚨',
        settings: '⚙️'  // ✅ AGREGAR
      },
      fr: {
        home: '🏠 Dashboard',
        about: '📖 À propos',
        docs: '📚 Docs',
        contact: '📧 Contact',
        sentinel: '🚨',
        settings: '⚙️'  // ✅ AGREGAR
      },
      pt: {
        home: '🏠 Dashboard',
        about: '📖 Sobre',
        docs: '📚 Docs',
        contact: '📧 Contato',
        sentinel: '🚨',
        settings: '⚙️'  // ✅ AGREGAR
      },
      it: {
        home: '🏠 Dashboard',
        about: '📖 Chi siamo',
        docs: '📚 Documenti',
        contact: '📧 Contatti',
        sentinel: '🚨',
        settings: '⚙️'  // ✅ AGREGAR
      },
      ru: {
        home: '🏠 Dashboard',
        about: '📖 О нас',
        docs: '📚 Документы',
        contact: '📧 Контакты',
        sentinel: '🚨',
        settings: '⚙️'  // ✅ AGREGAR
      },
      hu: {
        home: '🏠 Dashboard',
        about: '📖 Rólunk',
        docs: '📚 Dokumentumok',
        contact: '📧 Kapcsolat',
        sentinel: '🚨',
        settings: '⚙️'  // ✅ AGREGAR
      },
      zh: {
        home: '🏠 Dashboard',
        about: '📖 关于',
        docs: '📚 文档',
        contact: '📧 联系',
        sentinel: '🚨',
        settings: '⚙️'  // ✅ AGREGAR
      },
      ko: {
        home: '🏠 Dashboard',
        about: '📖 정보',
        docs: '📚 문서',
        contact: '📧 연락처',
        sentinel: '🚨',
        settings: '⚙️'  // ✅ AGREGAR
      },
      hi: {
        home: '🏠 Dashboard',
        about: '📖 विवरण',
        docs: '📚 दस्तावेज़',
        contact: '📧 संपर्क',
        sentinel: '🚨',
        settings: '⚙️'  // ✅ AGREGAR
      }
    };
    return translations[lang] || translations['es'];
  });

  public footerTranslations = computed(() => {
    const lang = this.selectedLanguage();
    const translations: any = {
      es: { desc: 'Asistente multimodal para comunidades globales...', links: 'Enlaces', legal: 'Legal', tech: 'Tecnologías', made: 'Hecho con ❤️ para el mundo.', privacy: 'Política de Privacidad', terms: 'Términos de Uso' },
      en: { desc: 'Multimodal assistant for global communities...', links: 'Links', legal: 'Legal', tech: 'Technologies', made: 'Made with ❤️ for the world.', privacy: 'Privacy Policy', terms: 'Terms of Use' },
      fr: { desc: 'Assistant multimodal pour les communautés globales...', links: 'Liens', legal: 'Juridique', tech: 'Technologies', made: 'Fait con ❤️ pour le monde.', privacy: 'Politique de Confidentialité', terms: "Conditions d'Utilisation" },
      pt: { desc: 'Assistente multimodal para comunidades globais...', links: 'Links', legal: 'Legal', tech: 'Tecnologias', made: 'Feito com ❤️ para o mundo.', privacy: 'Política de Privacidade', terms: 'Termos de Uso' },
      // 🔥 NUEVOS IDIOMAS
      ru: { desc: 'Мультимодальный помощник для глобальных сообществ...', links: 'Ссылки', legal: 'Правовая информация', tech: 'Технологии', made: 'Сделано с ❤️ для мира.', privacy: 'Политика конфиденциальности', terms: 'Условия использования' },
      hu: { desc: 'Multimodális asszisztens globális közösségek számára...', links: 'Linkek', legal: 'Jogi', tech: 'Technológiák', made: '❤️-kal készült a világért.', privacy: 'Adatvédelmi irányelvek', terms: 'Felhasználási feltételek' },
      it: { desc: 'Assistente multimodale per comunità globali...', links: 'Link', legal: 'Legale', tech: 'Tecnologie', made: 'Fatto con ❤️ per il mondo.', privacy: 'Politica sulla privacy', terms: 'Termini di utilizzo' }
    };
    return translations[lang] || translations['es'];
  });

  // En app.component.ts
  public docsTranslations = computed(() => {
    const lang = this.selectedLanguage();
    const translations: any = {
      es: {
        title: '📚 DOCUMENTACIÓN_SISTEMA',
        subtitle: 'Vertex Intelligence Core | Manual Técnico',
        archTitle: 'ARQUITECTURA',
        archDesc: 'OracleAI corre en una arquitectura neural híbrida optimizada para dispositivos Edge.',
        setupTitle: 'DESPLIEGUE_RÁPIDO',
        setupReq: 'Requiere: 8GB RAM mínimo (RPi5 / Jetson Nano).',
        multiTitle: 'ENLACE_MULTIMODAL',
        multiDesc: 'El sistema soporta ingesta de datos en tiempo real vía:',
        offlineTitle: 'MODO_OFFLINE',
        offlineDesc: 'Cero internet requerido. El nodo actúa como un hub local comunitario vía LAN.'
      },
      en: {
        title: '📚 SYSTEM_DOCUMENTATION',
        subtitle: 'Vertex Intelligence Core | Technical Manual',
        archTitle: 'ARCHITECTURE',
        archDesc: 'OracleAI runs on a hybrid neural architecture optimized for edge devices.',
        setupTitle: 'RAPID_DEPLOYMENT',
        setupReq: 'Requires: 8GB RAM minimum (RPi5 / Jetson Nano).',
        multiTitle: 'MULTIMODAL_LINK',
        multiDesc: 'The system supports real-time data ingestion via:',
        offlineTitle: 'OFFLINE_MODE',
        offlineDesc: 'Zero internet required. The node acts as a local community hub via LAN.'
      },
      fr: {
        title: '📚 DOCUMENTATION_SYSTÈME',
        subtitle: 'Vertex Intelligence Core | Manuel Technique',
        archTitle: 'ARCHITECTURE',
        archDesc: 'OracleAI fonctionne sur une architecture neurale hybride optimisée pour les appareils Edge.',
        setupTitle: 'DÉPLOIEMENT_RAPIDE',
        setupReq: 'Requis: 8 Go de RAM minimum (RPi5 / Jetson Nano).',
        multiTitle: 'LIEN_MULTIMODAL',
        multiDesc: 'Le système prend en charge l\'ingestion de données en temps réel via:',
        offlineTitle: 'MODE_HORS_LIGNE',
        offlineDesc: 'Zéro internet requis. Le nœud agit comme un hub local via LAN.'
      },
      pt: {
        title: '📚 DOCUMENTAÇÃO_DO_SISTEMA',
        subtitle: 'Vertex Intelligence Core | Manual Técnico',
        archTitle: 'ARQUITETURA',
        archDesc: 'OracleAI opera em uma arquitetura neural híbrida otimizada para dispositivos Edge.',
        setupTitle: 'IMPLANTAÇÃO_RÁPIDA',
        setupReq: 'Requer: 8GB RAM mínimo (RPi5 / Jetson Nano).',
        multiTitle: 'LINK_MULTIMODAL',
        multiDesc: 'O sistema suporta ingestão de dados em tempo real via:',
        offlineTitle: 'MODO_OFFLINE',
        offlineDesc: 'Zero internet necessária. O nó atua como um hub local via LAN.'
      }
    };
    return translations[lang] || translations['es'];
  });

  // 📖 DICCIONARIO ABOUT (Vertex Mission Protocol)
  public aboutTranslations = computed(() => {
    const lang = this.selectedLanguage();
    const translations: any = {
      es: {
        title: 'ACERCA DE ORACLEAI',
        mission: 'MISIÓN Y PROPÓSITO',
        missionDesc: 'Empoderando comunidades remotas democratizando el acceso a educación y salud de alto nivel mediante Inteligencia Artificial offline, privada y local.',
        eduTitle: 'EDUCACIÓN',
        eduDesc: 'Tutoría multimodal para estudiantes. Resuelve matemáticas, gramática e historia sin conexión.',
        healthTitle: 'SALUD',
        healthDesc: 'Asistente de salud observacional. Analiza síntomas y genera reportes pedagógicos para el cuidado de mayores.',
        privTitle: 'PRIVACIDAD',
        privDesc: 'Procesamiento 100% Local. Sin servidores externos ni fugas de datos. Tu información no sale de tus paredes.',
        multiTitle: 'MULTILINGÜE',
        multiDesc: 'Soporte nativo para Español, Inglés, Francés y Portugués. Inclusión global real.',
        archTitle: 'ARQUITECTURA TÉCNICA',
        archDesc: 'OracleAI utiliza el modelo Gemma-4 para demostrar que la IA de vanguardia puede correr en hardware de $80.'
      },
      en: {
        title: 'ABOUT ORACLEAI',
        mission: 'MISSION & PURPOSE',
        missionDesc: 'Empowering remote communities by democratizing access to high-level education and preventive health through offline, private, and local AI.',
        eduTitle: 'EDUCATION',
        eduDesc: 'Multimodal tutoring for students. Solving math, grammar, and history—all without an internet connection.',
        healthTitle: 'HEALTH',
        healthDesc: 'Observational health assistant. Analyzes clinical symptoms and provides pedagogical medical reports.',
        privTitle: 'PRIVACY FIRST',
        privDesc: '100% Local Processing. No external servers, no data leaks. Your information stays within your walls.',
        multiTitle: 'MULTILINGUAL',
        multiDesc: 'Native support for Spanish, English, French, and Portuguese. Real global inclusivity.',
        archTitle: 'TECHNICAL ARCHITECTURE',
        archDesc: 'OracleAI utilizes the Gemma-4 model to prove that state-of-the-art AI can run on $80 hardware.'
      },
      fr: {
        title: 'À PROPOS D\'ORACLEAI',
        mission: 'MISSION ET OBJECTIF',
        missionDesc: 'Autonomiser les communautés isolées en démocratisant l\'accès à l\'éducation et à la santé grâce à une IA hors ligne et privée.',
        eduTitle: 'ÉDUCATION',
        eduDesc: 'Tutorat multimodal pour les étudiants. Résout les mathématiques et l\'histoire sans connexion internet.',
        healthTitle: 'SANTÉ',
        healthDesc: 'Assistant de santé observationnel. Analyse les symptômes et génère des rapports pour les soins des personnes âgées.',
        privTitle: 'CONFIDENTIALITÉ',
        privDesc: 'Traitement 100% local. Pas de serveurs externes, pas de fuites de données. Vos infos restent chez vous.',
        multiTitle: 'MULTILINGUE',
        multiDesc: 'Support natif pour l\'espagnol, l\'anglais, le français et le portugais. Inclusion mondiale.',
        archTitle: 'ARCHITECTURE TECHNIQUE',
        archDesc: 'OracleAI utilise le modèle Gemma-4 pour prouver que l\'IA de pointe peut fonctionner sur un matériel à 80$.'
      },
      pt: {
        title: 'SOBRE O ORACLEAI',
        mission: 'MISSÃO E PROPÓSITO',
        missionDesc: 'Capacitando comunidades remotas ao democratizar o acesso à educação e saúde por meio de IA offline e privada.',
        eduTitle: 'EDUCAÇÃO',
        eduDesc: 'Tutoria multimodal para alunos. Resolve matemática e história sem necessidade de internet.',
        healthTitle: 'SAÚDE',
        healthDesc: 'Assistente de saúde observacional. Analisa sintomas e gera relatórios pedagógicos para cuidados com idosos.',
        privTitle: 'PRIVACIDADE',
        privDesc: 'Processamento 100% Local. Sem servidores externos ou vazamento de dados. Sua informação não sai de casa.',
        multiTitle: 'MULTILÍNGUE',
        multiDesc: 'Suporte nativo para Espanhol, Inglês, Francês e Português. Inclusão global real.',
        archTitle: 'ARQUITETURA TÉCNICA',
        archDesc: 'OracleAI utiliza o modelo Gemma-4 para provar que a IA de ponta pode rodar em hardware de $80.'
      }
    };
    return translations[lang] || translations['es'];
  });

  // 📧 DICCIONARIO CONTACT (Vertex Communication Protocol)
  public contactTranslations = computed(() => {
    const lang = this.selectedLanguage();
    const translations: any = {
      es: {
        title: 'CONECTAR CON VIC',
        subtitle: 'Vertex Intelligence Core | Soporte Global',
        sendMsg: 'ENVIAR_MENSAJE.EXE',
        name: 'NOMBRE_REMITENTE',
        email: 'EMAIL_REMITENTE',
        body: 'CUERPO_MENSAJE',
        btn: 'TRANSMITIR_MENSAJE',
        sending: 'CARGANDO_DATOS...',
        success: 'DATOS_RECIBIDOS: Gracias, brother. Responderemos pronto.',
        error: 'FALLO_TRANSMISIÓN: El servidor no respondió.'
      },
      en: {
        title: 'CONNECT WITH VIC',
        subtitle: 'Vertex Intelligence Core | Global Support',
        sendMsg: 'SEND_MESSAGE.EXE',
        name: 'SENDER_NAME',
        email: 'SENDER_EMAIL',
        body: 'MESSAGE_BODY',
        btn: 'TRANSMIT_MESSAGE',
        sending: 'UPLOADING_DATA...',
        success: 'DATA_RECEIVED: Thanks, brother. We will reply soon.',
        error: 'UPLOAD_FAILED: Server did not respond.'
      },
      fr: {
        title: 'CONTACTER VIC',
        subtitle: 'Vertex Intelligence Core | Support Mondial',
        sendMsg: 'ENVOYER_MESSAGE.EXE',
        name: 'NOM_EXPÉDITEUR',
        email: 'EMAIL_EXPÉDITEUR',
        body: 'CORPS_DU_MESSAGE',
        btn: 'TRANSMETTRE_MESSAGE',
        sending: 'ENVOI_DONNÉES...',
        success: 'DONNÉES_REÇUES: Merci, mon ami. Nous répondrons bientôt.',
        error: 'ÉCHEC_ENVOI: Le serveur n\'a pas répondu.'
      },
      pt: {
        title: 'CONECTAR COM VIC',
        subtitle: 'Vertex Intelligence Core | Suporte Global',
        sendMsg: 'ENVIAR_MENSAGEM.EXE',
        name: 'NOME_REMETENTE',
        email: 'EMAIL_REMETENTE',
        body: 'CORPO_MENSAGEM',
        btn: 'TRANSMITIR_MENSAGEM',
        sending: 'ENVIANDO_DADOS...',
        success: 'DADOS_RECEBIDOS: Obrigado, brother. Responderemos em breve.',
        error: 'FALHA_NA_TRANSMISSÃO: O servidor não respondeu.'
      }
    };
    return translations[lang] || translations['es'];
  });

  // En app.component.ts
  public dashboardTranslations = computed(() => {
    const lang = this.selectedLanguage();
    const translations: any = {
      es: {
        who: '👤 ¿Quién usa OracleAI hoy?',
        roles: { child: 'Niño/a', elder: 'Adulto Mayor', carer: 'Cuidador/a', parent: 'Papa', aunt: 'Tia' },
        stats: { edu: 'Consultas Educación', health: 'Consultas Salud', docs: 'Documentos', time: 'Tiempo promedio' },
        agentsTitle: '🎯 Agentes Especialistas',
        agentsSub: 'Inteligencia especializada para cada necesidad mundial',
        categories: {
          education_sciences: '📚 EDUCACIÓN Y CIENCIAS',
          health_wellness: '🏥 SALUD Y BIENESTAR',
          culture_humanities: '🎨 CULTURA Y HUMANIDADES',
          personal_dev: '💼 DESARROLLO PERSONAL',
          daily_life: '🍳 VIDA DIARIA',
          accessibility: '♿ ACCESIBILIDAD'
        },
        modes: { edu: '🎓 Modo Educación', health: '🏥 Modo Salud', history: '📜 Ver Historial' },
        names: {
          math: 'Matemáticas', lang: 'Lenguaje', code: 'Programación', geo: 'Geografía', health: 'Salud General', mental: 'Salud Mental', nut: 'Nutrición', art: 'Artes', hist: 'Historia', cul: 'Cultura', sport: 'Deportes', news: 'Noticias', asl: 'Intérprete ASL', novelist: 'Narrador Pro', blind_guide: 'Guía de Ciegos', philosophy: 'Filosofía',
          theology: 'Teología',
          archaeology: 'Arqueología',
          coach: 'Entrenador',
          mentor: 'Guía/Mentor',
          tutor: 'Tutor/Profesor',
          counselor: 'Consejero',
          rabbi: 'Rabino/Erudito',
          physics: 'Física',
          chemistry: 'Química',
          biology: 'Biología',
          chef: 'Chef/Cocinero',
          finance: 'Economía/Finanzas'
        },
        descs: {
          math: 'Lógica y números', lang: 'Gramática y lectura', code: 'Lógica de código', geo: 'Mundo y culturas', health: 'Prevención básica', mental: 'Apoyo emocional', nut: 'Dietas saludables', art: 'Creatividad', hist: 'Arqueología digital', cul: 'Tradiciones del mundo', sport: 'Análisis y noticias', news: 'Actualidad mundial', asl: 'Traductor de señas a voz', novelist: 'Descripción artística de escenas', blind_guide: 'Asistencia visual y detección de obstáculos', philosophy: 'Cuestionamiento existencial y ética',
          theology: 'Estudios religiosos y espiritualidad',
          archaeology: 'Civilizaciones antiguas y artefactos',
          coach: 'Motivación y disciplina personal',
          mentor: 'Orientación profesional y de vida',
          tutor: 'Enseñanza personalizada y paciencia',
          counselor: 'Escucha activa y apoyo emocional',
          rabbi: 'Textos sagrados y tradiciones',
          physics: 'Leyes del universo y materia',
          chemistry: 'Elementos y reacciones',
          biology: 'Vida y organismos',
          chef: 'Técnicas y recetas culinarias',
          finance: 'Ahorro e inversión'
        },
      },
      en: {
        who: '👤 Who is using OracleAI today?',
        roles: { child: 'Child', elder: 'Elder', carer: 'Caregiver', parent: 'Dad', aunt: 'Aunt' },
        stats: { edu: 'Education Queries', health: 'Health Queries', docs: 'Documents', time: 'Avg. Time' },
        agentsTitle: '🎯 Specialist Agents',
        agentsSub: 'Specialized intelligence for every global need',
        categories: {
          education_sciences: '📚 EDUCATION & SCIENCES',
          health_wellness: '🏥 HEALTH & WELLNESS',
          culture_humanities: '🎨 CULTURE & HUMANITIES',
          personal_dev: '💼 PERSONAL DEVELOPMENT',
          daily_life: '🍳 DAILY LIFE',
          accessibility: '♿ ACCESSIBILITY'
        },

        modes: { edu: '🎓 Education Mode', health: '🏥 Health Mode', history: '📜 View History' },
        names: {
          math: 'Mathematics', lang: 'Language', code: 'Programming', geo: 'Geography', health: 'General Health', mental: 'Mental Health', nut: 'Nutrition', art: 'Arts', hist: 'History', cul: 'Culture', sport: 'Sports', news: 'News', asl: 'ASL Interpreter', novelist: 'Pro Narrator', blind_guide: 'Blind Guide', philosophy: 'Philosophy',
          theology: 'Theology',
          archaeology: 'Archaeology',
          coach: 'Coach',
          mentor: 'Guide/Mentor',
          tutor: 'Tutor/Professor',
          counselor: 'Counselor',
          rabbi: 'Rabbi/Scholar',
          physics: 'Physics',
          chemistry: 'Chemistry',
          biology: 'Biology',
          chef: 'Chef/Cook',
          finance: 'Economics/Finance'
        },
        descs: {
          math: 'Logic and numbers', lang: 'Grammar and reading', code: 'Coding logic', geo: 'World and cultures', health: 'Basic prevention', mental: 'Emotional support', nut: 'Healthy diets', art: 'Creativity', hist: 'Digital archaeology', cul: 'World traditions', sport: 'Analysis and news', news: 'World current affairs', asl: 'Sign language to voice', novelist: 'Artistic scene description', blind_guide: 'Visual assistance and obstacle detection', philosophy: 'Existential questioning and ethics',
          theology: 'Religious studies and spirituality',
          archaeology: 'Ancient civilizations and artifacts',
          coach: 'Motivation and personal discipline',
          mentor: 'Professional and life guidance',
          tutor: 'Personalized teaching and patience',
          counselor: 'Active listening and emotional support',
          rabbi: 'Sacred texts and traditions',
          physics: 'Laws of the universe and matter',
          chemistry: 'Elements and reactions',
          biology: 'Life and organisms',
          chef: 'Culinary techniques and recipes',
          finance: 'Saving and investing'

        }
      },
      fr: {
        who: '👤 Qui utilise OracleAI aujourd\'hui ?',
        roles: { child: 'Enfant', elder: 'Aîné', carer: 'Soignant', parent: 'Papa', aunt: 'Tante' },
        stats: { edu: 'Requêtes Éducation', health: 'Requêtes Santé', docs: 'Documents', time: 'Temps moyen' },
        agentsTitle: '🎯 Agents Spécialisés',
        agentsSub: 'Intelligence spécialisée pour chaque besoin mondial',
        categories: {
          education_sciences: '📚 ÉDUCATION & SCIENCES',
          health_wellness: '🏥 SANTÉ & BIEN-ÊTRE',
          culture_humanities: '🎨 CULTURE & HUMANITÉS',
          personal_dev: '💼 DÉVELOPPEMENT PERSONNEL',
          daily_life: '🍳 VIE QUOTIDIENNE',
          accessibility: '♿ ACCESSIBILITÉ'
        },

        modes: { edu: '🎓 Mode Éducation', health: '🏥 Mode Santé', history: '📜 Voir l\'Historique' },
        names: {
          math: 'Mathématiques', lang: 'Langage', code: 'Programmation', geo: 'Géographie', health: 'Santé Générale', mental: 'Santé Mentale', nut: 'Nutrition', art: 'Arts', hist: 'Histoire', cul: 'Culture', sport: 'Sports', news: 'Actualités', asl: 'Interprète ASL', novelist: 'Narrateur Pro', blind_guide: 'Guide pour Aveugles', philosophy: 'Philosophie',
          theology: 'Théologie',
          archaeology: 'Archéologie',
          coach: 'Entraîneur',
          mentor: 'Guide/Mentor',
          tutor: 'Tuteur/Professeur',
          counselor: 'Conseiller',
          rabbi: 'Rabbin/Érudit',
          physics: 'Physique',
          chemistry: 'Chimie',
          biology: 'Biologie',
          chef: 'Chef/Cuisinier',
          finance: 'Économie/Finance'
        },
        descs: {
          math: 'Logique et nombres', lang: 'Grammaire et lecture', code: 'Logique de code', geo: 'Monde et cultures', health: 'Prévention de base', mental: 'Soutien émotionnel', nut: 'Régimes sains', art: 'Créativité', hist: 'Archéologie numérique', cul: 'Traditions du monde', sport: 'Analyse et nouvelles', news: 'Actualité mondiale', asl: 'Langue des signes en voix', novelist: 'Description artistique de scènes', blind_guide: 'Assistance visuelle et détection d\'obstacles', philosophy: 'Questionnement existentiel et éthique',
          theology: 'Études religieuses et spiritualité',
          archaeology: 'Civilisations anciennes et artefacts',
          coach: 'Motivation et discipline personnelle',
          mentor: 'Orientation professionnelle et de vie',
          tutor: 'Enseignement personnalisé et patience',
          counselor: 'Écoute active et soutien émotionnel',
          rabbi: 'Textes sacrés et traditions',
          physics: 'Physique',
          chemistry: 'Chimie',
          biology: 'Biologie',
          chef: 'Chef/Cuisinier',
          finance: 'Économie/Finance'


        }
      },
      pt: {
        who: '👤 Quem está usando o OracleAI hoje?',
        roles: { child: 'Criança', elder: 'Idoso', carer: 'Cuidador', parent: 'Pai', aunt: 'Tia' },
        stats: { edu: 'Consultas Educação', health: 'Consultas Saúde', docs: 'Documentos', time: 'Tempo médio' },
        agentsTitle: '🎯 Agentes Especialistas',
        agentsSub: 'Inteligência especializada para cada necessidade mundial',
        categories: {
          education_sciences: '📚 EDUCAÇÃO & CIÊNCIAS',
          health_wellness: '🏥 SAÚDE & BEM-ESTAR',
          culture_humanities: '🎨 CULTURA & HUMANIDADES',
          personal_dev: '💼 DESENVOLVIMENTO PESSOAL',
          daily_life: '🍳 VIDA DIÁRIA',
          accessibility: '♿ ACESSIBILIDADE'
        },
        modes: { edu: '🎓 Modo Educação', health: '🏥 Modo Saúde', history: '📜 Ver Histórico' },
        names: {
          math: 'Matemática', lang: 'Linguagem', code: 'Programação', geo: 'Geografia', health: 'Saúde Geral', mental: 'Saúde Mental', nut: 'Nutrição', art: 'Artes', hist: 'História', cul: 'Cultura', sport: 'Esportes', news: 'Notícias', asl: 'Intérprete ASL', novelist: 'Narrador Pro', blind_guide: 'Guia para Cegos', philosophy: 'Filosofia',
          theology: 'Teologia',
          archaeology: 'Arqueologia',
          coach: 'Treinador',
          mentor: 'Guia/Mentor',
          tutor: 'Tutor/Professor',
          counselor: 'Conselheiro',
          rabbi: 'Rabino/Erudito',
          physics: 'Física',
          chemistry: 'Química',
          biology: 'Biologia',
          chef: 'Chef/Cozinheiro',
          finance: 'Economia/Finanças'


        },
        descs: {
          math: 'Lógica e números', lang: 'Gramática e leitura', code: 'Lógica de código', geo: 'Mundo e culturas', health: 'Prevenção básica', mental: 'Apoio emocional', nut: 'Dietas saudáveis', art: 'Criatividade', hist: 'Arqueologia digital', cul: 'Tradições do mundo', sport: 'Análise e notícias', news: 'Atualidades mundiais', asl: 'Tradutor de sinais para voz', novelist: 'Descrição artística de cenas', blind_guide: 'Assistência visual e detecção de obstáculos', philosophy: 'Questionamento existencial e ética',
          theology: 'Estudos religiosos e espiritualidade',
          archaeology: 'Civilizações antigas e artefatos',
          coach: 'Motivação e disciplina pessoal',
          mentor: 'Orientação profissional e de vida',
          tutor: 'Ensino personalizado e paciência',
          counselor: 'Escuta ativa e apoio emocional',
          rabbi: 'Textos sagrados e tradições',
          physics: 'Leis do universo e matéria',
          chemistry: 'Elementos e reações',
          biology: 'Vida e organismos',
          chef: 'Técnicas e receitas culinárias',
          finance: 'Poupança e investimento'
        }
      },
      zh: {
        who: '👤 谁在使用 OracleAI？',
        roles: { child: '孩子', elder: '老人', carer: '护理人员', parent: '父亲', aunt: '阿姨' },
        stats: { edu: '教育咨询', health: '健康咨询', docs: '文档', time: '平均时间' },
        agentsTitle: '🎯 专家代理',
        agentsSub: '为每种全球需求提供专业化智能',
        categories: {
          education_sciences: '📚 教育与科学',
          health_wellness: '🏥 健康与保健',
          culture_humanities: '🎨 文化与人文',
          personal_dev: '💼 个人发展',
          daily_life: '🍳 日常生活',
          accessibility: '♿ 无障碍'
        },

        modes: { edu: '🎓 教育模式', health: '🏥 健康模式', history: '📜 查看历史' },
        names: {
          math: '数学', lang: '语言', code: '编程', geo: '地理', health: '健康', mental: '心理健康', nut: '营养', art: '艺术', hist: '历史', cul: '文化', sport: '体育', news: '新闻', asl: '手语翻译', novelist: '专业叙述者', blind_guide: '盲人向导', philosophy: 'Philosophy',
          theology: 'Theology',
          archaeology: 'Archaeology',
          coach: 'Coach',
          mentor: 'Mentor',
          tutor: 'Tutor',
          counselor: 'Counselor',
          rabbi: 'Rabbi',
          physics: '物理学',
          chemistry: '化学',
          biology: '生物学',
          chef: '厨师',
          finance: '经济学/金融'
        },
        descs: {
          math: '逻辑与数字', lang: '语法与阅读', code: '代码逻辑', geo: '世界与文化', health: '基础预防', mental: '情感支持', nut: '健康饮食', art: '创造力', hist: '数字考古', cul: '世界传统', sport: '分析与新闻', news: '全球时事', asl: '手语转语音', novelist: '艺术化的场景描述', blind_guide: '视觉辅助和障碍物检测', philosophy: '存在主义质疑和伦理学', theology: '宗教研究与灵性', archaeology: '古代文明与文物', coach: '动机和个人纪律', mentor: '职业和生活指导', tutor: '个性化教学和耐心', counselor: '积极倾听和情感支持', rabbi: '圣经文本和传统', physics: '宇宙定律与物质',
          chemistry: '元素与反应',
          biology: '生命与有机体',
          chef: '烹饪技巧与食谱',
          finance: '储蓄与投资'
        }
      },
      ko: {
        who: '👤 누가 OracleAI를 사용하나요?',
        roles: { child: '어린이', elder: '노인', carer: '간병인', parent: '아버지', aunt: '이모' },
        stats: { edu: '교육 문의', health: '건강 문의', docs: '문서', time: '평균 시간' },
        agentsTitle: '🎯 전문가 에이전트',
        agentsSub: '모든 글로벌 요구를 위한 특화된 지능',
        categories: {
          education_sciences: '📚 교육 및 과학',
          health_wellness: '🏥 건강 및 웰빙',
          culture_humanities: '🎨 문화 및 인문학',
          personal_dev: '💼 개인 발전',
          daily_life: '🍳 일상 생활',
          accessibility: '♿ 접근성'
        },
        modes: { edu: '🎓 교육 모드', health: '🏥 건강 모드', history: '📜 기록 보기' },
        names: {
          math: '수학', lang: '언어', code: '프로그래밍', geo: '지리', health: '건강', mental: '정신 건강', nut: '영양', art: '예술', hist: '역사', cul: '문화', sport: '스포츠', news: '뉴스', asl: '수어 통역사', novelist: '전문 내레이터', blind_guide: '시각장애인 안내', philosophy: '철학', theology: '신학', archaeology: '고고학', coach: '코치', mentor: '멘토', tutor: '튜터', counselor: '상담사', rabbi: '랍비', physics: '물리학',
          chemistry: '화학',
          biology: '생물학',
          chef: '요리사',
          finance: '경제/금융'
        },
        descs: {
          math: '논리와 숫자', lang: '문법과 읽기', code: '코딩 논리', geo: '세계와 문화', health: '기본 예방', mental: '정서적 지원', nut: '건강한 식단', art: '창의성', hist: '디지털 고고학', cul: '세계 전통', sport: '분석 및 뉴스', news: '세계 뉴스', asl: '수어를 음성으로 변환', novelist: '예술적 장면 묘사', blind_guide: '시각 보조 및 장애물 감지', philosophy: '철학적 질문과 윤리학', theology: '종교 연구와 영성', archaeology: '고대 문명과 유물', coach: '동기 부여와 개인 규율', mentor: '직업 및 생활 지도', tutor: '개인화된 교육과 인내', counselor: '적극적 경청과 정서적 지원', rabbi: '성경 텍스트와 전통', physics: '우주의 법칙과 물질',
          chemistry: '원소와 반응',
          biology: '생명과 유기체',
          chef: '요리 기술 및 레시피',
          finance: '저축 및 투자'
        }
      },
      hi: {
        who: '👤 आज OracleAI का उपयोग कौन कर रहा है?',
        roles: { child: 'बच्चा', elder: 'बुजुर्ग', carer: 'देखभाल करने वाला', parent: 'पिता', aunt: 'चाची' },
        stats: { edu: 'शिक्षा प्रश्न', health: 'स्वास्थ्य प्रश्न', docs: 'दस्तावेज़', time: 'औसत समय' },
        agentsTitle: '🎯 विशेषज्ञ एजेंट',
        agentsSub: 'हर वैश्विक आवश्यकता के लिए विशेषज्ञ बुद्धिमत्ता',
        categories: {
          education_sciences: '📚 शिक्षा और विज्ञान',
          health_wellness: '🏥 स्वास्थ्य और कल्याण',
          culture_humanities: '🎨 संस्कृति और मानविकी',
          personal_dev: '💼 व्यक्तिगत विकास',
          daily_life: '🍳 दैनिक जीवन',
          accessibility: '♿ पहुंच'
        },
        modes: { edu: '🎓 शिक्षा मोड', health: '🏥 स्वास्थ्य मोड', history: '📜 इतिहास देखें' },
        names: {
          math: 'गणित', lang: 'भाषा', code: 'कोडिंग', geo: 'भूगोल', health: 'स्वास्थ्य', mental: 'मानसिक स्वास्थ्य', nut: 'पोषण', art: 'कला', hist: 'इतिहास', cul: 'संस्कृति', sport: 'खेल', news: 'समाचार', asl: 'एएसएल दुभाषिया', novelist: 'प्रो कथावाचक', blind_guide: 'ब्लाइंड गाइड', philosophy: 'दर्शनशास्त्र', theology: 'धर्मशास्त्र', archaeology: 'पुरातत्व', coach: 'कोच', mentor: 'गाइड/मेंटोर', tutor: 'ट्यूटर/प्रोफेसर', counselor: 'सलाहकार', rabbi: 'रब्बी/विद्वान', physics: 'भौतिक विज्ञान',
          chemistry: 'रसायन विज्ञान',
          biology: 'जीव विज्ञान',
          chef: 'बावर्ची',
          finance: 'अर्थशास्त्र/वित्त'
        },
        descs: {
          math: 'तर्क और संख्याएँ', lang: 'व्याकरण और पठन', code: 'कोडिंग तर्क', geo: 'दुनिया और संस्कृतियाँ', health: 'बुनियादी रोकथाम', mental: 'भावनात्मक समर्थन', nut: 'स्वस्थ आहार', art: 'रचनात्मकता', hist: 'डिजital पुरातत्व', cul: 'विश्व परंपराएँ', sport: 'विश्लेषण और समाचार', news: 'वैश्विक समाचार', asl: 'सांकेतिक भाषा से आवाज', novelist: 'कलात्मक दृश्य विवरण', blind_guide: 'दृश्य सहायता और बाधा का पता लगाना', philosophy: 'अस्तित्ववादी प्रश्न और नैतिकता', theology: 'धार्मिक अध्ययन और आध्यात्मिकता', archaeology: 'प्राचीन सभ्यताएं और कलाकृतियां', coach: 'प्रेरणा और व्यक्तिगत अनुशासन', mentor: 'व्यावसायिक और जीवन मार्गदर्शन', tutor: 'व्यक्तिगत शिक्षण और धैर्य', counselor: 'सक्रिय सुनवाई और भावनात्मक समर्थन', rabbi: 'पवित्र ग्रंथ और परंपराएं', physics: 'ब्रह्मांड और पदार्थ के नियम',
          chemistry: 'तत्व और प्रतिक्रियाएं',
          biology: 'जीवन और जीव',
          chef: 'पाक तकनीक और व्यंजन',
          finance: 'बचत और निवेश'
        }
      },
      ru: {
        who: '👤 Кто использует OracleAI сегодня?',
        roles: { child: 'Ребенок', elder: 'Пожилой', carer: 'Опекун', parent: 'Отец', aunt: 'Тетя' },
        stats: { edu: 'Образовательные запросы', health: 'Медицинские запросы', docs: 'Документы', time: 'Среднее время' },
        agentsTitle: '🎯 Специализированные агенты',
        agentsSub: 'Специализированный интеллект для каждой глобальной потребности',
        categories: {
          education_sciences: '📚 ОБРАЗОВАНИЕ & НАУКИ',
          health_wellness: '🏥 ЗДОРОВЬЕ & БЛАГОПОЛУЧИЕ',
          culture_humanities: '🎨 КУЛЬТУРА & ГУМАНИТАРНЫЕ НАУКИ',
          personal_dev: '💼 ЛИЧНОСТНОЕ РАЗВИТИЕ',
          daily_life: '🍳 ПОВСЕДНЕВНАЯ ЖИЗНЬ',
          accessibility: '♿ ДОСТУПНОСТЬ'
        },
        modes: { edu: '🎓 Образовательный режим', health: '🏥 Медицинский режим', history: '📜 История' },
        names: { math: 'Математика', lang: 'Язык', code: 'Программирование', geo: 'География', health: 'Здоровье', mental: 'Психическое здоровье', nut: 'Питание', art: 'Искусство', hist: 'История', cul: 'Культура', sport: 'Спорт', news: 'Новости', asl: 'Переводчик ASL', novelist: 'Про-рассказчик', blind_guide: 'Поводырь', philosophy: 'Философия', theology: 'Теология', archaeology: 'Археология', coach: 'Тренер', mentor: 'Наставник', tutor: 'Репетитор', counselor: 'Советник', rabbi: 'Раввин/Ученый',physics: 'Физика',
chemistry: 'Химия',
biology: 'Биология',
chef: 'Шеф-повар',
finance: 'Экономика/Финансы'  },
        descs: { math: 'Логика и числа', lang: 'Грамматика и чтение', code: 'Логика кода', geo: 'Мир и культуры', health: 'Базовая профилактика', mental: 'Эмоциональная поддержка', nut: 'Здоровое питание', art: 'Творчество', hist: 'Цифровая археология', cul: 'Мировые традиции', sport: 'Анализ и новости', news: 'Мировые события', asl: 'Перевод жестового языка в голос', novelist: 'Художественное описание сцен', blind_guide: 'Визуальная помощь и обнаружение препятствий', philosophy: 'Философские вопросы и этика', theology: 'Религиозные исследования и духовность', archaeology: 'Древние цивилизации и артефакты', coach: 'Мотивация и личная дисциплина', mentor: 'Профессиональное и жизненное наставничество', tutor: 'Индивидуальное обучение и терпение', counselor: 'Активное слушание и эмоциональная поддержка', rabbi: 'Священные тексты и традиции',physics: 'Законы вселенной и материи',
chemistry: 'Элементы и реакции',
biology: 'Жизнь и организмы',
chef: 'Кулинарные техники и рецепты',
finance: 'Сбережения и инвестиции'  }
      },
      hu: {
        who: '👤 Ki használja ma az OracleAI-t?',
        roles: { child: 'Gyermek', elder: 'Idős', carer: 'Gondozó', parent: 'Apa', aunt: 'Néni' },
        stats: { edu: 'Oktatási lekérdezések', health: 'Egészségügyi lekérdezések', docs: 'Dokumentumok', time: 'Átlagidő' },
        agentsTitle: '🎯 Szakértői ágensek',
        agentsSub: 'Speciális intelligencia minden globális igényhez',
        categories: {
          education_sciences: '📚 OKTATÁS & TUDOMÁNYOK',
          health_wellness: '🏥 EGÉSZSÉG & JÓLLÉT',
          culture_humanities: '🎨 KULTÚRA & BÖLCSÉSZET',
          personal_dev: '💼 SZEMÉLYES FEJLŐDÉS',
          daily_life: '🍳 MINDENNAPI ÉLET',
          accessibility: '♿ AKADÁLYMENTESSÉG'
        },
        modes: { edu: '🎓 Oktatási mód', health: '🏥 Egészségügyi mód', history: '📜 Előzmények' },
        names: { math: 'Matematika', lang: 'Nyelv', code: 'Programozás', geo: 'Földrajz', health: 'Egészség', mental: 'Mentális egészség', nut: 'Táplálkozás', art: 'Művészet', hist: 'Történelem', cul: 'Kultúra', sport: 'Sport', news: 'Hírek', asl: 'ASL Tolmács', novelist: 'Pro Narrátor', blind_guide: 'Vakvezető', philosophy: 'Filozófia', theology: 'Teológia', archaeology: 'Archeológia', coach: 'Edző', mentor: 'Mentor', tutor: 'Tutor', counselor: 'Tanácsadó', rabbi: 'Rabbik', physics: 'Fizika',
chemistry: 'Kémia',
biology: 'Biológia',
chef: 'Szakács',
finance: 'Közgazdaságtan/Pénzügy' },
        descs: { math: 'Logika és számok', lang: 'Nyelvtan és olvasás', code: 'Kódolási logika', geo: 'Világ és kultúrák', health: 'Alapvető megelőzés', mental: 'Érzelmi támogatás', nut: 'Egészséges étrend', art: 'Kreativitás', hist: 'Digitális régészet', cul: 'Világhagyományok', sport: 'Elemzés és hírek', news: 'Világesemények', asl: 'Jelbeszéd hanggá alakítása', novelist: 'Művészi jelenetleírás', blind_guide: 'Vizuális segítség és akadályfelismerés', philosophy: 'Létezés kérdései és etika', theology: 'Vallási tanulmányok és spiritualitás', archaeology: 'Ősi civilizációk és műtárgyak', coach: 'Motiváció és személyes fegyelem', mentor: 'Szakmai és életvezetési útmutatás', tutor: 'Személyre szabott tanítás és türelem', counselor: 'Aktív hallgatás és érzelmi támogatás', rabbi: 'Szent szövegek és hagyományok', physics: 'Világegyetem törvényei és anyag',
chemistry: 'Elemek és reakciók',
biology: 'Élet és szervezetek',
chef: 'Főzési technikák és receptek',
finance: 'Megtakarítás és befektetés' }
      },
      it: {
        who: '👤 Chi sta usando OracleAI oggi?',
        roles: { child: 'Bambino', elder: 'Anziano', carer: 'Badante', parent: 'Papà', aunt: 'Zia' },
        stats: { edu: 'Query educative', health: 'Query sanitarie', docs: 'Documenti', time: 'Tempo medio' },
        agentsTitle: '🎯 Agenti specializzati',
        agentsSub: 'Inteligenza specializada per ogni esigenza globale',
        categories: {
          education_sciences: '📚 ISTRUZIONE & SCIENZE',
          health_wellness: '🏥 SALUTE & BENESSERE',
          culture_humanities: '🎨 CULTURA & UMANISTICA',
          personal_dev: '💼 SVILUPPO PERSONALE',
          daily_life: '🍳 VITA QUOTIDIANA',
          accessibility: '♿ ACCESSIBILITÀ'
        },
        modes: { edu: '🎓 Modalità Educazione', health: '🏥 Modalità Salute', history: '📜 Cronologia' },
        names: { math: 'Matematica', lang: 'Linguaggio', code: 'Programmazione', geo: 'Geografia', health: 'Salute', mental: 'Salute mentale', nut: 'Nutrizione', art: 'Arte', hist: 'Storia', cul: 'Cultura', sport: 'Sport', news: 'Notizie', asl: 'Interprete ASL', novelist: 'Narratore Pro', blind_guide: 'Guida per Ciechi', philosophy: 'Filosofia', theology: 'Teologia', archaeology: 'Archeologia', coach: 'Allenatore', mentor: 'Mentore', tutor: 'Tutor', counselor: 'Consigliere', rabbi: 'Rabbino/Studioso' , physics: 'Fisica',
chemistry: 'Chimica',
biology: 'Biologia',
chef: 'Chef/Cuoco',
finance: 'Economia/Finanza'},
        descs: { math: 'Logica e numeri', lang: 'Grammatica e lettura', code: 'Logica di programmazione', geo: 'Mondo e culture', health: 'Prevenzione di base', mental: 'Supporto emotivo', nut: 'Dieta sana', art: 'Creatività', hist: 'Archeologia digitale', cul: 'Tradizioni mondiali', sport: 'Analisi e notizie', news: 'Attualità mondiale', asl: 'Lingua dei segni in voce', novelist: 'Descrizione artistica delle scene', blind_guide: 'Assistenza visiva e rilevamento ostacoli', philosophy: 'Questioni esistenziali ed etica', theology: 'Studi religiosi e spiritualità', archaeology: 'Civiltà antiche e reperti', coach: 'Motivazione e disciplina personale', mentor: 'Guida professionale e di vita', tutor: 'Insegnamento personalizzato e pazienza', counselor: 'Ascolto attivo e supporto emotivo', rabbi: 'Testi sacri e tradizioni' , physics: 'Leggi dell\'universo e materia',
chemistry: 'Elementi e reazioni',
biology: 'Vita e organismi',
chef: 'Tecniche culinarie e ricette',
finance: 'Risparmio e investimento'}
      }
    };
    return translations[lang] || translations['es'];
  });

  // En app.component.ts
  public playgroundTranslations = computed(() => {
    const lang = this.selectedLanguage();
    const translations: any = {
      es: {
        ready: 'LISTO_PARA_TRANSMISIÓN',
        analyzing: 'ANALIZANDO_VIDEO_STREAM...',
        thinking: 'PROCESANDO_RED_NEURAL...',
        inputPlaceholder: 'Escribe un comando o pregunta...',
        btnAnalyze: 'ANALIZAR VIDEO 👁️',
        btnExecute: 'EJECUTAR ANÁLISIS 🚀',
        listen: 'ESCUCHAR',
        logsTitle: 'LOGS_RAZONAMIENTO_NEURAL',
        verdictTitle: 'VEREDICTO_CORE'
      },
      en: {
        ready: 'READY_FOR_STREAMING',
        analyzing: 'ANALYZING_VIDEO_STREAM...',
        thinking: 'PROCESSING_NEURAL_NETWORK...',
        inputPlaceholder: 'Type a command or question...',
        btnAnalyze: 'ANALYZE VIDEO 👁️',
        btnExecute: 'EXECUTE ANALYSIS 🚀',
        listen: 'LISTEN',
        logsTitle: 'NEURAL_REASONING_LOGS',
        verdictTitle: 'VERDICT_CORE'
      },
      fr: {
        ready: 'PRÊT_POUR_LE_STREAMING',
        analyzing: 'ANALYSE_DU_FLUX_VIDÉO...',
        thinking: 'TRAITEMENT_RÉSEAU_NEURAL...',
        inputPlaceholder: 'Tapez une commande ou question...',
        btnAnalyze: 'ANALYSER VIDÉO 👁️',
        btnExecute: 'EXÉCUTER L\'ANALYSE 🚀',
        listen: 'ÉCOUTER',
        logsTitle: 'LOGS_DE_RAISONNEMENT',
        verdictTitle: 'VERDICT_DU_NOYAU'
      }
    };
    return translations[lang] || translations['es'];
  });


  // 📜 DICCIONARIO HISTORIAL (Vertex Archive Protocol)
  public historyTranslations = computed(() => {
    const lang = this.selectedLanguage();
    const translations: any = {
      es: {
        title: '📜 Historial de conversaciones',
        clearBtn: '🗑️ Limpiar todo',
        loading: 'Cargando historial...',
        empty: 'Aún no hay conversaciones guardadas',
        startBtn: '🎮 Comenzar ahora',
        backBtn: '← Volver al Dashboard',
        stats: {
          edu: 'consultas educación',
          health: 'consultas salud',
          docs: 'documentos procesados'
        },
        confirmClear: '¿Estás seguro de que quieres borrar todo el historial?',
        time: {
          justNow: 'Hace unos minutos',
          hours: 'Hace {{h}} horas'
        }
      },
      en: {
        title: '📜 Conversation History',
        clearBtn: '🗑️ Clear all',
        loading: 'Loading history...',
        empty: 'No saved conversations yet',
        startBtn: '🎮 Start now',
        backBtn: '← Back to Dashboard',
        stats: {
          edu: 'education queries',
          health: 'health queries',
          docs: 'processed documents'
        },
        confirmClear: 'Are you sure you want to clear all history?',
        time: {
          justNow: 'A few minutes ago',
          hours: '{{h}} hours ago'
        }
      }
    };
    return translations[lang] || translations['en'];
  });


  // 👁️ DICCIONARIO VISIÓN (Vertex Vision Protocol)
  // 👁️ DICCIONARIO VISIÓN BLINDADO (Vertex Localization Protocol)
  public visionTranslations = computed(() => {
    const lang = this.selectedLanguage();
    const translations: any = {
      es: {
        title: 'VISIÓN SOSTENIDA ASISTIDA',
        subtitle: 'Vertex Intelligence Core | Análisis visual en tiempo real',
        statusActive: 'VISIÓN ACTIVA',
        statusInactive: 'VISIÓN INACTIVA',
        cameraInactive: 'Cámara inactiva',
        btnActivate: 'ACTIVAR CÁMARA',
        btnDeactivate: 'DESACTIVAR',
        analyzing: 'ANALIZANDO...',
        btnContinuous: 'INICIAR VISIÓN CONTINUA',
        btnStop: 'DETENER',
        btnCapture: 'CAPTURAR Y ANALIZAR (TEST)',
        history: 'HISTORIAL DE DESCRIPCIONES',
        settings: 'CONFIGURACIÓN',
        interval: 'Intervalo',
        sensitivity: 'Sensibilidad',
        sensHelp: '(Menor = más sensible a cambios)',
        noDesc: 'Sin descripciones aún',
        noDescHelp: 'Activa la cámara y la visión continua',
        lastDet: 'ÚLTIMA DETECCIÓN',
        clear: 'LIMPIAR'
      },
      en: {
        title: 'ASSISTED SUSTAINED VISION',
        subtitle: 'Vertex Intelligence Core | Real-time visual analysis',
        statusActive: 'VISION ACTIVE',
        statusInactive: 'VISION INACTIVE',
        cameraInactive: 'Camera inactive',
        btnActivate: 'ACTIVATE CAMERA',
        btnDeactivate: 'DEACTIVATE',
        analyzing: 'ANALYZING...',
        btnContinuous: 'START CONTINUOUS VISION',
        btnStop: 'STOP',
        btnCapture: 'CAPTURE & ANALYZE (TEST)',
        history: 'DESCRIPTION HISTORY',
        settings: 'SETTINGS',
        interval: 'Interval',
        sensitivity: 'Sensitivity',
        sensHelp: '(Lower = more sensitive to changes)',
        noDesc: 'No descriptions yet',
        noDescHelp: 'Activate camera and continuous vision',
        lastDet: 'LATEST DETECTION',
        clear: 'CLEAR'
      },
      fr: {
        title: 'VISION SOUTENUE ASSISTÉE',
        subtitle: 'Vertex Intelligence Core | Analyse visuelle en temps réel',
        statusActive: 'VISION ACTIVE',
        statusInactive: 'VISION INACTIVE',
        cameraInactive: 'Caméra inactive',
        btnActivate: 'ACTIVER LA CAMÉRA',
        btnDeactivate: 'DÉSACTIVER',
        analyzing: 'ANALYSE EN COURS...',
        btnContinuous: 'DÉMARRER LA VISION CONTINUE',
        btnStop: 'ARRÊTER',
        btnCapture: 'CAPTURER ET ANALYSER (TEST)',
        history: 'HISTORIQUE DES DESCRIPTIONS',
        settings: 'CONFIGURATION',
        interval: 'Intervalle',
        sensitivity: 'Sensibilité',
        sensHelp: '(Moins = plus sensible aux changements)',
        noDesc: 'Aucune description pour le moment',
        noDescHelp: 'Activez la caméra et la vision continue',
        lastDet: 'DERNIÈRE DÉTECTION',
        clear: 'EFFACER'
      },
      pt: {
        title: 'VISÃO SUSTENTADA ASSISTIDA',
        subtitle: 'Vertex Intelligence Core | Análise visual em tempo real',
        statusActive: 'VISÃO ATIVA',
        statusInactive: 'VISÃO INATIVA',
        cameraInactive: 'Câmera inativa',
        btnActivate: 'ATIVAR CÂMERA',
        btnDeactivate: 'DESATIVAR',
        analyzing: 'ANALISANDO...',
        btnContinuous: 'INICIAR VISÃO CONTÍNUA',
        btnStop: 'PARAR',
        btnCapture: 'CAPTURAR E ANALISAR (TESTE)',
        history: 'HISTÓRICO DE DESCRIÇÕES',
        settings: 'CONFIGURAÇÃO',
        interval: 'Intervalo',
        sensitivity: 'Sensibilidade',
        sensHelp: '(Menor = mais sensível a mudanças)',
        noDesc: 'Sem descrições ainda',
        noDescHelp: 'Ative a câmera e a visão contínua',
        lastDet: 'ÚLTIMA DETECÇÃO',
        clear: 'LIMPAR'
      },
      it: {
        title: 'VISIONE SOSTENUTA ASSISTITA',
        subtitle: 'Vertex Intelligence Core | Analisi visiva in tempo reale',
        statusActive: 'VISIONE ATTIVA',
        statusInactive: 'VISIONE INATTIVA',
        cameraInactive: 'Fotocamera inattiva',
        btnActivate: 'ATTIVA FOTOCAMERA',
        btnDeactivate: 'DISATTIVA',
        analyzing: 'ANALIZZANDO...',
        btnContinuous: 'AVVIA VISIONE CONTINUA',
        btnStop: 'FERMA',
        btnCapture: 'CATTURA E ANALIZZA (TEST)',
        history: 'CRONOLOGIA DESCRIZIONI',
        settings: 'IMPOSTAZIONI',
        interval: 'Intervallo',
        sensitivity: 'Sensibilità',
        sensHelp: '(Minore = più sensibile ai cambiamenti)',
        noDesc: 'Ancora nessuna descrizione',
        noDescHelp: 'Attiva la fotocamera e la visione continua',
        lastDet: 'ULTIMO RILEVAMENTO',
        clear: 'PULISCI'
      },
      ru: {
        title: 'АССИСТИРОВАННОЕ ЗРЕНИЕ',
        subtitle: 'Vertex Intelligence Core | Визуальный анализ в реальном времени',
        statusActive: 'ЗРЕНИЕ АКТИВНО',
        statusInactive: 'ЗРЕНИЕ НЕАКТИВНО',
        cameraInactive: 'Камера неактивна',
        btnActivate: 'ВКЛЮЧИТЬ КАМЕРУ',
        btnDeactivate: 'ВЫКЛЮЧИТЬ',
        analyzing: 'АНАЛИЗ...',
        btnContinuous: 'ЗАПУСТИТЬ ПОТОК',
        btnStop: 'ОСТАНОВИТЬ',
        btnCapture: 'ЗАХВАТ И АНАЛИЗ (ТЕСТ)',
        history: 'ИСТОРИЯ ОПИСАНИЙ',
        settings: 'НАСТРОЙКИ',
        interval: 'Интервал',
        sensitivity: 'Чувствительность',
        sensHelp: '(Меньше = чувствительнее)',
        noDesc: 'Описаний пока нет',
        noDescHelp: 'Включите камеру и непрерывное зрение',
        lastDet: 'ПОСЛЕДНЕЕ ОБНАРУЖЕНИЕ',
        clear: 'ОЧИСТИТЬ'
      },
      hu: {
        title: 'ASSZISZTÁLT FOLYTONOS LÁTÁS',
        subtitle: 'Vertex Intelligence Core | Valós idejű vizuális elemzés',
        statusActive: 'LÁTÁS AKTÍV',
        statusInactive: 'LÁTÁS INAKTÍV',
        cameraInactive: 'Kamera inaktív',
        btnActivate: 'KAMERA AKTIVÁLÁSA',
        btnDeactivate: 'DEAKTIVÁLÁS',
        analyzing: 'ELEMZÉS...',
        btnContinuous: 'FOLYAMATOS LÁTÁS INDÍTÁSA',
        btnStop: 'LEÁLLÍTÁS',
        btnCapture: 'KÉP ELEMZÉSE (TESZT)',
        history: 'LEÍRÁSOK ELŐZMÉNYEI',
        settings: 'BEÁLLÍTÁSOK',
        interval: 'Intervallum',
        sensitivity: 'Érzékenység',
        sensHelp: '(Kisebb = érzékenyebb)',
        noDesc: 'Még nincs leírás',
        noDescHelp: 'Aktiválja a kamerát és a folytonos látást',
        lastDet: 'UTOLSÓ ÉSZLELÉS',
        clear: 'TÖRLÉS'
      },
      zh: {
        title: '辅助持续视觉',
        subtitle: 'Vertex Intelligence Core | 实时视觉分析',
        statusActive: '视觉已激活',
        statusInactive: '视觉未激活',
        cameraInactive: '摄像头未激活',
        btnActivate: '激活摄像头',
        btnDeactivate: '停用',
        analyzing: '正在分析...',
        btnContinuous: '启动持续视觉',
        btnStop: '停止',
        btnCapture: '捕获并分析 (测试)',
        history: '描述历史记录',
        settings: '设置',
        interval: '间隔',
        sensitivity: '灵敏度',
        sensHelp: '(数值越小 = 越敏感)',
        noDesc: '暂无描述',
        noDescHelp: '请开启摄像头并启动持续视觉',
        lastDet: '最后检测',
        clear: '清除'
      },
      ko: {
        title: '보조 지속 시각',
        subtitle: 'Vertex Intelligence Core | 실시간 시각 분석',
        statusActive: '시각 활성화됨',
        statusInactive: '시각 비활성화됨',
        cameraInactive: '카메라 비활성',
        btnActivate: '카메라 활성화',
        btnDeactivate: '비활성화',
        analyzing: '분석 중...',
        btnContinuous: '지속 시각 시작',
        btnStop: '중지',
        btnCapture: '캡처 및 분석 (테스트)',
        history: '설명 기록',
        settings: '설정',
        interval: '간격',
        sensitivity: '민감도',
        sensHelp: '(낮을수록 더 민감함)',
        noDesc: '아직 설명이 없습니다',
        noDescHelp: '카메라와 지속 시각을 활성화하세요',
        lastDet: '최근 감지',
        clear: '삭제'
      },
      hi: {
        title: 'सहायक निरंतर दृष्टि',
        subtitle: 'Vertex Intelligence Core | रीयल-टाइम विजुअल विश्लेषण',
        statusActive: 'दृष्टि सक्रिय',
        statusInactive: 'दृष्टि निष्क्रिय',
        cameraInactive: 'कैमरा निष्क्रिय',
        btnActivate: 'कैमरा सक्रिय करें',
        btnDeactivate: 'निष्क्रिय करें',
        analyzing: 'विश्लेषण कर रहा है...',
        btnContinuous: 'निरंतर दृष्टि शुरू करें',
        btnStop: 'रोकें',
        btnCapture: 'कैप्चर और विश्लेषण (परीक्षण)',
        history: 'विवरण इतिहास',
        settings: 'सेटिंग्स',
        interval: 'अंतराल',
        sensitivity: 'संवेदनशीलता',
        sensHelp: '(कम = अधिक संवेदनशील)',
        noDesc: 'अभी तक कोई विवरण नहीं',
        noDescHelp: 'कैमरा और निरंतर दृष्टि सक्रिय करें',
        lastDet: 'नवीनतम पहचान',
        clear: 'साफ़ करें'
      }
    };
    return translations[lang] || translations['es'];
  });


  // 🚨 DICCIONARIO SENTINEL (Vertex Node Protocol)
  public sentinelTranslations = computed(() => {
    const lang = this.selectedLanguage();
    const translations: any = {
      es: {
        title: '🚨 NODO SENTINEL',
        subtitle: 'Vertex Intelligence Core | Monitoreo de Salud del Sistema',
        status: 'ESTADO_DEL_SISTEMA',
        online: 'EN LÍNEA',
        onlineMsg: 'Todos los sistemas operando nominalmente.',
        warning: 'ADVERTENCIA',
        warningMsg: 'Carga elevada detectada en el núcleo.',
        critical: 'CRÍTICO',
        criticalMsg: 'Fallo inminente. Revisa el hardware.',
        lastPing: 'Último Pulso',
        uptime: 'Tiempo Activo',
        cpu: 'CPU',
        memory: 'MEMORIA',
        disk: 'DISCO',
        connections: 'CONEXIONES',
        requests: 'PETICIONES',
        responseTime: 'LATENCIA',
        refresh: 'ACTUALIZAR',
        scan: 'ESCANEO_TOTAL',
        logs: 'REGISTROS_DE_EVENTOS',
        noLogs: 'No hay registros de eventos.',
        alerts: 'ALERTAS_ACTIVAS',
        noAlerts: 'Cero amenazas detectadas.',
        clearAlerts: 'LIMPIAR_ALERTAS',
        simulated: 'Simulado'
      },
      en: {
        title: '🚨 SENTINEL NODE',
        subtitle: 'Vertex Intelligence Core | System Health Monitoring',
        status: 'SYSTEM_STATUS',
        online: 'ONLINE',
        onlineMsg: 'All systems operating nominally.',
        warning: 'WARNING',
        warningMsg: 'High load detected in the core.',
        critical: 'CRITICAL',
        criticalMsg: 'Imminent failure. Check hardware.',
        lastPing: 'Last Pulse',
        uptime: 'Uptime',
        cpu: 'CPU',
        memory: 'MEMORY',
        disk: 'DISK',
        connections: 'CONNECTIONS',
        requests: 'REQUESTS',
        responseTime: 'LATENCY',
        refresh: 'REFRESH',
        scan: 'FULL_SCAN',
        logs: 'EVENT_LOGS',
        noLogs: 'No event logs found.',
        alerts: 'ACTIVE_ALERTS',
        noAlerts: 'Zero threats detected.',
        clearAlerts: 'CLEAR_ALERTS',
        simulated: 'Simulated'
      },
      ru: {
        title: '🚨 УЗЕЛ СТРАЖ',
        subtitle: 'Vertex Intelligence Core | Мониторинг работоспособности системы',
        status: 'СТАТУС_СИСТЕМЫ',
        online: 'В СЕТИ',
        onlineMsg: 'Все системы работают нормально.',
        warning: 'ВНИМАНИЕ',
        warningMsg: 'Обнаружена высокая нагрузка на ядро.',
        critical: 'КРИТИЧЕСКИЙ',
        criticalMsg: 'Сбой неизбежен. Проверьте оборудование.',
        lastPing: 'Последний пульс',
        uptime: 'Время работы',
        cpu: 'ЦП',
        memory: 'ПАМЯТЬ',
        disk: 'ДИСК',
        connections: 'СОЕДИНЕНИЯ',
        requests: 'ЗАПРОСЫ',
        responseTime: 'ЗАДЕРЖКА',
        refresh: 'ОБНОВИТЬ',
        scan: 'ПОЛНОЕ_СКАНИРОВАНИЕ',
        logs: 'ЖУРНАЛ_СОБЫТИЙ',
        noLogs: 'Журналы событий не найдены.',
        alerts: 'АКТИВНЫЕ_УВЕДОМЛЕНИЯ',
        noAlerts: 'Угроз не обнаружено.',
        clearAlerts: 'ОЧИСТИТЬ',
        simulated: 'Симуляция'
      }
      // Se pueden expandir fr, pt, it, hu, zh, ko, hi siguiendo el mismo patrón técnico...
    };
    return translations[lang] || translations['es'];
  });

  // ⚙️ DICCIONARIO SETTINGS (Vertex Engine Protocol)
  // ⚙️ DICCIONARIO SETTINGS (Vertex Engine Protocol)
  public settingsTranslations = computed(() => {
    const lang = this.selectedLanguage();
    const translations: any = {
      es: {
        title: '⚙️ CONFIGURACIÓN VIC',
        subtitle: 'Vertex Intelligence Core | Ajustes del Sistema',
        modelSection: '🤖 MODELO DE IA',
        currentModel: 'Modelo activo',
        modelSize: 'Tamaño',
        ramRequired: 'RAM requerida',
        multimodal: 'Multimodal',
        functionCalling: 'Function Calling',
        recommended: 'Recomendado',
        switchModel: 'CAMBIAR MODELO',
        endpointSection: '🔌 ENDPOINT',
        currentEndpoint: 'Endpoint actual',
        connectionStatus: 'Estado',
        latency: 'Latencia',
        testConnection: 'PROBAR CONEXIÓN',
        localEndpoint: 'Local (LM Studio)',
        kaggleEndpoint: 'Kaggle (Cloud GPU)',
        customEndpoint: 'Personalizado',
        kaggleConfig: 'Configuración Kaggle',
        apiKey: 'API Key',
        endpoint: 'URL del Endpoint',
        saveConfig: 'GUARDAR',
        systemRecommendation: '🎯 Recomendación del sistema',
        applyRecommendation: 'APLICAR RECOMENDACIÓN',
        close: 'CERRAR',
        offlineMode: 'Modo Offline detectado',
        onlineMode: 'Conectado a la Red Neural'
      },
      en: {
        title: '⚙️ VIC SETTINGS',
        subtitle: 'Vertex Intelligence Core | System Configuration',
        modelSection: '🤖 AI MODEL',
        currentModel: 'Active model',
        modelSize: 'Size',
        ramRequired: 'RAM required',
        multimodal: 'Multimodal',
        functionCalling: 'Function Calling',
        recommended: 'Recommended',
        switchModel: 'SWITCH MODEL',
        endpointSection: '🔌 ENDPOINT',
        currentEndpoint: 'Current endpoint',
        connectionStatus: 'Status',
        latency: 'Latency',
        testConnection: 'TEST CONNECTION',
        localEndpoint: 'Local (LM Studio)',
        kaggleEndpoint: 'Kaggle (Cloud GPU)',
        customEndpoint: 'Custom',
        kaggleConfig: 'Kaggle Configuration',
        apiKey: 'API Key',
        endpoint: 'Endpoint URL',
        saveConfig: 'SAVE',
        systemRecommendation: '🎯 System recommendation',
        applyRecommendation: 'APPLY RECOMMENDATION',
        close: 'CLOSE',
        offlineMode: 'Offline Mode detected',
        onlineMode: 'Connected to Neural Network'
      }
      // Repetir estructura para RU, FR, PT...
    };
    return translations[lang] || translations['es'];
  });



  constructor() {
    // Aquí podrías cargar la configuración inicial, como el idioma guardado
    console.log(`🌐 OracleAI Engine: Idioma inicial cargado -> ${this.selectedLanguage().toUpperCase()}`);
  }

  /**
   * Cambia el idioma global y lo persiste en el navegador.
   * @param lang Código del idioma ('es', 'en', 'fr', 'pt')
   */
  changeLanguage(lang: string) {
    if (this.selectedLanguage() === lang) return; // Evitar disparos innecesarios

    this.selectedLanguage.set(lang);
    localStorage.setItem('oracle_lang', lang);

    // 🎙️ Sincronización de Voz: Cancelamos cualquier discurso previo para evitar "choque de acentos"
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    console.log(`🚀 Sistema reconfigurado a: ${lang.toUpperCase()}`);
  }


}