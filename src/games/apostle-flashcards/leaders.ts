// The First Presidency and Quorum of the Twelve Apostles, with five facts each.
// Any fact can be picked as the clue, so each one should fit only its own
// leader: a bare shared date (several were called the same day) needs a
// detail that's unique to him.
// Update this list (and the photo in ./photos/<slug>.jpg) when callings change,
// and bump LEADERS_AS_OF so the page shows the right date.

export const LEADERS_AS_OF = { year: 2026, month: 3 }

export interface Leader {
  /** Also the photo's file name: ./photos/<slug>.jpg */
  slug: string
  name: string
  role: string
  /** One of these is chosen at random as the clue. */
  facts: string[]
}

export const LEADERS: Leader[] = [
  {
    slug: 'dallin-h-oaks',
    name: 'Dallin H. Oaks',
    role: 'President of the Church',
    facts: [
      'Born August 12, 1932, in Provo, Utah',
      'Graduate of BYU (1954) and the University of Chicago Law School (1957); practiced and taught law in Chicago',
      'Served as president of Brigham Young University from 1971 to 1980',
      'Served as a justice of the Utah Supreme Court from 1980 until resigning in 1984 to accept his call as an Apostle',
      'Sustained to the Quorum of the Twelve Apostles in 1984; set apart as President of the Church on October 14, 2025',
    ],
  },
  {
    slug: 'henry-b-eyring',
    name: 'Henry B. Eyring',
    role: 'First Counselor, First Presidency',
    facts: [
      'Born in Princeton, New Jersey, on May 31, 1933',
      'Holds a physics degree from the University of Utah and MBA and doctoral degrees from Harvard University',
      'Served as president of Ricks College (now BYU-Idaho) from 1971 to 1977',
      'Served as Commissioner of the Church Educational System',
      'Sustained to the Quorum of the Twelve Apostles in 1995; set apart as First Counselor in the First Presidency on October 14, 2025',
    ],
  },
  {
    slug: 'd-todd-christofferson',
    name: 'D. Todd Christofferson',
    role: 'Second Counselor, First Presidency',
    facts: [
      'Born in American Fork, Utah, and graduated high school in New Jersey',
      "Earned his bachelor's degree from BYU and his law degree from Duke University",
      'Served as a law clerk to U.S. District Judge John J. Sirica during the Watergate proceedings',
      'Was associate general counsel of NationsBank Corporation (now Bank of America) before full-time Church service',
      'Called to the Quorum of the Twelve Apostles on April 5, 2008; set apart as Second Counselor in the First Presidency on October 14, 2025',
    ],
  },
  {
    slug: 'dieter-f-uchtdorf',
    name: 'Dieter F. Uchtdorf',
    role: 'Acting President, Quorum of the Twelve',
    facts: [
      'Born November 6, 1940, in Ostrava, Czechoslovakia; his family joined the Church in Zwickau, Germany, in 1947',
      'Joined the German Air Force in 1959 and trained as a fighter pilot',
      'Began flying for Lufthansa German Airlines in 1965 and eventually became senior vice president of flight operations and chief pilot',
      'Sustained to the Quorum of the Twelve Apostles on October 2, 2004',
      'Set apart as Acting President of the Quorum of the Twelve Apostles on January 8, 2026',
    ],
  },
  {
    slug: 'david-a-bednar',
    name: 'David A. Bednar',
    role: 'Quorum of the Twelve',
    facts: [
      'Born June 15, 1952, in Oakland, California',
      'Served a full-time mission in southern Germany',
      'Earned a doctoral degree in organizational behavior from Purdue University',
      'Taught business management at Texas Tech University and the University of Arkansas before Church service',
      'Served as president of BYU-Idaho (then Ricks College) from 1997 to 2004; ordained an Apostle on October 7, 2004',
    ],
  },
  {
    slug: 'quentin-l-cook',
    name: 'Quentin L. Cook',
    role: 'Quorum of the Twelve',
    facts: [
      "A native of Logan, Utah; earned a bachelor's degree in political science from Utah State University and a law degree from Stanford University",
      'Served a full-time mission in the British Mission',
      'Was a managing partner at a San Francisco Bay Area law firm before moving into healthcare',
      'Became president and CEO of a California healthcare system, then vice chairman of Sutter Health',
      'Sustained to the Quorum of the Twelve Apostles on October 6, 2007',
    ],
  },
  {
    slug: 'neil-l-andersen',
    name: 'Neil L. Andersen',
    role: 'Quorum of the Twelve',
    facts: [
      'Named an Apostle on April 4, 2009, after serving as senior member of the Presidency of the Seventy',
      'Named to the First Quorum of the Seventy in April 1993, at age 41',
      "Led the Church's work in southern Brazil and later oversaw the Church in western Europe",
      'Supervised Church audiovisual production, including the filming of "The Testaments: Of One Fold and One Shepherd"',
      'Speaks French, Portuguese, and Spanish in addition to English',
    ],
  },
  {
    slug: 'ronald-a-rasband',
    name: 'Ronald A. Rasband',
    role: 'Quorum of the Twelve',
    facts: [
      'Born February 6, 1951, in Salt Lake City, Utah',
      'Joined Huntsman Container Company in 1976 and became president and COO of Huntsman Chemical Corporation in 1987',
      'Served a full-time mission in the Eastern States Mission, then later presided over the New York New York North Mission',
      'Named to the First Quorum of the Seventy on April 1, 2000',
      'Called to the Quorum of the Twelve Apostles on October 3, 2015, after serving as president and COO of Huntsman Chemical Corporation',
    ],
  },
  {
    slug: 'gary-e-stevenson',
    name: 'Gary E. Stevenson',
    role: 'Quorum of the Twelve',
    facts: [
      'Born August 6, 1955, in Ogden, Utah, and raised in Cache Valley',
      'Served a full-time mission in the Japan Fukuoka Mission and later presided over the Japan Nagoya Mission',
      'Cofounded ICON Health & Fitness, an exercise equipment company, serving as its president and COO',
      'Served as Presiding Bishop of the Church from 2012 to 2015',
      'Called to the Quorum of the Twelve Apostles on October 3, 2015, after serving as Presiding Bishop of the Church',
    ],
  },
  {
    slug: 'dale-g-renlund',
    name: 'Dale G. Renlund',
    role: 'Quorum of the Twelve',
    facts: [
      'Born November 13, 1952, in Salt Lake City, Utah, to Swedish immigrant parents',
      'Earned B.A. and M.D. degrees from the University of Utah, with further medical training at Johns Hopkins Hospital',
      'Served a full-time mission in Sweden as a young man',
      'Worked as a cardiologist and was medical director of the Utah Transplantation Affiliated Hospitals Cardiac Transplant Program',
      'Sustained to the Quorum of the Twelve Apostles on October 3, 2015, after a career as a cardiologist',
    ],
  },
  {
    slug: 'gerrit-w-gong',
    name: 'Gerrit W. Gong',
    role: 'Quorum of the Twelve',
    facts: [
      'Born December 23, 1953, in Redwood City, California',
      'Served a full-time mission in Taiwan',
      "Earned a master's degree and doctorate in international relations from Oxford University as a Rhodes Scholar",
      'Served as special assistant to a U.S. ambassador in Beijing and worked at the U.S. State Department',
      "Sustained to the Quorum of the Twelve Apostles on March 31, 2018, as the Church's first Apostle of Asian descent",
    ],
  },
  {
    slug: 'ulisses-soares',
    name: 'Ulisses Soares',
    role: 'Quorum of the Twelve',
    facts: [
      'Born in São Paulo, Brazil, on October 2, 1958',
      "Earned a bachelor's degree in accounting and economics from a Brazilian university in 1985, then an MBA",
      'Worked as an accountant and auditor for multinational corporations in Brazil before full-time Church service',
      'Served as president of the Portugal Porto Mission from 2000 to 2003',
      'Sustained to the Quorum of the Twelve Apostles on March 31, 2018, as a native of São Paulo, Brazil',
    ],
  },
  {
    slug: 'patrick-kearon',
    name: 'Patrick Kearon',
    role: 'Quorum of the Twelve',
    facts: [
      'Born in Carlisle, England, on July 18, 1961',
      'Joined the Church as a convert on Christmas Eve, 1987',
      'Lived and worked in the United Kingdom, Saudi Arabia, and the United States, and ran his own communications consultancy',
      "Served as president of the Church's Europe Area, where he became known for his advocacy on behalf of refugees",
      'Called to the Quorum of the Twelve Apostles on December 7, 2023',
    ],
  },
  {
    slug: 'gerald-causse',
    name: 'Gérald Caussé',
    role: 'Quorum of the Twelve',
    facts: [
      'Born in Bordeaux, France, on May 20, 1963',
      "Earned a master's degree in business from ESSEC Business School in Paris",
      'Worked in the food industry, serving as general manager of a food distribution company in France',
      'Served as Presiding Bishop of the Church from October 2015 to November 2025',
      'Called to the Quorum of the Twelve Apostles on November 6, 2025',
    ],
  },
  {
    slug: 'clark-g-gilbert',
    name: 'Clark G. Gilbert',
    role: 'Quorum of the Twelve',
    facts: [
      'Born June 18, 1970, in Oakland, California; spent most of his childhood in Phoenix, Arizona',
      "Earned a bachelor's degree from BYU, a master's degree from Stanford, and a doctorate from Harvard",
      'Served as CEO of Deseret Digital Media and later president of the Deseret News',
      'Served as president of BYU-Idaho and as the inaugural president of BYU-Pathway Worldwide',
      'Called to the Quorum of the Twelve Apostles on February 11, 2026, filling the vacancy left by the death of Jeffrey R. Holland',
    ],
  },
]
