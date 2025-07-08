import type { GenerateNameRequest } from "@shared/schema";

interface WordSource {
  adjectives: string[];
  nouns: string[];
  verbs: string[];
  musicalTerms: string[];
}

export class NameGeneratorService {
  
  private wordSources: WordSource = {
    adjectives: [],
    nouns: [],
    verbs: [],
    musicalTerms: []
  };

  // Advanced linguistic structures for better combinations
  private linguisticStructures = {
    // Semantic word relationships for natural pairings
    semanticPairs: {
      'fire': ['smoke', 'ash', 'ember', 'flame', 'spark', 'blaze'],
      'water': ['wave', 'tide', 'flow', 'stream', 'ocean', 'rain'],
      'light': ['shadow', 'dawn', 'dusk', 'glow', 'beam', 'ray'],
      'sound': ['echo', 'silence', 'noise', 'whisper', 'roar', 'hum'],
      'time': ['moment', 'eternity', 'instant', 'forever', 'past', 'future'],
      'space': ['void', 'cosmos', 'universe', 'galaxy', 'star', 'nebula']
    },
    
    // Alliterative word groups for memorable combinations
    alliterativeGroups: {
      's': ['silver', 'shadow', 'silent', 'secret', 'storm', 'soul', 'song', 'serpent'],
      'b': ['black', 'blue', 'burning', 'broken', 'bright', 'bitter', 'blood', 'blade'],
      'm': ['midnight', 'moon', 'mystic', 'mirror', 'mist', 'mountain', 'memory', 'melody'],
      'f': ['fire', 'frost', 'flame', 'frozen', 'fury', 'fate', 'fear', 'forever'],
      'd': ['dark', 'dream', 'dawn', 'dust', 'deep', 'divine', 'dragon', 'doom'],
      'c': ['crystal', 'crimson', 'cosmic', 'cold', 'chaos', 'crown', 'cloud', 'cascade']
    },
    
    // Rhyming patterns for poetic effect
    rhymeGroups: {
      'ight': ['light', 'night', 'flight', 'bright', 'sight', 'fight', 'height', 'knight'],
      'ound': ['sound', 'ground', 'round', 'bound', 'found', 'wound', 'profound'],
      'ake': ['wake', 'lake', 'make', 'break', 'take', 'snake', 'quake', 'sake'],
      'all': ['fall', 'call', 'wall', 'small', 'tall', 'all', 'hall', 'sprawl']
    },
    
    // Enhanced connectors with contextual meaning
    contextualConnectors: {
      spatial: ['above', 'below', 'beneath', 'beyond', 'between', 'within', 'outside', 'inside'],
      temporal: ['before', 'after', 'during', 'until', 'since', 'while', 'forever', 'never'],
      causal: ['because', 'despite', 'without', 'through', 'against', 'towards', 'for', 'with'],
      comparative: ['like', 'unlike', 'versus', 'than', 'as', 'such'],
      possessive: ['of', 'from', 'by', 'for', 'with', 'within']
    }
  };

  // Pattern templates for different name types - Enhanced with classic patterns
  private patternTemplates = {
    band: {
      powerful: [
        'The [adjective] [noun]',        // Classic band pattern - most popular
        'The [noun] [noun]',             // Classic like "Rolling Stones"
        'The [verb]ing [noun]',          // Classic like "Smashing Pumpkins"
        '[adjective] [noun] [musicalTerm]', 
        '[noun] of [noun]'
      ],
      mysterious: [
        'The [adjective] [noun]',        // Classic pattern reinforced
        '[adjective] [noun] [connector] [noun]', 
        '[temporal] [adjective] [noun]'
      ],
      edgy: [
        'The [adjective] [noun]',        // Classic pattern reinforced
        '[verb] the [noun]', 
        '[adjective] [noun] [verb]', 
        '[noun] [verb] [noun]'
      ]
    },
    song: {
      poetic: ['[adjective] [noun] [verb]', '[verb] [connector] [noun]', '[noun], [noun], [noun]'],
      narrative: ['When [noun] [verb]', 'The [noun] that [verb]', '[verb] until [noun]'],
      emotional: ['[adjective] [noun] of [noun]', '[verb] my [adjective] [noun]', '[noun] in [adjective] [noun]']
    }
  };

  // Expanded categories for endless variety
  private expandedCategories = {
    emotions: [],
    colors: [],
    animals: [],
    mythology: [],
    technology: [],
    nature: [],
    cosmic: [],
    abstract: [],
    textures: [],
    weather: [],
    timeRelated: [],
    movement: [],
    sounds: [],
    tastes: [],
    cultural: [],
    // New specialized domains
    scienceFiction: [],
    fantasy: [],
    food: [],
    fashion: [],
    architecture: [],
    literature: [],
    psychology: [],
    microEmotions: [],
    worldCities: [],
    landscapes: [],
    physics: [],
    chemistry: [],
    biology: [],
    absurd: [],
    historical: [],
    sensory: [],
    compound: []
  };

  constructor() {
    this.initializeWordSources().then(() => {
      // Fetch fresh words from web sources after base initialization
      this.fetchWordsFromWeb();
      // Fetch expanded categories for endless variety
      this.fetchExpandedCategories();
    });
  }

  private async initializeWordSources() {
    // Initialize with base vocabulary, then enhance with web-sourced words
    this.wordSources = {
      adjectives: [
        // Core emotional adjectives (expanded)
        'Mystic', 'Crimson', 'Electric', 'Midnight', 'Golden', 'Silver', 'Dark', 'Bright',
        'Wild', 'Silent', 'Burning', 'Frozen', 'Ancient', 'Modern', 'Cosmic', 'Urban',
        'Neon', 'Velvet', 'Steel', 'Crystal', 'Shadow', 'Thunder', 'Lightning', 'Storm',
        'Infinite', 'Lost', 'Hidden', 'Sacred', 'Broken', 'Perfect', 'Rebel', 'Gentle',
        'Ethereal', 'Haunted', 'Distant', 'Fading', 'Shimmering', 'Cascading', 'Lonely',
        'Forgotten', 'Hollow', 'Twisted', 'Pure', 'Wounded', 'Eternal', 'Temporal',
        'Azure', 'Emerald', 'Obsidian', 'Pearl', 'Amber', 'Scarlet', 'Violet', 'Indigo',
        'Melancholy', 'Euphoric', 'Serene', 'Chaotic', 'Peaceful', 'Turbulent', 'Tender',
        'Savage', 'Delicate', 'Brutal', 'Graceful', 'Elegant', 'Raw', 'Refined', 'Primal',
        // Scientific & Technical
        'Quantum', 'Kinetic', 'Thermal', 'Electromagnetic', 'Gravitational', 'Molecular', 'Atomic',
        'Synthetic', 'Organic', 'Digital', 'Analog', 'Virtual', 'Augmented', 'Cybernetic',
        'Photonic', 'Sonic', 'Ultrasonic', 'Infrared', 'Ultraviolet', 'Radioactive', 'Magnetic',
        // Psychological & Emotional (expanded)
        'Nostalgic', 'Wistful', 'Exuberant', 'Contemplative', 'Introspective', 'Analytical',
        'Empathetic', 'Intuitive', 'Subconscious', 'Cognitive', 'Bittersweet', 'Conflicted',
        'Overwhelming', 'Underwhelming', 'Ambivalent', 'Cathartic', 'Euphoric', 'Melancholic',
        // Architectural & Design
        'Baroque', 'Modernist', 'Brutalist', 'Gothic', 'Minimalist', 'Industrial', 'Avant-garde',
        'Vintage', 'Retro', 'Futuristic', 'Bauhaus', 'Victorian', 'Contemporary', 'Classical',
        // Cultural & Geographic
        'Nordic', 'Mediterranean', 'Tropical', 'Arctic', 'Saharan', 'Alpine', 'Oceanic',
        'Metropolitan', 'Rural', 'Suburban', 'Pastoral', 'Nomadic', 'Bohemian', 'Cosmopolitan',
        // Sensory & Textural (expanded)
        'Silky', 'Rough', 'Smooth', 'Coarse', 'Fine', 'Grainy', 'Polished', 'Matte',
        'Glossy', 'Translucent', 'Opaque', 'Iridescent', 'Luminous', 'Phosphorescent', 'Fluorescent',
        'Tactile', 'Viscous', 'Fluid', 'Rigid', 'Flexible', 'Malleable', 'Brittle', 'Elastic',
        // Temporal & Historical
        'Medieval', 'Renaissance', 'Industrial', 'Atomic', 'Digital', 'Cyberpunk', 'Steampunk',
        'Prehistoric', 'Futuristic', 'Timeless', 'Ephemeral', 'Perpetual', 'Cyclical', 'Linear',
        // Humorous and unexpected (expanded)
        'Confused', 'Caffeinated', 'Backwards', 'Upside-Down', 'Sideways', 'Dizzy', 'Clumsy',
        'Sneaky', 'Dramatic', 'Overdramatic', 'Undercooked', 'Overcooked', 'Misunderstood', 'Questionable',
        'Suspicious', 'Innocent', 'Guilty', 'Awkward', 'Smooth', 'Rough', 'Polite', 'Rude',
        'Sleepy', 'Hungry', 'Thirsty', 'Restless', 'Impatient', 'Overwhelmed', 'Procrastinating',
        'Peculiar', 'Bizarre', 'Ridiculous', 'Absurd', 'Nonsensical', 'Whimsical', 'Zany',
        'Fluffy', 'Squishy', 'Bouncy', 'Wobbly', 'Jiggly', 'Sparkly', 'Glittery', 'Shiny',
        'Fuzzy', 'Scratchy', 'Ticklish', 'Giggly', 'Wiggly', 'Squirmy', 'Fidgety', 'Jittery'
      ],
      nouns: [
        // Core concepts (expanded)
        'Echo', 'Wave', 'Fire', 'Storm', 'Star', 'Moon', 'Sun', 'River', 'Mountain',
        'Ocean', 'Desert', 'Forest', 'City', 'Road', 'Bridge', 'Tower', 'Castle',
        'Garden', 'Mirror', 'Dream', 'Vision', 'Memory', 'Journey', 'Destiny', 'Glory',
        'Victory', 'Freedom', 'Spirit', 'Soul', 'Heart', 'Mind', 'Voice', 'Song',
        'Whisper', 'Scream', 'Silence', 'Reflection', 'Window', 'Door', 'Key', 'Lock',
        'Chain', 'Crown', 'Throne', 'Valley', 'Cliff', 'Cave', 'Tunnel', 'Meadow',
        'Path', 'Destination', 'Beginning', 'Ending', 'Chapter', 'Story', 'Hope', 'Fear',
        'Joy', 'Sorrow', 'Pain', 'Healing', 'Wound', 'Butterfly', 'Wolf', 'Eagle',
        'Deer', 'Raven', 'Dove', 'Serpent', 'Dragon', 'Phoenix', 'Angel', 'Warrior',
        'Poet', 'Prophet', 'Wanderer', 'Guardian', 'Keeper', 'Seeker', 'Dreamer',
        // Science Fiction & Fantasy
        'Starship', 'Nebula', 'Cyborg', 'Android', 'Wormhole', 'Hyperdrive', 'Terraforming', 'Portal',
        'Enchantment', 'Spell', 'Potion', 'Grimoire', 'Wizard', 'Sorcery', 'Rune', 'Incantation',
        'Amulet', 'Talisman', 'Crystal', 'Orb', 'Artifact', 'Prophecy', 'Covenant', 'Sanctuary',
        'Quest', 'Pilgrimage', 'Crusade', 'Odyssey', 'Expedition', 'Voyage', 'Adventure', 'Escapade',
        // World Cities & Places
        'Tokyo', 'Mumbai', 'Istanbul', 'Marrakech', 'Reykjavik', 'Montevideo', 'Nairobi', 'Casablanca',
        'Fjord', 'Savanna', 'Tundra', 'Archipelago', 'Plateau', 'Canyon', 'Peninsula', 'Delta',
        'Metropolis', 'Village', 'Hamlet', 'Township', 'Borough', 'Settlement', 'Outpost', 'Colony',
        // Scientific Terms
        'Molecule', 'Atom', 'Quantum', 'Photon', 'Electron', 'Neutron', 'Proton', 'Particle',
        'Catalyst', 'Polymer', 'Synthesis', 'Crystalline', 'Volatile', 'Inert', 'Compound', 'Element',
        'Organism', 'Symbiosis', 'Parasite', 'Photosynthesis', 'Mitochondria', 'Evolution', 'Genetics', 'DNA',
        // Food & Cuisine
        'Umami', 'Saffron', 'Truffle', 'Marinade', 'Caramelization', 'Fermentation', 'Artisan', 'Delicacy',
        'Espresso', 'Cappuccino', 'Macchiato', 'Sourdough', 'Ciabatta', 'Baguette', 'Croissant', 'Brioche',
        'Chutney', 'Salsa', 'Vinaigrette', 'Reduction', 'Emulsion', 'Infusion', 'Garnish', 'Zest',
        // Emotions & Psychology
        'Nostalgia', 'Euphoria', 'Melancholia', 'Catharsis', 'Epiphany', 'Revelation', 'Introspection', 'Contemplation',
        'Serenity', 'Tranquility', 'Harmony', 'Discord', 'Tension', 'Release', 'Closure', 'Awakening',
        'Consciousness', 'Subconsciousness', 'Intuition', 'Cognition', 'Perception', 'Awareness', 'Mindfulness', 'Zen',
        // Architecture & Design
        'Cathedral', 'Basilica', 'Monastery', 'Pavilion', 'Conservatory', 'Observatory', 'Atrium', 'Rotunda',
        'Facade', 'Cornice', 'Frieze', 'Colonnade', 'Balustrade', 'Pergola', 'Gazebo', 'Arbor',
        'Modernism', 'Brutalism', 'Minimalism', 'Bauhaus', 'Gothic', 'Renaissance', 'Baroque', 'Victorian',
        // Literature & Arts
        'Metaphor', 'Allegory', 'Sonnet', 'Prose', 'Verse', 'Narrative', 'Anthology', 'Manuscript',
        'Symphony', 'Concerto', 'Sonata', 'Rhapsody', 'Prelude', 'Interlude', 'Cadence', 'Harmony',
        'Canvas', 'Palette', 'Sculpture', 'Installation', 'Mural', 'Fresco', 'Mosaic', 'Tapestry',
        // Natural Phenomena
        'Aurora', 'Eclipse', 'Solstice', 'Equinox', 'Monsoon', 'Typhoon', 'Tsunami', 'Avalanche',
        'Geyser', 'Volcano', 'Crater', 'Glacier', 'Iceberg', 'Waterfall', 'Rapids', 'Whirlpool',
        'Phenomenon', 'Occurrence', 'Manifestation', 'Apparition', 'Mirage', 'Illusion', 'Phantom', 'Specter',
        // Humorous and unexpected (expanded)
        'Bananas', 'Socks', 'Toasters', 'Umbrellas', 'Pickles', 'Waffles', 'Pandas', 'Llamas',
        'Ninjas', 'Pirates', 'Robots', 'Zombies', 'Unicorns', 'Tacos', 'Pizza', 'Donuts',
        'Monkeys', 'Elephants', 'Penguins', 'Flamingos', 'Hippos', 'Turtles', 'Koalas', 'Sloths',
        'Thoughts', 'Mistakes', 'Accidents', 'Shenanigans', 'Chaos', 'Mayhem', 'Disaster', 'Catastrophe',
        'Pajamas', 'Mustaches', 'Eyebrows', 'Elbows', 'Knees', 'Toes', 'Buttons', 'Zippers',
        'Sandwiches', 'Burritos', 'Cupcakes', 'Muffins', 'Bagels', 'Pretzels', 'Crackers', 'Cookies',
        'Bubbles', 'Sprinkles', 'Confetti', 'Glitter', 'Sparkles', 'Giggles', 'Wiggles', 'Squiggles',
        'Doodles', 'Noodles', 'Poodles', 'Oodles', 'Caboodles', 'Fidgets', 'Gadgets', 'Widgets'
      ],
      verbs: [
        // Core action verbs (expanded)
        'Dance', 'Sing', 'Rise', 'Fall', 'Burn', 'Shine', 'Glow', 'Flow', 'Move', 'Stand',
        'Run', 'Walk', 'Fly', 'Soar', 'Dive', 'Climb', 'Jump', 'Leap', 'Crawl', 'Slide',
        'Whisper', 'Shout', 'Echo', 'Resonate', 'Vibrate', 'Pulse', 'Beat', 'Thrum', 'Hum',
        'Create', 'Destroy', 'Build', 'Break', 'Make', 'Unmake', 'Form', 'Shape', 'Mold',
        'Transform', 'Change', 'Evolve', 'Adapt', 'Grow', 'Shrink', 'Expand', 'Contract',
        'Embrace', 'Release', 'Hold', 'Let Go', 'Grasp', 'Reach', 'Touch', 'Feel', 'Sense',
        'See', 'Watch', 'Observe', 'Look', 'Gaze', 'Stare', 'Glance', 'Peek', 'Glimpse',
        'Hear', 'Listen', 'Sound', 'Ring', 'Chime', 'Bell', 'Call', 'Summon', 'Invoke',
        'Dream', 'Imagine', 'Envision', 'Picture', 'Visualize', 'Conceive', 'Think', 'Ponder',
        'Remember', 'Forget', 'Recall', 'Recollect', 'Reminisce', 'Reflect', 'Consider', 'Contemplate',
        // Scientific & Technical Verbs
        'Synthesize', 'Analyze', 'Catalyze', 'Oxidize', 'Crystallize', 'Ionize', 'Magnetize', 'Polarize',
        'Accelerate', 'Decelerate', 'Oscillate', 'Fluctuate', 'Radiate', 'Emit', 'Absorb', 'Reflect',
        'Transmit', 'Receive', 'Process', 'Compute', 'Calculate', 'Calibrate', 'Optimize', 'Configure',
        'Navigate', 'Traverse', 'Migrate', 'Infiltrate', 'Penetrate', 'Permeate', 'Diffuse', 'Disperse',
        // Emotional & Psychological Verbs
        'Contemplate', 'Meditate', 'Introspect', 'Empathize', 'Sympathize', 'Psychoanalyze', 'Rationalize', 'Internalize',
        'Externalize', 'Compartmentalize', 'Prioritize', 'Conceptualize', 'Materialize', 'Spiritualize', 'Harmonize', 'Synchronize',
        'Reminisce', 'Nostalgize', 'Fantasize', 'Romanticize', 'Idealize', 'Actualize', 'Realize', 'Recognize',
        // Artistic & Creative Verbs
        'Compose', 'Improvise', 'Orchestrate', 'Choreograph', 'Sculpt', 'Paint', 'Sketch', 'Design',
        'Craft', 'Weave', 'Embroider', 'Carve', 'Engrave', 'Etch', 'Emboss', 'Imprint',
        'Perform', 'Express', 'Interpret', 'Convey', 'Communicate', 'Articulate', 'Narrate', 'Recite',
        // Natural Phenomena Verbs
        'Cascade', 'Surge', 'Ripple', 'Undulate', 'Meander', 'Spiral', 'Swirl', 'Eddy',
        'Erupt', 'Explode', 'Implode', 'Burst', 'Crack', 'Split', 'Fragment', 'Shatter',
        'Bloom', 'Blossom', 'Flourish', 'Wither', 'Decay', 'Regenerate', 'Rejuvenate', 'Revitalize',
        // Movement & Motion Verbs
        'Glide', 'Drift', 'Float', 'Hover', 'Levitate', 'Descend', 'Ascend', 'Plunge',
        'Rotate', 'Revolve', 'Spin', 'Twirl', 'Whirl', 'Pivot', 'Sway', 'Rock',
        'Slither', 'Creep', 'Sneak', 'Prowl', 'Stalk', 'Hunt', 'Chase', 'Pursue',
        // Culinary Verbs
        'Sauté', 'Braise', 'Simmer', 'Marinate', 'Caramelize', 'Flambé', 'Julienne', 'Dice',
        'Whisk', 'Fold', 'Knead', 'Ferment', 'Infuse', 'Reduce', 'Emulsify', 'Garnish',
        // Humorous and unexpected actions (expanded)
        'Giggle', 'Tickle', 'Bounce', 'Wiggle', 'Jiggle', 'Squirm', 'Fidget', 'Wobble',
        'Stumble', 'Fumble', 'Bumble', 'Tumble', 'Rumble', 'Grumble', 'Mumble', 'Jumble',
        'Snooze', 'Doze', 'Nap', 'Yawn', 'Stretch', 'Scratch', 'Itch', 'Twitch',
        'Hiccup', 'Sneeze', 'Cough', 'Burp', 'Gulp', 'Slurp', 'Chomp', 'Munch',
        'Procrastinate', 'Overthink', 'Overanalyze', 'Underestimate', 'Overestimate', 'Misunderstand', 'Confuse', 'Perplex',
        'Bamboozle', 'Flabbergast', 'Discombobulate', 'Befuddle', 'Mystify', 'Puzzle', 'Baffle', 'Stupefy',
        'Gallivant', 'Traipse', 'Meander', 'Wander', 'Roam', 'Ramble', 'Saunter', 'Amble'
      ],
      musicalTerms: [
        // Classical Music Theory
        'Harmony', 'Melody', 'Rhythm', 'Beat', 'Tempo', 'Chord', 'Note', 'Scale',
        'Symphony', 'Sonata', 'Ballad', 'Anthem', 'Crescendo', 'Diminuendo', 'Forte',
        'Piano', 'Allegro', 'Andante', 'Maestro', 'Virtuoso', 'Ensemble', 'Overture',
        'Resonance', 'Vibration', 'Frequency', 'Amplitude', 'Pause', 'Rest', 'Solo',
        'Orchestra', 'Conductor', 'Composer', 'Acoustics', 'Studio', 'Recording',
        // Advanced Music Theory
        'Cadence', 'Modulation', 'Transpose', 'Counterpoint', 'Polyphony', 'Monophony', 'Dissonance', 'Consonance',
        'Arpeggio', 'Glissando', 'Staccato', 'Legato', 'Rubato', 'Tenuto', 'Fermata', 'Sforzando',
        'Interval', 'Octave', 'Timbre', 'Dynamics', 'Articulation', 'Phrasing', 'Expression', 'Interpretation',
        'Motif', 'Theme', 'Variation', 'Development', 'Recapitulation', 'Exposition', 'Coda', 'Bridge',
        // Genres & Styles  
        'Jazz', 'Blues', 'Rock', 'Pop', 'Folk', 'Country', 'Reggae', 'Ska', 'Punk', 'Metal',
        'Electronic', 'Ambient', 'Techno', 'House', 'Dubstep', 'Trance', 'Hip-hop', 'Rap',
        'Classical', 'Baroque', 'Romantic', 'Contemporary', 'Minimalist', 'Avant-garde', 'Experimental',
        'World', 'Ethnic', 'Traditional', 'Fusion', 'Crossover', 'Alternative', 'Indie', 'Underground',
        // Instruments (expanded)
        'Guitar', 'Violin', 'Drums', 'Trumpet', 'Saxophone', 'Flute', 'Harp', 'Cello', 'Viola', 'Bass',
        'Keyboard', 'Synthesizer', 'Organ', 'Accordion', 'Clarinet', 'Oboe', 'Bassoon', 'Tuba',
        'Trombone', 'French Horn', 'Cornet', 'Piccolo', 'Recorder', 'Harmonica', 'Mouth Harp',
        'Sitar', 'Koto', 'Shamisen', 'Erhu', 'Dulcimer', 'Zither', 'Lyre', 'Psaltery',
        // Percussion (expanded)
        'Timpani', 'Snare', 'Cymbals', 'Gong', 'Chimes', 'Vibraphone', 'Marimba', 'Xylophone',
        'Bongos', 'Congas', 'Djembe', 'Tabla', 'Cajon', 'Cowbell', 'Woodblock', 'Claves',
        'Tambourine', 'Maracas', 'Shaker', 'Triangle', 'Castanets', 'Finger Cymbals', 'Rain Stick',
        // Electronic & Modern
        'Microphone', 'Amplifier', 'Speaker', 'Equalizer', 'Reverb', 'Delay', 'Chorus', 'Flanger',
        'Distortion', 'Overdrive', 'Compressor', 'Limiter', 'Filter', 'Oscillator', 'Envelope', 'LFO',
        'Sampler', 'Sequencer', 'Loop', 'Track', 'Mix', 'Master', 'Fade', 'Pan', 'EQ', 'Effects',
        'Digital', 'Analog', 'MIDI', 'DAW', 'Plugin', 'VST', 'Audio Interface', 'Monitor',
        // Production Terms
        'Arrangement', 'Composition', 'Score', 'Chart', 'Lead Sheet', 'Fake Book', 'Real Book',
        'Session', 'Take', 'Overdub', 'Punch-in', 'Bounce', 'Mixdown', 'Mastering', 'Vinyl',
        'Album', 'EP', 'Single', 'B-side', 'Demo', 'Bootleg', 'Live', 'Acoustic', 'Unplugged',
        // Humorous and unexpected musical terms (expanded)
        'Kazoo', 'Bongo', 'Cowbell', 'Triangle', 'Xylophone', 'Accordion', 'Bagpipes', 'Ukulele',
        'Recorder', 'Tambourine', 'Maracas', 'Harmonica', 'Ocarina', 'Didgeridoo', 'Spoons', 'Washboard',
        'Castanet', 'Kalimba', 'Melodica', 'Theremin', 'Autoharp', 'Banjo', 'Mandolin', 'Concertina',
        'Jaw Harp', 'Musical Saw', 'Glass Harmonica', 'Hang Drum', 'Steel Drum', 'Rain Stick',
        'Singing Bowl', 'Wind Chimes', 'Thumb Piano', 'Nose Flute', 'Slide Whistle', 'Wobble Board'
      ]
    };
  }

  async generateNames(request: GenerateNameRequest): Promise<string[]> {
    const { type, wordCount, count, mood, genre } = request;
    const names: string[] = [];

    // Generate all names using traditional approach
    while (names.length < count) {
      const name = await this.generateSingleName(type, wordCount, mood, genre);
      if (!names.includes(name)) {
        names.push(name);
      }
    }

    return names.slice(0, count);
  }

  private async generateSingleName(type: string, wordCount: number, mood?: string, genre?: string): Promise<string> {
    // Use simple synchronous generation to demonstrate web-enhanced vocabulary
    if (wordCount <= 3) {
      return this.generateSimpleName(type, wordCount, mood, genre);
    } else {
      return this.generateLongForm(type, wordCount, mood, genre);
    }
  }

  private generateSimpleName(type: string, wordCount: number, mood?: string, genre?: string): string {
    // Use the web-enhanced vocabulary with genre and mood filtering
    let sources = this.wordSources;
    if (mood) {
      sources = this.getStaticMoodFilteredWords(mood);
    }
    if (genre) {
      sources = this.getGenreFilteredWords(genre, sources);
    }
    
    // Generate names using the enhanced vocabulary
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      if (i === 0) {
        words.push(sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]);
      } else if (i === wordCount - 1) {
        words.push(sources.nouns[Math.floor(Math.random() * sources.nouns.length)]);
      } else {
        const allWords = [...sources.verbs, ...sources.musicalTerms];
        words.push(allWords[Math.floor(Math.random() * allWords.length)]);
      }
    }
    
    return words.join(' ');
  }

  private async generateShortForm(type: string, wordCount: number, mood?: string): Promise<string> {
    // Use enhanced vocabulary that includes web-sourced words
    let filteredSources: WordSource = this.wordSources;
    
    // When mood is specified, try to get mood-filtered words (including web words if available)
    if (mood) {
      try {
        filteredSources = this.getStaticMoodFilteredWords(mood);
      } catch (error) {
        console.error('Failed to get mood-filtered words, using base vocabulary:', error);
        filteredSources = this.wordSources;
      }
    }
    
    if (wordCount === 1) {
      // Single word names - make them impactful with creative modifications
      return this.generateSingleWordName(filteredSources);
    } else if (wordCount === 2) {
      // Two word names - use advanced pairing logic
      return this.generateTwoWordName(filteredSources, type);
    } else if (wordCount === 3) {
      // Three words - enhanced with humor and creativity
      return this.buildHumorousThreeWordPattern(filteredSources, type);
    } else if (wordCount === 4) {
      // Four words - perfect for wordplay and humor
      return this.buildHumorousFourWordPattern(filteredSources, type);
    } else {
      // Five words - narrative and complex humor
      return this.buildHumorousFiveWordPattern(filteredSources, type);
    }
  }

  private buildHumorousThreeWordPattern(sources: WordSource, type: string): string {
    // Ensure all word arrays have content, fallback to static if empty
    const safeSource = {
      adjectives: sources.adjectives && sources.adjectives.length > 0 ? sources.adjectives : this.wordSources.adjectives,
      nouns: sources.nouns && sources.nouns.length > 0 ? sources.nouns : this.wordSources.nouns,
      verbs: sources.verbs && sources.verbs.length > 0 ? sources.verbs : this.wordSources.verbs,
      musicalTerms: sources.musicalTerms && sources.musicalTerms.length > 0 ? sources.musicalTerms : this.wordSources.musicalTerms
    };
    
    const humorousPatterns = [
      // CLASSIC PATTERNS - Boosted for traditional band names
      // Classic "The [adjective] [noun]" - most iconic band name style (increased frequency)
      () => `The ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      () => `The ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      () => `The ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      () => `The ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      
      // Classic "The [noun] [noun]" - like "The Rolling Stones"
      () => {
        const noun1 = sources.nouns[Math.floor(Math.random() * sources.nouns.length)];
        let noun2 = sources.nouns[Math.floor(Math.random() * sources.nouns.length)];
        while (noun2 === noun1 && sources.nouns.length > 1) {
          noun2 = sources.nouns[Math.floor(Math.random() * sources.nouns.length)];
        }
        return `The ${noun1} ${noun2}`;
      },
      () => {
        const noun1 = sources.nouns[Math.floor(Math.random() * sources.nouns.length)];
        let noun2 = sources.nouns[Math.floor(Math.random() * sources.nouns.length)];
        while (noun2 === noun1 && sources.nouns.length > 1) {
          noun2 = sources.nouns[Math.floor(Math.random() * sources.nouns.length)];
        }
        return `The ${noun1} ${noun2}`;
      },
      
      // Classic "The [verb]ing [noun]" - like "The Smashing Pumpkins"
      () => {
        const verbs = sources.verbs.filter(v => !v.endsWith('ing')); // Get base verbs
        if (verbs.length > 0) {
          const verb = verbs[Math.floor(Math.random() * verbs.length)];
          const noun = sources.nouns[Math.floor(Math.random() * sources.nouns.length)];
          const verbIng = verb.endsWith('e') ? verb.slice(0, -1) + 'ing' : verb + 'ing';
          return `The ${verbIng} ${noun}`;
        }
        // Fallback to classic pattern
        return `The ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`;
      },
      
      // Unexpected combinations that create humor
      () => `${safeSource.adjectives[Math.floor(Math.random() * safeSource.adjectives.length)]} ${safeSource.nouns[Math.floor(Math.random() * safeSource.nouns.length)]} ${safeSource.musicalTerms[Math.floor(Math.random() * safeSource.musicalTerms.length)]}`,
      
      // Grammatically playful structures
      () => `${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      
      // Possessive structures for narrative feel
      () => `${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}'s ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      
      // Contradictory combinations for surprise
      () => {
        const opposites = [
          ['Big', 'Small'], ['Hot', 'Cold'], ['Fast', 'Slow'], ['Happy', 'Sad'],
          ['Loud', 'Silent'], ['Bright', 'Dark'], ['Hard', 'Soft'], ['Wild', 'Gentle'],
          ['Ancient', 'Modern'], ['Sweet', 'Bitter'], ['Smooth', 'Rough'], ['Empty', 'Full']
        ];
        const oppositePair = opposites[Math.floor(Math.random() * opposites.length)];
        return `${oppositePair[0]} ${oppositePair[1]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`;
      },
      
      // Alliterative combinations
      () => {
        const letter = sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)].charAt(0).toLowerCase();
        const matchingNouns = sources.nouns.filter(n => n.toLowerCase().startsWith(letter));
        const matchingMusical = sources.musicalTerms.filter(m => m.toLowerCase().startsWith(letter));
        
        if (matchingNouns.length > 0 && Math.random() > 0.5) {
          return `${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${matchingNouns[Math.floor(Math.random() * matchingNouns.length)]} ${sources.musicalTerms[Math.floor(Math.random() * sources.musicalTerms.length)]}`;
        } else if (matchingMusical.length > 0) {
          return `${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${matchingMusical[Math.floor(Math.random() * matchingMusical.length)]}`;
        }
        
        // Fallback to regular pattern
        return `${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.musicalTerms[Math.floor(Math.random() * sources.musicalTerms.length)]}`;
      },
      
      // Emotional journey pattern
      () => {
        const emotions = sources.adjectives.filter(adj => 
          ['happy', 'sad', 'angry', 'lonely', 'euphoric', 'melancholy', 'serene', 'chaotic'].some(e => 
            adj.toLowerCase().includes(e)
          )
        );
        const emotion = emotions.length > 0 ? emotions[Math.floor(Math.random() * emotions.length)] : sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)];
        return `${emotion} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]}`;
      },
      
      // Number-based pattern for quirkiness
      () => {
        const numbers = ['Two', 'Three', 'Seven', 'Thirteen', 'Hundred', 'Thousand', 'Million'];
        const number = numbers[Math.floor(Math.random() * numbers.length)];
        return `${number} ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`;
      }
    ];
    
    const pattern = humorousPatterns[Math.floor(Math.random() * humorousPatterns.length)];
    return pattern();
  }

  private buildHumorousFourWordPattern(sources: WordSource, type: string): string {
    const humorousPatterns = [
      // Question-like structures
      () => `Who ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} the ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}?`,
      
      // Comparative structures for humor
      () => `${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} Than ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      
      // Unexpected professional titles
      () => `${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.musicalTerms[Math.floor(Math.random() * sources.musicalTerms.length)]}`,
      
      // Temporal paradoxes for intrigue
      () => `Yesterday's ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]}`,
      
      // Location-based humor
      () => `${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} From ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      
      // Abstract concepts made concrete
      () => `The ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.musicalTerms[Math.floor(Math.random() * sources.musicalTerms.length)]}`
    ];
    
    const pattern = humorousPatterns[Math.floor(Math.random() * humorousPatterns.length)];
    return pattern();
  }

  private buildHumorousFiveWordPattern(sources: WordSource, type: string): string {
    const humorousPatterns = [
      // Narrative structures with unexpected endings
      () => `${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.musicalTerms[Math.floor(Math.random() * sources.musicalTerms.length)]}`,
      
      // Absurd how-to titles
      () => `How to ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.musicalTerms[Math.floor(Math.random() * sources.musicalTerms.length)]}`,
      
      // Impossible scenarios
      () => `When ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]}`,
      
      // Philosophical absurdities
      () => `Why ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.musicalTerms[Math.floor(Math.random() * sources.musicalTerms.length)]}`,
      
      // Compound contradictions
      () => `${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} and ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      
      // Time-based paradoxes
      () => `${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} from ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      
      // Emotional journeys
      () => `${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.musicalTerms[Math.floor(Math.random() * sources.musicalTerms.length)]}`
    ];
    
    const pattern = humorousPatterns[Math.floor(Math.random() * humorousPatterns.length)];
    return pattern();
  }

  private async getFilteredWordSources(mood?: string): Promise<WordSource> {
    if (!mood) {
      return this.wordSources;
    }

    // Fetch fresh web words for the specific mood
    try {
      const webWords = await this.fetchMoodSpecificWords(mood);
      
      // Merge web words with mood-filtered static words
      const staticFiltered = this.getStaticMoodFilteredWords(mood);
      
      return {
        adjectives: this.removeDuplicates([...webWords.adjectives, ...staticFiltered.adjectives]),
        nouns: this.removeDuplicates([...webWords.nouns, ...staticFiltered.nouns]),
        verbs: this.removeDuplicates([...webWords.verbs, ...staticFiltered.verbs]),
        musicalTerms: this.removeDuplicates([...webWords.musicalTerms, ...staticFiltered.musicalTerms])
      };
    } catch (error) {
      console.error('Error fetching web words for mood, using static fallback:', error);
      return this.getStaticMoodFilteredWords(mood);
    }
  }

  private getStaticMoodFilteredWords(mood?: string): WordSource {
    if (!mood) {
      return this.wordSources;
    }

    const moodThemes = {
      dark: {
        adjectives: ['Dark', 'Shadow', 'Midnight', 'Black', 'Haunted', 'Broken', 'Twisted', 'Hollow', 'Wounded', 'Lost', 'Forgotten', 'Brutal', 'Raw'],
        nouns: ['Shadow', 'Darkness', 'Nightmare', 'Abyss', 'Void', 'Grave', 'Raven', 'Wolf', 'Serpent', 'Storm', 'Pain', 'Wound', 'Sorrow'],
        verbs: ['Falling', 'Breaking', 'Destroying', 'Bleeding', 'Withering', 'Fading', 'Disappearing', 'Screaming', 'Dying'],
        musicalTerms: ['Requiem', 'Dirge', 'Lament', 'Minor', 'Diminuendo']
      },
      bright: {
        adjectives: ['Bright', 'Golden', 'Silver', 'Radiant', 'Shining', 'Pure', 'Crystal', 'Brilliant', 'Luminous', 'Sparkling'],
        nouns: ['Light', 'Sun', 'Star', 'Dawn', 'Hope', 'Joy', 'Victory', 'Glory', 'Heaven', 'Angel', 'Phoenix'],
        verbs: ['Rising', 'Shining', 'Glowing', 'Soaring', 'Flying', 'Dancing', 'Singing', 'Blooming', 'Growing'],
        musicalTerms: ['Major', 'Crescendo', 'Forte', 'Allegro', 'Vivace', 'Anthem', 'Fanfare']
      },
      mysterious: {
        adjectives: ['Mystic', 'Enigmatic', 'Hidden', 'Secret', 'Ancient', 'Ethereal', 'Veiled', 'Cryptic', 'Arcane'],
        nouns: ['Mystery', 'Secret', 'Riddle', 'Phantom', 'Spirit', 'Vision', 'Oracle', 'Prophecy', 'Rune'],
        verbs: ['Whispering', 'Emerging', 'Revealing', 'Concealing', 'Drifting', 'Floating'],
        musicalTerms: ['Mystique', 'Prelude', 'Interlude', 'Whisper']
      },
      energetic: {
        adjectives: ['Electric', 'Dynamic', 'Fierce', 'Wild', 'Explosive', 'Blazing', 'Thunderous', 'Powerful'],
        nouns: ['Thunder', 'Lightning', 'Fire', 'Storm', 'Energy', 'Power', 'Force', 'Warrior'],
        verbs: ['Racing', 'Charging', 'Exploding', 'Blazing', 'Rushing', 'Soaring'],
        musicalTerms: ['Rock', 'Beat', 'Rhythm', 'Forte', 'Allegro', 'Presto']
      },
      melancholy: {
        adjectives: ['Melancholy', 'Lonely', 'Distant', 'Fading', 'Nostalgic', 'Wistful', 'Bittersweet'],
        nouns: ['Memory', 'Echo', 'Ghost', 'Dream', 'Tears', 'Rain', 'Autumn', 'Goodbye'],
        verbs: ['Remembering', 'Longing', 'Yearning', 'Drifting', 'Weeping'],
        musicalTerms: ['Ballad', 'Lament', 'Elegy', 'Adagio', 'Andante']
      },
      ethereal: {
        adjectives: ['Ethereal', 'Celestial', 'Divine', 'Transcendent', 'Otherworldly', 'Sublime'],
        nouns: ['Heaven', 'Cloud', 'Mist', 'Angel', 'Spirit', 'Cosmos', 'Infinity'],
        verbs: ['Floating', 'Ascending', 'Transcending', 'Gliding'],
        musicalTerms: ['Harmony', 'Resonance', 'Celestial', 'Divine']
      },
      aggressive: {
        adjectives: ['Aggressive', 'Fierce', 'Brutal', 'Savage', 'Wild', 'Violent', 'Raw', 'Intense'],
        nouns: ['War', 'Battle', 'Rage', 'Fury', 'Beast', 'Warrior', 'Destroyer', 'Chaos'],
        verbs: ['Attacking', 'Destroying', 'Crushing', 'Raging', 'Fighting', 'Screaming'],
        musicalTerms: ['Forte', 'Sforzando', 'Crescendo', 'Percussion', 'Metal']
      },
      peaceful: {
        adjectives: ['Peaceful', 'Serene', 'Calm', 'Gentle', 'Tranquil', 'Soothing', 'Quiet'],
        nouns: ['Peace', 'Serenity', 'Calm', 'Garden', 'Meadow', 'Dove', 'Sanctuary'],
        verbs: ['Resting', 'Flowing', 'Breathing', 'Calming', 'Soothing'],
        musicalTerms: ['Piano', 'Dolce', 'Andante', 'Lullaby', 'Pastoral']
      },
      nostalgic: {
        adjectives: ['Nostalgic', 'Vintage', 'Retro', 'Old', 'Classic', 'Timeless', 'Forgotten'],
        nouns: ['Memory', 'Past', 'History', 'Album', 'Photo', 'Record', 'Yesterday'],
        verbs: ['Remembering', 'Recalling', 'Reminiscing', 'Longing'],
        musicalTerms: ['Vinyl', 'Classic', 'Vintage', 'Oldies', 'Retro']
      },
      futuristic: {
        adjectives: ['Futuristic', 'Cyber', 'Digital', 'Electronic', 'Synthetic', 'Virtual', 'Neon'],
        nouns: ['Future', 'Technology', 'Robot', 'Code', 'Circuit', 'Data', 'Matrix'],
        verbs: ['Computing', 'Processing', 'Transmitting', 'Uploading'],
        musicalTerms: ['Electronic', 'Synth', 'Digital', 'Techno', 'Cyber']
      },
      romantic: {
        adjectives: ['Romantic', 'Loving', 'Passionate', 'Sweet', 'Tender', 'Devotional', 'Intimate'],
        nouns: ['Love', 'Heart', 'Romance', 'Kiss', 'Embrace', 'Devotion', 'Valentine'],
        verbs: ['Loving', 'Embracing', 'Kissing', 'Cherishing', 'Adoring'],
        musicalTerms: ['Serenade', 'Love Song', 'Ballad', 'Romance', 'Duet']
      },
      epic: {
        adjectives: ['Epic', 'Legendary', 'Heroic', 'Majestic', 'Grand', 'Monumental', 'Triumphant'],
        nouns: ['Legend', 'Hero', 'Quest', 'Adventure', 'Glory', 'Victory', 'Champion'],
        verbs: ['Conquering', 'Triumphing', 'Rising', 'Achieving', 'Overcoming'],
        musicalTerms: ['Symphony', 'Orchestral', 'Fanfare', 'March', 'Anthem']
      }
    };

    const theme = moodThemes[mood as keyof typeof moodThemes];
    if (!theme) {
      return this.wordSources;
    }

    // Combine mood-specific words with general vocabulary for variety
    return {
      adjectives: [...theme.adjectives, ...this.wordSources.adjectives.filter(word => 
        !theme.adjectives.some(moodWord => moodWord.toLowerCase() === word.toLowerCase())
      )].slice(0, 40),
      nouns: [...theme.nouns, ...this.wordSources.nouns.filter(word => 
        !theme.nouns.some(moodWord => moodWord.toLowerCase() === word.toLowerCase())
      )].slice(0, 40),
      verbs: [...theme.verbs, ...this.wordSources.verbs.filter(word => 
        !theme.verbs.some(moodWord => moodWord.toLowerCase() === word.toLowerCase())
      )].slice(0, 30),
      musicalTerms: [...theme.musicalTerms, ...this.wordSources.musicalTerms.filter(word => 
        !theme.musicalTerms.some(moodWord => moodWord.toLowerCase() === word.toLowerCase())
      )].slice(0, 30)
    };
  }

  private generateLongForm(type: string, wordCount: number, mood?: string, genre?: string): string {
    // Use synchronous mood and genre filtering for long form generation
    let filteredSources = this.wordSources;
    if (mood) {
      filteredSources = this.getStaticMoodFilteredWords(mood);
    }
    if (genre) {
      filteredSources = this.getGenreFilteredWords(genre, filteredSources);
    }
    
    // Define grammatical patterns for longer names (4+ words) with better flow
    const patterns = [
      // Pattern 1: Statement structure - "The [adjective] [noun] [connector] [noun]" (5 words max)
      () => wordCount === 4 ? this.buildPattern(['article', 'adjective', 'noun', 'connector'], filteredSources) :
            wordCount === 5 ? this.buildPattern(['article', 'adjective', 'noun', 'connector', 'noun'], filteredSources) :
            this.buildPattern(['article', 'adjective', 'noun', 'connector', 'adjective', 'noun'], filteredSources),
      
      // Pattern 2: Narrative flow - "[noun] [temporal] [adjective] [noun]" (4+ words)
      () => wordCount === 4 ? this.buildPattern(['noun', 'temporal', 'adjective', 'noun'], filteredSources) :
            wordCount === 5 ? this.buildPattern(['noun', 'temporal', 'adjective', 'noun', 'musical'], filteredSources) :
            this.buildPattern(['noun', 'temporal', 'adjective', 'noun', 'musical', 'noun'], filteredSources),
      
      // Pattern 3: Descriptive relationship - "[adjective] [noun] [relationship] [adjective] [noun]" (5+ words)
      () => wordCount === 4 ? this.buildPattern(['adjective', 'noun', 'relationship', 'noun'], filteredSources) :
            wordCount === 5 ? this.buildPattern(['adjective', 'noun', 'relationship', 'adjective', 'noun'], filteredSources) :
            this.buildPattern(['adjective', 'noun', 'relationship', 'adjective', 'noun', 'musical'], filteredSources),
      
      // Pattern 4: Action statement - "[verb] [connector] [adjective] [noun]" (4+ words)
      () => wordCount === 4 ? this.buildPattern(['verb', 'connector', 'adjective', 'noun'], filteredSources) :
            wordCount === 5 ? this.buildPattern(['verb', 'connector', 'adjective', 'noun', 'musical'], filteredSources) :
            this.buildPattern(['verb', 'connector', 'adjective', 'noun', 'musical', 'noun'], filteredSources),
      
      // Pattern 5: Musical narrative - "[musical] [temporal] [adjective] [noun]" (4+ words)
      () => wordCount === 4 ? this.buildPattern(['musical', 'temporal', 'adjective', 'noun'], filteredSources) :
            wordCount === 5 ? this.buildPattern(['musical', 'temporal', 'adjective', 'noun', 'musical'], filteredSources) :
            this.buildPattern(['musical', 'temporal', 'adjective', 'noun', 'musical', 'noun'], filteredSources),
      
      // Pattern 6: Poetic repetition (good for songs)
      () => this.buildRepetitivePattern(wordCount, filteredSources),
      
      // Pattern 7: Abstract/atmospheric (good for both)
      () => this.buildAtmosphericPattern(wordCount, filteredSources),
      
      // Pattern 8: Action-based narrative
      () => this.buildNarrativePattern(wordCount, filteredSources)
    ];

    // Choose pattern based on type preference and word count
    let selectedPatterns = patterns;
    if (type === 'song') {
      // Songs favor more descriptive and narrative patterns with good flow
      selectedPatterns = wordCount >= 5 
        ? [patterns[0], patterns[1], patterns[2], patterns[5], patterns[6], patterns[7]] // More complex for longer songs
        : [patterns[0], patterns[1], patterns[4], patterns[6], patterns[7]]; // Simpler for shorter songs
    } else if (type === 'band') {
      // Bands favor more memorable and action-based patterns with statements
      selectedPatterns = wordCount >= 5
        ? [patterns[0], patterns[3], patterns[4], patterns[5], patterns[7]] // Complex statements for longer band names
        : [patterns[0], patterns[2], patterns[3], patterns[4], patterns[7]]; // Punchy statements for shorter band names
    }

    const pattern = selectedPatterns[Math.floor(Math.random() * selectedPatterns.length)];
    return pattern();
  }

  private getGenreFilteredWords(genre: string, sources: WordSource): WordSource {
    const genreFilters = {
      'rock': {
        adjectives: ['Electric', 'Wild', 'Raw', 'Loud', 'Rebel', 'Hard', 'Heavy', 'Steel', 'Thunder', 'Lightning', 'Storm', 'Fire', 'Burning', 'Blazing', 'Fierce', 'Savage', 'Brutal', 'Powerful', 'Crushing', 'Roaring'],
        nouns: ['Thunder', 'Lightning', 'Storm', 'Fire', 'Steel', 'Stone', 'Mountain', 'Volcano', 'Eagle', 'Wolf', 'Tiger', 'Hammer', 'Blade', 'Warrior', 'Rebel', 'Machine', 'Engine', 'Power', 'Force', 'Energy'],
        verbs: ['Rock', 'Roll', 'Smash', 'Crash', 'Burn', 'Blast', 'Strike', 'Thunder', 'Roar', 'Scream', 'Shout', 'Drive', 'Rush', 'Charge', 'Fight', 'Battle', 'Rage', 'Storm', 'Explode', 'Ignite'],
        musicalTerms: ['Amp', 'Riff', 'Guitar', 'Bass', 'Drums', 'Distortion', 'Power Chord', 'Solo', 'Headbang', 'Mosh', 'Stage', 'Microphone', 'Volume', 'Feedback', 'Marshall', 'Fender', 'Gibson', 'Stratocaster', 'Les Paul', 'Pickup']
      },
      'metal': {
        adjectives: ['Black', 'Death', 'Doom', 'Brutal', 'Savage', 'Dark', 'Evil', 'Infernal', 'Demonic', 'Hellish', 'Necro', 'Grim', 'Frost', 'Iron', 'Steel', 'Blood', 'Crimson', 'Void', 'Unholy', 'Wicked'],
        nouns: ['Death', 'Doom', 'Hell', 'Demon', 'Beast', 'Dragon', 'Skull', 'Bone', 'Blood', 'Iron', 'Steel', 'Blade', 'Sword', 'Axe', 'Throne', 'Crown', 'Darkness', 'Shadow', 'Abyss', 'Void'],
        verbs: ['Destroy', 'Annihilate', 'Devastate', 'Crush', 'Slaughter', 'Massacre', 'Burn', 'Melt', 'Forge', 'Strike', 'Pound', 'Hammer', 'Grind', 'Shred', 'Tear', 'Rip', 'Slay', 'Conquer', 'Dominate', 'Rule'],
        musicalTerms: ['Blast Beat', 'Tremolo', 'Growl', 'Scream', 'Double Bass', 'Drop Tuning', 'Distortion', 'Overdrive', 'Feedback', 'Harmonics', 'Palm Mute', 'Sweep Pick', 'Shred', 'Breakdown', 'Mosh Pit', 'Wall of Death', 'Circle Pit', 'Headbang', 'Corpse Paint', 'Battle Vest']
      },
      'jazz': {
        adjectives: ['Smooth', 'Cool', 'Blue', 'Velvet', 'Silky', 'Elegant', 'Sophisticated', 'Mellow', 'Warm', 'Rich', 'Deep', 'Sultry', 'Midnight', 'Golden', 'Amber', 'Honey', 'Sweet', 'Gentle', 'Soft', 'Dreamy'],
        nouns: ['Blue', 'Note', 'Melody', 'Harmony', 'Rhythm', 'Soul', 'Spirit', 'Heart', 'Moon', 'Night', 'Dream', 'Whisper', 'Breeze', 'Rain', 'Cafe', 'Club', 'Lounge', 'Bar', 'Street', 'Avenue'],
        verbs: ['Swing', 'Sway', 'Flow', 'Glide', 'Dance', 'Improvise', 'Syncopate', 'Harmonize', 'Groove', 'Vibe', 'Feel', 'Express', 'Interpret', 'Create', 'Innovate', 'Explore', 'Discover', 'Journey', 'Wander', 'Float'],
        musicalTerms: ['Swing', 'Bebop', 'Cool Jazz', 'Fusion', 'Improvisation', 'Syncopation', 'Blue Note', 'Chord Changes', 'Walking Bass', 'Comping', 'Scat', 'Standard', 'Real Book', 'Jam Session', 'Cutting Contest', 'Sideman', 'Rhythm Section', 'Horn Section', 'Big Band', 'Small Combo']
      },
      'electronic': {
        adjectives: ['Digital', 'Synthetic', 'Cyber', 'Electric', 'Neon', 'Techno', 'Virtual', 'Binary', 'Quantum', 'Laser', 'Plasma', 'Neural', 'Matrix', 'Circuit', 'Pulse', 'Wave', 'Frequency', 'Modular', 'Analog', 'Future'],
        nouns: ['Synth', 'Circuit', 'Wire', 'Code', 'Data', 'Signal', 'Frequency', 'Wave', 'Pulse', 'Beat', 'Drop', 'Loop', 'Sample', 'Grid', 'Matrix', 'Network', 'System', 'Machine', 'Robot', 'Algorithm'],
        verbs: ['Synthesize', 'Process', 'Compute', 'Generate', 'Modulate', 'Filter', 'Compress', 'Sequence', 'Program', 'Code', 'Upload', 'Download', 'Stream', 'Transmit', 'Broadcast', 'Connect', 'Interface', 'Boot', 'Initialize', 'Execute'],
        musicalTerms: ['BPM', 'Bass Drop', 'Wobble', 'Filter Sweep', 'LFO', 'Oscillator', 'Envelope', 'Reverb', 'Delay', 'Chorus', 'Flanger', 'Phaser', 'Compressor', 'Sidechain', 'Vocoder', 'Auto-Tune', 'Sampler', 'Sequencer', 'DAW', 'MIDI']
      },
      'folk': {
        adjectives: ['Old', 'Ancient', 'Traditional', 'Rural', 'Country', 'Rustic', 'Simple', 'Pure', 'Natural', 'Organic', 'Earthy', 'Wooden', 'Stone', 'Wild', 'Free', 'Wandering', 'Traveling', 'Nomadic', 'Pastoral', 'Humble'],
        nouns: ['Road', 'Path', 'Trail', 'Mountain', 'Valley', 'River', 'Stream', 'Forest', 'Tree', 'Root', 'Branch', 'Leaf', 'Flower', 'Field', 'Farm', 'Village', 'Town', 'Home', 'Hearth', 'Story'],
        verbs: ['Wander', 'Roam', 'Travel', 'Journey', 'Walk', 'Sing', 'Tell', 'Share', 'Remember', 'Recall', 'Preserve', 'Pass Down', 'Teach', 'Learn', 'Gather', 'Harvest', 'Plant', 'Grow', 'Nurture', 'Tend'],
        musicalTerms: ['Ballad', 'Fiddle', 'Banjo', 'Mandolin', 'Harmonica', 'Acoustic', 'Fingerpicking', 'Strumming', 'Dulcimer', 'Penny Whistle', 'Concertina', 'Accordion', 'Dobro', 'Washboard', 'Jug', 'Spoons', 'Clogging', 'Square Dance', 'Hoedown', 'Campfire']
      },
      'classical': {
        adjectives: ['Grand', 'Majestic', 'Noble', 'Elegant', 'Refined', 'Graceful', 'Sublime', 'Divine', 'Heavenly', 'Ethereal', 'Timeless', 'Eternal', 'Perfect', 'Harmonious', 'Melodious', 'Orchestral', 'Symphonic', 'Chamber', 'Baroque', 'Romantic'],
        nouns: ['Symphony', 'Concerto', 'Sonata', 'Fugue', 'Prelude', 'Nocturne', 'Waltz', 'Minuet', 'Rondo', 'Variation', 'Movement', 'Theme', 'Motif', 'Phrase', 'Cadence', 'Harmony', 'Counterpoint', 'Canon', 'Aria', 'Overture'],
        verbs: ['Compose', 'Conduct', 'Perform', 'Interpret', 'Express', 'Harmonize', 'Orchestrate', 'Arrange', 'Transcribe', 'Modulate', 'Resolve', 'Develop', 'Elaborate', 'Embellish', 'Ornament', 'Phrase', 'Articulate', 'Breathe', 'Flow', 'Soar'],
        musicalTerms: ['Allegro', 'Andante', 'Adagio', 'Fortissimo', 'Pianissimo', 'Crescendo', 'Diminuendo', 'Staccato', 'Legato', 'Vibrato', 'Tremolo', 'Glissando', 'Arpeggio', 'Scale', 'Chromatic', 'Diatonic', 'Pentatonic', 'Major', 'Minor', 'Augmented']
      },
      'hip-hop': {
        adjectives: ['Fresh', 'Dope', 'Sick', 'Raw', 'Real', 'Street', 'Urban', 'Underground', 'Independent', 'Original', 'Authentic', 'Hard', 'Smooth', 'Slick', 'Sharp', 'Quick', 'Fast', 'Rapid', 'Bold', 'Confident'],
        nouns: ['Beat', 'Rhyme', 'Flow', 'Verse', 'Hook', 'Bridge', 'Break', 'Sample', 'Loop', 'Track', 'Mix', 'Scratch', 'Turntable', 'Microphone', 'Studio', 'Booth', 'Cipher', 'Freestyle', 'Battle', 'Crew'],
        verbs: ['Rap', 'Spit', 'Flow', 'Drop', 'Kick', 'Serve', 'Deliver', 'Freestyle', 'Battle', 'Cipher', 'Scratch', 'Mix', 'Blend', 'Cut', 'Loop', 'Sample', 'Chop', 'Flip', 'Remix', 'Produce'],
        musicalTerms: ['808', 'Kick', 'Snare', 'Hi-Hat', 'Sample', 'Loop', 'Break', 'Scratch', 'Turntable', 'DJ', 'MC', 'B-Boy', 'Graffiti', 'Beatbox', 'Freestyle', 'Cypher', 'Battle', 'Crew', 'Posse', 'Squad']
      },
      'country': {
        adjectives: ['Country', 'Southern', 'Western', 'Rural', 'Small-Town', 'Backwood', 'Hillbilly', 'Cowboy', 'Outlaw', 'Rebel', 'Honest', 'Simple', 'True', 'Real', 'Authentic', 'Traditional', 'Old-School', 'Classic', 'Vintage', 'Rustic'],
        nouns: ['Road', 'Highway', 'Truck', 'Farm', 'Ranch', 'Barn', 'Field', 'Creek', 'Mountain', 'Valley', 'Town', 'Church', 'Honky-Tonk', 'Saloon', 'Bar', 'Porch', 'Moonshine', 'Whiskey', 'Beer', 'Pickup'],
        verbs: ['Drive', 'Ride', 'Roll', 'Cruise', 'Roam', 'Wander', 'Drift', 'Settle', 'Work', 'Farm', 'Ranch', 'Fish', 'Hunt', 'Drink', 'Party', 'Dance', 'Sing', 'Play', 'Strum', 'Pick'],
        musicalTerms: ['Twang', 'Slide Guitar', 'Steel Guitar', 'Dobro', 'Banjo', 'Fiddle', 'Harmonica', 'Mandolin', 'Acoustic', 'Fingerpicking', 'Flatpicking', 'Nashville', 'Grand Ole Opry', 'Honky-Tonk', 'Bluegrass', 'Rockabilly', 'Outlaw', 'Alt-Country', 'Americana', 'Roots']
      },
      'blues': {
        adjectives: ['Blue', 'Deep', 'Soulful', 'Raw', 'Gritty', 'Rough', 'Smooth', 'Slow', 'Heavy', 'Thick', 'Rich', 'Dark', 'Moody', 'Melancholy', 'Sad', 'Lonesome', 'Lonely', 'Empty', 'Hollow', 'Aching'],
        nouns: ['Blues', 'Soul', 'Heart', 'Pain', 'Sorrow', 'Trouble', 'Worry', 'Cross', 'Road', 'Highway', 'Train', 'River', 'Delta', 'Chicago', 'Memphis', 'Mississippi', 'Cotton', 'Field', 'Plantation', 'Juke Joint'],
        verbs: ['Cry', 'Weep', 'Moan', 'Wail', 'Suffer', 'Hurt', 'Ache', 'Grieve', 'Mourn', 'Lament', 'Struggle', 'Fight', 'Survive', 'Endure', 'Overcome', 'Rise', 'Escape', 'Travel', 'Journey', 'Migrate'],
        musicalTerms: ['12-Bar', 'Pentatonic', 'Blue Note', 'Bend', 'Slide', 'Vibrato', 'Shuffle', 'Swing', 'Call and Response', 'Delta', 'Chicago', 'Electric', 'Acoustic', 'Harmonica', 'Slide Guitar', 'Bottleneck', 'Resonator', 'Dobro', 'Lap Steel', 'Washboard']
      },
      'reggae': {
        adjectives: ['Rasta', 'Irie', 'Positive', 'Uplifting', 'Spiritual', 'Conscious', 'Righteous', 'Peaceful', 'Unity', 'One Love', 'Jah', 'Blessed', 'Sacred', 'Holy', 'Divine', 'Natural', 'Organic', 'Green', 'Gold', 'Red'],
        nouns: ['Babylon', 'Zion', 'Jah', 'Rasta', 'Lion', 'Dread', 'Locks', 'Ganja', 'Herb', 'Nature', 'Earth', 'Creation', 'Universe', 'Love', 'Peace', 'Unity', 'Freedom', 'Liberation', 'Revolution', 'Uprising'],
        verbs: ['Rise', 'Rise Up', 'Stand Up', 'Get Up', 'Wake Up', 'Arise', 'Rebel', 'Resist', 'Fight', 'Struggle', 'Overcome', 'Conquer', 'Unite', 'Love', 'Praise', 'Worship', 'Celebrate', 'Dance', 'Skank', 'Bubble'],
        musicalTerms: ['Skank', 'One Drop', 'Steppers', 'Rockers', 'Bubble', 'Dub', 'Riddim', 'Bassline', 'Off-Beat', 'Nyabinghi', 'Rastafari', 'Sound System', 'Toasting', 'DJ', 'Selector', 'Dubplate', 'Version', 'Instrumental', 'Melodica', 'Clave']
      },
      'punk': {
        adjectives: ['Punk', 'Rebel', 'Anti', 'Raw', 'Fast', 'Loud', 'Angry', 'Pissed', 'Mad', 'Furious', 'Radical', 'Revolutionary', 'Anarchist', 'Underground', 'DIY', 'Independent', 'Hardcore', 'Straight Edge', 'Political', 'Social'],
        nouns: ['Anarchy', 'Chaos', 'Riot', 'Revolt', 'Revolution', 'Uprising', 'Protest', 'Resistance', 'Opposition', 'System', 'Authority', 'Government', 'Police', 'State', 'Society', 'Conformity', 'Mainstream', 'Establishment', 'Machine', 'Power'],
        verbs: ['Rebel', 'Revolt', 'Riot', 'Protest', 'Resist', 'Oppose', 'Fight', 'Battle', 'Destroy', 'Smash', 'Break', 'Tear Down', 'Overthrow', 'Reject', 'Refuse', 'Defy', 'Challenge', 'Question', 'Criticize', 'Attack'],
        musicalTerms: ['Power Chord', 'Distortion', 'Feedback', 'Fuzz', 'Overdrive', 'Fast', 'Aggressive', 'Raw', 'Lo-Fi', 'DIY', 'Three Chord', 'Simple', 'Direct', 'Honest', 'Authentic', 'Garage', 'Basement', 'Club', 'Venue', 'Scene']
      },
      'indie': {
        adjectives: ['Independent', 'Alternative', 'Underground', 'Artsy', 'Creative', 'Original', 'Unique', 'Quirky', 'Eccentric', 'Experimental', 'Avant-Garde', 'Lo-Fi', 'DIY', 'Handmade', 'Crafted', 'Boutique', 'Small', 'Local', 'Community', 'Grass-Roots'],
        nouns: ['Art', 'Craft', 'Creation', 'Expression', 'Voice', 'Vision', 'Dream', 'Imagination', 'Inspiration', 'Muse', 'Spirit', 'Soul', 'Heart', 'Mind', 'Thought', 'Idea', 'Concept', 'Project', 'Collective', 'Community'],
        verbs: ['Create', 'Express', 'Explore', 'Experiment', 'Discover', 'Invent', 'Innovate', 'Craft', 'Build', 'Make', 'Design', 'Compose', 'Write', 'Record', 'Produce', 'Release', 'Share', 'Connect', 'Inspire', 'Influence'],
        musicalTerms: ['Lo-Fi', 'Bedroom Pop', 'Dream Pop', 'Shoegaze', 'Post-Rock', 'Math Rock', 'Emo', 'Screamo', 'Indie Rock', 'Indie Pop', 'Alternative', 'Underground', 'DIY', 'Self-Released', 'Bandcamp', 'Soundcloud', 'Cassette', 'Vinyl', '7-Inch', 'EP']
      },
      'pop': {
        adjectives: ['Popular', 'Catchy', 'Bright', 'Shiny', 'Glossy', 'Polished', 'Perfect', 'Sweet', 'Sugary', 'Bubbly', 'Upbeat', 'Happy', 'Joyful', 'Cheerful', 'Positive', 'Energetic', 'Dynamic', 'Vibrant', 'Colorful', 'Fun'],
        nouns: ['Pop', 'Hit', 'Chart', 'Radio', 'Airplay', 'Single', 'Album', 'Track', 'Song', 'Melody', 'Hook', 'Chorus', 'Verse', 'Bridge', 'Beat', 'Rhythm', 'Dance', 'Party', 'Club', 'Stage'],
        verbs: ['Pop', 'Bounce', 'Dance', 'Move', 'Groove', 'Shake', 'Shimmer', 'Sparkle', 'Shine', 'Glow', 'Radiate', 'Burst', 'Explode', 'Celebrate', 'Party', 'Have Fun', 'Enjoy', 'Love', 'Adore', 'Worship'],
        musicalTerms: ['Hook', 'Chorus', 'Bridge', 'Pre-Chorus', 'Verse', 'Refrain', 'Melody', 'Harmony', 'Auto-Tune', 'Pitch Perfect', 'Catchy', 'Earworm', 'Radio Friendly', 'Commercial', 'Mainstream', 'Top 40', 'Billboard', 'Chart Topper', 'Hit Single', 'Pop Star']
      },
      'alternative': {
        adjectives: ['Alternative', 'Different', 'Unique', 'Non-Conformist', 'Anti-Mainstream', 'Underground', 'Subversive', 'Edgy', 'Dark', 'Moody', 'Atmospheric', 'Ambient', 'Ethereal', 'Dreamy', 'Surreal', 'Abstract', 'Conceptual', 'Intellectual', 'Artistic', 'Creative'],
        nouns: ['Alternative', 'Option', 'Choice', 'Path', 'Route', 'Way', 'Direction', 'Perspective', 'View', 'Angle', 'Approach', 'Method', 'Style', 'Form', 'Shape', 'Structure', 'Framework', 'Concept', 'Idea', 'Theory'],
        verbs: ['Alternate', 'Change', 'Shift', 'Transform', 'Morph', 'Evolve', 'Develop', 'Progress', 'Advance', 'Move', 'Flow', 'Drift', 'Float', 'Hover', 'Suspend', 'Balance', 'Equilibrate', 'Stabilize', 'Center', 'Focus'],
        musicalTerms: ['Grunge', 'Shoegaze', 'Post-Punk', 'New Wave', 'Gothic', 'Industrial', 'Noise', 'Experimental', 'Ambient', 'Drone', 'Post-Rock', 'Math Rock', 'Emo', 'Screamo', 'Hardcore', 'Metalcore', 'Prog', 'Psychedelic', 'Krautrock', 'No Wave']
      }
    };

    const genreWords = genreFilters[genre as keyof typeof genreFilters];
    if (!genreWords) {
      return sources; // Return original if genre not found
    }

    // Combine genre-specific words with existing words, prioritizing genre words
    return {
      adjectives: [...genreWords.adjectives, ...sources.adjectives.slice(0, 20)].slice(0, 50),
      nouns: [...genreWords.nouns, ...sources.nouns.slice(0, 20)].slice(0, 50),
      verbs: [...genreWords.verbs, ...sources.verbs.slice(0, 20)].slice(0, 50),
      musicalTerms: [...genreWords.musicalTerms, ...sources.musicalTerms.slice(0, 20)].slice(0, 50)
    };
  }

  private buildPattern(structure: string[], wordSources?: WordSource): string {
    // Add defensive programming for structure parameter
    if (!structure || !Array.isArray(structure) || structure.length === 0) {
      console.error('Invalid structure passed to buildPattern:', structure);
      return 'Mysterious Sound'; // fallback
    }
    
    const sources = wordSources || this.wordSources;
    
    // Ensure sources are valid - fallback to base if empty
    const validSources = {
      adjectives: (sources.adjectives && sources.adjectives.length > 0) ? sources.adjectives : this.wordSources.adjectives,
      nouns: (sources.nouns && sources.nouns.length > 0) ? sources.nouns : this.wordSources.nouns,
      verbs: (sources.verbs && sources.verbs.length > 0) ? sources.verbs : this.wordSources.verbs,
      musicalTerms: (sources.musicalTerms && sources.musicalTerms.length > 0) ? sources.musicalTerms : this.wordSources.musicalTerms
    };
    
    const words: string[] = [];
    const articles = ['The', 'A', 'An', 'These', 'Those', 'Every', 'All'];
    const prepositions = ['of', 'in', 'on', 'under', 'through', 'beyond', 'within', 'across', 'into', 'before', 'after', 'during', 'beside', 'behind', 'above', 'below', 'between', 'among', 'against', 'toward', 'beneath'];
    const conjunctions = ['and', 'or', 'but', 'yet', 'so', 'for'];
    const connectingWords = ['into', 'before', 'after', 'during', 'through', 'beyond', 'within', 'among', 'beneath', 'toward', 'against', 'between'];
    const temporalConnectors = ['before', 'after', 'during', 'until', 'when', 'while', 'since'];
    const relationshipConnectors = ['of', 'from', 'with', 'without', 'despite', 'like', 'unlike'];

    for (const part of structure) {
      let word = '';
      switch (part) {
        case 'article':
          word = articles[Math.floor(Math.random() * articles.length)];
          break;
        case 'adjective':
          // 30% chance to use expanded categories for more variety
          if (Math.random() < 0.3 && this.expandedCategories) {
            const categoryChoice = Math.random();
            if (categoryChoice < 0.25 && this.expandedCategories.emotions.length > 0) {
              word = this.expandedCategories.emotions[Math.floor(Math.random() * this.expandedCategories.emotions.length)];
            } else if (categoryChoice < 0.5 && this.expandedCategories.colors.length > 0) {
              word = this.expandedCategories.colors[Math.floor(Math.random() * this.expandedCategories.colors.length)];
            } else if (categoryChoice < 0.75 && this.expandedCategories.textures.length > 0) {
              word = this.expandedCategories.textures[Math.floor(Math.random() * this.expandedCategories.textures.length)];
            } else if (this.expandedCategories.tastes.length > 0) {
              word = this.expandedCategories.tastes[Math.floor(Math.random() * this.expandedCategories.tastes.length)];
            }
          }
          if (!word) {
            word = validSources.adjectives[Math.floor(Math.random() * validSources.adjectives.length)];
          }
          break;
        case 'noun':
          // 40% chance to use expanded categories for maximum variety
          if (Math.random() < 0.4 && this.expandedCategories) {
            const categoryChoice = Math.random();
            if (categoryChoice < 0.2 && this.expandedCategories.animals.length > 0) {
              word = this.expandedCategories.animals[Math.floor(Math.random() * this.expandedCategories.animals.length)];
            } else if (categoryChoice < 0.4 && this.expandedCategories.mythology.length > 0) {
              word = this.expandedCategories.mythology[Math.floor(Math.random() * this.expandedCategories.mythology.length)];
            } else if (categoryChoice < 0.6 && this.expandedCategories.cosmic.length > 0) {
              word = this.expandedCategories.cosmic[Math.floor(Math.random() * this.expandedCategories.cosmic.length)];
            } else if (categoryChoice < 0.8 && this.expandedCategories.nature.length > 0) {
              word = this.expandedCategories.nature[Math.floor(Math.random() * this.expandedCategories.nature.length)];
            } else if (this.expandedCategories.technology.length > 0) {
              word = this.expandedCategories.technology[Math.floor(Math.random() * this.expandedCategories.technology.length)];
            }
          }
          if (!word) {
            word = validSources.nouns[Math.floor(Math.random() * validSources.nouns.length)];
          }
          break;
        case 'verb':
          // 25% chance to use movement words for dynamic feel
          if (Math.random() < 0.25 && this.expandedCategories && this.expandedCategories.movement.length > 0) {
            word = this.expandedCategories.movement[Math.floor(Math.random() * this.expandedCategories.movement.length)];
          }
          if (!word) {
            word = validSources.verbs[Math.floor(Math.random() * validSources.verbs.length)];
          }
          break;
        case 'musical':
          // 20% chance to use sound words for musical relevance
          if (Math.random() < 0.2 && this.expandedCategories && this.expandedCategories.sounds.length > 0) {
            word = this.expandedCategories.sounds[Math.floor(Math.random() * this.expandedCategories.sounds.length)];
          }
          if (!word) {
            word = validSources.musicalTerms[Math.floor(Math.random() * validSources.musicalTerms.length)];
          }
          break;
        case 'preposition':
          word = prepositions[Math.floor(Math.random() * prepositions.length)];
          break;
        case 'conjunction':
          word = conjunctions[Math.floor(Math.random() * conjunctions.length)];
          break;
        case 'connector':
          word = connectingWords[Math.floor(Math.random() * connectingWords.length)];
          break;
        case 'temporal':
          word = temporalConnectors[Math.floor(Math.random() * temporalConnectors.length)];
          break;
        case 'relationship':
          word = relationshipConnectors[Math.floor(Math.random() * relationshipConnectors.length)];
          break;
        case 'flexible':
          // Mix any word type for variety
          const allWords = [
            ...validSources.adjectives,
            ...validSources.nouns,
            ...validSources.verbs,
            ...validSources.musicalTerms
          ];
          word = allWords[Math.floor(Math.random() * allWords.length)];
          break;
      }
      words.push(word);
    }

    // Ensure we don't exceed the requested word count
    const finalWords = words.slice(0, words.length); // This is buildPattern, already correct length
    
    // Apply grammatical consistency fixes
    const grammarCorrectedWords = this.ensureGrammaticalConsistency(finalWords);
    
    // Apply poetic evaluation for better lyrical flow
    const poeticallyOrderedWords = this.evaluateAndReorderPoetically(grammarCorrectedWords);
    
    return this.applySmartCapitalization(poeticallyOrderedWords);
  }

  private buildRepetitivePattern(wordCount: number, wordSources?: WordSource): string {
    const sources = wordSources || this.wordSources;
    
    // Ensure sources are valid - fallback to base if empty
    const validSources = {
      adjectives: (sources.adjectives && sources.adjectives.length > 0) ? sources.adjectives : this.wordSources.adjectives,
      nouns: (sources.nouns && sources.nouns.length > 0) ? sources.nouns : this.wordSources.nouns,
      verbs: (sources.verbs && sources.verbs.length > 0) ? sources.verbs : this.wordSources.verbs,
      musicalTerms: (sources.musicalTerms && sources.musicalTerms.length > 0) ? sources.musicalTerms : this.wordSources.musicalTerms
    };
    
    // Create patterns with intentional repetition (common in song titles)
    const baseWord = validSources.nouns[Math.floor(Math.random() * validSources.nouns.length)];
    const adjective = validSources.adjectives[Math.floor(Math.random() * validSources.adjectives.length)];
    
    const repetitivePatterns = [
      `${adjective} ${baseWord}, ${adjective} ${validSources.nouns[Math.floor(Math.random() * validSources.nouns.length)]}`,
      `${baseWord} ${validSources.verbs[Math.floor(Math.random() * validSources.verbs.length)]} ${baseWord}`,
      `The ${baseWord} and the ${validSources.nouns[Math.floor(Math.random() * validSources.nouns.length)]}`
    ];

    let result = repetitivePatterns[Math.floor(Math.random() * repetitivePatterns.length)];
    
    // Add more words if needed
    while (result.split(' ').length < wordCount) {
      const filler = validSources.adjectives[Math.floor(Math.random() * validSources.adjectives.length)];
      result += ` ${filler}`;
    }

    return result;
  }

  private buildAtmosphericPattern(wordCount: number, wordSources?: WordSource): string {
    const sources = wordSources || this.wordSources;
    
    // Ensure sources are valid - fallback to base if empty
    const validSources = {
      adjectives: (sources.adjectives && sources.adjectives.length > 0) ? sources.adjectives : this.wordSources.adjectives,
      nouns: (sources.nouns && sources.nouns.length > 0) ? sources.nouns : this.wordSources.nouns,
      verbs: (sources.verbs && sources.verbs.length > 0) ? sources.verbs : this.wordSources.verbs,
      musicalTerms: (sources.musicalTerms && sources.musicalTerms.length > 0) ? sources.musicalTerms : this.wordSources.musicalTerms
    };
    
    // Create atmospheric, abstract combinations
    const atmospheric = [
      ...validSources.adjectives.filter(word => 
        ['ethereal', 'cosmic', 'ancient', 'mystic', 'haunted', 'frozen', 'burning', 'distant', 'fading', 'rising'].some(atmo => 
          word.toLowerCase().includes(atmo) || atmo.includes(word.toLowerCase())
        )
      ),
      'echoing', 'drifting', 'floating', 'shimmering', 'cascading', 'emerging', 'dissolving'
    ];

    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      if (i % 2 === 0 && atmospheric.length > 0) {
        words.push(atmospheric[Math.floor(Math.random() * atmospheric.length)]);
      } else {
        const wordSourcesArray = [validSources.nouns, validSources.musicalTerms];
        const source = wordSourcesArray[Math.floor(Math.random() * wordSourcesArray.length)];
        words.push(source[Math.floor(Math.random() * source.length)]);
      }
    }

    return words.join(' ');
  }

  private buildNarrativePattern(wordCount: number, wordSources?: WordSource): string {
    const sources = wordSources || this.wordSources;
    
    // Ensure sources are valid - fallback to base if empty
    const validSources = {
      adjectives: (sources.adjectives && sources.adjectives.length > 0) ? sources.adjectives : this.wordSources.adjectives,
      nouns: (sources.nouns && sources.nouns.length > 0) ? sources.nouns : this.wordSources.nouns,
      verbs: (sources.verbs && sources.verbs.length > 0) ? sources.verbs : this.wordSources.verbs,
      musicalTerms: (sources.musicalTerms && sources.musicalTerms.length > 0) ? sources.musicalTerms : this.wordSources.musicalTerms
    };
    
    // Create story-like combinations with better flow
    const narrativeStarters = ['When', 'Where', 'How', 'Why', 'Until', 'Before', 'After', 'During'];
    const flowConnectors = ['into', 'through', 'beyond', 'beneath', 'before', 'after', 'during', 'within', 'among'];
    const words: string[] = [];
    
    // For longer names, start with narrative word
    if (wordCount >= 5 && Math.random() > 0.4) {
      words.push(narrativeStarters[Math.floor(Math.random() * narrativeStarters.length)]);
    }

    // Fill remaining slots with structured narrative flow
    while (words.length < wordCount) {
      const remaining = wordCount - words.length;
      
      if (remaining >= 3 && Math.random() > 0.5) {
        // Add flowing connector phrase: [adjective] [noun] [connector] but respect word count limit
        words.push(validSources.adjectives[Math.floor(Math.random() * validSources.adjectives.length)]);
        words.push(validSources.nouns[Math.floor(Math.random() * validSources.nouns.length)]);
        if (remaining > 3 && words.length < wordCount - 1) {
          words.push(flowConnectors[Math.floor(Math.random() * flowConnectors.length)]);
        }
      } else if (remaining >= 2 && Math.random() > 0.6) {
        // Add verb + noun combination
        words.push(validSources.verbs[Math.floor(Math.random() * validSources.verbs.length)]);
        words.push(validSources.nouns[Math.floor(Math.random() * validSources.nouns.length)]);
      } else {
        // Add single word with preference for nouns for ending
        if (remaining === 1) {
          words.push(validSources.nouns[Math.floor(Math.random() * validSources.nouns.length)]);
        } else {
          const allWords = [
            ...validSources.adjectives,
            ...validSources.nouns,
            ...validSources.musicalTerms
          ];
          words.push(allWords[Math.floor(Math.random() * allWords.length)]);
        }
      }
    }

    // Ensure we don't exceed the requested word count
    const finalWords = words.slice(0, wordCount);
    return finalWords.join(' ');
  }

  private removeDuplicates(array: string[]): string[] {
    const seen = new Set<string>();
    return array.filter(item => {
      const lowercaseItem = item.toLowerCase();
      if (seen.has(lowercaseItem)) {
        return false;
      }
      seen.add(lowercaseItem);
      return true;
    });
  }

  private ensureValidWordSource(sources: WordSource): WordSource {
    // Fallback to static words if any category is empty
    return {
      adjectives: sources.adjectives && sources.adjectives.length > 0 ? sources.adjectives : this.wordSources.adjectives,
      nouns: sources.nouns && sources.nouns.length > 0 ? sources.nouns : this.wordSources.nouns,
      verbs: sources.verbs && sources.verbs.length > 0 ? sources.verbs : this.wordSources.verbs,
      musicalTerms: sources.musicalTerms && sources.musicalTerms.length > 0 ? sources.musicalTerms : this.wordSources.musicalTerms
    };
  }

  // Method to fetch words from external APIs and web sources (OPTIMIZED)
  private async fetchWordsFromWeb(): Promise<void> {
    try {
      // Use Promise.allSettled to handle API failures gracefully
      const results = await Promise.allSettled([
        this.fetchAdjectivesFromWeb(),
        this.fetchNounsFromWeb(),
        this.fetchVerbsFromWeb(),
        this.fetchMusicalTermsFromWeb()
      ]);

      // Extract successful results, ignore failures
      const [adjectives, nouns, verbs, musicalTerms] = results.map(result => 
        result.status === 'fulfilled' ? result.value : []
      );

      // Only merge if we got substantial new words to avoid unnecessary processing
      const totalNewWords = adjectives.length + nouns.length + verbs.length + musicalTerms.length;
      if (totalNewWords > 50) {
        this.wordSources.adjectives = this.removeDuplicates([...this.wordSources.adjectives, ...adjectives]);
        this.wordSources.nouns = this.removeDuplicates([...this.wordSources.nouns, ...nouns]);
        this.wordSources.verbs = this.removeDuplicates([...this.wordSources.verbs, ...verbs]);
        this.wordSources.musicalTerms = this.removeDuplicates([...this.wordSources.musicalTerms, ...musicalTerms]);

        console.log(`Enhanced vocabulary: ${this.wordSources.adjectives.length} adjectives, ${this.wordSources.nouns.length} nouns, ${this.wordSources.verbs.length} verbs, ${this.wordSources.musicalTerms.length} musical terms`);
      }
    } catch (error) {
      // Graceful degradation - system works fine with static vocabulary
    }
  }

  private async fetchAdjectivesFromWeb(): Promise<string[]> {
    const adjectives: string[] = [];
    
    try {
      // Fetch from multiple sources
      const sources = [
        this.fetchFromWordnikAPI('adjective'),
        this.fetchFromDictionaryAPI('adjectives'),
        this.fetchRandomWikipediaWords('adjective')
      ];
      
      const results = await Promise.allSettled(sources);
      results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          adjectives.push(...result.value);
        }
      });
      
      return adjectives.slice(0, 50); // Limit to prevent overwhelming
    } catch (error) {
      console.error('Error fetching adjectives:', error);
      return [];
    }
  }

  private async fetchNounsFromWeb(): Promise<string[]> {
    const nouns: string[] = [];
    
    try {
      const sources = [
        this.fetchFromWordnikAPI('noun'),
        this.fetchFromDictionaryAPI('nouns'),
        this.fetchRandomWikipediaWords('noun'),
        this.fetchFromPoetryAPI()
      ];
      
      const results = await Promise.allSettled(sources);
      results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          nouns.push(...result.value);
        }
      });
      
      return nouns.slice(0, 50);
    } catch (error) {
      console.error('Error fetching nouns:', error);
      return [];
    }
  }

  private async fetchVerbsFromWeb(): Promise<string[]> {
    const verbs: string[] = [];
    
    try {
      const sources = [
        this.fetchFromWordnikAPI('verb'),
        this.fetchFromDictionaryAPI('verbs'),
        this.fetchActionWordsFromWeb()
      ];
      
      const results = await Promise.allSettled(sources);
      results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          verbs.push(...result.value);
        }
      });
      
      return verbs.slice(0, 40);
    } catch (error) {
      console.error('Error fetching verbs:', error);
      return [];
    }
  }

  private async fetchMusicalTermsFromWeb(): Promise<string[]> {
    const musicalTerms: string[] = [];
    
    try {
      const sources = [
        this.fetchFromMusicBrainzAPI(),
        this.fetchFromLastFmAPI(),
        this.fetchMusicalInstrumentsFromWeb(),
        this.fetchMusicGenresFromWeb()
      ];
      
      const results = await Promise.allSettled(sources);
      results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          musicalTerms.push(...result.value);
        }
      });
      
      return musicalTerms.slice(0, 40);
    } catch (error) {
      console.error('Error fetching musical terms:', error);
      return [];
    }
  }

  // Individual API fetching methods
  private async fetchFromWordnikAPI(partOfSpeech: string): Promise<string[]> {
    try {
      // Wordnik API for random words by part of speech
      const response = await fetch(`https://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=true&includePartOfSpeech=${partOfSpeech}&minCorpusCount=1000&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=3&maxLength=12&limit=20&api_key=placeholder`);
      
      if (!response.ok) throw new Error('Wordnik API failed');
      
      const data = await response.json();
      return data.map((item: any) => this.capitalizeFirst(item.word)).filter(this.isValidWord);
    } catch (error) {
      // Silent degradation - API failures are expected  
      return [];
    }
  }

  private async fetchFromDictionaryAPI(category: string): Promise<string[]> {
    try {
      // Free dictionary API or other word sources
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/random`);
      
      if (!response.ok) throw new Error('Dictionary API failed');
      
      // Parse and extract relevant words based on category
      const data = await response.json();
      // Implementation would extract words based on category
      return [];
    } catch (error) {
      console.error('Dictionary API error:', error);
      return [];
    }
  }

  private async fetchRandomWikipediaWords(type: string): Promise<string[]> {
    try {
      // Wikipedia random article titles for diverse vocabulary
      const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
      
      if (!response.ok) throw new Error('Wikipedia API failed');
      
      const data = await response.json();
      const title = data.title;
      
      // Extract meaningful words from Wikipedia titles
      const words = title.split(/[\s\-_()]+/)
        .filter((word: string) => word.length > 2 && word.length < 15)
        .map((word: string) => this.capitalizeFirst(word.toLowerCase()))
        .filter(this.isValidWord);
      
      return words;
    } catch (error) {
      console.error('Wikipedia API error:', error);
      return [];
    }
  }

  private async fetchFromPoetryAPI(): Promise<string[]> {
    try {
      // Poetry API for poetic and creative words
      const response = await fetch('https://poetrydb.org/random');
      
      if (!response.ok) throw new Error('Poetry API failed');
      
      const data = await response.json();
      const lines = data[0]?.lines || [];
      
      // Extract evocative words from poetry
      const words: string[] = [];
      lines.forEach((line: string) => {
        const lineWords = line.split(/\s+/)
          .filter((word: string) => word.length > 3 && word.length < 12)
          .map((word: string) => word.replace(/[^a-zA-Z]/g, ''))
          .filter((word: string) => word.length > 2)
          .map((word: string) => this.capitalizeFirst(word.toLowerCase()));
        words.push(...lineWords);
      });
      
      return words.filter(this.isValidWord).slice(0, 10);
    } catch (error) {
      console.error('Poetry API error:', error);
      return [];
    }
  }

  private async fetchFromMusicBrainzAPI(): Promise<string[]> {
    try {
      // MusicBrainz for musical terms and instrument names
      const response = await fetch('https://musicbrainz.org/ws/2/instrument?limit=25&fmt=json');
      
      if (!response.ok) throw new Error('MusicBrainz API failed');
      
      const data = await response.json();
      return data.instruments
        ?.map((instrument: any) => this.capitalizeFirst(instrument.name))
        .filter(this.isValidWord) || [];
    } catch (error) {
      // Silent degradation - API failures are expected
      return [];
    }
  }

  private async fetchFromLastFmAPI(): Promise<string[]> {
    try {
      // Last.fm for music genre and tag words
      const response = await fetch('https://ws.audioscrobbler.com/2.0/?method=tag.gettoptags&api_key=placeholder&format=json');
      
      if (!response.ok) throw new Error('Last.fm API failed');
      
      const data = await response.json();
      return data.toptags?.tag
        ?.map((tag: any) => this.capitalizeFirst(tag.name))
        .filter(this.isValidWord) || [];
    } catch (error) {
      // Silent degradation - API failures are expected
      return [];
    }
  }

  private async fetchActionWordsFromWeb(): Promise<string[]> {
    try {
      // Fetch action words from various sources
      const actionWords = [
        'Accelerating', 'Bouncing', 'Cascading', 'Diving', 'Echoing', 'Flowing',
        'Gliding', 'Hovering', 'Igniting', 'Jumping', 'Kicking', 'Launching',
        'Melting', 'Navigating', 'Orbiting', 'Pulsing', 'Quivering', 'Racing',
        'Spiraling', 'Tumbling', 'Undulating', 'Vibrating', 'Weaving', 'Zooming'
      ];
      
      return actionWords;
    } catch (error) {
      console.error('Error fetching action words:', error);
      return [];
    }
  }

  private async fetchMusicalInstrumentsFromWeb(): Promise<string[]> {
    try {
      // Comprehensive list of musical instruments
      const instruments = [
        'Synthesizer', 'Theremin', 'Hurdy-Gurdy', 'Didgeridoo', 'Kalimba', 'Ocarina',
        'Bandoneon', 'Concertina', 'Melodica', 'Handpan', 'Cajon', 'Djembe',
        'Tabla', 'Sitar', 'Koto', 'Shamisen', 'Erhu', 'Duduk'
      ];
      
      return instruments;
    } catch (error) {
      console.error('Error fetching instruments:', error);
      return [];
    }
  }

  private async fetchMusicGenresFromWeb(): Promise<string[]> {
    try {
      // Dynamic music genres and styles
      const genres = [
        'Ambient', 'Shoegaze', 'Breakcore', 'Vaporwave', 'Darkwave', 'Synthwave',
        'Post-Rock', 'Math-Rock', 'Drone', 'Downtempo', 'Trip-Hop', 'Chillwave',
        'Psybient', 'Glitch', 'IDM', 'Breakbeat', 'Dubstep', 'Future-Bass'
      ];
      
      return genres;
    } catch (error) {
      console.error('Error fetching genres:', error);
      return [];
    }
  }

  // Utility methods
  private capitalizeFirst(word: string): string {
    if (!word) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  private ensureGrammaticalConsistency(words: string[]): string[] {
    const result = [...words];
    
    for (let i = 0; i < result.length - 1; i++) {
      const currentWord = result[i].toLowerCase();
      const nextWord = result[i + 1];
      
      // Handle determiners that require singular nouns
      if (['every', 'each', 'a', 'an'].includes(currentWord)) {
        result[i + 1] = this.makeSingular(nextWord);
      }
      
      // Handle "this" vs "these" based on noun number
      if (currentWord === 'this' && this.isPlural(nextWord)) {
        result[i] = 'These';
      } else if (currentWord === 'these' && this.isSingular(nextWord)) {
        result[i] = 'This';
      }
      
      // Handle "that" vs "those" based on noun number  
      if (currentWord === 'that' && this.isPlural(nextWord)) {
        result[i] = 'Those';
      } else if (currentWord === 'those' && this.isSingular(nextWord)) {
        result[i] = 'That';
      }
    }
    
    return result;
  }

  private makeSingular(word: string): string {
    const lower = word.toLowerCase();
    
    // Common irregular plurals
    const irregulars: Record<string, string> = {
      'children': 'child',
      'people': 'person',
      'men': 'man',
      'women': 'woman',
      'teeth': 'tooth',
      'feet': 'foot',
      'mice': 'mouse',
      'geese': 'goose',
      'oxen': 'ox',
      'deer': 'deer',
      'sheep': 'sheep',
      'fish': 'fish',
      'penguins': 'penguin',
      'dolphins': 'dolphin',
      'elephants': 'elephant',
      'tigers': 'tiger',
      'lions': 'lion',
      'bears': 'bear',
      'wolves': 'wolf',
      'foxes': 'fox',
      'birds': 'bird',
      'eagles': 'eagle',
      'owls': 'owl',
      'ravens': 'raven',
      'crows': 'crow',
      'guitars': 'guitar',
      'drums': 'drum',
      'violins': 'violin',
      'pianos': 'piano',
      'trumpets': 'trumpet',
      'saxophones': 'saxophone',
      'cats': 'cat',
      'dogs': 'dog',
      'horses': 'horse',
      'monkeys': 'monkey',
      'snakes': 'snake',
      'spiders': 'spider',
      'butterflies': 'butterfly',
      'bees': 'bee',
      'ants': 'ant',
      'flies': 'fly',
      'sharks': 'shark',
      'whales': 'whale',
      'octopuses': 'octopus',
      'stars': 'star',
      'moons': 'moon',
      'suns': 'sun',
      'planets': 'planet',
      'galaxies': 'galaxy',
      'comets': 'comet',
      'meteors': 'meteor',
      'asteroids': 'asteroid',
      'storms': 'storm',
      'winds': 'wind',
      'waves': 'wave',
      'mountains': 'mountain',
      'valleys': 'valley',
      'rivers': 'river',
      'lakes': 'lake',
      'oceans': 'ocean',
      'forests': 'forest',
      'deserts': 'desert',
      'cities': 'city',
      'towns': 'town',
      'villages': 'village',
      'houses': 'house',
      'buildings': 'building',
      'bridges': 'bridge',
      'roads': 'road',
      'cars': 'car',
      'trucks': 'truck',
      'boats': 'boat',
      'ships': 'ship',
      'planes': 'plane',
      'trains': 'train',
      'songs': 'song',
      'albums': 'album',
      'concerts': 'concert',
      'bands': 'band',
      'musicians': 'musician',
      'singers': 'singer',
      'dancers': 'dancer',
      'artists': 'artist',
      'writers': 'writer',
      'poets': 'poet',
      'books': 'book',
      'stories': 'story',
      'movies': 'movie',
      'shows': 'show',
      'games': 'game',
      'toys': 'toy',
      'colors': 'color',
      'sounds': 'sound',
      'smells': 'smell',
      'tastes': 'taste',
      'feelings': 'feeling',
      'emotions': 'emotion',
      'thoughts': 'thought',
      'dreams': 'dream',
      'hopes': 'hope',
      'fears': 'fear',
      'loves': 'love',
      'hates': 'hate',
      'friends': 'friend',
      'enemies': 'enemy',
      'heroes': 'hero',
      'villains': 'villain',
      'angels': 'angel',
      'demons': 'demon',
      'gods': 'god',
      'goddesses': 'goddess',
      'kings': 'king',
      'queens': 'queen',
      'princes': 'prince',
      'princesses': 'princess',
      'knights': 'knight',
      'warriors': 'warrior',
      'wizards': 'wizard',
      'witches': 'witch',
      'dragons': 'dragon',
      'unicorns': 'unicorn',
      'phoenixes': 'phoenix',
      'vampires': 'vampire',
      'zombies': 'zombie',
      'robots': 'robot',
      'aliens': 'alien',
      'monsters': 'monster',
      'ghosts': 'ghost',
      'spirits': 'spirit',
      'souls': 'soul',
      'shadows': 'shadow',
      'lights': 'light',
      'darks': 'dark',
      'nights': 'night',
      'days': 'day',
      'mornings': 'morning',
      'evenings': 'evening',
      'afternoons': 'afternoon',
      'midnights': 'midnight',
      'dawns': 'dawn',
      'dusks': 'dusk',
      'sunsets': 'sunset',
      'sunrises': 'sunrise',
      'seasons': 'season',
      'winters': 'winter',
      'springs': 'spring',
      'summers': 'summer',
      'autumns': 'autumn',
      'years': 'year',
      'months': 'month',
      'weeks': 'week',
      'hours': 'hour',
      'minutes': 'minute',
      'seconds': 'second',
      'moments': 'moment',
      'memories': 'memory',
      'adventures': 'adventure',
      'journeys': 'journey',
      'quests': 'quest',
      'missions': 'mission',
      'challenges': 'challenge',
      'victories': 'victory',
      'defeats': 'defeat',
      'battles': 'battle',
      'wars': 'war',
      'conflicts': 'conflict',
      'struggles': 'struggle',
      'triumphs': 'triumph',
      'successes': 'success',
      'failures': 'failure',
      'mistakes': 'mistake',
      'lessons': 'lesson',
      'truths': 'truth',
      'lies': 'lie',
      'secrets': 'secret',
      'mysteries': 'mystery',
      'puzzles': 'puzzle',
      'riddles': 'riddle',
      'questions': 'question',
      'answers': 'answer',
      'solutions': 'solution',
      'problems': 'problem',
      'issues': 'issue',
      'concerns': 'concern',
      'worries': 'worry',
      'anxieties': 'anxiety',
      'stresses': 'stress',
      'pressures': 'pressure',
      'tensions': 'tension',
      'conflicts': 'conflict',
      'disagreements': 'disagreement',
      'arguments': 'argument',
      'debates': 'debate',
      'discussions': 'discussion',
      'conversations': 'conversation',
      'talks': 'talk',
      'speeches': 'speech',
      'presentations': 'presentation',
      'performances': 'performance',
      'shows': 'show',
      'displays': 'display',
      'exhibitions': 'exhibition',
      'demonstrations': 'demonstration',
      'examples': 'example',
      'instances': 'instance',
      'cases': 'case',
      'situations': 'situation',
      'circumstances': 'circumstance',
      'conditions': 'condition',
      'states': 'state',
      'phases': 'phase',
      'stages': 'stage',
      'levels': 'level',
      'degrees': 'degree',
      'amounts': 'amount',
      'quantities': 'quantity',
      'numbers': 'number',
      'figures': 'figure',
      'statistics': 'statistic',
      'data': 'data',
      'information': 'information',
      'facts': 'fact',
      'details': 'detail',
      'specifics': 'specific',
      'particulars': 'particular',
      'aspects': 'aspect',
      'features': 'feature',
      'characteristics': 'characteristic',
      'qualities': 'quality',
      'properties': 'property',
      'attributes': 'attribute',
      'traits': 'trait',
      'elements': 'element',
      'components': 'component',
      'parts': 'part',
      'pieces': 'piece',
      'fragments': 'fragment',
      'sections': 'section',
      'segments': 'segment',
      'divisions': 'division',
      'categories': 'category',
      'types': 'type',
      'kinds': 'kind',
      'sorts': 'sort',
      'varieties': 'variety',
      'forms': 'form',
      'shapes': 'shape',
      'sizes': 'size',
      'dimensions': 'dimension',
      'measurements': 'measurement',
      'distances': 'distance',
      'lengths': 'length',
      'widths': 'width',
      'heights': 'height',
      'depths': 'depth',
      'weights': 'weight',
      'masses': 'mass',
      'volumes': 'volume',
      'areas': 'area',
      'spaces': 'space',
      'places': 'place',
      'locations': 'location',
      'positions': 'position',
      'spots': 'spot',
      'sites': 'site',
      'venues': 'venue',
      'destinations': 'destination',
      'directions': 'direction',
      'paths': 'path',
      'routes': 'route',
      'ways': 'way',
      'means': 'means',
      'methods': 'method',
      'techniques': 'technique',
      'approaches': 'approach',
      'strategies': 'strategy',
      'tactics': 'tactic',
      'plans': 'plan',
      'schemes': 'scheme',
      'designs': 'design',
      'patterns': 'pattern',
      'models': 'model',
      'templates': 'template',
      'frameworks': 'framework',
      'structures': 'structure',
      'systems': 'system',
      'networks': 'network',
      'connections': 'connection',
      'links': 'link',
      'bonds': 'bond',
      'ties': 'tie',
      'relationships': 'relationship',
      'associations': 'association',
      'partnerships': 'partnership',
      'alliances': 'alliance',
      'unions': 'union',
      'groups': 'group',
      'teams': 'team',
      'crews': 'crew',
      'squads': 'squad',
      'gangs': 'gang',
      'clubs': 'club',
      'societies': 'society',
      'organizations': 'organization',
      'institutions': 'institution',
      'establishments': 'establishment',
      'companies': 'company',
      'corporations': 'corporation',
      'businesses': 'business',
      'enterprises': 'enterprise',
      'ventures': 'venture',
      'projects': 'project',
      'initiatives': 'initiative',
      'programs': 'program',
      'campaigns': 'campaign',
      'efforts': 'effort',
      'attempts': 'attempt',
      'tries': 'try',
      'tests': 'test',
      'experiments': 'experiment',
      'trials': 'trial',
      'studies': 'study',
      'researches': 'research',
      'investigations': 'investigation',
      'inquiries': 'inquiry',
      'explorations': 'exploration',
      'discoveries': 'discovery',
      'findings': 'finding',
      'results': 'result',
      'outcomes': 'outcome',
      'consequences': 'consequence',
      'effects': 'effect',
      'impacts': 'impact',
      'influences': 'influence',
      'forces': 'force',
      'powers': 'power',
      'energies': 'energy',
      'strengths': 'strength',
      'weaknesses': 'weakness',
      'advantages': 'advantage',
      'disadvantages': 'disadvantage',
      'benefits': 'benefit',
      'costs': 'cost',
      'prices': 'price',
      'values': 'value',
      'worths': 'worth',
      'merits': 'merit',
      'virtues': 'virtue',
      'vices': 'vice',
      'sins': 'sin',
      'crimes': 'crime',
      'mistakes': 'mistake',
      'errors': 'error',
      'faults': 'fault',
      'flaws': 'flaw',
      'defects': 'defect',
      'problems': 'problem',
      'issues': 'issue',
      'troubles': 'trouble',
      'difficulties': 'difficulty',
      'challenges': 'challenge',
      'obstacles': 'obstacle',
      'barriers': 'barrier',
      'blocks': 'block',
      'walls': 'wall',
      'fences': 'fence',
      'gates': 'gate',
      'doors': 'door',
      'windows': 'window',
      'openings': 'opening',
      'entrances': 'entrance',
      'exits': 'exit',
      'passages': 'passage',
      'corridors': 'corridor',
      'hallways': 'hallway',
      'rooms': 'room',
      'chambers': 'chamber',
      'spaces': 'space',
      'areas': 'area',
      'zones': 'zone',
      'regions': 'region',
      'territories': 'territory',
      'lands': 'land',
      'countries': 'country',
      'nations': 'nation',
      'states': 'state',
      'provinces': 'province',
      'counties': 'county',
      'districts': 'district',
      'neighborhoods': 'neighborhood',
      'communities': 'community',
      'populations': 'population',
      'inhabitants': 'inhabitant',
      'residents': 'resident',
      'citizens': 'citizen',
      'natives': 'native',
      'locals': 'local',
      'foreigners': 'foreigner',
      'strangers': 'stranger',
      'visitors': 'visitor',
      'guests': 'guest',
      'tourists': 'tourist',
      'travelers': 'traveler',
      'explorers': 'explorer',
      'adventurers': 'adventurer',
      'pioneers': 'pioneer',
      'leaders': 'leader',
      'followers': 'follower',
      'supporters': 'supporter',
      'fans': 'fan',
      'admirers': 'admirer',
      'lovers': 'lover',
      'haters': 'hater',
      'critics': 'critic',
      'judges': 'judge',
      'experts': 'expert',
      'specialists': 'specialist',
      'professionals': 'professional',
      'amateurs': 'amateur',
      'beginners': 'beginner',
      'novices': 'novice',
      'students': 'student',
      'teachers': 'teacher',
      'instructors': 'instructor',
      'coaches': 'coach',
      'trainers': 'trainer',
      'mentors': 'mentor',
      'guides': 'guide',
      'advisors': 'advisor',
      'consultants': 'consultant',
      'counselors': 'counselor',
      'therapists': 'therapist',
      'doctors': 'doctor',
      'nurses': 'nurse',
      'patients': 'patient',
      'clients': 'client',
      'customers': 'customer',
      'buyers': 'buyer',
      'sellers': 'seller',
      'vendors': 'vendor',
      'suppliers': 'supplier',
      'providers': 'provider',
      'services': 'service',
      'products': 'product',
      'goods': 'good',
      'items': 'item',
      'objects': 'object',
      'things': 'thing',
      'stuff': 'stuff',
      'materials': 'material',
      'substances': 'substance',
      'elements': 'element',
      'compounds': 'compound',
      'mixtures': 'mixture',
      'solutions': 'solution',
      'liquids': 'liquid',
      'gases': 'gas',
      'solids': 'solid',
      'crystals': 'crystal',
      'metals': 'metal',
      'minerals': 'mineral',
      'stones': 'stone',
      'rocks': 'rock',
      'gems': 'gem',
      'jewels': 'jewel',
      'treasures': 'treasure',
      'riches': 'rich',
      'fortunes': 'fortune',
      'wealths': 'wealth',
      'moneys': 'money',
      'coins': 'coin',
      'bills': 'bill',
      'notes': 'note',
      'currencies': 'currency',
      'dollars': 'dollar',
      'cents': 'cent',
      'pennies': 'penny',
      'pounds': 'pound',
      'euros': 'euro',
      'yens': 'yen',
      'francs': 'franc',
      'marks': 'mark',
      'rubles': 'ruble',
      'pesos': 'peso',
      'rupees': 'rupee',
      'dinars': 'dinar',
      'dirhams': 'dirham',
      'riyals': 'riyal',
      'liras': 'lira',
      'crowns': 'crown',
      'shillings': 'shilling',
      'florins': 'florin',
      'guilders': 'guilder',
      'escudos': 'escudo',
      'drachmas': 'drachma',
      'zlotys': 'zloty',
      'korunas': 'koruna',
      'forint': 'forint',
      'lei': 'lei',
      'leva': 'lev',
      'krone': 'krone',
      'kroner': 'kroner',
      'dinars': 'dinar',
      'dirhams': 'dirham',
      'riyals': 'riyal',
      'liras': 'lira',
      'crowns': 'crown',
      'shillings': 'shilling',
      'florins': 'florin',
      'guilders': 'guilder',
      'escudos': 'escudo',
      'drachmas': 'drachma',
      'zlotys': 'zloty',
      'korunas': 'koruna',
      'forint': 'forint',
      'lei': 'lei',
      'leva': 'lev',
      'krone': 'krone',
      'kroner': 'kroner'
    };
    
    if (irregulars[lower]) {
      return this.preserveCase(word, irregulars[lower]);
    }
    
    // Regular plural patterns
    if (lower.endsWith('ies')) {
      return this.preserveCase(word, lower.slice(0, -3) + 'y');
    }
    if (lower.endsWith('ves')) {
      return this.preserveCase(word, lower.slice(0, -3) + 'f');
    }
    if (lower.endsWith('ses') || lower.endsWith('ches') || lower.endsWith('shes') || lower.endsWith('xes')) {
      return this.preserveCase(word, lower.slice(0, -2));
    }
    if (lower.endsWith('s') && !lower.endsWith('ss')) {
      return this.preserveCase(word, lower.slice(0, -1));
    }
    
    return word; // Already singular or unknown pattern
  }

  private isPlural(word: string): boolean {
    const lower = word.toLowerCase();
    
    // Common irregular plurals
    const irregularPlurals = ['children', 'people', 'men', 'women', 'teeth', 'feet', 'mice', 'geese', 'oxen'];
    if (irregularPlurals.includes(lower)) return true;
    
    // Regular plural patterns
    return lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 1;
  }

  private isSingular(word: string): boolean {
    return !this.isPlural(word);
  }

  private preserveCase(original: string, replacement: string): string {
    if (original === original.toUpperCase()) return replacement.toUpperCase();
    if (original === original.toLowerCase()) return replacement.toLowerCase();
    if (original[0] === original[0].toUpperCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase();
    }
    return replacement;
  }

  private applySmartCapitalization(words: string[]): string {
    return words.map((word, index) => {
      // Always capitalize first word
      if (index === 0) return this.capitalizeFirst(word);
      
      // Don't capitalize small connectors/articles unless they're first
      const smallWords = ['a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'but'];
      if (smallWords.includes(word.toLowerCase())) return word.toLowerCase();
      
      // Capitalize everything else
      return this.capitalizeFirst(word);
    }).join(' ');
  }

  private evaluateAndReorderPoetically(words: string[]): string[] {
    if (words.length <= 2) return words; // Short names rarely need reordering
    
    const wordTypes = words.map(word => this.classifyWordType(word.toLowerCase()));
    const stressPatterns = words.map(word => this.analyzeWordStress(word.toLowerCase()));
    
    // Create scoring matrix for different arrangements
    const arrangements = this.generateArrangements(words, wordTypes);
    let bestScore = -1;
    let bestArrangement = words;
    
    for (const arrangement of arrangements) {
      // Recalculate word types and stress patterns for this specific arrangement
      const arrangementWordTypes = arrangement.map(word => this.classifyWordType(word.toLowerCase()));
      const arrangementStressPatterns = arrangement.map(word => this.analyzeWordStress(word.toLowerCase()));
      const score = this.scorePoeticallyArrangement(arrangement, arrangementWordTypes, arrangementStressPatterns);
      if (score > bestScore) {
        bestScore = score;
        bestArrangement = arrangement;
      }
    }
    
    return bestArrangement;
  }

  private classifyWordType(word: string): string {
    // Action words (verbs)
    const actionWords = [
      'remember', 'forget', 'dance', 'sing', 'fly', 'run', 'walk', 'jump', 'move', 'shake',
      'break', 'build', 'create', 'destroy', 'love', 'hate', 'dream', 'wake', 'sleep',
      'fight', 'play', 'work', 'live', 'die', 'breathe', 'feel', 'think', 'know',
      'see', 'hear', 'touch', 'taste', 'smell', 'believe', 'hope', 'fear', 'want',
      'need', 'give', 'take', 'hold', 'let', 'keep', 'lose', 'find', 'search',
      'roam', 'travel', 'journey', 'explore', 'discover', 'hide', 'show', 'reveal'
    ];
    
    // Time/temporal words
    const temporalWords = [
      'timeless', 'eternal', 'forever', 'never', 'always', 'sometimes', 'yesterday',
      'today', 'tomorrow', 'morning', 'evening', 'midnight', 'dawn', 'dusk',
      'ancient', 'modern', 'future', 'past', 'present', 'moment', 'instant',
      'season', 'winter', 'spring', 'summer', 'autumn', 'before', 'after', 'during'
    ];
    
    // Emotional/descriptive words
    const emotionalWords = [
      'wild', 'gentle', 'fierce', 'calm', 'bright', 'dark', 'mysterious', 'clear',
      'hidden', 'open', 'secret', 'public', 'private', 'sacred', 'holy', 'pure',
      'dirty', 'clean', 'fresh', 'old', 'new', 'young', 'ancient', 'modern',
      'beautiful', 'ugly', 'pretty', 'handsome', 'gorgeous', 'stunning', 'amazing'
    ];
    
    // Natural elements
    const elementWords = [
      'fire', 'water', 'earth', 'air', 'wind', 'storm', 'rain', 'snow', 'ice',
      'sun', 'moon', 'star', 'planet', 'galaxy', 'ocean', 'sea', 'river', 'lake',
      'mountain', 'valley', 'forest', 'desert', 'field', 'meadow', 'garden',
      'tree', 'flower', 'grass', 'stone', 'rock', 'crystal', 'diamond', 'gold'
    ];
    
    // Articles and connectors
    const connectiveWords = [
      'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
      'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further',
      'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
      'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
      'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
      'into', 'through', 'beyond', 'across', 'around', 'between', 'among'
    ];
    
    if (actionWords.includes(word)) return 'action';
    if (temporalWords.includes(word)) return 'temporal';
    if (emotionalWords.includes(word)) return 'emotional';
    if (elementWords.includes(word)) return 'element';
    if (connectiveWords.includes(word)) return 'connective';
    
    // Default classification based on ending patterns
    if (word.endsWith('ing')) return 'action';
    if (word.endsWith('ed')) return 'action';
    if (word.endsWith('ly')) return 'emotional';
    if (word.endsWith('ful') || word.endsWith('less')) return 'emotional';
    
    return 'noun'; // Default
  }

  private analyzeWordStress(word: string): string {
    // Simple stress pattern analysis based on syllable count and common patterns
    const syllableCount = this.countSyllables(word);
    
    if (syllableCount === 1) return 'stressed'; // Most monosyllabic words are stressed
    if (syllableCount === 2) {
      // Common two-syllable patterns
      const trocheeWords = ['fire', 'water', 'mountain', 'forest', 'sunset', 'morning', 'evening'];
      if (trocheeWords.some(t => word.includes(t))) return 'trochee'; // STRESSed-unstressed
      return 'iamb'; // unstressed-STRESSed
    }
    if (syllableCount === 3) {
      // Common three-syllable patterns
      if (word.endsWith('ing') || word.endsWith('tion')) return 'dactyl'; // STRESSed-unstressed-unstressed
      return 'anapest'; // unstressed-unstressed-STRESSed
    }
    
    return 'complex'; // Longer words have complex patterns
  }

  private countSyllables(word: string): number {
    // Simple syllable counting approximation
    const vowelGroups = word.toLowerCase().match(/[aeiouy]+/g);
    let count = vowelGroups ? vowelGroups.length : 1;
    
    // Adjust for silent e
    if (word.toLowerCase().endsWith('e') && count > 1) count--;
    
    // Ensure minimum of 1
    return Math.max(1, count);
  }

  private generateArrangements(words: string[], wordTypes: string[]): string[][] {
    if (words.length <= 2) return [words];
    if (words.length > 5) return [words]; // Too complex for exhaustive rearrangement
    
    const arrangements: string[][] = [];
    
    // Original order
    arrangements.push([...words]);
    
    // Try moving action words to front (verbs typically come early)
    const actionIndex = wordTypes.findIndex(type => type === 'action');
    if (actionIndex > 0) {
      const actionFirst = [...words];
      const actionWord = actionFirst.splice(actionIndex, 1)[0];
      actionFirst.unshift(actionWord);
      arrangements.push(actionFirst);
    }
    
    // Try moving temporal words to strategic positions
    const temporalIndex = wordTypes.findIndex(type => type === 'temporal');
    if (temporalIndex > 0 && words.length >= 3) {
      // Move temporal word to second position
      const temporalSecond = [...words];
      const temporalWord = temporalSecond.splice(temporalIndex, 1)[0];
      temporalSecond.splice(1, 0, temporalWord);
      arrangements.push(temporalSecond);
    }
    
    // Try moving elements to end (concrete nouns often work well at end)
    const elementIndex = wordTypes.findIndex(type => type === 'element');
    if (elementIndex < words.length - 1 && elementIndex >= 0) {
      const elementLast = [...words];
      const elementWord = elementLast.splice(elementIndex, 1)[0];
      elementLast.push(elementWord);
      arrangements.push(elementLast);
    }
    
    // For 3-word combinations, try emotional-element-action pattern
    if (words.length === 3) {
      const emotionalIndex = wordTypes.findIndex(type => type === 'emotional');
      const actionIdx = wordTypes.findIndex(type => type === 'action');
      const elementIdx = wordTypes.findIndex(type => type === 'element');
      
      if (emotionalIndex >= 0 && elementIdx >= 0 && actionIdx >= 0) {
        const emotionalElementAction = [
          words[emotionalIndex],
          words[elementIdx],
          words[actionIdx]
        ];
        arrangements.push(emotionalElementAction);
      }
    }
    
    return arrangements;
  }

  private scorePoeticallyArrangement(arrangement: string[], wordTypes: string[], stressPatterns: string[]): number {
    let score = 0;
    
    // Prefer action words early (natural narrative flow)
    const actionIndex = wordTypes.findIndex(type => type === 'action');
    if (actionIndex === 0) score += 15; // Action word first is very natural
    else if (actionIndex === 1) score += 10; // Second position also good
    else if (actionIndex > arrangement.length / 2) score -= 5; // Late actions feel awkward
    
    // Temporal words work well in various positions but not usually last
    const temporalIndex = wordTypes.findIndex(type => type === 'temporal');
    if (temporalIndex === arrangement.length - 1) score -= 8; // Temporal words rarely end titles
    else if (temporalIndex >= 0) score += 5; // Generally good positioning
    
    // Element words (concrete nouns) work well at the end
    const elementIndex = wordTypes.findIndex(type => type === 'element');
    if (elementIndex === arrangement.length - 1) score += 12; // Strong ending
    else if (elementIndex === 0) score += 8; // Also strong as opener
    
    // Emotional descriptors work well early or before nouns
    const emotionalIndex = wordTypes.findIndex(type => type === 'emotional');
    if (emotionalIndex >= 0 && emotionalIndex < arrangement.length - 1) {
      const nextWordType = wordTypes[emotionalIndex + 1];
      if (nextWordType === 'element' || nextWordType === 'noun') score += 10; // Adjective before noun
    }
    
    // Connective words should not be first or last
    const connectiveIndex = wordTypes.findIndex(type => type === 'connective');
    if (connectiveIndex === 0 || connectiveIndex === arrangement.length - 1) score -= 10;
    else if (connectiveIndex >= 0) score += 3; // Good internal positioning
    
    // Prefer alternating stress patterns (iambic feel)
    for (let i = 0; i < stressPatterns.length - 1; i++) {
      if (stressPatterns[i] === 'stressed' && stressPatterns[i + 1] === 'iamb') score += 5;
      if (stressPatterns[i] === 'iamb' && stressPatterns[i + 1] === 'trochee') score += 3;
    }
    
    // Bonus for natural English word order patterns
    if (arrangement.length >= 2) {
      const firstType = wordTypes[0];
      const secondType = wordTypes[1];
      
      // Verb-noun patterns
      if (firstType === 'action' && (secondType === 'element' || secondType === 'noun')) score += 8;
      
      // Adjective-noun patterns  
      if (firstType === 'emotional' && (secondType === 'element' || secondType === 'noun')) score += 8;
      
      // Temporal-adjective-noun patterns
      if (arrangement.length >= 3 && firstType === 'temporal' && 
          secondType === 'emotional' && wordTypes[2] === 'element') score += 12;
    }
    
    // Penalize awkward patterns
    if (arrangement.length >= 2) {
      const firstType = wordTypes[0];
      const lastType = wordTypes[wordTypes.length - 1];
      const secondLastType = wordTypes[wordTypes.length - 2];
      
      // Avoid ending with connectives or weak words
      if (lastType === 'connective') score -= 15;
      
      // Avoid double actions or double temporals
      if (firstType === 'action' && secondLastType === 'action') score -= 8;
      if (firstType === 'temporal' && secondLastType === 'temporal') score -= 8;
    }
    
    return score;
  }

  private generateSingleWordName(sources: WordSource): string {
    const strategies = [
      // Compound word creation
      () => {
        const prefixes = ['ultra', 'mega', 'super', 'hyper', 'neo', 'pseudo', 'quasi', 'anti', 'meta', 'proto', 'cyber', 'astro'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const base = sources.nouns[Math.floor(Math.random() * sources.nouns.length)];
        return this.capitalizeFirst(prefix + base.toLowerCase());
      },
      
      // Portmanteau (blend two words)
      () => {
        const word1 = sources.nouns[Math.floor(Math.random() * sources.nouns.length)];
        const word2 = sources.nouns[Math.floor(Math.random() * sources.nouns.length)];
        const mid1 = Math.floor(word1.length / 2);
        const mid2 = Math.floor(word2.length / 2);
        return this.capitalizeFirst(word1.substring(0, mid1) + word2.substring(mid2).toLowerCase());
      },
      
      // Modified existing word
      () => {
        const word = sources.nouns[Math.floor(Math.random() * sources.nouns.length)];
        const modifications = ['er', 'ism', 'ist', 'ify', 'ous', 'ion', 'ity', 'age', 'ment'];
        const mod = modifications[Math.floor(Math.random() * modifications.length)];
        return this.capitalizeFirst(word + mod);
      },
      
      // Just a powerful single word
      () => {
        const powerWords = [...sources.adjectives, ...sources.nouns, ...sources.verbs]
          .filter(word => word.length > 5); // Longer words tend to be more impactful
        return this.capitalizeFirst(powerWords[Math.floor(Math.random() * powerWords.length)]);
      }
    ];
    
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    return strategy();
  }

  private generateTwoWordName(sources: WordSource, type: string): string {
    const strategies = [
      // Semantic pairing (words that naturally go together)
      () => {
        const baseWord = sources.nouns[Math.floor(Math.random() * sources.nouns.length)].toLowerCase();
        const semanticMatches = Object.entries(this.linguisticStructures.semanticPairs)
          .find(([key, _]) => baseWord.includes(key));
        
        if (semanticMatches) {
          const relatedWord = semanticMatches[1][Math.floor(Math.random() * semanticMatches[1].length)];
          return `${this.capitalizeFirst(baseWord)} ${this.capitalizeFirst(relatedWord)}`;
        }
        
        // Fallback to regular pairing
        return `${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${this.capitalizeFirst(baseWord)}`;
      },
      
      // Alliterative pairing (same starting letter)
      () => {
        const letters = Object.keys(this.linguisticStructures.alliterativeGroups);
        const letter = letters[Math.floor(Math.random() * letters.length)];
        const words = this.linguisticStructures.alliterativeGroups[letter as keyof typeof this.linguisticStructures.alliterativeGroups];
        
        if (words && words.length >= 2) {
          const shuffled = [...words].sort(() => Math.random() - 0.5);
          return `${this.capitalizeFirst(shuffled[0])} ${this.capitalizeFirst(shuffled[1])}`;
        }
        
        // Fallback
        return `${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`;
      },
      
      // Contrasting pairs (opposites or unexpected combinations)
      () => {
        const contrasts = [
          ['ancient', 'modern'], ['liquid', 'solid'], ['soft', 'steel'],
          ['silent', 'scream'], ['frozen', 'fire'], ['digital', 'analog'],
          ['organic', 'synthetic'], ['gentle', 'chaos'], ['minimal', 'maximum'],
          ['heaven', 'hell'], ['sugar', 'venom'], ['velvet', 'razor']
        ];
        const pair = contrasts[Math.floor(Math.random() * contrasts.length)];
        return `${this.capitalizeFirst(pair[0])} ${this.capitalizeFirst(pair[1])}`;
      },
      
      // Action + Object pattern
      () => {
        const verb = sources.verbs[Math.floor(Math.random() * sources.verbs.length)];
        const noun = sources.nouns[Math.floor(Math.random() * sources.nouns.length)];
        return `${verb} ${noun}`;
      },
      
      // Musical term combinations
      () => {
        const adj = sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)];
        const musical = sources.musicalTerms[Math.floor(Math.random() * sources.musicalTerms.length)];
        return `${adj} ${musical}`;
      }
    ];
    
    // Band names tend to favor certain patterns
    if (type === 'band') {
      const bandStrategies = [strategies[0], strategies[1], strategies[4]]; // Semantic, alliterative, musical
      return bandStrategies[Math.floor(Math.random() * bandStrategies.length)]();
    } else {
      // Songs can use all strategies
      return strategies[Math.floor(Math.random() * strategies.length)]();
    }
  }

  // Fetch expanded categories for endless variety
  private async fetchExpandedCategories() {
    try {
      const [emotions, colors, animals, mythology, technology, nature, cosmic, abstract, textures, weather, timeRelated, movement, sounds, tastes, cultural,
             scienceFiction, fantasy, food, fashion, architecture, literature, psychology, microEmotions, worldCities, landscapes, 
             physics, chemistry, biology, absurd, historical, sensory, compound] = await Promise.all([
        this.fetchEmotionalWords(),
        this.fetchColorWords(),
        this.fetchAnimalWords(),
        this.fetchMythologyWords(),
        this.fetchTechnologyWords(),
        this.fetchNatureWords(),
        this.fetchCosmicWords(),
        this.fetchAbstractWords(),
        this.fetchTextureWords(),
        this.fetchWeatherWords(),
        this.fetchTimeWords(),
        this.fetchMovementWords(),
        this.fetchSoundWords(),
        this.fetchTasteWords(),
        this.fetchCulturalWords(),
        // New specialized domains
        this.fetchScienceFictionWords(),
        this.fetchFantasyWords(),
        this.fetchCulinaryWords(),
        this.fetchFashionWords(),
        this.fetchArchitectureWords(),
        this.fetchLiteratureWords(),
        this.fetchPsychologyWords(),
        this.fetchMicroEmotionWords(),
        this.fetchWorldCityWords(),
        this.fetchLandscapeWords(),
        this.fetchPhysicsWords(),
        this.fetchChemistryWords(),
        this.fetchBiologyWords(),
        this.fetchAbsurdWords(),
        this.fetchHistoricalWords(),
        this.fetchSensoryWords(),
        this.generateCompoundWords()
      ]);

      this.expandedCategories = {
        emotions: this.removeDuplicates(emotions),
        colors: this.removeDuplicates(colors),
        animals: this.removeDuplicates(animals),
        mythology: this.removeDuplicates(mythology),
        technology: this.removeDuplicates(technology),
        nature: this.removeDuplicates(nature),
        cosmic: this.removeDuplicates(cosmic),
        abstract: this.removeDuplicates(abstract),
        textures: this.removeDuplicates(textures),
        weather: this.removeDuplicates(weather),
        timeRelated: this.removeDuplicates(timeRelated),
        movement: this.removeDuplicates(movement),
        sounds: this.removeDuplicates(sounds),
        tastes: this.removeDuplicates(tastes),
        cultural: this.removeDuplicates(cultural),
        // New specialized domains
        scienceFiction: this.removeDuplicates(scienceFiction),
        fantasy: this.removeDuplicates(fantasy),
        food: this.removeDuplicates(food),
        fashion: this.removeDuplicates(fashion),
        architecture: this.removeDuplicates(architecture),
        literature: this.removeDuplicates(literature),
        psychology: this.removeDuplicates(psychology),
        microEmotions: this.removeDuplicates(microEmotions),
        worldCities: this.removeDuplicates(worldCities),
        landscapes: this.removeDuplicates(landscapes),
        physics: this.removeDuplicates(physics),
        chemistry: this.removeDuplicates(chemistry),
        biology: this.removeDuplicates(biology),
        absurd: this.removeDuplicates(absurd),
        historical: this.removeDuplicates(historical),
        sensory: this.removeDuplicates(sensory),
        compound: this.removeDuplicates(compound)
      };

      // Integrate expanded categories into main word sources
      this.integrateExpandedCategories();
      
      console.log('Expanded categories loaded:', Object.fromEntries(
        Object.entries(this.expandedCategories).map(([key, value]) => [key, value.length])
      ));
    } catch (error) {
      console.error('Error fetching expanded categories:', error);
    }
  }

  private integrateExpandedCategories() {
    // Massively expand adjectives with specialized domains
    this.wordSources.adjectives = [
      ...this.wordSources.adjectives,
      // Core emotional and sensory
      ...this.expandedCategories.emotions.slice(0, 35),
      ...this.expandedCategories.microEmotions.slice(0, 50),
      ...this.expandedCategories.colors.slice(0, 34),
      ...this.expandedCategories.textures.slice(0, 25),
      ...this.expandedCategories.tastes.slice(0, 15),
      ...this.expandedCategories.sensory.slice(0, 40),
      // Specialized domains
      ...this.expandedCategories.scienceFiction.slice(0, 40),
      ...this.expandedCategories.fantasy.slice(0, 45),
      ...this.expandedCategories.fashion.slice(0, 35),
      ...this.expandedCategories.architecture.slice(0, 30),
      ...this.expandedCategories.literature.slice(0, 25),
      ...this.expandedCategories.psychology.slice(0, 40),
      ...this.expandedCategories.physics.slice(0, 30),
      ...this.expandedCategories.chemistry.slice(0, 25),
      ...this.expandedCategories.biology.slice(0, 25),
      ...this.expandedCategories.historical.slice(0, 30),
      ...this.expandedCategories.absurd.slice(0, 40)
    ];

    // Massively expand nouns with specialized domains  
    this.wordSources.nouns = [
      ...this.wordSources.nouns,
      // Core categories
      ...this.expandedCategories.animals.slice(0, 40),
      ...this.expandedCategories.mythology.slice(0, 35),
      ...this.expandedCategories.technology.slice(0, 40),
      ...this.expandedCategories.nature.slice(0, 40),
      ...this.expandedCategories.cosmic.slice(0, 30),
      ...this.expandedCategories.abstract.slice(0, 30),
      ...this.expandedCategories.weather.slice(0, 20),
      ...this.expandedCategories.cultural.slice(0, 25),
      // New specialized domains
      ...this.expandedCategories.scienceFiction.slice(40, 85), // Different slice for nouns
      ...this.expandedCategories.fantasy.slice(30, 70),
      ...this.expandedCategories.food.slice(0, 50),
      ...this.expandedCategories.fashion.slice(20, 50),
      ...this.expandedCategories.architecture.slice(15, 50),
      ...this.expandedCategories.literature.slice(15, 40),
      ...this.expandedCategories.worldCities.slice(0, 47),
      ...this.expandedCategories.landscapes.slice(0, 72),
      ...this.expandedCategories.physics.slice(15, 40),
      ...this.expandedCategories.chemistry.slice(15, 40),
      ...this.expandedCategories.biology.slice(15, 40),
      ...this.expandedCategories.historical.slice(20, 50),
      ...this.expandedCategories.compound.slice(0, 60)
    ];

    // Expand verbs with movement and action words
    this.wordSources.verbs = [
      ...this.wordSources.verbs,
      ...this.expandedCategories.movement.slice(0, 50),
      ...this.expandedCategories.sounds.map(s => this.soundToVerb(s)).slice(0, 25),
      // Psychology actions
      ...this.expandedCategories.psychology.filter(p => p.endsWith('ing') || ['Focus', 'Think', 'Learn', 'Feel', 'React', 'Respond'].includes(p)).slice(0, 20)
    ];

    // Expand musical terms with specialized categories
    this.wordSources.musicalTerms = [
      ...this.wordSources.musicalTerms,
      ...this.expandedCategories.sounds.slice(0, 25),
      ...this.expandedCategories.timeRelated.filter(t => this.isMusicalTime(t)).slice(0, 20),
      ...this.expandedCategories.literature.filter(l => ['Rhythm', 'Cadence', 'Verse', 'Ballad', 'Epic', 'Saga'].includes(l)).slice(0, 15)
    ];

    // Remove duplicates and set limits for performance
    this.wordSources.adjectives = this.removeDuplicates(this.wordSources.adjectives).slice(0, 1200);
    this.wordSources.nouns = this.removeDuplicates(this.wordSources.nouns).slice(0, 1400);
    this.wordSources.verbs = this.removeDuplicates(this.wordSources.verbs).slice(0, 500);
    this.wordSources.musicalTerms = this.removeDuplicates(this.wordSources.musicalTerms).slice(0, 600);
    
    console.log('Final vocabulary sizes:', {
      adjectives: this.wordSources.adjectives.length,
      nouns: this.wordSources.nouns.length, 
      verbs: this.wordSources.verbs.length,
      musicalTerms: this.wordSources.musicalTerms.length
    });
  }

  private soundToVerb(sound: string): string {
    // Convert sound words to verb forms
    const verbMap: { [key: string]: string } = {
      'whisper': 'whispering',
      'thunder': 'thundering',
      'echo': 'echoing',
      'buzz': 'buzzing',
      'hum': 'humming',
      'roar': 'roaring',
      'click': 'clicking',
      'snap': 'snapping',
      'crash': 'crashing',
      'ring': 'ringing'
    };
    return verbMap[sound.toLowerCase()] || sound;
  }

  private isMusicalTime(timeWord: string): boolean {
    // Check if time-related word is musically relevant
    const musicalTimeWords = ['tempo', 'rhythm', 'beat', 'measure', 'bar', 'pause', 'rest', 'timing', 'sync', 'delay'];
    return musicalTimeWords.some(word => timeWord.toLowerCase().includes(word));
  }

  private isValidWord = (word: string): boolean => {
    if (!word || word.length < 2 || word.length > 15) return false;
    if (!/^[a-zA-Z-]+$/.test(word)) return false;
    if (/^(the|and|or|but|in|on|at|to|for|of|with|by)$/i.test(word)) return false;
    return true;
  }

  // Expanded category fetchers for endless variety
  private async fetchEmotionalWords(): Promise<string[]> {
    return [
      'Blissful', 'Furious', 'Yearning', 'Ecstatic', 'Despondent', 'Exuberant', 'Anguished',
      'Jubilant', 'Forlorn', 'Elated', 'Morose', 'Giddy', 'Sullen', 'Euphoric', 'Wistful',
      'Rapturous', 'Crestfallen', 'Gleeful', 'Dejected', 'Radiant', 'Melancholic', 'Zealous',
      'Pensive', 'Vivacious', 'Somber', 'Exhilarated', 'Doleful', 'Buoyant', 'Lugubrious',
      'Enraptured', 'Disconsolate', 'Effervescent', 'Woeful', 'Beatific', 'Lachrymose'
    ];
  }

  private async fetchColorWords(): Promise<string[]> {
    return [
      'Vermillion', 'Cerulean', 'Chartreuse', 'Magenta', 'Ochre', 'Sienna', 'Cobalt',
      'Periwinkle', 'Saffron', 'Burgundy', 'Teal', 'Maroon', 'Aquamarine', 'Fuchsia',
      'Lavender', 'Coral', 'Turquoise', 'Mauve', 'Tangerine', 'Sepia', 'Viridian',
      'Carmine', 'Ultramarine', 'Cinnabar', 'Aureolin', 'Prussian', 'Cadmium', 'Phthalo',
      'Quinacridone', 'Titanium', 'Chromatic', 'Prismatic', 'Iridescent', 'Opalescent'
    ];
  }

  private async fetchAnimalWords(): Promise<string[]> {
    return [
      'Phoenix', 'Griffin', 'Chimera', 'Leviathan', 'Kraken', 'Basilisk', 'Wyvern',
      'Hydra', 'Pegasus', 'Sphinx', 'Minotaur', 'Centaur', 'Manticore', 'Hippogryph',
      'Salamander', 'Behemoth', 'Roc', 'Cerberus', 'Valkyrie', 'Banshee', 'Selkie',
      'Kitsune', 'Tengu', 'Raiju', 'Qilin', 'Baku', 'Kappa', 'Oni', 'Yokai',
      'Wendigo', 'Chupacabra', 'Mothman', 'Thunderbird', 'Skinwalker', 'Jackalope'
    ];
  }

  private async fetchMythologyWords(): Promise<string[]> {
    return [
      'Valhalla', 'Elysium', 'Avalon', 'Asgard', 'Olympus', 'Atlantis', 'Camelot',
      'Shangri-La', 'El-Dorado', 'Hyperborea', 'Lemuria', 'Mu', 'Thule', 'Arcadia',
      'Pandora', 'Prometheus', 'Icarus', 'Achilles', 'Odysseus', 'Perseus', 'Orpheus',
      'Medusa', 'Circe', 'Cassandra', 'Andromeda', 'Persephone', 'Dionysus', 'Apollo',
      'Athena', 'Hermes', 'Poseidon', 'Hades', 'Chronos', 'Gaia', 'Nyx'
    ];
  }

  private async fetchTechnologyWords(): Promise<string[]> {
    return [
      'Quantum', 'Cybernetic', 'Holographic', 'Neuromantic', 'Bionic', 'Synthetic',
      'Digital', 'Virtual', 'Augmented', 'Nano', 'Plasma', 'Photonic', 'Sonic',
      'Magnetic', 'Gravitational', 'Temporal', 'Dimensional', 'Fractal', 'Algorithmic',
      'Binary', 'Hexadecimal', 'Encrypted', 'Decoded', 'Simulated', 'Emulated',
      'Transcoded', 'Overclocked', 'Undervolted', 'Modulated', 'Amplified', 'Attenuated',
      'Calibrated', 'Synchronized', 'Initialized', 'Terminated'
    ];
  }

  private async fetchNatureWords(): Promise<string[]> {
    return [
      'Tundra', 'Savanna', 'Rainforest', 'Desert', 'Glacier', 'Volcano', 'Canyon',
      'Fjord', 'Archipelago', 'Peninsula', 'Isthmus', 'Atoll', 'Mesa', 'Plateau',
      'Estuary', 'Delta', 'Bayou', 'Marsh', 'Swamp', 'Fen', 'Bog', 'Moor',
      'Heath', 'Prairie', 'Steppe', 'Pampas', 'Veldt', 'Taiga', 'Chaparral',
      'Mangrove', 'Coral', 'Kelp', 'Lichen', 'Moss', 'Fungus'
    ];
  }

  private async fetchCosmicWords(): Promise<string[]> {
    return [
      'Nebula', 'Quasar', 'Pulsar', 'Supernova', 'Blackhole', 'Wormhole', 'Galaxy',
      'Constellation', 'Asteroid', 'Comet', 'Meteor', 'Eclipse', 'Solstice', 'Equinox',
      'Aurora', 'Corona', 'Chromosphere', 'Magnetosphere', 'Heliosphere', 'Exosphere',
      'Stratosphere', 'Mesosphere', 'Thermosphere', 'Ionosphere', 'Troposphere',
      'Perihelion', 'Aphelion', 'Perigee', 'Apogee', 'Zenith', 'Nadir', 'Azimuth',
      'Parallax', 'Redshift', 'Blueshift'
    ];
  }

  private async fetchAbstractWords(): Promise<string[]> {
    return [
      'Paradox', 'Enigma', 'Conundrum', 'Anomaly', 'Phenomenon', 'Epiphany', 'Axiom',
      'Theorem', 'Hypothesis', 'Paradigm', 'Zeitgeist', 'Gestalt', 'Archetype', 'Motif',
      'Leitmotif', 'Allegory', 'Metaphor', 'Simile', 'Synecdoche', 'Metonymy', 'Irony',
      'Satire', 'Parody', 'Pastiche', 'Collage', 'Montage', 'Bricolage', 'Palimpsest',
      'Pentimento', 'Chiaroscuro', 'Sfumato', 'Tenebrism', 'Impasto', 'Glazing'
    ];
  }

  private async fetchTextureWords(): Promise<string[]> {
    return [
      'Velveteen', 'Silken', 'Gossamer', 'Diaphanous', 'Gauzy', 'Feathery', 'Downy',
      'Plush', 'Velvety', 'Satiny', 'Lustrous', 'Burnished', 'Polished', 'Matte',
      'Granular', 'Gritty', 'Coarse', 'Rough', 'Jagged', 'Serrated', 'Corrugated',
      'Ribbed', 'Grooved', 'Scored', 'Etched', 'Embossed', 'Debossed', 'Stippled',
      'Dappled', 'Mottled', 'Marbled', 'Veined', 'Striated', 'Laminated'
    ];
  }

  private async fetchWeatherWords(): Promise<string[]> {
    return [
      'Tempest', 'Maelstrom', 'Typhoon', 'Cyclone', 'Hurricane', 'Tornado', 'Whirlwind',
      'Zephyr', 'Gale', 'Squall', 'Blizzard', 'Hailstorm', 'Thunderstorm', 'Downpour',
      'Deluge', 'Drizzle', 'Mist', 'Fog', 'Haze', 'Smog', 'Frost', 'Rime',
      'Hoarfrost', 'Glaze', 'Sleet', 'Graupel', 'Virga', 'Mammatus', 'Cumulonimbus',
      'Stratocumulus', 'Altostratus', 'Cirrus', 'Nimbus', 'Cumulus'
    ];
  }

  private async fetchTimeWords(): Promise<string[]> {
    return [
      'Epoch', 'Era', 'Eon', 'Millennium', 'Century', 'Decade', 'Fortnight', 'Sennight',
      'Solstice', 'Equinox', 'Twilight', 'Dusk', 'Dawn', 'Daybreak', 'Eventide',
      'Gloaming', 'Vespers', 'Matins', 'Compline', 'Lauds', 'Prime', 'Terce',
      'Sext', 'None', 'Chronos', 'Kairos', 'Temporal', 'Perpetual', 'Eternal',
      'Ephemeral', 'Transient', 'Fleeting', 'Momentary', 'Instantaneous'
    ];
  }

  private async fetchMovementWords(): Promise<string[]> {
    return [
      'Gyrating', 'Oscillating', 'Undulating', 'Pulsating', 'Reverberating', 'Resonating',
      'Cascading', 'Tumbling', 'Spiraling', 'Whirling', 'Spinning', 'Revolving',
      'Orbiting', 'Circling', 'Meandering', 'Serpentine', 'Zigzagging', 'Ricocheting',
      'Caroming', 'Glancing', 'Skimming', 'Grazing', 'Brushing', 'Sweeping',
      'Gliding', 'Soaring', 'Swooping', 'Plummeting', 'Diving', 'Ascending',
      'Descending', 'Levitating', 'Hovering', 'Floating', 'Drifting'
    ];
  }

  private async fetchSoundWords(): Promise<string[]> {
    return [
      'Cacophony', 'Symphony', 'Harmony', 'Melody', 'Rhythm', 'Cadence', 'Resonance',
      'Reverberation', 'Echo', 'Whisper', 'Murmur', 'Rustle', 'Sizzle', 'Crackle',
      'Rumble', 'Thunder', 'Roar', 'Bellow', 'Shriek', 'Wail', 'Keen', 'Ululate',
      'Trill', 'Warble', 'Chirp', 'Tweet', 'Hoot', 'Caw', 'Squawk', 'Screech',
      'Buzz', 'Hum', 'Drone', 'Whir', 'Click'
    ];
  }

  private async fetchTasteWords(): Promise<string[]> {
    return [
      'Umami', 'Savory', 'Piquant', 'Tangy', 'Zesty', 'Tart', 'Acidic', 'Bitter',
      'Astringent', 'Acrid', 'Pungent', 'Spicy', 'Fiery', 'Mild', 'Mellow',
      'Rich', 'Decadent', 'Luscious', 'Succulent', 'Delectable', 'Ambrosial',
      'Nectarous', 'Honeyed', 'Saccharine', 'Cloying', 'Treacly', 'Syrupy',
      'Buttery', 'Creamy', 'Velvety', 'Silky', 'Unctuous', 'Oleaginous'
    ];
  }

  private async fetchCulturalWords(): Promise<string[]> {
    return [
      'Renaissance', 'Baroque', 'Rococo', 'Gothic', 'Byzantine', 'Romanesque',
      'Art-Deco', 'Art-Nouveau', 'Bauhaus', 'Brutalist', 'Minimalist', 'Maximalist',
      'Avant-Garde', 'Surrealist', 'Dadaist', 'Cubist', 'Impressionist', 'Expressionist',
      'Futurist', 'Constructivist', 'Deconstructivist', 'Post-Modern', 'Contemporary',
      'Traditional', 'Classical', 'Neoclassical', 'Romantic', 'Realist', 'Naturalist',
      'Symbolist', 'Modernist', 'Abstract', 'Conceptual', 'Performance'
    ];
  }

  // Method to fetch mood-specific words from web when a mood is selected
  private async fetchMoodSpecificWords(mood: string): Promise<WordSource> {
    try {
      console.log(`Fetching web words for mood: ${mood}`);
      
      // Create mood-specific search terms for web APIs
      const moodKeywords = this.getMoodKeywords(mood);
      
      const [adjectives, nouns, verbs, musicalTerms] = await Promise.all([
        this.fetchMoodAdjectivesFromWeb(moodKeywords),
        this.fetchMoodNounsFromWeb(moodKeywords),
        this.fetchMoodVerbsFromWeb(moodKeywords),
        this.fetchMoodMusicalTermsFromWeb(moodKeywords)
      ]);

      return {
        adjectives: this.removeDuplicates(adjectives),
        nouns: this.removeDuplicates(nouns),
        verbs: this.removeDuplicates(verbs),
        musicalTerms: this.removeDuplicates(musicalTerms)
      };
    } catch (error) {
      console.error(`Failed to fetch mood-specific words for ${mood}:`, error);
      return this.getFilteredWordSources(mood);
    }
  }

  private getMoodKeywords(mood: string): string[] {
    const moodKeywordMap: { [key: string]: string[] } = {
      dark: ['shadow', 'night', 'gothic', 'black', 'death', 'doom', 'horror', 'darkness'],
      bright: ['light', 'sunny', 'cheerful', 'happy', 'golden', 'brilliant', 'radiant', 'luminous'],
      mysterious: ['mysterious', 'enigmatic', 'cryptic', 'hidden', 'secret', 'occult', 'mystical'],
      energetic: ['fast', 'active', 'dynamic', 'powerful', 'intense', 'vigorous', 'electric'],
      melancholy: ['sad', 'melancholy', 'sorrowful', 'blue', 'lonely', 'nostalgic', 'wistful'],
      ethereal: ['ethereal', 'celestial', 'heavenly', 'divine', 'spiritual', 'angelic', 'sublime'],
      aggressive: ['aggressive', 'fierce', 'violent', 'brutal', 'savage', 'intense', 'raw'],
      peaceful: ['peaceful', 'calm', 'serene', 'tranquil', 'gentle', 'quiet', 'zen'],
      nostalgic: ['nostalgic', 'vintage', 'retro', 'classic', 'old', 'memory', 'past'],
      futuristic: ['futuristic', 'sci-fi', 'cyber', 'digital', 'tech', 'space', 'quantum'],
      romantic: ['romantic', 'love', 'passion', 'heart', 'tender', 'sweet', 'intimate'],
      epic: ['epic', 'heroic', 'legendary', 'grand', 'majestic', 'monumental', 'triumph']
    };
    
    return moodKeywordMap[mood] || [];
  }

  private async fetchMoodAdjectivesFromWeb(keywords: string[]): Promise<string[]> {
    const adjectives: string[] = [];
    
    for (const keyword of keywords.slice(0, 3)) { // Limit to 3 keywords to avoid overwhelming APIs
      try {
        // Use keyword-based searches to find mood-appropriate adjectives
        const words = await this.searchWordsByKeyword(keyword, 'adjective');
        adjectives.push(...words);
      } catch (error) {
        console.error(`Error fetching adjectives for keyword ${keyword}:`, error);
      }
    }
    
    return adjectives.slice(0, 20);
  }

  private async fetchMoodNounsFromWeb(keywords: string[]): Promise<string[]> {
    const nouns: string[] = [];
    
    for (const keyword of keywords.slice(0, 3)) {
      try {
        const words = await this.searchWordsByKeyword(keyword, 'noun');
        nouns.push(...words);
      } catch (error) {
        console.error(`Error fetching nouns for keyword ${keyword}:`, error);
      }
    }
    
    return nouns.slice(0, 20);
  }

  private async fetchMoodVerbsFromWeb(keywords: string[]): Promise<string[]> {
    const verbs: string[] = [];
    
    for (const keyword of keywords.slice(0, 2)) {
      try {
        const words = await this.searchWordsByKeyword(keyword, 'verb');
        verbs.push(...words);
      } catch (error) {
        console.error(`Error fetching verbs for keyword ${keyword}:`, error);
      }
    }
    
    return verbs.slice(0, 15);
  }

  private async fetchMoodMusicalTermsFromWeb(keywords: string[]): Promise<string[]> {
    const musicalTerms: string[] = [];
    
    for (const keyword of keywords.slice(0, 2)) {
      try {
        // Search for musical terms related to the mood
        const terms = await this.searchMusicalTermsByMood(keyword);
        musicalTerms.push(...terms);
      } catch (error) {
        console.error(`Error fetching musical terms for keyword ${keyword}:`, error);
      }
    }
    
    return musicalTerms.slice(0, 15);
  }

  private async searchWordsByKeyword(keyword: string, partOfSpeech: string): Promise<string[]> {
    try {
      // Search for words related to the keyword using multiple sources
      const sources = [
        this.searchWordnikByKeyword(keyword, partOfSpeech),
        this.searchWikipediaByKeyword(keyword),
        this.searchPoetryByKeyword(keyword)
      ];
      
      const results = await Promise.allSettled(sources);
      const words: string[] = [];
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          words.push(...result.value);
        }
      });
      
      return words.filter(this.isValidWord).slice(0, 10);
    } catch (error) {
      console.error(`Error searching words for keyword ${keyword}:`, error);
      return [];
    }
  }

  private async searchMusicalTermsByMood(keyword: string): Promise<string[]> {
    try {
      // Search for musical terms that match the mood
      const response = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${keyword}+music&limit=10&format=json&origin=*`);
      
      if (!response.ok) throw new Error('Wikipedia search failed');
      
      const data = await response.json();
      const titles = data[1] || [];
      
      const musicalTerms: string[] = [];
      titles.forEach((title: string) => {
        const words = title.split(/[\s\-_()]+/)
          .filter((word: string) => word.length > 2 && word.length < 15)
          .map((word: string) => this.capitalizeFirst(word.toLowerCase()))
          .filter(this.isValidWord);
        musicalTerms.push(...words);
      });
      
      return musicalTerms.slice(0, 8);
    } catch (error) {
      console.error(`Error searching musical terms for mood ${keyword}:`, error);
      return [];
    }
  }

  private async searchWordnikByKeyword(keyword: string, partOfSpeech: string): Promise<string[]> {
    try {
      // Use Wordnik's related words API (if available)
      const response = await fetch(`https://api.wordnik.com/v4/word.json/${keyword}/relatedWords?useCanonical=true&relationshipTypes=synonym,antonym&limitPerRelationshipType=10&api_key=placeholder`);
      
      if (!response.ok) throw new Error('Wordnik related words failed');
      
      const data = await response.json();
      const words: string[] = [];
      
      data.forEach((relation: any) => {
        if (relation.words) {
          words.push(...relation.words.map((word: string) => this.capitalizeFirst(word)));
        }
      });
      
      return words.filter(this.isValidWord);
    } catch (error) {
      console.error(`Error searching Wordnik for keyword ${keyword}:`, error);
      return [];
    }
  }

  private async searchWikipediaByKeyword(keyword: string): Promise<string[]> {
    try {
      const response = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${keyword}&limit=5&format=json&origin=*`);
      
      if (!response.ok) throw new Error('Wikipedia search failed');
      
      const data = await response.json();
      const titles = data[1] || [];
      
      const words: string[] = [];
      titles.forEach((title: string) => {
        const titleWords = title.split(/[\s\-_()]+/)
          .filter((word: string) => word.length > 2 && word.length < 15)
          .map((word: string) => this.capitalizeFirst(word.toLowerCase()))
          .filter(this.isValidWord);
        words.push(...titleWords);
      });
      
      return words.slice(0, 8);
    } catch (error) {
      console.error(`Error searching Wikipedia for keyword ${keyword}:`, error);
      return [];
    }
  }

  private async searchPoetryByKeyword(keyword: string): Promise<string[]> {
    try {
      // Search poetry for evocative words related to the keyword
      const response = await fetch(`https://poetrydb.org/lines/${keyword}`);
      
      if (!response.ok) throw new Error('Poetry search failed');
      
      const data = await response.json();
      const words: string[] = [];
      
      if (Array.isArray(data)) {
        data.slice(0, 3).forEach((poem: any) => {
          if (poem.lines) {
            poem.lines.slice(0, 5).forEach((line: string) => {
              const lineWords = line.split(/\s+/)
                .filter((word: string) => word.length > 3 && word.length < 12)
                .map((word: string) => word.replace(/[^a-zA-Z]/g, ''))
                .filter((word: string) => word.length > 2)
                .map((word: string) => this.capitalizeFirst(word.toLowerCase()));
              words.push(...lineWords);
            });
          }
        });
      }
      
      return words.filter(this.isValidWord).slice(0, 10);
    } catch (error) {
      console.error(`Error searching poetry for keyword ${keyword}:`, error);
      return [];
    }
  }

  // New specialized domain fetchers for massive vocabulary expansion
  private async fetchScienceFictionWords(): Promise<string[]> {
    return [
      'Cybernetic', 'Quantum', 'Neural', 'Bionic', 'Synthetic', 'Holographic', 'Dimensional',
      'Temporal', 'Galactic', 'Interstellar', 'Hypersonic', 'Cryogenic', 'Nanotechnology',
      'Antimatter', 'Plasma', 'Warp', 'Teleportation', 'Terraforming', 'Genetic', 'Clone',
      'Android', 'Cyborg', 'Robot', 'AI', 'Matrix', 'Virtual', 'Augmented', 'Enhanced',
      'Starship', 'Mothership', 'Spaceship', 'Station', 'Colony', 'Outpost', 'Gateway',
      'Nexus', 'Portal', 'Wormhole', 'Blackhole', 'Nebula', 'Supernova', 'Pulsar',
      'Asteroid', 'Comet', 'Meteorite', 'Satellite', 'Observatory', 'Laboratory', 'Reactor',
      'Engine', 'Drive', 'Thruster', 'Shield', 'Armor', 'Weapon', 'Laser', 'Phaser',
      'Blaster', 'Cannon', 'Torpedo', 'Missile', 'Bomb', 'Explosive', 'Energy', 'Power',
      'Fuel', 'Core', 'Generator', 'Battery', 'Cell', 'Unit', 'Module', 'Component',
      'System', 'Network', 'Grid', 'Interface', 'Terminal', 'Console', 'Display', 'Screen',
      'Sensor', 'Scanner', 'Detector', 'Monitor', 'Tracker', 'Analyzer', 'Computer',
      'Processor', 'Memory', 'Database', 'Archive', 'Library', 'Repository', 'Storage'
    ];
  }

  private async fetchFantasyWords(): Promise<string[]> {
    return [
      'Mystical', 'Enchanted', 'Magical', 'Arcane', 'Ethereal', 'Celestial', 'Divine',
      'Sacred', 'Holy', 'Blessed', 'Cursed', 'Damned', 'Forbidden', 'Ancient', 'Elder',
      'Primordial', 'Legendary', 'Mythical', 'Fabled', 'Heroic', 'Epic', 'Noble',
      'Royal', 'Imperial', 'Sovereign', 'Majestic', 'Regal', 'Glorious', 'Magnificent',
      'Spell', 'Charm', 'Hex', 'Curse', 'Blessing', 'Incantation', 'Ritual', 'Ceremony',
      'Potion', 'Elixir', 'Brew', 'Draught', 'Tonic', 'Philter', 'Remedy', 'Antidote',
      'Crystal', 'Gem', 'Stone', 'Jewel', 'Orb', 'Sphere', 'Globe', 'Pendant',
      'Amulet', 'Talisman', 'Charm', 'Ring', 'Crown', 'Scepter', 'Staff', 'Wand',
      'Dragon', 'Phoenix', 'Griffin', 'Unicorn', 'Pegasus', 'Chimera', 'Basilisk', 'Wyrm',
      'Fairy', 'Sprite', 'Pixie', 'Nymph', 'Dryad', 'Naiad', 'Sylph', 'Undine',
      'Elf', 'Dwarf', 'Gnome', 'Halfling', 'Giant', 'Titan', 'Ogre', 'Troll',
      'Goblin', 'Orc', 'Kobold', 'Demon', 'Devil', 'Fiend', 'Specter', 'Wraith',
      'Castle', 'Tower', 'Fortress', 'Citadel', 'Keep', 'Dungeon', 'Cavern', 'Grotto',
      'Forest', 'Grove', 'Glade', 'Meadow', 'Vale', 'Dell', 'Hollow', 'Thicket'
    ];
  }

  private async fetchCulinaryWords(): Promise<string[]> {
    return [
      'Artisanal', 'Gourmet', 'Organic', 'Fresh', 'Seasonal', 'Local', 'Farm-to-table',
      'Handcrafted', 'Small-batch', 'Authentic', 'Traditional', 'Heritage', 'Heirloom',
      'Saffron', 'Truffle', 'Caviar', 'Foie', 'Wagyu', 'Kobe', 'Angus', 'Prime',
      'Aged', 'Cured', 'Smoked', 'Grilled', 'Roasted', 'Braised', 'Seared', 'Poached',
      'Sous-vide', 'Molecular', 'Fusion', 'Bistro', 'Brasserie', 'Trattoria', 'Osteria',
      'Tapas', 'Mezze', 'Antipasti', 'Charcuterie', 'Cheese', 'Wine', 'Vintage', 'Reserve',
      'Estate', 'Single-malt', 'Barrel-aged', 'Small-batch', 'Craft', 'Microbrewery',
      'Espresso', 'Cappuccino', 'Latte', 'Macchiato', 'Americano', 'Cortado', 'Gibraltar',
      'Sourdough', 'Ciabatta', 'Focaccia', 'Baguette', 'Croissant', 'Brioche', 'Pain',
      'Pasta', 'Risotto', 'Polenta', 'Gnocchi', 'Ravioli', 'Tortellini', 'Pappardelle',
      'Umami', 'Savory', 'Sweet', 'Bitter', 'Sour', 'Salty', 'Spicy', 'Mild',
      'Bold', 'Complex', 'Layered', 'Balanced', 'Harmonious', 'Robust', 'Delicate', 'Subtle'
    ];
  }

  private async fetchFashionWords(): Promise<string[]> {
    return [
      'Couture', 'Haute', 'Prêt-à-porter', 'Ready-to-wear', 'Bespoke', 'Tailored', 'Custom',
      'Avant-garde', 'Minimalist', 'Bohemian', 'Vintage', 'Retro', 'Classic', 'Timeless',
      'Trendy', 'Contemporary', 'Modern', 'Chic', 'Elegant', 'Sophisticated', 'Refined',
      'Luxurious', 'Premium', 'Designer', 'Signature', 'Iconic', 'Statement', 'Bold',
      'Silk', 'Cashmere', 'Velvet', 'Satin', 'Chiffon', 'Lace', 'Tweed', 'Denim',
      'Leather', 'Suede', 'Wool', 'Cotton', 'Linen', 'Jersey', 'Crepe', 'Georgette',
      'Draping', 'Tailoring', 'Silhouette', 'Cut', 'Fit', 'Structure', 'Flow', 'Movement',
      'Texture', 'Pattern', 'Print', 'Embroidery', 'Beading', 'Sequin', 'Appliqué',
      'Runway', 'Catwalk', 'Fashion', 'Style', 'Trend', 'Season', 'Collection', 'Line',
      'Capsule', 'Wardrobe', 'Ensemble', 'Outfit', 'Look', 'Aesthetic', 'Vibe', 'Mood'
    ];
  }

  private async fetchArchitectureWords(): Promise<string[]> {
    return [
      'Modernist', 'Brutalist', 'Bauhaus', 'Art-deco', 'Victorian', 'Gothic', 'Renaissance',
      'Baroque', 'Neoclassical', 'Contemporary', 'Postmodern', 'Deconstructivist', 'Minimalist',
      'Organic', 'Sustainable', 'Green', 'Eco-friendly', 'Passive', 'Net-zero', 'LEED',
      'Structure', 'Framework', 'Foundation', 'Beam', 'Column', 'Arch', 'Dome', 'Vault',
      'Facade', 'Elevation', 'Profile', 'Silhouette', 'Skyline', 'Horizon', 'Vista', 'View',
      'Space', 'Volume', 'Form', 'Mass', 'Scale', 'Proportion', 'Rhythm', 'Balance',
      'Symmetry', 'Asymmetry', 'Harmony', 'Contrast', 'Tension', 'Flow', 'Movement', 'Transition',
      'Material', 'Concrete', 'Steel', 'Glass', 'Stone', 'Brick', 'Timber', 'Wood',
      'Metal', 'Aluminum', 'Copper', 'Bronze', 'Iron', 'Composite', 'Membrane', 'Fabric',
      'Light', 'Shadow', 'Illumination', 'Natural', 'Artificial', 'Daylight', 'Sunlight', 'Moonlight',
      'Atrium', 'Courtyard', 'Plaza', 'Terrace', 'Balcony', 'Deck', 'Patio', 'Garden',
      'Landscape', 'Urban', 'Suburban', 'Rural', 'Metropolitan', 'Civic', 'Public', 'Private'
    ];
  }

  private async fetchLiteratureWords(): Promise<string[]> {
    return [
      'Prose', 'Poetry', 'Verse', 'Stanza', 'Rhyme', 'Meter', 'Rhythm', 'Cadence',
      'Metaphor', 'Simile', 'Allegory', 'Symbolism', 'Imagery', 'Irony', 'Satire', 'Paradox',
      'Narrative', 'Plot', 'Character', 'Theme', 'Motif', 'Setting', 'Atmosphere', 'Mood',
      'Tone', 'Voice', 'Style', 'Genre', 'Fiction', 'Non-fiction', 'Biography', 'Memoir',
      'Essay', 'Article', 'Review', 'Critique', 'Analysis', 'Commentary', 'Editorial', 'Opinion',
      'Novel', 'Novella', 'Short-story', 'Flash-fiction', 'Microfiction', 'Vignette', 'Sketch',
      'Sonnet', 'Ballad', 'Ode', 'Elegy', 'Haiku', 'Tanka', 'Limerick', 'Free-verse',
      'Epic', 'Saga', 'Chronicle', 'Legend', 'Myth', 'Folklore', 'Fable', 'Parable',
      'Drama', 'Tragedy', 'Comedy', 'Romance', 'Mystery', 'Thriller', 'Horror', 'Science-fiction',
      'Fantasy', 'Adventure', 'Western', 'Historical', 'Contemporary', 'Literary', 'Commercial',
      'Experimental', 'Avant-garde', 'Modernist', 'Postmodern', 'Classical', 'Romantic', 'Victorian',
      'Chapter', 'Section', 'Part', 'Book', 'Volume', 'Series', 'Trilogy', 'Anthology'
    ];
  }

  private async fetchPsychologyWords(): Promise<string[]> {
    return [
      'Cognitive', 'Behavioral', 'Emotional', 'Mental', 'Psychological', 'Neurological', 'Psychiatric',
      'Conscious', 'Unconscious', 'Subconscious', 'Preconscious', 'Superego', 'Ego', 'Id',
      'Persona', 'Anima', 'Animus', 'Shadow', 'Archetype', 'Collective', 'Individual', 'Personal',
      'Memory', 'Perception', 'Attention', 'Concentration', 'Focus', 'Awareness', 'Mindfulness',
      'Thought', 'Thinking', 'Reasoning', 'Logic', 'Intuition', 'Insight', 'Understanding', 'Comprehension',
      'Learning', 'Conditioning', 'Reinforcement', 'Punishment', 'Reward', 'Motivation', 'Drive', 'Impulse',
      'Emotion', 'Feeling', 'Mood', 'Affect', 'Sentiment', 'Passion', 'Desire', 'Fear',
      'Anxiety', 'Stress', 'Depression', 'Mania', 'Euphoria', 'Melancholia', 'Nostalgia', 'Grief',
      'Joy', 'Happiness', 'Sadness', 'Anger', 'Rage', 'Love', 'Hate', 'Jealousy',
      'Envy', 'Pride', 'Shame', 'Guilt', 'Regret', 'Hope', 'Despair', 'Trust',
      'Personality', 'Character', 'Temperament', 'Trait', 'Disposition', 'Tendency', 'Pattern', 'Habit',
      'Behavior', 'Action', 'Reaction', 'Response', 'Stimulus', 'Trigger', 'Cause', 'Effect'
    ];
  }

  private async fetchMicroEmotionWords(): Promise<string[]> {
    return [
      'Wistful', 'Pensive', 'Contemplative', 'Reflective', 'Introspective', 'Meditative', 'Thoughtful',
      'Yearning', 'Longing', 'Craving', 'Aching', 'Pining', 'Hankering', 'Thirsting', 'Hungering',
      'Bittersweet', 'Poignant', 'Touching', 'Moving', 'Stirring', 'Evocative', 'Haunting', 'Lingering',
      'Fleeting', 'Ephemeral', 'Transient', 'Momentary', 'Brief', 'Quick', 'Swift', 'Rapid',
      'Gentle', 'Tender', 'Soft', 'Delicate', 'Subtle', 'Nuanced', 'Complex', 'Layered',
      'Ambivalent', 'Conflicted', 'Torn', 'Divided', 'Split', 'Uncertain', 'Doubtful', 'Hesitant',
      'Vulnerable', 'Fragile', 'Sensitive', 'Raw', 'Exposed', 'Open', 'Honest', 'Authentic',
      'Intimate', 'Personal', 'Private', 'Sacred', 'Secret', 'Hidden', 'Concealed', 'Veiled',
      'Mysterious', 'Enigmatic', 'Puzzling', 'Intriguing', 'Fascinating', 'Captivating', 'Mesmerizing',
      'Overwhelming', 'Intense', 'Profound', 'Deep', 'Powerful', 'Strong', 'Forceful', 'Compelling'
    ];
  }

  private async fetchWorldCityWords(): Promise<string[]> {
    return [
      'Tokyo', 'Mumbai', 'Delhi', 'Shanghai', 'São Paulo', 'Mexico City', 'Cairo', 'Beijing',
      'Dhaka', 'Osaka', 'New York', 'Karachi', 'Buenos Aires', 'Chongqing', 'Istanbul', 'Kolkata',
      'Manila', 'Lagos', 'Rio de Janeiro', 'Tianjin', 'Kinshasa', 'Guangzhou', 'Los Angeles',
      'Moscow', 'Shenzhen', 'Lahore', 'Bangalore', 'Paris', 'Bogotá', 'Jakarta', 'Chennai',
      'Lima', 'Bangkok', 'Seoul', 'Nagoya', 'Hyderabad', 'London', 'Tehran', 'Chicago',
      'Chengdu', 'Nanjing', 'Wuhan', 'Ho Chi Minh City', 'Luanda', 'Ahmedabad', 'Kuala Lumpur',
      'Xi\'an', 'Hong Kong', 'Dongguan', 'Hangzhou', 'Foshan', 'Shenyang', 'Riyadh', 'Baghdad',
      'Santiago', 'Surat', 'Madrid', 'Suzhou', 'Pune', 'Harbin', 'Houston', 'Dallas',
      'Toronto', 'Dar es Salaam', 'Miami', 'Belo Horizonte', 'Singapore', 'Philadelphia',
      'Atlanta', 'Fukuoka', 'Khartoum', 'Barcelona', 'Johannesburg', 'Saint Petersburg',
      'Qingdao', 'Dalian', 'Washington', 'Yangon', 'Alexandria', 'Jinan', 'Guadalajara'
    ];
  }

  private async fetchLandscapeWords(): Promise<string[]> {
    return [
      'Fjord', 'Canyon', 'Valley', 'Plateau', 'Mesa', 'Butte', 'Ridge', 'Peak',
      'Summit', 'Crest', 'Slope', 'Hillside', 'Foothill', 'Lowland', 'Highland', 'Upland',
      'Prairie', 'Steppe', 'Savanna', 'Grassland', 'Meadow', 'Pasture', 'Field', 'Plain',
      'Desert', 'Oasis', 'Dune', 'Badland', 'Scrubland', 'Brushland', 'Chaparral', 'Maquis',
      'Forest', 'Woodland', 'Grove', 'Copse', 'Thicket', 'Glade', 'Clearing', 'Dell',
      'Marsh', 'Swamp', 'Bog', 'Fen', 'Wetland', 'Estuary', 'Delta', 'Lagoon',
      'Archipelago', 'Peninsula', 'Isthmus', 'Cape', 'Bay', 'Cove', 'Inlet', 'Sound',
      'Strait', 'Channel', 'Passage', 'Reef', 'Shoal', 'Atoll', 'Island', 'Islet',
      'Cliff', 'Bluff', 'Escarpment', 'Gorge', 'Ravine', 'Gulch', 'Gully', 'Arroyo',
      'Waterfall', 'Cascade', 'Rapids', 'Pool', 'Spring', 'Geyser', 'Hot spring', 'Thermal',
      'Glacier', 'Icefield', 'Iceberg', 'Tundra', 'Taiga', 'Boreal', 'Deciduous', 'Coniferous',
      'Rainforest', 'Cloud forest', 'Montane', 'Alpine', 'Subalpine', 'Treeline', 'Snowline'
    ];
  }

  private async fetchPhysicsWords(): Promise<string[]> {
    return [
      'Quantum', 'Relativity', 'Gravity', 'Electromagnetic', 'Nuclear', 'Particle', 'Wave', 'Field',
      'Energy', 'Matter', 'Mass', 'Momentum', 'Velocity', 'Acceleration', 'Force', 'Pressure',
      'Temperature', 'Heat', 'Thermodynamics', 'Entropy', 'Enthalpy', 'Kinetic', 'Potential', 'Mechanical',
      'Electrical', 'Magnetic', 'Optical', 'Acoustic', 'Sonic', 'Ultrasonic', 'Infrared', 'Ultraviolet',
      'Radiation', 'Radioactive', 'Isotope', 'Atom', 'Molecule', 'Electron', 'Proton', 'Neutron',
      'Photon', 'Boson', 'Fermion', 'Quark', 'Lepton', 'Neutrino', 'Muon', 'Tau',
      'Plasma', 'Solid', 'Liquid', 'Gas', 'Phase', 'Transition', 'Crystalline', 'Amorphous',
      'Conductor', 'Insulator', 'Semiconductor', 'Superconductor', 'Magnetic', 'Diamagnetic', 'Paramagnetic', 'Ferromagnetic',
      'Resonance', 'Frequency', 'Amplitude', 'Wavelength', 'Spectrum', 'Interference', 'Diffraction', 'Refraction',
      'Reflection', 'Absorption', 'Emission', 'Scattering', 'Polarization', 'Coherence', 'Laser', 'Maser'
    ];
  }

  private async fetchChemistryWords(): Promise<string[]> {
    return [
      'Molecular', 'Atomic', 'Ionic', 'Covalent', 'Metallic', 'Hydrogen', 'Polar', 'Nonpolar',
      'Organic', 'Inorganic', 'Biochemical', 'Pharmaceutical', 'Polymer', 'Monomer', 'Catalyst', 'Enzyme',
      'Reaction', 'Synthesis', 'Analysis', 'Oxidation', 'Reduction', 'Combustion', 'Precipitation', 'Dissolution',
      'Acid', 'Base', 'Salt', 'Buffer', 'pH', 'Alkaline', 'Neutral', 'Titration',
      'Element', 'Compound', 'Mixture', 'Solution', 'Solvent', 'Solute', 'Concentration', 'Molarity',
      'Crystal', 'Crystalline', 'Amorphous', 'Volatile', 'Stable', 'Reactive', 'Inert', 'Noble',
      'Halogen', 'Alkali', 'Alkaline earth', 'Transition metal', 'Lanthanide', 'Actinide', 'Metalloid', 'Nonmetal',
      'Hydrocarbon', 'Alcohol', 'Ether', 'Ester', 'Ketone', 'Aldehyde', 'Carboxylic', 'Amino',
      'Protein', 'Carbohydrate', 'Lipid', 'Nucleic', 'Glucose', 'Fructose', 'Sucrose', 'Cellulose',
      'Aromatic', 'Aliphatic', 'Saturated', 'Unsaturated', 'Isomer', 'Stereoisomer', 'Enantiomer', 'Racemic'
    ];
  }

  private async fetchBiologyWords(): Promise<string[]> {
    return [
      'Cellular', 'Molecular', 'Genetic', 'Evolutionary', 'Ecological', 'Physiological', 'Anatomical', 'Morphological',
      'Organism', 'Species', 'Population', 'Community', 'Ecosystem', 'Biosphere', 'Habitat', 'Niche',
      'Cell', 'Nucleus', 'Cytoplasm', 'Membrane', 'Organelle', 'Mitochondria', 'Chloroplast', 'Ribosome',
      'DNA', 'RNA', 'Protein', 'Gene', 'Chromosome', 'Genome', 'Allele', 'Mutation',
      'Evolution', 'Selection', 'Adaptation', 'Fitness', 'Survival', 'Reproduction', 'Inheritance', 'Heredity',
      'Photosynthesis', 'Respiration', 'Metabolism', 'Digestion', 'Circulation', 'Excretion', 'Homeostasis', 'Growth',
      'Development', 'Differentiation', 'Regeneration', 'Aging', 'Death', 'Lifecycle', 'Metamorphosis', 'Migration',
      'Symbiosis', 'Mutualism', 'Commensalism', 'Parasitism', 'Predation', 'Competition', 'Cooperation', 'Communication',
      'Behavior', 'Instinct', 'Learning', 'Memory', 'Sensation', 'Perception', 'Response', 'Stimulus',
      'Taxonomy', 'Classification', 'Kingdom', 'Phylum', 'Class', 'Order', 'Family', 'Genus'
    ];
  }

  private async fetchAbsurdWords(): Promise<string[]> {
    return [
      'Preposterous', 'Ludicrous', 'Ridiculous', 'Absurd', 'Nonsensical', 'Illogical', 'Irrational', 'Unreasonable',
      'Bizarre', 'Weird', 'Strange', 'Odd', 'Peculiar', 'Quirky', 'Eccentric', 'Unconventional',
      'Whimsical', 'Fanciful', 'Fantastical', 'Imaginary', 'Surreal', 'Dreamlike', 'Otherworldly', 'Unearthly',
      'Paradoxical', 'Contradictory', 'Oxymoronic', 'Ironic', 'Satirical', 'Comedic', 'Humorous', 'Amusing',
      'Silly', 'Foolish', 'Goofy', 'Wacky', 'Zany', 'Madcap', 'Outrageous', 'Outlandish',
      'Extraordinary', 'Incredible', 'Unbelievable', 'Impossible', 'Improbable', 'Unlikely', 'Far-fetched', 'Implausible',
      'Exaggerated', 'Hyperbolic', 'Inflated', 'Overstated', 'Dramatic', 'Theatrical', 'Melodramatic', 'Sensational',
      'Shocking', 'Stunning', 'Astounding', 'Amazing', 'Astonishing', 'Surprising', 'Unexpected', 'Unpredictable',
      'Random', 'Arbitrary', 'Chaotic', 'Disorderly', 'Confused', 'Muddled', 'Jumbled', 'Mixed-up',
      'Topsy-turvy', 'Upside-down', 'Backwards', 'Inside-out', 'Wrong-way', 'Opposite', 'Reverse', 'Inverse'
    ];
  }

  private async fetchHistoricalWords(): Promise<string[]> {
    return [
      'Ancient', 'Medieval', 'Renaissance', 'Baroque', 'Enlightenment', 'Industrial', 'Modern', 'Contemporary',
      'Prehistoric', 'Paleolithic', 'Neolithic', 'Bronze', 'Iron', 'Classical', 'Hellenistic', 'Roman',
      'Byzantine', 'Gothic', 'Romanesque', 'Victorian', 'Edwardian', 'Art Nouveau', 'Art Deco', 'Modernist',
      'Empire', 'Kingdom', 'Republic', 'Dynasty', 'Monarchy', 'Aristocracy', 'Feudal', 'Colonial',
      'Revolutionary', 'Civil', 'World', 'Cold', 'Nuclear', 'Space', 'Information', 'Digital',
      'Pharaoh', 'Emperor', 'King', 'Queen', 'Prince', 'Princess', 'Duke', 'Duchess',
      'Knight', 'Crusader', 'Viking', 'Samurai', 'Shogun', 'Warrior', 'Soldier', 'General',
      'Battle', 'War', 'Siege', 'Conquest', 'Victory', 'Defeat', 'Treaty', 'Alliance',
      'Exploration', 'Discovery', 'Expedition', 'Voyage', 'Journey', 'Adventure', 'Quest', 'Pilgrimage',
      'Invention', 'Innovation', 'Technology', 'Science', 'Medicine', 'Philosophy', 'Religion', 'Culture'
    ];
  }

  private async fetchSensoryWords(): Promise<string[]> {
    return [
      'Visual', 'Auditory', 'Tactile', 'Olfactory', 'Gustatory', 'Kinesthetic', 'Proprioceptive', 'Vestibular',
      'Bright', 'Dim', 'Vivid', 'Dull', 'Sharp', 'Blurry', 'Clear', 'Hazy',
      'Loud', 'Quiet', 'Melodic', 'Harsh', 'Smooth', 'Rough', 'Resonant', 'Muffled',
      'Soft', 'Hard', 'Warm', 'Cool', 'Wet', 'Dry', 'Sticky', 'Slippery',
      'Sweet', 'Sour', 'Bitter', 'Salty', 'Umami', 'Spicy', 'Bland', 'Rich',
      'Fragrant', 'Pungent', 'Musty', 'Fresh', 'Stale', 'Aromatic', 'Acrid', 'Floral',
      'Tingling', 'Burning', 'Freezing', 'Numb', 'Prickly', 'Itchy', 'Tender', 'Sore',
      'Dizzy', 'Balanced', 'Steady', 'Wobbly', 'Spinning', 'Tilting', 'Swaying', 'Rocking',
      'Heavy', 'Light', 'Dense', 'Airy', 'Thick', 'Thin', 'Solid', 'Hollow',
      'Metallic', 'Wooden', 'Plastic', 'Fabric', 'Paper', 'Glass', 'Stone', 'Ceramic'
    ];
  }

  private async generateCompoundWords(): Promise<string[]> {
    // Generate dynamic compound words by combining elements
    const prefixes = ['Ultra', 'Super', 'Mega', 'Hyper', 'Neo', 'Proto', 'Meta', 'Crypto', 'Pseudo', 'Quasi'];
    const suffixes = ['scape', 'sphere', 'core', 'wave', 'flux', 'sync', 'tech', 'lab', 'zone', 'hub'];
    const bases = ['sonic', 'cosmic', 'digital', 'neural', 'quantum', 'plasma', 'crystal', 'cyber', 'bio', 'nano'];
    
    const compounds: string[] = [];
    
    // Generate prefix + base combinations
    for (const prefix of prefixes) {
      for (const base of bases.slice(0, 3)) { // Limit combinations
        compounds.push(prefix + base);
      }
    }
    
    // Generate base + suffix combinations
    for (const base of bases) {
      for (const suffix of suffixes.slice(0, 3)) { // Limit combinations
        compounds.push(base + suffix);
      }
    }
    
    return compounds;
  }
}
