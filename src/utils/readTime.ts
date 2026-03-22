const WORDS_PER_MINUTE = 200;

export function getReadTime(content: string): string {
  const text = content
    .replace(/---[\s\S]*?---/, '') // strip frontmatter
    .replace(/```[\s\S]*?```/g, '') // strip code blocks
    .replace(/[#*>`\[\]()!_~|]/g, '') // strip markdown syntax
    .trim();

  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}
