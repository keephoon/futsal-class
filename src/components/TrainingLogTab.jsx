import { useState, useEffect } from 'react'
import { db, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, Timestamp } from '../firebase'

export default function TrainingLogTab({ currentUser }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  // 입력 상태
  const todayStr = new Date().toISOString().split('T')[0]
  const [logDate, setLogDate] = useState(todayStr)
  const [logMinutes, setLogMinutes] = useState(30)
  const [logMemo, setLogMemo] = useState('')
  const [saving, setSaving] = useState(false)

  // 현재 달
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth()) // 0-indexed

  useEffect(() => {
    if (!currentUser?.name) return
    loadLogs()
  }, [currentUser])

  const loadLogs = async () => {
    if (!currentUser?.name) return
    setLoading(true)
    try {
      // BUG-002: orderBy 제거 → 클라이언트 정렬 (복합 인덱스 불필요)
      const snap = await getDocs(
        query(collection(db, 'training_logs'),
          where('userName', '==', currentUser.name),
          where('userPhone', '==', currentUser.phoneLast4)
        )
      )
      const allLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      allLogs.sort((a, b) => {
        const aTime = a.date?.seconds || 0
        const bTime = b.date?.seconds || 0
        return bTime - aTime
      })
      setLogs(allLogs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentUser?.name) return
    setSaving(true)
    try {
      const d = new Date(logDate + 'T12:00:00+09:00')
      await addDoc(collection(db, 'training_logs'), {
        userName: currentUser.name,
        userPhone: currentUser.phoneLast4,
        date: Timestamp.fromDate(d),
        durationMin: Number(logMinutes),
        memo: logMemo.trim(),
        createdAt: serverTimestamp(),
      })
      setModalOpen(false)
      setLogDate(todayStr)
      setLogMinutes(30)
      setLogMemo('')
      loadLogs()
    } catch (err) {
      alert('저장 실패: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // 통계 계산
  const thisMonth = logs.filter(l => {
    if (!l.date) return false
    const d = new Date(l.date.seconds * 1000)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const totalMinThisMonth = thisMonth.reduce((s, l) => s + (l.durationMin || 0), 0)
  const totalHours = Math.floor(totalMinThisMonth / 60)
  const totalMins = totalMinThisMonth % 60

  // 스트릭 계산
  const streak = (() => {
    const dateSet = new Set(logs.map(l => {
      if (!l.date) return null
      const d = new Date(l.date.seconds * 1000)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }).filter(Boolean))
    let count = 0
    const cur = new Date()
    while (true) {
      const key = `${cur.getFullYear()}-${cur.getMonth()}-${cur.getDate()}`
      if (!dateSet.has(key)) break
      count++
      cur.setDate(cur.getDate() - 1)
    }
    return count
  })()

  // 히트맵 데이터
  const logDaySet = new Set(logs.map(l => {
    if (!l.date) return null
    const d = new Date(l.date.seconds * 1000)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  }).filter(Boolean))

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay() // 0=Sun
  const calendarCells = []
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const formatDate = (ts) => {
    if (!ts) return ''
    const d = new Date(ts.seconds * 1000)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }

  const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

  if (!currentUser?.name) {
    return (
      <div className="page-wrap tab-page">
        <div className="rl-hero">
          <div className="rl-hero-inner">
            <div className="rl-eyebrow">TRAINING LOG</div>
            <h1 className="rl-title">셀프 트레이닝<br />기록</h1>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 24px' }}>
          <div style={{ fontSize: 40 }}>🔒</div>
          <p style={{ color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.6 }}>
            MY 탭에서 먼저 조회하면<br />자동으로 연결돼요
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrap tab-page" style={{ paddingBottom: 120 }}>

      {/* ── 헤더 ── */}
      <div style={{ padding: '56px 24px 8px' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--orange)', textTransform: 'uppercase', marginBottom: 6 }}>TRAINING LOG</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-1)', lineHeight: 1.2 }}>
          {currentUser.name}의<br />트레이닝 기록
        </h1>
      </div>

      {/* ── 이번 달 요약 ── */}
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--orange) 0%, #c93a00 100%)', borderRadius: 20, padding: '20px 24px', boxShadow: '0 8px 32px rgba(255,92,0,0.3)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>이번 달 요약</div>
          <div style={{ display: 'flex', gap: 0 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                {totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, marginTop: 4 }}>총 훈련 시간</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{thisMonth.length}</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, marginTop: 4 }}>훈련 횟수</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{streak}</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, marginTop: 4 }}>연속 일수 🔥</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 캘린더 히트맵 ── */}
      <div style={{ padding: '24px 24px 0' }}>
        <div style={{ background: 'var(--surface-2)', borderRadius: 20, border: '1px solid var(--border)', padding: '20px' }}>
          {/* 월 네비 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button onClick={prevMonth} style={{ background: 'var(--surface-3)', border: 'none', borderRadius: 8, color: 'var(--text-2)', width: 32, height: 32, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-1)' }}>{viewYear}년 {MONTH_NAMES[viewMonth]}</span>
            <button onClick={nextMonth} style={{ background: 'var(--surface-3)', border: 'none', borderRadius: 8, color: 'var(--text-2)', width: 32, height: 32, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
          </div>

          {/* 요일 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-4)', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {calendarCells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />
              const hasLog = logDaySet.has(`${viewYear}-${viewMonth}-${day}`)
              const isToday = viewYear === now.getFullYear() && viewMonth === now.getMonth() && day === now.getDate()
              return (
                <div key={day} style={{
                  aspectRatio: '1',
                  borderRadius: 8,
                  background: hasLog ? 'var(--orange)' : 'var(--surface-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.65rem',
                  fontWeight: isToday ? 900 : 600,
                  color: hasLog ? '#fff' : isToday ? 'var(--orange)' : 'var(--text-3)',
                  border: isToday && !hasLog ? '1.5px solid var(--orange)' : 'none',
                  boxShadow: hasLog ? '0 2px 8px rgba(255,92,0,0.4)' : 'none',
                }}>
                  {day}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 최근 기록 ── */}
      <div style={{ padding: '24px 24px 0' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: 12 }}>최근 기록</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-4)' }}>불러오는 중...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📝</div>
            <p style={{ color: 'var(--text-4)', fontSize: '0.85rem', lineHeight: 1.6 }}>아직 기록이 없어요.<br />아래 + 버튼으로 첫 기록을 남겨보세요!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.slice(0, 20).map(log => (
              <div key={log.id} style={{ background: 'var(--surface-2)', borderRadius: 14, border: '1px solid var(--border)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,92,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--orange)', textAlign: 'center', lineHeight: 1.1 }}>
                    {log.durationMin >= 60 ? `${Math.floor(log.durationMin/60)}h\n${log.durationMin%60}m` : `${log.durationMin}m`}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-1)' }}>
                    {log.memo || '트레이닝'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-4)', marginTop: 2 }}>
                    {formatDate(log.date)}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-3)' }}>
                  {log.durationMin}분
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <button
        onClick={() => setModalOpen(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom))',
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--orange), #c93a00)',
          border: 'none',
          color: '#fff',
          fontSize: '1.5rem',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(255,92,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          transition: 'transform 0.2s',
        }}
      >
        +
      </button>

      {/* ── 기록 입력 모달 ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }} onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div style={{ width: '100%', background: 'var(--surface-2)', borderRadius: '24px 24px 0 0', padding: '8px 24px 40px', maxWidth: 480, margin: '0 auto', borderTop: '1px solid var(--border)' }}>
            {/* 핸들 */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '12px auto 20px' }} />

            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: 20 }}>트레이닝 기록</div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>날짜</div>
                <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
                  style={{ width: '100%', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-1)', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>시간 (분)</div>
                <input type="number" value={logMinutes} min="10" max="300" step="10"
                  onChange={e => setLogMinutes(e.target.value)}
                  style={{ width: '100%', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text-1)', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* 빠른 시간 선택 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[20, 30, 45, 60, 90].map(m => (
                <button key={m} onClick={() => setLogMinutes(m)} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none', background: logMinutes == m ? 'var(--orange)' : 'var(--surface-3)', color: logMinutes == m ? '#fff' : 'var(--text-3)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>{m}분</button>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>메모 (선택)</div>
              <input type="text" value={logMemo} onChange={e => setLogMemo(e.target.value)}
                placeholder="인사이드 터치 연습"
                style={{ width: '100%', background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', color: 'var(--text-1)', fontSize: '0.85rem', boxSizing: 'border-box' }} />
            </div>

            <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, var(--orange), #c93a00)', color: '#fff', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? '저장 중...' : '기록 저장하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
