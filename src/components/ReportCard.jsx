import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
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
    const match = url.split('?')[1]?.match(/v=([^&]+)/)
    videoId = match ? match[1] : null
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null
}

// ── 인스타 스토리용 쉐어 카드 (9:16, 오프스크린 렌더링) ──
function ShareCardElement({ report, participantName, cardRef }) {
  const {
    classDate,
    sessionNumber,
    trainingBreakdown = {},
    skillRatings = {},
    fitnessRecords = {},
  } = report

  const totalMinutes = Object.values(trainingBreakdown).reduce((s, v) => s + v, 0)
  const skillEntries = Object.entries(skillRatings)
  const avgSkill = skillEntries.length
    ? (skillEntries.reduce((s, [, v]) => s + v, 0) / skillEntries.length).toFixed(1)
    : '—'
  const fitnessEntries = Object.entries(fitnessRecords).slice(0, 3)

  const s = {
    wrap: {
      position: 'fixed', left: '-9999px', top: 0,
      width: '360px', height: '640px',
      background: '#0A0A0A',
      fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
      display: 'flex', flexDirection: 'column',
      padding: '36px 30px',
      boxSizing: 'border-box', overflow: 'hidden',
    },
    topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' },
    brandTag: { fontSize: '10px', fontWeight: 800, color: '#555', letterSpacing: '0.12em' },
    sessionEyebrow: { fontSize: '10px', fontWeight: 800, color: '#FF5C00', letterSpacing: '0.14em', marginBottom: '6px' },
    sessionNum: { fontSize: '88px', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.04em' },
    date: { fontSize: '13px', color: '#555', marginTop: '6px', marginBottom: '26px', fontWeight: 600 },
    divider: { height: '1px', background: '#1E1E1E', marginBottom: '22px' },
    statsRow: { display: 'flex', gap: '0', marginBottom: '22px' },
    statBlock: { flex: 1 },
    statDivider: { width: '1px', background: '#1E1E1E', margin: '0 20px' },
    statLabel: { fontSize: '9px', color: '#555', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '5px' },
    statBig: { fontSize: '34px', fontWeight: 900, color: '#FF5C00', lineHeight: 1 },
    statBigWhite: { fontSize: '34px', fontWeight: 900, color: '#fff', lineHeight: 1 },
    statUnit: { fontSize: '10px', color: '#444', marginTop: '3px' },
    skillRow: { marginBottom: '9px' },
    skillMeta: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
    skillName: { fontSize: '10px', color: '#777', fontWeight: 600 },
    skillVal: { fontSize: '10px', color: '#FF5C00', fontWeight: 800 },
    skillBg: { height: '3px', background: '#1A1A1A', borderRadius: '2px' },
    skillFill: (val) => ({
      height: '3px',
      width: `${(val / 5) * 100}%`,
      background: 'linear-gradient(to right, #FF5C00, #FF8A3D)',
      borderRadius: '2px',
    }),
    fitnessGrid: { display: 'flex', gap: '8px', marginBottom: '22px' },
    fitnessItem: {
      flex: 1, background: '#111', borderRadius: '10px',
      padding: '10px 10px',
    },
    fitnessKey: { fontSize: '9px', color: '#555', lineHeight: 1.4, marginBottom: '5px' },
    fitnessVal: { fontSize: '19px', fontWeight: 900, color: '#fff' },
    bottom: { marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
    nameLabel: { fontSize: '10px', color: '#444', marginBottom: '4px' },
    nameText: { fontSize: '17px', fontWeight: 900, color: '#fff' },
    brandRight: { textAlign: 'right' },
    brandIcon: { fontSize: '22px' },
    brandUrl: { fontSize: '9px', color: '#333', marginTop: '4px', letterSpacing: '0.03em' },
  }

  return (
    <div ref={cardRef} style={s.wrap}>
      {/* Top */}
      <div style={s.topRow}>
        <span style={s.brandTag}>FUTSAL CLASS</span>
        <span style={{ fontSize: '14px' }}>⚽</span>
      </div>

      {/* Session number */}
      <div style={s.sessionEyebrow}>SESSION</div>
      <div style={s.sessionNum}>{String(sessionNumber).padStart(2, '0')}</div>
      <div style={s.date}>{classDate}</div>

      <div style={s.divider} />

      {/* Key stats */}
      <div style={s.statsRow}>
        <div style={s.statBlock}>
          <div style={s.statLabel}>총 훈련</div>
          <div style={s.statBig}>{totalMinutes}</div>
          <div style={s.statUnit}>분</div>
        </div>
        <div style={s.statDivider} />
        <div style={s.statBlock}>
          <div style={s.statLabel}>스킬 평균</div>
          <div style={s.statBigWhite}>{avgSkill}</div>
          <div style={s.statUnit}>/ 5점</div>
        </div>
      </div>

      {/* Skill bars */}
      {skillEntries.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          {skillEntries.slice(0, 4).map(([name, val]) => (
            <div key={name} style={s.skillRow}>
              <div style={s.skillMeta}>
                <span style={s.skillName}>{name}</span>
                <span style={s.skillVal}>{val}</span>
              </div>
              <div style={s.skillBg}>
                <div style={s.skillFill(val)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={s.divider} />

      {/* Fitness */}
      {fitnessEntries.length > 0 && (
        <div style={s.fitnessGrid}>
          {fitnessEntries.map(([key, val]) => (
            <div key={key} style={s.fitnessItem}>
              <div style={s.fitnessKey}>{key}</div>
              <div style={s.fitnessVal}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom */}
      <div style={s.bottom}>
        <div>
          <div style={s.nameLabel}>Trained by</div>
          <div style={s.nameText}>{participantName || '참가자'}</div>
        </div>
        <div style={s.brandRight}>
          <div style={s.brandIcon}>⚽</div>
          <div style={s.brandUrl}>futsal-class.vercel.app</div>
        </div>
      </div>
    </div>
  )
}

// ── 메인 리포트 카드 ──
export default function ReportCard({ report, allReports, participantName }) {
  const shareCardRef = useRef(null)
  const [sharing, setSharing] = useState(false)

  const {
    classDate,
    sessionNumber,
    trainingBreakdown = {},
    skillRatings = {},
    fitnessRecords = {},
    coachComment = '',
    youtubeUrl = '',
  } = report

  const pieData = Object.entries(trainingBreakdown).map(([name, value]) => ({ name, value }))
  const totalMinutes = pieData.reduce((sum, d) => sum + d.value, 0)

  const radarData = Object.entries(skillRatings).map(([subject, value]) => ({
    subject, value, fullMark: 5,
  }))

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

  const embedUrl = getYoutubeEmbedUrl(youtubeUrl)

  const handleShare = async () => {
    if (!shareCardRef.current || sharing) return
    setSharing(true)
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0A0A0A',
        logging: false,
      })
      canvas.toBlob(async (blob) => {
        if (!blob) { setSharing(false); return }
        const file = new File([blob], `futsal-session-${sessionNumber}.png`, { type: 'image/png' })
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: `${sessionNumber}회차 풋살 클래스 리포트` })
            setSharing(false); return
          } catch (e) {
            if (e.name === 'AbortError') { setSharing(false); return }
          }
        }
        // fallback: download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `futsal-session-${sessionNumber}.png`
        a.click()
        URL.revokeObjectURL(url)
        setSharing(false)
      }, 'image/png')
    } catch (err) {
      console.error(err)
      alert('이미지 생성 실패. 다시 시도해주세요.')
      setSharing(false)
    }
  }

  return (
    <>
      {/* 오프스크린 쉐어카드 */}
      <ShareCardElement report={report} participantName={participantName} cardRef={shareCardRef} />

      <div className="rc">
        {/* ── 헤더 ── */}
        <div className="rc-header">
          <div className="rc-header-left">
            <div className="rc-eyebrow">CLASS REPORT</div>
            <div className="rc-session">SESSION {String(sessionNumber).padStart(2, '0')}</div>
            <div className="rc-date">{classDate}</div>
          </div>
          <div className="rc-header-stats">
            <div className="rc-stat">
              <div className="rc-stat-val">{totalMinutes}<span className="rc-stat-unit">분</span></div>
              <div className="rc-stat-label">총 훈련</div>
            </div>
            {Object.keys(skillRatings).length > 0 && (
              <div className="rc-stat">
                <div className="rc-stat-val">
                  {(Object.values(skillRatings).reduce((s, v) => s + v, 0) / Object.values(skillRatings).length).toFixed(1)}
                  <span className="rc-stat-unit">점</span>
                </div>
                <div className="rc-stat-label">스킬 평균</div>
              </div>
            )}
          </div>
        </div>

        {/* ── 훈련 구성 ── */}
        {pieData.length > 0 && (
          <div className="rc-section">
            <div className="rc-section-label">TRAINING</div>
            <h3 className="rc-section-title">훈련 구성</h3>
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                    dataKey="value" paddingAngle={2}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}분`, '']} />
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
                  <span className="donut-legend-dot" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                  <span className="donut-legend-name">{d.name}</span>
                  <span className="donut-legend-val">{d.value}분</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 스킬 평가 ── */}
        {radarData.length > 0 && (
          <div className="rc-section">
            <div className="rc-section-label">SKILLS</div>
            <h3 className="rc-section-title">스킬 평가</h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="62%">
                <PolarGrid gridType="polygon" stroke="#f0f0f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#999' }} />
                <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                <Radar dataKey="value" stroke="#FF5C00" fill="#FF5C00" fillOpacity={0.25}
                  strokeWidth={2} />
                <Tooltip formatter={(v) => [`${v}점 / 5점`, '']} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="rc-skill-list">
              {radarData.map(d => (
                <div key={d.subject} className="rc-skill-row">
                  <span className="rc-skill-name">{d.subject}</span>
                  <div className="rc-skill-bar-bg">
                    <div className="rc-skill-bar-fill" style={{ width: `${(d.value / 5) * 100}%` }} />
                  </div>
                  <span className="rc-skill-score">{d.value}점</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 체력 기록 ── */}
        <div className="rc-section">
          <div className="rc-section-label">FITNESS</div>
          <h3 className="rc-section-title">체력 기록{isMultiSession ? ' 추이' : ''}</h3>
          {!isMultiSession ? (
            <>
              <p className="rc-hint">다음 클래스에서 성장 추이를 확인하세요 📈</p>
              <div className="rc-fitness-grid">
                {Object.entries(fitnessRecords).map(([key, val]) => (
                  <div key={key} className="rc-fitness-item">
                    <div className="rc-fitness-key">{key}</div>
                    <div className="rc-fitness-val">{val}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={lineData} margin={{ top: 5, right: 16, bottom: 5, left: -14 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#aaa' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#aaa' }} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  {fitnessKeys.map((key, i) => (
                    <Line key={key} type="monotone" dataKey={key}
                      stroke={LINE_COLORS[i % LINE_COLORS.length]}
                      strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              {prevReport && (
                <div className="rc-diff-row">
                  {fitnessKeys.map(key => {
                    const curr = fitnessRecords[key]
                    const prev = prevReport.fitnessRecords?.[key]
                    if (curr == null || prev == null) return null
                    const diff = Number((curr - prev).toFixed(1))
                    if (diff === 0) return null
                    return (
                      <div key={key} className={`rc-diff-badge ${diff > 0 ? 'up' : 'down'}`}>
                        {diff > 0 ? '▲' : '▼'} {key} {diff > 0 ? '+' : ''}{diff}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── 강사 코멘트 ── */}
        <div className="rc-section">
          <div className="rc-section-label">COACH</div>
          <h3 className="rc-section-title">강사 코멘트</h3>
          <div className="rc-coach-bubble">
            <div className="rc-coach-avatar">👨‍🏫</div>
            <div className="rc-coach-text">{coachComment}</div>
          </div>
        </div>

        {/* ── 하이라이트 영상 ── */}
        {embedUrl && (
          <div className="rc-section">
            <div className="rc-section-label">HIGHLIGHT</div>
            <h3 className="rc-section-title">오늘의 하이라이트</h3>
            <div className="rc-youtube">
              <iframe src={embedUrl} title="하이라이트"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen />
            </div>
          </div>
        )}

        {/* ── 공유 버튼 ── */}
        <div className="rc-footer">
          <button className="rc-share-btn" onClick={handleShare} disabled={sharing}>
            {sharing
              ? <><span className="rc-share-spinner" />생성 중...</>
              : <><span>↑</span> 인스타 스토리 공유</>
            }
          </button>
        </div>
      </div>
    </>
  )
}
