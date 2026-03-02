// Port of clarissa.sh sign data and core interpretations — pure functions, no I/O

export type Element = 'fire' | 'earth' | 'air' | 'water'

export interface SignData {
  element: Element
  traits: string
  shadow: string
  ruler: string
}

export const SIGNS: Record<string, SignData> = {
  Aries:       { element: 'fire',  traits: 'bold, courageous, pioneering, direct',              shadow: 'impatient, aggressive, self-centered',            ruler: 'Mars'     },
  Taurus:      { element: 'earth', traits: 'steady, sensual, determined, loyal',                shadow: 'stubborn, possessive, resistant to change',        ruler: 'Venus'    },
  Gemini:      { element: 'air',   traits: 'curious, adaptable, communicative, witty',          shadow: 'scattered, superficial, restless',                 ruler: 'Mercury'  },
  Cancer:      { element: 'water', traits: 'nurturing, intuitive, protective, tenacious',       shadow: 'moody, clingy, oversensitive',                     ruler: 'the Moon' },
  Leo:         { element: 'fire',  traits: 'generous, warm, creative, confident',               shadow: 'dramatic, prideful, attention-seeking',            ruler: 'the Sun'  },
  Virgo:       { element: 'earth', traits: 'analytical, helpful, precise, practical',           shadow: 'critical, anxious, perfectionist',                 ruler: 'Mercury'  },
  Libra:       { element: 'air',   traits: 'diplomatic, charming, fair-minded, aesthetic',      shadow: 'indecisive, people-pleasing, avoidant',            ruler: 'Venus'    },
  Scorpio:     { element: 'water', traits: 'intense, passionate, perceptive, transformative',   shadow: 'jealous, secretive, controlling',                  ruler: 'Pluto'    },
  Sagittarius: { element: 'fire',  traits: 'adventurous, optimistic, honest, philosophical',    shadow: 'tactless, restless, over-promising',               ruler: 'Jupiter'  },
  Capricorn:   { element: 'earth', traits: 'ambitious, disciplined, responsible, strategic',    shadow: 'cold, rigid, workaholic',                         ruler: 'Saturn'   },
  Aquarius:    { element: 'air',   traits: 'innovative, humanitarian, independent, visionary',  shadow: 'detached, contrarian, emotionally distant',        ruler: 'Uranus'   },
  Pisces:      { element: 'water', traits: 'intuitive, compassionate, imaginative, mystical',   shadow: 'escapist, boundary-less, self-sacrificing',        ruler: 'Neptune'  },
}

export function getSign(name: string): SignData {
  return SIGNS[name] ?? SIGNS['Aries']
}

export function getSignFromDate(date: Date = new Date()): string {
  const m = date.getMonth() + 1
  const d = date.getDate()
  if ((m === 3 && d >= 21) || (m === 4 && d <= 19))  return 'Aries'
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20))  return 'Taurus'
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20))  return 'Gemini'
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22))  return 'Cancer'
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22))  return 'Leo'
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22))  return 'Virgo'
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return 'Libra'
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return 'Scorpio'
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return 'Sagittarius'
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19))  return 'Capricorn'
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18))  return 'Aquarius'
  return 'Pisces'
}

const SUN_CORE: Record<string, string> = {
  Aries:       "your core essence is that of the initiator — bold,\n  courageous, and unafraid to go first. you need action\n  and independence like oxygen.",
  Taurus:      "your core essence is rooted in the sensory world —\n  beauty, comfort, and lasting value. you build with\n  patience and extraordinary determination.",
  Gemini:      "your core essence is that of the communicator — curious,\n  quick-minded, and endlessly adaptable. you need variety\n  and mental stimulation to thrive.",
  Cancer:      "your core essence is that of the nurturer — deeply\n  intuitive, emotionally intelligent, and fiercely protective\n  of those you love. home is where your power lives.",
  Leo:         "your core essence is that of the creator — generous,\n  warm-hearted, and magnetically expressive. you are meant\n  to shine, lead, and inspire.",
  Virgo:       "your core essence is that of the analyst — precise,\n  helpful, and devoted to improvement. you see what others\n  miss and make the complex simple.",
  Libra:       "your core essence is that of the harmonizer — fair,\n  charming, and aesthetically attuned. you seek balance\n  and beauty in all things.",
  Scorpio:     "your core essence is that of the transformer — intense,\n  perceptive, and unafraid of depth. you see through\n  surfaces to the truth beneath.",
  Sagittarius: "your core essence is that of the eternal seeker — the\n  philosopher-adventurer. you possess an insatiable curiosity\n  and a deep need for meaning and truth.",
  Capricorn:   "your core essence is that of the builder — ambitious,\n  disciplined, and playing the long game. you understand\n  that lasting things take time and effort.",
  Aquarius:    "your core essence is that of the visionary — innovative,\n  independent, and ahead of the curve. you see the future\n  others haven't imagined yet.",
  Pisces:      "your core essence is that of the mystic — deeply\n  intuitive, boundlessly compassionate, and connected to\n  something larger than the material world.",
}

const MOON_CORE: Record<string, string> = {
  Aries:       "your emotional nature is fiery, direct, and fast-moving.\n  you process feelings through action — when upset, you\n  need to move, to do, to confront.",
  Taurus:      "your emotional nature is steady, sensory, and grounding.\n  you process feelings slowly and need physical comfort —\n  food, touch, nature, familiar spaces.",
  Gemini:      "your emotional nature is quick, curious, and verbal.\n  you process feelings through words, ideas, and mental\n  exploration. variety feeds your soul.",
  Cancer:      "your emotional nature is deep, protective, and intuitive.\n  you feel everything — your own emotions and everyone\n  else's too. home and safety are essential.",
  Leo:         "your emotional nature is warm, expressive, and generous.\n  you need to feel appreciated and valued. your feelings\n  are big and you express them boldly.",
  Virgo:       "your emotional nature is analytical and detail-oriented.\n  you process feelings by organizing, fixing, and helping.\n  anxiety can be your emotional baseline.",
  Libra:       "your emotional nature craves harmony and partnership.\n  you process feelings through connection, conversation,\n  and creating beauty around you.",
  Scorpio:     "your emotional nature is intense, transformative, and\n  private. you feel at an oceanic depth. trust is earned\n  slowly but given completely.",
  Sagittarius: "your emotional nature is optimistic, restless, and free.\n  you process feelings through adventure, philosophy, and\n  humor. emotional claustrophobia is real.",
  Capricorn:   "your emotional nature is reserved, responsible, and\n  self-reliant. you may suppress feelings to function,\n  but they run deep beneath the discipline.",
  Aquarius:    "your emotional nature is detached, humanitarian, and\n  unconventional. you process feelings intellectually\n  first, emotionally second.",
  Pisces:      "your emotional nature is porous, empathic, and dreamy.\n  you absorb the emotions of everyone around you. solitude\n  and creative expression are essential.",
}

const RISING_CORE: Record<string, string> = {
  Aries:       "the world sees you as bold, direct, and ready for action.\n  you approach life head-first, with courage and initiative.\n  first impressions: dynamic, pioneering, fearless.",
  Taurus:      "the world sees you as calm, grounded, and aesthetically\n  aware. you approach life at your own pace, with quiet\n  determination. first impressions: steady, sensual, solid.",
  Gemini:      "the world sees you as quick, curious, and conversational.\n  you approach life with questions and adaptability.\n  first impressions: witty, youthful, versatile.",
  Cancer:      "the world sees you as warm, approachable, and caring.\n  you approach life with emotional intelligence and\n  protectiveness. first impressions: nurturing, sensitive.",
  Leo:         "the world sees you as radiant, confident, and magnetic.\n  you approach life with dramatic flair and generosity.\n  first impressions: warm, commanding, creative.",
  Virgo:       "the world sees you as precise, helpful, and composed.\n  you approach life with attention to detail and service.\n  first impressions: modest, intelligent, capable.",
  Libra:       "the world sees you as charming, graceful, and fair.\n  you approach life seeking harmony and partnership.\n  first impressions: elegant, diplomatic, balanced.",
  Scorpio:     "the world sees you as intense, magnetic, and powerful.\n  you approach life with piercing perception and depth.\n  first impressions: mysterious, commanding, perceptive.",
  Sagittarius: "the world sees you as adventurous, jovial, and honest.\n  you approach life as a grand exploration. first\n  impressions: enthusiastic, philosophical, free-spirited.",
  Capricorn:   "the world sees you as serious, competent, and ambitious.\n  you approach life with strategy and long-term vision.\n  first impressions: mature, authoritative, reliable.",
  Aquarius:    "the world sees you as unique, independent, and cerebral.\n  you approach life on your own terms. first impressions:\n  unconventional, friendly, intellectually interesting.",
  Pisces:      "the world sees you as gentle, dreamy, and empathic.\n  you approach life with intuition and artistic sensitivity.\n  first impressions: soft, imaginative, ethereal.",
}

export function getSunCore(sign: string): string  { return SUN_CORE[sign]    ?? '' }
export function getMoonCore(sign: string): string  { return MOON_CORE[sign]   ?? '' }
export function getRisingCore(sign: string): string { return RISING_CORE[sign] ?? '' }
