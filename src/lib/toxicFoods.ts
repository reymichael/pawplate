export type ToxicSeverity = 'fatal' | 'dangerous' | 'caution'

export interface ToxicFood {
  name: string
  severity: ToxicSeverity
  affects: ('dog' | 'cat' | 'both')
  reason: string
  localNames?: string[]  // Filipino/Philippine names
}

export const TOXIC_FOODS: ToxicFood[] = [
  // ── FATAL ─────────────────────────────────────────────────────────────────
  {
    name: 'Chocolate',
    severity: 'fatal',
    affects: 'both',
    reason: 'Contains theobromine and caffeine. Causes seizures, irregular heartbeat, and death. Dark chocolate is most dangerous.',
    localNames: ['Tsokolate'],
  },
  {
    name: 'Grapes & Raisins',
    severity: 'fatal',
    affects: 'both',
    reason: 'Can cause sudden kidney failure. Even small amounts are dangerous. Exact toxin unknown.',
    localNames: ['Ubas', 'Pasas'],
  },
  {
    name: 'Onions & Garlic',
    severity: 'fatal',
    affects: 'both',
    reason: 'All forms (raw, cooked, powdered) destroy red blood cells, causing hemolytic anemia. Cats are 6× more sensitive than dogs.',
    localNames: ['Sibuyas', 'Bawang'],
  },
  {
    name: 'Xylitol',
    severity: 'fatal',
    affects: 'both',
    reason: 'Artificial sweetener found in sugar-free products. Causes rapid insulin release, hypoglycemia, and liver failure.',
    localNames: [],
  },
  {
    name: 'Macadamia Nuts',
    severity: 'fatal',
    affects: 'dog',
    reason: 'Causes weakness, hyperthermia, vomiting, and tremors. Mechanism unknown.',
    localNames: [],
  },
  {
    name: 'Raw Salmon & Trout',
    severity: 'fatal',
    affects: 'dog',
    reason: 'Can carry Neorickettsia helminthoeca (salmon poisoning). Causes fatal infection if untreated. Always cook fish fully.',
    localNames: [],
  },

  // ── DANGEROUS ──────────────────────────────────────────────────────────────
  {
    name: 'Alcohol',
    severity: 'dangerous',
    affects: 'both',
    reason: 'Even small amounts cause vomiting, disorientation, and respiratory failure. Pets have no tolerance.',
    localNames: ['Beer', 'Alak'],
  },
  {
    name: 'Caffeine',
    severity: 'dangerous',
    affects: 'both',
    reason: 'Found in coffee, tea, energy drinks. Causes rapid heart rate, seizures, and death.',
    localNames: ['Kape'],
  },
  {
    name: 'Avocado',
    severity: 'dangerous',
    affects: 'both',
    reason: 'Contains persin, which causes vomiting and diarrhea. The large pit is also a choking hazard.',
    localNames: ['Abokado'],
  },
  {
    name: 'Raw Dough / Yeast',
    severity: 'dangerous',
    affects: 'both',
    reason: 'Yeast expands in the stomach, causing bloat. Fermentation produces alcohol.',
    localNames: [],
  },
  {
    name: 'Cooked Bones',
    severity: 'dangerous',
    affects: 'both',
    reason: 'Cooked bones splinter and can puncture the gastrointestinal tract. Never feed cooked chicken, fish, or pork bones.',
    localNames: [],
  },
  {
    name: 'Pork (raw or undercooked)',
    severity: 'dangerous',
    affects: 'both',
    reason: 'Raw pork can carry Trichinella spiralis and Aujeszky\'s disease (pseudorabies) which is fatal in dogs. Always cook thoroughly.',
    localNames: ['Baboy'],
  },
  {
    name: 'Salt / Salty Foods',
    severity: 'dangerous',
    affects: 'both',
    reason: 'High sodium causes excessive thirst, urination, tremors, and sodium ion poisoning.',
    localNames: ['Asin', 'Chippy', 'Junk food'],
  },
  {
    name: 'Liver (excessive)',
    severity: 'dangerous',
    affects: 'both',
    reason: 'Very high in Vitamin A — feeding daily or in large amounts causes Vitamin A toxicity (bone deformities, liver damage).',
    localNames: ['Atay'],
  },

  // ── CAUTION ───────────────────────────────────────────────────────────────
  {
    name: 'Dairy / Milk',
    severity: 'caution',
    affects: 'both',
    reason: 'Most adult pets are lactose-intolerant. Can cause diarrhea and digestive upset. Small amounts of plain yogurt may be tolerated.',
    localNames: ['Gatas'],
  },
  {
    name: 'Raw Egg Whites',
    severity: 'caution',
    affects: 'both',
    reason: 'Avidin in raw egg whites blocks biotin absorption, leading to deficiency over time. Yolks are safe. Always cook eggs.',
    localNames: ['Itlog'],
  },
  {
    name: 'Tuna (excess)',
    severity: 'caution',
    affects: 'cat',
    reason: 'Feeding tuna as a staple causes thiamine deficiency and "yellow fat disease" in cats. Use occasionally only.',
    localNames: ['Atún'],
  },
  {
    name: 'Apple Seeds / Core',
    severity: 'caution',
    affects: 'both',
    reason: 'Seeds contain cyanogenic compounds. Always remove seeds and core before feeding.',
    localNames: ['Mansanas'],
  },
  {
    name: 'Nutmeg',
    severity: 'caution',
    affects: 'both',
    reason: 'Contains myristicin. Large amounts cause disorientation, vomiting, and tremors.',
    localNames: ['Nuez Moscada'],
  },
  {
    name: 'Corn Cobs',
    severity: 'caution',
    affects: 'both',
    reason: 'Corn kernels are safe but cobs can cause intestinal obstruction if swallowed.',
    localNames: ['Mais'],
  },
  {
    name: 'Spinach (excess)',
    severity: 'caution',
    affects: 'both',
    reason: 'High in oxalic acid. Safe in small amounts but can contribute to bladder/kidney stones in susceptible pets.',
    localNames: ['Kangkong'],
  },
]

export const SEVERITY_LABEL: Record<ToxicSeverity, string> = {
  fatal: 'Fatal',
  dangerous: 'Dangerous',
  caution: 'Use Caution',
}

export const SEVERITY_COLOR: Record<ToxicSeverity, string> = {
  fatal: 'text-red-700 bg-red-50 border-red-200',
  dangerous: 'text-orange-700 bg-orange-50 border-orange-200',
  caution: 'text-amber-700 bg-amber-50 border-amber-200',
}

export const SEVERITY_DOT: Record<ToxicSeverity, string> = {
  fatal: 'bg-red-500',
  dangerous: 'bg-orange-500',
  caution: 'bg-amber-400',
}
