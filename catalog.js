const worksheets = [
  ['korean-p1', 'korean', 1, '생활 소리', '종소리와 손뼉 소리 등 주변에서 들리는 소리를 구별해요.'],
  ['korean-p2', 'korean', 2, '표정과 몸짓', '표정과 몸짓의 뜻을 알아보고 직접 표현해요.'],
  ['korean-p3', 'korean', 3, '의사소통 시도', '인사에 반응하고 여러 가지 방법으로 도움을 요청해요.'],
  ['math-p1', 'math', 1, '같은 것과 다른 것', '그림을 보고 같은 물건과 다른 물건을 찾아요.'],
  ['math-p2', 'math', 2, '많고 적음', '물건의 수를 눈으로 비교하고 한 개와 여러 개를 구별해요.'],
  ['math-p3', 'math', 3, '짝과 순서', '함께 쓰는 물건을 짝짓고 크기 순서대로 이어요.'],
  ['daily-p1', 'daily', 1, '내가 원하는 것', '하고 싶은 일을 고르고 어떤 활동을 원하는지 표현해요.'],
  ['daily-p2', 'daily', 2, '내게 필요한 것', '지금 상황에 필요한 물건과 행동을 골라요.'],
  ['daily-p3', 'daily', 3, '선택한 일 하기', '할 일을 고르고 필요한 물건을 준비한 뒤 직접 해봐요.'],
].map(([id, subject, part, title, description]) => ({
  id, subject, part, title, description, grade: 'e12', unit: 1, pages: 4,
  images: [id + '-preview.jpg', id + '-page2.jpg'],
}));
