'use strict';

const repository = 'zxc3285123-web/kkujunhi-worksheets';
const github = 'https://github.com/' + repository;
const subjects = {
  korean: { label: '국어', color: '#e9eef7', icon: 'book' },
  math: { label: '수학', color: '#e4f0e8', icon: 'plus' },
  daily: { label: '일상생활', color: '#f5eddc', icon: 'sun' },
};
const grades = {
  e12: '초등 1~2학년', e34: '초등 3~4학년', e56: '초등 5~6학년',
  m13: '중등 1~3학년', h13: '고등 1~3학년',
};
const paths = {
  book: '<path d="M12 5.5c-2.8-2-5.5-2.2-9-1.4v14.6c3.5-.8 6.2-.6 9 1.4 2.8-2 5.5-2.2 9-1.4V4.1c-3.5-.8-6.2-.6-9 1.4Zm0 0v14.6M6 8.2l3 .3M15 8.5l3-.3"/>',
  people: '<circle cx="10" cy="8" r="3"/><path d="M4 19v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 5.3a3 3 0 0 1 0 5.4M18 13.5a4 4 0 0 1 2 3.5v2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  file: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  search: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/>',
  external: '<path d="M13 5h6v6m0-6-8 8m6 0v6H5V7h6"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
};
const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[name] + '</svg>';
const el = id => document.getElementById(id);
const community = document.body.dataset.view === 'community';
const officialOrigin = 'https://kkujunhi-materials-manager.zxc3285.chatgpt.site';
const state = { grade: '', subject: '', query: '', shared: [], loading: true, error: false };
let officialFiles = [];

function readOfficialFiles(entries, metadata) {
  const files = [];
  for (const { id, filename: fileName, description, pages, previewPages, catalogId, edited } of entries) {
    if (!/^(?:legacy-[0-9a-f]{16}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$/.test(id) || typeof fileName !== 'string') continue;
    const [gradeLabel, subjectLabel, ...titleParts] = fileName.replace(/\.pdf$/i, '').normalize('NFC').split('__');
    const grade = Object.keys(grades).find(key => grades[key] === gradeLabel);
    const subject = Object.keys(subjects).find(key => subjects[key].label === subjectLabel);
    const numbering = titleParts.length === 2 ? /^u([1-9]\d?)-p([1-9]\d?)$/.exec(titleParts[1]) : null;
    const title = (numbering ? titleParts[0] : titleParts.join('__')).trim();
    if (!grade || !subject || !title) continue;
    const catalog = metadata.find(item => item.id === catalogId);
    const numbered = numbering ? { unit: Number(numbering[1]), part: Number(numbering[2]) } : edited ? { unit: undefined, part: undefined } : {};
    const selected = Array.isArray(previewPages) && previewPages.length <= 2
      ? previewPages.filter(page => Number.isSafeInteger(page) && page > 0) : [];
    const legacyDetails = catalog || (catalogId === undefined && !numbering && metadata.find(item => item.grade === grade && item.subject === subject && item.title === title));
    files.push({ ...legacyDetails, ...numbered,
      images: selected.length ? undefined : legacyDetails?.images, previewPages: selected,
      description: typeof description === 'string' ? description : legacyDetails?.description,
      pages: Number.isSafeInteger(pages) && pages > 0 ? pages : legacyDetails?.pages,
      id, grade, subject, title, pdf: officialOrigin + '/pdf/' + id });

  }
  return files.sort((a, b) => Object.keys(grades).indexOf(a.grade) - Object.keys(grades).indexOf(b.grade)
    || Object.keys(subjects).indexOf(a.subject) - Object.keys(subjects).indexOf(b.subject)
    || (a.unit ?? Infinity) - (b.unit ?? Infinity)
    || (a.part ?? Infinity) - (b.part ?? Infinity)
    || a.title.localeCompare(b.title, 'ko'));
}

function element(tag, className, content) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (content !== undefined) item.textContent = content;
  return item;
}
function action(label, iconName, style, href) {
  const item = element(href ? 'a' : 'button', 'button ' + style);
  if (href) item.href = href;
  else item.type = 'button';
  item.innerHTML = icon(iconName);
  item.append(document.createTextNode(label));
  return item;
}
function download(item) {
  const link = action('PDF 다운로드', 'download', 'button-green', item.issue ? item.pdf : item.pdf + '?download=1');
  if (item.issue) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  } else {
    link.download = '';
  }
  return link;
}

let pdfRenderer;
function renderPdf(url, width, pages) {
  pdfRenderer ||= import(officialOrigin + '/pdf-engine/preview-v2.mjs');
  return pdfRenderer.then(module => module.renderPages(url, width, pages));
}

const previewQueue = [];
const previewCache = new Map();
let previewRunning = false;

async function processPreviews() {
  if (previewRunning) return;
  previewRunning = true;
  while (previewQueue.length) {
    const { button, pdf, page } = previewQueue.shift();
    const key = pdf + '#page=' + page;
    if (!button.isConnected) continue;
    try {
      if (!previewCache.has(key)) {
        if (previewCache.size >= 24) previewCache.delete(previewCache.keys().next().value);
        const task = renderPdf(pdf, 360, [page]).catch(error => {
          previewCache.delete(key);
          throw error;
        });
        previewCache.set(key, task);
      }
      const [{ canvas } = {}] = await previewCache.get(key);
      if (canvas && button.isConnected) button.append(canvas);
    } catch {
      // The PDF remains available when paper previews cannot render.
    }
  }
  previewRunning = false;
}

const visiblePreviews = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    visiblePreviews.unobserve(entry.target);
    previewQueue.push({ button: entry.target, pdf: entry.target.dataset.pdf, page: Number(entry.target.dataset.page) });
  }
  processPreviews();
}, { rootMargin: '120px' });

let detailRequest = 0;
async function openPdfDetails(item) {
  const request = ++detailRequest;
  el('detail-title').textContent = item.title;
  el('detail-meta').textContent = [subjects[item.subject].label, grades[item.grade],
    item.unit ? item.unit + '단원 · 파트 ' + item.part : ''].filter(Boolean).join(' · ');
  const images = el('detail-images');
  const status = element('p', 'pdf-preview-status', '미리보기를 불러오는 중…');
  status.setAttribute('role', 'status');
  images.replaceChildren(status);
  const link = action('PDF 열기', 'external', 'secondary', item.pdf);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  el('detail-actions').replaceChildren(link, download(item));
  el('details').showModal();
  try {
    const selected = item.previewPages?.length ? item.previewPages : [1, 2];
    const rendered = await renderPdf(item.pdf, 720, selected);
    if (request !== detailRequest || !el('details').open) return;
    const pages = rendered.map(({ canvas, page }) => {
      const figure = element('figure');
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', item.title + ' ' + page + '쪽 미리보기');
      figure.append(canvas, element('figcaption', '', page + '쪽'));
      return figure;
    });
    if (!pages.length) throw new Error('Empty PDF');
    images.replaceChildren(...pages);
  } catch {
    if (request === detailRequest && el('details').open) {
      status.textContent = '이미지 미리보기를 불러오지 못했어요. 아래 PDF 열기를 이용해 주세요.';
    }
  }
}

function openDetails(item) {
  detailRequest++;
  el('detail-title').textContent = item.title;
  el('detail-meta').textContent = [subjects[item.subject].label, grades[item.grade], item.unit + '단원 · 파트 ' + item.part, 'PDF ' + item.pages + '쪽'].join(' · ');
  el('detail-images').replaceChildren(...item.images.map((src, index) => {
    const figure = element('figure');
    const img = element('img');
    img.src = src;
    img.alt = item.title + ' 학습지 미리보기 ' + (index + 1) + '쪽';
    img.width = 1080;
    img.height = 1350;
    figure.append(img, element('figcaption', '', '활동지 ' + (index + 1) + '쪽'));
    return figure;
  }));
  el('detail-actions').replaceChildren(download(item));
  el('details').showModal();
}

function card(item) {
  const card = element('article', 'card');
  const subject = subjects[item.subject];
  const meta = element('div', 'meta');
  const body = element('div', 'card-body');
  const actions = element('div', 'card-actions');
  card.style.setProperty('--subject-color', subject.color);
  if (item.images) {
    const preview = element('button', 'card-preview');
    preview.type = 'button';
    preview.setAttribute('aria-label', item.title + ' 미리보기');
    const image = element('img');
    image.src = item.images[0];
    image.alt = '';
    image.width = 1080;
    image.height = 1350;
    image.loading = 'lazy';
    preview.append(image, element('span', '', item.unit + '단원 · 파트 ' + item.part));
    preview.addEventListener('click', () => openDetails(item));
    card.append(preview);
  } else if (!item.issue) {
    const preview = element('button', 'card-preview generated-preview');
    preview.type = 'button';
    preview.dataset.pdf = item.pdf;
    preview.dataset.page = item.previewPages?.[0] || 1;
    preview.setAttribute('aria-label', item.title + ' 미리보기');
    const badge = item.unit ? item.unit + '단원 · 파트 ' + item.part : 'PDF';
    preview.append(element('span', '', badge));
    preview.addEventListener('click', () => openPdfDetails(item));
    card.append(preview);
    visiblePreviews.observe(preview);
  }
  meta.append(element('span', 'tag', subject.label), element('span', '', grades[item.grade]));
  if (item.unit && !item.images) meta.append(element('span', '', '· ' + item.unit + '단원 · 파트 ' + item.part));
  if (item.pages) meta.append(element('span', '', '· PDF ' + item.pages + '쪽'));
  body.append(meta, element('h3', '', item.title));
  if (item.description) body.append(element('p', '', item.description));
  if (item.issue) {
    body.append(element('p', '', '공유한 선생님 · ' + item.author));
    actions.append(action('게시글', 'external', 'secondary', item.issue));
  } else if (item.images) {
    const preview = action('미리보기', 'file', 'secondary');
    preview.addEventListener('click', () => openDetails(item));
    actions.append(preview);
  } else {
    const preview = action('미리보기', 'file', 'secondary');
    preview.addEventListener('click', () => openPdfDetails(item));
    actions.append(preview);
  }
  actions.append(download(item));
  body.append(actions);
  card.append(body);
  return card;
}

function render() {
  visiblePreviews.disconnect();
  const base = community ? state.shared : officialFiles;
  const normalize = value => value.normalize('NFC').toLowerCase();
  const terms = normalize(state.query).trim().split(/\s+/).filter(Boolean);
  const filtered = base.filter(item => {
    const matches = (!state.grade || item.grade === state.grade) && (!state.subject || item.subject === state.subject);
    const searchable = normalize([item.title, item.description, grades[item.grade], subjects[item.subject].label, item.unit ? item.unit + '단원 파트' + item.part : '', item.author || ''].join(' '));
    return matches && terms.every(term => searchable.includes(term));
  });
  document.querySelectorAll('[data-grade]').forEach(button => {
    const grade = button.dataset.grade;
    button.setAttribute('aria-pressed', grade === state.grade);
    button.lastElementChild.textContent = grade ? base.filter(item => item.grade === grade).length : base.length;
  });
  document.querySelectorAll('[data-subject]').forEach(button => button.setAttribute('aria-pressed', button.dataset.subject === state.subject));
  el('result-count').textContent = state.loading ? '자료를 불러오는 중…' : '자료 ' + filtered.length + '개';
  el('reset').hidden = !state.grade && !state.subject && !state.query;
  const note = el('network-note');
  if (note) note.hidden = !state.error;
  if (state.error && !community) note.textContent = '자료를 불러오지 못했어요. 잠시 후 새로고침해 주세요.';
  if (state.error && community) {
    const issues = element('a', '', 'GitHub에서 공개 자료 보기');
    issues.href = github + '/issues?q=is%3Aissue+label%3Apublished';
    note.replaceChildren('최근 공유 자료를 불러오지 못했어요. ', issues);
  }
  if (filtered.length) {
    el('cards').replaceChildren(...filtered.map(card));
    return;
  }
  if (state.loading || state.error) {
    el('cards').replaceChildren();
    return;
  }
  const empty = element('div', 'empty');
  const firstPost = community && !state.grade && !state.subject && !terms.length;
  empty.append(
    element('h3', '', firstPost ? '아직 공개된 교사 자료가 없어요.' : '조건에 맞는 자료가 없어요.'),
    element('p', '', firstPost ? '공유 자료 올리기에서 첫 자료를 공유해 보세요.' : '다른 학년군이나 교과를 선택하거나 검색어를 바꿔 보세요.'),
  );
  el('cards').replaceChildren(empty);
}

function filterButton(label, value, type) {
  const button = element('button', type + '-button', label);
  button.type = 'button';
  button.dataset[type] = value;
  button.setAttribute('aria-pressed', value === '');
  if (type === 'grade') button.append(element('span'));
  button.addEventListener('click', () => {
    state[type] = value;
    render();
  });
  return button;
}

function resetFilters() {
  state.grade = state.subject = state.query = '';
  el('search').value = '';
}
function parseIssue(issue) {
  if (issue.pull_request || typeof issue.body !== 'string') return null;
  const lines = issue.body.replace(/\r/g, '').split('\n');
  if (lines[0] !== '<!-- kkujunhi-resource -->') return null;
  const subject = Object.keys(subjects).find(key => lines[1] === '교과: ' + subjects[key].label);
  const grade = Object.keys(grades).find(key => lines[2] === '학년군: ' + grades[key]);
  const attached = issue.body.match(/\[[^\]\n]+\.pdf\]\((https:\/\/github\.com\/user-attachments\/files\/\d+\/[A-Za-z0-9_%+.-]+)\)/i);
  if (!subject || !grade || !attached || !Number.isSafeInteger(issue.number) || issue.number < 1) return null;
  const boundary = lines.indexOf('### PDF 첨부', 5);
  const description = lines.slice(5, boundary < 0 ? undefined : boundary).join(' ').trim().slice(0, 500);
  return {
    grade, subject, description, title: issue.title,
    pdf: attached[1], issue: github + '/issues/' + issue.number,
    author: issue.user?.login || 'GitHub 사용자',
  };
}

async function loadShared() {
  try {
    const url = new URL('https://api.github.com/repos/' + repository + '/issues');
    url.search = new URLSearchParams({ labels: 'published', state: 'all', per_page: '100', sort: 'created', direction: 'desc' });
    const shared = [];
    let page = 1;
    while (true) {
      url.searchParams.set('page', page);
      const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('GitHub Issues 요청 실패');
      const issues = await response.json();
      shared.push(...issues.map(parseIssue).filter(Boolean));
      if (!/(?:^|,)\s*<[^>]+>;\s*rel="next"/.test(response.headers.get('link') || '')) break;
      page += 1;
    }
    state.shared = shared;
  } catch {
    state.error = true;
  } finally {
    state.loading = false;
    render();
  }
}

document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icon(node.dataset.icon); });
const gradeFilter = el('grade-filter');
gradeFilter.append(filterButton('전체 학년군', '', 'grade'));
for (const [school, keys] of [['초등', ['e12', 'e34', 'e56']], ['중등', ['m13']], ['고등', ['h13']]]) {
  gradeFilter.append(element('p', 'grade-group', school));
  for (const key of keys) gradeFilter.append(filterButton(grades[key], key, 'grade'));
}
el('subject-filter').append(filterButton('전체 교과', '', 'subject'));
for (const [key, value] of Object.entries(subjects)) el('subject-filter').append(filterButton(value.label, key, 'subject'));
el('search').addEventListener('input', event => { state.query = event.target.value; render(); });
el('reset').addEventListener('click', () => { resetFilters(); render(); el('search').focus(); });

if (community) {
  const form = el('share-form');
  for (const entry of Object.entries(subjects)) form.elements.subject.add(new Option(entry[1].label, entry[0]));
  for (const [key, label] of Object.entries(grades)) form.elements.grade.add(new Option(label, key));
  document.querySelectorAll('[data-share]').forEach(button => button.addEventListener('click', () => {
    if (!form.elements.subject.value) form.elements.subject.value = state.subject;
    if (!form.elements.grade.value) form.elements.grade.value = state.grade;
    el('share-dialog').showModal();
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const description = data.get('description').trim().replace(/\r?\n/g, ' ');
    const title = data.get('title').trim();
    for (const [name, value] of [['title', title], ['description', description]]) {
      if (!value) {
        form.elements[name].setCustomValidity('내용을 입력해 주세요.');
        form.elements[name].reportValidity();
        return;
      }
    }
    const url = new URL(github + '/issues/new');
    const body = [
      '<!-- kkujunhi-resource -->',
      '교과: ' + subjects[data.get('subject')].label,
      '학년군: ' + grades[data.get('grade')],
      '',
      '### 자료 소개',
      description,
      '',
      '### PDF 첨부',
      '<!-- 이 줄 아래에 PDF를 끌어다 놓거나 첨부 버튼으로 추가해 주세요. -->',
      '',
    ].join('\n');
    url.search = new URLSearchParams({ title, body });
    window.location.assign(url);
  });
  form.addEventListener('input', event => event.target.setCustomValidity(''));
  loadShared();
} else {
  render();
  loadOfficial();
}

async function loadOfficial() {
  try {
    const response = await fetch(officialOrigin + '/api/materials', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Unable to load official materials');
    officialFiles = readOfficialFiles(await response.json(), worksheets);
  } catch {
    state.error = true;
  } finally {
    state.loading = false;
  }
  const previews = officialFiles.filter(item => item.images);
  const heroBack = previews.find(item => item.id === 'korean-p2') || previews[0];
  const heroFront = previews.find(item => item.id === 'math-p1') || previews.find(item => item !== heroBack);
  for (const [id, item] of [['hero-back', heroBack], ['hero-front', heroFront]]) {
    if (!item) continue;
    const image = el(id);
    image.src = item.images[0];
    image.hidden = false;
  }
  render();
}
