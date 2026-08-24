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
  {
    id: 'image-poster',
    category: 'image',
    brief: {
      subject: 'a vintage motorcycle under a single spotlight',
      setting: 'a dark showroom',
      medium: 'photograph',
      purpose: 'poster',
      imgtext: 'IRON & AIR',
      avoid: ['people', 'watermarks'],
      palette: 'black, chrome, one deep red',
    },
  },
  {
    id: 'video-story',
    category: 'video',
    brief: {
      subject: 'a swimmer at an outdoor lido',
      setting: 'steam rising off the water at sunrise',
      action: 'she dives in, then surfaces mid-lane',
      purpose: 'Instagram story',
      duration: '6s',
      motion: ['water rippling'],
    },
  },
  {
    id: 'voice-tone',
    category: 'voice',
    brief: {
      script: 'Stop. Listen. That sound is the tide going out.',
      useCase: 'Trailer / hype VO',
      voiceChar: 'a low, deliberate Scottish woman',
      vTone: ['urgent', 'conspiratorial'],
      vTexture: ['gravelly'],
      lang: 'en-GB',
    },
  },
  {
    id: 'music-song',
    category: 'music',
    brief: {
      mGenre: ['indie rock'],
      mMood: ['triumphant'],
      mInst: ['gated snare'],
      mBpm: '140',
      mVocal: 'Vocals',
      mStruct: 'quiet verse, building pre-chorus, huge chorus',
    },
  },
  {
    id: 'sfx-loop',
    category: 'sfx',
    brief: {
      sound: 'a server room hum with occasional relay clicks',
      sfxKind: 'ambience bed',
      room: 'warehouse',
      sfxLoop: 'Yes',
      sfxLen: '30',
    },
  },
  {
    id: 'text-analysis',
    category: 'text',
    brief: {
      goal: 'Compare these two employment contracts and flag every clause that differs',
      context: 'A designer choosing between two offers, both attached',
      format: 'Markdown table',
      role: 'sceptical reviewer',
      rules: 'Cite the clause number for every difference. No advice, just the differences',
    },
  },
  {
    id: 'code-pattern',
    category: 'code',
    brief: {
      cTask: 'Add CSV export to the reports page',
      cStack: 'Rails 7, Hotwire, Postgres',
      cPattern: 'Mirror the existing PDF export in app/services/pdf_export.rb',
      cCheck:
        'A downloaded CSV opens in Excel with correct headers and a test covers empty reports',
      cScope: 'Do not touch the PDF export',
    },
  },
  {
    id: 'app-rules',
    category: 'app',
    brief: {
      aApp: 'a waiting-list manager for a small clinic',
      aScreens: 'the queue board and a patient check-in form',
      aData: 'Patient, Visit, Practitioner',
      rules: 'NHS-adjacent tone, no emoji, large touch targets',
      cScope: 'Leave the existing auth flow alone',
    },
  },
  {
    id: 'research-gaps',
    category: 'research',
    brief: {
      rQuestion: 'How have UK rail season-ticket sales changed since flexible tickets launched?',
      rScope: 'DfT and train operating company data, 2021 to 2026',
      rFormat: 'Executive summary + appendix',
      rDecision: 'Whether to keep our office near a mainline station',
      rGaps: 'Say plainly where operator data is not published',
    },
  },
  {
    id: 'image-brand',
    category: 'image',
    brief: {
      subject: 'a ceramic coffee cup with steam curling up',
      setting: 'a pale oak table by a window',
      medium: 'photograph',
      purpose: 'Instagram carousel',
      ref: 'Kinfolk magazine still lifes',
    },
  },
];
