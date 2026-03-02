import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'

const DONUT_COLORS = ['#FF5C00', '#FF8A3D', '#FFB347', '#FFD580']
const LINE_COLORS = ['#FF5C00', '#2196F3', '#4CAF50', '#9C27B0']

function getYoutubeEmbedUrl(url) {
  if (!url) return null
  let videoId = null
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0]
  } else if (url.includes('watch?v=')) {
    const params = url.split('?')[1]
    if (params) {
      const match = params.match(/v=([^&]+)/)
      videoId = match ? match[1] : null
    }
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

export default function ReportCard({ report, allReports }) {
  const {
    classDate,
    sessionNumber,
    trainingBreakdown = {},
    skillRatings = {},
    fitnessRecords = {},
    coachComment = '',
    youtubeUrl = '',
  } = report

  // ── Section 1: Donut chart ──
  const pieData = Object.entries(trainingBreakdown).map(([name, value]) => ({ name, value }))
  const totalMinutes = pieData.reduce((sum, d) => sum + d.value, 0)

  // ── Section 2: Radar chart ──
  const radarData = Object.entries(skillRatings).map(([subject, value]) => ({
    subject,
    value,
    fullMark: 5,
  }))

  // ── Section 3: Fitness trend ──
  const sessionsUpToCurrent = allReports
    .filter(r => r.sessionNumber <= sessionNumber)
    .sort((a, b) => a.sessionNumber - b.sessionNumber)

  const fitnessKeys = [
    ...new Set(sessionsUpToCurrent.flatMap(r => Object.keys(r.fitnessRecords || {})))
  ]

  const lineData = sessionsUpToCurrent.map(r => ({
    name: `${r.sessionNumber}회차`,
    ...(r.fitnessRecords || {}),
  }))

  const isMultiSession = sessionsUpToCurrent.length >= 2
  const prevReport = allReports.find(r => r.sessionNumber === sessionNumber - 1)

  // ── Share ──
  const handleShare = async () => {
    const shareData = {
      title: '내 풋살 클래스 리포트 ⚽',
      text: `${classDate} ${sessionNumber}회차 클래스 리포트를 확인해보세요!`,
      url: window.location.href,
    }
    if (navigator.share) {
      try { await navigator.share(shareData) } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('링크가 클립보드에 복사되었습니다! 📋')
      } catch {
        alert('공유할 수 없습니다.')
      }
    }
  }

  const embedUrl = getYoutubeEmbedUrl(youtubeUrl)

  return (
    <div className="report-card">
      {/* Header */}
      <div className="report-card-header">
        <div className="report-card-badge">{sessionNumber}회차</div>
        <div>
          <div className="report-card-date">{classDate}</div>
          <div className="report-card-subtitle">{sessionNumber}번째 클래스 리포트</div>
        </div>
      </div>

      {/* ─── Section 1: 훈련 구성 도넛 차트 ─── */}
      {pieData.length > 0 && (
        <div className="report-section">
          <h3 className="report-section-title">🏃 훈련 구성</h3>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val}분`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <div className="donut-total">{totalMinutes}</div>
              <div className="donut-label">총 훈련(분)</div>
            </div>
          </div>
          <div className="donut-legend">
            {pieData.map((d, i) => (
              <div key={d.name} className="donut-legend-item">
                <span
                  className="donut-legend-dot"
                  style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                />
                <span>{d.name}</span>
                <span className="donut-legend-val">{d.value}분</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Section 2: 스킬 평가 레이더 차트 ─── */}
      {radarData.length > 0 && (
        <div className="report-section">
          <h3 className="report-section-title">⭐ 스킬 평가</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
              <PolarGrid gridType="polygon" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#555' }} />
              <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
              <Radar
                dataKey="value"
                stroke="#FF5C00"
                fill="#FF5C00"
                fillOpacity={0.35}
              />
              <Tooltip formatter={(val) => [`${val}점 / 5점`, '']} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="skill-ratings-list">
            {radarData.map(d => (
              <div key={d.subject} className="skill-rating-row">
                <span className="skill-name">{d.subject}</span>
                <div className="skill-stars">
                  {[1, 2, 3, 4, 5].map(n => (
                    <span key={n} className={n <= d.value ? 'star filled' : 'star'}>
                      {n <= d.value ? '★' : '☆'}
                    </span>
                  ))}
                </div>
                <span className="skill-val">{d.value}점</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Section 3: 체력 기록 추이 ─── */}
      <div className="report-section">
        <h3 className="report-section-title">📈 체력 기록 추이</h3>
        {!isMultiSession ? (
          <>
            <p className="no-trend-msg">다음 클래스에서 성장을 확인하세요! 📈</p>
            <div className="fitness-current">
              {Object.entries(fitnessRecords).map(([key, val]) => (
                <div key={key} className="fitness-item">
                  <span className="fitness-key">{key}</span>
                  <span className="fitness-val">{val}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData} margin={{ top: 5, right: 16, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {fitnessKeys.map((key, i) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            {prevReport && (
              <div className="fitness-diff">
                {fitnessKeys.map(key => {
                  const curr = fitnessRecords[key]
                  const prev = prevReport.fitnessRecords?.[key]
                  if (curr == null || prev == null) return null
                  const diff = Number((curr - prev).toFixed(1))
                  if (diff === 0) return null
                  return (
                    <div key={key} className={`diff-badge ${diff > 0 ? 'up' : 'down'}`}>
                      {diff > 0 ? '⬆️' : '⬇️'} {key}: {diff > 0 ? '+' : ''}{diff}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Section 4: 강사 코멘트 + 영상 ─── */}
      <div className="report-section">
        <h3 className="report-section-title">💬 강사 코멘트</h3>
        <div className="coach-bubble">
          <div className="coach-avatar">👨‍🏫</div>
          <div className="coach-text">{coachComment}</div>
        </div>
        {embedUrl && (
          <div className="youtube-section">
            <h3 className="report-section-title" style={{ marginTop: '20px' }}>🎬 오늘의 하이라이트</h3>
            <div className="youtube-embed">
              <iframe
                src={embedUrl}
                title="오늘의 하이라이트"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>

      {/* Share */}
      <button className="share-btn" onClick={handleShare}>
        📤 내 리포트 공유하기
      </button>
    </div>
  )
}
