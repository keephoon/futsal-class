import { useState, useEffect } from 'react'
import { db, collection, query, where, getDocs, getDoc, doc } from '../firebase'
import ReportCard from './ReportCard'

export default function ReportLookup({ onResultsChange, activeCategory, currentUser, onLogin }) {
  const [name, setName] = useState(currentUser?.name || '')
  const [phoneLast4, setPhoneLast4] = useState(currentUser?.phoneLast4 || '')
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState(null)
  const [participantName, setParticipantName] = useState('')
  const [upcomingSchedule, setUpcomingSchedule] = useState(null)
  const [error, setError] = useState('')
  const [expandedSessions, setExpandedSessions] = useState(new Set())
  const [scheduleDetail, setScheduleDetail] = useState(null)

  // 세션 유저가 있으면 자동 조회
  useEffect(() => {
    if (currentUser?.name && currentUser?.phoneLast4 && reports === null) {
      runLookup(currentUser.name, currentUser.phoneLast4)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const runLookup = async (lookupName, lookupPhone) => {
    setError('')
    setReports(null)
    setUpcomingSchedule(null)
    setScheduleDetail(null)
    setLoading(true)

    try {
      const pSnap = await getDocs(
        query(collection(db, 'participants'),
          where('name', '==', lookupName.trim()),
          where('phoneLast4', '==', lookupPhone.trim()))
      )

      if (pSnap.empty) {
        setError('참가자를 찾을 수 없습니다. 이름과 전화번호 뒷 4자리를 확인해주세요.')
        setLoading(false)
        return
      }

      const participantId = pSnap.docs[0].id
      const pData = pSnap.docs[0].data()
      const resolvedName = pData.name || lookupName.trim()
      setParticipantName(resolvedName)

      // 세션 저장
      if (onLogin) onLogin({ name: lookupName.trim(), phoneLast4: lookupPhone.trim() })

      // 신청한 일정 조회 (phoneLast4 기준)
      const appSnap = await getDocs(
        query(collection(db, 'applications'), where('phoneLast4', '==', lookupPhone.trim()))
      )
      const scheduled = appSnap.docs
        .map(d => d.data())
        .filter(a => a.scheduleId && a.scheduleName)
        // 이름도 매칭
        .filter(a => a.name === lookupName.trim())
      // 가장 가까운 미래 일정 찾기 (scheduleId로 schedules 컬렉션 확인은 생략 — scheduleName 사용)
      if (scheduled.length > 0) {
        const lastApp = scheduled[scheduled.length - 1]
        setUpcomingSchedule(lastApp)
        if (lastApp.scheduleId) {
          const schedSnap = await getDoc(doc(db, 'schedules', lastApp.scheduleId))
          if (schedSnap.exists()) setScheduleDetail(schedSnap.data())
        }
      }

      const rSnap = await getDocs(
        query(collection(db, 'reports'), where('participantId', '==', participantId))
      )
      const list = rSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.sessionNumber - b.sessionNumber)

      const maxSession = list.length > 0 ? Math.max(...list.map(r => r.sessionNumber)) : -1
      setExpandedSessions(new Set([maxSession]))
      setReports(list)
    } catch (err) {
      setError('조회 중 오류가 발생했습니다. 다시 시도해주세요.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (onResultsChange) {
      onResultsChange(reports !== null && reports.length > 0)
    }
  }, [reports, onResultsChange])

  const handleLookup = (e) => {
    e.preventDefault()
    runLookup(name, phoneLast4)
  }

  const toggleSession = (sessionNumber) => {
    setExpandedSessions(prev => {
      const next = new Set(prev)
      next.has(sessionNumber) ? next.delete(sessionNumber) : next.add(sessionNumber)
      return next
    })
  }

  return (
    <div className="page-wrap tab-page">

      {/* ── 헤더 히어로 ── */}
      <div className="rl-hero">
        <div className="rl-hero-inner">
          <div className="rl-eyebrow">MY REPORT</div>
          <h1 className="rl-title">클래스<br />리포트 조회</h1>
          <p className="rl-desc">이름과 전화번호 뒷 4자리를 입력하세요</p>
        </div>
      </div>

      {/* ── 검색 폼 ── */}
      <div className="rl-form-wrap">
        <form onSubmit={handleLookup} className="rl-form">
          <div className="rl-input-row">
            <div className="fg rl-fg">
              <label>이름</label>
              <input type="text" value={name}
                onChange={e => setName(e.target.value)}
                placeholder="홍길동" required />
            </div>
            <div className="fg rl-fg">
              <label>전화번호 뒷 4자리</label>
              <input type="text" inputMode="numeric"
                value={phoneLast4}
                onChange={e => setPhoneLast4(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                placeholder="5678" required />
            </div>
          </div>
          <button type="submit" className="btn-apply" disabled={loading}>
            {loading ? '조회 중...' : '리포트 조회 →'}
          </button>
        </form>

        {error && (
          <div className="rl-error">
            <span className="rl-error-icon">!</span>
            {error}
          </div>
        )}
      </div>

      {/* ── 결과 ── */}
      {reports !== null && (
        <div className="rl-results">

          {/* 신청 일정 카드 */}
          {upcomingSchedule && (
            <div className="rl-schedule-card">
              <div className="rl-schedule-label">📅 신청한 클래스</div>
              <div className="rl-schedule-name">{upcomingSchedule.scheduleName}</div>
              {scheduleDetail && (
                <div className="rl-schedule-meta">
                  {scheduleDetail.timeSlot && <span>{scheduleDetail.timeSlot}</span>}
                  {scheduleDetail.timeSlot && scheduleDetail.location && <span> · </span>}
                  {scheduleDetail.location && <span>{scheduleDetail.location}</span>}
                </div>
              )}
            </div>
          )}

          {reports.length === 0 ? (
            <div className="rl-empty">
              <div className="rl-empty-icon">⚽</div>
              <p>아직 등록된 리포트가 없어요.<br />클래스 참가 후 확인해주세요!</p>
            </div>
          ) : (
            <>
              <div className="rl-result-header">
                <span className="rl-result-name">{participantName}</span>
                <span className="rl-result-count">{reports.length}개의 리포트</span>
              </div>

              <div className="rl-accordion">
                {/* 최신 회차가 맨 위에 오도록 역순 */}
                {[...reports].reverse().map(report => {
                  const isOpen = expandedSessions.has(report.sessionNumber)
                  const totalMin = Object.values(report.trainingBreakdown || {}).reduce((s, v) => s + v, 0)
                  const skillVals = Object.values(report.skillRatings || {})
                  const avgSkill = skillVals.length
                    ? (skillVals.reduce((s, v) => s + v, 0) / skillVals.length).toFixed(1)
                    : null

                  return (
                    <div key={report.id} className={`rl-acc-item ${isOpen ? 'open' : ''}`}>
                      {/* 아코디언 헤더 */}
                      <button
                        className="rl-acc-header"
                        onClick={() => toggleSession(report.sessionNumber)}
                      >
                        <div className="rl-acc-header-left">
                          <div className="rl-acc-session">
                            SESSION {String(report.sessionNumber).padStart(2, '0')}
                          </div>
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

                      {/* 아코디언 바디 */}
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
              </div>
            </>
          )}
        </div>
      )}

      <footer className="footer">
        <p>© 2026 여성 풋살 원데이클래스</p>
      </footer>
    </div>
  )
}
