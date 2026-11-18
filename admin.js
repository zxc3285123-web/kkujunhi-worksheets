'use strict';

const repoName = 'zxc3285123-web/kkujunhi-worksheets';
const ownerId = 323440310;
const apiRoot = 'https://api.github.com';
const materialsPath = '/repos/' + repoName + '/contents/materials';
const byId = id => document.getElementById(id);
const connectForm = byId('connect-form');
const publishForm = byId('publish-form');
const list = byId('published-files');
let token = '';
let files = [];
let writing = false;

async function github(path, accessToken, method = 'GET', body) {
  const headers = { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + accessToken };
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch(apiRoot + path, {
    method, headers, cache: 'no-store', redirect: 'error',
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) {
    const error = new Error('GitHub request failed');
    error.status = response.status;
    throw error;
  }
  return response.json();
}

function messageFor(error) {
  if (error.status === 401) return '토큰이 올바르지 않거나 만료됐어요. 새 토큰으로 연결해 주세요.';
  if ([403, 404].includes(error.status)) return '토큰의 저장소 선택과 Contents 권한(Read and write)을 확인해 주세요.';
  if ([409, 422].includes(error.status)) return '파일이 이미 있거나 저장소가 변경됐어요. 페이지를 새로 열어 확인해 주세요.';
  return 'GitHub에 연결하지 못했어요. 새로고침해 반영 여부를 확인해 주세요.';
}

function setConnected(account) {
  const connected = Boolean(account);
  connectForm.hidden = connected;
  byId('disconnect').hidden = !connected;
  byId('management').hidden = !connected;
  byId('connection-status').textContent = connected ? account + ' 계정으로 연결됐어요.' : '';
  if (!connected) {
    files = [];
    list.replaceChildren();
    publishForm.reset();
    byId('publish-status').textContent = byId('remove-status').textContent = '';
  }
}

connectForm.addEventListener('submit', async event => {
  event.preventDefault();
  const input = connectForm.elements.token;
  const candidate = input.value.trim();
  input.value = '';
  if (!candidate.startsWith('github_pat_')) {
    byId('connection-status').textContent = 'GitHub에서 만든 세분화된 관리 토큰을 입력해 주세요.';
    return;
  }
  const button = connectForm.querySelector('button');
  button.disabled = true;
  byId('connection-status').textContent = 'GitHub 계정을 확인하고 있어요.';
  try {
    const profile = await github('/user', candidate);
    if (profile.id !== ownerId) {
      byId('connection-status').textContent = '이 자료실 소유자의 GitHub 계정만 연결할 수 있어요.';
      return;
    }
    const entries = await github(materialsPath + '?ref=main', candidate);
    files = entries.filter(entry => entry.type === 'file' && /\.pdf$/i.test(entry.name));
    token = candidate;
    renderFiles();
    setConnected(profile.login);
  } catch (error) {
    byId('connection-status').textContent = messageFor(error);
  } finally {
    button.disabled = false;
  }
});

byId('disconnect').addEventListener('click', () => {
  if (writing) return;
  token = '';
  setConnected('');
});

function renderFiles() {
  list.replaceChildren();
  const ordered = [...files].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  for (const file of ordered) {
    const [grade, subject, ...parts] = file.name.replace(/\.pdf$/i, '').normalize('NFC').split('__');
    const numbering = parts.length === 2 ? /^u([1-9]\d?)-p([1-9]\d?)$/.exec(parts[1]) : null;
    const title = parts.length ? (numbering ? parts[0] : parts.join('__')) : file.name;
    const classification = parts.length ? [grade, subject] : [];
    if (numbering) classification.push(numbering[1] + '단원 · 파트 ' + numbering[2]);
    const item = document.createElement('li');
    const info = document.createElement('div');
    const link = document.createElement('a');
    link.textContent = title;
    link.href = 'materials/' + encodeURIComponent(file.name);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const meta = document.createElement('small');
    meta.textContent = classification.join(' · ');
    info.append(link, meta);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button remove';
    button.textContent = '내리기';
    button.setAttribute('aria-label', title + ' 내리기');
    button.disabled = writing;
    button.addEventListener('click', () => remove(file, title));
    item.append(info, button);
    list.append(item);
  }
  if (!files.length) {
    const empty = document.createElement('li');
    empty.textContent = '게시된 PDF가 아직 없어요.';
    list.append(empty);
  }
}

function setWriting(value) {
  writing = value;
  byId('publish-fields').disabled = value;
  byId('disconnect').disabled = value;
  list.querySelectorAll('button').forEach(button => { button.disabled = value; });
}

publishForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!token || writing) return;
  const status = byId('publish-status');
  const { grade, subject, title, unit, part, pdf } = Object.fromEntries(new FormData(publishForm));
  const cleanTitle = title.trim().normalize('NFC');
  if (!cleanTitle || /[<>:"/\\|?*\u0000-\u001f]/u.test(cleanTitle) || cleanTitle.includes('__')) {
    status.textContent = '제목을 확인해 주세요. 밑줄 두 개나 /, ?, * 같은 기호는 사용할 수 없어요.';
    return;
  }
  if (Boolean(unit) !== Boolean(part)) {
    status.textContent = '단원과 파트 번호를 둘 다 입력하거나 둘 다 비워 주세요.';
    return;
  }
  if (!/\.pdf$/i.test(pdf.name) || pdf.size > 25 * 1024 * 1024) {
    status.textContent = '25 MiB 이하의 PDF 파일을 선택해 주세요.';
    return;
  }

  const suffix = unit ? '__u' + Number(unit) + '-p' + Number(part) : '';
  const filename = [grade, subject, cleanTitle].join('__') + suffix + '.pdf';
  if (files.some(file => file.name.normalize('NFC') === filename)) {
    status.textContent = '같은 학습지가 이미 있어요. 기존 자료를 내린 뒤 새 PDF를 올려 주세요.';
    return;
  }
  setWriting(true);
  status.textContent = 'PDF를 등록하고 있어요.';
  try {
    if (await pdf.slice(0, 5).text() !== '%PDF-') {
      status.textContent = '선택한 파일이 PDF 형식인지 확인해 주세요.';
      return;
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(pdf);
    });
    const result = await github(materialsPath + '/' + encodeURIComponent(filename), token, 'PUT', {
      message: '학습지 등록: ' + cleanTitle, content: dataUrl.split(',')[1], branch: 'main',
    });
    files.push(result.content);
    renderFiles();
    publishForm.reset();
    status.textContent = '등록했어요. 공개 자료실에는 배포가 끝나면 표시됩니다.';
  } catch (error) {
    status.textContent = messageFor(error);
  } finally {
    setWriting(false);
  }
});

async function remove(file, title) {
  if (!token || writing || !window.confirm('‘' + title + '’을(를) 공개 자료실에서 내릴까요?')) return;
  const status = byId('remove-status');
  setWriting(true);
  status.textContent = '자료를 내리고 있어요.';
  try {
    await github(materialsPath + '/' + encodeURIComponent(file.name), token, 'DELETE', {
      message: '학습지 내리기: ' + title, sha: file.sha, branch: 'main',
    });
    files = files.filter(entry => entry.name !== file.name);
    renderFiles();
    status.textContent = '자료를 내렸어요. 공개 자료실에는 배포가 끝나면 반영됩니다.';
  } catch (error) {
    status.textContent = messageFor(error);
  } finally {
    setWriting(false);
  }
}
