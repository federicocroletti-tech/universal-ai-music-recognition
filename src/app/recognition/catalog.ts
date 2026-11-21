import { Melody } from './models';
import { parseNotes } from './notation';

interface CatalogEntry {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly year: string;
  readonly score: string;
}

/*
 * Public-domain melodies only (traditional, or authors dead for more than 70 years).
 * Transcribed by hand for the prototype: verify against public-domain scores before expanding.
 */
const ENTRIES: readonly CatalogEntry[] = [
  {
    id: 'ode-to-joy',
    title: 'Inno alla gioia (Sinfonia n. 9)',
    author: 'Ludwig van Beethoven',
    year: '1824',
    score:
      'E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4:1.5 D4:0.5 D4:2 | E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:1.5 C4:0.5 C4:2',
  },
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star (Ah! vous dirai-je, maman)',
    author: 'Tradizionale',
    year: '1761',
    score:
      'C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2 | G4 G4 F4 F4 | E4 E4 D4:2 | G4 G4 F4 F4 | E4 E4 D4:2 | C4 C4 G4 G4 | A4 A4 G4:2 | F4 F4 E4 E4 | D4 D4 C4:2',
  },
  {
    id: 'frere-jacques',
    title: 'Fra Martino (Frère Jacques)',
    author: 'Tradizionale',
    year: 'XVIII secolo',
    score:
      'C4 D4 E4 C4 | C4 D4 E4 C4 | E4 F4 G4:2 | E4 F4 G4:2 | G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 | G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 | C4 G3 C4:2 | C4 G3 C4:2',
  },
  {
    id: 'happy-birthday',
    title: 'Tanti auguri a te (Happy Birthday to You)',
    author: 'Mildred J. Hill e Patty Hill',
    year: '1893',
    score:
      'G4:0.75 G4:0.25 A4 G4 C5 B4:2 | G4:0.75 G4:0.25 A4 G4 D5 C5:2 | G4:0.75 G4:0.25 G5 E5 C5 B4 A4:2 | F5:0.75 F5:0.25 E5 C5 D5 C5:2',
  },
  {
    id: 'jingle-bells',
    title: 'Jingle Bells',
    author: 'James Lord Pierpont',
    year: '1857',
    score:
      'E4 E4 E4:2 | E4 E4 E4:2 | E4 G4 C4:1.5 D4:0.5 | E4:4 | F4 F4 F4:1.5 F4:0.5 | F4 E4 E4 E4:0.5 E4:0.5 | E4 D4 D4 E4 | D4:2 G4:2 | E4 E4 E4:2 | E4 E4 E4:2 | E4 G4 C4:1.5 D4:0.5 | E4:4 | F4 F4 F4 F4 | F4 E4 E4 E4:0.5 E4:0.5 | G4 G4 F4 D4 | C4:4',
  },
  {
    id: 'mary-lamb',
    title: 'Mary Had a Little Lamb',
    author: 'Tradizionale',
    year: '1830',
    score: 'E4 D4 C4 D4 | E4 E4 E4:2 | D4 D4 D4:2 | E4 G4 G4:2 | E4 D4 C4 D4 | E4 E4 E4 E4 | D4 D4 E4 D4 | C4:4',
  },
  {
    id: 'london-bridge',
    title: 'London Bridge Is Falling Down',
    author: 'Tradizionale',
    year: 'XVIII secolo',
    score:
      'G4:1.5 A4:0.5 G4 F4 | E4 F4 G4:2 | D4 E4 F4:2 | E4 F4 G4:2 | G4:1.5 A4:0.5 G4 F4 | E4 F4 G4:2 | D4:2 G4:2 | E4 C4:3',
  },
  {
    id: 'row-your-boat',
    title: 'Row, Row, Row Your Boat',
    author: 'Tradizionale',
    year: '1852',
    score:
      'C4:1.5 C4:1.5 | C4 D4:0.5 E4:1.5 | E4 D4:0.5 E4 F4:0.5 | G4:3 | C5:0.5 C5:0.5 C5:0.5 G4:0.5 G4:0.5 G4:0.5 | E4:0.5 E4:0.5 E4:0.5 C4:0.5 C4:0.5 C4:0.5 | G4 F4:0.5 E4 D4:0.5 | C4:3',
  },
  {
    id: 'fur-elise',
    title: 'Per Elisa (Für Elise)',
    author: 'Ludwig van Beethoven',
    year: '1810',
    score:
      'E5:0.5 D#5:0.5 E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 A4:1.5 | C4:0.5 E4:0.5 A4:0.5 B4:1.5 | E4:0.5 G#4:0.5 B4:0.5 C5:1.5 | E4:0.5 E5:0.5 D#5:0.5 E5:0.5 D#5:0.5 E5:0.5 B4:0.5 D5:0.5 C5:0.5 A4:1.5 | C4:0.5 E4:0.5 A4:0.5 B4:1.5 | E4:0.5 C5:0.5 B4:0.5 A4:2',
  },
  {
    id: 'brahms-lullaby',
    title: 'Ninna nanna (Wiegenlied)',
    author: 'Johannes Brahms',
    year: '1868',
    score:
      'E4:0.5 E4:0.5 G4:2 | E4:0.5 E4:0.5 G4:2 | E4:0.5 G4:0.5 C5 B4:1.5 A4:0.5 A4 G4 | D4:0.5 E4:0.5 F4 D4 D4:0.5 E4:0.5 F4:2 | D4:0.5 F4:0.5 B4 A4 G4 B4 C5:2',
  },
  {
    id: 'eine-kleine-nachtmusik',
    title: 'Eine kleine Nachtmusik',
    author: 'Wolfgang Amadeus Mozart',
    year: '1787',
    score:
      'G4:1.5 D4:0.5 G4:1.5 D4:0.5 | G4:0.5 D4:0.5 G4:0.5 B4:0.5 D5:2 | C5:1.5 A4:0.5 C5:1.5 A4:0.5 | C5:0.5 A4:0.5 F#4:0.5 A4:0.5 D4:2',
  },
  {
    id: 'pachelbel-canon',
    title: 'Canone in re maggiore',
    author: 'Johann Pachelbel',
    year: '1680–1706 (data incerta)',
    score: 'F#5:2 E5:2 D5:2 C#5:2 B4:2 A4:2 B4:2 C#5:2 | D5:2 C#5:2 B4:2 A4:2 G4:2 F#4:2 G4:2 E4:2',
  },
  {
    id: 'vivaldi-spring',
    title: 'La primavera (Le quattro stagioni)',
    author: 'Antonio Vivaldi',
    year: '1725',
    score:
      'E5 G#5:0.5 G#5:0.5 G#5:0.5 F#5:0.25 E5:0.25 B5:2.5 | B5:0.25 A5:0.25 G#5:0.5 G#5:0.5 G#5:0.5 F#5:0.25 E5:0.25 B5:2.5',
  },
  {
    id: 'mountain-king',
    title: 'Nell’antro del re della montagna (Peer Gynt)',
    author: 'Edvard Grieg',
    year: '1875',
    score:
      'B3:0.5 C#4:0.5 D4:0.5 E4:0.5 F#4:0.5 D4:0.5 F#4 | F4:0.5 C#4:0.5 F4 E4:0.5 C4:0.5 E4 | B3:0.5 C#4:0.5 D4:0.5 E4:0.5 F#4:0.5 D4:0.5 F#4:0.5 B4:0.5 | A4:0.5 F#4:0.5 D4:0.5 F#4:0.5 A4:2',
  },
  {
    id: 'morning-mood',
    title: 'Il mattino (Peer Gynt)',
    author: 'Edvard Grieg',
    year: '1875',
    score: 'G4 E4 D4 C4 D4 E4 | G4 E4 D4 C4 D4:0.5 E4:0.5 D4:0.5 E4:0.5 | G4 E4 G4 A4 E4 A4 | G4 E4 D4 C4:3',
  },
  {
    id: 'bridal-chorus',
    title: 'Marcia nuziale (Lohengrin)',
    author: 'Richard Wagner',
    year: '1850',
    score:
      'C4 F4:0.75 F4:0.25 F4:2 | C4 G4:0.75 E4:0.25 F4:2 | C4 F4:0.75 Bb4:0.25 Bb4 A4:0.75 G4:0.25 F4:0.75 E4:0.25 F4:0.75 G4:0.25 | C4 F4:0.75 F4:0.25 F4:2',
  },
  {
    id: 'silent-night',
    title: 'Astro del ciel (Stille Nacht)',
    author: 'Franz Xaver Gruber',
    year: '1818',
    score:
      'G4:1.5 A4:0.5 G4 E4:3 | G4:1.5 A4:0.5 G4 E4:3 | D5:2 D5 B4:3 | C5:2 C5 G4:3 | A4:2 A4 C5:1.5 B4:0.5 A4 G4:1.5 A4:0.5 G4 E4:3 | D5:2 D5 F5:1.5 D5:0.5 B4 C5:3 E5:3 | C5:1.5 G4:0.5 E4 G4:1.5 F4:0.5 D4 C4:6',
  },
  {
    id: 'merry-christmas',
    title: 'We Wish You a Merry Christmas',
    author: 'Tradizionale',
    year: 'XVI secolo',
    score:
      'D4 | G4 G4:0.5 A4:0.5 G4:0.5 F#4:0.5 | E4 E4 E4 | A4 A4:0.5 B4:0.5 A4:0.5 G4:0.5 | F#4 D4 D4 | B4 B4:0.5 C5:0.5 B4:0.5 A4:0.5 | G4 E4 D4:0.5 D4:0.5 | E4 A4 F#4 | G4:2',
  },
  {
    id: 'auld-lang-syne',
    title: 'Auld Lang Syne (Valzer delle candele)',
    author: 'Tradizionale scozzese',
    year: '1788',
    score:
      'C4 | F4:1.5 F4:0.5 F4 A4 | G4:1.5 F4:0.5 G4 A4 | F4:1.5 F4:0.5 A4 C5 | D5:3 D5 | C5:1.5 A4:0.5 A4 F4 | G4:1.5 F4:0.5 G4 A4 | F4:1.5 D4:0.5 D4 C4 | F4:3',
  },
  {
    id: 'greensleeves',
    title: 'Greensleeves',
    author: 'Tradizionale inglese',
    year: 'XVI secolo',
    score:
      'A4 | C5:2 D5 E5:1.5 F5:0.5 E5 | D5:2 B4 G4:1.5 A4:0.5 B4 | C5:2 A4 A4:1.5 G#4:0.5 A4 | B4:2 G#4 E4:2 A4 | C5:2 D5 E5:1.5 F5:0.5 E5 | D5:2 B4 G4:1.5 A4:0.5 B4 | C5:1.5 B4:0.5 A4 G#4:1.5 F#4:0.5 G#4 | A4:3',
  },
  {
    id: 'amazing-grace',
    title: 'Amazing Grace',
    author: 'Tradizionale (melodia “New Britain”)',
    year: '1829',
    score: 'G4 | C5:2 E5:0.5 C5:0.5 | E5:2 D5 | C5:2 A4 | G4:2 G4 | C5:2 E5:0.5 C5:0.5 | E5:2 D5 | G5:3',
  },
  {
    id: 'old-macdonald',
    title: 'Old MacDonald Had a Farm',
    author: 'Tradizionale',
    year: 'XVIII secolo',
    score: 'G4 G4 G4 D4 | E4 E4 D4:2 | B4 B4 A4 A4 | G4:3 D4 | G4 G4 G4 D4 | E4 E4 D4:2 | B4 B4 A4 A4 | G4:4',
  },
  {
    id: 'blue-danube',
    title: 'Sul bel Danubio blu',
    author: 'Johann Strauss II',
    year: '1867',
    score:
      'D4 D4 F#4 A4:3 A5 A5:2 F#5 F#5:2 | D4 D4 F#4 A4:3 A5 A5:2 G5 G5:2 | C#4 C#4 E4 B4:3 B5 B5:2 G5 G5:2 | C#4 C#4 E4 B4:3 B5 B5:2 F#5 F#5:2',
  },
  {
    id: 'marseillaise',
    title: 'La Marsigliese',
    author: 'Claude Joseph Rouget de Lisle',
    year: '1792',
    score: 'D4:0.75 D4:0.25 D4:0.75 G4:0.25 G4 A4 | A4 D5:1.5 B4:0.75 G4:0.25 | G4:0.75 B4:0.25 G4:0.75 E4:0.25 C5:2 | A4:0.75 F#4:0.25 G4:3',
  },
  {
    id: 'yankee-doodle',
    title: 'Yankee Doodle',
    author: 'Tradizionale',
    year: 'XVIII secolo',
    score: 'C4 C4 D4 E4 | C4 E4 D4 G3 | C4 C4 D4 E4 | C4:2 B3:2 | C4 C4 D4 E4 | F4 E4 D4 C4 | B3 G3 A3 B3 | C4:2 C4:2',
  },
  {
    id: 'saints',
    title: 'When the Saints Go Marching In',
    author: 'Tradizionale',
    year: 'XIX secolo',
    score: 'C4 E4 F4 G4:4 | C4 E4 F4 G4:4 | C4 E4 F4 G4:2 E4:2 C4:2 E4:2 D4:4 | E4 E4 D4 C4:3 C4 E4 G4:2 G4 F4:3 | E4 F4 G4:2 E4:2 C4:2 D4:2 C4:4',
  },
  {
    id: 'oh-susanna',
    title: 'Oh! Susanna',
    author: 'Stephen Foster',
    year: '1848',
    score: 'C4:0.5 D4:0.5 | E4 G4 G4:1.5 A4:0.5 | G4 E4 C4:1.5 D4:0.5 | E4 E4 D4 C4 | D4:3',
  },
  {
    id: 'korobeiniki',
    title: 'Korobeiniki (canto popolare russo)',
    author: 'Tradizionale russo',
    year: '1861',
    score:
      'E5 B4:0.5 C5:0.5 D5 C5:0.5 B4:0.5 | A4 A4:0.5 C5:0.5 E5 D5:0.5 C5:0.5 | B4:1.5 C5:0.5 D5 E5 | C5 A4 A4:2 | D5:1.5 F5:0.5 A5 G5:0.5 F5:0.5 | E5:1.5 C5:0.5 E5 D5:0.5 C5:0.5 | B4 B4:0.5 C5:0.5 D5 E5 | C5 A4 A4:2',
  },
];

export const CATALOG: readonly Melody[] = ENTRIES.map(({ score, ...entry }) => ({
  ...entry,
  notes: parseNotes(score),
}));
