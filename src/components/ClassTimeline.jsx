import { useState, useEffect } from 'react'
import { db, collection, query, where, getDocs } from '../firebase'
import { resolveParticipantId } from '../utils/resolveParticipantId'
import { SkillDetailSheet } from './SkillCard'

// YouTube ID 파서 (RecapTab.jsx와 동일)
function parseYouTubeId(url) {
  if (!url) return null
  const u = url.trim()
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /shorts\/([A-Za-z0-9_-]{11})/,
    /embed\/([A-Za-z0-9_-]{11})/,
  ]
  for (const p of patterns) { const m = u.match(p); if (m) return m[1] }
  return null
}

const CATEGORY_COLORS = {
  '체력': '#10B981',
  '볼터치': '#7C3AED',
  '드리블': '#FF5C00',
  '패스': '#0891B2',
  '슈팅': '#EF4444',
  '포지셔닝': '#F59E0B',
  '팀플레이': '#EC4899',
}

const PRIORITY_CONFIG = {
  high: { color: '#EF4444', label: '높음', icon: '🔴' },
  medium: { color: '#F59E0B', label: '보통', icon: '🟡' },
  low: { color: '#6B7280', label: '낮음', icon: '⚪' },
}

export default function ClassTimeline({ recap, currentUser, onBack, skills = [] }) {
  const [corrections, setCorrections] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedVideo, setExpandedVideo] = useState(null)
  const [selectedSkill, setSelectedSkill] = useState(null)

  const timeline = (recap.timeline || []).sort((a, b) => a.order - b.order)

  useEffect(() => {
    if (!currentUser) { setLoading(false); return }
    const fetchCorrections = async () => {
      try {
        setLoading(true)
        const participantId = await resolveParticipantId(currentUser)

        let feedbacks = []
        if (participantId && recap.scheduleId) {
          // BUG-002: where 2개만, orderBy 제거 → 클라이언트 정렬
          const feedbackQuery = query(
            collection(db, 'correction_feedback'),
            where('participantId', '==', participantId),
            where('scheduleId', '==', recap.scheduleId)
          )
          const snapshot = await getDocs(feedbackQuery)
          feedbacks = snapshot.docs.map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              // BUG-004: Timestamp 변환
              createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
            }
          }).sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 }
            return (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
          })
        }
        setCorrections(feedbacks)
      } catch (err) {
        console.error('교정 피드백 조회 실패:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCorrections()
  }, [currentUser, recap.scheduleId])

  const formatDate = (ts) => {
    if (!ts) return ''
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts)
    return `${d.getMonth() + 1}월 ${d.getDate()}일`
  }

  // 해당 타임라인 구간에 매칭되는 교정 피드백 찾기
  const getCorrectionsForSegment = (segment) => {
    return corrections.filter(c =>
      c.timelineOrder === segment.order || c.category === segment.category
    )
  }

  // 타임라인 구간에 매칭 안 되는 일반 교정 피드백
  const unmatchedCorrections = corrections.filter(c => {
    return !timeline.some(seg =>
      c.timelineOrder === seg.order || c.category === seg.category
    )
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--surface-1)',
    }}>
      {/* 헤더 */}
      <div style={{
        padding: '56px 20px 16px', borderBottom: '1px solid var(--border)',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: 'var(--orange)',
          fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
          padding: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          돌아가기
        </button>
        <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--text-4)', marginBottom: 4 }}>
          {formatDate(recap.date)}
        </div>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-1)', margin: 0, lineHeight: 1.3 }}>
          {recap.title}
        </h1>
      </div>

      {/* 코치 코멘트 */}
      {recap.coachComment && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-4)', marginBottom: 8 }}>COACH COMMENT</div>
          <p style={{ color: 'var(--text-2)', fontSize: '0.88rem', lineHeight: 1.65, margin: 0 }}>{recap.coachComment}</p>
        </div>
      )}

      {/* 타임라인 */}
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-4)', marginBottom: 16 }}>수업 타임라인</div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-4)', fontSize: '0.85rem' }}>불러오는 중...</div>
        ) : timeline.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-4)', fontSize: '0.85rem' }}>타임라인이 아직 등록되지 않았어요.</div>
        ) : (
          <div>
            {timeline.map((segment, index) => {
              const segmentCorrections = getCorrectionsForSegment(segment)
              const catColor = CATEGORY_COLORS[segment.category] || 'var(--orange)'
              const videoId = parseYouTubeId(segment.videoUrl)

              return (
                <div key={segment.order} style={{
                  position: 'relative',
                  paddingLeft: '28px',
                  paddingBottom: index === timeline.length - 1 ? '0' : '24px',
                }}>
                  {/* BUG-007: 세로선 — 마지막 항목이 아닐 때만 */}
                  {index < timeline.length - 1 && (
                    <div style={{
                      position: 'absolute', left: '8px', top: '20px', bottom: '0',
                      width: '1px', background: 'var(--border)',
                    }} />
                  )}

                  {/* 동그라미 마커 */}
                  <div style={{
                    position: 'absolute', left: '2px', top: '4px',
                    width: '13px', height: '13px', borderRadius: '50%',
                    background: catColor, border: '2px solid var(--surface-1)',
                  }} />

                  {/* 시간 + 제목 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                      {segment.time}
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-1)' }}>
                      {segment.title}
                    </span>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, color: catColor,
                      background: `${catColor}18`, padding: '2px 8px', borderRadius: 10,
                    }}>
                      {segment.category}
                    </span>
                  </div>

                  {/* 드릴 목록 */}
                  {(segment.drills || []).length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      {segment.drills.map((drill, di) => (
                        <div key={di} style={{
                          fontSize: '0.8rem', color: 'var(--text-2)',
                          lineHeight: 1.6, paddingLeft: 4,
                        }}>
                          <span style={{ color: 'var(--text-4)', marginRight: 6 }}>▸</span>
                          {drill.name}
                          {drill.description && (
                            <span style={{ color: 'var(--text-4)', fontSize: '0.72rem', marginLeft: 6 }}>— {drill.description}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 영상 */}
                  {videoId && (
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      {expandedVideo === segment.order ? (
                        <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 10, overflow: 'hidden' }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <button onClick={() => setExpandedVideo(segment.order)} style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          background: 'rgba(255, 92, 0, 0.06)', border: '1px solid rgba(255, 92, 0, 0.15)',
                          borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
                          color: 'var(--orange)', fontSize: '0.78rem', fontWeight: 700,
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="currentColor" />
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                          영상 보기
                        </button>
                      )}
                    </div>
                  )}

                  {/* 기본기 링크 */}
                  {segment.skillLibraryRef && skills.length > 0 && (() => {
                    const linkedSkill = skills.find(s => s.id === segment.skillLibraryRef)
                    if (!linkedSkill) return null
                    return (
                      <button onClick={() => setSelectedSkill(linkedSkill)} style={{
                        display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, marginBottom: 4,
                        background: 'rgba(255,92,0,0.06)', border: '1px solid rgba(255,92,0,0.12)',
                        borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                        color: 'var(--orange)', fontSize: '0.75rem', fontWeight: 700,
                      }}>
                        📖 {linkedSkill.name} 자세히 보기
                      </button>
                    )
                  })()}

                  {/* 교정 피드백 (BUG-006: 인라인 style 문자열) */}
                  {segmentCorrections.length > 0 && segmentCorrections.map(fb => {
                    const pc = PRIORITY_CONFIG[fb.priority] || PRIORITY_CONFIG.medium
                    return (
                      <div key={fb.id} style={{
                        background: 'rgba(255, 92, 0, 0.08)',
                        borderLeft: '3px solid var(--orange)',
                        borderRadius: '0 8px 8px 0',
                        padding: '12px 14px',
                        marginTop: '8px',
                        marginLeft: '0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: '0.65rem' }}>{pc.icon}</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: pc.color }}>{pc.label}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-4)' }}>나의 교정 포인트</span>
                        </div>
                        <div style={{ color: 'var(--text-3)', fontSize: '0.78rem', marginBottom: 4 }}>
                          {fb.problem}
                        </div>
                        <div style={{ color: 'var(--text-1)', fontSize: '0.85rem', lineHeight: 1.55, fontWeight: 600 }}>
                          → {fb.correction}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 구간 매칭 안 된 교정 피드백 */}
      {unmatchedCorrections.length > 0 && (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-4)', marginBottom: 12 }}>추가 교정 포인트</div>
          {unmatchedCorrections.map(fb => {
            const pc = PRIORITY_CONFIG[fb.priority] || PRIORITY_CONFIG.medium
            return (
              <div key={fb.id} style={{
                background: 'rgba(255, 92, 0, 0.08)',
                borderLeft: '3px solid var(--orange)',
                borderRadius: '0 8px 8px 0',
                padding: '12px 14px',
                marginBottom: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: '0.65rem' }}>{pc.icon}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: pc.color }}>{pc.label}</span>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700, color: CATEGORY_COLORS[fb.category] || 'var(--text-3)',
                    background: `${CATEGORY_COLORS[fb.category] || '#888'}18`, padding: '1px 6px', borderRadius: 8,
                  }}>{fb.category}</span>
                </div>
                <div style={{ color: 'var(--text-3)', fontSize: '0.78rem', marginBottom: 4 }}>
                  {fb.problem}
                </div>
                <div style={{ color: 'var(--text-1)', fontSize: '0.85rem', lineHeight: 1.55, fontWeight: 600 }}>
                  → {fb.correction}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 수업 영상 */}
      {(recap.studentVideoUrls || []).length > 0 && parseYouTubeId(recap.studentVideoUrls[0]) && (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-4)', marginBottom: 10 }}>수업 영상</div>
          <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 12, overflow: 'hidden' }}>
            <iframe
              src={`https://www.youtube.com/embed/${parseYouTubeId(recap.studentVideoUrls[0])}`}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* 하단 여백 (탭바 높이) */}
      <div style={{ height: 120 }} />

      {/* 기본기 상세 시트 */}
      {selectedSkill && (
        <SkillDetailSheet skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
      )}
    </div>
  )
}
