// Dados das aulas de onboarding e pop-ups
export interface OnboardingVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  locked: boolean;
  embedUrl: string;
  thumbnail?: string;
}

export interface PopupContent {
  id: string;
  type: 'welcome' | 'plan-required';
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  buttonText: string;
  imageUrl?: string;
  videoUrl?: string;
}

export const defaultOnboardingVideos: OnboardingVideo[] = [
  {
    id: '1',
    title: 'Bem-vindo à Teacher Poli',
    description: 'Conheça a plataforma e como ela pode transformar seu aprendizado',
    duration: '2:02',
    completed: false,
    locked: false,
    embedUrl: 'https://www.youtube.com/embed/mttHTuEK5Xs'
  },
  {
    id: '2',
    title: 'Nossa Cultura e Valores',
    description: 'Conheça tudo aquilo que nos guia',
    duration: '3:33',
    completed: false,
    locked: false,
    embedUrl: 'https://www.youtube.com/embed/-6J-tNXZkQc'
  },
  {
    id: '3',
    title: 'Passo a Passo: Primeiro Acesso',
    description: 'Como encontrar tudo que precisa para acessar pela primeira vez',
    duration: '00:57',
    completed: false,
    locked: false,
    embedUrl: 'https://www.youtube.com/embed/povotikiPeg'
  },
];

export const defaultPopupContents: PopupContent[] = [
  {
    id: 'welcome-modal',
    type: 'welcome',
    title: 'Bem-vindo(a), {userName}! 🎉',
    subtitle: 'Preparamos tudo com muito carinho para você! ❤️',
    description: 'Para que você tire o máximo proveito de todos os recursos da nossa plataforma, criamos uma jornada especial de boas-vindas.',
    features: [
      'Comece por Aqui - Assista aos vídeos de boas-vindas',
      '🎯 Gere seu Plano Personalizado (IMPORTANTE!) - Nossa IA criará um plano único para você',
      '🔓 Acesso Completo Liberado! - Instantaneamente após gerar seu plano'
    ],
    buttonText: 'Vamos começar! 🚀',
    imageUrl: '/WhatsApp Image 2025-06-02 at 10.53.02.jpeg'
  },
  {
    id: 'plan-required-modal',
    type: 'plan-required',
    title: 'Quase lá! 🎯',
    subtitle: 'Primeiro, precisamos criar seu plano personalizado! ✨',
    description: 'A Teacher Poli precisa conhecer você para se tornar a Melhor Professora de Inglês do Mundo personalizada para suas necessidades específicas.',
    features: [
      'Teacher Poli adaptada ao seu nível e objetivos',
      'Conteúdo personalizado para suas necessidades',
      'Experiência única criada especialmente para você'
    ],
    buttonText: 'Criar Meu Plano Agora! 🚀'
  }
];

// Funções para carregar dados salvos
export function getOnboardingVideos(): OnboardingVideo[] {
  const saved = localStorage.getItem('teacherpoli_onboarding_videos');
  return saved ? JSON.parse(saved) : defaultOnboardingVideos;
}

export function getPopupContents(): PopupContent[] {
  const saved = localStorage.getItem('teacherpoli_popup_contents');
  return saved ? JSON.parse(saved) : defaultPopupContents;
}

export function saveOnboardingVideos(videos: OnboardingVideo[]): void {
  localStorage.setItem('teacherpoli_onboarding_videos', JSON.stringify(videos));
}

export function savePopupContents(contents: PopupContent[]): void {
  localStorage.setItem('teacherpoli_popup_contents', JSON.stringify(contents));
}