import { useState, useEffect, useRef } from 'react'
import './App.css'

const INFO = [
  { ico: '📅', lbl: '일시',   val: '3월 4일 (수)\n08:30 – 10:00' },
  { ico: '📍', lbl: '장소',   val: '광교 PPC\n성복2로 369' },
  { ico: '👥', lbl: '정원',   val: '최대 4명' },
  { ico: '💰', lbl: '참가비', val: '10,000원 / 인' },
]

const CUR = [
  { n:'01', t:'기초 드리블',     d:'볼과 친해지는 첫 걸음. 방향 전환과 속도 조절 연습' },
  { n:'02', t:'볼 컨트롤',       d:'발 안쪽·바깥쪽을 활용한 볼 터치 감각 키우기' },
  { n:'03', t:'기초 체력',       d:'풋살에 필요한 민첩성과 순발력 기초 훈련' },
  { n:'04', t:'실전 반복 훈련',  d:'배운 기술을 반복 적용하며 몸에 익히기' },
  { n:'🏆', t:'미니게임',        d:'소규모 팀 매칭으로 마무리. 배운 걸 실전에서!' },
]

export default function App() {
  const [done, setDone] = useState(false)
  const progRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => {
      if (progRef.current) progRef.current.style.width = '0%'
    }, 400)
    return () => clearTimeout(t)
  }, [])

  const toApply = () =>
    document.getElementById('apply').scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="page-wrap">

      {/* 하단 고정 버튼 */}
      <button className="sticky-bar" onClick={toApply}>
        ⚽ 지금 신청하기
        <span className="badge">잔여 4석</span>
      </button>

      {/* ① 히어로 */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-glow2" />
        <div className="hero-ball">⚽</div>

        <a
  className="hero-tag"
  href="https://map.kakao.com/link/to/광교PPC,37.2593,127.0621"
  target="_blank"
  rel="noopener noreferrer"
>
  3월 4일 (수) · 광교 PPC <br /> 📍카카오맵 바로가기📍
</a>
        <h1>
          풋살,
          <em>처음이어도</em>
          괜찮아요.
        </h1>
        <p className="hero-desc">
          최대 4명 소규모 클래스<br />
          체육교육 전공 강사의 집중 케어로<br />
          찐 기초부터 실전을 위한 반복 훈련까지
        </p>
        <div className="hero-nums">
          {[
            { n:'4명',  l:'최대 정원' },
            { n:'90분', l:'클래스 시간' },
            { n:'1만원',l:'참가비' },
          ].map(item => (
            <div className="hero-num" key={item.l}>
              <div className="n">{item.n}</div>
              <div className="l">{item.l}</div>
            </div>
          ))}
        </div>
        <button className="hero-cta" onClick={toApply}>
          신청하기 →
        </button>
      </section>

      {/* ② 페인포인트 */}
      <section className="sec sec-dark">
        <p className="sec-eyebrow">Pain Point</p>
        <h2 className="sec-title">기존 풋살 클래스,<br />이런 경험 있지 않나요?</h2>
        <div className="pain-cards">
          {[
            { ico:'😓', t:'15명이 한꺼번에 움직이는 클래스', d:'내가 잘하고 있는지, 틀리고 있는지도 모른 채 끝남' },
            { ico:'🏃‍♀️', t:'따라가기 바빠서 배운 게 없는 느낌', d:'기초도 모르는데 실전만 하다 끝나는 클래스' },
            { ico:'😶', t:'질문하기 눈치 보이는 분위기', d:'강사님은 바쁘고, 나는 혼자 우두커니' },
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
        <p className="sec-eyebrow">Solution</p>
        <h2 className="sec-title">그래서 이 클래스는<br />다릅니다 ⚽</h2>
        <div className="sol-cards">
          {[
            { ico:'👥', t:'4명 소규모 클래스', d:'대규모 클래스에선 불가능한 집중 케어. 강사가 내 동작을 직접 보고 즉시 피드백합니다.' },
            { ico:'🎓', t:'체육교육 전공 강사의 세밀한 지도', d:'운동을 가르치는 법을 전공했습니다. 초보자 눈높이에 딱 맞게 설명합니다.' },
            { ico:'🔁', t:'반복 훈련 중심 커리큘럼', d:'한 번 보여주고 끝이 아닙니다. 몸에 익을 때까지 반복하고 미니게임으로 실전 적용까지.' },
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
        <p className="info-notice">⚠️ 일시는 대관 상황에 따라 변경될 수 있습니다. 신청 후 개별 안내드립니다.</p>
        <div className="info-grid">
          {INFO.map(item => (
            <div className="info-card" key={item.lbl}>
              <div className="ico">{item.ico}</div>
              <div className="lbl">{item.lbl}</div>
              <div className="val" style={{whiteSpace:'pre-line'}}>{item.val}</div>
            </div>
          ))}
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
          <h3>강사명 (추후 입력)</h3>
          <p>
            선수 경력이 없는 대신 <strong>운동을 가르치는 법을 전공</strong>했습니다.<br /><br />
            풋살 입문자, 특히 여성 초보자가 편안하게 시작할 수 있도록 눈높이에 맞춘 설명과 즉각적인 피드백을 드립니다.
          </p>
          <div className="inst-list">
            {['체육 전공 (운동 지도 전문)', '소규모 클래스 전문 운영', '여성 초보자 전문 지도 경험'].map(f => (
              <div className="inst-item" key={f}>{f}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ⑦ 신청 폼 */}
      <section className="sec sec-gray apply-wrap" id="apply">
        <p className="sec-eyebrow">Apply</p>
        <h2 className="sec-title">신청하기</h2>

        <div className="spots-card">
          <div className="spots-top">
            <span>현재 신청 현황</span>
            <strong>잔여 4석 / 정원 4명</strong>
          </div>
          <div className="prog-bar">
            <div className="prog-fill" ref={progRef} />
          </div>
        </div>

        {done ? (
          <div className="done-card">
            <div className="emoji">🎉</div>
            <h3>신청 완료!</h3>
            <p>곧 연락드릴게요 😊<br />문의는 인스타그램 DM으로 편하게!</p>
          </div>
        ) : (
          <form className="form-wrap" onSubmit={e => { e.preventDefault(); setDone(true) }}>
            <div className="fg">
              <label>이름 *</label>
              <input type="text" placeholder="홍길동" required />
            </div>
            <div className="fg">
              <label>연락처 *</label>
              <input type="tel" placeholder="010-0000-0000" required />
            </div>
            <div className="fg">
              <label>풋살 경험</label>
              <select>
                <option>없음 (완전 처음이에요)</option>
                <option>조금 있음 (몇 번 해봤어요)</option>
                <option>있음 (정기적으로 해봤어요)</option>
              </select>
            </div>
            <div className="fg">
              <label>문의사항 (선택)</label>
              <textarea rows={3} placeholder="궁금한 점이 있으면 적어주세요" />
            </div>
            <button type="submit" className="btn-apply">⚽ 신청 완료하기</button>
          </form>
        )}
      </section>

      <footer className="footer">
        <p>문의: 인스타그램 DM</p>
        <p style={{color:'#2a2a2a'}}>© 2026 여성 풋살 원데이클래스</p>
      </footer>

    </div>
  )
}