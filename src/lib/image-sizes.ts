// `sizes` and widths for case-study images, worked out from the Figma frames.
// The content column fills the space beside the sidebar (see .page in
// BaseLayout), so these are viewport formulas with no fixed cap: desktop
// content = viewport - sidebar 240 - padding 48 - 144. At 1440 they resolve to
// the frame sizes (1008 / 536 / 320); wider screens ask for a larger file.
// The 2x exports are the ceiling, so very wide screens reuse the largest file.
export const imageSizes = {
  /** Hero and stacked sections: 1008 / 704 / 361 wide in the frames. */
  wide: {
    widths: [400, 720, 1008, 1440, 2016],
    sizes:
      '(min-width: 64em) calc(100vw - 432px), (min-width: 48em) calc(100vw - 64px), calc(100vw - 32px)',
  },
  /**
   * Split sections: 336 wide on tablet, 536 from 64em, and from 90em the wider
   * image column of the Linear-style split (see CaseSection), which is
   * 616/976 = 0.631 of the grid area.
   */
  split: {
    widths: [400, 536, 800, 1072, 1600],
    sizes:
      '(min-width: 90em) calc((100vw - 464px) * 0.631), (min-width: 64em) calc((100vw - 464px) * 0.55), (min-width: 48em) calc((100vw - 96px) / 2), calc(100vw - 32px)',
  },
  /** Gallery: 3 columns of 320 / 224, 2 columns on mobile. */
  gallery: {
    widths: [240, 320, 480, 640],
    sizes:
      '(min-width: 64em) calc((100vw - 480px) / 3), (min-width: 48em) calc((100vw - 96px) / 3), calc((100vw - 40px) / 2)',
  },
};
