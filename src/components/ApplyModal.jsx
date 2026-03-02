import { useState } from 'react'

export default function ApplyModal({ onClose }) {
  const [done, setDone] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setDone(true)
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
          </>
        )}
      </div>
    </div>
  )
}
