/* ==========================================================================
   data.js — the app's fixed content and small helper functions
   --------------------------------------------------------------------------
   Nothing in this file changes while the app runs. It holds:
     1. Moods, dream feelings and prompt themes
     2. The library of 150 spiritual prompts
     3. Date and money helpers
     4. Payday maths (every other Friday from October 16, 2026)
     5. The sample month you can preview and later clear
   Everything is attached to one global object, `Data`, so other files can
   use it as `Data.MOODS`, `Data.ymd(date)` and so on.
   ========================================================================== */

const Data = (function () {

  /* ---------- 1. Moods, feelings and themes ---------- */

  // Each mood has a key (saved in your data) and a soft pastel color.
  const MOODS = [
    { k: 'joyful',   c: '#F8D3C5' }, // peach blush
    { k: 'calm',     c: '#CFE0EC' }, // powder blue
    { k: 'grateful', c: '#F4D4DE' }, // petal pink
    { k: 'hopeful',  c: '#DCCFEA' }, // soft lilac
    { k: 'anxious',  c: '#CDD3F0' }, // periwinkle mist
    { k: 'sad',      c: '#DCC3D2' }, // dusty rose-mauve
    { k: 'tired',    c: '#E3DFE8' }, // cloud lavender-gray
    { k: 'restless', c: '#F2C6C8' }  // rose coral
  ];
  // A quick lookup: MOOD_COLOR.calm → '#CFE0EC'
  const MOOD_COLOR = {};
  MOODS.forEach(m => { MOOD_COLOR[m.k] = m.c; });

  const FEELINGS = ['peaceful', 'vivid', 'unsettling', 'lucid', 'recurring'];

  const THEMES = [
    { k: 'mysticism', label: 'Mysticism' },
    { k: 'wonder',    label: 'Theology as wonder' },
    { k: 'intuition', label: 'Spirit & intuition' },
    { k: 'intention', label: 'Manifestation & intention' },
    { k: 'prayer',    label: 'Prayer as conversation' },
    { k: 'poetic',    label: 'Poetic reflection' }
  ];

  /* ---------- 2. The prompt library (25 per theme = 150) ---------- */

  const PROMPT_TEXT = {
    mysticism: [
      "If the divine were whispering to you through tonight's silence, what would it be trying to say?",
      "Sit with the silence for one full minute. Then write what was waiting underneath it.",
      "The mystics speak of a dark night of the soul. Is there a darkness you are moving through that might also be a doorway?",
      "The Sufi poets sing of the reed that longs for the reed bed it was cut from. What longing in you is really a kind of song?",
      "Where does your sense of \"I\" end, and where does something larger begin?",
      "Describe a moment when you felt utterly held by something you could not name.",
      "If union with the divine were a place, what would its light and weather be?",
      "Taoist sages speak of a way that cannot be named. What in your life is truest when you stop trying to explain it?",
      "\"As above, so below.\" Where do you see the pattern of the stars repeating in your small, daily life?",
      "Kabbalists imagine divine light scattered as sparks hidden in ordinary things. Where did you find a spark today?",
      "The Neoplatonists believed every soul longs to return to its source. What does home feel like to your soul?",
      "What would you have to let go of to become completely still?",
      "A medieval mystic wrote of a cloud of unknowing between us and the divine. What is it like to love what you cannot fully see?",
      "If your heart repeated a single wordless prayer all day, what would it be?",
      "Describe the quietest place inside you. Who or what lives there?",
      "Julian of Norwich trusted that all manner of thing shall be well. What would you do differently tonight if you believed it too?",
      "What has emptiness taught you that fullness never could?",
      "When have you felt time stop? Write yourself back into that moment.",
      "The Sufis call the beloved by a hundred names. What name would you give the divine tonight?",
      "Imagine your soul as a lantern. What has been dimming it, and what makes it brighter?",
      "Where in your life does the veil feel thinnest right now?",
      "What would it mean to be a mystic on an ordinary Tuesday?",
      "Which of your questions do you hope never to fully answer?",
      "Describe a moment of awe so complete that words fell away.",
      "If you could sit beside any seeker from any century, what would you ask them about the path?"
    ],
    wonder: [
      "What would you ask the soul you were before you were born?",
      "If the divine has a feminine face, what does she look like when she looks at you?",
      "You are made of stardust and spirit. Which part of you feels more awake tonight?",
      "Is time a river, a circle, or something stranger? Where are you standing in it?",
      "What do you believe happens to love when a person is gone?",
      "If suffering could speak, what might it say it came to teach, and what would you say back?",
      "Where do freedom and fate meet in your story so far?",
      "What does the word \"soul\" mean to you, in your own language, without borrowing anyone else's?",
      "Imagine the universe noticing you. What does it notice first?",
      "If creation is still unfolding, what part of it is unfolding through you?",
      "What is the most beautiful idea of the divine you have ever met?",
      "Which image of the sacred did you outgrow, and what grew in its place?",
      "Can something be holy and ordinary at once? Name an example from this week.",
      "If every living thing carries a spark of the sacred, how does that change the way you see a stranger?",
      "What do you imagine the divine feels while watching the sunrise?",
      "Is the sacred something you find, something you make, or something that finds you?",
      "Write about a mystery you have made peace with not solving.",
      "If your soul is older than your body, what has it been learning across time?",
      "What would a theology of tenderness look like?",
      "Where does wonder live in your body?",
      "If heaven were a feeling rather than a place, when have you already felt it?",
      "Which questions about the divine did you ask as a child that still feel true?",
      "How might the stars feel about being made of the same matter as you?",
      "What does it mean to you that you exist at all, rather than not?",
      "Imagine the sacred feminine as a season. Which one is she, and why?"
    ],
    intuition: [
      "What did your body try to tell you today before your mind caught up?",
      "Describe a recent coincidence that felt like it was winking at you.",
      "What is your intuition quietly asking you to notice right now?",
      "Is tonight's moon waxing, waning, or hidden? Which phase does your inner life feel like?",
      "When you place a hand on your heart, what is the first word that rises?",
      "What sign have you been asking for, and what if it already arrived in a shape you didn't expect?",
      "Which places or people leave your energy brighter? Which leave it dimmer?",
      "Recall a time you knew something without knowing how you knew. What did it feel like?",
      "Where in your body do you hold worry? Write a few gentle words to that place.",
      "If your inner voice had a color tonight, what would it be?",
      "Which dream, song, or phrase keeps returning to you lately?",
      "What does yes feel like in your body? What does no feel like?",
      "The new moon is a time for planting. What small intention wants to be planted in you?",
      "The full moon illuminates. What has become clearer to you this month?",
      "What are you sensing about the season ahead?",
      "Describe a moment today when you felt in tune with everything around you.",
      "What would you do tomorrow if you trusted your first instinct completely?",
      "Which number, animal, or image has been crossing your path?",
      "What is your breath trying to slow you down for?",
      "Describe the energy you want to carry into tomorrow, as if it were a light around you.",
      "What have you been overriding in yourself that deserves to be heard?",
      "If your intuition left a note on your pillow, what would it say?",
      "When did you last feel rested in both body and spirit? What made it possible?",
      "What does the waning moon invite you to quietly let go of?",
      "Which of your senses is most awake tonight, and what is it noticing?"
    ],
    intention: [
      "Describe a part of yourself that is still a seed underground. What is it waiting for?",
      "Write a letter to the moon about what you are ready to release.",
      "What are you calling into your life this season? Describe it as if it has already arrived.",
      "Write as the version of you who already has what you hope for. How does she spend a quiet evening?",
      "Which belief about yourself are you ready to set down?",
      "Describe one ordinary morning in the life you are growing toward.",
      "What is one small act this week that would be a vote for who you are becoming?",
      "If you could plant one word in your future, which would you choose?",
      "What are you making room for by letting something else go?",
      "Imagine your future self thanking you. What is she grateful you began?",
      "What does abundance look like when it is quiet and gentle?",
      "Name one door you want to open and one you are ready to close.",
      "If your intention were a flower, how would it grow, and what would it need?",
      "What would you attempt if you trusted the timing of your life?",
      "Write three sentences that begin with \"I am becoming…\"",
      "Which dream have you been holding too tightly to let it breathe?",
      "What does \"enough\" look like for you right now?",
      "Describe the home, inside and out, where your future self lives.",
      "What are you releasing so it can return to you in a kinder form?",
      "Which old story about money, love, or worth is ready to be rewritten?",
      "What would it feel like to receive without apologizing?",
      "Write an intention small enough to keep tomorrow and sweet enough to want to.",
      "What is quietly ripening in your life that you haven't celebrated yet?",
      "If you were a field in early spring, what would you want sown in you?",
      "Describe yourself one year from tonight. What is she proud of?"
    ],
    prayer: [
      "Speak to the divine tonight the way you would to an old friend across the kitchen table.",
      "What do you want to say tonight, without trying to make it sound holy?",
      "Write a prayer made only of things you noticed today.",
      "Tell the universe what you are afraid of, then tell it what you hope for.",
      "Who are you carrying in your heart tonight? Write their names and one wish for each.",
      "Write a thank-you for something so small it is almost invisible.",
      "If you could ask the divine one honest question, what would it be?",
      "Write a prayer for the version of you who struggled today.",
      "Speak to the earth tonight. What do you want to say to her?",
      "What are you ready to forgive, in yourself or someone else?",
      "Write a conversation with the divine in which you speak first, and then listen.",
      "Offer a few kind words for someone you find hard to love.",
      "What are you asking for tonight? Let yourself ask plainly.",
      "Write a blessing for tomorrow before it arrives.",
      "What do you want to hand over tonight so you can sleep more lightly?",
      "Write a prayer in the shape of a list: what you saw, what you felt, what you hope.",
      "Speak to the light that was here before you were. What do you want it to know?",
      "Write a few lines of praise for your body and everything it carried today.",
      "If your prayer were a whisper into the wind, where would you want the wind to carry it?",
      "Tell the divine about a joy you haven't told anyone yet.",
      "Send a quiet wish toward a stranger you passed today.",
      "What does it feel like to be heard without needing to explain?",
      "Write a prayer for the parts of the world you cannot fix.",
      "End this day with three words for whatever holds you.",
      "What would you say if you knew you were being answered with love?"
    ],
    poetic: [
      "If today were a weather, what was it, and what grew beneath it?",
      "Write about one small thing you saw today as if you could press it between these pages.",
      "What part of you is in bloom right now, and what part is resting underground?",
      "Describe a memory that smells like something. Let the scent lead.",
      "What color was your longing today?",
      "Write a few lines to a window you used to look out of often.",
      "If your heart were a landscape, what would grow on its hills tonight?",
      "What does beauty ask of you?",
      "Describe your younger self standing in a field. What is she holding?",
      "Write about a sound you would miss if the world went quiet.",
      "What do you still carry from a place you can never return to?",
      "If tonight had a texture, what would it feel like under your fingertips?",
      "Write a love letter to an ordinary object in your room.",
      "What is the softest thing you did today?",
      "Describe the light at the moment you felt most like yourself today.",
      "What are you nostalgic for that hasn't happened yet?",
      "Write about the wind as if it knew your name.",
      "Which memory returns to you like a song you can't stop humming?",
      "If you were a flower in the meadow, which one would you be, and why?",
      "What would you whisper to the girl you were at seven?",
      "Describe an evening you would live again, slowly.",
      "What is the shape of the space someone left in you?",
      "Write about dawn from the point of view of the grass.",
      "What line of a poem would you write across the sky tonight?",
      "Describe yourself the way the moon might see you."
    ]
  };

  // Turn the lists above into one flat list of { id, theme, text }.
  // Ids look like "mysticism-1" so favorites stay stable forever.
  const PROMPTS = [];
  THEMES.forEach(t => {
    PROMPT_TEXT[t.k].forEach((text, i) => {
      PROMPTS.push({ id: t.k + '-' + (i + 1), theme: t.k, text: text });
    });
  });

  // The daily rotation takes one prompt from each theme in turn,
  // so consecutive days never repeat the same theme.
  const ROTATION = [];
  for (let i = 0; i < 25; i++) {
    THEMES.forEach(t => ROTATION.push(t.k + '-' + (i + 1)));
  }

  function themeLabel(k) {
    const t = THEMES.find(t => t.k === k);
    return t ? t.label : k;
  }

  /* ---------- 3. Date and money helpers ---------- */
  // Dates are stored as plain text "YYYY-MM-DD". This keeps them easy to read,
  // easy to sort, and ready for a SQL DATE column later.

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const pad = n => String(n).padStart(2, '0');

  // Date object → "2026-10-11"
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // "2026-10-11" → Date object (local time, midnight)
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

  // "2026-10-11" → "Sun, Oct 11"
  const short = s => { const d = parse(s); return `${DAYS[d.getDay()].slice(0, 3)}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`; };

  // "2026-10-11" → "Sunday, October 11, 2026"
  const long = s => { const d = parse(s); return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };

  // "2026-10-11" → "October 11, '26" (the italic serif date style)
  const scriptDate = s => { const d = parse(s); return `${MONTHS[d.getMonth()]} ${d.getDate()}, '${String(d.getFullYear()).slice(2)}`; };

  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / 864e5);

  // A short random id for new rows, e.g. "lzx3k9ab12"
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  // 1234.5 → "$1,234.50"
  const money = n => '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', {
    minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2
  });

  /* ---------- 4. Paydays: every other Friday from Oct 16, 2026 ---------- */

  const PAYDAY0 = '2026-10-16';

  function isPayday(s) {
    const d = diffDays(s, PAYDAY0);
    return d >= 0 && d % 14 === 0;
  }
  // The next payday on or after date s
  function nextPayday(s) {
    const d = diffDays(s, PAYDAY0);
    if (d < 0) return PAYDAY0;
    const r = d % 14;
    return r === 0 ? s : addDays(s, 14 - r);
  }
  // All payday dates inside a month (m is 0-11)
  function paydaysIn(y, m) {
    const out = [];
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const s = `${y}-${pad(m + 1)}-${pad(i)}`;
      if (isPayday(s)) out.push(s);
    }
    return out;
  }

  /* ---------- Soft "hill" chart path ----------
     Given a list of numbers, returns SVG path strings that join the points
     with smooth curves (so charts look like rolling hills, never sharp). */
  function hillPath(vals, W, H, padTop, maxOverride) {
    const n = vals.length;
    const max = maxOverride || Math.max(1, ...vals);
    const pts = vals.map((v, i) => [
      n === 1 ? W / 2 : i * (W / (n - 1)),
      H - 6 - (v / max) * (H - 6 - (padTop || 10))
    ]);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < n; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const dx = (x1 - x0) / 2;
      d += ` C${x0 + dx},${y0} ${x1 - dx},${y1} ${x1},${y1}`;
    }
    const area = `M0,${H} L${pts[0][0]},${pts[0][1]}` + d.slice(d.indexOf(' ')) + ` L${W},${H} Z`;
    return { line: d, area: area };
  }

  /* ---------- 5. Sample month ----------
     Every sample row carries `sample: true`, which is how
     "Clear sample data" finds and removes only these rows. */

  const SAMPLE_ENTRIES = [
    // Early summer: the garden's first seeds
    ['2026-06-14', '21:30', 'hopeful', 'A year from now', 'I wonder who I will be by next summer. I hope she is softer with herself, and still keeping some kind of journal.', ['beginnings']],
    ['2026-06-18', '22:00', 'calm', 'Long light', 'It stayed light until almost ten. Sat on the step with tea and watched the sky turn peach.', ['evening']],
    ['2026-06-23', '21:45', 'restless', '', 'Signed up for the SQL course. Excited and a little scared I won\'t keep up.', ['SQL', 'beginnings']],
    ['2026-06-28', '21:10', 'grateful', 'Sunday call', 'Long call with Mom. She told the story about the plum tree again and I let her.', ['family']],
    ['2026-07-03', '22:20', 'hopeful', 'The cloud of unknowing', 'Started reading about the medieval mystics. Loving what you cannot fully see. I think I understand that more than I can say.', ['mysticism', 'reading']],
    ['2026-07-07', '21:00', 'tired', '', 'First week of the course. My brain feels like a full sponge.', ['SQL']],
    ['2026-07-11', '22:40', 'calm', 'Full moon', 'Full moon over the parking lot of all places. Still beautiful. Made a small wish.', ['moon', 'mysticism']],
    ['2026-07-16', '21:20', 'joyful', '', 'Wrote my first JOIN that worked on the first try. Told the cat.', ['SQL']],
    ['2026-07-19', '21:50', 'grateful', 'Lena\'s garden', 'Lena gave me a cutting from her jasmine. It smells like her porch.', ['friends']],
    ['2026-07-24', '22:10', 'anxious', '', 'Work is loud lately. Lit a candle and sat with the quiet for ten minutes before bed.', ['work', 'prayer']],
    ['2026-07-29', '21:35', 'hopeful', 'Seeds in the dark', 'Read that some seeds wait years for the right rain. I am trying to be patient like that.', ['reading', 'beginnings']],
    ['2026-08-02', '21:05', 'calm', 'Evening walk', 'Walked the long field path. The foxtail grass is turning pink.', ['walk']],
    ['2026-08-06', '22:30', 'sad', '', 'Grandma\'s birthday. I made lemon cake and cried a little into the batter.', ['family']],
    ['2026-08-09', '21:40', 'hopeful', 'New moon', 'New moon. Wrote down three things I want to plant this autumn.', ['moon', 'mysticism']],
    ['2026-08-13', '21:15', 'joyful', '', 'Started Python on the side. Loops make sense in a way that feels like music.', ['Python']],
    ['2026-08-17', '22:00', 'grateful', 'Small prayer', 'Said thank you out loud tonight for no particular reason. It felt like opening a window.', ['prayer']],
    ['2026-08-21', '21:25', 'calm', '', 'Moved a little into savings. Skipped takeout twice this week to do it.', ['savings']],
    ['2026-08-25', '21:55', 'restless', '', 'Couldn\'t sit still. Walked until the streetlights came on.', ['walk']],
    ['2026-08-29', '22:15', 'hopeful', 'The veil', 'Late summer evenings feel thin, like something just behind the air is listening.', ['mysticism']],
    ['2026-09-02', '21:30', 'tired', '', 'Back-to-routine week. Python after work, then straight to bed.', ['Python', 'work']],
    ['2026-09-05', '21:45', 'grateful', '', 'Pottery class with Lena. We laughed the whole time.', ['friends']],
    // Autumn
    ['2026-09-08', '21:40', 'hopeful', 'First page', 'Starting this little book again. I want somewhere quiet to set the day down before sleep.', ['beginnings']],
    ['2026-09-09', '22:05', 'tired', '', 'Three hours on joins and my eyes are done. Grateful for the tea Mom left on the counter.', ['SQL', 'family']],
    ['2026-09-11', '21:15', 'calm', 'Evening walk', 'Walked the long way home past the field behind the library. The grass has gone pink at the tips.', ['walk']],
    ['2026-09-12', '20:50', 'grateful', '', 'Pottery class ran late but nobody wanted to leave. My bowl came out lopsided and I love it.', ['friends']],
    ['2026-09-14', '22:30', 'anxious', '', "Couldn't settle tonight. Too many tabs open in my head. Wrote a list and it helped a little.", ['work']],
    ['2026-09-15', '21:00', 'calm', 'GROUP BY', 'Slept well, studied well. Finally understood GROUP BY. It felt like a door opening.', ['SQL']],
    ['2026-09-17', '22:10', 'sad', '', 'Missed Grandma today. Made her lemon cake from the recipe card in her handwriting.', ['family']],
    ['2026-09-18', '20:40', 'joyful', 'A little for later', 'Moved some into savings before the new payday schedule even starts. Small, but mine.', ['savings']],
    ['2026-09-20', '21:30', 'restless', '', 'Wanted to be anywhere but my desk. Rearranged the plants instead of studying. Tomorrow.', []],
    ['2026-09-21', '21:55', 'hopeful', 'Seeds', 'Read about seeds that wait years in the dark for the right rain. Copied a line onto a card by the mirror.', ['reading']],
    ['2026-09-23', '22:20', 'tired', '', "Work, dishes, bed. That's the whole entry and that's fine.", []],
    ['2026-09-25', '21:10', 'grateful', '', 'Lena called out of nowhere and we talked for an hour. I forget how much I need that.', ['friends']],
    ['2026-09-27', '20:45', 'calm', 'Rain', 'Rain all afternoon. Python loops by the window with the radio low.', ['Python']],
    ['2026-09-29', '21:35', 'joyful', '', 'Passed my practice quiz. Danced in the kitchen a little. No one saw.', ['SQL']],
    ['2026-10-01', '21:50', 'hopeful', 'October', 'New month. I want to be gentler with myself in this one.', ['beginnings']],
    ['2026-10-02', '22:15', 'anxious', '', 'Big meeting tomorrow. Lit a candle, said what I was afraid of out loud, and closed the laptop.', ['work', 'prayer']],
    ['2026-10-03', '21:05', 'calm', '', "The meeting went fine. Better than fine. I worried for nothing again, and that's okay.", ['work']],
    ['2026-10-05', '21:25', 'grateful', 'Sunday dinner', "Dinner at the Okafors'. Too much rice, too much laughing, home too late.", ['friends']],
    ['2026-10-06', '22:00', 'tired', '', 'Short sleep, slow day. In bed by nine.', []],
    ['2026-10-08', '21:40', 'calm', 'Fog', 'Fog on the hills this morning, so thick the trees looked painted on. Studied an hour, walked an hour.', ['walk', 'SQL']]
  ];
  const SAMPLE_QUICK = [['2026-09-10', 'calm'], ['2026-09-24', 'tired'], ['2026-09-30', 'grateful'], ['2026-10-04', 'joyful']];
  const SAMPLE_REST = ['2026-09-19', '2026-10-07'];
  const SAMPLE_DREAMS = [
    ['2026-09-09', 'The glass greenhouse', 'Rain on a glass roof, and Grandma watering ferns that grew while I watched. She said I could stay as long as I liked.', ['peaceful', 'vivid'], ['greenhouse', 'rain', 'Grandma']],
    ['2026-09-10', 'Snow in August', 'Snow falling on the garden in full summer. The roses were warm under it.', ['vivid'], ['snow', 'garden']],
    ['2026-09-13', 'Late for the train', "Running through a station that kept getting longer. I couldn't find my ticket in any pocket.", ['unsettling', 'recurring'], ['train', 'station', 'lost ticket']],
    ['2026-09-16', 'Swimming in the sky', 'I realized I was dreaming and pushed off the ground. The air was thick like warm water and the moon was very close.', ['lucid', 'vivid'], ['flying', 'water', 'moon']],
    ['2026-09-20', "Grandma's kitchen", "Lemons on every surface. The radio was playing a song I didn't know but could sing.", ['peaceful', 'recurring'], ['Grandma', 'lemons', 'kitchen']],
    ['2026-09-24', 'The hallway of doors', 'A long pale hallway, every door painted a different pink. One was locked and I had the key the whole time.', ['unsettling'], ['doors', 'hallway', 'keys']],
    ['2026-09-28', 'Pink field at dusk', 'Horses walking slowly through a field of pink grass. Nobody was in a hurry.', ['peaceful', 'vivid'], ['field', 'horses', 'moon']],
    ['2026-10-01', 'Lost ticket again', "The station again. This time the ticket was in my shoe, but the train had already gone. I wasn't upset.", ['recurring'], ['train', 'lost ticket']],
    ['2026-10-04', 'Lena on a boat', 'Lena rowing a small boat across a lake made of glass. She waved me over.', ['vivid'], ['Lena', 'boat', 'water']],
    ['2026-10-07', 'Learning to fly', 'Practising flight over the meadow. Each time I remembered I was dreaming I went higher.', ['lucid'], ['flying', 'field']],
    ['2026-10-09', 'Moon over the greenhouse', "Grandma's greenhouse again, but at night, with the moon sitting on its roof like a lamp.", ['peaceful', 'recurring'], ['greenhouse', 'moon', 'Grandma']]
  ];
  const SAMPLE_STUDY = [['2026-09-10', 'SQL', 60], ['2026-09-11', 'SQL', 45], ['2026-09-13', 'Python', 50], ['2026-09-14', 'SQL', 90], ['2026-09-15', 'SQL', 60], ['2026-09-17', 'Python', 45], ['2026-09-18', 'SQL', 75], ['2026-09-21', 'SQL', 60], ['2026-09-22', 'Python', 60], ['2026-09-24', 'SQL', 45], ['2026-09-26', 'Python', 90], ['2026-09-27', 'Python', 60], ['2026-09-28', 'SQL', 60], ['2026-09-29', 'SQL', 90], ['2026-10-01', 'SQL', 45], ['2026-10-02', 'Python', 50], ['2026-10-03', 'SQL', 60], ['2026-10-05', 'Python', 75], ['2026-10-06', 'SQL', 45], ['2026-10-07', 'SQL', 60], ['2026-10-08', 'SQL', 90], ['2026-10-09', 'Python', 60]];
  const SAMPLE_DEPOSITS = [['2026-07-24', 120, ''], ['2026-08-07', 140, ''], ['2026-08-21', 150, 'skipped takeout twice'], ['2026-09-04', 180, ''], ['2026-09-18', 200, 'some birthday money too'], ['2026-10-02', 175, '']];

  // Builds every sample table as arrays of row objects.
  function sampleRows() {
    const journal = [], moods = [];
    SAMPLE_ENTRIES.forEach(([date, time, mood, title, body, tags], i) => {
      const id = 's-e' + i;
      journal.push({ id, date, time, title, body, mood, tags, prompt: '', created_at: `${date}T${time}:00`, sample: true });
      moods.push({ id: 's-m' + i, date, mood, entry_id: id, source: 'entry', sample: true });
    });
    SAMPLE_QUICK.forEach(([date, mood], i) => {
      moods.push({ id: 's-q' + i, date, mood, entry_id: null, source: 'quick', sample: true });
    });
    return {
      journal_entries: journal,
      moods: moods,
      rest_days: SAMPLE_REST.map((date, i) => ({ id: 's-r' + i, date, note: '', sample: true })),
      dreams: SAMPLE_DREAMS.map(([date, title, description, feelings, symbols], i) => ({
        id: 's-d' + i, date, title, description, feelings, symbols, created_at: `${date}T07:40:00`, sample: true
      })),
      study_sessions: SAMPLE_STUDY.map(([date, subject, minutes], i) => ({
        id: 's-s' + i, date, start_time: '14:00', minutes, subject, sample: true
      })),
      savings_deposits: SAMPLE_DEPOSITS.map(([date, amount, note], i) => ({
        id: 's-$' + i, date, amount, note, sample: true
      })),
      favorite_prompts: [
        { id: 's-f0', prompt_id: 'mysticism-21', saved_at: '2026-09-30', sample: true },
        { id: 's-f1', prompt_id: 'intention-1', saved_at: '2026-10-02', sample: true },
        { id: 's-f2', prompt_id: 'poetic-1', saved_at: '2026-10-05', sample: true }
      ]
    };
  }

  // Everything the app shares with the other files:
  return {
    MOODS, MOOD_COLOR, FEELINGS, THEMES, PROMPTS, ROTATION, themeLabel,
    MONTHS, DAYS, pad, ymd, parse, short, long, scriptDate, addDays, diffDays, uid, money,
    PAYDAY0, isPayday, nextPayday, paydaysIn, hillPath, sampleRows
  };
})();
