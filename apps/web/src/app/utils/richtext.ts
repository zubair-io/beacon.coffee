interface Facet {
  index: { byteStart: number; byteEnd: number };
  features: FacetFeature[];
}

type FacetFeature =
  | { $type: 'app.bsky.richtext.facet#mention'; did: string }
  | { $type: 'app.bsky.richtext.facet#link'; uri: string }
  | { $type: 'app.bsky.richtext.facet#tag'; tag: string };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderRichText(text: string, facets?: Facet[]): string {
  if (!facets || facets.length === 0) {
    return escapeHtml(text);
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const bytes = encoder.encode(text);

  const sorted = [...facets].sort(
    (a, b) => a.index.byteStart - b.index.byteStart,
  );

  let result = '';
  let lastIndex = 0;

  for (const facet of sorted) {
    const { byteStart, byteEnd } = facet.index;
    if (byteStart < lastIndex) continue;

    result += escapeHtml(decoder.decode(bytes.slice(lastIndex, byteStart)));

    const segment = escapeHtml(decoder.decode(bytes.slice(byteStart, byteEnd)));
    const feature = facet.features[0];

    if (!feature) {
      result += segment;
    } else if (feature.$type === 'app.bsky.richtext.facet#mention') {
      result += `<a class="mention" href="/u/${segment.replace(/^@/, '')}">${segment}</a>`;
    } else if (feature.$type === 'app.bsky.richtext.facet#link') {
      result += `<a class="link" href="${escapeHtml(feature.uri)}" target="_blank" rel="noopener noreferrer">${segment}</a>`;
    } else if (feature.$type === 'app.bsky.richtext.facet#tag') {
      result += `<a class="hashtag" href="/!/${escapeHtml(feature.tag)}">${segment}</a>`;
    } else {
      result += segment;
    }

    lastIndex = byteEnd;
  }

  result += escapeHtml(decoder.decode(bytes.slice(lastIndex)));
  return result;
}
