export function normalizeTag(tag: string): string {
  return tag.toLowerCase().replace(/^#/, '');
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u00C0-\u024F]+/g);
  if (!matches) return [];
  return [...new Set(matches.map(normalizeTag))];
}

export function createHashtagFacet(
  tag: string,
  byteStart: number,
  byteEnd: number,
) {
  return {
    index: { byteStart, byteEnd },
    features: [
      {
        $type: 'app.bsky.richtext.facet#tag' as const,
        tag: normalizeTag(tag),
      },
    ],
  };
}
