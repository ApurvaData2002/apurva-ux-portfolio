// Site-wide details. Edit here to change them everywhere.
export const site = {
  name: 'Apurva Singh',
  role: 'UI/UX Designer',
  description:
    'Apurva Singh, UI/UX Designer. Case studies in mobile app design, research and prototyping.',
  email: 'sapurva523@gmail.com',
  linkedin: 'https://www.linkedin.com/in/apurva-singh-2002',
  avatar: '/avatar.jpg',
} as const;

export type NavKey = 'projects' | 'about';

export const navItems: { key: NavKey; label: string; href: string }[] = [
  { key: 'projects', label: 'Projects', href: '/' },
  { key: 'about', label: 'About', href: '/about' },
];
