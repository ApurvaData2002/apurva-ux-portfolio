// Site-wide details. Edit here to change them everywhere.
export const site = {
  name: 'Apurva Singh',
  role: 'UI/UX Designer',
  description:
    'Apurva Singh, UI/UX Designer. Case studies in mobile app design, research and prototyping.',
  email: 'sapurva523@gmail.com',
  linkedin: 'https://www.linkedin.com/in/apurva-singh-2002',
  avatar: '/avatar.jpg',
  /** Optional waving video. Add these files to public/ and the avatar uses them automatically. */
  avatarVideo: { mp4: '/avatar-wave.mp4', webm: '/avatar-wave.webm' },
} as const;

export type NavKey = 'projects' | 'about';

export const navItems: { key: NavKey; label: string; href: string }[] = [
  { key: 'projects', label: 'Projects', href: '/' },
  { key: 'about', label: 'About', href: '/about' },
];
