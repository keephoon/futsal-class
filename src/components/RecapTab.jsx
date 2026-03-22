import { useState, useEffect } from 'react'
import { db, collection, query, getDocs, doc, getDoc, orderBy } from '../firebase'
import ClassTimeline from './ClassTimeline'
import SkillCard from './SkillCard'

const SKILL_CATEGORIES = ['전체', '드리블', '볼터치', '체력', '포지셔닝', '팀플레이']
const DIFFICULTY_LABEL = { beginner: '초급', intermediate: '중급', advanced: '고급' }
const DIFFICULTY_COLOR = { beginner: '#10B981', intermediate: '#FF5C00', advanced: '#EF4444' }

const CARD_GRADIENTS = [
  'linear-gradient(145deg, #FF5C00 0%, #c93a00 100%)',
  'linear-gradient(145deg, #7C3AED 0%, #4C1D95 100%)',
  'linear-gradient(145deg, #0891B2 0%, #164E63 100%)',
  'linear-gradient(145deg, #059669 0%, #064E3B 100%)',
  'linear-gradient(145deg, #DB2777 0%, #831843 100%)',
]

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

export default function RecapTab({ currentUser }) {
  const [recaps, setRecaps] = useState([])
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [frontIdx, setFrontIdx] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [skillCat, setSkillCat] = useState('전체')
  const [checkedSkills, setCheckedSkills] = useState({})
  const [selectedRecapForTimeline, setSelectedRecapForTimeline] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [recapSnap, skillSnap] = await Promise.all([
          getDocs(query(collection(db, 'class_recaps'), orderBy('date', 'desc'))),
          getDocs(query(collection(db, 'skill_library'), orderBy('category'))),
        ])
        setRecaps(recapSnap.docs.map((d, i) => ({ id: d.id, _gradientIdx: i % CARD_GRADIENTS.length, ...d.data() })))
        setSkills(skillSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredSkills = skillCat === '전체' ? skills : skills.filter(s => s.category === skillCat)
  const frontCard = recaps[frontIdx]
  const frontCardSkills = frontCard ? skills.filter(s => (frontCard.skillRefs || []).includes(s.id)) : []
  const toggleCheck = (key) => setCheckedSkills(p => ({ ...p, [key]: !p[key] }))

  const getCardStyle = (idx) => {
    const pos = (idx - frontIdx + recaps.length) % recaps.length
    if (pos === 0) return { zIndex: 30, transform: 'translateY(0px) scale(1)', opacity: 1, pointerEvents: 'auto' }
    if (pos === 1) return { zIndex: 20, transform: 'translateY(18px) scale(0.93)', opacity: 0.75, pointerEvents: 'auto' }
    if (pos === 2) return { zIndex: 10, transform: 'translateY(32px) scale(0.86)', opacity: 0.45, pointerEvents: 'auto' }
    return { zIndex: 0, transform: 'translateY(40px) scale(0.80)', opacity: 0, pointerEvents: 'none' }
  }

  const formatDate = (ts) => {
    if (!ts) return ''
    const d = new Date(ts.seconds * 1000)
    return `${d.getMonth() + 1}월 ${d.getDate()}일`
  }

  // 타임라인 뷰가 열리면 전체화면으로 표시
  if (selectedRecapForTimeline) {
    return (
      <ClassTimeline
        recap={selectedRecapForTimeline}
        currentUser={currentUser}
        skills={skills}
        onBack={() => setSelectedRecapForTimeline(null)}
      />
    )
  }

  return (
    <div className="page-wrap tab-page">

      {/* ── 헤더 ── */}
      <div style={{ padding: '56px 24px 8px' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--orange)', textTransform: 'uppercase', marginBottom: '6px' }}>RECAP</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-1)', lineHeight: 1.2 }}>수업 리캡</h1>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: 'var(--text-4)' }}>불러오는 중...</div>
      ) : recaps.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 24px' }}>
          <div style={{ fontSize: 48 }}>⚽</div>
          <p style={{ color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.6 }}>아직 등록된 수업 리캡이 없어요.<br />수업 후 코치가 업로드해드려요!</p>
        </div>
      ) : (
        <>
          {/* ── 3D 카드 스택 ── */}
          <div style={{ padding: '24px 24px 0' }}>
            <div style={{ position: 'relative', height: '200px', perspective: '800px' }}>
              {recaps.map((recap, idx) => {
                const pos = (idx - frontIdx + recaps.length) % recaps.length
                return (
                  <div
                    key={recap.id}
                    onClick={() => {
                      if (pos !== 0) { setFrontIdx(idx); return }
                      // BUG-009: timeline이 있으면 타임라인 뷰, 없으면 기존 확장
                      if (recap.timeline && recap.timeline.length > 0) {
                        setSelectedRecapForTimeline(recap)
                      } else {
                        setExpanded(true)
                      }
                    }}
                    style={{
                      position: 'absolute', width: '100%', height: '180px', borderRadius: '20px',
                      background: CARD_GRADIENTS[recap._gradientIdx],
                      padding: '24px', boxSizing: 'border-box', cursor: 'pointer',
                      transition: 'all 0.45s cubic-bezier(0.34, 1.2, 0.64, 1)',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                      ...getCardStyle(idx),
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>
                          {formatDate(recap.date)}
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', lineHeight: 1.3, maxWidth: '260px' }}>
                          {recap.title}
                        </div>
                      </div>
                      {pos === 0 && (
                        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {pos === 0 && (skills.filter(s => (recap.skillRefs || []).includes(s.id))).length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
                        {skills.filter(s => (recap.skillRefs || []).includes(s.id)).slice(0, 3).map(sk => (
                          <span key={sk.id} style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{sk.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 인디케이터 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12, paddingBottom: 4 }}>
              {recaps.map((_, idx) => (
                <div key={idx} onClick={() => setFrontIdx(idx)} style={{ width: idx === frontIdx ? 20 : 6, height: 6, borderRadius: 3, background: idx === frontIdx ? 'var(--orange)' : 'var(--border)', transition: 'all 0.3s', cursor: 'pointer' }} />
              ))}
            </div>
          </div>

          {/* ── 펼쳐진 리캡 디테일 ── */}
          {expanded && frontCard && (
            <div style={{ margin: '20px 24px 0', background: 'var(--surface-2)', borderRadius: 20, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ background: CARD_GRADIENTS[frontCard._gradientIdx], padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{formatDate(frontCard.date)}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{frontCard.title}</div>
                </div>
                <button onClick={() => setExpanded(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>

              {/* 코치 코멘트 */}
              {frontCard.coachComment && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 8 }}>COACH COMMENT</div>
                  <p style={{ color: 'var(--text-2)', fontSize: '0.9rem', lineHeight: 1.6 }}>{frontCard.coachComment}</p>
                </div>
              )}

              {/* 영상 */}
              {(frontCard.studentVideoUrls || []).length > 0 && parseYouTubeId(frontCard.studentVideoUrls[0]) && (
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 10 }}>수업 영상</div>
                  <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 12, overflow: 'hidden' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${parseYouTubeId(frontCard.studentVideoUrls[0])}`}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* 체크리스트 */}
              {frontCardSkills.length > 0 && (
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 12 }}>연습 체크리스트</div>
                  {frontCardSkills.map(skill => {
                    const key = frontCard.id + skill.id
                    return (
                      <div key={skill.id}>
                        <div onClick={() => toggleCheck(key)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, border: checkedSkills[key] ? 'none' : '2px solid var(--border)', background: checkedSkills[key] ? 'var(--orange)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                            {checkedSkills[key] && <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ color: checkedSkills[key] ? 'var(--text-3)' : 'var(--text-1)', textDecoration: checkedSkills[key] ? 'line-through' : 'none', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s' }}>{skill.name} 연습하기</span>
                            {(skill.keyPoints || []).length > 0 && !checkedSkills[key] && (
                              <div style={{ marginTop: 4 }}>
                                {skill.keyPoints.slice(0, 2).map((pt, i) => <div key={i} style={{ fontSize: '0.7rem', color: 'var(--text-4)', lineHeight: 1.4 }}>▸ {pt}</div>)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── 기본기 라이브러리 ── */}
      <div style={{ padding: '32px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>기본기 라이브러리</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{skills.length}개</span>
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', marginBottom: 16 }}>
          {SKILL_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSkillCat(cat)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 20, border: skillCat === cat ? 'none' : '1px solid var(--border)', background: skillCat === cat ? 'var(--orange)' : 'var(--surface-2)', color: skillCat === cat ? '#fff' : 'var(--text-2)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>{cat}</button>
          ))}
        </div>

        {loading ? null : (
          <SkillCard skills={skills} category={skillCat} />
        )}
      </div>

    </div>
  )
}
