/**
 * The ten briefs of the Forge-versus-a-person match. Real asks, varied difficulty, each aimed at
 * one category. Exported so the bench runner and any future regression test share one definition.
 */
export const BENCH = [
  {
    id: 'image-product',
    category: 'image',
    brief: {
      subject: 'a matte black espresso machine',
      setting: 'a concrete kitchen counter in soft morning light',
      medium: 'photograph',
      purpose: 'e-commerce hero image',
    },
  },
  {
    id: 'image-illustration',
    category: 'image',
    brief: {
      subject: 'a fox reading a folded paper map',
      setting: 'a mossy forest clearing',
      medium: 'ink line art',
      mood: ['playful'],
      palette: 'black ink with one red accent',
    },
  },
  {
    id: 'video-single',
    category: 'video',
    brief: {
      subject: 'a barista in a linen apron',
      setting: 'a sunlit cafe counter',
      action: 'she pours a rosetta into a flat white, then slides it across the counter',
      purpose: 'social',
    },
  },
  {
    id: 'video-multishot',
    category: 'video',
    brief: {
      subject: 'a night courier on a cargo bike',
      setting: 'wet London streets after midnight',
      action:
        'he checks the address under a streetlight. He cuts through an alley. He hands over the parcel and nods',
      shots: '3',
      duration: '12s',
      vaudio: 'Rain on tarmac, distant sirens. No music.',
    },
  },
  {
    id: 'voice-trailer',
    category: 'voice',
    brief: {
      script: 'This summer... everything changes. Are you ready? One last job. One last chance.',
      useCase: 'Trailer / hype VO',
      voiceChar: 'a gravelly American man in his fifties',
      lang: 'en-US',
    },
  },
  {
    id: 'music-instrumental',
    category: 'music',
    brief: {
      mGenre: ['bossa nova'],
      mMood: ['nostalgic'],
      mInst: ['nylon-string guitar', 'muted trumpet'],
      mBpm: '120',
      mProd: ['vinyl crackle'],
      mVocal: 'Instrumental',
    },
  },
  {
    id: 'sfx-ambience',
    category: 'sfx',
    brief: {
      sound: 'rain starting on a tin roof, sparse drops building to a steady downpour',
      sfxKind: 'ambience bed',
      sfxLen: '20',
      sfxLoop: 'Yes',
    },
  },
  {
    id: 'text-email',
    category: 'text',
    brief: {
      goal: 'Write a cold outreach email to a CFO introducing expense-management software',
      context:
        'We are a 12-person startup. The CFO runs finance at a 400-person logistics firm. No prior contact.',
      format: 'Plain prose',
      role: 'copywriter',
      length: 'Under 120 words',
      rules: 'No buzzwords, no exclamation marks, one specific number, one clear ask',
    },
  },
  {
    id: 'code-flaky',
    category: 'code',
    brief: {
      cTask:
        'Find and fix the flaky checkout test that fails roughly one run in five under CI parallelism',
      cStack: 'TypeScript, Vitest, Playwright, GitHub Actions with four shards',
      cCheck:
        'The test passes 20 consecutive runs with --repeat-each=20 locally and a full CI matrix stays green',
      cScope: 'Do not change the checkout implementation itself, only test code and fixtures',
    },
  },
  {
    id: 'app-invoices',
    category: 'app',
    brief: {
      aApp: 'an invoice-chasing tool for freelancers that sends polite reminder emails on a schedule',
      aScreens:
        'invoice list with status, a reminder-schedule editor, and a settings page for the email tone',
      aData: 'Client, Invoice, Reminder, EmailTemplate',
      aStyle: 'calm, dense, keyboard-first, no marketing fluff',
    },
  },
  {
    id: 'research-storage',
    category: 'research',
    brief: {
      rQuestion:
        'What subsidies and grid incentives exist for home battery storage in the UK in 2026?',
      rScope:
        'England, Scotland and Wales. Government schemes and the six largest energy suppliers. Last 18 months.',
      rFormat: 'Comparison table',
      rDecision: 'Whether to bundle battery installs into our solar offering this year',
    },
  },
];
