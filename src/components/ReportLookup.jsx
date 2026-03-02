import { useState } from 'react'
import { db, collection, query, where, getDocs } from '../firebase'
import ReportCard from './ReportCard'

export default function ReportLookup() {
  const [name, setName] = useState('')
  const [phoneLast4, setPhoneLast4] = useState('')
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState(null)
  const [error, setError] = useState('')

  const handleLookup = async (e) => {
    e.preventDefault()
    setError('')
    setReports(null)
    setLoading(true)

    try {
      const pQuery = query(
        collection(db, 'participants'),
        where('name', '==', name.trim()),
        where('phoneLast4', '==', phoneLast4.trim())
      )
      const pSnap = await getDocs(pQuery)

      if (pSnap.empty) {
        setError('참가자를 찾을 수 없습니다. 이름과 전화번호 뒷 4자리를 다시 확인해주세요.')
        setLoading(false)
        return
      }

      const participantId = pSnap.docs[0].id

      const rQuery = query(
        collection(db, 'reports'),
        where('participantId', '==', participantId)
      )
      const rSnap = await getDocs(rQuery)
      const reportsList = rSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.sessionNumber - b.sessionNumber)

      setReports(reportsList)
    } catch (err) {
      setError('조회 중 오류가 발생했습니다. 다시 시도해주세요.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-wrap tab-page">

      <div className="report-lookup-wrap">
        <p className="sec-eyebrow">My Report</p>
        <h2 className="report-lookup-title">내 클래스 리포트<br />확인하기 ⚽</h2>
        <p className="report-lookup-desc">이름과 전화번호 뒷 4자리를 입력해주세요</p>

        <form onSubmit={handleLookup} className="report-lookup-form">
          <div className="fg">
            <label>이름</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="홍길동"
              required
            />
          </div>
          <div className="fg">
            <label>전화번호 뒷 4자리</label>
            <input
              type="text"
              inputMode="numeric"
              value={phoneLast4}
              onChange={e => setPhoneLast4(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder="5678"
              required
            />
          </div>
          <button type="submit" className="btn-apply" disabled={loading}>
            {loading ? '조회 중...' : '리포트 조회하기 🔍'}
          </button>
        </form>

        {error && <div className="lookup-error">{error}</div>}

        {reports !== null && reports.length === 0 && (
          <div className="no-reports-msg">
            아직 등록된 리포트가 없어요.<br />
            클래스 참가 후 확인해주세요! ⚽
          </div>
        )}

        {reports && reports.length > 0 && (
          <div className="reports-list">
            <p className="reports-count">총 {reports.length}개의 리포트가 있어요 🎉</p>
            {reports.map(report => (
              <ReportCard key={report.id} report={report} allReports={reports} />
            ))}
          </div>
        )}
      </div>

      <footer className="footer">
        <p style={{color:'#2a2a2a'}}>© 2026 여성 풋살 원데이클래스</p>
      </footer>
    </div>
  )
}
