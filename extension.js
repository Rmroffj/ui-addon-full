const phFailed = new Set();
function guard(name, fn) {
  return function guarded(...args) {
    try {
      return fn.apply(this, args);
    } catch (error) {
      if (!phFailed.has(name)) {
        phFailed.add(name);
        document.documentElement.dataset.phFailed = [...phFailed].join(" ");
        marinara.log.warn(`feature "${name}" stopped`, error);
      }
    }
  };
}
onSeen = guard("chat", onSeen);
syncAll = guard("chat", syncAll);
syncRow = guard("chat", syncRow);
onHomeSeen = guard("home", onHomeSeen);
mountHome = guard("home", mountHome);
decorateTopbar = guard("home", decorateTopbar);
onHomeTab = guard("home", onHomeTab);
syncFold = guard("home", syncFold);
watchShell = guard("home", watchShell);
requestHomeFonts = guard("home", requestHomeFonts);
classifyLibrary = guard("library", classifyLibrary);
decorateCharacterCard = guard("library", decorateCharacterCard);
decorateCharacterFolder = guard("library", decorateCharacterFolder);
decoratePersona = guard("library", decoratePersona);
onLibraryKey = guard("library", onLibraryKey);
onLibraryClick = guard("library", onLibraryClick);
onCoverClick = guard("library", onCoverClick);
onLibrarySeen = guard("library", onLibrarySeen);
markPlainList = guard("library", markPlainList);
markItem = guard("library", markItem);
markFolder = guard("library", markFolder);
syncEditor = guard("editor", syncEditor);
onEditorTab = guard("editor", onEditorTab);
onEditorSeen = guard("editor", onEditorSeen);
tagLoreRow = guard("lorebook", tagLoreRow);
onLoreFlagChange = guard("lorebook", onLoreFlagChange);
tagChrome = guard("chrome", tagChrome);
dressMounted = guard("pages", dressMounted);
syncConvo = guard("conversation", syncConvo);
onConvoSeen = guard("conversation", onConvoSeen);
syncCaught = guard("widgets", syncCaught);
onCatchEvent = guard("widgets", onCatchEvent);
marinara.onCleanup(() => delete document.documentElement.dataset.phFailed);
const scrapbookBootTimer = marinara.setTimeout(() => document.documentElement.dataset.scrapbookReady = "", 10000);
marinara.onCleanup(() => { marinara.clearTimeout(scrapbookBootTimer); delete document.documentElement.dataset.scrapbookReady; });
const FONT_CDN = "https://cdn.jsdelivr.net/";
const LATIN_RANGE = "U+0020-007E";
const extensionFonts = [];
const fontLoads = [];
let fontsDisposed = false;
loadFont("Pretendard Variable", "npm/pretendard@1.3.9/dist/web/variable/woff2/PretendardVariable.woff2", { weight: "45 920" });

function loadFont(family, path, descriptors) {
  const loading = marinara
    .fetch(`${FONT_CDN}${path}`)
    .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(String(response.status)))))
    .then((bytes) => {
      if (fontsDisposed) return;
      const face = new FontFace(family, bytes, { display: "swap", ...descriptors });
      extensionFonts.push(face);
      document.fonts.add(face);
      return face.load();
    })
    .catch((error) => marinara.log.warn(`${family} ${descriptors.weight ?? ""} could not be loaded`, error));
  fontLoads.push(loading);
}

loadFont("RPC Pretendard", "npm/pretendard@1.3.9/dist/web/variable/woff2-dynamic-subset/PretendardVariable.subset.91.woff2", {
  weight: "45 920",
  unicodeRange:
    "U+20-22, U+27-2a, U+2c-39, U+3a-3b, U+3f, U+41-4e, U+4f-5d, U+61-7b, U+7d, U+a0-a1, U+ab, U+ad-ae, U+b7, U+bb, U+bf, U+2013-2014, U+201c-201d, U+2122, U+ac00, U+ace0, U+ae30, U+b2e4, U+b85c, U+b9ac, U+c0ac, U+c2a4, U+c2dc, U+c774, U+c778, U+c9c0, U+d558",
});
loadFont("Archivo Black", "npm/@fontsource/archivo-black@5.2.8/files/archivo-black-latin-400-normal.woff2", {
  weight: "400 900",
  unicodeRange: LATIN_RANGE,
});
loadFont("Space Mono", "npm/@fontsource/space-mono@5.2.9/files/space-mono-latin-400-normal.woff2", {
  weight: "400",
  unicodeRange: LATIN_RANGE,
});
loadFont("Space Mono", "npm/@fontsource/space-mono@5.2.9/files/space-mono-latin-700-normal.woff2", {
  weight: "700",
  unicodeRange: LATIN_RANGE,
});

marinara.onCleanup(() => {
  fontsDisposed = true;
  for (const face of extensionFonts) document.fonts.delete(face);
  extensionFonts.length = 0;
});

const ROOT_SELECTOR = '.rpg-chat-area[data-chat-mode="roleplay"][data-roleplay-presentation="classic"]';
const SVG_NS = "http://www.w3.org/2000/svg";
const PLATE_MIN_WIDTH = "(min-width: 1024px)";

const range = (count) => Array.from({ length: count }, (_, index) => index);

function polar(cx, cy, radius, degrees) {
  const angle = (degrees * Math.PI) / 180;
  return [Number((cx + radius * Math.cos(angle)).toFixed(2)), Number((cy + radius * Math.sin(angle)).toFixed(2))];
}

function spark(x, y, radius, waist = radius * 0.09) {
  return `<path class="f" d="M${x} ${y - radius}Q${x + waist} ${y - waist} ${x + radius} ${y}Q${x + waist} ${y + waist} ${x} ${y + radius}Q${x - waist} ${y + waist} ${x - radius} ${y}Q${x - waist} ${y - waist} ${x} ${y - radius}Z"/>`;
}

function star(x, y, radius) {
  const points = range(10).map((i) => polar(x, y, i % 2 ? radius * 0.42 : radius, -90 + i * 36).join(" "));
  return `<path class="f" d="M${points.join("L")}Z"/>`;
}

function dottedArc(cx, cy, radius, from, to, count) {
  return range(count)
    .map((i) => {
      const [x, y] = polar(cx, cy, radius, from + ((to - from) * i) / (count - 1));
      return `<circle class="f" cx="${x}" cy="${y}" r="1"/>`;
    })
    .join("");
}

function raysAround(cx, cy, inner, outer, count, long) {
  return range(count)
    .map((i) => {
      const from = polar(cx, cy, i % 2 ? inner + long : inner, (i * 360) / count);
      const to = polar(cx, cy, outer, (i * 360) / count);
      return `<path class="t" d="M${from.join(" ")}L${to.join(" ")}"/>`;
    })
    .join("");
}

function buildCompass() {
  const facets = range(8)
    .map((i) => {
      const degrees = i * 45 - 90;
      const tip = polar(100, 100, i % 2 === 0 ? 96 : 58, degrees).join(" ");
      const left = polar(100, 100, 13, degrees - 45).join(" ");
      const right = polar(100, 100, 13, degrees + 45).join(" ");
      return `<path class="a" d="M100 100L${tip}L${right}Z"/><path class="p" d="M100 100L${tip}L${left}Z"/>`;
    })
    .join("");
  const ticks = range(72)
    .map((i) => {
      const from = polar(100, 100, 76, i * 5).join(" ");
      const to = polar(100, 100, i % 6 === 0 ? 68 : 72, i * 5).join(" ");
      return `<path class="t" d="M${from}L${to}"/>`;
    })
    .join("");
  return `<circle cx="100" cy="100" r="78"/><circle class="t" cx="100" cy="100" r="62"/>${ticks}${facets}<circle class="p" cx="100" cy="100" r="5"/>`;
}

function buildConstellation() {
  const points = [
    [18, 150],
    [52, 118],
    [84, 126],
    [108, 92],
    [150, 112],
    [168, 62],
    [120, 38],
  ];
  return `<path class="t" d="M${points.map((point) => point.join(" ")).join("L")}"/><path class="t" d="M108 92 120 38"/>
    ${points.map(([x, y], i) => star(x, y, i % 3 === 0 ? 11 : 8)).join("")}${spark(176, 158, 16)}${dottedArc(100, 100, 96, 100, 170, 14)}`;
}

const EMBLEMS = {
  orbit: `<ellipse cx="100" cy="100" rx="92" ry="30" transform="rotate(-28 100 100)"/>
    <ellipse cx="100" cy="100" rx="92" ry="44" transform="rotate(62 100 100)" stroke-dasharray="26 5 2 5"/>
    <ellipse class="t" cx="100" cy="100" rx="70" ry="22" transform="rotate(-28 100 100)"/><circle cx="100" cy="100" r="26"/>
    ${range(6)
      .map((i) => `<path class="t" d="M${78 + i * 2} ${88 + i * 5}c10 -5 20 5 ${40 - i * 3} 0"/>`)
      .join("")}
    <circle class="p" cx="20" cy="143" r="6"/><circle class="p" cx="180" cy="57" r="9"/><circle class="f" cx="60" cy="24" r="4"/>
    ${spark(150, 150, 22)}${spark(40, 60, 12)}`,
  compass: buildCompass(),
  dagger: `${raysAround(100, 88, 50, 72, 28, 8)}<path class="p" d="M100 4 112 124H88Z"/><path class="a" d="M100 4 112 124H100Z"/>
    <path class="p" d="M70 118c10 12 50 12 60 0 4 6 2 14-4 16-14 5-38 5-52 0-6-2-8-10-4-16Z"/>
    <path class="p" d="M93 136h14v36H93Z"/><path class="t" d="M93 146h14M93 154h14M93 162h14"/>
    <circle class="p" cx="100" cy="182" r="9"/><circle class="a" cx="100" cy="182" r="3"/>${spark(36, 40, 12)}${spark(168, 150, 16)}`,
  constellation: buildConstellation(),
  moon: `<path d="M138 26a80 80 0 1 0 38 104A66 66 0 0 1 138 26Z"/><path class="t" d="M126 34a70 70 0 1 0 40 92"/>
    ${dottedArc(100, 100, 92, 200, 340, 22)}${spark(138, 92, 22)}${star(160, 58, 6)}${star(116, 128, 4)}
    ${range(5)
      .map((i) => `<circle class="${i === 2 ? "f" : ""}" cx="${60 + i * 20}" cy="188" r="6"/>`)
      .join("")}`,
  loop: `<path d="M100 100c-22-40-84-40-84 0s62 40 84 0 84-40 84 0-62 40-84 0Z"/>
    <path class="t" stroke-dasharray="1 5" stroke-linecap="round" d="M100 100c-16-28-68-30-68 0s52 28 68 0 68-30 68 0-52 28-68 0Z"/>
    <path class="t" d="M100 10v180M6 100h188"/>${spark(100, 100, 22)}
    <circle class="p" cx="52" cy="100" r="9"/><circle class="a" cx="148" cy="100" r="9"/>
    <path class="t" d="M6 24V12h12M194 24V12h-12M6 176v12h12M194 176v12h-12"/>`,
  flora: `<path d="M60 196C72 150 86 104 134 58"/>
    ${range(6)
      .map((i) => {
        const x = 66 + i * 11;
        const y = 176 - i * 21;
        return `<path class="p" d="M${x} ${y}c-30-6-46-22-50-40 26 0 46 16 50 40Z"/><path class="t" d="M${x} ${y}c-14-10-28-22-40-36"/><path class="p" d="M${x + 2} ${y - 4}c20-16 40-20 58-16-8 18-32 28-58 16Z"/>`;
      })
      .join("")}
    <path class="p" d="M134 58c-8-22 0-44 24-54 10 22 2 44-24 54Z"/><path class="t" d="M134 58 156 10"/>${spark(40, 40, 14)}`,
  eye: `${raysAround(100, 100, 74, 96, 36, 8)}<path class="p" d="M8 100c40-58 144-58 184 0-40 58-144 58-184 0Z"/>
    <circle cx="100" cy="100" r="34"/><circle class="t" cx="100" cy="100" r="24"/><circle class="a" cx="100" cy="100" r="11"/>${spark(100, 100, 30, 2)}`,
  crown: `<path class="p" d="M26 150 12 66l46 40 42-74 42 74 46-40-14 84Z"/><path class="p" d="M26 150h148v20H26Z"/>
    <path class="t" d="M34 134h132"/><circle class="a" cx="100" cy="160" r="5"/><circle class="p" cx="66" cy="160" r="4"/><circle class="p" cx="134" cy="160" r="4"/>
    <circle class="f" cx="12" cy="62" r="4"/><circle class="f" cx="100" cy="26" r="5"/><circle class="f" cx="188" cy="62" r="4"/>${spark(100, 104, 20)}${dottedArc(100, 110, 96, 215, 325, 16)}`,
  target: `<circle cx="100" cy="100" r="84"/><circle class="t" cx="100" cy="100" r="58" stroke-dasharray="4 4"/><circle cx="100" cy="100" r="30"/>
    <circle class="a" cx="100" cy="100" r="6"/><path class="t" d="M100 2v62M100 136v62M2 100h62M136 100h62"/>
    ${raysAround(100, 100, 84, 92, 36, 0)}<path class="t" d="M8 28V8h20M192 28V8h-20M8 172v20h20M192 172v20h-20"/>`,
  globe: `<circle cx="100" cy="100" r="84"/><ellipse class="t" cx="100" cy="100" rx="56" ry="84"/><ellipse class="t" cx="100" cy="100" rx="28" ry="84"/>
    <path class="t" d="M100 16v168M16 100h168"/><ellipse class="t" cx="100" cy="100" rx="84" ry="56"/><ellipse class="t" cx="100" cy="100" rx="84" ry="28"/>
    <ellipse cx="100" cy="100" rx="98" ry="22" transform="rotate(-24 100 100)" stroke-dasharray="30 6 2 6"/>
    <circle class="a" cx="186" cy="62" r="6"/>${spark(30, 30, 14)}`,
  heart: `<path d="M100 178C42 134 12 100 18 62c6-38 58-44 82-6 24-38 76-32 82 6 6 38-24 72-82 116Z"/>
    <path class="t" stroke-dasharray="4 4" d="M100 158C54 122 30 94 34 64c4-26 44-30 66 6 22-36 62-32 66-6 4 30-20 58-66 94Z"/>
    ${spark(100, 96, 24)}${star(160, 24, 6)}${dottedArc(100, 100, 98, 110, 190, 12)}`,
  sunburst: `${raysAround(100, 100, 42, 96, 32, 20)}<circle cx="100" cy="100" r="30"/><circle class="t" cx="100" cy="100" r="38" stroke-dasharray="3 4"/>${spark(100, 100, 24, 2)}`,
};

const STRONG = 3;
const MEDIUM = 2;
const WEAK = 1;
const MENACING_TAGS = ["빌런", "하라구로", "마피아", "느와르", "얀데레", "피폐", "복수", "공포", "악마"];

const weigh = (strong, medium = [], weak = []) => ({
  ...Object.fromEntries(weak.map((tag) => [tag, WEAK])),
  ...Object.fromEntries(medium.map((tag) => [tag, MEDIUM])),
  ...Object.fromEntries(strong.map((tag) => [tag, STRONG])),
});

const THEMES = [
  {
    id: "dark",
    emblems: ["loop", "eye", "dagger"],
    symbols: "† † †",
    tags: weigh(
      ["얀데레", "피폐", "멘헤라", "공포", "고스", "귀신", "뱀파이어", "악마", "괴물", "음침", "속박"],
      ["애증", "소유욕", "혐관"],
      ["후회"],
    ),
  },
  {
    id: "noir",
    emblems: ["compass", "dagger", "eye"],
    symbols: "♠︎ ♣︎ ♠︎ ♣︎",
    tags: weigh(
      ["느와르", "마피아", "빌런", "하라구로", "스파이", "심리전", "서스펜스", "미스터리", "탐정", "복수"],
      ["일진", "재벌"],
      ["비밀"],
    ),
  },
  {
    id: "royal",
    emblems: ["crown", "compass", "flora"],
    symbols: "♦︎ ♛︎ ♦︎",
    tags: weigh(
      ["황제", "귀족", "기사", "집사", "메이드", "정치물"],
      ["역사", "시대물", "동양풍", "서양풍", "재벌"],
    ),
  },
  {
    id: "fantasy",
    emblems: ["orbit", "moon", "constellation"],
    symbols: "☾ ✧ ☽",
    tags: weigh(
      [
        "판타지",
        "현대판타지",
        "로맨스 판타지",
        "이세계",
        "신화",
        "마법사",
        "무협",
        "던전",
        "동화",
        "헌터",
        "천사",
        "요정",
        "엘프",
        "오크",
        "몬무스",
        "인외",
      ],
      ["수인", "빙의", "변신", "모험"],
    ),
  },
  {
    id: "action",
    emblems: ["target", "compass", "globe"],
    symbols: "★︎ ★︎ ★︎",
    tags: weigh(["밀리터리", "제복", "액션", "배틀", "히어로/히로인", "재난"], ["조난"], ["근육"]),
  },
  {
    id: "digital",
    emblems: ["globe", "target", "orbit"],
    symbols: "▶︎ ■︎ ●︎",
    tags: weigh(["버튜버", "SF", "로봇", "외계인", "RPG", "게임"], ["시뮬레이터", "유명인"]),
  },
  {
    id: "sweet",
    blockedBy: MENACING_TAGS,
    emblems: ["heart", "flora", "constellation"],
    symbols: "♥︎ ♡ ♥︎ ♡",
    tags: weigh(
      ["순애", "순정", "첫사랑", "짝사랑", "로맨틱 코미디", "소울메이트"],
      ["구원", "연인", "남자친구", "여자친구", "부부", "플러팅", "로맨스", "헌신"],
    ),
  },
  {
    id: "sunny",
    blockedBy: MENACING_TAGS,
    emblems: ["sunburst", "constellation", "orbit"],
    symbols: "✦ ✿ ✦",
    tags: weigh(["햇살", "코미디", "스포츠", "학원물", "아카데미"], ["대학생", "친구", "소꿉친구"]),
  },
  {
    id: "cozy",
    blockedBy: MENACING_TAGS,
    emblems: ["flora", "moon", "sunburst"],
    symbols: "✿ ✿ ✿",
    tags: weigh(["힐링", "동물"], ["가족", "동거", "오피스"], ["다정", "일상"]),
  },
];

const DEFAULT_THEME = { id: "default", emblems: ["constellation", "orbit", "moon"], symbols: "♠︎ ♥︎ ♦︎ ♣︎" };

function resolveTheme(tags) {
  let best = DEFAULT_THEME;
  let bestScore = 0;
  for (const theme of THEMES) {
    if (theme.blockedBy?.some((tag) => tags.includes(tag))) continue;
    const score = tags.reduce((sum, tag) => sum + (theme.tags[tag] ?? 0), 0);
    if (score > bestScore) {
      best = theme;
      bestScore = score;
    }
  }
  return best;
}

const LEVEL_STEPS = [100, 300, 500, 800];
const LEVEL_MOODS = ["calm", "mild", "warm", "bright", "ablaze"];

function turnLevel(turn) {
  return LEVEL_STEPS.filter((step) => turn > step).length + 1;
}

function moodTags(theme, tags) {
  if (!theme.tags) return [];
  return tags
    .filter((tag) => theme.tags[tag])
    .sort((a, b) => theme.tags[b] - theme.tags[a])
    .slice(0, 2);
}

const SAMPLE_SIZE = 24;

function collectColorBuckets(pixels) {
  const buckets = new Map();
  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b, alpha] = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
    if (alpha < 128) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 70 || min > 225) continue;
    const saturation = (max - min) / max;
    if (saturation < 0.18) continue;
    const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    const weight = saturation * (max / 255) ** 2;
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, weight: 0 };
    bucket.r += r * weight;
    bucket.g += g * weight;
    bucket.b += b * weight;
    bucket.weight += weight;
    buckets.set(key, bucket);
  }
  return [...buckets.values()].sort((a, b) => b.weight - a.weight);
}

function bucketHsl({ r, g, b, weight }) {
  const [red, green, blue] = [r / weight / 255, g / weight / 255, b / weight / 255];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  if (delta === 0) return [0, 0, lightness];
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  const hue =
    max === red ? ((green - blue) / delta + 6) % 6 : max === green ? (blue - red) / delta + 2 : (red - green) / delta + 4;
  return [hue * 60, saturation, lightness];
}

const hslCss = ([hue, saturation, lightness]) =>
  `hsl(${Math.round(hue)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%)`;
const clampLightness = (lightness) => Math.min(0.68, Math.max(0.42, lightness));

function pickPalette(pixels) {
  const picked = [];
  for (const bucket of collectColorBuckets(pixels)) {
    const color = bucketHsl(bucket);
    const distinct = picked.every(([hue]) => {
      const gap = Math.abs(hue - color[0]);
      return Math.min(gap, 360 - gap) >= 35;
    });
    if (distinct) picked.push(color);
    if (picked.length === 3) break;
  }
  const first = picked[0];
  if (!first) return [];
  const palette = picked.map(([hue, saturation, lightness]) => hslCss([hue, saturation, clampLightness(lightness)]));
  const base = clampLightness(first[2]);
  const direction = base >= 0.55 ? -1 : 1;
  for (const step of [0.16, 0.28].slice(palette.length - 1)) {
    palette.push(hslCss([first[0], first[1], base + direction * step]));
  }
  return palette;
}

function samplePalette(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        resolve(pickPalette(context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data));
      } catch {
        resolve([]);
      }
    };
    image.onerror = () => resolve([]);
    image.src = src;
  });
}

const characters = new Map();
const chats = new Map();

async function readJson(url) {
  const response = await marinara.fetch(url);
  if (!response.ok) throw new Error(`${url} (${response.status})`);
  return response.json();
}

function loadCharacter(id) {
  if (!characters.has(id)) {
    characters.set(id, null);
    void (async () => {
      const record = await readJson(`/api/characters/${encodeURIComponent(id)}`);
      const data = typeof record.data === "string" ? JSON.parse(record.data) : (record.data ?? {});
      const avatarUrl = record.avatarPath ?? null;
      const palette = avatarUrl ? await samplePalette(avatarUrl) : [];
      const tags = Array.isArray(data.tags) ? data.tags.filter((tag) => typeof tag === "string") : [];
      const theme = resolveTheme(tags);
      characters.set(id, { name: data.name ?? "", avatarUrl, tags, theme, palette });
      schedule();
    })().catch((error) => {
      characters.delete(id);
      marinara.log.warn("character could not be read", error);
    });
  }
  return characters.get(id);
}

function loadChat(id) {
  if (!chats.has(id)) {
    chats.set(id, null);
    void (async () => {
      const chat = await readJson(`/api/chats/${encodeURIComponent(id)}`);
      const characterIds = typeof chat.characterIds === "string" ? JSON.parse(chat.characterIds) : chat.characterIds;
      const persona = chat.personaId
        ? await readJson(`/api/characters/personas/${encodeURIComponent(chat.personaId)}`).catch(() => null)
        : null;
      chats.set(id, { name: chat.name ?? "", characterIds: characterIds ?? [], personaName: persona?.name ?? "" });
      schedule();
    })().catch((error) => {
      chats.delete(id);
      marinara.log.warn("chat could not be read", error);
    });
  }
  return chats.get(id);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function emblem(kind, className) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", `rpc-emblem ${className}`);
  svg.setAttribute("viewBox", "-6 -6 212 212");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = EMBLEMS[kind];
  return svg;
}

let badgeCount = 0;

function nameBadge(name) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "rpc-emblem rpc-emblem--badge");
  svg.setAttribute("viewBox", "-6 -6 212 212");
  svg.setAttribute("aria-hidden", "true");
  const pathId = `rpc-badge-${(badgeCount += 1)}`;
  const label = `${name.trim().toUpperCase()} ✦ `;
  svg.innerHTML = `<defs><path id="${pathId}" d="M100 100m-76 0a76 76 0 1 1 152 0a76 76 0 1 1 -152 0"/></defs>
    <circle cx="100" cy="100" r="94"/><circle class="t" cx="100" cy="100" r="64"/>
    <text class="rpc-emblem__ring-text" textLength="470" lengthAdjust="spacingAndGlyphs"><textPath href="#${pathId}"></textPath></text>
    <g>${spark(100, 100, 44, 4)}</g>`;
  svg.querySelector("textPath").textContent = label.repeat(Math.ceil(26 / label.length));
  return svg;
}

function buildPlate(root, character, chat) {
  const { name, theme, tags, avatarUrl } = character;
  const marks = el("div", "rpc-plate-marks");
  const words = name.trim().split(/\s+/);
  const lastWord = words.length > 1 ? words.pop() : null;

  marks.append(el("i", "rpc-plate-frame"));
  const arcs = document.createElementNS(SVG_NS, "svg");
  arcs.setAttribute("class", "rpc-plate-arcs");
  arcs.setAttribute("viewBox", "0 0 100 140");
  arcs.setAttribute("preserveAspectRatio", "none");
  arcs.innerHTML = `<circle cx="70" cy="58" r="56"/><circle cx="24" cy="112" r="40"/><path d="M-8 96C30 60 62 150 112 104"/>`;
  marks.append(arcs, el("i", "rpc-plate-cross"));

  const trio = el("i", "rpc-plate-trio");
  trio.append(el("em"), el("em"), el("em"));
  marks.append(trio, el("i", "rpc-plate-matrix"), el("b", "rpc-plate-mood"), el("i", "rpc-plate-halftone"));

  const rings = el("i", "rpc-plate-rings");
  rings.append(...range(5).map(() => el("em")));
  const titlebar = el("i", "rpc-plate-titlebar");
  titlebar.append(el("em", "", `${name.trim().toLowerCase().replace(/\s+/g, "_")}.png`), el("strong", "", "_ □ ×"));
  marks.append(rings, titlebar, el("b", "rpc-plate-echo", name), el("b", "rpc-plate-count"));
  if (chat.personaName) marks.append(el("b", "rpc-plate-persona", chat.personaName));
  marks.append(emblem(theme.emblems[0], "rpc-emblem--hero"), nameBadge(name));

  const panel = el("dl", "rpc-plate-panel");
  const row = (label, value, valueClass) => {
    const div = el("div");
    div.append(el("dt", "", label), el("dd", valueClass, value));
    panel.append(div);
  };
  const mood = moodTags(theme, tags);
  row("//NAME_", words[0]?.toUpperCase() ?? "");
  row("//MOOD_", "", "rpc-plate-mood-word");
  if (mood.length > 0) row("//TAGS_", mood.join(" · "));
  row("//TURN_", "", "rpc-plate-turn");
  row("//LEVEL_", "", "rpc-plate-level");
  panel.append(el("i", "rpc-plate-panel-code"));
  marks.append(panel);

  const caption = el("div", "rpc-plate-caption");
  const ruler = el("i", "rpc-plate-ruler");
  ruler.append(el("em", "", "000"), el("em", "rpc-plate-ruler-end"));
  const titleColumn = el("div");
  titleColumn.style.cssText = "min-width:0;flex:1";
  if (chat.name) titleColumn.append(el("p", "rpc-plate-chat", chat.name));
  const title = el("div", "rpc-plate-title");
  const nameLine = el("p", "rpc-plate-name", lastWord ? `${words.join(" ")} ` : words.join(" "));
  if (name.length > 13) nameLine.dataset.long = "true";
  if (lastWord) nameLine.append(el("em", "", lastWord));
  const scribble = document.createElementNS(SVG_NS, "svg");
  scribble.setAttribute("class", "rpc-plate-scribble");
  scribble.setAttribute("viewBox", "0 0 200 10");
  scribble.setAttribute("preserveAspectRatio", "none");
  scribble.innerHTML = `<path d="M2 6C30 2 44 8 70 5s42-3 66 0 40 3 62-1"/>`;
  title.append(nameLine, scribble);
  titleColumn.append(title);
  const open = el("button", "rpc-plate-open");
  open.type = "button";
  open.setAttribute("aria-label", name);
  open.title = name;
  open.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg>`;
  open.addEventListener("click", () => root.querySelector(".rpg-avatar-panel-media")?.click());
  caption.append(ruler, titleColumn, emblem(theme.emblems[2], "rpc-emblem--caption"), open);

  const image = el("img", "rpc-plate-image");
  image.src = avatarUrl;
  image.alt = "";
  const page1 = emblem(theme.emblems[1], "rpc-page-emblem rpc-page-emblem--1");
  const page2 = emblem(theme.emblems[2], "rpc-page-emblem rpc-page-emblem--2");
  const parts = [image, page1, page2, marks, caption];
  for (const part of parts) part.classList.add("rpc-part");
  root.append(...parts);
}

function latestTurn(root) {
  const heads = root.querySelectorAll("[data-rpc-head]");
  const number = heads[heads.length - 1]?.lastElementChild?.textContent?.match(/\d+/)?.[0];
  return Number(number ?? 0);
}

function setText(node, text) {
  if (node && node.textContent !== text) node.textContent = text;
}

function syncPlate(root, chatId) {
  const chat = loadChat(chatId);
  const leadId = chat?.characterIds[0];
  const lead = leadId ? loadCharacter(leadId) : null;
  const key = lead?.avatarUrl ? `${chatId}/${leadId}` : "";
  if (root.dataset.rpcPlate !== key) {
    root.querySelectorAll(":scope > .rpc-part").forEach((part) => part.remove());
    root.dataset.rpcPlate = key;
    if (key) root.dataset.rpcPlated = "";
    else delete root.dataset.rpcPlated;
    if (key) buildPlate(root, lead, chat);
  }
  root.dataset.roleplayCast = (chat?.characterIds.length ?? 1) > 1 ? "group" : "solo";
  for (const [index, color] of (lead?.palette ?? []).entries()) {
    root.style.setProperty(`--rpc-deco-${index + 1}`, color);
  }
  const turn = latestTurn(root);
  setText(root.querySelector(":scope > .rpc-plate-marks .rpc-plate-count"), `NO.${turn}`);
  setText(root.querySelector(":scope > .rpc-plate-marks .rpc-plate-turn"), String(turn).padStart(3, "0"));
  setText(root.querySelector(":scope > .rpc-plate-caption .rpc-plate-ruler-end"), String(turn).padStart(3, "0"));
  const level = turnLevel(turn);
  const mood = LEVEL_MOODS[level - 1];
  setText(root.querySelector(":scope > .rpc-plate-marks .rpc-plate-mood"), mood);
  setText(root.querySelector(":scope > .rpc-plate-marks .rpc-plate-mood-word"), mood.toUpperCase());
  setText(root.querySelector(":scope > .rpc-plate-marks .rpc-plate-level"), "◆".repeat(level) + "◇".repeat(5 - level));
}

function decorateRow(row, chatId) {
  const body = row.querySelector(":scope > .mari-roleplay-message-body");
  if (!body || body.querySelector(":scope > .rpc-deco")) return;
  const isUser = row.classList.contains("mari-message-user");
  const speakerId = row.dataset.cardCss || loadChat(chatId)?.characterIds[0];
  const speaker = !isUser && speakerId ? loadCharacter(speakerId) : null;
  if (!isUser && !speaker) return;

  const deco = el("span", "rpc-deco");
  deco.setAttribute("aria-hidden", "true");
  deco.append(el("i", "rpc-card-deco", isUser ? "✦ ✧ ✦" : speaker.theme.symbols));
  deco.append(el("i", "rpc-card-rings"), el("i", "rpc-foot"));
  if (body.querySelector(":scope > div:first-child > .mari-message-name")) {
    deco.append(el("i", "rpc-note"), el("i", "rpc-note-slash", "//"), el("span", "rpc-tokens"));
  }
  if (speaker) {
    for (const [index, color] of speaker.palette.entries()) deco.style.setProperty(`--rpc-deco-${index + 1}`, color);
    const turn = Number(row.querySelector(".mari-message-name")?.parentElement?.lastElementChild?.textContent?.match(/\d+/)?.[0] ?? 0);
    deco.append(emblem(speaker.theme.emblems[turn % speaker.theme.emblems.length], "rpc-emblem--card"));
    if (speaker.avatarUrl && body.querySelector(":scope > div:first-child > .mari-message-name")) {
      row.dataset.rpcStickered = "";
      body.dataset.rpcStickered = "";
      const sticker = el("button", "rpc-sticker");
      sticker.type = "button";
      sticker.tabIndex = -1;
      const face = el("img");
      face.src = speaker.avatarUrl;
      face.alt = "";
      face.loading = "lazy";
      sticker.append(face);
      sticker.addEventListener("click", () => row.querySelector(".rpg-avatar-panel-media")?.click());
      deco.append(sticker);
    }
  }
  body.append(deco);
}

function swipePreview(content) {
  return content
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_~`#>]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function chooseSwipe(pill, index) {
  const input = pill.querySelector(".mari-swipe-input input");
  if (!input) return;
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setValue.call(input, String(index + 1));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

let closeSwipeList = null;

async function openSwipeList(chatId, messageId, pill) {
  closeSwipeList?.();
  const backdrop = el("div", "rpc-swipe-backdrop");
  const panel = el("div", "rpc-swipe-window");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  const head = el("div", "rpc-swipe-head");
  const close = el("button", "rpc-swipe-close", "×");
  close.type = "button";
  close.setAttribute("aria-label", "닫기");
  const rows = el("ol", "rpc-swipe-rows");
  head.append(el("span", "", "스와이프 목록"), close);
  panel.append(head, rows);
  backdrop.append(panel);

  const onKey = (event) => {
    if (event.key === "Escape") closeSwipeList?.();
  };
  closeSwipeList = () => {
    backdrop.remove();
    document.removeEventListener("keydown", onKey);
    closeSwipeList = null;
  };
  close.addEventListener("click", () => closeSwipeList?.());
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeSwipeList?.();
  });
  document.addEventListener("keydown", onKey);
  document.body.append(backdrop);

  const swipes = await readJson(`/api/chats/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/swipes`);
  const active = Number(pill.querySelector(".mari-swipe-input input")?.value ?? 1) - 1;
  for (const swipe of [...swipes].sort((a, b) => a.index - b.index)) {
    const row = el("button", "rpc-swipe-row");
    row.type = "button";
    if (swipe.index === active) row.setAttribute("aria-current", "true");
    row.append(el("b", "", String(swipe.index + 1)), el("span", "", swipePreview(swipe.content)));
    row.addEventListener("click", () => {
      if (swipe.index !== active) chooseSwipe(pill, swipe.index);
      closeSwipeList?.();
    });
    const item = el("li");
    item.append(row);
    rows.append(item);
  }
}

function syncSwipeListButton(row, chatId, count) {
  const pill = row.querySelector(":scope > .mari-roleplay-message-body > .mari-message-swipes");
  if (!pill) return;
  const existing = pill.querySelector(":scope > .rpc-swipe-list-open");
  if (Number(count) <= 1) {
    existing?.remove();
    return;
  }
  if (existing) return;
  const button = el("button", "rpc-swipe-list-open");
  button.type = "button";
  button.title = "스와이프 목록";
  button.setAttribute("aria-label", "스와이프 목록");
  button.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>`;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    void openSwipeList(chatId, row.dataset.messageId, pill).catch((error) => {
      closeSwipeList?.();
      marinara.log.warn("swipes could not be read", error);
    });
  });
  pill.append(button);
}

const ACTION_ORDER = {
  "lucide-pencil": 1,
  "lucide-copy": 2,
  "lucide-check": 2,
  "lucide-languages": 3,
  "lucide-shield": 4,
  "lucide-refresh-cw": 5,
  "lucide-bookmark": 6,
  "lucide-flag": 7,
  "lucide-eye": 8,
  "lucide-eye-off": 8,
  "lucide-search": 9,
  "lucide-scroll-text": 10,
  "lucide-brain": 11,
  "lucide-git-branch": 12,
  "lucide-trash-2": 13,
  "lucide-ellipsis": 20,
};

const MESSAGE_TOOLS = [
  ["edit", "편집", ["lucide-pencil"]],
  ["copy", "복사", ["lucide-copy", "lucide-check"]],
  ["reply", "답장", ["lucide-reply"]],
  ["reaction", "반응", ["lucide-smile-plus"]],
  ["translate", "번역", ["lucide-languages"]],
  ["rewrite", "재작성 원문 전환", ["lucide-shield"]],
  ["regenerate", "재생성", ["lucide-refresh-cw"]],
  ["marks", "표시·메모", ["lucide-bookmark"]],
  ["start", "대화 시작점", ["lucide-flag"]],
  ["hide", "AI에게서 숨기기", ["lucide-eye", "lucide-eye-off"]],
  ["peek", "프롬프트 미리보기", ["lucide-search"]],
  ["guidance", "저장된 지침", ["lucide-scroll-text"]],
  ["thinking", "모델의 생각", ["lucide-brain"]],
  ["branch", "분기·복제", ["lucide-git-branch"]],
  ["delete", "삭제", ["lucide-trash-2"]],
];
const SETTINGS_KEY = "scrapbookSettings";
const settingsDefaults = () => ({ point: { light: "", dark: "" }, dialogue: { light: "", dark: "" }, tools: ["edit"], tucked: [], order: [], caught: [] });
let scrapbookSettings = settingsDefaults();
let caughtNodes = new Set();
let caughtFrame = 0;
let catching = null;
const openToolBars = new WeakSet();
const CONVO_SELECTOR = '.mari-chat-area[data-chat-mode="conversation"]';
const convoObservers = new Map();
const convoDirty = new Set();
let convoFrame = 0;

function closeToolBars(event) {
  for (const actions of document.querySelectorAll(".mari-message-actions[data-rpc-open]")) {
    if (event && actions.contains(event.target)) continue;
    openToolBars.delete(actions);
    orderActions(actions);
  }
  if (!document.querySelector(".mari-message-actions[data-rpc-open]")) document.removeEventListener("pointerdown", closeToolBars, true);
}

function toolOf(action) {
  const classes = [...(action.querySelector("svg")?.classList ?? [])];
  const known = MESSAGE_TOOLS.find(([, , icons]) => icons.some((name) => classes.includes(name)));
  if (known) return { key: known[0], label: known[1] };
  if (!action.matches("button, a, [role='button']")) return null;
  const label = (action.getAttribute("aria-label") || action.getAttribute("title") || action.textContent || "").trim().slice(0, 40);
  const icon = classes.find((name) => name.startsWith("lucide-"));
  if (icon) return { key: `icon:${icon}`, label: label || icon.slice(7) };
  return label ? { key: `label:${label}`, label } : null;
}

function toolFolded(key) {
  return key.includes(":") ? scrapbookSettings.tucked.includes(key) : !scrapbookSettings.tools.includes(key);
}

function toolRank(key) {
  const saved = scrapbookSettings.order.indexOf(key);
  if (saved >= 0) return saved;
  const known = MESSAGE_TOOLS.findIndex(([tool]) => tool === key);
  return scrapbookSettings.order.length + (known >= 0 ? known : MESSAGE_TOOLS.length);
}

function chatTools() {
  const found = new Map();
  for (const bar of document.querySelectorAll(".mari-message-actions")) {
    if (!bar.querySelector(":scope > [data-rpc-order]")) continue;
    for (const action of bar.children) {
      if (action.matches(".rpc-more, .rpc-more-panel")) continue;
      const tool = toolOf(action);
      if (tool && !found.has(tool.key)) found.set(tool.key, tool.label);
    }
  }
  return [...found].sort(([a], [b]) => toolRank(a) - toolRank(b));
}

function orderActions(actions) {
  if (!actions) return;
  let open = openToolBars.has(actions);
  let more = null;
  let sample = null;
  const folded = [];
  for (const action of actions.children) {
    if (action.classList.contains("rpc-more") || action.classList.contains("rpc-more-panel")) {
      if (action.classList.contains("rpc-more")) more = action;
      continue;
    }
    const classes = [...(action.querySelector("svg")?.classList ?? [])];
    const icon = classes.find((name) => ACTION_ORDER[name]);
    if (icon && action.dataset.rpcOrder !== String(ACTION_ORDER[icon])) action.dataset.rpcOrder = ACTION_ORDER[icon];
    const tool = toolOf(action);
    if (tool) action.dataset.rpcTool = tool.key;
    if (tool && scrapbookSettings.order.length) action.style.setProperty("order", String(toolRank(tool.key) + 1), "important");
    else action.style.removeProperty("order");
    const fold = Boolean(tool) && toolFolded(tool.key);
    if (fold) folded.push(action);
    else {
      setFlag(action, "rpcTucked", false);
      setFlag(action, "rpcFloat", false);
    }
    if (!sample && action.tagName === "BUTTON") sample = action;
  }
  if (!folded.length) {
    openToolBars.delete(actions);
    open = false;
  }
  folded.sort((a, b) => toolRank(a.dataset.rpcTool) - toolRank(b.dataset.rpcTool));
  const cols = Math.min(folded.length, 6);
  folded.forEach((action, index) => {
    setFlag(action, "rpcTucked", !open);
    setFlag(action, "rpcFloat", open);
    if (open) {
      action.style.setProperty("--rpc-col", String(index % cols));
      action.style.setProperty("--rpc-row", String(Math.floor(index / cols)));
    } else {
      action.style.removeProperty("--rpc-col");
      action.style.removeProperty("--rpc-row");
    }
  });
  setFlag(actions, "rpcOpen", open);
  let panel = actions.querySelector(":scope > .rpc-more-panel");
  if (open) {
    actions.style.setProperty("--rpc-cols", String(cols));
    actions.style.setProperty("--rpc-rows", String(Math.ceil(folded.length / cols)));
    if (!panel) {
      panel = el("span", "rpc-more-panel");
      panel.setAttribute("aria-hidden", "true");
      actions.append(panel);
    }
  } else {
    panel?.remove();
    actions.style.removeProperty("--rpc-cols");
    actions.style.removeProperty("--rpc-rows");
  }
  if (!folded.length) return more?.remove();
  if (!more) {
    more = el("button", `${sample?.className ?? ""} rpc-more`);
    more.type = "button";
    more.setAttribute("aria-label", "더보기");
    more.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`;
    more.addEventListener("click", (event) => {
      event.stopPropagation();
      if (openToolBars.has(actions)) openToolBars.delete(actions);
      else {
        closeToolBars();
        openToolBars.add(actions);
        document.addEventListener("pointerdown", closeToolBars, true);
      }
      orderActions(actions);
    });
    actions.append(more);
  }
  more.setAttribute("aria-pressed", String(open));
}

function setFlag(node, name, on) {
  if (on && node.dataset[name] === undefined) node.dataset[name] = "";
  if (!on && node.dataset[name] !== undefined) delete node.dataset[name];
}

function markHead(row, chatId) {
  const total = [...row.querySelectorAll(".mari-message-swipes > span:not(.mari-swipe-input)")].find((span) => span.textContent.trim().startsWith("/"));
  const count = total?.textContent.match(/\d+/)?.[0];
  if (count && total.dataset.rpcTotal !== count) total.dataset.rpcTotal = count;
  syncSwipeListButton(row, chatId, count ?? 0);
  const body = row.querySelector(":scope > .mari-roleplay-message-body");
  if (!body) return;
  const head = body.querySelector(":scope > div > .mari-message-name")?.parentElement;
  setFlag(body, "rpcHeaded", Boolean(head));
  setFlag(body, "rpcSwiped", Boolean(body.querySelector(":scope > .mari-message-swipes")));
  const textBox = body.querySelector(".mari-rp-bubble .mari-message-content")?.parentElement;
  if (textBox) setFlag(textBox, "rpcText", true);
  const slip = body.querySelector(".mari-rp-bubble svg.lucide-eye-off")?.closest("button");
  if (slip) setFlag(slip, "rpcSlip", true);
  orderActions(body.querySelector(":scope > .mari-message-actions"));
  if (!head) return;
  setFlag(head, "rpcHead", true);
  const nameNode = head.querySelector(":scope > .mari-message-name");
  let led = false;
  for (const part of head.children) {
    const before = part !== nameNode && Boolean(nameNode && part.compareDocumentPosition(nameNode) & Node.DOCUMENT_POSITION_FOLLOWING);
    setFlag(part, "rpcLead", before);
    led ||= before;
    setFlag(part, "rpcTime", part === nameNode?.nextElementSibling && part.tagName === "SPAN" && !part.title);
  }
  setFlag(head, "rpcLed", led);
  const lead = led && nameNode ? [...head.children].findLast((part) => part.dataset.rpcLead !== undefined) : null;
  const leadBox = lead?.getBoundingClientRect();
  if (leadBox?.width) head.style.setProperty("--rpc-lead-pad", `${Math.max(0, Math.ceil(leadBox.right + 8 - nameNode.getBoundingClientRect().left))}px`);
  else if (!lead) head.style.removeProperty("--rpc-lead-pad");
  for (const span of head.querySelectorAll(":scope > span")) {
    const number = span.textContent.match(/^#(\d+)$/)?.[1];
    if (number && span.dataset.rpcNo !== number) span.dataset.rpcNo = number;
    if (span.title && span.matches(".mari-message-name + span ~ span")) {
      const model = span.textContent.replace(/^\S*\//, "");
      if (span.dataset.rpcModel !== model) span.dataset.rpcModel = model;
    }
  }

  const content = row.querySelector(".mari-message-content");
  if (content) setText(row.querySelector(".rpc-deco > .rpc-tokens"), `${marinara.estimateTextTokens(content.textContent)}t`);
}

const ROW_SELECTOR = ".mari-roleplay-message-row";
const SEEN_ANIMATION = "rpc-seen";

function chatIdOf(root) {
  return root.querySelector("[data-chat-id]")?.dataset.chatId;
}

function syncRow(row) {
  const chatId = chatIdOf(row.closest(ROOT_SELECTOR) ?? row);
  if (!chatId) return;
  decorateRow(row, chatId);
  markHead(row, chatId);
}

function syncRoot(root) {
  const chatId = chatIdOf(root);
  if (!chatId) return;
  for (const row of root.querySelectorAll(ROW_SELECTOR)) {
    decorateRow(row, chatId);
    markHead(row, chatId);
  }
  syncPlate(root, chatId);
  syncRemote(root);
}

function syncAll() {
  for (const root of document.querySelectorAll(ROOT_SELECTOR)) syncRoot(root);
  for (const root of document.querySelectorAll(CONVO_SELECTOR)) queueConvo(root);
}

const dirtyRows = new Set();
const dirtyRoots = new Set();
let wholeChatDirty = false;
let pending = 0;

function flushLater() {
  if (pending) return;
  pending = requestAnimationFrame(() => {
    pending = 0;
    const rows = [...dirtyRows];
    const roots = [...dirtyRoots];
    const whole = wholeChatDirty;
    dirtyRows.clear();
    dirtyRoots.clear();
    wholeChatDirty = false;
    if (whole) return syncAll();
    for (const row of rows) if (row.isConnected) syncRow(row);
    for (const root of roots) {
      const chatId = root.isConnected && chatIdOf(root);
      if (chatId) syncPlate(root, chatId);
      if (root.isConnected) syncRemote(root);
    }
  });
}

function schedule() {
  wholeChatDirty = true;
  flushLater();
}

function onSeen(event) {
  if (event.animationName !== SEEN_ANIMATION) return;
  const target = event.target;
  const root = target.closest(ROOT_SELECTOR);
  if (!root) return;
  if (target === root) wholeChatDirty = true;
  else {
    const row = target.closest(ROW_SELECTOR);
    if (row) dirtyRows.add(row);
    dirtyRoots.add(root);
  }
  flushLater();
}

document.addEventListener("animationstart", onSeen, true);
marinara.onCleanup(() => {
  document.removeEventListener("animationstart", onSeen, true);
  if (pending) cancelAnimationFrame(pending);
  pending = 0;
  dirtyRows.clear();
  dirtyRoots.clear();
  closeSwipeList?.();
  document.querySelectorAll(".rpc-part, .rpc-deco, .rpc-swipe-list-open").forEach((node) => node.remove());
  for (const root of document.querySelectorAll(ROOT_SELECTOR)) {
    delete root.dataset.rpcPlate;
    delete root.dataset.rpcPlated;
    delete root.dataset.roleplayCast;
    for (const index of [1, 2, 3]) root.style.removeProperty(`--rpc-deco-${index}`);
  }
});
syncAll();

const HOME_SELECTOR = '[data-component="HomeBrowserHub.HomePage"]';
const HUB_SELECTOR = '[data-component="HomeBrowserHub"]';
const HUB_CONTENT_SELECTOR = '[data-component="HomeBrowserHub.Content"]';
const APP_BRAND = "M.E.";
const FILTERS = ["recommended", "newest", "favorites", "tags"];
const FILTER_LABELS = { recommended: "추천", newest: "신규", favorites: "즐겨찾기", tags: "태그" };
const MODE_LABELS = { conversation: "대화", roleplay: "롤플레이", game: "게임" };
const SLIDE_MS = 6_000;
const PICK_COUNT = 5;
const CONTINUE_LIMIT = 12;
const FAVORITE_LIMIT = 24;
const PHONE_PREVIEW_LIMIT = 8;
const ARCHIVE_PREVIEW_ROWS = 2;
const NEWEST_PAGE_LIMIT = 2;
const NEWEST_LIMIT = 10;
const BAND_WORDS = ["CONTINUE", "ROLEPLAY", "NOVEL", "CONVERSATION", "ARCHIVE"];
const PAPERLOGY_PATH = "gh/projectnoonnu/2408-3@1.0/";
const PAPERLOGY_FILES = {
  400: "Paperlogy-4Regular",
  500: "Paperlogy-5Medium",
  600: "Paperlogy-6SemiBold",
  700: "Paperlogy-7Bold",
  800: "Paperlogy-8ExtraBold",
  900: "Paperlogy-9Black",
};

const pad = (value) => String(value).padStart(2, "0");
const compactNumber = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const byNewest = (left, right) => right.createdAt.localeCompare(left.createdAt);
const byUpdated = (left, right) => right.updatedAt.localeCompare(left.updatedAt);

function blurb(character) {
  return (character.explicitSummary || character.creatorNotes || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function since(iso) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}M AGO`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}H AGO`;
  return `${Math.round(hours / 24)}D AGO`;
}

function todaysPicks(characters) {
  const today = new Date();
  let seed = today.getFullYear() * 10_000 + (today.getMonth() + 1) * 100 + today.getDate();
  const random = () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
    return seed / 2_147_483_648;
  };
  const pool = characters.filter((character) => character.avatarPath);
  for (let index = pool.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  return pool.slice(0, PICK_COUNT);
}

function h(tag, props, ...children) {
  const [name, ...classes] = tag.split(".");
  const node = document.createElement(name || "div");
  if (classes.length) node.className = classes.join(" ");
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith("on")) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === "style") for (const [prop, val] of Object.entries(value)) node.style.setProperty(prop, val);
    else if (key in node && key !== "type") node[key] = value;
    else node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : String(child));
  }
  return node;
}

function highlightQuotes(text) {
  return text.split(/("[^"]+"|“[^”]+”)/g).map((part, index) => (index % 2 === 1 ? h("mark", null, part) : part));
}

function personIcon(size) {
  return h("span.mari-ph-person", { "aria-hidden": "true", style: { "--size": `${size}px` } });
}

function cropStyle(crop) {
  if (!crop || !(crop.srcWidth > 0) || !(crop.srcHeight > 0)) return null;
  return {
    position: "absolute",
    width: `${100 / crop.srcWidth}%`,
    height: `${100 / crop.srcHeight}%`,
    left: `${(-crop.srcX / crop.srcWidth) * 100}%`,
    top: `${(-crop.srcY / crop.srcHeight) * 100}%`,
    "max-width": "none",
    "max-height": "none",
    "object-fit": "cover",
  };
}

function avatarImage(src, crop, className = "mari-ph-img") {
  return h(`img.${className}`, { src, alt: "", loading: "lazy", decoding: "async", draggable: false, style: cropStyle(crop) });
}

function cropCoverImage(src, crop) {
  const style = cropStyle(crop);
  const image = h("img", { src, alt: "", draggable: false, style });
  return style ? h("span.mari-ph-crop", null, image) : image;
}

let stores = null;

function findStores() {
  if (stores) return stores;
  const rootElement = document.getElementById("root");
  const containerKey = rootElement && Object.keys(rootElement).find((key) => key.startsWith("__reactContainer$"));
  const found = {};
  const stack = containerKey ? [rootElement[containerKey]] : [];
  while (stack.length && !(found.ui && found.chat)) {
    const fiber = stack.pop();
    if (!fiber) continue;
    if (fiber.tag === 0 || fiber.tag === 11 || fiber.tag === 15) {
      for (let hook = fiber.memoizedState, guard = 0; hook && guard < 100; hook = hook.next, guard++) {
        const deps = Array.isArray(hook.memoizedState) ? hook.memoizedState[1] : null;
        if (!Array.isArray(deps)) continue;
        for (const dep of deps) {
          if (typeof dep?.getState !== "function" || typeof dep.setState !== "function") continue;
          const state = dep.getState();
          if (typeof state.openModal === "function" && typeof state.openRightPanel === "function") found.ui = dep;
          if (typeof state.setActiveChatId === "function") found.chat = dep;
        }
      }
    }
    if (fiber.sibling) stack.push(fiber.sibling);
    if (fiber.child) stack.push(fiber.child);
  }
  if (found.ui && found.chat) stores = found;
  else marinara.log.warn("Marinara's stores were not found");
  return found;
}

const homeMoves = {
  pick(character) {
    void openProfile(character.id, character.name);
  },
  openChat(chatId) {
    findStores().chat?.getState().setActiveChatId(chatId);
  },
  create() {
    if (typeof window.__marinaraOpenCharacterForge === "function") window.__marinaraOpenCharacterForge();
    else findStores().ui?.getState().openModal("create-character");
  },
  allCharacters() {
    const ui = findStores().ui?.getState();
    ui?.closeAllDetails?.();
    ui?.openRightPanel("characters");
  },
};

let fontsRequested = false;

function requestHomeFonts() {
  if (fontsRequested) return;
  fontsRequested = true;
  for (const [weight, file] of Object.entries(PAPERLOGY_FILES)) loadFont("Paperlogy", `${PAPERLOGY_PATH}${file}.woff2`, { weight });
}

const accentColors = new Map();

function sampleAccent(src) {
  if (!accentColors.has(src)) {
    accentColors.set(
      src,
      new Promise((resolve) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = SAMPLE_SIZE;
            canvas.height = SAMPLE_SIZE;
            const context = canvas.getContext("2d", { willReadFrequently: true });
            context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
            const best = collectColorBuckets(context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data)[0];
            const hex = (value) => Math.round(value / best.weight).toString(16).padStart(2, "0");
            resolve(best ? `#${hex(best.r)}${hex(best.g)}${hex(best.b)}` : null);
          } catch {
            resolve(null);
          }
        };
        image.onerror = () => resolve(null);
        image.src = src;
      }),
    );
  }
  return accentColors.get(src);
}

let homeData = null;
let homeLoading = null;
let homeRepaint = null;

let catalogPromise = null;
let catalogAt = 0;
function loadCatalog() {
  if (!catalogPromise || Date.now() - catalogAt > 60_000) {
    catalogAt = Date.now();
    catalogPromise = fetchCatalog().catch(error => { catalogPromise = null; throw error; });
  }
  return catalogPromise;
}
async function fetchCatalog() {
  const items = [];
  for (let offset = 0; ; ) {
    const page = await readJson(`/api/characters/catalog?offset=${offset}&limit=200`);
    const batch = Array.isArray(page.items) ? page.items : [];
    items.push(...batch);
    if (!page.hasMore || batch.length === 0) return items;
    offset += batch.length;
  }
}

let characterSavesWatched = false;
function watchCharacterSaves() {
  if (characterSavesWatched) return;
  const client = findQueryClient();
  if (!client) return;
  characterSavesWatched = true;
  let timer = 0;
  let feedTimer = 0;
  client.getQueryCache().subscribe((event) => {
    if (event.type === "updated" && event.query.queryKey[0] === "home-feed") {
      clearTimeout(feedTimer);
      feedTimer = setTimeout(() => {
        homeData = null;
        homeRepaint?.();
      }, 300);
      return;
    }
    if (event.type !== "updated" || event.action?.type !== "invalidate" || event.query.queryKey[0] !== "characters") return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      catalogPromise = null;
      characterMetaAt = 0;
      homeData = null;
      if (document.querySelector(CHARACTER_CARD_SELECTOR)) void loadCharacterMeta();
      homeRepaint?.();
    }, 300);
  });
}

function loadHome() {
  homeLoading ??= Promise.all([loadCatalog(), readJson("/api/chats/home-feed")])
    .then(([characters, feed]) => {
      watchCharacterSaves();
      homeData = { characters, recentChats: Array.isArray(feed.recentChats) ? feed.recentChats : [] };
      return homeData;
    })
    .finally(() => {
      homeLoading = null;
    });
  return homeLoading;
}

function sectionHead(number, title, sub, extra) {
  return h(
    "div.mari-ph-sh",
    null,
    h("span.mari-ph-sh-tab", null, "SECTION"),
    h("h2", null, h("b", null, pad(number)), ` ${title}`),
    h("span.mari-ph-sh-sub", null, sub),
    h("span.mari-ph-sh-fill", { "aria-hidden": "true" }),
    extra,
  );
}

const homeRowObservers = new Set();
marinara.onCleanup(() => { for (const observer of homeRowObservers) observer.disconnect(); homeRowObservers.clear(); });
function scrollRow(number, title, sub, className, items) {
  const left = h("button", { type: "button", "aria-label": "왼쪽으로 넘기기", disabled: true }, "‹");
  const right = h("button", { type: "button", "aria-label": "오른쪽으로 넘기기", disabled: true }, "›");
  const track = h(`div.${className}`, null, items);
  const measure = () => {
    left.disabled = !(track.scrollLeft > 4);
    right.disabled = !(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  };
  const scroll = (direction) => track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  left.addEventListener("click", () => scroll(-1));
  right.addEventListener("click", () => scroll(1));
  track.addEventListener("scroll", measure, { passive: true });
  const observer = new ResizeObserver(measure);
  homeRowObservers.add(observer);
  observer.observe(track);
  return h("section", null, sectionHead(number, title, sub, h("span.mari-ph-sh-arrows", null, left, right)), track);
}

function showcaseSlide(character, position, count, volume) {
  const name = character.name.trim();
  const firstWord = name.split(/\s+/)[0] ?? "";
  const latin = /^[ -~]+$/.test(name);
  const signature = /^[A-Za-z][A-Za-z'.-]*$/.test(firstWord) ? firstWord : null;
  const line = blurb(character);
  const slide = h(
    "button.mari-ph-slide",
    { type: "button", "aria-label": name },
    h(`span.mari-ph-giant${latin ? "" : ".mari-ph-giant--kr"}`, { "aria-hidden": "true" }, latin ? (signature ?? name).toUpperCase() : name),
    h("span.mari-ph-slide-art", { "aria-hidden": "true" }, cropCoverImage(character.avatarPath, character.avatarCrop)),
    h(
      "span.mari-ph-stub",
      { "aria-hidden": "true" },
      h("em"),
      h("span", null, `TODAY'S PICK · ${pad(position + 1)}/${pad(count)}`),
      h("b"),
      h("span.mari-ph-stub-notch"),
    ),
    h(
      "span.mari-ph-slide-info",
      null,
      h("span.mari-ph-slide-label", { "aria-hidden": "true" }, h("i"), `NO.${pad(position + 1)} — PICK OF THE DAY`),
      h("span.mari-ph-slide-name", null, name),
      line && h("span.mari-ph-slide-line", null, line),
      character.tags.length > 0 &&
        h("span.mari-ph-slide-tags", null, character.tags.slice(0, 3).map((tag) => h("span", null, `#${tag}`))),
    ),
    h("span.mari-ph-twinkle.mari-ph-twinkle--a", { "aria-hidden": "true" }),
    h("span.mari-ph-twinkle.mari-ph-twinkle--b", { "aria-hidden": "true" }),
    h("span.mari-ph-twinkle.mari-ph-twinkle--c", { "aria-hidden": "true" }),
    h("span.mari-ph-side", { "aria-hidden": "true" }, h("i"), h("span", null, `${APP_BRAND} ARCHIVE · ${volume}`), h("b")),
  );
  void sampleAccent(character.avatarPath).then((color) => {
    if (color) slide.style.setProperty("--mari-ph-slide-color", color);
  });
  return slide;
}

function showcase(picks, volume) {
  const count = picks.length;
  if (count === 0) return null;
  let index = 0;
  let paused = false;
  let onScreen = false;
  let swipeStart = null;
  let swiped = false;
  const slides = picks.map((character, position) => {
    const slide = showcaseSlide(character, position, count, volume);
    slide.addEventListener("click", () => {
      if (swiped) swiped = false;
      else homeMoves.pick(character);
    });
    return slide;
  });
  const track = h("div.mari-ph-show-track", null, slides);
  const current = h("span", null, pad(1));
  const progress = h("s");
  const show = (next) => {
    index = (next + count) % count;
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, position) => {
      slide.tabIndex = position === index ? 0 : -1;
      slide.setAttribute("aria-hidden", String(position !== index));
    });
    current.textContent = pad(index + 1);
    progress.style.setProperty("--p", `${((index + 1) / count) * 100}%`);
  };
  const section = h(
    "section.mari-ph-show",
    {
      "aria-roledescription": "carousel",
      "aria-label": "오늘의 추천",
      onMouseEnter: () => (paused = true),
      onMouseLeave: () => (paused = false),
      onPointerDown: (event) => (swipeStart = event.clientX),
      onPointerUp: (event) => {
        const start = swipeStart;
        swipeStart = null;
        if (start === null || Math.abs(event.clientX - start) <= 40) return;
        swiped = true;
        show(index + (event.clientX < start ? 1 : -1));
      },
    },
    track,
    count > 1 &&
      h(
        "div.mari-ph-show-pager",
        null,
        h("button", { type: "button", "aria-label": "이전", onClick: () => show(index - 1) }, "‹"),
        current,
        progress,
        pad(count),
        h("button", { type: "button", "aria-label": "다음", onClick: () => show(index + 1) }, "›"),
      ),
  );
  show(0);
  if (count > 1) {
    const visibilityObserver = new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting));
    visibilityObserver.observe(section);
    marinara.onCleanup(() => visibilityObserver.disconnect());
    const timer = marinara.setInterval(() => {
      if (!section.isConnected) { visibilityObserver.disconnect(); return marinara.clearInterval(timer); }
      if (onScreen && !paused && document.visibilityState === "visible") show(index + 1);
    }, SLIDE_MS);
  }
  return section;
}

function continueTicket({ chat, latestMessage }, byId) {
  const character = byId.get(chat.characterIds?.[0] ?? "");
  const name = character?.name ?? chat.name ?? "";
  const preview = (latestMessage?.content ?? "").replace(/\s+/g, " ").trim().slice(0, 220);
  return h(
    "button.mari-ph-ticket",
    { type: "button", onClick: () => homeMoves.openChat(chat.id) },
    h("span.mari-ph-ticket-hole", { "aria-hidden": "true" }),
    h(
      "span.mari-ph-ticket-photo",
      null,
      character?.avatarPath ? avatarImage(character.avatarPath, character.avatarCrop) : h("span.mari-ph-fill", null, personIcon(24)),
      h("span.mari-ph-at", null, `@${name.split(/\s+/)[0]}`),
    ),
    h(
      "span.mari-ph-ticket-body",
      null,
      h("span.mari-ph-ticket-quote", { "aria-hidden": "true" }, "“"),
      h("span.mari-ph-ticket-text", null, highlightQuotes(preview)),
      h(
        "span.mari-ph-ticket-meta",
        null,
        h("span", null, MODE_LABELS[chat.mode] ?? chat.mode),
        latestMessage && h("span", null, since(latestMessage.createdAt)),
      ),
    ),
  );
}

function newArrivalStrip(character, position) {
  return h(
    "button.mari-ph-strip",
    { type: "button", onClick: () => homeMoves.pick(character) },
    character.avatarPath ? avatarImage(character.avatarPath, null, "mari-ph-img.mari-ph-img--top") : h("span.mari-ph-fill", null, personIcon(28)),
    h("span.mari-ph-strip-no", null, pad(position + 1)),
    character.favorite && h("span.mari-ph-strip-fav", { "aria-hidden": "true" }),
    h("span.mari-ph-strip-name", null, character.name),
  );
}

function favoriteStory(character) {
  return h(
    "button.mari-ph-story",
    { type: "button", onClick: () => homeMoves.pick(character) },
    h("span.mari-ph-story-ring", null, character.avatarPath ? avatarImage(character.avatarPath, character.avatarCrop) : personIcon(28)),
    h("span.mari-ph-story-name", null, character.name),
  );
}

function favoritesSection(number, favorites) {
  return scrollRow(number, "FAVORITES", "즐겨찾기", "mari-ph-stories", favorites.map(favoriteStory));
}

function coverCard(character) {
  return h(
    "button.mari-ph-cover",
    { type: "button", onClick: () => homeMoves.pick(character) },
    h("div.mari-ph-cover-art", null, character.avatarPath ? avatarImage(character.avatarPath, null, "mari-ph-img.mari-ph-img--top") : personIcon(28)),
    character.favorite && h("i.mari-ph-cover-fav", { "aria-hidden": "true" }),
    h(
      "span.mari-ph-cover-text",
      null,
      h("span.mari-ph-cover-name", null, character.name),
      h("span.mari-ph-cover-line", null, blurb(character)),
      h("span.mari-ph-cover-stats", null, h("span", null, `# ${compactNumber.format(character.tokenEstimate ?? 0)}`)),
    ),
  );
}

function tagPanel(state, counts, onChange) {
  const tags = [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  const close = () => {
    backdrop.remove();
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (event) => {
    if (event.key === "Escape") close();
  };
  const list = h(
    "div.mari-ph-tags-list",
    null,
    tags.map(([tag, count]) =>
      h(
        "button.mari-ph-tag",
        {
          type: "button",
          "aria-pressed": String(state.selectedTags.includes(tag)),
          onClick: (event) => {
            state.selectedTags = state.selectedTags.includes(tag)
              ? state.selectedTags.filter((item) => item !== tag)
              : [...state.selectedTags, tag];
            event.currentTarget.setAttribute("aria-pressed", String(state.selectedTags.includes(tag)));
            onChange();
          },
        },
        `#${tag}`,
        h("small", null, count),
      ),
    ),
  );
  const backdrop = h(
    "div.mari-ph-tags-backdrop",
    { onClick: (event) => event.target === backdrop && close() },
    h(
      "div.mari-ph-tags",
      { role: "dialog", "aria-modal": "true", "aria-label": "태그" },
      h(
        "div.mari-ph-tags-head",
        null,
        h("span", null, "TAGS"),
        h(
          "button",
          {
            type: "button",
            onClick: () => {
              state.selectedTags = [];
              list.querySelectorAll("[aria-pressed]").forEach((button) => button.setAttribute("aria-pressed", "false"));
              onChange();
            },
          },
          "초기화",
        ),
        h("button", { type: "button", "aria-label": "닫기", onClick: close }, "×"),
      ),
      list,
    ),
  );
  document.addEventListener("keydown", onKey);
  document.body.append(backdrop);
}

function archiveSection(number, characters) {
  const state = { filter: "recommended", newestPages: 1, selectedTags: [], previewLimit: PHONE_PREVIEW_LIMIT };
  const tagCounts = new Map();
  for (const character of characters) for (const tag of character.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  const covers = h("div.mari-ph-covers");
  const more = h("button.mari-ph-filter.mari-ph-more", { type: "button" }, "더보기");
  const countNumber = h("span", null, pad(characters.length));
  const filterButtons = FILTERS.map((key) =>
    h(
      "button.mari-ph-filter",
      {
        type: "button",
        "aria-haspopup": key === "tags" ? "dialog" : undefined,
        onClick: () => {
          state.filter = key;
          state.newestPages = 1;
          render();
          if (key === "tags") tagPanel(state, tagCounts, render);
        },
      },
      FILTER_LABELS[key],
    ),
  );

  const archive = () => {
    const list = [...characters];
    if (state.filter === "newest") return list.sort(byNewest);
    if (state.filter === "tags") {
      return list
        .filter((character) => state.selectedTags.every((tag) => character.tags.includes(tag)))
        .sort((left, right) => Number(right.favorite) - Number(left.favorite) || byUpdated(left, right));
    }
    if (state.filter === "favorites") return list.filter((character) => character.favorite).sort(byUpdated);
    return list.sort((left, right) => Number(right.favorite) - Number(left.favorite) || byUpdated(left, right));
  };

  function render() {
    const list = archive();
    const pages = state.filter === "recommended" ? 1 : state.filter === "newest" ? state.newestPages : Infinity;
    const shown = list.slice(0, state.previewLimit * pages);
    for (const [position, key] of FILTERS.entries()) {
      const on = state.filter === key;
      filterButtons[position].setAttribute("aria-pressed", String(on));
      filterButtons[position].classList.toggle("mari-ph-filter--on", on);
    }
    countNumber.textContent = pad(list.length);
    covers.replaceChildren(...shown.map(coverCard));
    more.hidden = list.length <= shown.length;
  }

  more.addEventListener("click", () => {
    if (state.filter === "newest" && state.newestPages < NEWEST_PAGE_LIMIT) {
      state.newestPages += 1;
      render();
    } else homeMoves.allCharacters();
  });

  const phone = window.matchMedia("(max-width: 639px)");
  const measure = () => {
    const columns = getComputedStyle(covers).gridTemplateColumns.split(/\s+/).filter(Boolean).length;
    const limit = phone.matches ? PHONE_PREVIEW_LIMIT : Math.max(1, columns) * ARCHIVE_PREVIEW_ROWS;
    if (limit === state.previewLimit) return;
    state.previewLimit = limit;
    render();
  };
  new ResizeObserver(measure).observe(covers);

  render();
  return h(
    "section",
    null,
    sectionHead(number, "ARCHIVE", "전체 캐릭터"),
    h("div.mari-ph-filters", null, filterButtons, h("span.mari-ph-count", null, countNumber, h("small", null, "CHARACTERS"))),
    characters.length === 0
      ? h("button.mari-ph-go", { type: "button", onClick: homeMoves.create }, "만들기 ›")
      : [covers, more],
  );
}

function buildHome({ characters, recentChats }) {
  const byId = new Map(characters.map((character) => [character.id, character]));
  const favorites = characters.filter((character) => character.favorite).slice(0, FAVORITE_LIMIT);
  const newest = [...characters].sort(byNewest).slice(0, NEWEST_LIMIT);
  const today = new Date();
  const volume = `VOL.${pad(characters.length)}`;
  const edgeText = Array.from({ length: 30 }, () => `PRIVATE ARCHIVE ✶ ${APP_BRAND} ✶ ${volume} ✶ `).join("");
  let section = 1;

  return h(
    "div.mari-ph-page",
    null,
    h("div.mari-ph-edge", { "aria-hidden": "true" }, h("span", null, edgeText)),
    h(
      "div.mari-ph-wrap",
      null,
      h(
        "div.mari-ph-mast",
        { "aria-hidden": "true" },
        h("span", null, volume),
        h("span.mari-ph-mast-rule"),
        h("b", null, `${today.getFullYear()}.${pad(today.getMonth() + 1)}.${pad(today.getDate())}`),
      ),
      showcase(todaysPicks(characters), volume),
      h(
        "div.mari-ph-band",
        { "aria-hidden": "true" },
        [...BAND_WORDS, ...BAND_WORDS].map((word) => h("span", null, word, h("em"))),
      ),
      recentChats.length > 0 &&
        scrollRow(
          (section += 1),
          "CONTINUE",
          "이어서 대화하기",
          "mari-ph-tickets",
          recentChats.slice(0, CONTINUE_LIMIT).map((entry) => continueTicket(entry, byId)),
        ),
      newest.length > 4 && scrollRow((section += 1), "NEW ARRIVALS", "새로 추가됨", "mari-ph-strips", newest.map(newArrivalStrip)),
      favorites.length > 0 && favoritesSection((section += 1), favorites),
      archiveSection((section += 1), characters),
    ),
  );
}

function setHubMode(hub, on) {
  if (!hub) return;
  if (on && hub.dataset.malangHome === undefined) hub.dataset.malangHome = "";
  if (!on && hub.dataset.malangHome !== undefined) delete hub.dataset.malangHome;
}

function mountHome(page) {
  setHubMode(page.closest(HUB_SELECTOR), true);
  hubTabs();
  if (page.querySelector(":scope > .mari-ph")) return;
  requestHomeFonts();
  const root = h("div.mari-ph", { "data-component": "HomeFeed" });
  page.dataset.malangHomePage = "";
  page.append(root);
  let painted = "";
  const signature = (data) =>
    JSON.stringify([data.recentChats, data.characters.map((character) => [character.id, character.updatedAt, character.favorite])]);
  const paint = (data) => {
    if (root.isConnected) {
      painted = signature(data);
      for (const observer of homeRowObservers) observer.disconnect();
      homeRowObservers.clear();
      root.replaceChildren(buildHome(data));
    }
  };
  homeRepaint = () => {
    if (!root.isConnected) return;
    loadHome().then((data) => {
      if (signature(data) !== painted) paint(data);
    }, (error) => marinara.log.warn("home could not be read", error));
  };
  if (homeData) paint(homeData);
  else root.append(h("div.mari-ph-wrap", { "aria-hidden": "true" }, h("div.mari-ph-show.mari-ph-show--loading")));
  loadHome().then(paint, (error) => marinara.log.warn("home could not be read", error));
}

const LEFT_CONTROLS_SELECTOR = ".mari-topbar-left-controls";
const ICONS = {
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  sparkles:
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  create: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
};

function icon(name, size) {
  const svg = document.createElementNS(SVG_NS, "svg");
  const attributes = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.8",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
  };
  for (const [key, value] of Object.entries(attributes)) svg.setAttribute(key, value);
  svg.innerHTML = ICONS[name];
  return svg;
}

const phoneMoves = {
  home() {
    const { ui, chat } = findStores();
    chat?.getState().setActiveChatId(null);
    const state = ui?.getState();
    state?.closeAllDetails?.();
    state?.closeRightPanel();
    state?.setSidebarOpen?.(false);
    requestAnimationFrame(() => settleHubTab());
  },
  chats() {
    const state = findStores().ui?.getState();
    if (!state) return;
    if (state.sidebarOpen && !state.rightPanelOpen) return state.setSidebarOpen(false);
    if (document.documentElement.dataset.scrapbookRoom === undefined) findStores().chat?.getState().setActiveChatId(null);
    state.closeAllDetails?.();
    state.closeRightPanel();
    state.setSidebarOpen(true);
  },
  panel(key) {
    const state = findStores().ui?.getState();
    if (!state) return;
    state.closeAllDetails?.();
    state.setSidebarOpen?.(false);
    state.openRightPanel(key);
  },
  back() {
    const state = findStores().ui?.getState();
    if (!state) return;
    if (state.hasAnyDetailOpen?.()) return state.navigateBack?.() || state.closeAllDetails?.();
    phoneMoves.chats();
  },
};

const chatName = h("span.mari-ph-chat-name");

function decorateTopbar(topbar) {
  mountReferenceNav(topbar);
  if (document.documentElement.dataset.malangUi !== undefined) ensureWidgetHandle();
  const left = topbar?.querySelector(LEFT_CONTROLS_SELECTOR);
  if (!left) return;
  if (!left.querySelector(":scope > .mari-ph-brand")) {
    left.prepend(
      h("button.mari-ph-brand.mari-topbar-brand", { type: "button", "data-ph-own": "", onClick: phoneMoves.home }, APP_BRAND),
      h("button.mari-ph-back", { type: "button", "data-ph-own": "", "aria-label": "뒤로", onClick: phoneMoves.back }, icon("back", 24)),
      chatName,
    );
  }
  if (!left.querySelector(":scope > .mari-ph-nav-new")) {
    left.append(
      h("button.mari-topbar-action.mari-ph-nav-new", { type: "button", "data-ph-own": "", "aria-label": "만들기", title: "만들기", onClick: (event) => openNewMenu(event.currentTarget) }, icon("create", 15)),
    );
  }
  const nav = topbar.querySelector(".mari-topbar-panel-nav");
  if (nav && !nav.querySelector(":scope > .mari-ph-widget-button")) {
    const more = nav.querySelector(":scope > [data-topbar-more]");
    const buttons = [
      h("button.mari-topbar-action.mari-ph-widget-button", { type: "button", "data-ph-own": "", "aria-label": "위젯", title: "위젯", onClick: openWidgets }, icon("sparkles", 18)),
      h("button.mari-topbar-action.mari-ph-fold-button", { type: "button", "data-ph-own": "", "aria-label": "메뉴", title: "메뉴", "aria-haspopup": "menu", onClick: (event) => toggleFoldMenu(event.currentTarget) }, icon("menu", 20)),
    ];
    more ? more.before(...buttons) : nav.append(...buttons);
  }
  foldObserver.disconnect();
  foldObserver.observe(topbar);
}

const FOLD_PAGES = [
  ["characters", "캐릭터"],
  ["personas", "페르소나"],
  ["lorebooks", "로어북"],
  ["presets", "프리셋"],
  ["connections", "연결"],
  ["settings", "설정"],
];
const phoneQuery = window.matchMedia("(max-width: 639px)");
const foldMenu = h("div.mari-ph-fold-menu", { role: "menu", "aria-label": "페이지" });
let foldedAt = 0;

function syncFold() {
  const bar = document.querySelector(".mari-topbar");
  if (!bar || phoneQuery.matches) {
    closeFoldMenu();
    return setRootFlag("malangFold", false);
  }
  if (document.documentElement.dataset.malangFold === undefined) {
    if (bar.scrollWidth <= bar.clientWidth + 1) return;
    foldedAt = bar.scrollWidth;
    setRootFlag("malangFold", true);
  } else if (bar.clientWidth >= foldedAt) {
    closeFoldMenu();
    setRootFlag("malangFold", false);
    requestAnimationFrame(syncFold);
  }
}
const foldObserver = new ResizeObserver(syncFold);

function onFoldOutside(event) {
  if (!foldMenu.contains(event.target) && !event.target.closest?.(".mari-ph-fold-button")) closeFoldMenu();
}

function onFoldKey(event) {
  if (event.key === "Escape") closeFoldMenu();
}

function closeFoldMenu() {
  if (!foldMenu.isConnected) return;
  foldMenu.remove();
  for (const opener of document.querySelectorAll(".scrapbook-mobile-menu, .mari-ph-fold-button")) opener.setAttribute("aria-expanded", "false");
  document.removeEventListener("pointerdown", onFoldOutside, true);
  document.removeEventListener("keydown", onFoldKey);
}

function toggleFoldMenu(button) {
  if (foldMenu.isConnected) return closeFoldMenu();
  const page = document.documentElement.dataset.malangPage;
  const items = [
    ...FOLD_PAGES.map(([key, label]) => [key, label, () => phoneMoves.panel(key)]),
  ];
  foldMenu.replaceChildren(
    ...items.map(([key, label, move]) =>
      h(
        "button",
        {
          type: "button",
          role: "menuitem",
          "data-active": page === key ? "true" : undefined,
          onClick: () => {
            closeFoldMenu();
            move();
          },
        },
        h("span", null, label),
      ),
    ),
  );
  foldMenu.style.top = `${Math.round(button.closest(".mari-topbar").getBoundingClientRect().bottom) + 4}px`;
  document.body.append(foldMenu);
  button.setAttribute("aria-expanded", "true");
  document.addEventListener("pointerdown", onFoldOutside, true);
  document.addEventListener("keydown", onFoldKey);
}

const WIDGET_SHORTCUTS = [{ key: "agents", label: "Agent", icon: "sparkles", onSelect: () => phoneMoves.panel("agents") }];

ICONS.chevronUp = '<path d="m18 15-6-6-6 6"/>';
ICONS.chevronDown = '<path d="m6 9 6 6 6-6"/>';
ICONS.folderOpen =
  '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>';

const HUB_TAB_PREFIX = "marinara-home-tab-";
let hubTabsSeen = [];
let hubPackageTabs = [];
let hubTabWanted = null;
function hubTabs() {
  const list = document.querySelector('[data-component="HomeBrowserHub.TabList"]');
  if (list) {
    hubTabsSeen = [...list.querySelectorAll(`[role="tab"][id^="${HUB_TAB_PREFIX}"]`)]
      .map((tab) => ({ id: tab.id.slice(HUB_TAB_PREFIX.length), label: tab.getAttribute("aria-label") || tab.textContent.trim(), src: tab.querySelector("img")?.getAttribute("src") }))
      .filter((tab) => tab.id !== "home");
  }
  return hubTabsSeen.length ? hubTabsSeen : [{ id: "professor", label: "Mari", src: "/sprites/mari/basic/pose-profile.webp" }, ...hubPackageTabs];
}
function loadHubPackageTabs() {
  readJson("/api/capability-packages/installed")
    .then((packages) => {
      hubPackageTabs = (Array.isArray(packages) ? packages : [])
        .filter((pkg) => pkg.status === "active" && pkg.manifest?.contributions?.slots?.includes("home-browser-tab") && pkg.manifest.entrypoints?.client?.trim() && pkg.manifest.contributions.homeBrowserTab)
        .map((pkg) => {
          const tab = pkg.manifest.contributions.homeBrowserTab;
          const path = tab.iconPaths?.[0];
          const src = path ? `/api/capability-packages/${encodeURIComponent(pkg.id)}/assets/${path.split("/").map(encodeURIComponent).join("/")}?v=${encodeURIComponent(pkg.version)}` : null;
          return { id: pkg.id, label: tab.label || pkg.id, src };
        });
    })
    .catch((error) => marinara.log.warn("home tabs could not be read", error));
}
function settleHubTab(tries = 0) {
  const tab = document.getElementById(HUB_TAB_PREFIX + (hubTabWanted ?? "home"));
  if (!tab) {
    if (tries < 60) requestAnimationFrame(() => settleHubTab(tries + 1));
    else hubTabWanted = null;
    return;
  }
  hubTabWanted = null;
  if (tab.getAttribute("aria-selected") !== "true") tab.click();
}
function widgetLabel(label, id = "") {
  if (id === "professor" || /^(?:Mari\s*)?교수님$|^Professor Mari$/i.test(label)) return "Mari";
  if (/gacha[\s_-]*forge|가챠\s*포지/i.test(id + " " + label)) return "Gacha Forge";
  if (/noodle/i.test(id + " " + label)) return "Noodle";
  if (/slu[rp]*p/i.test(id + " " + label)) return "Slup";
  return label;
}
function hubTiles() {
  const rank = (tab) => (tab.id === "professor" ? 0 : /noodle/i.test(tab.id) ? 2 : /slu?r?p/i.test(tab.id) ? 3 : 4);
  return hubTabs().map((tab) => {
    const mark = tab.src ? h("img", { src: tab.src, alt: "" }) : icon("folderOpen", 20);
    return { key: "hub-" + tab.id, label: widgetLabel(tab.label, tab.id), mark, rank: rank(tab), onSelect: () => { hubTabWanted = tab.id; phoneMoves.home(); } };
  });
}

const HEADER_OWN = "[data-ph-own], [data-tour], [data-topbar-more], [data-topbar-hover-key]";
function headerExtras() {
  const topbar = document.querySelector('[data-component="TopBar"]');
  const extras = [];
  for (const button of topbar?.querySelectorAll(`${LEFT_CONTROLS_SELECTOR} button, nav[data-tour="panel-buttons"] button`) ?? []) {
    if (button.matches(HEADER_OWN)) continue;
    const label = button.getAttribute("aria-label") || button.title || button.textContent.trim() || "도구";
    const mark = button.querySelector("svg, img")?.cloneNode(true) ?? icon("folderOpen", 20);
    if (mark.tagName.toLowerCase() === "svg") { mark.setAttribute("width", "20"); mark.setAttribute("height", "20"); }
    extras.push({ key: "header-" + extras.length, label: widgetLabel(label), mark, onSelect: () => pressButton(button) });
  }
  return extras;
}

function onWidgetKey(event) {
  if (event.key === "Escape") closeWidgets();
}

let widgetCloseTimer = null;
function closeWidgets() {
  const sheet = document.querySelector(".mari-ph-widgets");
  if (!sheet || sheet.dataset.closing !== undefined) return;
  document.removeEventListener("keydown", onWidgetKey);
  sheet.dataset.closing = "";
  sheet.inert = true;
  const remove = () => { sheet.remove(); widgetCloseTimer = null; };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) remove();
  else widgetCloseTimer = marinara.setTimeout(remove, 200);
}
marinara.onCleanup(() => {
  if (widgetCloseTimer !== null) marinara.clearTimeout(widgetCloseTimer);
  document.querySelector(".mari-ph-widgets")?.remove();
  document.removeEventListener("keydown", onWidgetKey);
});

function openWidgets() {
  const existing = document.querySelector(".mari-ph-widgets");
  if (existing && existing.dataset.closing === undefined) return closeWidgets();
  if (existing) {
    marinara.clearTimeout(widgetCloseTimer);
    widgetCloseTimer = null;
    existing.remove();
  }
  const title = h("h2", null, "위젯");
  const body = h("div.mari-ph-widget-body");
  const foot = h("footer.mari-ph-widget-foot");
  const note = h("p.mari-ph-widget-note", { role: "status" });
  const panel = h(
    "section.mari-ph-widgets-panel",
    { role: "dialog", "aria-label": "위젯" },
    h("header", null, title, h("button", { type: "button", "aria-label": "닫기", onClick: closeWidgets }, icon("close", 18))),
    body,
    foot,
  );
  const footButton = (label, onClick) => h("button", { type: "button", onClick }, label);
  const show = (view) => {
    panel.dataset.view = view;
    note.textContent = "";
    if (view === "settings") {
      title.textContent = "설정";
      body.replaceChildren(settingsView());
      foot.replaceChildren(footButton("돌아가기", () => show("tiles")));
      return;
    }
    title.textContent = "위젯";
    const editing = view === "edit";
    const ordered = [
      ...WIDGET_SHORTCUTS.map((tile) => ({ ...tile, rank: 1 })),
      ...hubTiles(),
      ...headerExtras().map((tile) => ({ ...tile, rank: 5 })),
      ...caughtTiles(),
    ].sort((a, b) => a.rank - b.rank);
    const tiles = ordered.map(({ key, label, icon: name, mark, onSelect, caught }) =>
      h(
        "button.mari-ph-widget-tile",
        {
          type: "button",
          "data-widget-shortcut": key,
          "data-widget-caught": caught ? "" : undefined,
          disabled: editing && !caught,
          "aria-label": editing && caught ? `${label} 방생` : undefined,
          onClick: () => {
            if (editing) {
              releaseCaught(caught);
              return show(scrapbookSettings.caught.length ? "edit" : "tiles");
            }
            if (caught && !findCaught(caught)) {
              note.textContent = "지금 화면에 없는 버튼입니다.";
              return;
            }
            closeWidgets();
            onSelect();
          },
        },
        h("span", { "aria-hidden": "true" }, mark ?? icon(name, 20)),
        h("b", { title: label }, label),
      ),
    );
    body.replaceChildren(h("div.mari-ph-widget-tiles", null, tiles), note);
    if (editing) note.textContent = "버튼을 클릭해 등록 취소하세요.";
    foot.replaceChildren(
      ...(editing ? [] : [footButton("버튼 수집", startCatching)]),
      ...(editing || scrapbookSettings.caught.length ? [footButton(editing ? "편집 완료" : "편집", () => show(editing ? "tiles" : "edit"))] : []),
      ...(editing ? [] : [footButton("설정", () => show("settings"))]),
    );
  };
  show("tiles");
  document.body.append(
    h("div.mari-ph-widgets", { "data-component": "WidgetSheet" }, h("div.mari-ph-widgets-backdrop", { onClick: closeWidgets }), panel),
  );
  document.addEventListener("keydown", onWidgetKey);
}

const PAGE_PANELS = new Set(["characters", "personas", "lorebooks", "presets", "connections", "agents", "settings"]);
const SHELL_FLAGS = ["malangUi", "malangPage", "malangSidebar", "malangRight", "malangBack", "malangDetail", "malangFold", "scrapbookRoom"];
const unsubscribes = [];

function pageOf(ui) {
  return ui.rightPanelOpen && PAGE_PANELS.has(ui.rightPanel) && !ui.hasAnyDetailOpen?.() ? ui.rightPanel : null;
}

function setRootFlag(name, value) {
  const data = document.documentElement.dataset;
  if (value === null || value === false) {
    if (data[name] !== undefined) delete data[name];
    return;
  }
  const text = value === true ? "" : value;
  if (data[name] !== text) data[name] = text;
}

let lastMotionPage;
let pageMotionFrame = 0;
let pageMotion = null;
function animatePageChange(page) {
  if (page === lastMotionPage) return;
  lastMotionPage = page;
  cancelAnimationFrame(pageMotionFrame);
  pageMotion?.cancel();
  if (!page || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  pageMotionFrame = requestAnimationFrame(() => {
    const panel = document.querySelector(`[data-panel-key="${CSS.escape(page)}"]`);
    pageMotion = panel?.animate([{ opacity: 0.65 }, { opacity: 1 }], {
      duration: 180,
      easing: "cubic-bezier(.22,1,.36,1)",
    });
  });
}
marinara.onCleanup(() => {
  cancelAnimationFrame(pageMotionFrame);
  pageMotion?.cancel();
});

function syncShell() {
  const { ui, chat } = findStores();
  if (!ui || !chat) return;
  const state = ui.getState();
  const { activeChatId, activeChat } = chat.getState();
  const detail = Boolean(state.hasAnyDetailOpen?.());
  const page = pageOf(state);
  const back = detail || Boolean(activeChatId && !state.rightPanelOpen && !state.sidebarOpen);
  setRootFlag("malangPage", page);
  syncPageTitle(page);
  setRootFlag("malangSidebar", Boolean(state.sidebarOpen));
  setRootFlag("malangRight", Boolean(state.rightPanelOpen));
  setRootFlag("malangBack", back);
  setRootFlag("malangDetail", detail);
  setRootFlag("scrapbookRoom", Boolean(activeChatId) && !detail && !state.rightPanelOpen && !state.sidebarOpen);
  setText(chatName, detail ? "" : (activeChat?.name ?? ""));
  syncReferencePage(state, activeChatId, detail);
  animatePageChange(page);
}

let shellAttempts = 0;

function watchShell() {
  const { ui, chat } = findStores();
  if (!ui || !chat) {
    if ((shellAttempts += 1) < 40) marinara.setTimeout(watchShell, 250);
    return;
  }
  syncShell();
  unsubscribes.push(
    ui.subscribe(syncShell),
    ui.subscribe(onModalChange),
    chat.subscribe((state, previous) => {
      if (state.activeChatId !== previous.activeChatId && pageOf(ui.getState())) ui.getState().closeRightPanel();
      if (state.activeChatId !== previous.activeChatId && state.activeChatId) ui.getState().setSidebarOpen(false);
      if (state.activeChatId !== previous.activeChatId || state.activeChat !== previous.activeChat) syncShell();
    }),
  );
}

function onHomeTab(event) {
  if (!event.target.closest?.('.mari-topbar [data-topbar-hover-key="home"]')) return;
  const ui = findStores().ui?.getState();
  if (ui && pageOf(ui)) ui.closeRightPanel();
}

const PAGE_TITLES = {
  characters: [3, "CHARACTER", "캐릭터"],
  personas: [4, "PERSONA", "페르소나"],
  lorebooks: [5, "LOREBOOK", "로어북"],
  presets: [6, "PRESET", "프리셋"],
  connections: [7, "CONNECT", "연결"],
  settings: [8, "SETTINGS", "설정"],
  agents: [9, "AGENT", "에이전트"],
};
const pageTitle = h("div.mari-ph-page-title");

function syncPageTitle(page) {
  const header = document.querySelector('[data-component="RightPanel"] > .mari-right-panel-header');
  if (!header || !page) return;
  const own = header.querySelector("h2:not(.mari-ph-page-title h2)");
  const group = own?.parentElement;
  if (group && group !== pageTitle && group.dataset.malangTitleHidden === undefined) group.dataset.malangTitleHidden = "";
  if (!pageTitle.isConnected || pageTitle.parentElement !== header) group ? group.after(pageTitle) : header.prepend(pageTitle);
  const [number, english, korean] = PAGE_TITLES[page] ?? [0, page.toUpperCase(), ""];
  if (pageTitle.dataset.page === page) return;
  pageTitle.dataset.page = page;
  pageTitle.replaceChildren(
    h("h2", null, h("b", null, pad(number)), h("span.mari-ph-page-title-en", null, ` ${english}`)),
    h("span.mari-ph-page-title-ko", null, korean),
    h("span.mari-ph-sh-fill", { "aria-hidden": "true" }),
  );
}

function onHomeSeen(event) {
  if (event.animationName !== SEEN_ANIMATION) return;
  const target = event.target;
  if (onLibrarySeen(target)) return;
  if (target.matches('[data-component="RightPanel"] > .mari-right-panel-header')) {
    syncPageTitle(document.documentElement.dataset.malangPage ?? null);
  }
  else if (target.matches(HOME_SELECTOR)) mountHome(target);
  else if (target.matches(".mari-topbar")) decorateTopbar(target);
  else if (target.parentElement?.matches(HUB_CONTENT_SELECTOR)) setHubMode(target.closest(HUB_SELECTOR), false);
}

const referenceButtons = new Map();
const referenceMobileButtons = new Map();
let closeMenu = null;
let menuAnchor = null;
function openMenu(anchor, items, align = "end") {
  if (closeMenu) {
    const same = menuAnchor === anchor;
    closeMenu();
    if (same) return;
  }
  menuAnchor = anchor;
  if (!anchor) return;
  const box = anchor.getBoundingClientRect();
  const menu = h(
    "div.scrapbook-menu",
    { role: "menu" },
    items.filter(Boolean).map((item) => {
      const button = h(
        `button${item.danger ? ".scrapbook-menu-danger" : ""}`,
        {
          type: "button",
          role: "menuitem",
          onClick: () => {
            closeMenu?.();
            item.onClick();
          },
        },
        profileIcon(item.icon, 15),
        h("span", null, item.label),
      );
      return button;
    }),
  );
  const onPointer = (event) => {
    if (!menu.contains(event.target) && !anchor.contains(event.target)) closeMenu?.();
  };
  const onKey = (event) => {
    if (event.key === "Escape") closeMenu?.();
  };
  closeMenu = () => {
    document.removeEventListener("pointerdown", onPointer, true);
    document.removeEventListener("keydown", onKey);
    removeEventListener("resize", closeMenu);
    menu.remove();
    closeMenu = null;
  };
  document.addEventListener("pointerdown", onPointer, true);
  document.addEventListener("keydown", onKey);
  addEventListener("resize", closeMenu);
  document.body.append(menu);
  const size = menu.getBoundingClientRect();
  const left = align === "end" ? box.right - size.width : box.left;
  const top = box.bottom + 4 + size.height > innerHeight - 8 ? box.top - 4 - size.height : box.bottom + 4;
  menu.style.left = `${Math.round(Math.min(Math.max(8, left), innerWidth - size.width - 8))}px`;
  menu.style.top = `${Math.round(Math.max(8, top))}px`;
  menu.querySelector("button")?.focus();
}
marinara.onCleanup(() => closeMenu?.());

function askDialog({ title, message, confirmLabel = "확인", danger = false, value = null }) {
  return new Promise((resolve) => {
    const input = value === null ? null : h("input.scrapbook-ask-input", { type: "text", "aria-label": title });
    if (input) input.value = value;
    const dismissed = input ? null : false;
    const finish = (result) => {
      resolve(result);
      if (dialog.open) dialog.close();
    };
    const ok = h(`button.scrapbook-ask-ok${danger ? ".scrapbook-ask-danger" : ""}`, { type: "button", onClick: () => finish(input ? input.value.trim() : true) }, confirmLabel);
    const dialog = h(
      "dialog.scrapbook-ask",
      { "aria-label": title },
      h("header", null, h("strong", null, title), h("button", { type: "button", "aria-label": "닫기", onClick: () => finish(dismissed) }, "×")),
      message && h("p", null, message),
      input,
      h("footer", null, h("button", { type: "button", onClick: () => finish(dismissed) }, "취소"), ok),
    );
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      finish(dismissed);
    });
    input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.isComposing) ok.click();
    });
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    document.body.append(dialog);
    dialog.showModal();
    (input ?? ok).focus();
    input?.select();
  });
}

function startChatAndShow(character, mode) {
  return startChatFrom(character, mode).then(
    () => {
      const ui = findStores().ui?.getState();
      ui?.closeAllDetails?.();
      ui?.closeRightPanel();
      ui?.setSidebarOpen?.(false);
    },
    (error) => marinara.log.warn("chat could not be started", error),
  );
}

function openNewMenu(anchor) {
  openMenu(
    anchor,
    PROFILE_MODES.map(({ mode, label, icon: iconName }) => ({ label, icon: iconName, onClick: () => startChatAndShow(null, mode) })),
    "start",
  );
}

function mountReferenceNav(topbar) {
  if (!topbar || topbar.querySelector('.scrapbook-nav')) return;
  const nav = h('nav.scrapbook-nav', { 'aria-label': '페이지 탐색' });
  const items = [['home','HOME',phoneMoves.home], ['chats','CHAT',phoneMoves.chats],
    ['characters','CHARACTER'], ['lorebooks','LOREBOOK'],
    ['presets','PRESET'], ['connections','CONNECT'], ['settings','SETTINGS']];
  for (const [key,label,action] of items) {
    const button = h('button', {type:'button','data-page':key,onClick:() => {
      
      (action ?? (() => phoneMoves.panel(key)))();
    }},label);
    referenceButtons.set(key,button);
    nav.append(button);
  }
  const svg = (paths) => {
    const node = icon('close',20); node.innerHTML = paths; return node;
  };
  const actions = h('div.scrapbook-nav-actions', null,
    h('button',{type:'button','aria-label':'검색',onClick:()=>findStores().ui?.getState().setOmnibarOpen(true)},
      svg('<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>')),
    h('button',{type:'button','aria-label':'페르소나',onClick:()=>phoneMoves.panel('personas')},
      svg('<path d="M3 6q4-2 9 2 5-4 9-2v8q-4 0-9 5-5-5-9-5Z"/><path d="m6 10 3 1m6 0 3-1"/>')),
    h('button',{type:'button','aria-label':'테마 전환',onClick:()=>{const s=findStores().ui?.getState();s?.setTheme(s.theme==='dark'?'light':'dark');}},
      svg('<path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z"/>')),
    h('button.scrapbook-mobile-menu',{type:'button','aria-label':'메뉴','aria-haspopup':'menu',onClick:e=>toggleFoldMenu(e.currentTarget)},icon('menu',20)));
  topbar.append(h('div.scrapbook-header',null,
    h('button.scrapbook-brand',{type:'button',onClick:phoneMoves.home},'M.E.'),nav,actions));
  const shortcuts = h('nav.scrapbook-header-shortcuts', {'aria-label':'홈 및 채팅'});
  for (const [key,label,action,paths] of [
      ['home','홈',phoneMoves.home,'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'],
      ['chats','채팅',phoneMoves.chats,'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7M17 12H7"/>'],
  ]) {
    const button = h('button', {type:'button','aria-label':label,onClick:action}, svg(paths));
    referenceMobileButtons.set(key,button); shortcuts.append(button);
  }
  topbar.querySelector('.scrapbook-brand').after(shortcuts);
  ensureWidgetHandle();
}
function ensureWidgetHandle() {
  if (document.querySelector('.scrapbook-widget-handle')) return;
  const handle = h('button.scrapbook-widget-handle', { type: 'button', 'aria-label': '위젯' }, '‹');
  const saved = Number(localStorage.getItem('scrapbook-widget-handle-top'));
  if (saved > 0 && saved < 1) handle.style.top = `${saved * 100}%`;
  let drag = null;
  let dragged = false;
  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const rect = handle.getBoundingClientRect();
    drag = { id: event.pointerId, y: event.clientY, center: rect.top + rect.height / 2, moved: false };
    dragged = false;
    try { handle.setPointerCapture(event.pointerId); } catch {}
  });
  handle.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.abs(dy) < 6) return;
    drag.moved = true;
    const half = handle.offsetHeight / 2 + 8;
    const center = Math.min(Math.max(drag.center + dy, half), window.innerHeight - half);
    handle.style.top = `${(center / window.innerHeight) * 100}%`;
  });
  const end = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    if (drag.moved) {
      dragged = true;
      try { localStorage.setItem('scrapbook-widget-handle-top', String(parseFloat(handle.style.top) / 100)); } catch {}
    }
    drag = null;
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
  handle.addEventListener('click', () => {
    if (dragged) dragged = false;
    else openWidgets();
  });
  document.body.append(handle);
}
const chatVeil = h('div.scrapbook-chat-veil',{'aria-hidden':'true',onClick:()=>findStores().ui?.getState().setSidebarOpen(false)});
function syncReferencePage(state, activeChatId, detail) {
  const visible = Boolean(state.sidebarOpen && !state.rightPanelOpen && !detail);
  setRootFlag('scrapbookChats',visible && !activeChatId);
  setRootFlag('scrapbookDrawer',visible && Boolean(activeChatId));
  if (visible && activeChatId) {
    const shell = document.querySelector('[data-component="AppShell"]') ?? document.body;
    if (chatVeil.parentElement !== shell) shell.append(chatVeil);
  }
  else chatVeil.remove();
  const active = pageOf(state) ?? (visible ? 'chats' : activeChatId || detail ? null : 'home');
  for (const [key,button] of referenceButtons) button.setAttribute('aria-current', key===active?'page':'false');
  for (const [key,button] of referenceMobileButtons) button.setAttribute('aria-current', key===active?'page':'false');
}
marinara.onCleanup(()=>{
  chatVeil.remove();
  document.querySelectorAll('.scrapbook-header,.scrapbook-widget-handle,.scrapbook-bottom-nav').forEach(n=>n.remove());
  delete document.documentElement.dataset.scrapbookChats;
  delete document.documentElement.dataset.scrapbookDrawer;
});
requestHomeFonts();
document.documentElement.dataset.malangUi = "";
document.addEventListener("animationstart", onHomeSeen, true);
for (const page of document.querySelectorAll(HOME_SELECTOR)) mountHome(page);
decorateTopbar(document.querySelector(".mari-topbar"));
document.addEventListener("click", onHomeTab, true);
phoneQuery.addEventListener("change", syncFold);
watchShell();

marinara.onCleanup(() => {
  document.removeEventListener("animationstart", onHomeSeen, true);
  document.removeEventListener("click", onHomeTab, true);
  phoneQuery.removeEventListener("change", syncFold);
  foldObserver.disconnect();
  closeFoldMenu();
  closeWidgets();
  for (const unsubscribe of unsubscribes.splice(0)) unsubscribe();
  for (const flag of SHELL_FLAGS) delete document.documentElement.dataset[flag];
  document
    .querySelectorAll(".mari-ph, .mari-ph-tags-backdrop, .mari-ph-nav-new, .mari-ph-widget-button, .mari-ph-fold-button, .mari-ph-brand, .mari-ph-back, .mari-ph-chat-name, .mari-ph-page-title")
    .forEach((node) => node.remove());
  document.querySelectorAll("[data-malang-title-hidden]").forEach((node) => delete node.dataset.malangTitleHidden);
  document.querySelectorAll("[data-malang-home]").forEach((node) => delete node.dataset.malangHome);
  document.querySelectorAll("[data-malang-home-page]").forEach((node) => delete node.dataset.malangHomePage);
});

const COVER_WAIT_MS = 1500;
const PROFILE_MODES = [
  { mode: "conversation", label: "대화", icon: "message" },
  { mode: "roleplay", label: "롤플레이", icon: "book" },
  { mode: "game", label: "게임", icon: "gamepad" },
];
const DETAIL_SECTIONS = [
  ["description", "설명"],
  ["personality", "성격"],
  ["scenario", "시나리오"],
  ["firstMessage", "첫 메시지"],
  ["creatorNotes", "제작자 노트"],
];
const PROFILE_ICONS = {
  gamepad:
    '<line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="2"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  pencil:
    '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  plus: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M8 12h8"/><path d="M12 8v8"/>',
  message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};

function profileIcon(name, size, className) {
  const svg = document.createElementNS(SVG_NS, "svg");
  for (const [key, value] of Object.entries({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
  })) {
    svg.setAttribute(key, value);
  }
  if (className) svg.setAttribute("class", className);
  svg.innerHTML = PROFILE_ICONS[name];
  return svg;
}

const formatDate = (value) => (value ? new Intl.DateTimeFormat("ko", { dateStyle: "medium" }).format(new Date(value)) : "");

let queryClient = null;

function findQueryClient() {
  if (queryClient) return queryClient;
  const rootElement = document.getElementById("root");
  const containerKey = rootElement && Object.keys(rootElement).find((key) => key.startsWith("__reactContainer$"));
  const stack = containerKey ? [rootElement[containerKey]] : [];
  while (stack.length && !queryClient) {
    const fiber = stack.pop();
    if (!fiber) continue;
    if (typeof fiber.memoizedProps?.client?.invalidateQueries === "function") queryClient = fiber.memoizedProps.client;
    if (fiber.sibling) stack.push(fiber.sibling);
    if (fiber.child) stack.push(fiber.child);
  }
  return queryClient;
}

function refreshChatLists() {
  void findQueryClient()?.invalidateQueries({ queryKey: ["chats"] });
  void findQueryClient()?.invalidateQueries({ queryKey: ["home-feed"] });
  homeData = null;
}

async function startChatFrom(character, mode) {
  const label = mode === "conversation" ? "Conversation" : mode === "game" ? "Game" : "Roleplay";
  const presets = mode === "game" ? [] : await readJson(`/api/chat-presets?mode=${mode}`).catch(() => []);
  const starred = (Array.isArray(presets) ? presets : []).find(
    (preset) => preset.mode === mode && preset.isActive && !preset.isDefault,
  );
  const response = await marinara.fetch("/api/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: character?.name ? `${character.name} - ${label}` : `New ${label}`,
      mode,
      characterIds: character ? [character.id] : [],
      connectionId: starred?.settings?.connectionId ?? undefined,
      promptPresetId: starred?.settings?.promptPresetId ?? undefined,
    }),
  });
  if (!response.ok) throw new Error(`/api/chats (${response.status})`);
  const chat = await response.json();
  findQueryClient()?.setQueryData(["chats", "detail", chat.id], chat);
  refreshChatLists();
  const chatStore = findStores().chat?.getState();
  chatStore?.setActiveChatId(chat.id);
  chatStore?.setShouldOpenSettings?.(true);
  chatStore?.setShouldOpenWizard?.(true);
  chatStore?.setShouldOpenWizardInShortcutMode?.(false);
  if (starred) {
    await marinara
      .fetch(`/api/chat-presets/${encodeURIComponent(starred.id)}/apply/${encodeURIComponent(chat.id)}`, { method: "POST" })
      .catch(() => undefined);
    void findQueryClient()?.invalidateQueries({ queryKey: ["chats", "detail", chat.id] });
  }
}

let closeProfile = null;

function profileLoad(character) {
  const picture = character.avatarPath
    ? new Promise((resolve) => {
        const image = new Image();
        image.src = character.avatarPath;
        image.decode().then(resolve, resolve);
      })
    : Promise.resolve();
  const color = character.avatarPath ? sampleAccent(character.avatarPath) : Promise.resolve(null);
  const wait = new Promise((resolve) => setTimeout(resolve, COVER_WAIT_MS));
  return Promise.race([Promise.all([picture, color]), wait]).then(() => color);
}

async function openProfile(characterId, characterName = "") {
  closeProfile?.();
  const token = {};
  closeProfile = () => {
    token.closed = true;
  };
  const [catalog, chats] = await Promise.all([
    homeData?.characters ?? loadCatalog(),
    readJson("/api/chats").catch(() => []),
  ]);
  if (token.closed) return;
  const character = catalog.find((entry) => entry.id === characterId) ?? {
    id: characterId,
    name: characterName,
    tags: [],
  };
  const color = await profileLoad(character);
  if (token.closed) return;
  const fileNumber = pad(Math.max(0, catalog.findIndex((entry) => entry.id === characterId)) + 1);
  const characterChats = (Array.isArray(chats) ? chats : [])
    .filter((chat) => chat.characterIds?.includes(characterId))
    .sort((left, right) => (right.updatedAt ?? "").localeCompare(left.updatedAt ?? ""));
  showProfile({ character, color, fileNumber, characterChats });
}

function showProfile({ character, color, fileNumber, characterChats }) {
  const name = character.name ?? "";
  const coverLine = (character.comment || character.explicitSummary || character.creatorNotes || "").trim();
  const state = { tab: "chat", choosingMode: false, starting: false, selecting: false, picked: new Set(), confirming: false };

  const leave = () => {
    const ui = findStores().ui?.getState();
    ui?.closeAllDetails?.();
    ui?.closeRightPanel();
    close();
  };
  const onKey = (event) => {
    if (event.key === "Escape" && !event.isComposing) close();
  };
  function close() {
    document.removeEventListener("keydown", onKey);
    overlay.remove();
    if (closeProfile === close) closeProfile = null;
  }

  const launcher = () => {
    if (state.choosingMode) {
      return h(
        "div.mari-pf-launcher",
        null,
        PROFILE_MODES.map(({ mode, label, icon: iconName }) =>
          h(
            "button.mari-pf-button.mari-pf-button--primary",
            {
              type: "button",
              disabled: state.starting,
              onClick: () => {
                state.starting = true;
                render();
                startChatFrom(character, mode).then(leave, (error) => {
                  state.starting = false;
                  render();
                  marinara.log.warn("chat could not be started", error);
                });
              },
            },
            profileIcon(iconName, 14),
            label,
          ),
        ),
        h(
          "button.mari-pf-cancel",
          {
            type: "button",
            "aria-label": "취소",
            onClick: () => {
              state.choosingMode = false;
              render();
            },
          },
          profileIcon("x", 15),
        ),
      );
    }
    return h(
      "div.mari-pf-launcher",
      null,
      h(
        "button.mari-pf-button",
        {
          type: "button",
          onClick: () => {
            close();
            findStores().ui?.getState().openCharacterDetail(character.id);
          },
        },
        profileIcon("pencil", 14),
        "편집",
      ),
      h(
        "button.mari-pf-button.mari-pf-button--primary",
        {
          type: "button",
          onClick: () => {
            state.choosingMode = true;
            render();
          },
        },
        profileIcon("plus", 14),
        "새 대화",
      ),
    );
  };

  const deletePicked = async () => {
    const ids = [...state.picked];
    state.confirming = false;
    state.starting = true;
    render();
    for (const id of ids) {
      await marinara.fetch(`/api/chats/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => undefined);
    }
    const chatStore = findStores().chat?.getState();
    if (chatStore && ids.includes(chatStore.activeChatId)) chatStore.setActiveChatId(null);
    refreshChatLists();
    characterChats.splice(0, characterChats.length, ...characterChats.filter((chat) => !ids.includes(chat.id)));
    state.starting = false;
    state.selecting = false;
    state.picked = new Set();
    render();
  };

  const chatList = () => {
    if (characterChats.length === 0) return null;
    return h(
      "div.mari-hud-chats.mari-pf-chats",
      null,
      h(
        "div.mari-pf-chats-head",
        null,
        h("h4", null, "대화 이어가기"),
        h(
          "button.mari-pf-select",
          {
            type: "button",
            onClick: () => {
              state.selecting = !state.selecting;
              state.picked = new Set();
              state.confirming = false;
              render();
            },
          },
          state.selecting ? "완료" : "선택",
        ),
      ),
      characterChats.map((chat) => {
        const picked = state.picked.has(chat.id);
        const toggle = () => {
          if (picked) state.picked.delete(chat.id);
          else state.picked.add(chat.id);
          render();
        };
        return h(
          "button.mari-pf-chat",
          {
            type: "button",
            onClick: () => {
              if (state.selecting) return toggle();
              findStores().chat?.getState().setActiveChatId(chat.id);
              leave();
            },
          },
          state.selecting
            ? h(
                `span.mari-pf-check${picked ? ".mari-pf-check--on" : ""}`,
                { role: "checkbox", "aria-checked": String(picked), "aria-label": "선택" },
                profileIcon("check", 14),
              )
            : profileIcon(chat.mode === "roleplay" ? "book" : "message", 16, `mari-pf-chat-icon mari-pf-chat-icon--${chat.mode}`),
          h(`span.mari-pf-mode.mari-pf-mode--${chat.mode === "roleplay" ? "roleplay" : "conversation"}`, null, chat.mode === "roleplay" ? "롤플레이" : "대화"),
          h("span.mari-pf-chat-name", null, chat.name),
          h("span.mari-pf-chat-date", null, formatDate(chat.updatedAt)),
        );
      }),
      state.selecting &&
        h(
          "div.mari-pf-selection",
          null,
          h("span", null, state.confirming ? `채팅 ${state.picked.size}개를 삭제할까요? 되돌릴 수 없습니다.` : `${state.picked.size}개 선택됨`),
          state.confirming &&
            h(
              "button.mari-pf-select",
              {
                type: "button",
                onClick: () => {
                  state.confirming = false;
                  render();
                },
              },
              "취소",
            ),
          h(
            "button.mari-pf-delete",
            {
              type: "button",
              disabled: state.picked.size === 0 || state.starting,
              onClick: () => {
                if (!state.confirming) {
                  state.confirming = true;
                  return render();
                }
                void deletePicked();
              },
            },
            "삭제",
          ),
        ),
    );
  };

  const chatTab = () => [
    h(
      "div.mari-pf-headline",
      null,
      h("div.mari-pf-title-row", null, h("h3", null, name), h("div.mari-pf-desktop-launcher", null, launcher())),
      h(
        "div.mari-hud-stats.mari-pf-stats",
        null,
        character.favorite && h("span.mari-pf-fav", null, profileIcon("star", 15)),
        h("span", null, profileIcon("message", 15), String(characterChats.length)),
        character.tokenEstimate > 0 && h("span", null, `${character.tokenEstimate} 토큰`),
      ),
    ),
    character.tags.length > 0 &&
      h(
        "div.mari-hud-tags.mari-pf-tags",
        { tabIndex: 0, "aria-label": "태그" },
        character.tags.map((tag) => h("span", null, tag)),
      ),
    character.createdAt &&
      h("p.mari-pf-dates", null, `생성 ${formatDate(character.createdAt)} · 수정 ${formatDate(character.updatedAt)}`),
    chatList(),
  ];

  const detailTab = () => {
    const sections = DETAIL_SECTIONS.filter(([key]) => character[key]?.trim());
    if (sections.length === 0) return h("p.mari-pf-empty", null, "이 캐릭터에는 아직 세부 정보가 없습니다.");
    return sections.map(([key, label]) => h("div.mari-hud-report", null, h("h4", null, label), h("p", null, character[key])));
  };

  const section = h("section.mari-pf-section");
  const mobileActions = h("div.mari-pf-mobile-actions", { "data-profile-mobile-actions": "" });

  function render() {
    const tabs = h(
      "div.mari-hud-tabs",
      { role: "tablist" },
      [
        ["chat", "대화"],
        ["details", "세부 정보"],
      ].map(([key, label]) =>
        h(
          "button",
          {
            type: "button",
            role: "tab",
            "aria-selected": String(state.tab === key),
            onClick: () => {
              state.tab = key;
              render();
            },
          },
          label,
        ),
      ),
    );
    section.replaceChildren(tabs, ...[state.tab === "chat" ? chatTab() : detailTab()].flat().filter(Boolean));
    mobileActions.hidden = state.selecting;
    mobileActions.replaceChildren(launcher());
  }

  const cover = h(
    "div.mari-profile-cover",
    { style: { "background-color": color || "#625652" } },
    h("span.mari-profile-cover-giant", { "aria-hidden": "true" }, name.toUpperCase()),
    character.avatarPath && h("span.mari-profile-cover-art", null, cropCoverImage(character.avatarPath, character.avatarCrop)),
    h("span.mari-profile-cover-sky", { "aria-hidden": "true" }),
    h(
      "div.mari-profile-cover-copy",
      null,
      h("span.mari-profile-cover-label", null, `${APP_BRAND} ARCHIVE / CHARACTER ${fileNumber}`),
      h("span.mari-profile-cover-star", { "aria-hidden": "true" }, "✦"),
      h("h2", null, name),
      coverLine && h("p", null, coverLine),
      character.creator && h("small", null, `@${character.creator}`),
    ),
    h("span.mari-profile-cover-side", { "aria-hidden": "true" }, "YOUR NEXT STORY STARTS HERE"),
  );

  const overlay = h(
    "div.mari-pf-modal",
    { role: "dialog", "aria-modal": "true", "aria-label": name },
    h("div.mari-pf-backdrop", { onClick: close }),
    h(
      "div.mari-pf-panel.mari-profile-panel",
      null,
      h(
        "div.mari-pf-header",
        null,
        h("h2", null, name),
        h("button", { type: "button", "aria-label": `닫기 ${name}`, onClick: close }, profileIcon("x", 16)),
      ),
      h(
        "div.mari-pf-content",
        null,
        h(
          "div",
          { "data-component": "CharacterProfile", "data-hud": "", "data-cover-preview": "" },
          cover,
          section,
          mobileActions,
        ),
      ),
    ),
  );

  render();
  document.addEventListener("keydown", onKey);
  document.body.append(overlay);
  closeProfile = close;
}

function onModalChange(state) {
  if (state.modal?.type !== "start-character-chat") return;
  const { characterId = "", characterName = "" } = state.modal.props ?? {};
  state.closeModal();
  if (characterId) void openProfile(characterId, characterName);
}

function onCoverClick(event) {
  const row = event.target.closest?.('[data-malang-gallery] > :is([data-character-id], [data-touch-drag-card="character"])');
  if (!row || row.querySelector(':scope > button, input[type="checkbox"], [role="checkbox"]')) return;
  const characterId = row.dataset.characterId ?? row.dataset.dragId;
  if (!characterId) return;
  event.preventDefault();
  event.stopPropagation();
  void openProfile(characterId, row.querySelector("[data-ph-card-title]")?.textContent ?? "");
}

document.addEventListener("click", onCoverClick, true);
marinara.onCleanup(() => {
  document.removeEventListener("click", onCoverClick, true);
  closeProfile?.();
  document.querySelectorAll(".mari-pf-modal").forEach((node) => node.remove());
});

const CHARACTERS_ROOT_SELECTOR = '[data-component="CharactersPanelScroll"]';
const LIBRARY_PANELS = new Set(["personas", "presets", "lorebooks", "connections", "agents"]);
const CHARACTER_CARD_SELECTOR = `${CHARACTERS_ROOT_SELECTOR} :is([data-character-id], [data-character-folder-id] [data-touch-drag-card="character"])`;
const CHARACTER_FOLDER_HEAD_SELECTOR = `${CHARACTERS_ROOT_SELECTOR} [data-character-folder-id] > [role="button"]`;
const PERSONA_ROW_SELECTOR = '[data-panel-key="personas"] [data-touch-drag-card]';
const PLAIN_LISTS = new Set(["presets", "connections", "agents"]);
const AGENT_MODE_LABELS = { All: "전체", Conversation: "대화", Roleplay: "롤플", Game: "게임" };
const LIBRARY_ICONS = {
  back: '<path d="m15 18-6-6 6-6"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  hash: '<line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
};

function libraryIcon(name, size) {
  const node = document.createElementNS(SVG_NS, "svg");
  const attributes = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
  };
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  node.innerHTML = LIBRARY_ICONS[name];
  return node;
}

function libraryRootOf(node) {
  const characters = node.closest?.(CHARACTERS_ROOT_SELECTOR);
  if (characters) return characters;
  const panel = node.closest?.("[data-panel-key]");
  if (!panel || !LIBRARY_PANELS.has(panel.dataset.panelKey)) return null;
  let root = node;
  while (root && root.parentElement !== panel) root = root.parentElement;
  return root;
}

function rowKind(row) {
  if (row.matches(".mari-ph-folder-bar, .mari-ph-tabs")) return null;
  if (row.matches("input")) return "hidden";
  if (row.parentElement?.dataset.malangLibrary === "agents") {
    if (row.matches("button") && row.querySelector(".lucide-sparkles")) return "agent-download";
    if (row.querySelector(".lucide-dices, .lucide-grid3x3, .lucide-grid-3x3")) return "agent-rules";
  }
  if (/LibraryActions$/.test(row.dataset.component ?? "")) return "library";
  if (row.matches('[aria-hidden="true"]') && !row.firstElementChild && row.nextElementSibling?.matches(".mari-selection-action-bar")) return "bar-spacer";
  if (row.querySelector("[data-preset-regex-root]") || row.querySelector(":scope > div > button .lucide-regex")) return "regex";
  if (row.querySelector(":scope > div > button .lucide-wrench")) return "tools";
  if (row.querySelector(".mari-folder-helper, .lucide-folder-plus")) return "newfolder";
  if (row.querySelector(':scope > [data-drag-kind$="folder"]')) return "folders";
  if (row.querySelector(":scope > [data-touch-drag-card], :scope > [data-character-id]")) return "cards";
  if (row.querySelector(':scope > * > input:not([type="hidden"])')) return "search";
  if (row.querySelector(":scope > .mari-panel-gradient-button")) return "actions";
  if (row.querySelector(":scope > svg") && !row.querySelector("button, input, select, a") && row.textContent.trim()) return "heading";
  if (row.querySelector('[data-drag-kind$="folder"], [data-touch-drag-card]')) return "section";
  if (row.querySelector(":scope > button[aria-pressed]") || (row.children.length > 0 && [...row.children].every((child) => child.tagName === "BUTTON" || (child.children.length === 1 && child.firstElementChild.tagName === "BUTTON")))) return "tags";
  return "other";
}

const libraryObservers = new Map();
marinara.onCleanup(() => {
  for (const observer of libraryObservers.values()) observer.disconnect();
  libraryObservers.clear();
});
function syncFolderBar(root) {
  if (root.dataset.malangOpenFolder === undefined) return;
  const head = openFolderHead(root);
  if (!head || head.getAttribute('aria-expanded') !== 'true') return closeOpenFolder(root);
  const bar = folderBarOf(root);
  const name = head.querySelector('[data-ph-cfolder-name] > div') ?? head.querySelector('[data-ph-cfolder-name]');
  if (name) setText(bar.querySelector('b'), name.textContent ?? '');
  setText(bar.querySelector('span'), head.querySelector('[data-folder-item-count="inline"]')?.textContent ?? '');
}
function classifyLibrary(root) {
  if (!root) return;
  if (!libraryObservers.has(root)) {
    for (const [node, observer] of libraryObservers) if (!node.isConnected) {
      observer.disconnect(); libraryObservers.delete(node);
    }
    const observer = new MutationObserver(() => queueLibrary(root));
    observer.observe(root, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['aria-expanded'] });
    libraryObservers.set(root, observer);
  }
  const kind = root.matches(CHARACTERS_ROOT_SELECTOR) ? "characters" : root.parentElement?.dataset.panelKey;
  if (root.dataset.malangLibrary !== kind) root.dataset.malangLibrary = kind;
  for (const row of root.children) {
    const rowName = rowKind(row);
    if (rowName && row.dataset.malangRow !== rowName) row.dataset.malangRow = rowName;
    if (rowName) tagLibraryRow(row, rowName);
  }
  if (kind === "characters") {
    folderBarOf(root);
    syncFolderBar(root);
    for (const card of root.querySelectorAll('[data-touch-drag-card="character"]')) tagCard(card, characterMeta?.get(card.dataset.dragId)?.name);
  }
  if (kind === "presets") presetTabsOf(root);
  if (PLAIN_LISTS.has(kind)) markPlainList(root);
  else if (kind !== "characters") root.querySelectorAll('[data-drag-kind$="folder"]').forEach(markFolder);
  if (kind === "lorebooks") {
    for (const card of root.querySelectorAll('[data-touch-drag-card="lorebook"]')) {
      for (const child of card.children) {
        const actions = child.tagName === "DIV" && Boolean(child.querySelector(".lucide-trash-2, .lucide-trash2"));
        setFlag(child, "phLoreActions", actions);
        setFlag(child, "phLoreText", child.tagName === "DIV" && !actions);
      }
    }
  }
  for (const camera of root.querySelectorAll(".lucide-camera")) {
    const cover = camera.parentElement;
    if (cover?.tagName === "SPAN" && cover.parentElement?.tagName === "BUTTON") markPart(cover, "phCam");
  }
}

let characterMeta = null;
let characterMetaAt = 0;
let characterMetaLoading = null;

function loadCharacterMeta() {
  watchCharacterSaves();
  if (characterMetaLoading || Date.now() - characterMetaAt < 60_000) return characterMetaLoading;
  characterMetaLoading = Promise.all([loadCatalog(), readJson("/api/chats").catch(() => [])])
    .then(([catalog, chats]) => {
      const counts = new Map();
      for (const chat of Array.isArray(chats) ? chats : []) {
        for (const id of chat.characterIds ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      characterMeta = new Map(
        catalog.map((character) => [
          character.id,
          {
            line: blurb(character),
            tokens: character.tokenEstimate ?? 0,
            chats: counts.get(character.id) ?? 0,
            avatar: character.avatarPath ?? null,
            name: (character.name ?? "").trim(),
          },
        ]),
      );
      characterMetaAt = Date.now();
      document.querySelectorAll(CHARACTER_CARD_SELECTOR).forEach(decorateCharacterCard);
      document.querySelectorAll(CHARACTER_FOLDER_HEAD_SELECTOR).forEach(decorateCharacterFolder);
    })
    .catch((error) => marinara.log.warn("character list details could not be read", error))
    .finally(() => {
      characterMetaLoading = null;
    });
  return characterMetaLoading;
}

function decorateCharacterCard(card) {
  const list = card.parentElement;
  if (list && list.dataset.malangGallery === undefined) {
    list.dataset.malangGallery = "";
    queueLibrary(libraryRootOf(card));
  }
  const id = card.dataset.characterId ?? card.dataset.dragId;
  const meta = id && characterMeta?.get(id);
  tagCard(card, meta?.name);
  if (!meta) return void loadCharacterMeta();
  const { text, title } = tagCard(card, meta.name);
  if (text && title) {
    let line = text.querySelector(":scope > .mari-ph-card-line");
    if (!line) {
      line = h("div.mari-ph-card-line");
      title.after(line);
    }
    if (line.textContent !== meta.line) line.textContent = meta.line;
  }
  let stats = card.querySelector(":scope > .mari-ph-card-stats");
  if (!stats) {
    stats = h(
      "span.mari-ph-card-stats",
      { "data-card-stats": "", "aria-hidden": "true" },
      h("span", null, libraryIcon("hash", 10), h("b")),
      h("span", null, libraryIcon("chat", 10), h("b")),
    );
    card.append(stats);
  }
  const [tokens, chats] = stats.querySelectorAll("b");
  setText(tokens, compactNumber.format(meta.tokens));
  setText(chats, String(meta.chats));
}

function decorateCharacterFolder(head) {
  tagFolderHead(head, "phCfolder");
  const pictures = [...head.parentElement.querySelectorAll('[data-touch-drag-card="character"]')]
    .map((member) => characterMeta?.get(member.dataset.dragId)?.avatar ?? member.querySelector(".mari-avatar-placeholder img")?.getAttribute("src"))
    .filter(Boolean)
    .slice(0, 4);
  if (!characterMeta) void loadCharacterMeta();
  const collage = head.querySelector(":scope > .mari-ph-folder-collage") ?? h("span.mari-ph-folder-collage", { "aria-hidden": "true" });
  const key = pictures.join("|");
  if (collage.dataset.pictures === key && collage.isConnected) return;
  collage.dataset.pictures = key;
  collage.dataset.count = String(pictures.length);
  collage.replaceChildren(
    ...(pictures.length ? pictures.map((src) => h("span", null, h("img", { src, alt: "", loading: "lazy", draggable: false }))) : [personIcon(32)]),
  );
  if (!collage.isConnected) head.prepend(collage);
}

function folderBarOf(root) {
  let bar = root.querySelector(":scope > .mari-ph-folder-bar");
  if (bar) return bar;
  const head = () => openFolderHead(root);
  bar = h(
    "div.mari-ph-folder-bar",
    null,
    h("button", { type: "button", "aria-label": "전체로 돌아가기", onClick: () => leaveOpenFolder(root) }, libraryIcon("back", 16)),
    h("b", { title: "폴더 이름 변경", onClick: () => startFolderRename(root) }),
    h("span"),
    h("button", { type: "button", "aria-label": "폴더 이름 변경", onClick: () => startFolderRename(root) }, libraryIcon("pencil", 14)),
    h("button", { type: "button", "aria-label": "폴더 삭제", onClick: () => head()?.querySelector("[data-folder-actions] button")?.click() }, libraryIcon("trash", 16)),
  );
  root.append(bar);
  return bar;
}

function openFolderHead(root) {
  const id = root.dataset.malangOpenFolder;
  return id ? root.querySelector(`[data-character-folder-id="${CSS.escape(id)}"] > [role="button"]`) : null;
}

function leaveOpenFolder(root) {
  const head = openFolderHead(root);
  closeOpenFolder(root);
  if (head?.getAttribute("aria-expanded") === "true") {
    head.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  }
}

function closeOpenFolder(root) {
  delete root.dataset.malangOpenFolder;
  root.querySelectorAll('[data-ph-folder-active]').forEach(folder => delete folder.dataset.phFolderActive);
}

function openFolderFrom(root, clicked) {
  if (clicked.getAttribute("aria-expanded") !== "true") return closeOpenFolder(root);
  closeOpenFolder(root);
  clicked.parentElement.dataset.phFolderActive = "";
  root.dataset.malangOpenFolder = clicked.parentElement.dataset.characterFolderId;
  const bar = folderBarOf(root);
  bar.querySelector("b").textContent = clicked.querySelector("[data-ph-cfolder-name]")?.textContent ?? "";
  bar.querySelector("span").textContent = clicked.querySelector('[data-folder-item-count="inline"]')?.textContent ?? "";
}

function startFolderRename(root) {
  openFolderHead(root)?.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true }));
}

function onLibraryClick(event) {
  const root = event.target.closest?.(CHARACTERS_ROOT_SELECTOR);
  if (root) {
    const head = event.target.closest('[data-character-folder-id] > [role="button"]');
    setTimeout(() => {
      if (head && !event.target.closest("input, button, [data-folder-actions]")) return openFolderFrom(root, head);
      if (root.dataset.malangOpenFolder !== undefined && openFolderHead(root)?.getAttribute("aria-expanded") !== "true") {
        closeOpenFolder(root);
      }
    }, 0);
    return;
  }
  const library = event.target.closest?.("[data-malang-library]");
  if (library) setTimeout(() => classifyLibrary(library), 0);
  const tab = event.target.closest?.(".mari-ph-tabs > button");
  if (tab) {
    const presets = tab.closest("[data-malang-library]");
    presets.dataset.malangPresetTab = tab.dataset.tab;
    for (const button of tab.parentElement.children) button.setAttribute("aria-selected", String(button === tab));
  }
}

let personaMeta = null;
let personaMetaAt = 0;
let personaMetaLoading = null;

function loadPersonaMeta() {
  if (personaMetaLoading || Date.now() - personaMetaAt < 60_000) return;
  personaMetaLoading = readJson("/api/characters/personas/list")
    .then((personas) => {
      personaMeta = new Map(
        (Array.isArray(personas) ? personas : []).map((persona) => [
          persona.id,
          { line: (persona.comment || persona.creatorNotes || "").trim(), creator: (persona.creator ?? "").trim() },
        ]),
      );
      personaMetaAt = Date.now();
      document.querySelectorAll(PERSONA_ROW_SELECTOR).forEach(decoratePersona);
    })
    .catch((error) => marinara.log.warn("persona list details could not be read", error))
    .finally(() => {
      personaMetaLoading = null;
    });
}

function personaPart(text, className) {
  return text.querySelector(`:scope > .${className}`) ?? text.appendChild(h(`div.${className}`));
}

function decoratePersona(row) {
  const list = row.parentElement;
  if (list?.dataset.malangRow === undefined) classifyLibrary(libraryRootOf(row));
  const photo = row.querySelector(":scope > .mari-avatar-placeholder");
  const parts = tagCard(row);
  const name = parts.name?.textContent?.trim() ?? "";
  if (!photo) return;
  let at = photo.querySelector(":scope > .mari-ph-at");
  if (!at) {
    at = h("span.mari-ph-at", { "aria-hidden": "true" });
    photo.append(at);
  }
  const label = `@${name.split(/\s+/)[0] ?? ""}`;
  if (at.textContent !== label) at.textContent = label;
  markPart(parts.actions, "phPersonaActions");
  const text = parts.text;
  if (!text) return;
  const meta = personaMeta?.get(row.dataset.dragId);
  if (!meta) loadPersonaMeta();
  const line = personaPart(text, "mari-ph-persona-line");
  const lineText = meta?.line || "";
  if (line.textContent !== lineText) line.textContent = lineText;
  const foot = personaPart(text, "mari-ph-persona-foot");
  const footText = meta?.creator ? `by ${meta.creator}` : "";
  if (foot.textContent !== footText) foot.textContent = footText;
}

function presetTabsOf(root) {
  if (root.querySelector(":scope > .mari-ph-tabs")) return;
  if (root.dataset.malangPresetTab === undefined) root.dataset.malangPresetTab = "presets";
  const current = root.dataset.malangPresetTab;
  root.prepend(
    h(
      "div.mari-ph-tabs",
      { role: "tablist" },
      [
        ["presets", "프리셋"],
        ["regex", "정규식"],
        ["tools", "기능"],
      ].map(([key, label]) => h("button", { type: "button", role: "tab", "data-tab": key, "aria-selected": String(current === key) }, label)),
    ),
  );
}

function markPart(node, name) {
  if (node && node.dataset[name] === undefined) node.dataset[name] = "";
}

function markItem(card) {
  markPart(card, "phItem");
  markPart(card.parentElement, "phList");
  const { text, title, meta, actions, icon } = tagCard(card);
  markPart(title, "phName");
  meta.forEach((line, index) => setPart(line, "phMeta", String(index + 1)));
  if (icon?.tagName === "BUTTON") markPart(icon, "phIcon");
  markPart(actions, "phActions");
}

function markFolder(folder) {
  markPart(folder, "phFolder");
  const head = tagFolderHead(folder.querySelector(':scope > [role="button"], :scope > [data-drag-surface]'));
  if (!head) return;
  const body = [...folder.children].find((child) => child !== head);
  markPart(body?.firstElementChild, "phFolderBody");
}

function markPlainList(root) {
  root.querySelectorAll("[data-touch-drag-card]").forEach(markItem);
  root.querySelectorAll('[data-drag-kind$="folder"]').forEach(markFolder);
  for (const row of root.children) {
    if (/^(section|regex|tools|other)$/.test(row.dataset.malangRow ?? "")) {
      const head = [...row.children].find((child) => child.querySelector(":scope > button svg"));
      markPart(head?.querySelector(":scope > button"), "phSectionHead");
      const body = head && [...row.children].find((child) => child !== head && child.tagName === "DIV");
      for (const part of body?.children ?? []) toggleMark(part, "data-ph-section-intro", isSectionIntro(part, body));
    }
  }
  if (root.dataset.malangLibrary === "agents") {
    const modes = root.querySelector(':scope > [data-malang-row="newfolder"] > [role="group"]');
    markPart(modes, "phTabs");
    for (const button of modes?.children ?? []) {
      const label = AGENT_MODE_LABELS[button.textContent.trim()];
      if (label && button.dataset.phLabel !== label) button.dataset.phLabel = label;
    }
    markPart(root.querySelector(':scope > button[data-malang-row="agent-download"]'), "phDownload");
  }
}

function plainListOf(node) {
  const root = libraryRootOf(node);
  return root && PLAIN_LISTS.has(root.dataset.malangLibrary) ? root : null;
}

const dirtyLibraries = new Set();
let libraryFrame = 0;
function queueLibrary(root) {
  if (!root) return;
  dirtyLibraries.add(root);
  if (libraryFrame) return;
  libraryFrame = requestAnimationFrame(() => {
    libraryFrame = 0;
    for (const library of dirtyLibraries) if (library.isConnected) classifyLibrary(library);
    dirtyLibraries.clear();
  });
}
marinara.onCleanup(() => {
  cancelAnimationFrame(libraryFrame);
  dirtyLibraries.clear();
});
function onLibrarySeen(target) {
  if (target.matches(CHARACTER_CARD_SELECTOR)) decorateCharacterCard(target);
  else if (target.matches(CHARACTER_FOLDER_HEAD_SELECTOR)) decorateCharacterFolder(target);
  else if (target.matches(PERSONA_ROW_SELECTOR)) decoratePersona(target);
  else if (target.matches(`${CHARACTERS_ROOT_SELECTOR}, [data-panel-key] > *`)) queueLibrary(libraryRootOf(target));
  else if (target.matches("[data-touch-drag-card]")) {
    if (plainListOf(target)) markItem(target);
  } else if (target.matches('[data-drag-kind$="folder"]')) {
    if (libraryRootOf(target)?.dataset.malangLibrary !== "characters") markFolder(target);
  }
  else if (target.closest("[data-malang-library]")) queueLibrary(libraryRootOf(target));
  else return false;
  return true;
}

document.querySelectorAll(`${CHARACTERS_ROOT_SELECTOR}, [data-panel-key] > *`).forEach((node) => classifyLibrary(libraryRootOf(node)));
document.querySelectorAll(CHARACTER_CARD_SELECTOR).forEach(decorateCharacterCard);
document.querySelectorAll(CHARACTER_FOLDER_HEAD_SELECTOR).forEach(decorateCharacterFolder);
document.querySelectorAll(PERSONA_ROW_SELECTOR).forEach(decoratePersona);
function onLibraryKey(event) {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches(CHARACTER_FOLDER_HEAD_SELECTOR)) onLibraryClick(event);
}
document.addEventListener('keyup', onLibraryKey, true);
document.addEventListener("click", onLibraryClick, true);

marinara.onCleanup(() => {
  document.removeEventListener("click", onLibraryClick, true);
  document.removeEventListener("keyup", onLibraryKey, true);
  document
    .querySelectorAll(".mari-ph-folder-collage, .mari-ph-folder-bar, .mari-ph-card-line, .mari-ph-card-stats, .mari-ph-tabs, [data-malang-library] .mari-ph-at, .mari-ph-persona-line, .mari-ph-persona-foot")
    .forEach((node) => node.remove());
  for (const attribute of [
    "malangGallery",
    "malangRow",
    "malangLibrary",
    "malangOpenFolder",
    "malangPresetTab",
    "phFolderActive",
    "phItem",
    "phList",
    "phName",
    "phMeta",
    "phIcon",
    "phActions",
    "phFolder",
    "phFolderHead",
    "phFolderName",
    "phFolderBody",
    "phSectionHead",
    "phTabs",
    "phDownload",
    "phLabel",
    "phPersonaActions",
    "phLibLabel",
    "phLoreActions",
    "phLoreText",
    "phCardText",
    "phCardName",
    "phCardTitle",
    "phCardMeta",
    "phCardIcon",
    "phCardActions",
    "phCardBody",
    "phCardPick",
    "phCardPicked",
    "phCover",
    "phCfolderHead",
    "phCfolderName",
    "phRenaming",
    "phLib",
    "phSectionIntro",
    "phTile",
    "phTileText",
    "phTileSub",
  ]) {
    const name = attribute.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    document.querySelectorAll(`[data-${name}]`).forEach((node) => delete node.dataset[attribute]);
  }
});

Promise.allSettled(fontLoads).then(() => requestAnimationFrame(() => requestAnimationFrame(() => {
  if (fontsDisposed) return;
  document.documentElement.dataset.scrapbookReady = "";
  marinara.clearTimeout(scrapbookBootTimer);
})));

const PAGE_ROOT_SELECTOR = `${HOME_SELECTOR}, ${CHARACTERS_ROOT_SELECTOR}, [data-panel-key] > *`;
function dressMounted(node) {
  if (node.matches(HOME_SELECTOR)) return mountHome(node);
  if (node.matches(PAGE_ROOT_SELECTOR)) return classifyLibrary(libraryRootOf(node));
  if (node.firstElementChild) for (const found of node.querySelectorAll(PAGE_ROOT_SELECTOR)) dressMounted(found);
}
const pageMounts = new MutationObserver((records) => {
  const tabListSelector = '[data-component="HomeBrowserHub.TabList"]';
  if (records.some(record => record.target.closest?.(tabListSelector) ||
      [...record.addedNodes].some(node => node.nodeType === 1 &&
        (node.matches(tabListSelector) || node.querySelector(tabListSelector))))) hubTabs();
  for (const record of records) {
    const messageRow = record.target.closest?.(ROW_SELECTOR);
    if (messageRow && [...record.addedNodes, ...record.removedNodes].some((node) => node.nodeType === 1 && (node.matches(".lucide-eye-off") || node.querySelector(".lucide-eye-off")))) {
      dirtyRows.add(messageRow);
      flushLater();
    }
    if (record.target.classList?.contains("mari-message-actions") && record.target.querySelector(":scope > [data-rpc-order]") && [...record.addedNodes].some((node) => node.nodeType === 1 && !node.matches(".rpc-more, .rpc-more-panel"))) orderActions(record.target);
    const loreRow = record.target.closest?.(LORE_ROW);
    if (loreRow) queueLoreRow(loreRow);
    const chromeHost = record.target.closest?.(CHROME_HOSTS);
    if (chromeHost) queueChrome(chromeHost);
    for (const node of record.addedNodes) {
      if (node.nodeType !== 1) continue;
      dressMounted(node);
      if (node.matches(LORE_ROW)) queueLoreRow(node);
      else if (node.firstElementChild) for (const row of node.querySelectorAll(LORE_ROW)) queueLoreRow(row);
      if (node.matches(CHROME_HOSTS)) queueChrome(node);
      else if (node.firstElementChild) for (const host of node.querySelectorAll(CHROME_HOSTS)) queueChrome(host);
    }
  }
  if (scrapbookSettings.caught.length) queueCaught();
  if (!document.querySelector('.scrapbook-widget-handle') && document.querySelector('.scrapbook-header')) ensureWidgetHandle();
});
pageMounts.observe(document.body, { childList: true, subtree: true });
hubTabs();
loadHubPackageTabs();
marinara.onCleanup(() => pageMounts.disconnect());

const EDITOR_DETAIL_SECTIONS = new Set(["metadata", "overview"]);
const EDITOR_SELECTOR = ':is([data-component="DetailEditor"], [data-component="MobileDetailSheet"])';
ICONS.sliders =
  '<path d="M21 4h-7"/><path d="M10 4H3"/><path d="M21 12h-9"/><path d="M8 12H3"/><path d="M21 20h-5"/><path d="M12 20H3"/><path d="M14 2v4"/><path d="M8 10v4"/><path d="M16 18v4"/>';
const editorWatchers = new Map();
let detailsFrame = null;

function editorParts(editor) {
  const inner = editor.querySelector(".mari-editor-content-inner");
  const sections = inner ? [...inner.querySelectorAll(":scope > [data-editor-section]")] : [];
  const tabs = [...editor.querySelectorAll(".mari-editor-navigation-tabs > button")];
  const keys = sections.map((section) => section.dataset.editorSection);
  const details = keys.find((key) => EDITOR_DETAIL_SECTIONS.has(key)) ?? null;
  return { inner, sections, tabs, keys, details, pages: keys.filter((key) => key !== details) };
}

function toggleMark(node, name, on) {
  if (on) node.setAttribute(name, "");
  else node.removeAttribute(name);
}

function syncEditor(editor) {
  const { inner, sections, tabs, keys, details, pages } = editorParts(editor);
  if (!sections.length || !pages.length) return;
  if (!pages.includes(editor.dataset.phSection)) editor.dataset.phSection = pages.includes("card") ? "card" : pages[0];
  const current = editor.dataset.phSection;
  const open = "phDetails" in editor.dataset && Boolean(details);
  editor.dataset.phTabbed = "";
  toggleMark(editor, "data-ph-single", pages.length < 2);
  sections.forEach((section, index) => {
    toggleMark(section, "data-ph-shown", keys[index] === current);
    toggleMark(section, "data-ph-modal", open && keys[index] === details);
    if (tabs[index]) {
      toggleMark(tabs[index], "data-ph-on", keys[index] === current);
      toggleMark(tabs[index], "data-ph-gone", keys[index] === details);
    }
  });
  const actions = editor.querySelector(".mari-editor-actions");
  if (details && actions && !actions.querySelector(".ph-details-button")) {
    actions.insertBefore(
      h("button.mari-editor-action.ph-details-button", { type: "button", "aria-label": "세부 정보", title: "세부 정보", onClick: () => openDetails(editor) }, icon("sliders", 16)),
      actions.children[1] ?? null,
    );
  }
  if (inner && !editorWatchers.has(editor)) {
    const watcher = new MutationObserver(() => syncEditor(editor));
    watcher.observe(inner, { childList: true });
    editorWatchers.set(editor, watcher);
  }
  for (const [node, watcher] of editorWatchers) {
    if (!node.isConnected) {
      watcher.disconnect();
      editorWatchers.delete(node);
    }
  }
}

function showEditorSection(editor, key) {
  editor.dataset.phSection = key;
  syncEditor(editor);
  requestAnimationFrame(() => editor.querySelector(".mari-editor-content")?.scrollTo({ top: 0 }));
}

function openDetails(editor) {
  editor.dataset.phDetails = "";
  syncEditor(editor);
  editor.querySelector("[data-ph-modal]")?.scrollTo({ top: 0 });
  detailsFrame?.forEach((node) => node.remove());
  const close = () => closeDetails(editor);
  const main = editor.closest('[data-component="CenterContent"]') ?? document.body;
  const shell = main.closest('[data-component="AppShell"]') ?? document.body;
  detailsFrame = [
    h("div.ph-details-veil", { onClick: close }),
    h(
      "div.ph-details-frame",
      null,
      h("div.ph-details-backdrop", { onClick: close }),
      h("header.ph-details-head", null, h("strong", null, "세부 정보"), h("button", { type: "button", "aria-label": "닫기", onClick: close }, "×")),
    ),
  ];
  shell.append(detailsFrame[0]);
  editor.append(detailsFrame[1]);
  document.documentElement.dataset.phDetailsOpen = "";
  document.addEventListener("keydown", onDetailsKey, true);
}

function closeDetails(editor) {
  delete editor.dataset.phDetails;
  if (editor.isConnected) syncEditor(editor);
  detailsFrame?.forEach((node) => node.remove());
  detailsFrame = null;
  delete document.documentElement.dataset.phDetailsOpen;
  document.removeEventListener("keydown", onDetailsKey, true);
}

function onDetailsKey(event) {
  if (event.key !== "Escape" || event.isComposing) return;
  const editor = document.querySelector(`${EDITOR_SELECTOR}[data-ph-details]`);
  if (!editor) return;
  event.stopPropagation();
  closeDetails(editor);
}

function onEditorTab(event) {
  const tab = event.target.closest?.(".mari-editor-navigation-tabs > button");
  const item = tab ? null : event.target.closest?.('[role="menuitem"]');
  let editor = tab?.closest(EDITOR_SELECTOR);
  let index = tab ? [...tab.parentElement.children].indexOf(tab) : -1;
  if (item) {
    const menu = item.closest('[role="menu"]');
    editor = menu?.id ? document.querySelector(`${EDITOR_SELECTOR} [aria-controls="${CSS.escape(menu.id)}"]`)?.closest(EDITOR_SELECTOR) : null;
    index = editor ? [...menu.querySelectorAll('[role="menuitem"]')].indexOf(item) : -1;
  }
  if (!editor || index < 0) return;
  const { keys, details } = editorParts(editor);
  const key = keys[index];
  if (!key) return;
  if (key === details) openDetails(editor);
  else showEditorSection(editor, key);
}

function onEditorSeen(event) {
  if (event.animationName !== "ph-editor-seen") return;
  const editor = event.target.closest(EDITOR_SELECTOR);
  if (editor) syncEditor(editor);
}

document.addEventListener("click", onEditorTab, true);
document.addEventListener("animationstart", onEditorSeen, true);
for (const editor of document.querySelectorAll(EDITOR_SELECTOR)) syncEditor(editor);
marinara.onCleanup(() => {
  document.removeEventListener("click", onEditorTab, true);
  document.removeEventListener("animationstart", onEditorSeen, true);
  document.removeEventListener("keydown", onDetailsKey, true);
  for (const watcher of editorWatchers.values()) watcher.disconnect();
  editorWatchers.clear();
  detailsFrame?.forEach((node) => node.remove());
  delete document.documentElement.dataset.phDetailsOpen;
  document.querySelectorAll(".ph-details-button").forEach((node) => node.remove());
  for (const editor of document.querySelectorAll(EDITOR_SELECTOR)) {
    for (const name of ["phTabbed", "phSingle", "phSection", "phDetails"]) delete editor.dataset[name];
  }
  document.querySelectorAll("[data-ph-shown], [data-ph-modal], [data-ph-on], [data-ph-gone]").forEach((node) => {
    for (const name of ["data-ph-shown", "data-ph-modal", "data-ph-on", "data-ph-gone"]) node.removeAttribute(name);
  });
});

const LORE_ROW = "[data-lorebook-entry-row-id]";
const LORE_HEAD_ICONS = [
  ["grip", ".lucide-grip-vertical"],
  ["expand", ".lucide-chevron-down"],
  ["regex", ".lucide-regex"],
  ["vector", '.lucide-circle-dashed, .lucide-ban, svg[class*="circle-check"], svg[class*="check-circle"]'],
  ["quick", ".lucide-ellipsis"],
  ["lock", ".lucide-lock"],
  ["tokens", ".lucide-hash"],
  ["copy", ".lucide-copy"],
  ["delete", ".lucide-trash-2"],
];
const loreQueue = new Set();
let loreFrame = 0;

function setLore(node, name) {
  if (!name) return node.removeAttribute("data-ph-lore");
  if (node.getAttribute("data-ph-lore") !== name) node.setAttribute("data-ph-lore", name);
}
function lorePartOf(node) {
  if (node.matches('input:not([type]), input[type="text"]')) return "name";
  if (node.matches('[aria-haspopup="menu"]')) return "type";
  if (node.querySelector("[data-settings-switch-track]")) return "switch";
  for (const [name, marker] of LORE_HEAD_ICONS) if (node.querySelector(marker)) return name;
  if (node.querySelector('select, input[type="number"]')) return "fields";
  return null;
}
function tagLoreFlags(grid) {
  const chips = [...grid.children];
  const wide = chips.length % 3 === 2 ? 2 : 0;
  chips.forEach((chip, index) => {
    setLore(chip, "flag");
    toggleMark(chip, "data-ph-wide", index < wide);
    toggleMark(chip, "data-ph-on", Boolean(chip.querySelector('input[type="checkbox"]')?.checked));
    for (const part of chip.children) setLore(part, part.querySelector("[data-settings-switch-track]") ? "flag-switch" : "flag-text");
  });
}
function tagLoreDrawer(drawer) {
  for (const part of drawer.children) {
    const kids = [...part.children];
    if (part.querySelector(":scope > code")) setLore(part, "id");
    else if (kids.length > 1 && kids.every((kid) => kid.querySelector("[data-settings-switch-track]"))) {
      setLore(part, "flags");
      tagLoreFlags(part);
    } else setLore(part, "block");
  }
}
function tagLoreRow(row) {
  if (!row.isConnected) return;
  let open = false;
  for (const child of row.children) {
    if (child.tagName !== "DIV") continue;
    if (child.querySelector(":scope > button .lucide-chevron-down")) {
      setLore(child, "head");
      for (const part of child.children) setLore(part, lorePartOf(part));
    } else if (child.querySelector("textarea")) {
      setLore(child, "drawer");
      tagLoreDrawer(child);
      open = true;
    }
  }
  toggleMark(row, "data-ph-open", open);
}
function queueLoreRow(row) {
  loreQueue.add(row);
  if (!loreFrame) loreFrame = requestAnimationFrame(() => {
    loreFrame = 0;
    for (const queued of loreQueue) tagLoreRow(queued);
    loreQueue.clear();
  });
}
function onLoreFlagChange(event) {
  const chip = event.target.closest?.('[data-ph-lore="flag"]');
  if (chip) requestAnimationFrame(() => toggleMark(chip, "data-ph-on", event.target.checked));
}
document.addEventListener("change", onLoreFlagChange, true);
for (const row of document.querySelectorAll(LORE_ROW)) queueLoreRow(row);
marinara.onCleanup(() => {
  document.removeEventListener("change", onLoreFlagChange, true);
  if (loreFrame) cancelAnimationFrame(loreFrame);
});

function setPart(node, name, value = "") {
  if (node && node.dataset[name] !== value) node.dataset[name] = value;
}
function clearPart(node, name) {
  if (node && node.dataset[name] !== undefined) delete node.dataset[name];
}
function cardLabel(card) {
  try {
    return String(JSON.parse(card.dataset.dragPayload ?? "{}").label ?? "").trim();
  } catch {
    return "";
  }
}
function findNamed(scope, label) {
  if (!label) return null;
  let found = null;
  for (const node of scope.querySelectorAll("span, div, b, strong, p")) {
    if (node.closest(".mari-ph-card-line, .mari-ph-persona-line, .mari-ph-persona-foot")) continue;
    if (node.textContent.trim() === label) { found = node; break; }
  }
  while (found) {
    const inner = [...found.children].find((child) => child.textContent.trim() === label);
    if (!inner) break;
    found = inner;
  }
  return found;
}
function childOf(ancestor, node) {
  while (node && node.parentElement !== ancestor) node = node.parentElement;
  return node;
}
function tagCard(card, knownName) {
  const label = knownName || cardLabel(card);
  const actions = card.querySelector(":scope > [data-character-row-actions]")
    ?? [...card.children].find((child) => child.tagName === "DIV" && child.querySelector(".lucide-trash-2, .lucide-copy"));
  const name = card.querySelector("[data-character-row-name]") ?? findNamed(card, label);
  const textHost = name?.closest("[data-preset-open-action]") ? name.closest("[data-preset-open-action]") : card;
  const text = name && (textHost === card ? childOf(card, name) : textHost);
  const title = name && text && (name.parentElement === text ? name : childOf(text, name));
  const meta = text ? [...text.children].filter((child) => child !== title && !child.className.toString().startsWith("mari-ph-")) : [];
  setPart(text, "phCardText");
  setPart(name, "phCardName");
  setPart(title, "phCardTitle");
  meta.forEach((line) => setPart(line, "phCardMeta"));
  setPart(actions, "phCardActions");
  const body = text && textHost !== card ? childOf(card, text) : null;
  setPart(body, "phCardBody");
  let pick = null;
  let icon = null;
  for (const child of card.children) {
    if (child === text || child === actions || child === body || child.className.toString().startsWith("mari-ph-")) continue;
    if (child.matches(".mari-avatar-placeholder, [data-preset-image-action]") || child.querySelector("img, .lucide-camera, .mari-avatar-placeholder")) {
      icon = child;
      setPart(child, "phCardIcon");
      for (const span of child.querySelectorAll(":scope > span")) toggleMark(span, "data-ph-cover", Boolean(span.querySelector(".lucide-camera")) && !span.querySelector("img, svg:not(.lucide-camera)"));
    } else if (child.tagName === "BUTTON") pick = child;
  }
  setPart(pick, "phCardPick");
  toggleMark(card, "data-ph-card-picked", Boolean(pick?.querySelector("svg")));
  return { text, name, title, meta, actions, icon };
}
function tagFolderHead(head, prefix = "phFolder") {
  if (!head) return head;
  setPart(head, prefix + "Head");
  const name = [...head.children].find((child) => /^(DIV|SPAN)$/.test(child.tagName) && !child.matches("[data-folder-actions], [data-folder-item-count]") && !child.querySelector("svg, input[type='checkbox']") && (child.textContent.trim() || child.querySelector("input")) && !child.className.toString().startsWith("mari-ph-"));
  setPart(name, prefix + "Name");
  toggleMark(head, "data-ph-renaming", Boolean(head.querySelector('input:not([type="checkbox"])')));
  return head;
}
function tagLibraryRow(row, kind) {
  const LIBRARY_ACTIONS = [
    ["import", ".lucide-download, .lucide-upload, .lucide-file-up, .lucide-import"],
    ["select", ".lucide-check, .lucide-check-check, .lucide-square-check, .lucide-list-checks"],
  ];
  if (kind === "actions") {
    for (const button of row.children) {
      let name = button.matches(".mari-panel-gradient-button") ? "create" : null;
      for (const [action, marker] of LIBRARY_ACTIONS) if (!name && button.querySelector(marker)) name = action;
      if (name) setPart(button, "phLib", name); else clearPart(button, "phLib");
    }
  } else if (kind === "search") {
    for (const box of row.children) {
      if (box.querySelector(':scope > input:not([type="hidden"])')) setPart(box, "phLib", "search"); else clearPart(box, "phLib");
    }
  } else if (kind === "newfolder") {
    for (const part of row.children) {
      if (part.querySelector(":scope > button .lucide-folder-plus")) setPart(part, "phLib", "folder-tools"); else clearPart(part, "phLib");
    }
  } else if (kind === "library") {
    for (const button of row.children) {
      if (button.querySelector(".lucide-users, .lucide-venetian-mask")) setPart(button, "phLib", "personas"); else clearPart(button, "phLib");
      if (button.tagName === "BUTTON") for (const part of button.children) setFlag(part, "phLibLabel", part.tagName.toLowerCase() !== "svg" && !part.querySelector("svg"));
    }
  } else if (kind === "other" && row.parentElement?.dataset.malangLibrary === "connections") tagTile(row);
}
function isSectionIntro(part, body) {
  return body.children.length > 1 && !part.matches("[data-preset-regex-root]")
    && !part.querySelector("button, input, select, textarea, label, [data-preset-regex-root]") && part === body.firstElementChild;
}
function tagTile(scope) {
  const tile = [...scope.querySelectorAll(":scope > div > *")].find((node) => node.querySelector("svg") && !node.textContent.trim() && !node.querySelector("button, input"));
  if (!tile) return;
  setPart(tile, "phTile");
  const text = tile.nextElementSibling;
  if (!text || text.querySelector("button, input")) return;
  setPart(text, "phTileText");
  for (const line of text.children) toggleMark(line, "data-ph-tile-sub", line !== text.firstElementChild);
}

const CHROME_HOSTS = '.mari-settings-panel-chrome [role="tab"], :is([data-component="TopbarMoreMenu"], .mari-ph-fold-menu) > button, .mari-right-panel-header, [data-component="TTSConfigCard"], [data-touch-reorder-item="preset-section"], [data-chat-message-editor], [data-component="ChatSidebar"]';
function tagChrome(host) {
  if (host.matches('[role="tab"]')) {
    for (const span of host.querySelectorAll(":scope > span")) {
      const icon = Boolean(span.querySelector("svg"));
      toggleMark(span, "data-ph-tab-icon", icon);
      toggleMark(span, "data-ph-tab-label", !icon && Boolean(span.textContent.trim()));
    }
  } else if (host.matches("button")) {
    let label = false;
    for (const part of host.children) {
      const text = part.tagName === "SPAN" && !part.querySelector("svg") && Boolean(part.textContent.trim());
      toggleMark(part, "data-ph-menu-extra", (text && label) || (part.tagName === "svg" && part !== host.querySelector(":scope > svg, :scope > span > svg")));
      label ||= text;
    }
  } else if (host.matches(".mari-right-panel-header")) {
    for (const part of host.children) toggleMark(part, "data-ph-divider", part.tagName === "DIV" && !part.firstElementChild && !part.textContent.trim());
  } else if (host.matches('[data-component="TTSConfigCard"]')) tagTile(host);
  else if (host.matches('[data-component="ChatSidebar"]')) tagChatList(host);
  else if (host.matches("[data-chat-message-editor]")) {
    for (const button of host.parentElement?.querySelectorAll("button") ?? []) toggleMark(button, "data-ph-save", Boolean(button.querySelector(".lucide-check")));
  }
  else tagPresetSection(host);
}
function tagPresetSection(item) {
  const head = [...item.children].find((child) => child.querySelector(":scope > div .lucide-grip-vertical"));
  if (!head) return;
  head.dataset.phPsec = "head";
  for (const part of head.children) {
    let name = null;
    if (part.querySelector(".lucide-grip-vertical")) {
      name = "reorder";
      const grip = [...part.children].find((child) => child.querySelector(".lucide-grip-vertical"));
      if (grip) grip.dataset.phPsec = "grip";
    } else if (part.tagName === "DIV" && part.querySelector(".lucide-copy")) name = "tools";
    else if (part.tagName === "SPAN" && part.previousElementSibling?.tagName === "svg") name = "name";
    if (name) part.dataset.phPsec = name;
    else delete part.dataset.phPsec;
  }
}
const chromeQueue = new Set();
let chromeFrame = 0;
function queueChrome(host) {
  chromeQueue.add(host);
  if (!chromeFrame) chromeFrame = requestAnimationFrame(() => {
    chromeFrame = 0;
    for (const queued of chromeQueue) if (queued.isConnected) tagChrome(queued);
    chromeQueue.clear();
  });
}
for (const host of document.querySelectorAll(CHROME_HOSTS)) queueChrome(host);
marinara.onCleanup(() => {
  if (chromeFrame) cancelAnimationFrame(chromeFrame);
  chatTitle.remove();
  for (const node of document.querySelectorAll("[data-ph-chats], [data-ph-chats-action], [data-ph-chats-close]")) {
    delete node.dataset.phChats; delete node.dataset.phChatsAction; delete node.dataset.phChatsClose;
  }
});

const chatTitle = h("div.mari-ph-page-title.scrapbook-chat-title", null, h("h2", null, h("b", null, "02"), h("span.mari-ph-page-title-en", null, " CHAT")), h("span.mari-ph-page-title-ko", null, "채팅"), h("span.mari-ph-sh-fill", { "aria-hidden": "true" }));
const CHAT_ACTIONS = [["create", ".lucide-plus"], ["import", ".lucide-download"], ["select", ".lucide-check"]];
function tagChatList(nav) {
  for (const part of nav.children) {
    let name = null;
    if (part.matches(".mari-sidebar-header")) name = "head";
    else if (part.matches("[data-chat-root-drop-zone]")) name = "list";
    else if (part.querySelector("[data-chat-mode-tab]")) name = "tabs";
    else if (part.querySelector(":scope > button .lucide-download")) name = "actions";
    else if (part.querySelector(".lucide-search")) name = "search";
    if (name) part.dataset.phChats = name;
    else delete part.dataset.phChats;
    if (name === "actions") {
      for (const button of part.querySelectorAll(":scope > button")) {
        const action = CHAT_ACTIONS.find(([, marker]) => button.querySelector(marker))?.[0];
        if (action) button.dataset.phChatsAction = action;
        else delete button.dataset.phChatsAction;
      }
    }
    if (name === "head") {
      const own = part.querySelector("h2:not(.scrapbook-chat-title h2)")?.parentElement;
      if (own && own.dataset.malangTitleHidden === undefined) own.dataset.malangTitleHidden = "";
      if (chatTitle.parentElement !== part) own ? own.after(chatTitle) : part.prepend(chatTitle);
      for (const child of part.children) toggleMark(child, "data-ph-divider", child.tagName === "DIV" && !child.firstElementChild && !child.textContent.trim());
      for (const button of part.querySelectorAll("button")) toggleMark(button, "data-ph-chats-close", Boolean(button.querySelector(".lucide-x")));
    }
  }
}

function normalizeSettings(value) {
  const settings = settingsDefaults();
  if (!value || typeof value !== "object") return settings;
  const color = (text) => (typeof text === "string" && /^#[0-9a-f]{6}$/i.test(text) ? text : "");
  for (const group of ["point", "dialogue"]) for (const mode of ["light", "dark"]) settings[group][mode] = color(value[group]?.[mode]);
  const known = new Set(MESSAGE_TOOLS.map(([key]) => key));
  if (Array.isArray(value.tools)) settings.tools = value.tools.filter((key) => known.has(key));
  if (Array.isArray(value.tucked)) settings.tucked = value.tucked.filter((key) => typeof key === "string" && /^(icon|label):./.test(key));
  if (Array.isArray(value.order)) settings.order = [...new Set(value.order.filter((key) => typeof key === "string" && (known.has(key) || /^(icon|label):./.test(key))))];
  if (Array.isArray(value.caught)) {
    settings.caught = value.caught
      .filter((entry) => typeof entry?.selector === "string" && entry.selector)
      .map((entry) => ({ selector: entry.selector, label: typeof entry.label === "string" && entry.label ? entry.label : "버튼" }));
  }
  return settings;
}

let settingsSaveTimer = null;
function saveSettings() {
  if (settingsSaveTimer !== null) marinara.clearTimeout(settingsSaveTimer);
  settingsSaveTimer = marinara.setTimeout(() => {
    settingsSaveTimer = null;
    void marinara.storage.patch({ [SETTINGS_KEY]: scrapbookSettings }).catch((error) => marinara.log.warn("settings could not be saved", error));
  }, 300);
}

function applyColors() {
  const style = document.documentElement.style;
  for (const group of ["point", "dialogue"]) {
    for (const mode of ["light", "dark"]) {
      const value = scrapbookSettings[group][mode];
      if (value) style.setProperty(`--ph-user-${group}-${mode}`, value);
      else style.removeProperty(`--ph-user-${group}-${mode}`);
    }
  }
}

void marinara.storage
  .get()
  .then((stored) => {
    scrapbookSettings = normalizeSettings(stored?.[SETTINGS_KEY]);
    applyColors();
    syncAll();
    queueCaught();
  })
  .catch((error) => marinara.log.warn("settings could not be read", error));

marinara.onCleanup(() => {
  if (settingsSaveTimer !== null) marinara.clearTimeout(settingsSaveTimer);
  for (const group of ["point", "dialogue"]) for (const mode of ["light", "dark"]) document.documentElement.style.removeProperty(`--ph-user-${group}-${mode}`);
  document.querySelectorAll(".rpc-more").forEach((node) => node.remove());
  document.querySelectorAll("[data-rpc-tucked]").forEach((node) => delete node.dataset.rpcTucked);
  document.querySelectorAll("[data-rpc-tool]").forEach((node) => { delete node.dataset.rpcTool; node.style.removeProperty("order"); });
  document.querySelectorAll("[data-rpc-float], [data-rpc-open]").forEach((node) => { delete node.dataset.rpcFloat; delete node.dataset.rpcOpen; });
  document.querySelectorAll(".rpc-more-panel").forEach((node) => node.remove());
  document.removeEventListener("pointerdown", closeToolBars, true);
});

function hexColor(color) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.fillStyle = color || "#888888";
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function settingsView() {
  const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const shown = (mode) => (mode === current ? hexColor(getComputedStyle(document.documentElement).getPropertyValue("--ph-accent").trim()) : "#888888");
  const colorRow = (group, mode, label) => {
    const state = h("small", null, scrapbookSettings[group][mode] ? "" : "기본값");
    const input = h("input", {
      type: "color",
      value: scrapbookSettings[group][mode] || shown(mode),
      "aria-label": label,
      onInput: (event) => {
        scrapbookSettings[group][mode] = event.target.value;
        state.textContent = "";
        applyColors();
        saveSettings();
      },
    });
    const reset = h(
      "button",
      {
        type: "button",
        onClick: () => {
          scrapbookSettings[group][mode] = "";
          applyColors();
          input.value = shown(mode);
          state.textContent = "기본값";
          saveSettings();
        },
      },
      "초기화",
    );
    return h("div.mari-ph-setting-row", null, h("span", null, label, state), input, reset);
  };
  const modeSection = (mode, name) =>
    h("section.mari-ph-setting-group", null, h("h3", null, name), colorRow("point", mode, "포인트 컬러"), colorRow("dialogue", mode, "대사 하이라이트"));
  const checks = h("div.mari-ph-setting-checks");
  const move = (shown, index, step) => {
    const keys = shown.map(([key]) => key);
    [keys[index], keys[index + step]] = [keys[index + step], keys[index]];
    scrapbookSettings.order = [...keys, ...scrapbookSettings.order.filter((key) => !keys.includes(key))];
    saveSettings();
    syncAll();
    renderTools();
  };
  const renderTools = () => {
    const shown = chatTools();
    checks.replaceChildren(
      ...shown.map(([key, label], index) =>
        h(
          "div.mari-ph-setting-tool",
          null,
          h(
            "label.mari-ph-setting-check",
            null,
            h("input", {
              type: "checkbox",
              checked: !toolFolded(key),
              onChange: (event) => {
                const custom = key.includes(":");
                const list = new Set(custom ? scrapbookSettings.tucked : scrapbookSettings.tools);
                if (event.target.checked !== custom) list.add(key);
                else list.delete(key);
                if (custom) scrapbookSettings.tucked = [...list];
                else scrapbookSettings.tools = MESSAGE_TOOLS.map(([tool]) => tool).filter((tool) => list.has(tool));
                saveSettings();
                syncAll();
              },
            }),
            h("span", null, label),
          ),
          h("button", { type: "button", "aria-label": `${label} 위로`, disabled: index === 0, onClick: () => move(shown, index, -1) }, icon("chevronUp", 16)),
          h("button", { type: "button", "aria-label": `${label} 아래로`, disabled: index === shown.length - 1, onClick: () => move(shown, index, 1) }, icon("chevronDown", 16)),
        ),
      ),
    );
    return shown.length;
  };
  const toolCount = renderTools();
  return h(
    "div.mari-ph-settings",
    null,
    modeSection("light", "라이트 모드"),
    modeSection("dark", "다크 모드"),
    h(
      "section.mari-ph-setting-group",
      null,
      h("h3", null, "메시지 도구"),
      h("p", null, toolCount ? "더보기 밖에 꺼내 둘 버튼과 순서를 정하세요." : "설정하기 위해 먼저 채팅방을 여세요."),
      checks,
    ),
  );
}

function buttonLabel(node) {
  return (node.getAttribute("aria-label") || node.title || node.textContent.trim() || "버튼").slice(0, 24);
}

function findCaught(entry) {
  try {
    for (const node of document.querySelectorAll(entry.selector)) if (buttonLabel(node) === entry.label) return node;
  } catch {}
  return null;
}

function caughtTiles() {
  return scrapbookSettings.caught.map((entry, index) => {
    const node = findCaught(entry);
    const source = node && (node.matches("svg, img") ? node : node.querySelector("svg, img"));
    const mark = source?.cloneNode(true) ?? icon("folderOpen", 20);
    if (mark.tagName.toLowerCase() === "svg") {
      mark.setAttribute("width", "20");
      mark.setAttribute("height", "20");
    }
    return { key: "caught-" + index, label: entry.label, mark, rank: 6, caught: entry, onSelect: () => pressButton(findCaught(entry)) };
  });
}

function pressButton(node) {
  if (!node) return;
  const pointer = { bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0 };
  node.dispatchEvent(new PointerEvent("pointerdown", { ...pointer, buttons: 1 }));
  node.dispatchEvent(new PointerEvent("pointerup", pointer));
  node.click();
}

function syncCaught() {
  const now = new Set();
  for (const entry of scrapbookSettings.caught) {
    const node = findCaught(entry);
    if (node) now.add(node);
  }
  for (const node of caughtNodes) if (!now.has(node)) delete node.dataset.phCaught;
  for (const node of now) if (node.dataset.phCaught === undefined) node.dataset.phCaught = "";
  caughtNodes = now;
}

function queueCaught() {
  if (caughtFrame) return;
  caughtFrame = requestAnimationFrame(() => {
    caughtFrame = 0;
    syncCaught();
  });
}

function releaseCaught(entry) {
  scrapbookSettings.caught = scrapbookSettings.caught.filter((item) => item !== entry);
  saveSettings();
  syncCaught();
}

marinara.onCleanup(() => {
  if (caughtFrame) cancelAnimationFrame(caughtFrame);
  for (const node of caughtNodes) delete node.dataset.phCaught;
  caughtNodes.clear();
  stopCatching(false);
});

function catchSelector(node) {
  const tag = node.localName;
  const candidates = [];
  if (node.id) candidates.push("#" + CSS.escape(node.id));
  const testId = node.getAttribute("data-testid");
  if (testId) candidates.push(`${tag}[data-testid=${JSON.stringify(testId)}]`);
  const ancestor = node.parentElement?.closest("[id]");
  const anchor = ancestor && ancestor.id !== "root" ? "#" + CSS.escape(ancestor.id) : null;
  for (const attribute of ["aria-label", "title"]) {
    const value = node.getAttribute(attribute);
    if (!value) continue;
    const selector = `${tag}[${attribute}=${JSON.stringify(value)}]`;
    if (anchor) candidates.push(`${anchor} ${selector}`);
    candidates.push(selector);
  }
  const classes = [...node.classList].filter((name) => !/[:[\]/]|^(?:is|has)-|^(?:active|selected|checked|disabled|loading|open|closed|hidden|visible)$/.test(name));
  for (const name of classes) {
    if (anchor) candidates.push(`${anchor} ${tag}.${CSS.escape(name)}`);
    candidates.push(`${tag}.${CSS.escape(name)}`);
  }
  return candidates.find((selector) => findCaught({ selector, label: buttonLabel(node) }) === node) ?? null;
}

const CATCH_EVENTS = ["pointerdown", "pointerup", "mousedown", "mouseup", "touchstart", "touchend", "click", "dblclick", "contextmenu"];

function catchTarget(event) {
  const node = event.target instanceof Element ? event.target.closest('button, [role="button"]') : null;
  return node && !node.closest(".mari-ph-catch-bar, .mari-ph-widgets, .scrapbook-widget-handle") ? node : null;
}

function onCatchEvent(event) {
  const node = catchTarget(event);
  if (!node || !catching) return;
  if (!event.type.startsWith("touch")) event.preventDefault();
  event.stopImmediatePropagation();
  if (event.type !== "click") return;
  const { picked, text } = catching;
  if (picked.has(node)) {
    picked.delete(node);
    delete node.dataset.phCatchPick;
  } else {
    const selector = catchSelector(node);
    if (!selector) {
      text.textContent = "이 버튼은 구분할 수 없습니다.";
      return;
    }
    if (scrapbookSettings.caught.some((entry) => entry.selector === selector)) {
      text.textContent = "이미 수집한 버튼입니다.";
      return;
    }
    picked.set(node, { selector, label: buttonLabel(node) });
    node.dataset.phCatchPick = "";
  }
  text.textContent = `등록할 버튼 선택 · ${picked.size}개`;
}

function onCatchKey(event) {
  if (event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  stopCatching(false);
}

function startCatching() {
  if (catching) return;
  closeWidgets();
  const text = h("span", null, "등록할 버튼 선택 · 0개");
  const bar = h(
    "div.mari-ph-catch-bar",
    { role: "status", "data-component": "ButtonCatcher" },
    text,
    h("button", { type: "button", onClick: () => stopCatching(true) }, "완료"),
    h("button", { type: "button", onClick: () => stopCatching(false) }, "취소"),
  );
  catching = { picked: new Map(), text, bar };
  document.body.append(bar);
  for (const type of CATCH_EVENTS) window.addEventListener(type, onCatchEvent, { capture: true, passive: false });
  document.addEventListener("keydown", onCatchKey, true);
}

function stopCatching(keep) {
  if (!catching) return;
  const { picked, bar } = catching;
  catching = null;
  for (const type of CATCH_EVENTS) window.removeEventListener(type, onCatchEvent, { capture: true });
  document.removeEventListener("keydown", onCatchKey, true);
  bar.remove();
  for (const node of picked.keys()) delete node.dataset.phCatchPick;
  if (!keep) return;
  if (picked.size) {
    scrapbookSettings.caught.push(...picked.values());
    saveSettings();
    syncCaught();
  }
  openWidgets();
}

function queueConvo(root) {
  convoDirty.add(root);
  if (convoFrame) return;
  convoFrame = requestAnimationFrame(() => {
    convoFrame = 0;
    for (const queued of convoDirty) if (queued.isConnected) syncConvo(queued);
    convoDirty.clear();
  });
}

function syncConvo(root) {
  if (!convoObservers.has(root)) {
    for (const [node, observer] of convoObservers) {
      if (node.isConnected) continue;
      observer.disconnect();
      convoObservers.delete(node);
    }
    const observer = new MutationObserver(() => queueConvo(root));
    observer.observe(root, { childList: true, subtree: true });
    convoObservers.set(root, observer);
  }
  setFlag(root, "phConvo", true);
  syncConvoBackdrop(root);
  for (const actions of root.querySelectorAll('[data-component="ConversationMessage.Actions"]')) orderActions(actions);
  for (const button of root.querySelectorAll(".mari-message-body > button")) setFlag(button, "phConvoHidden", Boolean(button.querySelector(".lucide-eye-off")));
  for (const message of root.querySelectorAll("[data-message-id] > .mari-message")) setFlag(message, "phConvoHiddenRow", Boolean(message.querySelector(".lucide-eye-off")));
  syncRemote(root);
}

function syncConvoBackdrop(root) {
  const chatId = chatIdOf(root) ?? findStores().chat?.getState().activeChatId;
  const characterId = chatId ? loadChat(chatId)?.characterIds[0] : null;
  const character = characterId ? loadCharacter(characterId) : null;
  let dream = root.querySelector(":scope > .mari-ph-convo-dream");
  if (!dream) {
    dream = h("div.mari-ph-convo-dream", { "aria-hidden": "true" });
    root.prepend(dream);
  }
  const src = character?.avatarUrl ?? "";
  const image = dream.querySelector(":scope > img");
  if (!src) image?.remove();
  else if (image?.getAttribute("src") !== src) {
    const next = h("img", { src, alt: "", decoding: "async" });
    if (image) image.replaceWith(next);
    else dream.prepend(next);
  }
  const point = character?.palette?.[0];
  if (point) root.style.setProperty("--convo-point", point);
  else root.style.removeProperty("--convo-point");
}

function onConvoSeen(event) {
  if (event.animationName === SEEN_ANIMATION && event.target.matches?.(CONVO_SELECTOR)) queueConvo(event.target);
}
document.addEventListener("animationstart", onConvoSeen, true);
marinara.onCleanup(() => {
  document.removeEventListener("animationstart", onConvoSeen, true);
  if (convoFrame) cancelAnimationFrame(convoFrame);
  for (const observer of convoObservers.values()) observer.disconnect();
  convoObservers.clear();
  document.querySelectorAll(".mari-ph-convo-dream").forEach((node) => node.remove());
  document.querySelectorAll("[data-ph-convo]").forEach((node) => delete node.dataset.phConvo);
  document.querySelectorAll("[data-ph-convo-hidden]").forEach((node) => delete node.dataset.phConvoHidden);
  document.querySelectorAll("[data-ph-convo-hidden-row]").forEach((node) => delete node.dataset.phConvoHiddenRow);
  for (const root of document.querySelectorAll(CONVO_SELECTOR)) root.style.removeProperty("--convo-point");
});

function remoteJump(area, direction, toEdge) {
  const scroller = area.querySelector("[data-chat-scroll]");
  if (!scroller) return;
  const edge = () => scroller.scrollTo({ top: direction === "up" ? 0 : scroller.scrollHeight, behavior: "smooth" });
  if (toEdge) return edge();
  const top = scroller.getBoundingClientRect().top + (parseFloat(getComputedStyle(scroller).scrollPaddingTop) || 0);
  const rows = [...scroller.querySelectorAll("[data-message-id]")].filter((row) => !row.parentElement.closest("[data-message-id]"));
  const target = direction === "up"
    ? rows.filter((row) => row.getBoundingClientRect().top < top - 4).at(-1)
    : rows.find((row) => row.getBoundingClientRect().top > top + 4);
  if (!target) return edge();
  scroller.scrollTo({ top: scroller.scrollTop + target.getBoundingClientRect().top - top, behavior: "smooth" });
}

function syncRemote(area) {
  const box = area.querySelector(".mari-chat-input-box");
  if (!box || box.querySelector(":scope > .mari-ph-remote")) return;
  const remote = h("div.mari-ph-remote", { "data-component": "ScrollRemote" });
  for (const direction of ["up", "down"]) {
    const label = direction === "up" ? "이전 메시지 (길게 누르면 맨 위로)" : "다음 메시지 (길게 누르면 맨 아래로)";
    let timer = null;
    let held = false;
    const clear = () => {
      if (timer !== null) marinara.clearTimeout(timer);
      timer = null;
    };
    const button = h("button", {
      type: "button",
      "aria-label": label,
      title: label,
      onPointerdown: () => {
        held = false;
        clear();
        timer = marinara.setTimeout(() => {
          held = true;
          remoteJump(area, direction, true);
        }, 450);
      },
      onPointerup: clear,
      onPointerleave: clear,
      onPointercancel: clear,
      onContextmenu: (event) => event.preventDefault(),
      onClick: () => {
        if (held) held = false;
        else remoteJump(area, direction, false);
      },
    });
    button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${direction === "up" ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"}"/></svg>`;
    remote.append(button);
  }
  box.append(remote);
}
syncRemote = guard("chat", syncRemote);
marinara.onCleanup(() => document.querySelectorAll(".mari-ph-remote").forEach((node) => node.remove()));
