// interfaces/models.interface.ts
export interface GemmaModel {
  id: string;
  name: string;
  size: string;
  ramRequired: string;
  multimodal: boolean;
  functionCalling: boolean;
  recommended: boolean;
  endpoint: 'local' | 'kaggle' | 'huggingface';
  url?: string;
  description: string;
}

export const GEMMA_MODELS: GemmaModel[] = [
  {
    id: 'gemma-4-2b-it',
    name: 'Gemma 4 2B',
    size: '2B',
    ramRequired: '3-4 GB',
    multimodal: true,
    functionCalling: true,
    recommended: true,
    endpoint: 'local',
    description: 'Modelo ligero para edge computing. Ideal para laptops con recursos limitados.'
  },
  {
    id: 'gemma-4-4b-it',
    name: 'Gemma 4 4B',
    size: '4B',
    ramRequired: '6-8 GB',
    multimodal: true,
    functionCalling: true,
    recommended: true,
    endpoint: 'local',
    description: 'Balance perfecto entre rendimiento y recursos.'
  },
  {
    id: 'gemma-4-9b-it',
    name: 'Gemma 4 9B',
    size: '9B',
    ramRequired: '12-16 GB',
    multimodal: true,
    functionCalling: true,
    recommended: false,
    endpoint: 'local',
    description: 'Alto rendimiento. Requiere GPU o mucha RAM.'
  },
  {
    id: 'gemma-4-27b-it',
    name: 'Gemma 4 27B',
    size: '27B',
    ramRequired: '32-40 GB',
    multimodal: true,
    functionCalling: true,
    recommended: false,
    endpoint: 'kaggle',
    description: 'Máximo rendimiento. Usar con Kaggle GPU.'
  },
  {
    id: 'gemma-3n-e4b-it',
    name: 'Gemma 3n E4B',
    size: '8B (efectivo 4B)',
    ramRequired: '4-6 GB',
    multimodal: true,
    functionCalling: true,
    recommended: true,
    endpoint: 'local',
    description: 'Optimizado para edge. MatFormer architecture.'
  },
  {
    id: 'gemma-3n-e2b-it',
    name: 'Gemma 3n E2B',
    size: '5B (efectivo 2B)',
    ramRequired: '2-3 GB',
    multimodal: true,
    functionCalling: true,
    recommended: true,
    endpoint: 'local',
    description: 'Ultra ligero. Corre en Raspberry Pi.'
  }
];