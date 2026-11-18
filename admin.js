'use strict';

const form = document.getElementById('prepare-pdf');
const status = document.getElementById('prepare-status');
const instructions = document.getElementById('upload-steps');
const preparedName = document.getElementById('prepared-name');
const submit = form.querySelector('[type=submit]');

form.addEventListener('input', () => {
  instructions.hidden = true;
  status.textContent = '';
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  instructions.hidden = true;
  status.textContent = '';
  const { grade, subject, title, unit, part, pdf } = Object.fromEntries(new FormData(form));
  const cleanTitle = title.trim().normalize('NFC');
  if (!cleanTitle || /[<>:"/\\|?*\u0000-\u001f]/u.test(cleanTitle) || cleanTitle.includes('__')) {
    status.textContent = '제목에 밑줄 두 개나 /, ?, * 같은 파일 이름에 쓸 수 없는 기호를 빼 주세요.';
    form.elements.title.focus();
    return;
  }
  if (Boolean(unit) !== Boolean(part)) {
    status.textContent = '단원과 파트 번호를 둘 다 입력하거나 둘 다 비워 주세요.';
    form.elements[unit ? 'part' : 'unit'].focus();
    return;
  }
  if (!/\.pdf$/i.test(pdf.name) || pdf.size > 25 * 1024 * 1024) {
    status.textContent = '25 MiB 이하의 PDF 파일을 선택해 주세요.';
    form.elements.pdf.focus();
    return;
  }

  const numbering = unit && part ? '__u' + Number(unit) + '-p' + Number(part) : '';
  const filename = [grade, subject, cleanTitle].join('__') + numbering + '.pdf';
  submit.disabled = true;
  try {
    const header = await pdf.slice(0, 5).text();
    if (header !== '%PDF-') {
      status.textContent = '선택한 파일이 PDF 형식인지 확인해 주세요.';
      return;
    }
    const url = URL.createObjectURL(pdf);
    const download = document.createElement('a');
    download.href = url;
    download.download = filename;
    document.body.append(download);
    download.click();
    download.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    preparedName.textContent = filename;
    instructions.hidden = false;
    status.textContent = '등록용 PDF 저장을 요청했어요. 이어서 GitHub에 올려 주세요.';
  } catch {
    status.textContent = '파일을 읽지 못했어요. PDF를 다시 선택해 주세요.';
  } finally {
    submit.disabled = false;
  }
});
