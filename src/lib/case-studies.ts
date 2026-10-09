import { getCollection, type CollectionEntry } from 'astro:content';

export type CaseStudy = CollectionEntry<'case-studies'>;

/** Published case studies (draft: false), sorted by `order`. The only way pages should read the collection. */
export async function getPublishedCaseStudies(): Promise<CaseStudy[]> {
  const entries = await getCollection('case-studies', ({ data }) => !data.draft);
  for (const entry of entries) assertImagesInOwnFolder(entry);
  return entries.sort((a, b) => a.data.order - b.data.order);
}

/**
 * The case study to link at the bottom of `current`: its `next` slug if that one
 * is published, otherwise the following published one by `order` (wrapping round).
 * Returns undefined when `current` is the only published case study.
 */
export function getNextCaseStudy(current: CaseStudy, published: CaseStudy[]): CaseStudy | undefined {
  const others = published.filter((p) => p.data.slug !== current.data.slug);
  if (others.length === 0) return undefined;
  const chosen = others.find((p) => p.data.slug === current.data.next);
  if (chosen) return chosen;
  const index = published.findIndex((p) => p.data.slug === current.data.slug);
  return published[(index + 1) % published.length] ?? others[0];
}

/** Every image of a case study must live in public/case-studies/<its slug>/. */
function assertImagesInOwnFolder({ data }: CaseStudy) {
  const folder = `/case-studies/${data.slug}/`;
  const paths = [
    data.hero,
    data.thumbnail,
    ...data.sections.flatMap((s) => [s.image, s.imageMobile]),
    ...data.gallery.map((g) => g.src),
  ].filter((p): p is string => Boolean(p));
  const wrong = paths.filter((p) => !p.startsWith(folder));
  if (wrong.length) {
    throw new Error(`Case study "${data.slug}": these images are not in ${folder}: ${wrong.join(', ')}`);
  }
}
