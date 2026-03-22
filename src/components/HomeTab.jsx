import '../App.css'

const INFO = [
  { ico: '👥', lbl: '정원',   val: '최대 6명' },
  { ico: '💰', lbl: '참가비', val: '15,000원 / 회당\n(구독제 추가 예정)' },
]

const CUR = [
  { n:'01', t:'기초 드리블',     d:'볼과 친해지는 첫 걸음. 방향 전환과 속도 조절 연습' },
  { n:'02', t:'볼 컨트롤',       d:'발 안쪽·바깥쪽을 활용한 볼 터치 감각 키우기' },
  { n:'03', t:'기초 체력',       d:'풋살에 필요한 민첩성과 순발력 기초 훈련' },
  { n:'04', t:'실전 반복 훈련',  d:'배운 기술을 반복 적용하며 몸에 익히기' },
  { n:'🏆', t:'미니게임',        d:'소규모 팀 매칭으로 마무리. 배운 걸 실전에서!' },
]

export default function HomeTab({ onApply, onGoSchedule }) {
  return (
    <div className="page-wrap tab-page">

      {/* ① 히어로 */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-glow2" />
        <div className="hero-ball">⚽</div>

        <h1>
          풋살,
          <em>처음이어도</em>
          괜찮아요.
        </h1>
        <p className="hero-desc">
          최대 6명 소규모 클래스<br />
          체육 전공 강사의 세밀하고 친절한 지도로<br />
          찐 기초부터 실전을 위한 반복 훈련까지
        </p>
        <div className="hero-nums">
          {[
            { n:'6명',     l:'최대 정원' },
            { n:'90분',    l:'클래스 시간' },
            { n:'1.5만원', l:'회당 참가비', sub:'구독제 추후 공지' },
          ].map(item => (
            <div className="hero-num" key={item.l}>
              <div className="n">{item.n}</div>
              <div className="l">{item.l}</div>
              {item.sub && <div className="l-sub">{item.sub}</div>}
            </div>
          ))}
        </div>
        <button className="hero-cta" onClick={onApply}>
          신청하기 →
        </button>
      </section>

      {/* ② 페인포인트 */}
      <section className="sec sec-dark">
        <h2 className="sec-title">기존 풋살 클래스,<br />이런 경험 있지 않나요?</h2>
        <div className="pain-cards">
          {[
            { ico:'😓', t:'15명이 한꺼번에 움직이는 클래스', d:'내가 잘하고 있는지, 틀리고 있는지도 모른 채 끝남' },
            { ico:'📝', t:'1주일만 지나면 잊혀지는 수업 내용', d:'내가 어떤 부분이 부족했는지 확인하기 어려움' },
            { ico:'😶', t:'질문하기 어려운 분위기', d:'강사님은 바쁘고, 나는 혼자 우두커니' },
          ].map(item => (
            <div className="pain-card" key={item.t}>
              <span className="p-ico">{item.ico}</span>
              <div>
                <strong>{item.t}</strong>
                <p>{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ③ 솔루션 */}
      <section className="sec sec-orange">
        <h2 className="sec-title">우리 클래스는<br />이런 점이 달라요 ⚽</h2>
        <div className="sol-cards">
          {[
            { ico:'👥', t:'6명 소규모 클래스', d:'대규모 클래스에선 어려웠던 세밀한 지도가 가능합니다.' },
            { ico:'📊', t:'매주 기초 훈련에 대한 리포트 제공', d:'볼 감각부터 드리블, 슈팅, 체력까지 저번주보다 나아진 나의 모습을 데이터로 확인합니다.' },
            { ico:'😄', t:'즐거운 운동을 추구합니다', d:'나날이 늘어가는 내 실력, 풋살이 재밌어질거예요.' },
          ].map(item => (
            <div className="sol-card" key={item.t}>
              <div className="sol-ico">{item.ico}</div>
              <div>
                <strong>{item.t}</strong>
                <p>{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ④ 클래스 정보 */}
      <section className="sec sec-white">
        <p className="sec-eyebrow">Class Info</p>
        <h2 className="sec-title">클래스 정보</h2>
        <div className="info-grid">
          {INFO.map(item => (
            <div className="info-card" key={item.lbl}>
              <div className="ico">{item.ico}</div>
              <div className="lbl">{item.lbl}</div>
              <div className="val" style={{whiteSpace:'pre-line'}}>{item.val}</div>
            </div>
          ))}
          <button className="info-card info-schedule-btn" onClick={onGoSchedule}>
            <div className="ico">📅</div>
            <div className="lbl">일정 · 구장</div>
            <div className="val">일정 탭에서<br />확인하기 →</div>
          </button>
        </div>
      </section>

      {/* ⑤ 커리큘럼 */}
      <section className="sec sec-gray">
        <p className="sec-eyebrow">Curriculum</p>
        <h2 className="sec-title">커리큘럼</h2>
        <div className="cur-wrap">
          <div className="cur-line" />
          {CUR.map(item => (
            <div className="cur-item" key={item.n}>
              <div className="cur-dot">{item.n}</div>
              <div className="cur-body">
                <strong>{item.t}</strong>
                <p>{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ⑥ 강사 소개 */}
      <section className="sec sec-white">
        <p className="sec-eyebrow">Instructor</p>
        <h2 className="sec-title">강사 소개</h2>
        <div className="inst-card">
          <span className="inst-tag">체육교육 전공</span>
          <h3>유지훈</h3>
          <p>
            선수 경력은 없지만, <strong>운동을 가르치는 법을 전공</strong>했습니다.<br /><br />
            풋살 입문자, 특히 여성 초보자가 편안하게 시작할 수 있도록 눈높이에 맞춘 설명과 즉각적인 피드백을 드립니다.
          </p>
          <div className="inst-list">
            {[
              '체육 전공 (운동 지도 전문)',
              '소규모 클래스 전문 운영',
              '서원중학교 2022.03~12 학교 스포츠 클럽 강사',
            ].map(f => (
              <div className="inst-item" key={f}>{f}</div>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>
          문의:{' '}
          <a
            href="https://www.instagram.com/futsal_for_dogfoot?igsh=MXB5cXB5ZXdnbDMwMA%3D%3D&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            인스타그램 DM
          </a>
        </p>
        <p>
          연락처:{' '}
          <a href="tel:01064027651" className="footer-link">
            010-6402-7651
          </a>
        </p>
        <p style={{color:'#444', marginTop: 8}}>© 2026 여성 풋살 원데이클래스</p>
      </footer>

    </div>
  )
}
