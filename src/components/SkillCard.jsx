import { useState } from 'react'

// YouTube ID 파서
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

// YouTube 썸네일 URL (BUG-008)
function getYouTubeThumbnail(url) {
  const videoId = parseYouTubeId(url)
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

const DIFFICULTY_STARS = {
  beginner: { label: '기본', stars: 1 },
  intermediate: { label: '중급', stars: 2 },
  advanced: { label: '고급', stars: 3 },
  1: { label: '기본', stars: 1 },
  2: { label: '중급', stars: 2 },
  3: { label: '고급', stars: 3 },
}

// ── 카드 목록 아이템 ──
function SkillGridCard({ skill, onClick }) {
  const thumbnail = skill.thumbnailUrl || getYouTubeThumbnail(skill.videoUrl)
  const diff = DIFFICULTY_STARS[skill.difficulty] || { label: '기본', stars: 1 }

  return (
    <div onClick={onClick} style={{
      background: 'var(--surface-2)', borderRadius: 14, border: '1px solid var(--border)',
      overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s',
    }}>
      {/* 썸네일 */}
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '16/9',
        background: 'var(--surface-3)', overflow: 'hidden',
      }}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={skill.name}
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none' }}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-4)', fontSize: '1.5rem',
          }}>⚽</div>
        )}
        {/* 재생 아이콘 오버레이 */}
        {skill.videoUrl && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="white" />
            </svg>
          </div>
        )}
      </div>

      {/* 정보 */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: 4, lineHeight: 1.3 }}>
          {skill.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--orange)' }}>
            {'★'.repeat(diff.stars)}{'☆'.repeat(3 - diff.stars)}
          </span>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-4)', fontWeight: 600 }}>{diff.label}</span>
        </div>
        {skill.shortDescription && (
          <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 4, lineHeight: 1.4 }}>
            {skill.shortDescription}
          </div>
        )}
      </div>
    </div>
  )
}

// ── 상세 바텀시트 ──
function SkillDetailSheet({ skill, onClose }) {
  const videoId = parseYouTubeId(skill.videoUrl)
  const diff = DIFFICULTY_STARS[skill.difficulty] || { label: '기본', stars: 1 }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000,
    }}>
      {/* 오버레이 */}
      <div onClick={onClose} style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }} />

      {/* 시트 (BUG-011: maxHeight 85vh) */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'var(--surface-1)', borderRadius: '20px 20px 0 0',
        maxHeight: '85vh', overflowY: 'auto',
        paddingBottom: 'env(safe-area-inset-bottom, 20px)',
        animation: 'slideUp 0.3s ease-out',
      }}>
        {/* 핸들 */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {/* 헤더 */}
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-1)', margin: '0 0 4px' }}>
                {skill.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--orange)', fontWeight: 700, background: 'rgba(255,92,0,0.12)', padding: '2px 8px', borderRadius: 10 }}>
                  {skill.category}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                  {'★'.repeat(diff.stars)}{'☆'.repeat(3 - diff.stars)} {diff.label}
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'var(--surface-3)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, color: 'var(--text-2)', fontSize: '1.1rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
          </div>
        </div>

        {/* 영상 */}
        {videoId && (
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 12, overflow: 'hidden' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* 핵심 포인트 */}
        {(skill.keyPoints || []).length > 0 && (
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 8 }}>
              💡 핵심 포인트
            </div>
            {skill.keyPoints.map((pt, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, alignItems: 'flex-start',
                padding: '6px 0',
              }}>
                <span style={{ color: 'var(--orange)', fontSize: '0.7rem', marginTop: 1, flexShrink: 0 }}>▸</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-1)', lineHeight: 1.5 }}>{pt}</span>
              </div>
            ))}
          </div>
        )}

        {/* 자주 하는 실수 */}
        {(skill.commonMistakes || []).length > 0 && (
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 8 }}>
              ⚠️ 자주 하는 실수
            </div>
            {skill.commonMistakes.map((m, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, alignItems: 'flex-start',
                padding: '6px 0',
              }}>
                <span style={{ color: '#EF4444', fontSize: '0.7rem', marginTop: 1, flexShrink: 0 }}>✕</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.5 }}>{m}</span>
              </div>
            ))}
          </div>
        )}

        {/* 단계별 연습 */}
        {(skill.steps || []).length > 0 && (
          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 8 }}>
              📋 단계별 연습
            </div>
            {skill.steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '8px 0', borderBottom: i < skill.steps.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,92,0,0.12)', color: 'var(--orange)',
                  fontSize: '0.7rem', fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{i + 1}</div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-1)', lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ── 메인 export ──
export default function SkillCard({ skills, category }) {
  const [selectedSkill, setSelectedSkill] = useState(null)

  const filteredSkills = category === '전체'
    ? skills
    : skills.filter(s => s.category === category)

  if (filteredSkills.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-4)', fontSize: '0.85rem' }}>
        {category === '전체' ? '아직 등록된 기본기가 없어요.' : `${category} 카테고리가 비어있어요.`}
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 120 }}>
        {filteredSkills.map(skill => (
          <SkillGridCard
            key={skill.id}
            skill={skill}
            onClick={() => setSelectedSkill(skill)}
          />
        ))}
      </div>

      {selectedSkill && (
        <SkillDetailSheet
          skill={selectedSkill}
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </>
  )
}

// Named export for direct use from ClassTimeline
export { SkillDetailSheet }
