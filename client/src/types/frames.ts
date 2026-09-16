import { FrameOption } from './photobooth';

export const AVAILABLE_FRAMES: FrameOption[] = [
  {
    id: 'frame-white-modern',
    name: 'Classic White Polaroid',
    description: 'Clean white vertical card with signature bottom chin',
    overlayPath: '/frames/frame-white-modern.svg',
    accentColor: '#38BDF8',
    theme: 'white-modern'
  },
  {
    id: 'frame-film-strip',
    name: 'Vintage 35mm Film',
    description: 'Analog cinema strip with side sprocket holes and frame numbers',
    overlayPath: '/frames/frame-film-strip.svg',
    accentColor: '#F59E0B',
    theme: 'film-strip'
  },
  {
    id: 'frame-retro-neon',
    name: 'Cyberpunk Neon',
    description: 'Dark obsidian background with glowing neon gradient trim',
    overlayPath: '/frames/frame-retro-neon.svg',
    accentColor: '#EC4899',
    theme: 'retro-neon'
  },
  {
    id: 'frame-minimal-dark',
    name: 'Noir Gold Memoir',
    description: 'Matte dark slate with luxury gold foil borders',
    overlayPath: '/frames/frame-minimal-dark.svg',
    accentColor: '#FCD34D',
    theme: 'minimal-dark'
  }
];
