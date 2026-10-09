// `sizes` and widths for case-study images, worked out from the Figma frames.
// Desktop content column = viewport - sidebar 240 - padding 48 - 144, max 1008.
export const imageSizes = {
  /** Hero and stacked sections: 1008 / 704 / 361 wide in the frames. */
  wide: {
    widths: [400, 720, 1008, 1440, 2016],
    sizes:
      '(min-width: 64em) min(1008px, calc(100vw - 432px)), (min-width: 48em) calc(100vw - 64px), calc(100vw - 32px)',
  },
  /** Split sections: 536 / 336 wide (mobile uses the wide image instead). */
  split: {
    widths: [400, 536, 800, 1072],
    sizes: '(min-width: 64em) min(536px, calc((100vw - 464px) * 0.55)), calc((100vw - 96px) / 2)',
  },
  /** Mobile version of a split section (the 16:9 "wide" export). */
  splitMobile: {
    widths: [400, 720, 1080],
    sizes: 'calc(100vw - 32px)',
  },
  /** Gallery: 3 columns of 320 / 224, 2 columns on mobile. */
  gallery: {
    widths: [240, 320, 480, 640],
    sizes:
      '(min-width: 64em) min(320px, calc((100vw - 480px) / 3)), (min-width: 48em) calc((100vw - 96px) / 3), calc((100vw - 40px) / 2)',
  },
};
