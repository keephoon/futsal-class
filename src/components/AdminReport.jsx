import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { db, collection, query, where, getDocs, addDoc, serverTimestamp } from '../firebase'

const ADMIN_PASSWORD = 'futsal2026'

const SKILL_KEYS = ['드리블 정확도', '볼 터치 감각', '체력 유지력', '포지셔닝 이해도', '팀 플레이']

const getDefaultTraining = () => [
  { name: '드리블', minutes: 25 },
  { name: '볼 컨트롤', minutes: 20 },
  { name: '기초 체력', minutes: 15 },
  { name: '미니게임', minutes: 30 },
]

const getDefaultFitness = () => [
  { name: '셔틀런 왕복(90초)', value: 0 },
  { name: '볼터치 횟수(30초)', value: 0 },
  { name: '드리블 콘 통과(초)', value: 0 },
  { name: '패스 정확도(10회 중)', value: 0 },
]

export default function AdminReport() {
  const [pw, setPw] = useState('')
  const [authed, setAuthed] = useState(false)
  const [applications, setApplications] = useState([])
  const [selectedAppId, setSelectedAppId] = useState('')
  const [classDate, setClassDate] = useState(new Date().toISOString().split('T')[0])
  const [sessionNumber, setSessionNumber] = useState(1)
  const [trainingItems, setTrainingItems] = useState(getDefaultTraining)
  const [skillRatings, setSkillRatings] = useState(
    () => SKILL_KEYS.reduce((acc, k) => ({ ...acc, [k]: 3 }), {})
  )
  const [fitnessItems, setFitnessItems] = useState(getDefaultFitness)
  const [coachComment, setCoachComment] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (authed) loadApplications()
  }, [authed])

  const loadApplications = async () => {
    try {
      const snap = await getDocs(collection(db, 'applications'))
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error('applications 로드 실패:', err)
    }
  }

  const handleAuth = (e) => {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true)
    } else {
      alert('비밀번호가 틀렸습니다.')
    }
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Training items handlers
  const addTrainingItem = () => setTrainingItems(prev => [...prev, { name: '', minutes: 0 }])
  const removeTrainingItem = (i) => setTrainingItems(prev => prev.filter((_, idx) => idx !== i))
  const updateTrainingItem = (i, field, val) =>
    setTrainingItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  // Fitness items handlers
  const addFitnessItem = () => setFitnessItems(prev => [...prev, { name: '', value: 0 }])
  const removeFitnessItem = (i) => setFitnessItems(prev => prev.filter((_, idx) => idx !== i))
  const updateFitnessItem = (i, field, val) =>
    setFitnessItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const handleSave = async () => {
    if (!selectedAppId) return alert('참가자를 선택해주세요.')

    const selectedApp = applications.find(a => a.id === selectedAppId)
    if (!selectedApp) return

    setSaving(true)
    try {
      const phone = (selectedApp.phone || '').replace(/[^0-9]/g, '')
      const phoneLast4 = phone.slice(-4)

      // Find or create participant
      const q = query(collection(db, 'participants'), where('phone', '==', phone))
      const snap = await getDocs(q)
      let participantId

      if (snap.empty) {
        const newDoc = await addDoc(collection(db, 'participants'), {
          name: selectedApp.name,
          phone,
          phoneLast4,
          createdAt: serverTimestamp(),
        })
        participantId = newDoc.id
      } else {
        participantId = snap.docs[0].id
      }

      // Build training breakdown
      const trainingBreakdown = trainingItems.reduce((acc, item) => {
        if (item.name.trim()) acc[item.name.trim()] = Number(item.minutes)
        return acc
      }, {})

      // Build fitness records
      const fitnessRecords = fitnessItems.reduce((acc, item) => {
        if (item.name.trim()) acc[item.name.trim()] = Number(item.value)
        return acc
      }, {})

      await addDoc(collection(db, 'reports'), {
        participantId,
        classDate,
        sessionNumber: Number(sessionNumber),
        trainingBreakdown,
        skillRatings,
        fitnessRecords,
        coachComment,
        youtubeUrl,
        createdAt: serverTimestamp(),
      })

      showToast('저장 완료! 🎉')

      // Reset form
      setSelectedAppId('')
      setSessionNumber(1)
      setTrainingItems(getDefaultTraining())
      setSkillRatings(SKILL_KEYS.reduce((acc, k) => ({ ...acc, [k]: 3 }), {}))
      setFitnessItems(getDefaultFitness())
      setCoachComment('')
      setYoutubeUrl('')
    } catch (err) {
      console.error(err)
      alert('저장 실패: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!authed) {
    return (
      <div className="page-wrap admin-auth-page">
        <div className="admin-auth-card">
          <div className="admin-logo">⚽</div>
          <h2 className="admin-auth-title">관리자 로그인</h2>
          <form onSubmit={handleAuth}>
            <div className="fg">
              <label>비밀번호</label>
              <input
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="비밀번호 입력"
                required
              />
            </div>
            <button type="submit" className="btn-apply" style={{ marginTop: 14 }}>
              로그인
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrap">
      <div className="page-nav">
        <Link to="/" className="back-btn">← 홈으로</Link>
        <span className="admin-badge">관리자</span>
      </div>

      {toast && <div className="toast">{toast}</div>}

      <div className="admin-wrap">
        <p className="sec-eyebrow">Admin</p>
        <h2 className="admin-title">리포트 입력</h2>

        {/* 1. 참가자 선택 */}
        <div className="admin-section">
          <h3 className="admin-section-title">1. 참가자 선택</h3>
          <div className="fg">
            <label>참가자</label>
            <select
              value={selectedAppId}
              onChange={e => setSelectedAppId(e.target.value)}
            >
              <option value="">참가자를 선택하세요</option>
              {applications.map(app => {
                const phone = (app.phone || '').replace(/[^0-9]/g, '')
                const last4 = phone.slice(-4)
                return (
                  <option key={app.id} value={app.id}>
                    {app.name} ({last4})
                  </option>
                )
              })}
            </select>
          </div>
          {applications.length === 0 && (
            <p className="admin-hint">신청자 데이터를 불러오는 중이거나 아직 신청자가 없습니다.</p>
          )}
        </div>

        {/* 2. 클래스 정보 */}
        <div className="admin-section">
          <h3 className="admin-section-title">2. 클래스 정보</h3>
          <div className="admin-row">
            <div className="fg" style={{ flex: 1 }}>
              <label>클래스 날짜</label>
              <input
                type="date"
                value={classDate}
                onChange={e => setClassDate(e.target.value)}
              />
            </div>
            <div className="fg" style={{ flex: 1 }}>
              <label>회차</label>
              <input
                type="number"
                min="1"
                value={sessionNumber}
                onChange={e => setSessionNumber(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 3. 훈련 구성 */}
        <div className="admin-section">
          <h3 className="admin-section-title">3. 훈련 구성 (분)</h3>
          {trainingItems.map((item, i) => (
            <div key={i} className="dynamic-row">
              <input
                type="text"
                value={item.name}
                onChange={e => updateTrainingItem(i, 'name', e.target.value)}
                placeholder="훈련 항목"
                className="dynamic-input"
              />
              <input
                type="number"
                value={item.minutes}
                onChange={e => updateTrainingItem(i, 'minutes', e.target.value)}
                placeholder="분"
                className="dynamic-num"
              />
              <button
                type="button"
                onClick={() => removeTrainingItem(i)}
                className="remove-btn"
                aria-label="삭제"
              >×</button>
            </div>
          ))}
          <button type="button" onClick={addTrainingItem} className="add-btn">
            + 항목 추가
          </button>
        </div>

        {/* 4. 스킬 평가 */}
        <div className="admin-section">
          <h3 className="admin-section-title">4. 스킬 평가 (1~5점)</h3>
          {SKILL_KEYS.map(key => (
            <div key={key} className="skill-row">
              <label className="skill-label">{key}</label>
              <div className="skill-slider-wrap">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={skillRatings[key]}
                  onChange={e => setSkillRatings(prev => ({
                    ...prev,
                    [key]: Number(e.target.value)
                  }))}
                  className="skill-slider"
                />
                <span className="skill-score">{skillRatings[key]}점</span>
              </div>
            </div>
          ))}
        </div>

        {/* 5. 체력 기록 */}
        <div className="admin-section">
          <h3 className="admin-section-title">5. 체력 기록</h3>
          {fitnessItems.map((item, i) => (
            <div key={i} className="dynamic-row">
              <input
                type="text"
                value={item.name}
                onChange={e => updateFitnessItem(i, 'name', e.target.value)}
                placeholder="측정 항목"
                className="dynamic-input"
              />
              <input
                type="number"
                step="0.1"
                value={item.value}
                onChange={e => updateFitnessItem(i, 'value', e.target.value)}
                placeholder="수치"
                className="dynamic-num"
              />
              <button
                type="button"
                onClick={() => removeFitnessItem(i)}
                className="remove-btn"
                aria-label="삭제"
              >×</button>
            </div>
          ))}
          <button type="button" onClick={addFitnessItem} className="add-btn">
            + 항목 추가
          </button>
        </div>

        {/* 6. 강사 코멘트 */}
        <div className="admin-section">
          <h3 className="admin-section-title">6. 강사 코멘트</h3>
          <div className="fg">
            <textarea
              rows={4}
              value={coachComment}
              onChange={e => setCoachComment(e.target.value)}
              placeholder="참가자에 대한 피드백을 입력해주세요"
            />
          </div>
        </div>

        {/* 7. YouTube URL */}
        <div className="admin-section">
          <h3 className="admin-section-title">7. YouTube URL (선택)</h3>
          <div className="fg">
            <input
              type="text"
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://youtu.be/..."
            />
          </div>
        </div>

        {/* 저장 */}
        <button
          className="btn-apply"
          onClick={handleSave}
          disabled={saving}
          style={{ marginTop: 8 }}
        >
          {saving ? '저장 중...' : '💾 리포트 저장하기'}
        </button>
      </div>
    </div>
  )
}
