import { useState, useRef, useEffect } from 'react'
import {
  db, collection, addDoc, serverTimestamp,
  query, orderBy, onSnapshot, doc, updateDoc, increment
} from '../firebase'

// O / X 토글 컴포넌트
function OXToggle({ value, onChange }) {
  return (
    <div className="ox-wrap">
      <button
        type="button"
        className={`ox-btn ox-o${value === 'O' ? ' selected' : ''}`}
        onClick={() => onChange('O')}
      >
        O
      </button>
      <button
        type="button"
        className={`ox-btn ox-x${value === 'X' ? ' selected' : ''}`}
        onClick={() => onChange('X')}
      >
        X
      </button>
    </div>
  )
}

export default function ApplyModal({ onClose, preSelectedSchedule }) {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  // 일정
  const [schedules, setSchedules] = useState([])
  const [schedulesLoading, setSchedulesLoading] = useState(true)
  const [selectedSchedule, setSelectedSchedule] = useState(preSelectedSchedule || null)

  // 기본 정보
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [experience, setExperience] = useState('')
  const [hasBall, setHasBall] = useState(null)
  const [needPickup, setNeedPickup] = useState(null)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})

  // 신청 가능한 일정 fetch (실시간)
  useEffect(() => {
    const q = query(collection(db, 'schedules'), orderBy('date', 'asc'))
    const unsub = onSnapshot(q, snap => {
      const now = new Date()
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(s => {
          const d = s.date ? new Date(s.date.seconds * 1000) : new Date(0)
          const spots = s.capacity - (s.enrolledCount || 0)
          return d >= now && s.isOpen && spots > 0
        })
      setSchedules(list)
      setSchedulesLoading(false)
    }, () => setSchedulesLoading(false))
    return unsub
  }, [])

  // 스와이프 닫기
  const sheetRef = useRef(null)
  const touchStartY = useRef(0)
  const isDragging = useRef(false)

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
    isDragging.current = true
    if (sheetRef.current) sheetRef.current.style.transition = 'none'
  }

  const handleTouchMove = (e) => {
    if (!isDragging.current) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0 && sheetRef.current?.scrollTop === 0) {
      sheetRef.current.style.transform = `translateY(${Math.min(delta * 0.6, 200)}px)`
    }
  }

  const handleTouchEnd = (e) => {
    if (!isDragging.current) return
    isDragging.current = false
    const delta = e.changedTouches[0].clientY - touchStartY.current
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.16,1,0.3,1)'
      if (delta > 100) {
        sheetRef.current.style.transform = 'translateY(100%)'
        setTimeout(onClose, 280)
      } else {
        sheetRef.current.style.transform = 'translateY(0)'
      }
    }
  }

  const validate = () => {
    const e = {}
    if (!selectedSchedule) e.schedule = '참여할 일정을 선택해주세요'
    if (!name.trim()) e.name = '이름을 입력해주세요'
    if (!phone.trim()) e.phone = '연락처를 입력해주세요'
    if (!experience) e.experience = '풋살 경험을 선택해주세요'
    if (hasBall === null) e.hasBall = '개인 공 보유 여부를 선택해주세요'
    if (needPickup === null) e.needPickup = '픽업 필요 여부를 선택해주세요'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await addDoc(collection(db, 'applications'), {
        name: name.trim(),
        phone: phone.trim(),
        phoneLast4: phone.replace(/[^0-9]/g, '').slice(-4),
        experience,
        hasBall,
        needPickup,
        note: note.trim(),
        scheduleId: selectedSchedule.id,
        scheduleName: selectedSchedule.title,
        createdAt: serverTimestamp(),
      })

      // 해당 일정 신청자 수 +1
      await updateDoc(doc(db, 'schedules', selectedSchedule.id), {
        enrolledCount: increment(1),
      })

      setDone(true)
    } catch (err) {
      console.error(err)
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-sheet"
        ref={sheetRef}
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="modal-handle" />

        {done ? (
          <div className="done-card">
            <div className="emoji">🎉</div>
            <h3>신청 완료!</h3>
            <p>
              <strong>{selectedSchedule?.title}</strong><br />
              클래스에 등록되었어요 😊<br />
              문의는 인스타그램 DM으로 편하게!
            </p>
            <button className="btn-apply" onClick={onClose} style={{ marginTop: 20 }}>
              닫기
            </button>
          </div>
        ) : (
          <>
            <h2 className="modal-title">클래스 신청하기 ⚽</h2>
            <form onSubmit={handleSubmit} className="form-wrap" noValidate>

              {/* ── 일정 선택 ── */}
              <div className="fg">
                <label>참여할 일정 <span className="req">*</span></label>
                {schedulesLoading ? (
                  <p className="field-hint">일정 불러오는 중...</p>
                ) : schedules.length === 0 ? (
                  <p className="field-hint">현재 신청 가능한 일정이 없습니다</p>
                ) : (
                  <div className="sched-select-list">
                    {schedules.map(s => {
                      const left = s.capacity - (s.enrolledCount || 0)
                      const sel = selectedSchedule?.id === s.id
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`sched-select-item${sel ? ' selected' : ''}`}
                          onClick={() => {
                            setSelectedSchedule(s)
                            setErrors(p => ({ ...p, schedule: '' }))
                          }}
                        >
                          <span className="sched-select-title">{s.title}</span>
                          <span className={`sched-select-spots${left <= 2 ? ' few' : ''}`}>
                            남은 자리 {left}개
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {errors.schedule && <span className="field-err">{errors.schedule}</span>}
              </div>

              {/* ── 이름 ── */}
              <div className="fg">
                <label>이름 <span className="req">*</span></label>
                <input
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
                />
                {errors.name && <span className="field-err">{errors.name}</span>}
              </div>

              {/* ── 연락처 ── */}
              <div className="fg">
                <label>연락처 <span className="req">*</span></label>
                <input
                  type="tel"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: '' })) }}
                />
                {errors.phone && <span className="field-err">{errors.phone}</span>}
              </div>

              {/* ── 풋살 경험 ── */}
              <div className="fg">
                <label>풋살 경험 <span className="req">*</span></label>
                <select
                  value={experience}
                  onChange={e => { setExperience(e.target.value); setErrors(p => ({ ...p, experience: '' })) }}
                >
                  <option value="">선택해주세요</option>
                  <option>없음 (완전 처음이에요)</option>
                  <option>조금 있음 (몇 번 해봤어요)</option>
                  <option>있음 (정기적으로 해봤어요)</option>
                </select>
                {errors.experience && <span className="field-err">{errors.experience}</span>}
              </div>

              {/* ── 개인 공 보유 여부 ── */}
              <div className="fg">
                <label>개인 공 보유 여부 <span className="req">*</span></label>
                <OXToggle
                  value={hasBall}
                  onChange={v => { setHasBall(v); setErrors(p => ({ ...p, hasBall: '' })) }}
                />
                {errors.hasBall && <span className="field-err">{errors.hasBall}</span>}
              </div>

              {/* ── 픽업 필요 여부 ── */}
              <div className="fg">
                <label>
                  픽업 필요 여부 <span className="req">*</span>
                  <a
                    href="https://www.notion.so/keephoon/PPC-31da94a6fa958018a652d35250ab644d?source=copy_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pickup-info-link"
                  >
                    픽업 안내 보기 →
                  </a>
                </label>
                <OXToggle
                  value={needPickup}
                  onChange={v => { setNeedPickup(v); setErrors(p => ({ ...p, needPickup: '' })) }}
                />
                {errors.needPickup && <span className="field-err">{errors.needPickup}</span>}
              </div>

              {/* ── 문의사항 (선택) ── */}
              <div className="fg">
                <label>문의사항 <span className="opt">(선택)</span></label>
                <textarea
                  rows={3}
                  placeholder="궁금한 점이 있으면 적어주세요"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-apply" disabled={loading}>
                {loading ? '저장 중...' : '⚽ 신청 완료하기'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
