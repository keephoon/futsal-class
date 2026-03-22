import { useState, useEffect } from 'react'
import { db, collection, query, orderBy, onSnapshot } from '../firebase'

const VENUES = [
  { name: '광교 PPC',      addr: '수원 영통구 성복2로 369',   url: 'https://map.kakao.com/link/search/광교PPC' },
  { name: '판교 화랑공원', addr: '성남 분당구 판교동',         url: 'https://map.kakao.com/link/search/판교화랑공원' },
  { name: '상현 레스피아', addr: '용인 수지구 상현동',         url: 'https://map.kakao.com/link/search/상현레스피아' },
  { name: '보정동 하부기지', addr: '용인 기흥구 보정동',       url: 'https://map.kakao.com/link/search/보정동하부기지' },
  { name: '수지 체육공원', addr: '용인 수지구',                url: 'https://map.kakao.com/link/search/수지체육공원' },
]

function ScheduleCard({ s, onApply, isPast }) {
  const spots = s.capacity - (s.enrolledCount || 0)
  const full = spots <= 0
  const closed = !s.isOpen
  const disabled = isPast || full || closed

  return (
    <div className={`sched-card ${disabled ? 'sched-card-disabled' : ''}`}>
      <div className="sched-card-top">
        <div className="sched-card-date">{s.title}</div>
        <div className={`sched-badge ${
          isPast ? 'past' :
          !s.isOpen ? 'closed' :
          full ? 'full' :
          spots <= 2 ? 'few' : 'open'
        }`}>
          {isPast ? '종료' :
           !s.isOpen ? '접수 마감' :
           full ? '정원 마감' :
           `${spots}/${s.capacity}자리`}
        </div>
      </div>

      <div className="sched-card-info">
        <span>🕐 {s.timeSlot || '20:30 – 22:00'}</span>
        <span>📍 {s.location || '광교 PPC'}</span>
      </div>

      {s.note && (
        <div className="sched-card-note">📌 {s.note}</div>
      )}

      {!disabled && (
        <button className="sched-apply-btn" onClick={() => onApply(s)}>
          신청하기 →
        </button>
      )}
    </div>
  )
}

export default function ScheduleTab({ onApply }) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'schedules'), orderBy('date', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  const now = new Date()
  const toDate = (s) => s.date ? new Date(s.date.seconds * 1000) : new Date(0)

  const upcoming = schedules.filter(s => toDate(s) >= now)
  const past = schedules.filter(s => toDate(s) < now)

  return (
    <div className="page-wrap tab-page">

      {/* 히어로 */}
      <div className="sched-hero">
        <h1 className="sched-title sched-title-sm">클래스 일정 및 위치</h1>
        <a
          className="hero-tag sched-pickup-tag"
          href="https://www.notion.so/keephoon/PPC-31da94a6fa958018a652d35250ab644d?source=copy_link"
          target="_blank"
          rel="noopener noreferrer"
        >
          🚗 픽업 안내 바로가기
        </a>
        <div className="venue-list">
          {VENUES.map(v => (
            <a
              key={v.name}
              className="venue-item"
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="venue-pin">📍</span>
              <span className="venue-info">
                <span className="venue-name">{v.name}</span>
                <span className="venue-addr">{v.addr}</span>
              </span>
              <span className="venue-arrow">지도 →</span>
            </a>
          ))}
        </div>
      </div>

      <div className="sched-body">
        {loading ? (
          <div className="sched-empty">
            <div className="sched-empty-icon">⏳</div>
            <p>불러오는 중...</p>
          </div>
        ) : upcoming.length === 0 ? (
          <div className="sched-empty">
            <div className="sched-empty-icon">📅</div>
            <p>현재 등록된 일정이 없어요<br />곧 새 일정이 공개돼요!</p>
          </div>
        ) : (
          <>
            <div className="sched-section-label">다가오는 클래스</div>
            <div className="sched-list">
              {upcoming.map(s => (
                <ScheduleCard key={s.id} s={s} onApply={onApply} />
              ))}
            </div>
          </>
        )}

        {past.length > 0 && (
          <div className="sched-past-wrap">
            <div className="sched-section-label sched-section-dim">지난 클래스</div>
            <div className="sched-list">
              {[...past].reverse().map(s => (
                <ScheduleCard key={s.id} s={s} onApply={onApply} isPast />
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>© 2026 여성 풋살 원데이클래스</p>
      </footer>
    </div>
  )
}
