(() => {
  const GAME_WIDTH = 960;
  const GAME_HEIGHT = 540;
  const WORLD_WIDTH = 10000;
  const WORLD_HEIGHT = 540;
  const GRAVITY_Y = 1400;
  const PLAYER_SPEED = 220;
  const PLAYER_JUMP = 840;
  // Invincibility now always runs for a fixed window starting the instant the
  // game resumes from a scroll popup (see collectScroll), rather than being
  // tied to how long the popup happened to stay open.
  const INVINCIBILITY_MS = 3000;
  const ENEMY_SPACING = 300;
  const ENEMY_RANGE = 20;
  const LAND_ENEMY_RANGE = ENEMY_RANGE * 6;
  const ENEMY_SPEED = 55;
  const ENEMY_SPEED_VARIATION = 0.15;
  const ENEMY_SPEED_VARIATION_SHIP = 0.25;
  const LEVEL_X_SCALE = 2;
  // The "platform" texture is generated on a 64x64 canvas but only the top
  // PLATFORM_VISUAL_HEIGHT pixels are actually painted (see makeTexture("platform", ...)).
  // Sprites default to a 64x64 frame centered on their (x, y), so the visual
  // top edge of a platform sits PLATFORM_FRAME_HALF px above its y position.
  const PLATFORM_FRAME_HALF = 32;
  const PLATFORM_VISUAL_HEIGHT = 20;
  const ENEMY_DISPLAY_WIDTH = 56;
  const ENEMY_DISPLAY_HEIGHT = 44;
  const ENEMY_BODY_WIDTH = 40;
  const ENEMY_BODY_HEIGHT = 34;
  // Nephi's own sprite/hitbox dimensions (see buildPlayer) - kept here as
  // named constants so other things (like the guard sizing below) can be
  // defined relative to them instead of duplicating magic numbers.
  const PLAYER_DISPLAY_WIDTH = 40;
  const PLAYER_DISPLAY_HEIGHT = 60;
  const PLAYER_BODY_WIDTH = 28;
  const PLAYER_BODY_HEIGHT = 48;
  // Guards (Level 3) should stand 10% taller than Nephi, both visually and
  // in their collision box, while keeping the same width as other enemies.
  const GUARD_DISPLAY_HEIGHT = PLAYER_DISPLAY_HEIGHT * 1.1;
  const GUARD_BODY_HEIGHT = PLAYER_BODY_HEIGHT * 1.1;

  // Scroll popup: the box auto-sizes around whatever text it's given (see
  // fitScrollPopupText/layoutScrollPopup) instead of using a fixed height,
  // since scroll messages range from a single short line up to several
  // full verses of scripture.
  const SCROLL_POPUP_TOP = 118;
  const SCROLL_POPUP_WIDTH = 640;
  const SCROLL_POPUP_WRAP_WIDTH = 560;
  const SCROLL_POPUP_PADDING_TOP = 14;
  const SCROLL_POPUP_PADDING_BOTTOM = 14;
  const SCROLL_POPUP_TITLE_GAP = 8;
  const SCROLL_POPUP_BUTTON_GAP = 14;
  const SCROLL_POPUP_BASE_FONT = 17;
  const SCROLL_POPUP_MIN_FONT = 11;
  const SCROLL_POPUP_MAX_TEXT_HEIGHT = 260;

  // Story/ending panel: same idea as the scroll popup above, but here the
  // story text ranges from a one-line summary up to a full multi-paragraph
  // scripture passage (Level 2's is 1000+ characters with several verse
  // breaks), so it needs several fallback levels - shrink the font, then
  // tighten line spacing, then tighten paragraph spacing - before finally
  // just accepting whatever fits so nothing ever overlaps.
  const STORY_PANEL_MAX_WIDTH = 860;
  const STORY_PANEL_SIDE_PADDING = 34;
  const STORY_PANEL_TOP_BOTTOM_PADDING = 24;
  const STORY_TOP_MARGIN = 18;
  const STORY_BOTTOM_MARGIN = 46;
  const STORY_ELEMENT_GAP = 12;
  const STORY_TIGHT_ELEMENT_GAP = 6;
  const STORY_NAME_FONT = 20;
  const STORY_TITLE_FONT = 28;
  const STORY_BUTTON_FONT = 22;
  const STORY_HINT_FONT = 13;
  const STORY_BASE_FONT = 19;
  const STORY_MIN_FONT = 12;

  const LEVEL_LAYOUTS = [
    {
      platforms: [
        { x: 360, y: 404, width: 160 },
        { x: 980, y: 372, width: 128 },
        { x: 1500, y: 340, width: 192 },
        { x: 2100, y: 392, width: 160 },
        { x: 2840, y: 350, width: 192 },
        { x: 3520, y: 384, width: 128 },
        { x: 4200, y: 332, width: 192 },
      ],
      enemies: [320, 700, 1060, 1420, 1800, 2220, 2640, 3080, 3500, 3940, 4380],
    },
    {
      platforms: [
        { x: 440, y: 386, width: 128 },
        { x: 920, y: 352, width: 160 },
        { x: 1360, y: 318, width: 192 },
        { x: 1880, y: 382, width: 160 },
        { x: 2620, y: 344, width: 192 },
        { x: 3320, y: 378, width: 160 },
        { x: 4040, y: 336, width: 192 },
        { x: 4520, y: 392, width: 128 },
      ],
      enemies: [260, 620, 980, 1340, 1700, 2100, 2500, 2940, 3380, 3820, 4280, 4680],
    },
    {
      platforms: [
        { x: 300, y: 360, width: 128 },
        { x: 620, y: 304, width: 160 },
        { x: 980, y: 248, width: 160 },
        { x: 1360, y: 292, width: 128 },
        { x: 1760, y: 232, width: 192 },
        { x: 2200, y: 286, width: 160 },
        { x: 2700, y: 240, width: 160 },
        { x: 3180, y: 304, width: 192 },
        { x: 3720, y: 260, width: 160 },
        { x: 4300, y: 328, width: 160 },
      ],
      enemies: [420, 720, 1100, 1440, 1820, 2140, 2500, 2860, 3240, 3620, 4020, 4440],
    },
    {
      platforms: [
        { x: 420, y: 396, width: 160 },
        { x: 860, y: 356, width: 128 },
        { x: 1340, y: 324, width: 160 },
        { x: 1980, y: 388, width: 128 },
        { x: 2660, y: 342, width: 192 },
        { x: 3320, y: 374, width: 160 },
        { x: 3960, y: 330, width: 192 },
        { x: 4500, y: 384, width: 128 },
      ],
      enemies: [340, 760, 1180, 1580, 2020, 2460, 2880, 3300, 3740, 4180, 4620],
    },
    {
      platforms: [
        { x: 420, y: 388, width: 128 },
        { x: 980, y: 344, width: 160 },
        { x: 1540, y: 380, width: 128 },
        { x: 2200, y: 336, width: 192 },
        { x: 2860, y: 374, width: 160 },
        { x: 3520, y: 322, width: 192 },
        { x: 4240, y: 356, width: 160 },
      ],
      enemies: [300, 700, 1120, 1520, 1960, 2420, 2880, 3360, 3860, 4380],
    },
    {
      platforms: [
        { x: 360, y: 402, width: 128 },
        { x: 860, y: 360, width: 160 },
        { x: 1320, y: 388, width: 128 },
        { x: 1840, y: 344, width: 160 },
        { x: 2420, y: 392, width: 128 },
        { x: 3040, y: 352, width: 160 },
        { x: 3720, y: 384, width: 160 },
        { x: 4380, y: 338, width: 192 },
      ],
      enemies: [260, 620, 980, 1360, 1800, 2260, 2720, 3200, 3680, 4180, 4640],
    },
  ];

  const LEVEL_SCROLL_MESSAGES = [
    [
      "1Nephi 2:1-2\n\n1 For behold, it came to pass that the Lord spake unto my father, yea, even in a dream, and said unto him: Blessed art thou, Lehi, because of the things which thou hast done; and because thou hast been faithful and declared unto this people the things which I commanded thee, behold, they seek to take away thy life.\n\n2 And it came to pass that the Lord commanded my father, even in a dream, that he should take his family and depart into the wilderness.",
      "1Nephi 2:3-4\n\n3 And it came to pass that he was obedient unto the word of the Lord, wherefore he did as the Lord commanded him.\n\n4  And it came to pass that he departed into the wilderness. And he left his house, and the land of his inheritance, and his gold, and his silver, and his precious things, and took nothing with him, save it were his family, and provisions, and tents, and departed into the wilderness.",
      "1Nephi 2: 5-6\n\n5 And he came down by the borders near the shore of the Red Sea; and he traveled in the wilderness in the borders which are nearer the Red Sea; and he did travel in the wilderness with his family, which consisted of my mother, Sariah, and my elder brothers, who were Laman, Lemuel, and Sam.\n\n6 And it came to pass that when he had traveled three days in the wilderness, he pitched his tent in a valley by the side of a river of water.",
    ],
    [
      "1Nephi 3:9-11\n\n9 And I, Nephi, and my brethren took our journey in the wilderness, with our tents, to go up to the land of Jerusalem.\n\n10 And it came to pass that when we had gone up to the land of Jerusalem, I and my brethren did consult one with another.\n\n11 And we cast lots—who of us should go in unto the house of Laban. And it came to pass that the lot fell upon Laman; and Laman went in unto the house of Laban, and he talked with him as he sat in his house.",
      "1Nephi 3:12-14\n\nFor behold, he knew that Jerusalem must be destroyed, because of the wickedness of the people. For behold, they have rejected the words of the prophets. Wherefore, if my father should dwell in the land after he hath been commanded to flee out of the land, behold, he would perish; wherefore, it must needs be that he flee out of the land.12 And he desired of Laban the records which were engraven upon the plates of brass, which contained the genealogy of my father.\n\n13 And behold, it came to pass that Laban was angry, and thrust him out from his presence; and he would not that he should have the records. Wherefore, he said unto him: Behold thou art a robber, and I will slay thee.\n\n14 But Laman fled out of his presence, and told the things which Laban had done, unto us. And we began to be exceedingly sorrowful, and my brethren were about to return unto my father in the wilderness.",
      "1Nephi 3:22-27\n\nAnd it came to pass that the angel of the Lord spake unto them again, saying: Go up, for the Lord will deliver Laban into your hands22 And it came to pass that we went down to the land of our inheritance, and we did gather together our gold, and our silver, and our precious things.\n\n23 And after we had gathered these things together, we went up again unto the house of Laban.\n\n24 And it came to pass that we went in unto Laban, and desired him that he would give unto us the records which were engraven upon the plates of brass, for which we would give unto him our gold, and our silver, and all our precious things.\n\n25 And it came to pass that when Laban saw our property, and that it was exceedingly great, he did lust after it, insomuch that he thrust us out, and sent his servants to slay us, that he might obtain our property.\n\n26 And it came to pass that we did flee before the servants of Laban, and we were obliged to leave behind our property, and it fell into the hands of Laban.\n\n27 And it came to pass that we fled into the wilderness, and the servants of Laban did not overtake us, and we hid ourselves in the cavity of a rock.",
    ],
    [
      "Jerusalem's streets are crowded and dangerous.",
      "Wisdom is needed to move unseen.",
      "The book lies deeper within the city.",
    ],
    [
      "The desert is still harsh, but family gives strength.",
      "Every mile carries them closer together again.",
      "Hope keeps their feet moving across the sand.",
    ],
    [
      "The coast appears like a promise on the horizon.",
      "Fresh water and open air renew the journey.",
      "The family presses on toward the sea path ahead.",
    ],
    [
      "The sea is wide, but hope sails with them.",
      "The promised land draws near at last.",
      "The ship cuts onward through the waves of promise.",
    ],
  ];

  const LEVELS = [
    {
      name: "Level 1",
      title: "Leaving Jerusalem",
      story:
        "Nephi must cross the desert, dodge snakes and scorpions, and reach his tent in the wilderness.",
      theme: {
        skyTop: 0x3b2f2f,
        skyBottom: 0x8b6d4d,
        ground: 0x7c5734,
        groundTop: 0x9f7b4a,
        accent: 0xe0c18a,
      },
    },
    {
      name: "Level 2",
      title: "Back to Jerusalem",
      story:
        "1Nephi 3:1-7\n\n1 And it came to pass that I, Nephi, returned from speaking with the Lord, to the tent of my father.\n\n2 And it came to pass that he spake unto me, saying: Behold I have dreamed a dream, in the which the Lord hath commanded me that thou and thy brethren shall return to Jerusalem.\n\n3 For behold, Laban hath the record of the Jews and also a genealogy of my forefathers, and they are engraven upon plates of brass.\n\n4 Wherefore, the Lord hath commanded me that thou and thy brothers should go unto the house of Laban, and seek the records, and bring them down hither into the wilderness.\n\n5 And now, behold thy brothers murmur, saying it is a hard thing which I have required of them; but behold I have not required it of them, but it is a commandment of the Lord.\n\n6 Therefore go, my son, and thou shalt be favored of the Lord, because thou hast not murmured.\n\n7 And it came to pass that I, Nephi, said unto my father: I will go and do the things which the Lord hath commanded, for I know that the Lord giveth no commandments unto the children of men, save he shall prepare a way for them that they may accomplish the thing which he commandeth them.",
      theme: {
        skyTop: 0x26364d,
        skyBottom: 0xb28a58,
        ground: 0x745133,
        groundTop: 0xa6814f,
        accent: 0xe9dfb6,
      },
    },
    {
      name: "Level 3",
      title: "The Streets of Jerusalem",
      story:
        "Nephi moves through the city streets to find a book while city guards patrol ahead.",
      theme: {
        skyTop: 0x233148,
        skyBottom: 0x6f8db6,
        ground: 0x5d5149,
        groundTop: 0x8b7a68,
        accent: 0xf2d7a0,
      },
    },
    {
      name: "Level 4",
      title: "Return to the Family",
      story:
        "With the book in hand, Nephi travels back through the desert to find his family again.",
      theme: {
        skyTop: 0x3d2e2c,
        skyBottom: 0x9a7655,
        ground: 0x725034,
        groundTop: 0x9d7441,
        accent: 0xd9b98f,
      },
    },
    {
      name: "Level 5",
      title: "The Coastal Paradise",
      story:
        "Nephi and his family leave the tent behind and journey toward a coastal paradise.",
      theme: {
        skyTop: 0x0f5f7d,
        skyBottom: 0x9bd7d8,
        ground: 0x65745f,
        groundTop: 0x9ab29d,
        accent: 0xfff1c9,
      },
    },
    {
      name: "Level 6",
      title: "Across the Ocean",
      story:
        "The final journey carries the family by boat over the sea toward the promised land.",
      theme: {
        skyTop: 0x05324d,
        skyBottom: 0x4da3d4,
        ground: 0x38526a,
        groundTop: 0x5c7994,
        accent: 0xc9f2ff,
      },
    },
  ];

  class BootScene extends Phaser.Scene {
    constructor() {
      super("BootScene");
    }

    preload() {
      this.load.image('nephi', '../../assets/Nephi.png');
      this.load.image('snake', '../../assets/Snake.png');
      this.load.image('scorpion', '../../assets/Scorpion.png');
      this.load.image('scroll', '../../assets/Scroll.png');
      this.load.image('tent', '../../assets/Tent.png');
      this.load.image('city', '../../assets/City.png');
      this.load.image('guard', '../../assets/Guard.png');
      this.load.image('laban', '../../assets/Laben.png');

      this.load.on('loaderror', (file) => {
        console.error(`[Nephi Journey] Failed to load "${file.key}" from "${file.src}". Check that the file exists at that path (case-sensitive) relative to index.html.`);
        if (file.key === 'laban') {
          // "Laben.png" is an easy typo for "Laban.png" (the more common
          // spelling) - if the first attempt 404s, try the alternate
          // spelling automatically instead of leaving the goal blank.
          console.warn('[Nephi Journey] Retrying "laban" as "../../assets/Laban.png"...');
          this.load.image('laban', '../../assets/Laban.png');
        }
      });
    }

    create() {
      this.buildTextures();
      this.scene.start("StoryScene", { levelIndex: 0 });
    }

    buildTextures() {
      const makeTexture = (key, draw) => {
        if (this.textures.exists(key)) {
          return;
        }
        const g = this.add.graphics();
        draw(g);
        g.generateTexture(key, 64, 64);
        g.destroy();
      };

      makeTexture("ground", (g) => {
        g.fillStyle(0x875c34, 1);
        g.fillRect(0, 0, 64, 64);
        g.fillStyle(0xb58244, 1);
        g.fillRect(0, 0, 64, 10);
        g.fillStyle(0x5d3f24, 1);
        g.fillRect(0, 50, 64, 14);
        g.lineStyle(2, 0x9e744a, 0.35);
        g.strokeRect(2, 2, 60, 60);
      });

      makeTexture("platform", (g) => {
        g.fillStyle(0x8d6540, 1);
        g.fillRect(0, 0, 64, 20);
        g.fillStyle(0xbaa06d, 1);
        g.fillRect(0, 0, 64, 5);
      });

      makeTexture("goal", (g) => {
        g.fillStyle(0x2b1d14, 1);
        g.fillRect(28, 6, 8, 52);
        g.fillStyle(0xf2c14e, 1);
        g.fillRoundedRect(20, 10, 30, 18, 4);
        g.fillStyle(0xe6edf4, 1);
        g.fillRect(22, 16, 26, 4);
        g.fillStyle(0x8a5d2e, 1);
        g.fillRect(14, 20, 12, 12);
        g.fillRect(52, 20, 12, 12);
      });

      makeTexture("goal-tent", (g) => {
        g.fillStyle(0xd9b98f, 1);
        g.fillTriangle(8, 52, 32, 10, 56, 52);
        g.fillStyle(0x8d6540, 1);
        g.fillRect(28, 32, 8, 20);
        g.lineStyle(3, 0x6b4a2f, 1);
        g.strokeTriangle(8, 52, 32, 10, 56, 52);
      });

      makeTexture("goal-shore", (g) => {
        g.fillStyle(0xc9f2ff, 1);
        g.fillEllipse(32, 42, 36, 14);
        g.fillStyle(0x9ab29d, 1);
        g.fillTriangle(14, 46, 32, 16, 50, 46);
        g.fillStyle(0xf2c14e, 1);
        g.fillCircle(48, 20, 8);
      });

      makeTexture("goal-boat", (g) => {
        g.fillStyle(0x5c7994, 1);
        g.fillTriangle(6, 48, 58, 48, 50, 30);
        g.fillStyle(0xc9f2ff, 1);
        g.fillRect(30, 10, 4, 34);
        g.fillTriangle(32, 12, 50, 28, 32, 28);
        g.lineStyle(3, 0x2c4054, 1);
        g.strokeTriangle(6, 48, 58, 48, 50, 30);
      });

      makeTexture("ship", (g) => {
        g.fillStyle(0x5c7994, 1);
        g.fillTriangle(8, 48, 56, 48, 46, 30);
        g.fillStyle(0x3e2b1f, 1);
        g.fillRect(18, 30, 28, 10);
        g.fillStyle(0xc9f2ff, 1);
        g.fillRect(30, 10, 4, 30);
        g.fillTriangle(32, 12, 50, 28, 32, 28);
        g.lineStyle(3, 0x2c4054, 1);
        g.strokeTriangle(8, 48, 56, 48, 46, 30);
      });
    }
  }

  class StoryScene extends Phaser.Scene {
    constructor() {
      super("StoryScene");
    }

    create(data) {
      const levelIndex = data.levelIndex ?? 0;
      const level = LEVELS[levelIndex];
      const { width, height } = this.scale;

      this.cameras.main.setBackgroundColor(0x10141a);

      const panelWidth = Math.min(STORY_PANEL_MAX_WIDTH, width - 40);
      const wrapWidth = panelWidth - STORY_PANEL_SIDE_PADDING * 2;

      const panel = this.add
        .rectangle(width / 2, height / 2, panelWidth, 360, 0x101820, 0.92)
        .setStrokeStyle(4, 0x5a6d7f, 1);

      // All content pieces are created with origin (0.5, 0) - centered
      // horizontally, anchored at their own TOP edge - so they can be
      // stacked top-to-bottom purely from measured heights, with no
      // hardcoded offsets that long text could blow past.
      const nameText = this.add
        .text(width / 2, 0, level.name, {
          fontFamily: "Verdana",
          fontSize: `${STORY_NAME_FONT}px`,
          color: "#f2c14e",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0);

      const titleText = this.add
        .text(width / 2, 0, level.title, {
          fontFamily: "Verdana",
          fontSize: `${STORY_TITLE_FONT}px`,
          color: "#f7edd9",
          fontStyle: "bold",
          align: "center",
          wordWrap: { width: wrapWidth },
        })
        .setOrigin(0.5, 0);

      const storyText = this.add
        .text(width / 2, 0, level.story, {
          fontFamily: "Verdana",
          fontSize: `${STORY_BASE_FONT}px`,
          color: "#d7e2ea",
          align: "center",
          wordWrap: { width: wrapWidth },
          lineSpacing: 8,
        })
        .setOrigin(0.5, 0);

      const startButton = this.add
        .text(width / 2, 0, "Start", {
          fontFamily: "Verdana",
          fontSize: `${STORY_BUTTON_FONT}px`,
          color: "#111",
          backgroundColor: "#f2c14e",
          padding: { left: 22, right: 22, top: 10, bottom: 10 },
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0)
        .setInteractive({ useHandCursor: true });

      const hint = this.add
        .text(width / 2, 0, "Use arrow keys, space, or touch buttons to play.", {
          fontFamily: "Verdana",
          fontSize: `${STORY_HINT_FONT}px`,
          color: "#9fb3c8",
          align: "center",
        })
        .setOrigin(0.5, 0);

      const maxContentHeight = height - STORY_TOP_MARGIN - STORY_BOTTOM_MARGIN - STORY_PANEL_TOP_BOTTOM_PADDING * 2;

      const measureTotalHeight = (gap) =>
        nameText.height +
        gap +
        titleText.height +
        gap +
        storyText.height +
        gap +
        startButton.height +
        gap +
        hint.height;

      // Stage 1: shrink the story font down to its floor.
      let storyFontSize = STORY_BASE_FONT;
      while (measureTotalHeight(STORY_ELEMENT_GAP) > maxContentHeight && storyFontSize > STORY_MIN_FONT) {
        storyFontSize -= 1;
        storyText.setFontSize(storyFontSize);
      }

      // Stage 2: still too tall (typically only for the longest scripture
      // passages) - tighten the line spacing.
      if (measureTotalHeight(STORY_ELEMENT_GAP) > maxContentHeight) {
        storyText.setLineSpacing(3);
      }

      // Stage 3: still too tall - the gaps between paragraphs in the source
      // text (blank lines) are costing as much vertical space as several
      // lines of prose. Collapse them to single line breaks; this keeps
      // every word but stops each verse from reserving a full blank line.
      let gap = STORY_ELEMENT_GAP;
      if (measureTotalHeight(gap) > maxContentHeight) {
        storyText.setText(level.story.replace(/\n{2,}/g, "\n"));
        gap = STORY_TIGHT_ELEMENT_GAP;
      }

      // Whatever the result, lay everything out top-to-bottom from the
      // measured heights so nothing ever overlaps, even in the worst case.
      const totalHeight = measureTotalHeight(gap);
      const panelHeight = Math.min(
        height - STORY_TOP_MARGIN * 2,
        totalHeight + STORY_PANEL_TOP_BOTTOM_PADDING * 2
      );
      panel.setSize(panelWidth, panelHeight);
      panel.setPosition(width / 2, height / 2);

      let cursorY = height / 2 - panelHeight / 2 + STORY_PANEL_TOP_BOTTOM_PADDING;
      nameText.setPosition(width / 2, cursorY);
      cursorY += nameText.height + gap;
      titleText.setPosition(width / 2, cursorY);
      cursorY += titleText.height + gap;
      storyText.setPosition(width / 2, cursorY);
      cursorY += storyText.height + gap;
      startButton.setPosition(width / 2, cursorY);
      cursorY += startButton.height + gap;
      hint.setPosition(width / 2, cursorY);

      const startGame = () => {
        this.scene.start("GameScene", { levelIndex });
      };

      startButton.on("pointerdown", startGame);
      this.input.keyboard.once("keydown-ENTER", startGame);
      this.input.keyboard.once("keydown-SPACE", startGame);

      this.add
        .text(width / 2, height - 28, "Nephi Journey", {
          fontFamily: "Verdana",
          fontSize: "14px",
          color: "#708090",
        })
        .setOrigin(0.5);
    }
  }

  class EndingScene extends Phaser.Scene {
    constructor() {
      super("EndingScene");
    }

    create() {
      const { width, height } = this.scale;
      this.cameras.main.setBackgroundColor(0x102130);

      this.add
        .text(width / 2, height / 2 - 100, "Journey Complete", {
          fontFamily: "Verdana",
          fontSize: "36px",
          color: "#f2c14e",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      this.add
        .text(width / 2, height / 2 - 35, "Nephi and his family have reached the Promised Land.", {
          fontFamily: "Verdana",
          fontSize: "20px",
          color: "#f7edd9",
          align: "center",
          wordWrap: { width: Math.min(760, width - 80) },
        })
        .setOrigin(0.5);

      const playAgain = this.add
        .text(width / 2, height / 2 + 70, "Play Again", {
          fontFamily: "Verdana",
          fontSize: "24px",
          color: "#111",
          backgroundColor: "#f2c14e",
          padding: { left: 22, right: 22, top: 12, bottom: 12 },
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      playAgain.on("pointerdown", () => {
        this.scene.start("StoryScene", { levelIndex: 0 });
      });
    }
  }

  class GameScene extends Phaser.Scene {
    constructor() {
      super("GameScene");
    }

    init(data) {
      this.levelIndex = data.levelIndex ?? 0;
    }

    create() {
      this.level = LEVELS[this.levelIndex];
      this.isShipLevel = this.levelIndex === 5;
      this.waterlineY = 346;
      this.invincibleUntil = 0;
      this.levelFinished = false;
      this.gamePaused = false;
      this.scrollsCollected = 0;
      this.touchState = { left: false, right: false, jumpQueued: false };

      this.cameras.main.setBackgroundColor(this.level.theme.skyTop);
      this.physics.world.gravity.y = this.isShipLevel ? 0 : GRAVITY_Y;
      this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      this.buildBackdrop();
      this.buildWorld();
      this.buildPlayer();
      this.buildEnemies();
      this.buildScrolls();
      this.buildGoal();
      this.buildHUD();
      this.buildTouchControls();
      this.setupInputs();
      this.applyCamera();

      if (this.physics.world.debugGraphic) {
        this.physics.world.debugGraphic.setDepth(1000);
      }
    }

    buildBackdrop() {
      const { skyTop, skyBottom } = this.level.theme;
      const top = Phaser.Display.Color.IntegerToColor(skyTop);
      const bottom = Phaser.Display.Color.IntegerToColor(skyBottom);

      const bg = this.add.graphics().setScrollFactor(0.2);
      for (let y = 0; y < WORLD_HEIGHT; y += 6) {
        const t = y / WORLD_HEIGHT;
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(top, bottom, 100, t * 100);
        bg.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
        bg.fillRect(0, y, WORLD_WIDTH, 6);
      }

      bg.fillStyle(0xffffff, 0.06);
      for (let i = 0; i < 18; i += 1) {
        const x = 180 + i * 260;
        const y = 70 + (i % 3) * 24;
        bg.fillCircle(x, y, 32 + (i % 4) * 8);
      }

      this.drawBackdropDecorations(bg);
    }

    drawBackdropDecorations(bg) {
      const { accent, groundTop } = this.level.theme;
      switch (this.levelIndex) {
        case 0:
          this.drawDesertBackdrop(bg, groundTop, accent, false);
          break;
        case 1:
          this.drawDesertBackdrop(bg, groundTop, accent, true);
          break;
        case 2:
          this.drawCityBackdrop(bg, accent, groundTop);
          break;
        case 3:
          this.drawReturnDesertBackdrop(bg, groundTop, accent);
          break;
        case 4:
          this.drawCoastBackdrop(bg, accent, groundTop);
          break;
        case 5:
          this.drawOceanBackdrop(bg, accent, groundTop);
          break;
        default:
          this.drawDesertBackdrop(bg, groundTop, accent, false);
          break;
      }
    }

    drawDesertBackdrop(bg, duneColor, accentColor, mirrored) {
      const dunes = mirrored
        ? [
            { x: 500, y: 412, width: 960, height: 180 },
            { x: 1680, y: 424, width: 1120, height: 200 },
            { x: 3180, y: 410, width: 1020, height: 176 },
            { x: 4380, y: 428, width: 880, height: 190 },
          ]
        : [
            { x: 620, y: 420, width: 1020, height: 190 },
            { x: 1880, y: 430, width: 1120, height: 210 },
            { x: 3320, y: 416, width: 980, height: 182 },
            { x: 4520, y: 424, width: 860, height: 176 },
          ];

      dunes.forEach((dune) => {
        bg.fillStyle(duneColor, 0.18);
        bg.fillEllipse(dune.x, dune.y, dune.width, dune.height);
      });

      const mountains = mirrored
        ? [620, 1820, 3100, 4260]
        : [820, 2140, 3500, 4660];
      mountains.forEach((x, index) => {
        this.drawMountain(bg, x, 315 + (index % 2) * 24, 420 + index * 10, 150 + (index % 3) * 16, accentColor, 0.16);
      });

      this.drawTent(bg, mirrored ? 980 : 3840, 330, 120, 90, accentColor, 0.22);
      this.drawTent(bg, mirrored ? 3320 : 1260, 346, 100, 76, duneColor, 0.16);
      this.drawSun(bg, mirrored ? 4460 : 4300, 104, 72, accentColor, 0.22);
    }

    drawReturnDesertBackdrop(bg, duneColor, accentColor) {
      const dunes = [
        { x: 560, y: 416, width: 1040, height: 188 },
        { x: 1900, y: 428, width: 1160, height: 208 },
        { x: 3340, y: 412, width: 1080, height: 184 },
        { x: 4500, y: 424, width: 900, height: 180 },
      ];
      dunes.forEach((dune) => {
        bg.fillStyle(duneColor, 0.2);
        bg.fillEllipse(dune.x, dune.y, dune.width, dune.height);
      });

      this.drawMountain(bg, 980, 308, 460, 164, accentColor, 0.17);
      this.drawMountain(bg, 2480, 320, 520, 176, accentColor, 0.14);
      this.drawMountain(bg, 4040, 312, 500, 168, accentColor, 0.15);
      this.drawTent(bg, 820, 338, 124, 90, accentColor, 0.22);
      this.drawTent(bg, 2700, 348, 110, 82, accentColor, 0.18);
      this.drawTent(bg, 4020, 332, 124, 92, accentColor, 0.22);
      this.drawSun(bg, 430, 108, 64, accentColor, 0.18);
    }

    drawCityBackdrop(bg, accentColor, stoneColor) {
      // A spread of overlapping City.png silhouettes reads as a continuous
      // skyline across the level, the same way the old hand-drawn blocks did.
      const skyline = [
        { x: 260, y: 210, width: 440, height: 214, alpha: 0.2 },
        { x: 760, y: 186, width: 480, height: 240, alpha: 0.24 },
        { x: 1340, y: 202, width: 450, height: 220, alpha: 0.18 },
        { x: 1900, y: 192, width: 470, height: 232, alpha: 0.22 },
        { x: 2480, y: 206, width: 440, height: 212, alpha: 0.16 },
        { x: 3040, y: 196, width: 470, height: 228, alpha: 0.2 },
      ];

      skyline.forEach((spot) => {
        this.add
          .image(spot.x, spot.y, "city")
          .setOrigin(0.5, 0)
          .setDisplaySize(spot.width, spot.height)
          .setTint(stoneColor)
          .setAlpha(spot.alpha)
          .setScrollFactor(0.2);
      });

      this.drawWallBand(bg, 0x3b342f, 0.12, 250);
      this.drawBanner(bg, 920, 278, accentColor, 0.18);
      this.drawBanner(bg, 3220, 300, accentColor, 0.16);
    }

    drawCoastBackdrop(bg, accentColor, shorelineColor) {
      const waves = [
        { x: 640, y: 320, w: 840, h: 120 },
        { x: 1760, y: 332, w: 960, h: 128 },
        { x: 3040, y: 324, w: 980, h: 122 },
        { x: 4280, y: 330, w: 860, h: 120 },
      ];
      waves.forEach((wave) => {
        bg.fillStyle(shorelineColor, 0.16);
        bg.fillEllipse(wave.x, wave.y, wave.w, wave.h);
      });

      this.drawPalm(bg, 460, 356, accentColor, 0.18);
      this.drawPalm(bg, 1420, 362, accentColor, 0.14);
      this.drawPalm(bg, 3380, 350, accentColor, 0.18);
      this.drawPalm(bg, 4300, 360, accentColor, 0.16);
      this.drawCliff(bg, 740, 284, 240, 150, shorelineColor, 0.18);
      this.drawCliff(bg, 2500, 268, 280, 168, shorelineColor, 0.16);
      this.drawSun(bg, 4340, 96, 70, accentColor, 0.24);
    }

    drawOceanBackdrop(bg, accentColor, horizonColor) {
      this.drawWaveBand(bg, 460, 302, 0x2f6f9b, 0.12);
      this.drawWaveBand(bg, 1540, 318, 0x2f6f9b, 0.14);
      this.drawWaveBand(bg, 2720, 304, 0x2f6f9b, 0.12);
      this.drawWaveBand(bg, 3920, 314, 0x2f6f9b, 0.14);

      this.drawBoat(bg, 820, 312, 190, 96, horizonColor, 0.16);
      this.drawBoat(bg, 2440, 286, 210, 110, accentColor, 0.2);
      this.drawBoat(bg, 3900, 300, 220, 108, horizonColor, 0.18);
      this.drawIsland(bg, 1470, 260, 250, 80, accentColor, 0.14);
      this.drawIsland(bg, 3240, 244, 220, 72, accentColor, 0.12);
      this.drawSun(bg, 4380, 96, 72, accentColor, 0.22);
    }

    drawMountain(bg, x, baseY, width, height, color, alpha) {
      bg.fillStyle(color, alpha);
      bg.fillTriangle(x - width / 2, baseY, x, baseY - height, x + width / 2, baseY);
      bg.fillStyle(color, alpha * 0.55);
      bg.fillTriangle(x + width * 0.08, baseY, x + width * 0.5, baseY, x + width * 0.1, baseY - height * 0.78);
    }

    drawDune(bg, x, y, width, height, color, alpha) {
      bg.fillStyle(color, alpha);
      bg.fillEllipse(x, y, width, height);
    }

    drawTent(bg, x, y, width, height, color, alpha) {
      // Matches the old triangle's bounding box exactly: left edge at x,
      // right edge at x + width, top at y, bottom at y + height.
      return this.add
        .image(x + width / 2, y, "tent")
        .setOrigin(0.5, 0)
        .setDisplaySize(width, height)
        .setTint(color)
        .setAlpha(alpha)
        .setScrollFactor(0.2);
    }

    drawSun(bg, x, y, radius, color, alpha) {
      bg.fillStyle(color, alpha);
      bg.fillCircle(x, y, radius);
    }

    drawTower(bg, x, y, width, height, color, alpha) {
      bg.fillStyle(color, alpha);
      bg.fillRect(x, y, width, height);
      bg.fillTriangle(x - 6, y + 4, x + width / 2, y - 42, x + width + 6, y + 4);
    }

    drawDome(bg, x, y, width, height, color, alpha) {
      bg.fillStyle(color, alpha);
      bg.fillRect(x, y + height * 0.35, width, height * 0.65);
      bg.fillCircle(x + width / 2, y + height * 0.35, width / 2);
    }

    drawWallBand(bg, color, alpha, topY) {
      bg.fillStyle(color, alpha);
      bg.fillRect(0, topY, WORLD_WIDTH, 22);
    }

    drawBanner(bg, x, y, color, alpha) {
      bg.fillStyle(color, alpha);
      bg.fillRect(x, y, 18, 86);
      bg.fillTriangle(x + 18, y + 8, x + 58, y + 22, x + 18, y + 36);
    }

    drawPalm(bg, x, y, color, alpha) {
      bg.fillStyle(color, alpha);
      bg.fillRect(x, y - 68, 10, 68);
      bg.fillTriangle(x + 5, y - 64, x - 36, y - 84, x + 12, y - 72);
      bg.fillTriangle(x + 5, y - 64, x + 40, y - 90, x + 18, y - 72);
      bg.fillTriangle(x + 5, y - 64, x - 18, y - 104, x + 12, y - 72);
      bg.fillTriangle(x + 5, y - 64, x + 8, y - 108, x + 16, y - 72);
    }

    drawCliff(bg, x, y, width, height, color, alpha) {
      bg.fillStyle(color, alpha);
      bg.fillTriangle(x, y + height, x + width / 2, y, x + width, y + height);
      bg.fillRect(x + width * 0.15, y + height * 0.5, width * 0.7, height * 0.5);
    }

    drawWaveBand(bg, x, y, color, alpha) {
      bg.fillStyle(color, alpha);
      bg.fillEllipse(x, y, 460, 92);
      bg.fillEllipse(x + 260, y + 10, 420, 82);
    }

    drawBoat(bg, x, y, width, height, color, alpha) {
      bg.fillStyle(color, alpha);
      bg.fillTriangle(x, y + height, x + width, y + height, x + width * 0.72, y + height * 0.55);
      bg.fillTriangle(x, y + height, x + width * 0.28, y + height * 0.55, x + width * 0.72, y + height * 0.55);
      bg.fillRect(x + width * 0.46, y + 10, 8, height * 0.85);
      bg.fillTriangle(x + width * 0.5, y + 14, x + width * 0.86, y + height * 0.42, x + width * 0.5, y + height * 0.42);
      bg.fillTriangle(x + width * 0.5, y + 14, x + width * 0.16, y + height * 0.42, x + width * 0.5, y + height * 0.42);
    }

    drawIsland(bg, x, y, width, height, color, alpha) {
      bg.fillStyle(color, alpha);
      bg.fillEllipse(x, y + height, width, height * 0.7);
      bg.fillTriangle(x - width * 0.2, y + height, x + width / 2, y, x + width * 1.2, y + height);
    }

    buildWorld() {
      const groundY = 470;
      this.groundY = groundY;
      const { ground, groundTop } = this.level.theme;
      const layout = LEVEL_LAYOUTS[this.levelIndex];

      if (this.isShipLevel) {
        this.buildWaterWorld();
        return;
      }

      const groundTiles = this.physics.add.staticGroup();
      for (let x = 0; x < WORLD_WIDTH; x += 64) {
        const tile = groundTiles.create(x + 32, groundY + 32, "ground");
        tile.setScale(1, 1);
        tile.refreshBody();
      }
      this.groundTiles = groundTiles;

      const ledges = this.physics.add.staticGroup();
      this.getExpandedPlatforms(layout.platforms).forEach((platform) => {
        const tiles = Math.max(1, Math.ceil(platform.width / 64));
        for (let i = 0; i < tiles; i += 1) {
          const tile = ledges.create(platform.x + i * 64, platform.y, "platform");
          tile.refreshBody();
          // Shrink the collision box to match the painted bar at the top of the
          // 64x64 texture frame instead of the whole (mostly transparent) frame,
          // so the walkable surface lines up with what's actually drawn on screen.
          tile.body.setSize(64, PLATFORM_VISUAL_HEIGHT);
          tile.body.setOffset(0, 0);
        }
      });
      this.ledges = ledges;

      const levelOverlay = this.add.graphics().setAlpha(0.16);
      levelOverlay.fillStyle(groundTop, 1);
      levelOverlay.fillRect(0, groundY - 80, WORLD_WIDTH, 80);
    }

    getExpandedPlatforms(platforms) {
      const expanded = [];

      platforms.forEach((platform, index) => {
        const worldX = platform.x * LEVEL_X_SCALE;
        expanded.push({
          x: worldX,
          y: platform.y,
          width: platform.width,
        });

        const offsetDirection = index % 2 === 0 ? 1 : -1;
        const offset = 360 + (index % 3) * 80;
        const companionX = Phaser.Math.Clamp(
          worldX + offsetDirection * offset,
          96,
          WORLD_WIDTH - platform.width - 96
        );
        const companionY = Phaser.Math.Clamp(platform.y - 24 + (index % 3) * 12, 220, 420);
        expanded.push({
          x: companionX,
          y: companionY,
          width: platform.width,
        });
      });

      return expanded;
    }

    buildWaterWorld() {
      const water = this.add.graphics().setAlpha(0.95);
      water.fillStyle(0x144b73, 0.95);
      water.fillRect(0, this.waterlineY, WORLD_WIDTH, WORLD_HEIGHT - this.waterlineY);
      water.lineStyle(3, 0x7fd5f1, 0.18);
      for (let x = 0; x < WORLD_WIDTH; x += 52) {
        water.strokeEllipse(x + 26, this.waterlineY + 12 + (x % 104 === 0 ? 8 : 0), 52, 14);
      }

      const foam = this.add.graphics().setAlpha(0.16);
      foam.fillStyle(0xc9f2ff, 1);
      for (let x = 0; x < WORLD_WIDTH; x += 160) {
        foam.fillEllipse(x + 80, this.waterlineY + 20, 170, 20);
      }
    }

    // Dynamic Arcade bodies interpret setSize(w, h) in the sprite's original,
    // pre-scale texture space: the real on-screen box ends up being w*scaleX by
    // h*scaleY. Since setDisplaySize() changes that scale to whatever the source
    // image's native dimensions require, calling body.setSize(28, 48) after it
    // does NOT reliably produce a 28x48 box - the real size depends on the raw
    // pixel dimensions of the loaded artwork. This helper divides out the
    // current scale so the resulting body always matches the requested size in
    // actual display pixels, regardless of the source image's native size.
    setDisplayBodyBox(sprite, boxWidth, boxHeight) {
      const scaleX = sprite.scaleX || 1;
      const scaleY = sprite.scaleY || 1;
      sprite.body.setSize(boxWidth / scaleX, boxHeight / scaleY, true);
    }

    buildPlayer() {
      const playerTexture = this.isShipLevel ? "ship" : "nephi";
      const playerY = this.isShipLevel ? this.waterlineY - 44 : this.groundY - 60;
      this.player = this.physics.add.sprite(90, playerY, playerTexture);
      if (!this.isShipLevel) {
        this.player.setDisplaySize(PLAYER_DISPLAY_WIDTH, PLAYER_DISPLAY_HEIGHT);
      }
      this.player.setCollideWorldBounds(true);
      if (this.isShipLevel) {
        this.setDisplayBodyBox(this.player, 50, 26);
        this.player.body.setAllowGravity(false);
        this.player.setBounce(0);
        this.player.setDragX(900);
      } else {
        this.setDisplayBodyBox(this.player, PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT);
        this.player.setBounce(0.05);
        this.player.setDragX(1100);

        this.physics.add.collider(this.player, this.groundTiles);
        this.physics.add.collider(this.player, this.ledges);
      }
      console.log(`[Nephi Journey] Player body: size=${this.player.body.width}x${this.player.body.height}, offset=${this.player.body.offset.x},${this.player.body.offset.y}, enabled=${this.player.body.enable}`);
    }

    buildEnemies() {
      this.enemies = this.physics.add.group({ allowGravity: false, immovable: true });
      this.enemyConfigs = [];
      const layout = LEVEL_LAYOUTS[this.levelIndex];
      const platformAnchors = this.getExpandedPlatforms(layout.platforms).map((platform) => ({
        left: platform.x,
        right: platform.x + platform.width,
        // True visual top surface of the platform (see PLATFORM_FRAME_HALF note above).
        top: platform.y - PLATFORM_FRAME_HALF,
      }));

      layout.enemies.forEach((x) => {
        const worldX = x * LEVEL_X_SCALE;
        const supportPlatform = platformAnchors.find((anchor) => worldX >= anchor.left && worldX <= anchor.right);
        const texture = this.chooseEnemyTexture(worldX);
        const isGuard = texture === "guard";
        const displayHeight = isGuard ? GUARD_DISPLAY_HEIGHT : ENEMY_DISPLAY_HEIGHT;
        const bodyHeight = isGuard ? GUARD_BODY_HEIGHT : ENEMY_BODY_HEIGHT;
        const y = this.isShipLevel
          ? this.waterlineY + 34 + ((worldX / 300) % 2) * 12
          : this.getLandEnemyY(worldX, platformAnchors, displayHeight);
        const enemy = this.enemies.create(worldX, y, texture);
        enemy.setDisplaySize(ENEMY_DISPLAY_WIDTH, displayHeight);
        this.setDisplayBodyBox(enemy, ENEMY_BODY_WIDTH, bodyHeight);
        const speedVariation = this.isShipLevel ? ENEMY_SPEED_VARIATION_SHIP : ENEMY_SPEED_VARIATION;
        const speedMultiplier = 1 + Phaser.Math.FloatBetween(-speedVariation, speedVariation);
        enemy.setData("speed", ENEMY_SPEED * speedMultiplier);
        if (this.isShipLevel) {
          enemy.body.setAllowGravity(false);
          enemy.setData("minY", this.waterlineY - 74);
          enemy.setData("maxY", this.waterlineY + 36);
          enemy.setData("direction", Math.random() < 0.5 ? -1 : 1);
        } else {
          if (supportPlatform) {
            const enemyPadding = 20;
            enemy.setData("minX", supportPlatform.left + enemyPadding);
            enemy.setData("maxX", supportPlatform.right - enemyPadding);
          } else {
            enemy.setData("minX", worldX - LAND_ENEMY_RANGE * LEVEL_X_SCALE);
            enemy.setData("maxX", worldX + LAND_ENEMY_RANGE * LEVEL_X_SCALE);
          }
          enemy.setData("direction", Math.random() < 0.5 ? -1 : 1);
          const turnRange = this.getEnemyTurnDelayRange();
          enemy.setData("nextTurnAt", this.time.now + Phaser.Math.Between(turnRange.min, turnRange.max));
        }
        this.enemyConfigs.push(enemy);
      });

      console.log(`[Nephi Journey] Built ${this.enemies.getLength()} enemies for level ${this.levelIndex}.`);
      this.physics.add.overlap(this.player, this.enemies, this.handleEnemyHit, null, this);
    }

    getLandEnemyY(x, platformAnchors, displayHeight = ENEMY_DISPLAY_HEIGHT) {
      // Position the enemy's center so its feet (bottom of its display box)
      // land exactly on the surface, whether that's a platform's visual top
      // edge or the ground line. displayHeight is passed in per-enemy since
      // guards are taller than the other enemies (see GUARD_DISPLAY_HEIGHT).
      const platform = platformAnchors.find((anchor) => x >= anchor.left && x <= anchor.right);
      const surfaceY = platform ? platform.top : this.groundY;
      return surfaceY - displayHeight / 2;
    }

    buildScrolls() {
      this.scrolls = this.physics.add.staticGroup();
      const positions = [WORLD_WIDTH / 4, WORLD_WIDTH / 2, (WORLD_WIDTH * 3) / 4];
      const messages = LEVEL_SCROLL_MESSAGES[this.levelIndex] || LEVEL_SCROLL_MESSAGES[0];
      this.totalScrolls = positions.length;

      positions.forEach((x, index) => {
        const scrollY = this.isShipLevel ? this.waterlineY - 34 - index * 8 : this.groundY - 90 - index * 16;
        const scroll = this.scrolls.create(x, scrollY, "scroll");
        scroll.setDisplaySize(34, 40);
        scroll.refreshBody();
        scroll.setData("popupText", messages[index] || "A treasured scroll has been collected.");
      });

      this.physics.add.overlap(this.player, this.scrolls, this.collectScroll, null, this);
    }

    buildGoal() {
      let goalY = this.isShipLevel ? this.waterlineY - 46 : this.groundY - 58;
      let labelOffsetY = -70;
      const goalTextureKey = this.getGoalTextureKey();
      this.goal = this.physics.add.staticSprite(WORLD_WIDTH - 92, goalY, goalTextureKey);
      if (goalTextureKey === "tent") {
        this.goal.setDisplaySize(90, 60);
      } else if (goalTextureKey === "city") {
        this.goal.setDisplaySize(150, 105);
      } else if (goalTextureKey === "laban") {
        // Fix the width to match 2.25x the guard sprite's height (3x, then
        // scaled down another 25%), and derive the display height from
        // Laban.png's own native aspect ratio instead of a second hardcoded
        // number - otherwise the art gets squished/stretched to whatever
        // arbitrary box we picked.
        const targetWidth = GUARD_DISPLAY_HEIGHT * 3 * 0.75;
        const aspectRatio = this.goal.height / this.goal.width;
        const targetHeight = targetWidth * aspectRatio;
        this.goal.setDisplaySize(targetWidth, targetHeight);
        // Put Laban's own vertical midpoint on the same plane Nephi stands
        // on, rather than aligning his feet to it like the other, smaller
        // goal icons do.
        goalY = this.groundY;
        this.goal.setY(goalY);
        // The fixed -70 label offset was tuned for the old, much smaller
        // icons; scale it off Laban's actual height so the label still
        // sits just above his head instead of over his torso.
        labelOffsetY = -(targetHeight / 2 + 20);
      } else {
        this.goal.setScale(this.levelIndex === 2 ? 1.18 : 1.1);
      }
      this.goal.refreshBody();
      this.goal.setDepth(5);
      this.goalLabel = this.add.text(WORLD_WIDTH - 120, goalY + labelOffsetY, this.getGoalLabel(), {
        fontFamily: "Verdana",
        fontSize: "14px",
        color: "#f7edd9",
        backgroundColor: "rgba(0,0,0,0.4)",
        padding: { left: 8, right: 8, top: 4, bottom: 4 },
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(6);
      this.physics.add.overlap(this.player, this.goal, this.handleGoalReached, null, this);
    }

    getGoalTextureKey() {
      switch (this.levelIndex) {
        case 0:
        case 3:
          return "tent";
        case 1:
          // End of Level 2 ("Back to Jerusalem") - reusing the same 'city'
          // texture already loaded for the Level 3 skyline backdrop.
          return "city";
        case 2:
          // End of Level 3 ("The Streets of Jerusalem") - confronting Laban.
          return "laban";
        case 4:
          return "goal-shore";
        case 5:
          return "goal-boat";
        default:
          return "goal";
      }
    }

    getGoalLabel() {
      switch (this.levelIndex) {
        case 0:
          return "Reach the tent";
        case 1:
          return "Reach Jerusalem";
        case 2:
          return "Find the book";
        case 3:
          return "Return to the family";
        case 4:
          return "Reach the coast";
        case 5:
          return "Reach the promised land";
        default:
          return "Goal";
      }
    }

    buildHUD() {
      this.levelLabel = this.add.text(18, 16, `${this.level.name}: ${this.level.title}`, {
        fontFamily: "Verdana",
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
        backgroundColor: "rgba(0,0,0,0.4)",
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      }).setScrollFactor(0);

      this.statusText = this.add.text(18, 56, "", {
        fontFamily: "Verdana",
        fontSize: "16px",
        color: "#f2c14e",
        backgroundColor: "rgba(0,0,0,0.3)",
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      }).setScrollFactor(0);

      this.invincibleText = this.add.text(18, 94, "", {
        fontFamily: "Verdana",
        fontSize: "16px",
        color: "#5ad1a5",
        backgroundColor: "rgba(0,0,0,0.3)",
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      }).setScrollFactor(0);

      this.scrollCountText = this.add.text(this.scale.width - 18, 16, `Scrolls: ${this.scrollsCollected}/${this.totalScrolls || 2}`, {
        fontFamily: "Verdana",
        fontSize: "18px",
        color: "#f7edd9",
        fontStyle: "bold",
        backgroundColor: "rgba(0,0,0,0.4)",
        padding: { left: 10, right: 10, top: 6, bottom: 6 },
      }).setOrigin(1, 0).setScrollFactor(0);

      this.scrollPopupBg = this.add.rectangle(this.scale.width / 2, 150, SCROLL_POPUP_WIDTH, 92, 0x101820, 0.92)
        .setStrokeStyle(3, 0xf2c14e, 1)
        .setScrollFactor(0)
        .setVisible(false)
        .setDepth(50);

      this.scrollPopupText = this.add.text(this.scale.width / 2, 150, "", {
        fontFamily: "Verdana",
        fontSize: `${SCROLL_POPUP_BASE_FONT}px`,
        color: "#f7edd9",
        align: "center",
        wordWrap: { width: SCROLL_POPUP_WRAP_WIDTH },
        lineSpacing: 6,
      }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(51);

      this.scrollPopupTitle = this.add.text(this.scale.width / 2, 120, "", {
        fontFamily: "Verdana",
        fontSize: "14px",
        color: "#f2c14e",
        fontStyle: "bold",
        letterSpacing: 1,
      }).setOrigin(0.5).setScrollFactor(0).setVisible(false).setDepth(51);

      this.scrollPopupButton = this.add.text(this.scale.width / 2, 150, "Proceed", {
        fontFamily: "Verdana",
        fontSize: "16px",
        color: "#111",
        backgroundColor: "#f2c14e",
        padding: { left: 20, right: 20, top: 8, bottom: 8 },
        fontStyle: "bold",
      })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setVisible(false)
        .setDepth(51)
        .setInteractive({ useHandCursor: true });
    }

    buildTouchControls() {
      const pad = 14;
      const buttonSize = 70;
      const y = this.scale.height - buttonSize - pad;
      const leftX = pad + buttonSize / 2;
      const rightX = this.isShipLevel
        ? this.scale.width - pad - buttonSize / 2
        : pad + buttonSize * 2 + 12 + buttonSize / 2;
      const jumpX = this.scale.width - pad - buttonSize / 2;

      this.touchButtons = {};

      const makeButton = (x, label, onDown, onUp) => {
        const circle = this.add.circle(x, y + buttonSize / 2, buttonSize / 2, 0x101820, 0.78)
          .setStrokeStyle(3, 0xf2c14e, 1)
          .setScrollFactor(0)
          .setInteractive({ useHandCursor: true });

        const text = this.add.text(x, y + buttonSize / 2, label, {
          fontFamily: "Verdana",
          fontSize: "24px",
          color: "#f7edd9",
          fontStyle: "bold",
        }).setOrigin(0.5).setScrollFactor(0);

        circle.on("pointerdown", onDown);
        circle.on("pointerup", onUp);
        circle.on("pointerout", onUp);
        circle.on("pointerupoutside", onUp);

        return { circle, text };
      };

      this.touchButtons.left = makeButton(leftX, "<", () => {
        this.touchState.left = true;
      }, () => {
        this.touchState.left = false;
      });

      this.touchButtons.right = makeButton(rightX, ">", () => {
        this.touchState.right = true;
      }, () => {
        this.touchState.right = false;
      });

      if (!this.isShipLevel) {
        this.touchButtons.jump = makeButton(jumpX, "^", () => {
          this.touchState.jumpQueued = true;
        }, () => {});
      }

      this.touchHint = this.add.text(this.scale.width / 2, this.scale.height - 20, this.isShipLevel ? "Touch controls: left and right only" : "Touch buttons for mobile", {
        fontFamily: "Verdana",
        fontSize: "13px",
        color: "#d7e2ea",
      }).setOrigin(0.5).setScrollFactor(0);
    }

    setupInputs() {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    }

    chooseEnemyTexture(x) {
      // Level 3 ("The Streets of Jerusalem") is patrolled by city guards
      // rather than the desert wildlife used everywhere else.
      if (this.levelIndex === 2) {
        return "guard";
      }
      return (Math.floor(x / ENEMY_SPACING) % 2 === 0) ? "snake" : "scorpion";
    }

    getEnemyTurnDelayRange() {
      switch (this.levelIndex) {
        case 0:
        case 1:
          return { min: 500, max: 1700 };
        case 2:
          return { min: 350, max: 1100 };
        case 3:
          return { min: 450, max: 1400 };
        case 4:
          return { min: 500, max: 1500 };
        default:
          return { min: 700, max: 2200 };
      }
    }

    getEnemyPatrolJitterChance() {
      switch (this.levelIndex) {
        case 0:
        case 1:
          return 0.2;
        case 2:
          return 0.32;
        case 3:
          return 0.24;
        case 4:
          return 0.2;
        default:
          return 0;
      }
    }

    update(time) {
      if (!this.player || this.levelFinished || this.gamePaused) {
        return;
      }

      const leftPressed = this.cursors.left.isDown || this.keyA.isDown || this.touchState.left;
      const rightPressed = this.cursors.right.isDown || this.keyD.isDown || this.touchState.right;
      const jumpPressed = !this.isShipLevel && (
        Phaser.Input.Keyboard.JustDown(this.cursors.up)
        || Phaser.Input.Keyboard.JustDown(this.keySpace)
        || Phaser.Input.Keyboard.JustDown(this.keyW)
        || this.touchState.jumpQueued
      );

      if (this.isShipLevel) {
        let shipMove = 0;
        if (leftPressed && !rightPressed) {
          shipMove = -PLAYER_SPEED;
          this.player.flipX = true;
        } else if (rightPressed && !leftPressed) {
          shipMove = PLAYER_SPEED;
          this.player.flipX = false;
        }

        this.player.setVelocityX(0);
        this.player.setVelocityY(0);
        this.player.x = Phaser.Math.Clamp(this.player.x + shipMove * (this.game.loop.delta / 1000), 48, WORLD_WIDTH - 60);
        const bob = Math.sin(time / 180) * 2.5;
        const tilt = shipMove === 0 ? Math.sin(time / 280) * 1.2 : shipMove > 0 ? 1.8 : -1.8;
        this.player.y = this.waterlineY - 44 + bob;
        this.player.angle = tilt;
        this.player.body.updateFromGameObject();
        this.touchState.jumpQueued = false;
      } else {
        if (leftPressed && !rightPressed) {
          this.player.setVelocityX(-PLAYER_SPEED);
          this.player.flipX = true;
        } else if (rightPressed && !leftPressed) {
          this.player.setVelocityX(PLAYER_SPEED);
          this.player.flipX = false;
        } else {
          this.player.setVelocityX(0);
        }

        const onGround = this.player.body.blocked.down || this.player.body.touching.down;
        if (jumpPressed && onGround) {
          this.player.setVelocityY(-PLAYER_JUMP);
          this.touchState.jumpQueued = false;
        }

        if (!jumpPressed) {
          this.touchState.jumpQueued = false;
        }
      }

      this.updateEnemies(time);
      this.updateInvincibility(time);
      this.applyCamera();
    }

    updateEnemies(time) {
      this.enemies.children.iterate((enemy) => {
        if (!enemy) {
          return;
        }
        const speed = enemy.getData("speed");

        if (this.isShipLevel) {
          const direction = enemy.getData("direction");
          const minY = enemy.getData("minY");
          const maxY = enemy.getData("maxY");
          enemy.body.setVelocityX(0);
          enemy.y += direction * speed * (this.game.loop.delta / 1000);
          if (enemy.y <= minY) {
            enemy.y = minY;
            enemy.setData("direction", 1);
          } else if (enemy.y >= maxY) {
            enemy.y = maxY;
            enemy.setData("direction", -1);
          }
          enemy.body.updateFromGameObject();

          // These enemies patrol vertically instead of left/right, so mirror
          // them top-to-bottom instead of left-to-right when they turn around.
          enemy.flipY = enemy.getData("direction") < 0;
        } else {
          const direction = enemy.getData("direction");
          const minX = enemy.getData("minX");
          const maxX = enemy.getData("maxX");
          const nextTurnAt = enemy.getData("nextTurnAt") ?? 0;
          const turnRange = this.getEnemyTurnDelayRange();

          enemy.body.setVelocityX(direction * speed);
          const jitterChance = this.getEnemyPatrolJitterChance();
          const patrolJitter = time >= nextTurnAt && Math.random() < jitterChance;
          if (patrolJitter) {
            enemy.setData("direction", direction * -1);
            enemy.setData("nextTurnAt", time + Phaser.Math.Between(turnRange.min, turnRange.max));
          }
          if (enemy.x <= minX) {
            enemy.x = minX;
            enemy.setData("direction", 1);
            enemy.setData("nextTurnAt", time + Phaser.Math.Between(turnRange.min, turnRange.max));
          } else if (enemy.x >= maxX) {
            enemy.x = maxX;
            enemy.setData("direction", -1);
            enemy.setData("nextTurnAt", time + Phaser.Math.Between(turnRange.min, turnRange.max));
          }

          // Art faces right by default (same convention as the player sprite),
          // so mirror it whenever the enemy is currently heading left.
          enemy.flipX = enemy.getData("direction") < 0;
        }
      });
    }

    updateInvincibility(time) {
      if (time < this.invincibleUntil) {
        const secondsLeft = Math.ceil((this.invincibleUntil - time) / 1000);
        this.invincibleText.setText(`Invincible: ${secondsLeft}s`);
        this.player.setTint(0x8ff7d2);
      } else {
        this.invincibleText.setText("");
        this.player.clearTint();
      }
    }

    collectScroll(player, scroll) {
      if (!scroll.active) {
        return;
      }

      const popupText = scroll.getData("popupText") || "A treasured scroll has been collected.";
      scroll.disableBody(true, true);
      this.scrollsCollected += 1;
      if (this.scrollCountText) {
        this.scrollCountText.setText(`Scrolls: ${this.scrollsCollected}/${this.totalScrolls || 2}`);
      }

      // Freeze gameplay while the player reads the scroll text - both the
      // Arcade physics step (so nothing moves or collides) and our own
      // update() loop (see the gamePaused check there, which also covers
      // the ship level's manual, non-physics position updates).
      this.gamePaused = true;
      this.physics.world.pause();

      this.showScrollPopup(popupText, () => {
        this.physics.world.resume();
        this.gamePaused = false;
        // Invincibility starts fresh from the moment the game resumes, not
        // from when the scroll was picked up.
        this.invincibleUntil = this.time.now + INVINCIBILITY_MS;
        // Space (and Up/W) can also close the popup, so clear their "just
        // pressed" state - otherwise that same keypress also registers as a
        // jump input the instant update() starts running again.
        this.cursors.up.reset();
        this.keySpace.reset();
        this.keyW.reset();
      });
    }

    // Shrinks the font (down to a floor) until the wrapped message fits within
    // a sane height, so extremely long scroll text (some are full paragraphs
    // of scripture) doesn't grow the popup past the playable screen.
    fitScrollPopupText(message) {
      let fontSize = SCROLL_POPUP_BASE_FONT;
      this.scrollPopupText.setFontSize(fontSize);
      this.scrollPopupText.setText(message);
      while (this.scrollPopupText.height > SCROLL_POPUP_MAX_TEXT_HEIGHT && fontSize > SCROLL_POPUP_MIN_FONT) {
        fontSize -= 1;
        this.scrollPopupText.setFontSize(fontSize);
      }
    }

    // Resizes and repositions the background box, title, body text, and
    // Proceed button as a group so the box always fully encloses whatever
    // text was just set, instead of using a fixed box size that longer
    // messages could overflow.
    layoutScrollPopup() {
      const titleHeight = this.scrollPopupTitle.height;
      const textHeight = this.scrollPopupText.height;
      const buttonHeight = this.scrollPopupButton.height;
      const boxHeight =
        SCROLL_POPUP_PADDING_TOP +
        titleHeight +
        SCROLL_POPUP_TITLE_GAP +
        textHeight +
        SCROLL_POPUP_BUTTON_GAP +
        buttonHeight +
        SCROLL_POPUP_PADDING_BOTTOM;
      const boxCenterY = SCROLL_POPUP_TOP + boxHeight / 2;
      const centerX = this.scale.width / 2;

      this.scrollPopupBg.setSize(SCROLL_POPUP_WIDTH, boxHeight);
      this.scrollPopupBg.setPosition(centerX, boxCenterY);

      const titleCenterY = SCROLL_POPUP_TOP + SCROLL_POPUP_PADDING_TOP + titleHeight / 2;
      this.scrollPopupTitle.setPosition(centerX, titleCenterY);

      const textCenterY = titleCenterY + titleHeight / 2 + SCROLL_POPUP_TITLE_GAP + textHeight / 2;
      this.scrollPopupText.setPosition(centerX, textCenterY);

      const buttonCenterY = textCenterY + textHeight / 2 + SCROLL_POPUP_BUTTON_GAP + buttonHeight / 2;
      this.scrollPopupButton.setPosition(centerX, buttonCenterY);
    }

    // Shows the scroll popup and pauses gameplay until the player clicks
    // Proceed, then calls onProceed (used by collectScroll to resume the
    // game and start invincibility from that exact moment).
    showScrollPopup(message, onProceed) {
      this.scrollPopupTitle.setText("Scroll Found");
      this.fitScrollPopupText(message);
      this.layoutScrollPopup();

      const elements = [this.scrollPopupBg, this.scrollPopupText, this.scrollPopupTitle, this.scrollPopupButton];
      elements.forEach((element) => {
        element.setVisible(true);
        element.setAlpha(0);
      });

      this.tweens.add({
        targets: elements,
        alpha: 1,
        duration: 180,
        ease: "Sine.easeOut",
      });

      const proceed = () => {
        this.scrollPopupButton.off("pointerdown", proceed);
        this.input.keyboard.off("keydown-ENTER", proceed);
        this.input.keyboard.off("keydown-SPACE", proceed);
        this.tweens.add({
          targets: elements,
          alpha: 0,
          duration: 220,
          ease: "Sine.easeIn",
          onComplete: () => {
            elements.forEach((element) => element.setVisible(false));
            onProceed();
          },
        });
      };

      this.scrollPopupButton.on("pointerdown", proceed);
      this.input.keyboard.on("keydown-ENTER", proceed);
      this.input.keyboard.on("keydown-SPACE", proceed);
    }

    handleEnemyHit(player, enemy) {
      console.log(`[Nephi Journey] Overlap fired with ${enemy.texture.key} at x=${Math.round(enemy.x)}.`);
      if (this.time.now < this.invincibleUntil || this.levelFinished) {
        return;
      }

      const playerBody = player.body;
      const enemyBody = enemy.body;
      const isFalling = playerBody.velocity.y > 0;
      const landingThreshold = enemyBody.y + 16;
      const playerBottom = playerBody.y + playerBody.height;

      if (!this.isShipLevel && isFalling && playerBottom <= landingThreshold) {
        enemy.disableBody(true, true);
        if (playerBody) {
          playerBody.velocity.y = -PLAYER_JUMP * 0.55;
        }
        return;
      }

      this.restartLevel();
    }

    handleGoalReached(player, goal) {
      this.triggerNextLevel();
    }

    triggerNextLevel() {
      if (this.levelFinished) {
        return;
      }

      this.levelFinished = true;
      this.statusText.setText("Level complete!");
      this.player.setVelocity(0, 0);

      this.time.delayedCall(700, () => {
        const nextLevel = this.levelIndex + 1;
        if (nextLevel >= LEVELS.length) {
          this.scene.start("EndingScene");
        } else {
          this.scene.start("StoryScene", { levelIndex: nextLevel });
        }
      });
    }

    restartLevel() {
      this.scene.restart({ levelIndex: this.levelIndex });
    }

    applyCamera() {
      const camera = this.cameras.main;
      camera.scrollX = Phaser.Math.Clamp(this.player.x - camera.width / 2, 0, WORLD_WIDTH - camera.width);
    }
  }

  const config = {
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: "#10141a",
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: GRAVITY_Y },
        debug: false,
      },
    },
    scene: [BootScene, StoryScene, GameScene, EndingScene],
  };

  new Phaser.Game(config);
})();