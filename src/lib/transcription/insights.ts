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

export function normalizeTopics(topics: string[]): string[] {
  const result: string[] = []
  const seen = new Set<string>()

  topics.forEach((topic) => {
    const splitParts = topic
      .split(/,|;|\/|\band\b|\&/i)
      .map(part => part.trim())
      .filter(Boolean)

    splitParts.forEach((part) => {
      const cleaned = part
        .replace(/^#+/, '')
        .replace(/[.!?]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      if (!cleaned) return

      const words = cleaned.split(' ').filter(Boolean)
      const short = words.slice(0, 3).join(' ')
      if (short.length < 2) return

      const key = short.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        result.push(short)
      }
    })
  })

  return result.slice(0, 8)
}

export interface RecommendedAction {
  id: string
  title: string
  description: string
  completed: boolean
}

/**
 * Extract recommended actions from AI summary.
 * Looks for bullet points, numbered lists, and sentences with action verbs.
 */
export function extractRecommendedActions(summary: string | null): RecommendedAction[] {
  if (!summary) return []
  
  const actions: RecommendedAction[] = []
  // Split by newlines and filter out empty lines
  const lines = summary.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  let idCounter = 1
  const actionVerbs = ['review', 'share', 'schedule', 'follow up', 'check', 'send', 'prepare', 'create', 'update', 'discuss', 'implement', 'verify', 'confirm', 'coordinate', 'plan', 'organize', 'write', 'document']
  
  for (const line of lines) {
    // Check if line is a bullet point (starts with -, *, •, or number like 1., 2.)
    const isBullet = /^[*-•]|\d+\./.test(line)
    // Check if line contains action verb (case-insensitive)
    const hasActionVerb = actionVerbs.some(verb => line.toLowerCase().includes(verb))
    
    if (isBullet || hasActionVerb) {
      // Clean up bullet prefix
      let cleanLine = line.replace(/^[*-•]\s*/, '').replace(/^\d+\.\s*/, '')
      // If line is too short, skip
      if (cleanLine.length < 10) continue
      
      // Truncate if too long
      const title = cleanLine.length > 80 ? cleanLine.substring(0, 80) + '…' : cleanLine
      actions.push({
        id: `action-${idCounter++}`,
        title,
        description: 'Action derived from AI summary',
        completed: false
      })
    }
  }
  
  // If no actions detected, create a default based on summary overall
  if (actions.length === 0 && summary.length > 20) {
    // Take first sentence
    const firstSentence = summary.split('.')[0]
    if (firstSentence.length > 10) {
      actions.push({
        id: 'action-1',
        title: firstSentence.substring(0, 100),
        description: 'Key insight from AI summary',
        completed: false
      })
    }
  }
  
  // Limit to max 5 actions
  return actions.slice(0, 5)
}
