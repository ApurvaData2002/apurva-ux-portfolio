// About page content. Edit the text here; the layout lives in src/pages/about.astro.
import { site } from './site';

export const about = {
  heading: `Hello there, I’m ${site.name}.`,
  /** Bio paragraphs, in order. */
  bio: [
    'I sweat the small stuff, from spacing and states to the words on a button.',
    'My passion for product design and management started when I had to make a website for an NGO. I found myself invested in it and passionate about it a lot.',
    'Currently, I am working as a User Experience Designer at Vibrant Brands, Australia.',
    'Previously, I was making and working on a lot of personal projects to upskill myself.',
    'Before that, I was working as a website designer and manager as well as social media manager for an NGO called Eknai Subah Foundation, New Delhi.',
    'It took me quite a while to realise that product design and management is something that makes me feel content for my career.',
    'I’m always open to new opportunities and learnings to work on products that really make a change.',
  ],
  /** Last paragraph; the email address from site.ts is added after it as a link. */
  contactLead: 'I’d love to hear from you!',
  poster: {
    src: '/about/poster.png',
    // The poster has words in it, so the alt text repeats them.
    alt: 'Apurva pointing at three skills: Research, Critical Thinking, Rapid Prototyping.',
  },
  /**
   * Resume columns. Each item is one entry; `lines` show on separate lines.
   * spaced: 16px between entries (otherwise 4px).
   * keepLinesWhole: on desktop, each line stays on one line (the column widens to fit).
   */
  resume: [
    {
      heading: 'Skills',
      items: [
        { lines: ['User-centered Design'] },
        { lines: ['User Research'] },
        { lines: ['User Testing'] },
        { lines: ['User Flow'] },
        { lines: ['Rapid Prototyping'] },
      ],
    },
    {
      heading: 'Experience',
      spaced: true,
      keepLinesWhole: true,
      items: [
        { lines: ['Vibrant Brands Australia', 'UI/UX Designer', '(Sep 2026 – Present)'] },
        { lines: ['Eknai Subah Foundation', 'Website Designer & Manager', '(Jun 2025 – Jun 2026)'] },
      ],
    },
    {
      heading: 'Education',
      spaced: true,
      items: [
        { lines: ['Bachelor of Computer Applications'] },
        { lines: ['Google UX Design Professional Certificate'] },
      ],
    },
    {
      heading: 'Tools',
      items: [
        { lines: ['Figma'] },
        { lines: ['Claude'] },
        { lines: ['n8n'] },
        { lines: ['Framer'] },
        { lines: ['Affinity'] },
        { lines: ['Pencil & Paper'] },
      ],
    },
  ],
};
