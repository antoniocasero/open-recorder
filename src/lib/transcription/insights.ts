/**
 * Simple keyword extraction from transcript text.
 * Returns top 5‑7 unique nouns (words longer than 4 characters, excluding common stop words).
 */
export function extractKeyTopics(transcript: string): string[] {
  if (!transcript.trim()) return []

  // Common English stop words
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
    'can', 'may', 'might', 'must', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
    'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'whose',
    'how', 'when', 'where', 'why',
  ])

  // Normalize: lowercase, remove punctuation, split into words
  const words = transcript
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 4 && !stopWords.has(word))

  // Count frequencies
  const freq: Record<string, number> = {}
  words.forEach(word => {
    freq[word] = (freq[word] || 0) + 1
  })

  // Sort by frequency descending, then alphabetically
  const sorted = Object.entries(freq)
    .sort(([a, aCount], [b, bCount]) => {
      if (bCount !== aCount) return bCount - aCount
      return a.localeCompare(b)
    })
    .map(([word]) => word)
    .slice(0, 7) // top 7

  return sorted
}