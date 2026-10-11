// „Ćwiczenia wymowy”: zabawowe ćwiczenia trudnych polskich głosek (to NIE jest terapia logopedyczna).
// Każda głoska = jeden poziom (P01…); kroki poziomu = zadania z gwiazdkami, zapisywane jak w pozostałych modułach:
//   listen (posłuchaj + buzia), syll (głoska w sylabach), words (słowa: początek/środek/koniec), sentence (zdanie / łamaniec),
//   fun (ćwiczenia: oddech, język, usta). Dodanie głoski = jeden wpis w SOUND_DEFS (+ nagrania: tools/generate-audio.py).
export const GROUPS = { r: 'Drżąca głoska', szum: 'Szumiące', sycz: 'Syczące', cisz: 'Ciszące' };

/** Ćwiczenia (oddech, język, usta). text = wypowiedź lektora i opis na ekranie; anim = klucz animacji (css/pron.css). */
export const EXERCISES = {
  wiatraczek: { title: 'Wiatraczek', kind: 'oddech', anim: 'wiatraczek', text: 'Weź powietrze nosem i dmuchaj na wiatraczek.', tip: 'Dmuchaj spokojnie, żeby wiatraczek kręcił się równo.' },
  zimno: { title: 'Zimno – ciepło', kind: 'oddech', anim: 'zimno', text: 'Dmuchaj na gorącą zupę, potem na zimne dłonie.', tip: 'Na zupę dmuchaj delikatnie, na zimne dłonie mocniej.' },
  koniki: { title: 'Koniki', kind: 'język', anim: 'koniki', text: 'Koniki: kląskaj językiem jak konik.', tip: 'Język przyklej do podniebienia i odklejaj z kląśnięciem.' },
  malarz: { title: 'Malarz', kind: 'język', anim: 'malarz', text: 'Malarz: pomaluj językiem niebo w buzi.', tip: 'Prowadź czubek języka od zębów w głąb podniebienia.' },
  zeby: { title: 'Liczymy zęby', kind: 'język', anim: 'zeby', text: 'Liczymy zęby: dotknij językiem każdego zęba.', tip: 'Policz górne zęby czubkiem języka, od lewej do prawej.' },
  balonik: { title: 'Balonik', kind: 'usta i policzki', anim: 'balonik', text: 'Balonik: nadmij policzki i powoli wypuść powietrze.', tip: 'Wypuszczaj powietrze powoli, jakby balonik się zmniejszał.' },
  usta: { title: 'Uśmiech i dzióbek', kind: 'usta', anim: 'usta', text: 'Uśmiech i dzióbek, uśmiech i dzióbek.', tip: 'Szeroki uśmiech, potem usta zebrane w dzióbek.' },
};

/** Opis ułożenia buzi (ogólnie, bez diagnoz) – pokazywany pod rysunkiem; mouth = klucz rysunku w mouth.js. */
export const SOUND_DEFS = [
  { id: 'r', title: 'Głoska R', group: 'r', mouth: 'r', model: ['rrra', 'ra'], preview: 'r: ra, ro, ru…', tip: 'Czubek języka unosi się za górne zęby i delikatnie drży.',
    syll: [['rrra', 'ra', 'ro', 'ru', 're', 'ry'], ['ar', 'or', 'ur', 'er', 'yr'], ['tra', 'dro', 'kru', 'bre', 'gry']],
    words: { początek: ['rak', 'ryba', 'rower', 'róża'], środek: ['parasol', 'tramwaj', 'gruszka', 'kurtka'], koniec: ['ser', 'zegar', 'sweter', 'cukier'] },
    sentences: ['Rak rysuje różę.', 'Rak i ryba grają w grę.'], fun: ['wiatraczek', 'koniki', 'malarz'] },
  { id: 'sz', title: 'Głoska SZ', group: 'szum', mouth: 'sz', model: ['#sz', 'sza'], preview: 'sz: sza, szo, szu…', tip: 'Usta zaokrąglone w dzióbek, czubek języka uniesiony do góry, powietrze szumi.',
    syll: [['sza', 'szo', 'szu', 'sze', 'szy'], ['asz', 'osz', 'usz', 'esz'], ['asza', 'osze', 'uszy']],
    words: { początek: ['szafa', 'szalik', 'szynka', 'szopa'], środek: ['kasza', 'myszka', 'poduszka', 'koszyk'], koniec: ['kosz', 'mysz', 'kapelusz'] },
    sentences: ['Szybka mysz szuka szafy.', 'Szary szalik leży w szufladzie.'], fun: ['usta', 'wiatraczek', 'balonik'] },
  { id: 'cz', title: 'Głoska CZ', group: 'szum', mouth: 'cz', model: ['#cz', 'cza'], preview: 'cz: cza, czo, czu…', tip: 'Usta w dzióbek, czubek języka u góry; najpierw krótko zatrzymaj powietrze, potem pozwól mu szumieć.',
    syll: [['cza', 'czo', 'czu', 'cze', 'czy'], ['acz', 'ocz', 'ucz', 'ecz'], ['acza', 'ocze', 'uczy']],
    words: { początek: ['czapka', 'czekolada', 'czerwony', 'czytanie'], środek: ['kaczka', 'kluczyk', 'tęcza'], koniec: ['klucz', 'mecz', 'miecz'] },
    sentences: ['Czerwona czapka leży na krześle.', 'Czarna kaczka niesie klucz.'], fun: ['usta', 'zimno', 'balonik'] },
  { id: 'zrz', title: 'Głoski Ż i RZ', group: 'szum', mouth: 'sz', voiced: true, model: ['#ż', 'ża'], preview: 'ż, rz: ża, żo, żu…', tip: 'Tak samo jak SZ, tylko z „brzęczeniem” w gardle. Ż i RZ brzmią tak samo.',
    syll: [['ża', 'żo', 'żu', 'że', 'ży'], ['aż', 'oż', 'uż', 'eż'], ['aża', 'oże', 'uży']],
    words: { początek: ['żaba', 'żuk', 'żyrafa', 'rzeka', 'rzepa'], środek: ['kałuża', 'nożyczki', 'morze', 'jeżyk'], koniec: ['jeż', 'wąż', 'nóż', 'lekarz'] },
    sentences: ['Żaba żyje przy rzece.', 'Jeż żuje żołądź.'], fun: ['usta', 'malarz', 'wiatraczek'] },
  { id: 'dz2', title: 'Głoska DŻ', group: 'szum', mouth: 'sz', voiced: true, model: ['#dż', 'dża'], preview: 'dż: dża, dżo, dżu…', tip: 'Jak CZ, ale z „brzęczeniem” w gardle: najpierw zatrzymaj powietrze, potem puść je z szumem.',
    syll: [['dża', 'dżo', 'dżu', 'dże', 'dży'], ['adża', 'odżo', 'udżu'], ['adże', 'odży', 'udża']],
    words: { początek: ['dżem', 'dżungla', 'dżinsy'], środek: ['drożdże'] },
    sentences: ['Dżem jest bardzo słodki.', 'W dżungli mieszka tygrysek.'], fun: ['usta', 'koniki', 'zimno'] },
  { id: 'c', title: 'Głoska C', group: 'sycz', mouth: 'c', model: ['#c', 'ca'], preview: 'c: ca, co, cu…', tip: 'Szeroki uśmiech, czubek języka za dolnymi zębami; krótko zatrzymaj powietrze i puść je ze świstem.',
    syll: [['ca', 'co', 'cu', 'ce', 'cy'], ['ac', 'oc', 'uc', 'ec'], ['aca', 'oce', 'ucy']],
    words: { początek: ['cebula', 'cukier', 'cytryna', 'cyrk'], środek: ['kocyk', 'owca', 'ulica'], koniec: ['palec', 'koc', 'noc'] },
    sentences: ['Na ulicy stoi cyrk.', 'Cytryna jest kwaśna.'], fun: ['usta', 'zeby', 'wiatraczek'] },
  { id: 'dz', title: 'Głoska DZ', group: 'sycz', mouth: 'c', voiced: true, model: ['#dz', 'dza'], preview: 'dz: dza, dzo, dzu…', tip: 'Jak C, ale z „brzęczeniem” w gardle. Uśmiech i język za dolnymi zębami.',
    syll: [['dza', 'dzo', 'dzu', 'dze', 'dzy'], ['adz', 'odz', 'udz', 'edz'], ['adza', 'odze', 'udzy']],
    words: { początek: ['dzwonek', 'dzwon', 'dzban'], środek: ['pędzel', 'jedzenie', 'chodzę'], koniec: ['rydz', 'wódz'] },
    sentences: ['Dzwonek dzwoni głośno.', 'Pędzel leży w dzbanku.'], fun: ['usta', 'zeby', 'balonik'] },
  { id: 's2', title: 'Głoska Ś', group: 'cisz', mouth: 'ś', model: ['#ś', 'sia'], preview: 'ś: sia, sio, siu…', tip: 'Szeroki uśmiech, czubek języka za dolnymi zębami, środek języka wysoko. Miękki, cichy szum.',
    syll: [['sia', 'sio', 'siu', 'sie', 'si'], ['aś', 'oś', 'uś', 'eś'], ['asia', 'osio', 'usie']],
    words: { początek: ['ślimak', 'śnieg', 'świeca', 'świnka'], środek: ['osiem', 'gąsienica'], koniec: ['miś', 'gęś'] },
    sentences: ['Ślimak idzie przez śnieg.', 'Miś ma świeczkę.'], fun: ['usta', 'malarz', 'zimno'] },
  { id: 'c2', title: 'Głoska Ć', group: 'cisz', mouth: 'ś', model: ['#ć', 'cia'], preview: 'ć: cia, cio, ciu…', tip: 'Jak Ś, ale najpierw krótko zatrzymaj powietrze, a potem puść je cicho.',
    syll: [['cia', 'cio', 'ciu', 'cie', 'ci'], ['ać', 'oć', 'uć', 'eć'], ['acia', 'ocio', 'ucie']],
    words: { początek: ['ćma', 'ciasto', 'ciocia', 'cień'], środek: ['pociąg', 'babcia', 'kocię'], koniec: ['kość', 'gość', 'liść'] },
    sentences: ['Ciocia piecze ciasto.', 'Ćma lata w nocy.'], fun: ['usta', 'zeby', 'zimno'] },
  { id: 'z2', title: 'Głoska Ź', group: 'cisz', mouth: 'ś', voiced: true, model: ['#ź', 'zia'], preview: 'ź: zia, zio, ziu…', tip: 'Jak Ś, ale z „brzęczeniem” w gardle. Połóż palce na szyi – poczujesz drganie.',
    syll: [['zia', 'zio', 'ziu', 'zie', 'zi'], ['aź', 'oź', 'uź', 'eź'], ['azia', 'ozio', 'uzie']],
    words: { początek: ['zima', 'zielony', 'ziemia', 'ziarno'], środek: ['jezioro', 'koziołek'], koniec: ['weź'] },
    sentences: ['Zimą pada śnieg.', 'Koziołek skacze nad jeziorem.'], fun: ['usta', 'malarz', 'balonik'] },
  { id: 'dz3', title: 'Głoska DŹ', group: 'cisz', mouth: 'ś', voiced: true, model: ['#dź', 'dzia'], preview: 'dź: dzia, dzio, dziu…', tip: 'Jak Ć, ale z „brzęczeniem” w gardle: zatrzymaj powietrze, puść je cicho.',
    syll: [['dzia', 'dzio', 'dziu', 'dzie', 'dzi'], ['adź', 'odź', 'udź', 'edź'], ['adzia', 'odzio', 'udzie']],
    words: { początek: ['dźwięk', 'dziecko', 'dzień', 'dziadek'], środek: ['chodzić', 'widzieć', 'rodzina'], koniec: ['łódź', 'miedź', 'gwóźdź'] },
    sentences: ['Dziecko widzi łódź.', 'Dzień jest piękny.'], fun: ['usta', 'zeby', 'wiatraczek'] },
];

export const POSITIONS = ['początek', 'środek', 'koniec'];
const POS_TITLE = { początek: 'na początku słowa', środek: 'w środku słowa', koniec: 'na końcu słowa' };

function buildTasks(s) {
  const tasks = [{ id: `${s.id}-listen`, type: 'listen', title: 'Posłuchaj', prompt: `Posłuchaj głoski ${s.title.replace('Głoska ', '').replace('Głoski ', '')}.`, say: ['Posłuchaj.', ...s.model], tip: s.tip }];
  s.syll.forEach((u, i) => tasks.push({ id: `${s.id}-syl${i + 1}`, type: 'syll', title: 'Sylaby', prompt: 'Dotknij i powtórz każdą sylabę.', items: u, say: u, tip: s.tip }));
  for (const pos of POSITIONS) if (s.words[pos]) tasks.push({ id: `${s.id}-w-${pos}`, type: 'words', title: 'Słowa', prompt: `Słowa z głoską ${POS_TITLE[pos]}.`, items: s.words[pos], say: s.words[pos], tip: s.tip });
  s.sentences.forEach((t, i) => tasks.push({ id: `${s.id}-zd${i + 1}`, type: 'sentence', title: 'Zdanie', prompt: 'Przeczytaj i powiedz powoli.', items: [t], say: [t], tip: s.tip }));
  s.fun.forEach((k) => tasks.push({ id: `${s.id}-fun-${k}`, type: 'fun', title: EXERCISES[k].title, prompt: `${EXERCISES[k].title} (${EXERCISES[k].kind})`, ex: k, say: [EXERCISES[k].text], tip: EXERCISES[k].tip }));
  return tasks;
}

export const PRON_LEVELS = SOUND_DEFS.map((s, i) => ({ id: 'P' + String(i + 1).padStart(2, '0'), num: i + 1, group: s.group, title: s.title, preview: s.preview, sound: s.id, def: s, tasks: buildTasks(s) }));

/** Wszystkie NOWE wypowiedzi tego modułu: {part, kind}. kind: drill (sylaby-ćwiczenia, wolno), word, sentence, instruction. */
export function pronSpoken() {
  const out = [];
  for (const l of PRON_LEVELS) for (const t of l.tasks) {
    if (t.type === 'listen') { out.push(...t.say.filter((p) => !p.startsWith('#')).map((p) => ({ part: p, kind: p === 'Posłuchaj.' ? 'instruction' : 'drill' }))); }
    else if (t.type === 'syll') t.items.forEach((p) => out.push({ part: p, kind: 'drill' }));
    else if (t.type === 'words') t.items.forEach((p) => out.push({ part: p, kind: 'word' }));
    else if (t.type === 'sentence') t.items.forEach((p) => out.push({ part: p, kind: 'sentence' }));
    else if (t.type === 'fun') out.push({ part: t.say[0], kind: 'instruction' });
  }
  return out;
}
