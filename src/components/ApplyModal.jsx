import { useState } from 'react'
import { db, collection, addDoc, serverTimestamp } from '../firebase'

export default function ApplyModal({ onClose }) {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [experience, setExperience] = useState('없음 (완전 처음이에요)')
  const [note, setNote] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await addDoc(collection(db, 'applications'), {
        name: name.trim(),
        phone: phone.trim(),
        phoneLast4: phone.replace(/[^0-9]/g, '').slice(-4),
        experience,
        note: note.trim(),
        createdAt: serverTimestamp(),
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
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {done ? (
          <div className="done-card">
            <div className="emoji">🎉</div>
            <h3>신청 완료!</h3>
            <p>곧 연락드릴게요 😊<br />문의는 인스타그램 DM으로 편하게!</p>
            <button className="btn-apply" onClick={onClose} style={{ marginTop: 20 }}>
              닫기
            </button>
          </div>
        ) : (
          <>
            <h2 className="modal-title">클래스 신청하기 ⚽</h2>
            <div className="modal-spots">
              <span>잔여</span>
              <strong>4석 / 4명</strong>
            </div>
            <form onSubmit={handleSubmit} className="form-wrap">
              <div className="fg">
                <label>이름 *</label>
                <input
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="fg">
                <label>연락처 *</label>
                <input
                  type="tel"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="fg">
                <label>풋살 경험</label>
                <select value={experience} onChange={e => setExperience(e.target.value)}>
                  <option>없음 (완전 처음이에요)</option>
                  <option>조금 있음 (몇 번 해봤어요)</option>
                  <option>있음 (정기적으로 해봤어요)</option>
                </select>
              </div>
              <div className="fg">
                <label>문의사항 (선택)</label>
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
