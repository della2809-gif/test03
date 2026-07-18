insert into public.health_asset_domains
  (code, name, short_description, long_description, icon, sort_order)
values
  ('metabolic', '혈당대사', '식사 후 에너지와 대사 리듬', '문진과 생활 기록의 변화를 함께 살펴보는 웰니스 관리 영역입니다.', 'activity', 1),
  ('energy', '에너지', '일상의 활력과 피로 회복', '문진과 생활 기록의 변화를 함께 살펴보는 웰니스 관리 영역입니다.', 'sun', 2),
  ('gut', '장건강', '소화 편안함과 배변 리듬', '문진과 생활 기록의 변화를 함께 살펴보는 웰니스 관리 영역입니다.', 'circle', 3),
  ('inflammation', '염증균형', '회복을 방해하는 생활 신호', '문진과 생활 기록의 변화를 함께 살펴보는 웰니스 관리 영역입니다.', 'flame', 4),
  ('immune', '면역균형', '일상 회복력과 방어 습관', '문진과 생활 기록의 변화를 함께 살펴보는 웰니스 관리 영역입니다.', 'shield', 5),
  ('hormone', '호르몬균형', '수면·기분·생활 리듬', '문진과 생활 기록의 변화를 함께 살펴보는 웰니스 관리 영역입니다.', 'waves', 6),
  ('liver', '간·해독', '음주와 회복 생활 습관', '문진과 생활 기록의 변화를 함께 살펴보는 웰니스 관리 영역입니다.', 'leaf', 7),
  ('brain-stress', '뇌신경·스트레스', '집중력과 긴장 회복', '문진과 생활 기록의 변화를 함께 살펴보는 웰니스 관리 영역입니다.', 'brain', 8),
  ('circulation', '순환건강', '활동과 순환 생활 습관', '문진과 생활 기록의 변화를 함께 살펴보는 웰니스 관리 영역입니다.', 'heart-pulse', 9),
  ('body-composition', '체성분', '근육과 체지방의 균형', '문진과 생활 기록의 변화를 함께 살펴보는 웰니스 관리 영역입니다.', 'person-standing', 10),
  ('youth-index', '젊음지수', '활력과 회복의 종합 변화', '문진과 생활 기록의 변화를 함께 살펴보는 웰니스 관리 영역입니다.', 'sparkles', 11),
  ('lifestyle', '생활습관', '수면·수분·활동·영양 실천', '문진과 생활 기록의 변화를 함께 살펴보는 웰니스 관리 영역입니다.', 'calendar-check', 12)
on conflict (code) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  long_description = excluded.long_description,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  updated_at = now();
