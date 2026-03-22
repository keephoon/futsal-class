import { useState, useEffect } from 'react'
import { db, collection, query, where, getDocs, getDoc, doc, orderBy, Timestamp } from '../firebase'
import ReportCard from './ReportCard'

// ── D-day 계산 ──────────────────────────────────────────────
const getDday = (ts) => {
  if (!ts) return null
  const target = new Date(ts.seconds * 1000)
  target.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.round((target - now) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'D-DAY'
  if (diff > 0) return `D-${diff}`
  return `D+${Math.abs(diff)}`
}

// ── 이번 주 범위 ─────────────────────────────────────────────
const getWeekRange = () => {
  const now = new Date()
  const day = now.getDay() // 0=일
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

export default function MyTab({ currentUser, onLogin, onResultsChange, activeCategory }) {
  // ── 로그인 폼 상태 ──
  const [name, setName] = useState(currentUser?.name || '')
  const [phoneLast4, setPhoneLast4] = useState(currentUser?.phoneLast4 || '')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // ── 리포트 상태 ──
  const [reports, setReports] = useState(null)
  const [participantName, setParticipantName] = useState('')
  const [expandedSessions, setExpandedSessions] = useState(new Set())
  const [showAllReports, setShowAllReports] = useState(false)

  // ── 대시보드 상태 ──
  const [nextSchedule, setNextSchedule] = useState(null)
  const [scheduleDetail, setScheduleDetail] = useState(null)
  const [weeklyLogs, setWeeklyLogs] = useState([])
  const [dashLoading, setDashLoading] = useState(false)

  // 세션 유저 자동 조회
  useEffect(() => {
    if (currentUser?.name && currentUser?.phoneLast4 && reports === null) {
      runLookup(currentUser.name, currentUser.phoneLast4, true)
    }
  }, []) // eslint-disable-line

  const runLookup = async (lookupName, lookupPhone, silent = false) => {
    if (!silent) setLoginLoading(true)
    setLoginError('')
    setDashLoading(true)

    try {
      // 참가자 조회
      const pSnap = await getDocs(
        query(collection(db, 'participants'),
          where('name', '==', lookupName.trim()),
          where('phoneLast4', '==', lookupPhone.trim()))
      )
      if (pSnap.empty) {
        setLoginError('이름 또는 전화번호를 확인해주세요.')
        return
      }

      const participantId = pSnap.docs[0].id
      const pData = pSnap.docs[0].data()
      setParticipantName(pData.name || lookupName.trim())

      // 세션 저장
      if (onLogin) onLogin({ name: lookupName.trim(), phoneLast4: lookupPhone.trim() })

      // 리포트 조회
      const rSnap = await getDocs(
        query(collection(db, 'reports'), where('participantId', '==', participantId))
      )
      const list = rSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.sessionNumber || 0) - (a.sessionNumber || 0))

      setReports(list)
      if (list.length > 0) setExpandedSessions(new Set([list[0].sessionNumber]))

      // 다음 클래스 D-day: 신청한 일정에서 가장 가까운 미래 일정
      const appSnap = await getDocs(
        query(collection(db, 'applications'),
          where('phoneLast4', '==', lookupPhone.trim()))
      )
      const myApps = appSnap.docs.map(d => d.data())
        .filter(a => a.name === lookupName.trim() && a.scheduleId)

      const schedPromises = myApps.map(a => getDoc(doc(db, 'schedules', a.scheduleId)))
      const schedDocs = await Promise.all(schedPromises)
      const now = new Date()

      let nearest = null
      let nearestData = null
      schedDocs.forEach((sd, i) => {
        if (!sd.exists()) return
        const data = sd.data()
        const schedDate = data.date ? new Date(data.date.seconds * 1000) : null
        if (!schedDate) return
        if (schedDate >= now) {
          if (!nearest || schedDate < new Date(nearest.seconds * 1000)) {
            nearest = data.date
            nearestData = { ...data, id: sd.id, appData: myApps[i] }
          }
        }
      })
      setNextSchedule(nearest)
      setScheduleDetail(nearestData)

      // 이번 주 셀프 트레이닝 로그 (BUG-002: where 3개 → 인덱스 필요하므로 클라이언트 필터링)
      try {
        const { monday } = getWeekRange()
        const wSnap = await getDocs(
          query(collection(db, 'training_logs'),
            where('userName', '==', lookupName.trim()),
            where('userPhone', '==', lookupPhone.trim())
          )
        )
        const allLogs = wSnap.docs.map(d => d.data())
        const mondayTs = monday.getTime()
        setWeeklyLogs(allLogs.filter(log => {
          const logDate = log.date?.seconds ? log.date.seconds * 1000 : 0
          return logDate >= mondayTs
        }))
      } catch (_) {
        setWeeklyLogs([])
      }

    } catch (err) {
      setLoginError('조회 중 오류가 발생했습니다.')
      console.error(err)
    } finally {
      setLoginLoading(false)
      setDashLoading(false)
    }
  }

  useEffect(() => {
    if (onResultsChange) onResultsChange(reports !== null && reports.length > 0)
  }, [reports, onResultsChange])

  const handleLogin = (e) => {
    e.preventDefault()
    runLookup(name, phoneLast4)
  }

  const toggleSession = (n) => {
    setExpandedSessions(prev => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })
  }

  const dday = getDday(nextSchedule)
  const weeklyMin = weeklyLogs.reduce((s, l) => s + (l.durationMin || 0), 0)
  const lastReport = reports?.[0]

  // ── 로그인 전 ──────────────────────────────────────────────
  if (!currentUser?.name) {
    return (
      <div>
        <div className="rl-hero">
          <div className="rl-hero-inner">
            <div className="rl-eyebrow">MY</div>
            <h1 className="rl-title">나의<br />트레이닝</h1>
            <p className="rl-desc">이름과 전화번호 뒷 4자리를 입력하세요</p>
          </div>
        </div>
        <div className="rl-form-wrap">
          <form onSubmit={handleLogin} className="rl-form">
            <div className="rl-input-row">
              <div className="fg rl-fg">
                <label>이름</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" required />
              </div>
              <div className="fg rl-fg">
                <label>전화번호 뒷 4자리</label>
                <input type="text" inputMode="numeric" value={phoneLast4}
                  onChange={e => setPhoneLast4(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="5678" required />
              </div>
            </div>
            <button type="submit" className="btn-apply" disabled={loginLoading}>
              {loginLoading ? '조회 중...' : '시작하기 →'}
            </button>
          </form>
          {loginError && (
            <div className="rl-error">
              <span className="rl-error-icon">!</span>
              {loginError}
            </div>
          )}
        </div>
        <footer className="footer"><p>© 2026 여성 풋살 원데이클래스</p></footer>
      </div>
    )
  }

  // ── 로그인 후 대시보드 ──────────────────────────────────────
  const hasReports = reports !== null && reports.length > 0
  return (
    <div style={{ paddingBottom: hasReports ? 140 : 100 }}>

      {/* ── 헤더 ── */}
      <div style={{ padding: '56px 24px 20px', background: 'var(--surface-1)' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--orange)', marginBottom: 6 }}>MY DASHBOARD</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-1)', lineHeight: 1.2 }}>
          {participantName || currentUser.name}<span style={{ color: 'var(--text-3)', fontSize: '1rem', fontWeight: 600 }}>님</span>
        </h1>
      </div>

      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── D-day + 이번 주 요약 그리드 ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

          {/* D-day 카드 */}
          <div style={{ background: dday === 'D-DAY' ? 'linear-gradient(135deg, var(--orange), #c93a00)' : 'var(--surface-2)', borderRadius: 18, border: dday === 'D-DAY' ? 'none' : '1px solid var(--border)', padding: '18px 16px', boxShadow: dday === 'D-DAY' ? '0 8px 24px rgba(255,92,0,0.35)' : 'none' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em', color: dday === 'D-DAY' ? 'rgba(255,255,255,0.7)' : 'var(--text-3)', marginBottom: 8 }}>다음 클래스</div>
            {dashLoading ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-4)' }}>...</div>
            ) : dday ? (
              <>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: dday === 'D-DAY' ? '#fff' : 'var(--orange)', lineHeight: 1, marginBottom: 6 }}>{dday}</div>
                <div style={{ fontSize: '0.65rem', color: dday === 'D-DAY' ? 'rgba(255,255,255,0.8)' : 'var(--text-3)', fontWeight: 600, lineHeight: 1.4 }}>
                  {scheduleDetail?.title || ''}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-4)', lineHeight: 1, marginBottom: 4 }}>—</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-4)' }}>신청 없음</div>
              </>
            )}
          </div>

          {/* 이번 주 요약 */}
          <div style={{ background: 'var(--surface-2)', borderRadius: 18, border: '1px solid var(--border)', padding: '18px 16px' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 8 }}>이번 주 셀프</div>
            {dashLoading ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-4)' }}>...</div>
            ) : (
              <>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: weeklyMin > 0 ? 'var(--orange)' : 'var(--text-4)', lineHeight: 1, marginBottom: 6 }}>
                  {weeklyMin >= 60 ? `${Math.floor(weeklyMin / 60)}h${weeklyMin % 60 > 0 ? ` ${weeklyMin % 60}m` : ''}` : `${weeklyMin}m`}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontWeight: 600 }}>
                  {weeklyLogs.length}회 훈련
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── 누적 통계 바 ── */}
        {reports !== null && reports.length > 0 && (() => {
          const SKILL_KEYS = ['드리블 정확도', '볼 터치 감각', '체력 유지력', '포지셔닝 이해도', '팀 플레이']
          const latestRatings = lastReport?.skillRatings || {}
          return (
            <div style={{ background: 'var(--surface-2)', borderRadius: 18, border: '1px solid var(--border)', padding: '18px 20px' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 14 }}>최근 스킬 평가</div>
              {SKILL_KEYS.map(key => {
                const val = latestRatings[key] || 0
                const pct = (val / 5) * 100
                return (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-2)', fontWeight: 600 }}>{key}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--orange)', fontWeight: 800 }}>{val}/5</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: 'linear-gradient(90deg, var(--orange), #FF8A3D)', transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                )
              })}
              <div style={{ marginTop: 10, fontSize: '0.65rem', color: 'var(--text-4)', textAlign: 'right' }}>
                SESSION {String(lastReport.sessionNumber || 0).padStart(2, '0')} 기준
              </div>
            </div>
          )
        })()}

        {/* ── 리포트 섹션 ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)' }}>
              클래스 리포트 {reports !== null && <span style={{ color: 'var(--text-4)', fontWeight: 600, fontSize: '0.8rem' }}>({reports?.length || 0}개)</span>}
            </h2>
            {reports !== null && reports.length > 1 && (
              <button onClick={() => setShowAllReports(p => !p)} style={{ background: 'none', border: 'none', color: 'var(--orange)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                {showAllReports ? '접기' : '전체보기'}
              </button>
            )}
          </div>

          {reports === null ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-4)', fontSize: '0.85rem' }}>불러오는 중...</div>
          ) : reports.length === 0 ? (
            <div style={{ background: 'var(--surface-2)', borderRadius: 18, border: '1px solid var(--border)', padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>⚽</div>
              <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', lineHeight: 1.6 }}>아직 등록된 리포트가 없어요.<br />클래스 참가 후 확인해주세요!</p>
            </div>
          ) : (
            <div className="rl-accordion">
              {(showAllReports ? reports : reports.slice(0, 1)).map(report => {
                const isOpen = expandedSessions.has(report.sessionNumber)
                const totalMin = Object.values(report.trainingBreakdown || {}).reduce((s, v) => s + v, 0)
                const skillVals = Object.values(report.skillRatings || {})
                const avgSkill = skillVals.length ? (skillVals.reduce((s, v) => s + v, 0) / skillVals.length).toFixed(1) : null

                return (
                  <div key={report.id} className={`rl-acc-item ${isOpen ? 'open' : ''}`}>
                    <button className="rl-acc-header" onClick={() => toggleSession(report.sessionNumber)}>
                      <div className="rl-acc-header-left">
                        <div className="rl-acc-session">SESSION {String(report.sessionNumber).padStart(2, '0')}</div>
                        <div className="rl-acc-date">{report.classDate}</div>
                      </div>
                      <div className="rl-acc-header-right">
                        {!isOpen && (
                          <div className="rl-acc-summary">
                            {totalMin > 0 && <span>{totalMin}분</span>}
                            {avgSkill && <span>스킬 {avgSkill}점</span>}
                          </div>
                        )}
                        <div className={`rl-acc-arrow ${isOpen ? 'up' : ''}`}>›</div>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="rl-acc-body">
                        <ReportCard
                          report={report}
                          allReports={reports}
                          participantName={participantName}
                          activeCategory={activeCategory || '전체'}
                        />
                      </div>
                    )}
                  </div>
                )
              })}

              {!showAllReports && reports.length > 1 && (
                <button onClick={() => setShowAllReports(true)} style={{ width: '100%', padding: '14px', marginTop: 8, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                  이전 리포트 {reports.length - 1}개 더 보기
                </button>
              )}
            </div>
          )}
        </div>

        <footer style={{ textAlign: 'center', padding: '8px 0' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-4)' }}>© 2026 여성 풋살 원데이클래스</p>
        </footer>
      </div>
    </div>
  )
}
