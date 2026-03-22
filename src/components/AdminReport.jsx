import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  db, collection, query, where, getDocs, addDoc, serverTimestamp,
  onSnapshot, doc, updateDoc, deleteDoc, orderBy, Timestamp, increment, limit
} from '../firebase'

const ADMIN_PASSWORD = 'futsal2026'
const SKILL_KEYS = ['드리블 정확도', '볼 터치 감각', '체력 유지력', '포지셔닝 이해도', '팀 플레이']
const SKILL_CATEGORIES = ['드리블', '볼터치', '체력', '포지셔닝', '팀플레이', '슈팅', '패스']
const DIFFICULTY_OPTS = [{ v: 'beginner', l: '초급' }, { v: 'intermediate', l: '중급' }, { v: 'advanced', l: '고급' }]

// ── 시드 데이터 ──────────────────────────────────────────────
const SEED_SKILLS = [
  { name: '인사이드 드리블', category: '드리블', difficulty: 'beginner', order: 0,
    keyPoints: ['발 안쪽 면으로 공을 부드럽게 밀어주기', '무릎을 살짝 굽혀 무게중심 낮추기', '눈은 공이 아닌 전방 주시'],
    commonMistakes: ['발끝으로 터치하면 방향 제어 불가', '상체가 너무 앞으로 기울어짐'],
    videoUrl: '' },
  { name: '아웃사이드 드리블', category: '드리블', difficulty: 'intermediate', order: 1,
    keyPoints: ['발 바깥쪽 복숭아뼈 아래로 터치', '스트라이드를 작게 유지', '방향 전환 시 몸통 먼저 틀기'],
    commonMistakes: ['너무 세게 차서 공이 멀리 튀어나감', '발목이 굳어 있으면 방향 조절 어려움'],
    videoUrl: '' },
  { name: '마르셀로 턴', category: '드리블', difficulty: 'intermediate', order: 2,
    keyPoints: ['공 위에 발바닥을 살짝 올려 브레이크', '반대 발로 즉시 방향 전환', '턴 후 첫 터치를 빠르게'],
    commonMistakes: ['턴 전에 멈추면 수비수에게 읽힘', '발바닥 압력을 너무 세게 주면 공이 멈춤'],
    videoUrl: '' },
  { name: '인사이드 터치', category: '볼터치', difficulty: 'beginner', order: 0,
    keyPoints: ['발 안쪽 중앙 (아치 부분)으로 터치', '발목을 고정하고 면적을 넓게 사용', '터치 순간 살짝 발을 당겨 쿠션감 주기'],
    commonMistakes: ['발끝으로 터치하면 정확도 저하', '무릎이 펴진 상태면 균형 잡기 어려움'],
    videoUrl: '' },
  { name: '아웃사이드 터치', category: '볼터치', difficulty: 'beginner', order: 1,
    keyPoints: ['새끼발가락 쪽 바깥 면으로 터치', '발목을 안쪽으로 살짝 틀어 면 만들기', '리시브 후 바로 다음 동작 준비'],
    commonMistakes: ['발이 너무 벌어지면 힘이 분산됨', '터치 타이밍이 늦으면 공을 놓침'],
    videoUrl: '' },
  { name: '발바닥 터치', category: '볼터치', difficulty: 'intermediate', order: 2,
    keyPoints: ['발바닥 앞 1/3 지점으로 공 위를 누르기', '발목을 굽히고 발 각도 45도 유지', '좌우 교대로 리듬감 있게'],
    commonMistakes: ['발뒤꿈치로 밟으면 공 제어 불가', '너무 강하게 누르면 공이 튀어오름'],
    videoUrl: '' },
  { name: '셔틀런 인터벌', category: '체력', difficulty: 'beginner', order: 0,
    keyPoints: ['짧은 거리 (5~10m) 왕복 스프린트', '방향 전환 시 낮은 자세 유지', '90초 안에 최대 왕복 횟수 도전'],
    commonMistakes: ['방향 전환 때 서지 않고 커브로 돌면 효과 감소', '상체가 너무 뒤로 젖혀지면 가속 느려짐'],
    videoUrl: '' },
  { name: '코어 강화 플랭크', category: '체력', difficulty: 'beginner', order: 1,
    keyPoints: ['팔꿈치와 발끝으로 버티기', '엉덩이가 올라가거나 처지지 않게', '복부에 힘을 주고 숨 참지 않기'],
    commonMistakes: ['허리가 꺾이면 허리 부상 위험', '너무 짧은 시간으로는 효과 미미'],
    videoUrl: '' },
  { name: '인터벌 스프린트', category: '체력', difficulty: 'intermediate', order: 2,
    keyPoints: ['전력 30초 + 휴식 30초 반복', '무릎을 높이 들어 보폭 넓히기', '팔 스윙을 크게 하여 추진력 UP'],
    commonMistakes: ['휴식 없이 지속하면 부상 위험', '발끝 착지보다 중족부 착지가 효율적'],
    videoUrl: '' },
  { name: '공간 만들기', category: '포지셔닝', difficulty: 'intermediate', order: 0,
    keyPoints: ['수비수와 일직선이 되지 않는 위치 선점', '패스 전에 미리 움직여 수신 준비', '수비수 시야 밖에서 갑자기 등장'],
    commonMistakes: ['공만 보고 움직이지 않으면 마킹 당함', '너무 일찍 움직이면 오프사이드'],
    videoUrl: '' },
  { name: '오프더볼 움직임', category: '포지셔닝', difficulty: 'advanced', order: 1,
    keyPoints: ['공이 없을 때 끊임없이 수비수 흔들기', '가짜 런 후 반대로 달리는 움직임', '팀원 패스 타이밍에 맞춰 폭발적 가속'],
    commonMistakes: ['멈춰서 공만 기다리면 수비에게 쉬운 먹잇감', '직선만 달리면 읽히기 쉬움'],
    videoUrl: '' },
  { name: '수비 포지셔닝', category: '포지셔닝', difficulty: 'intermediate', order: 2,
    keyPoints: ['공과 상대방 사이에 위치하기', '반 몸 자세로 공과 상대 동시 시야 확보', '압박 타이밍은 패스 직후가 최적'],
    commonMistakes: ['너무 가까이 붙으면 뒤 공간 노출', '평행하게 서면 방향 전환에 당함'],
    videoUrl: '' },
  { name: '벽패스 (원-투)', category: '팀플레이', difficulty: 'beginner', order: 0,
    keyPoints: ['패스 후 즉시 달리기 (줘-받기)', '패스는 짧고 강하게', '리턴 패스 받을 공간 미리 예측'],
    commonMistakes: ['패스 후 멈추면 원-투가 성립 안 됨', '너무 느린 패스는 수비에게 차단됨'],
    videoUrl: '' },
  { name: '삼각패스', category: '팀플레이', difficulty: 'intermediate', order: 1,
    keyPoints: ['3명이 삼각형 대형 유지', '한 터치 또는 두 터치로 빠르게 전환', '삼각형 모서리가 너무 좁으면 안 됨'],
    commonMistakes: ['대형이 무너지면 패스 코스가 없어짐', '발 아래 공을 다루며 고개를 들지 못함'],
    videoUrl: '' },
  { name: '압박 수비', category: '팀플레이', difficulty: 'advanced', order: 2,
    keyPoints: ['공 소유자에게 1명이 빠르게 압박', '나머지 팀원은 패스 코스 차단', '볼 탈취 후 즉시 공격 전환'],
    commonMistakes: ['1명만 압박하고 팀원이 따르지 않으면 역습 당함', '너무 일찍 압박하면 뒤 공간 노출'],
    videoUrl: '' },
]

const SEED_RECAPS = [
  { daysAgo: 4, title: '약한 발 인사이드 집중 훈련',
    skillNames: ['인사이드 터치', '인사이드 드리블'],
    coachComment: '오늘은 왼발 인사이드 패스에 집중했어요! 처음엔 어색해하셨지만 후반부엔 눈에 띄게 좋아지셨어요. 다음 수업 전까지 벽 패스 하루 10분씩 꼭 연습해오세요 🔥' },
  { daysAgo: 11, title: '드리블 & 방향 전환 마스터',
    skillNames: ['마르셀로 턴', '아웃사이드 드리블'],
    coachComment: '마르셀로 턴 타이밍이 이번에 확 잡힌 것 같아요! 방향 전환 후 첫 터치를 더 빠르게 가져가는 연습만 더 되면 게임에서 바로 써먹을 수 있을 거예요.' },
  { daysAgo: 18, title: '기초 볼터치 & 리시브',
    skillNames: ['인사이드 터치', '발바닥 터치'],
    coachComment: '첫 수업인데도 볼터치 감각이 좋으세요! 발바닥 터치는 아직 어색하시겠지만 꾸준히 하다 보면 금방 늘 거예요. 홈 트레이닝으로 양발 번갈아 발바닥 터치 30개씩 해오세요.' },
]

const seedDemoData = async (skills, showToast) => {
  if (skills.length > 0) {
    if (!window.confirm(`기존 기본기 ${skills.length}개가 있어요.\n추가로 시드 데이터를 넣을까요?`)) return
  }
  try {
    // 1. skill_library 추가
    const addedSkills = []
    for (const s of SEED_SKILLS) {
      const ref = await addDoc(collection(db, 'skill_library'), {
        ...s, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
      addedSkills.push({ id: ref.id, name: s.name })
    }

    // 2. class_recaps 추가 (skill ref 연결)
    for (const r of SEED_RECAPS) {
      const date = new Date()
      date.setDate(date.getDate() - r.daysAgo)
      date.setHours(20, 30, 0, 0)
      const skillRefs = r.skillNames
        .map(n => addedSkills.find(s => s.name === n)?.id)
        .filter(Boolean)
      await addDoc(collection(db, 'class_recaps'), {
        scheduleId: '', scheduleTitle: '',
        date: Timestamp.fromDate(date),
        title: r.title, skillRefs,
        coachComment: r.coachComment,
        studentVideoUrls: [],
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    }
    showToast(`✅ 기본기 ${SEED_SKILLS.length}개 + 리캡 ${SEED_RECAPS.length}개 추가 완료!`)
  } catch (err) {
    alert('시드 실패: ' + err.message)
  }
}

// ── V3 시드 데이터 ──────────────────────────────────────────────
const DEFAULT_CORRECTION_PRESETS = [
  { category: '슈팅', problem: '공이 뜸', correction: '공의 정중앙~약간 위를 맞추세요. 상체를 공 위로.', usageCount: 0 },
  { category: '드리블', problem: '발목이 풀림', correction: '발목을 90도로 잠그고 임팩트하세요.', usageCount: 0 },
  { category: '패스', problem: '방향 부정확', correction: '디딤발 끝이 패스 대상을 향하게 놓으세요.', usageCount: 0 },
  { category: '볼터치', problem: '터치가 너무 셈', correction: '공이 발에 닿는 순간 발을 살짝 뒤로 빼주세요.', usageCount: 0 },
  { category: '포지셔닝', problem: '시야 확보 안 됨', correction: '터치 전에 고개를 한 번 들어 주변을 확인하세요.', usageCount: 0 },
]

const SAMPLE_TIMELINE = [
  { order: 1, time: '8:30-8:45', title: '기초', category: '체력', drills: [{ name: '러닝 5바퀴', description: '' }, { name: '스트레칭', description: '' }, { name: '동적 스트레칭', description: '' }, { name: '사다리', description: '' }], videoUrl: '', skillLibraryRef: '' },
  { order: 2, time: '8:45-8:50', title: '리프팅 훈련', category: '볼터치', drills: [{ name: '1단계: 한번 치고 잡기, 양발 반복', description: '' }, { name: '2단계: 오른발로 차고 튕기고 3번 후 잡기', description: '' }, { name: '3단계: 한발로 세번 정확히 차고 잡기', description: '' }], videoUrl: '', skillLibraryRef: '' },
  { order: 3, time: '8:55-9:05', title: '공중 인/발등', category: '볼터치', drills: [{ name: '콘 십자 배치, 왼발-오른발 교차', description: '' }, { name: '앞뒤 이동하며 터치', description: '' }], videoUrl: '', skillLibraryRef: '' },
  { order: 4, time: '9:05-9:15', title: '드리블', category: '드리블', drills: [{ name: '인사이드 제자리 + 발등 앞으로', description: '' }, { name: '인사이드 + 아웃사이드 앞으로', description: '' }], videoUrl: '', skillLibraryRef: '' },
  { order: 5, time: '9:15-9:30', title: '컨트롤 + 패스', category: '패스', drills: [{ name: '컨트롤만 연습', description: '' }, { name: '컨트롤 + 패스 콤비', description: '' }], videoUrl: '', skillLibraryRef: '' },
  { order: 6, time: '9:30-9:40', title: '슈팅', category: '슈팅', drills: [{ name: '기본 슈팅', description: '' }], videoUrl: '', skillLibraryRef: '' },
  { order: 7, time: '9:40-9:50', title: '합산 훈련', category: '팀플레이', drills: [{ name: '드리블 + 컨트롤 + 패스 + 2:1 + 슈팅', description: '' }], videoUrl: '', skillLibraryRef: '' },
]

const seedV3Data = async (schedules, showToast) => {
  try {
    // 1. 실제 participants에서 첫 번째 문서 (BUG-005)
    const participantsSnap = await getDocs(collection(db, 'participants'))
    if (participantsSnap.empty) {
      alert('참가자 데이터가 없습니다. 먼저 리포트를 1개 이상 저장하세요.')
      return
    }
    const participantId = participantsSnap.docs[0].id

    // 2. 가장 최근 일정
    const schedulesSnap = await getDocs(query(collection(db, 'schedules'), orderBy('date', 'desc'), limit(1)))
    if (schedulesSnap.empty) {
      alert('일정 데이터가 없습니다. 먼저 일정을 등록하세요.')
      return
    }
    const scheduleId = schedulesSnap.docs[0].id
    const scheduleData = schedulesSnap.docs[0].data()

    // 3. 타임라인이 포함된 리캡 생성
    await addDoc(collection(db, 'class_recaps'), {
      scheduleId,
      scheduleTitle: scheduleData.title || '',
      date: scheduleData.date || Timestamp.now(),
      title: '첫 수업 기초 훈련 + 실전',
      skillRefs: [],
      coachComment: '첫 수업 수고하셨습니다! 기초 체력과 볼 터치 감각을 잘 따라오셨어요.',
      studentVideoUrls: [],
      timeline: SAMPLE_TIMELINE,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // 4. 교정 피드백 3개
    const sampleCorrections = [
      { participantId, scheduleId, category: '슈팅', timelineOrder: 6, problem: '슈팅 시 공이 자꾸 뜸', correction: '발등의 정중앙으로 공의 가운데를 맞추세요. 상체를 공 위로 숙이면 공이 뜨지 않습니다.', priority: 'high', videoUrl: '', createdAt: serverTimestamp() },
      { participantId, scheduleId, category: '드리블', timelineOrder: 4, problem: '인사이드 터치 시 발목이 풀림', correction: '발목을 90도로 단단히 잠그고 터치하세요. 공이 발에 닿는 순간 발목에 힘을 유지합니다.', priority: 'medium', videoUrl: '', createdAt: serverTimestamp() },
      { participantId, scheduleId, category: '패스', timelineOrder: 5, problem: '패스 방향이 부정확', correction: '디딤발의 방향이 패스 방향을 결정합니다. 디딤발 끝이 패스 대상을 향하게 놓으세요.', priority: 'medium', videoUrl: '', createdAt: serverTimestamp() },
    ]
    for (const c of sampleCorrections) {
      await addDoc(collection(db, 'correction_feedback'), c)
    }

    // 5. 프리셋 생성 (이미 있으면 스킵)
    const presetsSnap = await getDocs(collection(db, 'correction_presets'))
    if (presetsSnap.empty) {
      for (const p of DEFAULT_CORRECTION_PRESETS) {
        await addDoc(collection(db, 'correction_presets'), p)
      }
    }

    showToast('✅ V3 시드 데이터 생성 완료! (리캡 1개 + 교정피드백 3개 + 프리셋)')
  } catch (err) {
    alert('V3 시드 실패: ' + err.message)
  }
}

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

const dateToTitle = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  const month = d.getMonth() + 1
  const day = d.getDate()
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${month}월 ${day}일 ${days[d.getDay()]}요일`
}

export default function AdminReport() {
  const [pw, setPw] = useState('')
  const [authed, setAuthed] = useState(false)
  const [adminTab, setAdminTab] = useState('schedules')

  // ── 일정 관리 ──
  const [schedules, setSchedules] = useState([])
  const [expandedScheduleId, setExpandedScheduleId] = useState(null)
  const [newDate, setNewDate] = useState('')
  const [newCapacity, setNewCapacity] = useState(6)
  const [newTimeSlot, setNewTimeSlot] = useState('20:30 – 22:00')
  const [newLocation, setNewLocation] = useState('광교 PPC')
  const [newNote, setNewNote] = useState('')
  const [addingSchedule, setAddingSchedule] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState(null)
  const [editDate, setEditDate] = useState('')
  const [editTimeSlot, setEditTimeSlot] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editCapacity, setEditCapacity] = useState(6)
  const [editNote, setEditNote] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // ── 리포트 ──
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

  // ── 기본기 라이브러리 ──
  const [skills, setSkills] = useState([])
  const [libFilterCat, setLibFilterCat] = useState('전체')
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillCat, setNewSkillCat] = useState('드리블')
  const [newSkillDifficulty, setNewSkillDifficulty] = useState('beginner')
  const [newSkillVideoUrl, setNewSkillVideoUrl] = useState('')
  const [newSkillKeyPoints, setNewSkillKeyPoints] = useState([''])
  const [newSkillMistakes, setNewSkillMistakes] = useState([''])
  const [newSkillShortDesc, setNewSkillShortDesc] = useState('')
  const [newSkillSteps, setNewSkillSteps] = useState([''])
  const [newSkillOrder, setNewSkillOrder] = useState(0)
  const [addingSkill, setAddingSkill] = useState(false)

  // ── 수업 리캡 ──
  const [recaps, setRecaps] = useState([])
  const [recapScheduleId, setRecapScheduleId] = useState('')
  const [recapTitle, setRecapTitle] = useState('')
  const [recapSkillRefs, setRecapSkillRefs] = useState([])
  const [recapComment, setRecapComment] = useState('')
  const [recapVideoUrl, setRecapVideoUrl] = useState('')
  const [addingRecap, setAddingRecap] = useState(false)

  // ── 타임라인 편집기 ──
  const [recapTimeline, setRecapTimeline] = useState([])

  // ── 교정 피드백 ──
  const [participants, setParticipants] = useState([])
  const [correctionPresets, setCorrectionPresets] = useState([])
  const [cfRecapId, setCfRecapId] = useState('')
  const [cfScheduleId, setCfScheduleId] = useState('')
  const [cfParticipantId, setCfParticipantId] = useState('')
  const [cfTimelineOrder, setCfTimelineOrder] = useState('')
  const [cfCategory, setCfCategory] = useState('')
  const [cfProblem, setCfProblem] = useState('')
  const [cfCorrection, setCfCorrection] = useState('')
  const [cfPriority, setCfPriority] = useState('medium')
  const [cfVideoUrl, setCfVideoUrl] = useState('')
  const [addingCorrection, setAddingCorrection] = useState(false)
  const [savedCorrections, setSavedCorrections] = useState([])

  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!authed) return
    const unsub1 = onSnapshot(query(collection(db, 'schedules'), orderBy('date', 'asc')), snap => {
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const unsub2 = onSnapshot(collection(db, 'applications'), snap => {
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const unsub3 = onSnapshot(query(collection(db, 'skill_library'), orderBy('category')), snap => {
      setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const unsub4 = onSnapshot(query(collection(db, 'class_recaps'), orderBy('date', 'desc')), snap => {
      setRecaps(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const unsub5 = onSnapshot(collection(db, 'participants'), snap => {
      setParticipants(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const unsub6 = onSnapshot(collection(db, 'correction_presets'), snap => {
      setCorrectionPresets(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)))
    })
    const unsub7 = onSnapshot(collection(db, 'correction_feedback'), snap => {
      setSavedCorrections(snap.docs.map(d => {
        const data = d.data()
        return { id: d.id, ...data, createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date() }
      }))
    })
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7() }
  }, [authed])

  const handleAuth = (e) => {
    e.preventDefault()
    if (pw === ADMIN_PASSWORD) setAuthed(true)
    else alert('비밀번호가 틀렸습니다.')
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── 일정 핸들러 ──
  const handleAddSchedule = async () => {
    if (!newDate) return alert('날짜를 선택해주세요.')
    setAddingSchedule(true)
    try {
      const d = new Date(newDate + 'T00:00:00+09:00')
      await addDoc(collection(db, 'schedules'), {
        title: dateToTitle(newDate),
        date: Timestamp.fromDate(d),
        timeSlot: newTimeSlot.trim() || '20:30 – 22:00',
        location: newLocation.trim() || '광교 PPC',
        capacity: Number(newCapacity),
        enrolledCount: 0,
        isOpen: true,
        note: newNote.trim(),
        createdAt: serverTimestamp(),
      })
      setNewDate(''); setNewNote(''); setNewCapacity(6)
      showToast('✅ 일정이 추가됐어요!')
    } catch (err) { alert('추가 실패: ' + err.message) }
    finally { setAddingSchedule(false) }
  }

  const handleToggleOpen = async (s) => {
    await updateDoc(doc(db, 'schedules', s.id), { isOpen: !s.isOpen })
  }

  const tsToDateStr = (ts) => {
    if (!ts) return ''
    const d = new Date(ts.seconds * 1000)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  const handleStartEdit = (s) => {
    setEditingScheduleId(s.id)
    setEditDate(tsToDateStr(s.date))
    setEditTimeSlot(s.timeSlot || '20:30 – 22:00')
    setEditLocation(s.location || '광교 PPC')
    setEditCapacity(s.capacity || 6)
    setEditNote(s.note || '')
  }

  const handleSaveEdit = async (scheduleId) => {
    if (!editDate) return alert('날짜를 입력해주세요.')
    setSavingEdit(true)
    try {
      const d = new Date(editDate + 'T00:00:00+09:00')
      await updateDoc(doc(db, 'schedules', scheduleId), {
        title: dateToTitle(editDate),
        date: Timestamp.fromDate(d),
        timeSlot: editTimeSlot.trim() || '20:30 – 22:00',
        location: editLocation.trim() || '광교 PPC',
        capacity: Number(editCapacity),
        note: editNote.trim(),
      })
      setEditingScheduleId(null)
      showToast('✅ 일정이 수정됐어요!')
    } catch (err) { alert('수정 실패: ' + err.message) }
    finally { setSavingEdit(false) }
  }

  const handleSyncCount = async (scheduleId) => {
    const actual = applications.filter(a => a.scheduleId === scheduleId).length
    await updateDoc(doc(db, 'schedules', scheduleId), { enrolledCount: actual })
    showToast(`✅ 카운트 재계산 완료 (${actual}명)`)
  }

  const handleDeleteApplication = async (app, scheduleId) => {
    if (!window.confirm(`"${app.name}" 신청을 취소할까요?`)) return
    await deleteDoc(doc(db, 'applications', app.id))
    await updateDoc(doc(db, 'schedules', scheduleId), { enrolledCount: increment(-1) })
    showToast('✅ 신청이 취소됐어요.')
  }

  const handleDeleteSchedule = async (s) => {
    if ((s.enrolledCount || 0) > 0) { alert(`신청자가 ${s.enrolledCount}명 있어요.`); return }
    if (!window.confirm(`"${s.title}" 일정을 삭제할까요?`)) return
    await deleteDoc(doc(db, 'schedules', s.id))
    showToast('삭제됐어요.')
  }

  // ── 리포트 핸들러 ──
  const handleSave = async () => {
    if (!selectedAppId) return alert('참가자를 선택해주세요.')
    const selectedApp = applications.find(a => a.id === selectedAppId)
    if (!selectedApp) return
    setSaving(true)
    try {
      const phone = (selectedApp.phone || '').replace(/[^0-9]/g, '')
      const phoneLast4 = phone.slice(-4)
      const q = query(collection(db, 'participants'), where('phone', '==', phone))
      const snap = await getDocs(q)
      let participantId
      if (snap.empty) {
        const newDoc = await addDoc(collection(db, 'participants'), { name: selectedApp.name, phone, phoneLast4, createdAt: serverTimestamp() })
        participantId = newDoc.id
      } else { participantId = snap.docs[0].id }
      const trainingBreakdown = trainingItems.reduce((acc, item) => { if (item.name.trim()) acc[item.name.trim()] = Number(item.minutes); return acc }, {})
      const fitnessRecords = fitnessItems.reduce((acc, item) => { if (item.name.trim()) acc[item.name.trim()] = Number(item.value); return acc }, {})
      await addDoc(collection(db, 'reports'), { participantId, classDate, sessionNumber: Number(sessionNumber), trainingBreakdown, skillRatings, fitnessRecords, coachComment, youtubeUrl, createdAt: serverTimestamp() })
      showToast('저장 완료! 🎉')
      setSelectedAppId(''); setSessionNumber(1); setTrainingItems(getDefaultTraining()); setSkillRatings(SKILL_KEYS.reduce((acc, k) => ({ ...acc, [k]: 3 }), {})); setFitnessItems(getDefaultFitness()); setCoachComment(''); setYoutubeUrl('')
    } catch (err) { alert('저장 실패: ' + err.message) }
    finally { setSaving(false) }
  }

  const addTrainingItem = () => setTrainingItems(prev => [...prev, { name: '', minutes: 0 }])
  const removeTrainingItem = (i) => setTrainingItems(prev => prev.filter((_, idx) => idx !== i))
  const updateTrainingItem = (i, f, v) => setTrainingItems(prev => prev.map((item, idx) => idx === i ? { ...item, [f]: v } : item))
  const addFitnessItem = () => setFitnessItems(prev => [...prev, { name: '', value: 0 }])
  const removeFitnessItem = (i) => setFitnessItems(prev => prev.filter((_, idx) => idx !== i))
  const updateFitnessItem = (i, f, v) => setFitnessItems(prev => prev.map((item, idx) => idx === i ? { ...item, [f]: v } : item))

  // ── 라이브러리 핸들러 ──
  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return alert('기본기 이름을 입력해주세요.')
    setAddingSkill(true)
    try {
      await addDoc(collection(db, 'skill_library'), {
        name: newSkillName.trim(),
        category: newSkillCat,
        difficulty: newSkillDifficulty,
        videoUrl: newSkillVideoUrl.trim(),
        keyPoints: newSkillKeyPoints.filter(p => p.trim()),
        commonMistakes: newSkillMistakes.filter(m => m.trim()),
        shortDescription: newSkillShortDesc.trim(),
        steps: newSkillSteps.filter(s => s.trim()),
        order: Number(newSkillOrder) || skills.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setNewSkillName(''); setNewSkillVideoUrl(''); setNewSkillKeyPoints(['']); setNewSkillMistakes([''])
      setNewSkillShortDesc(''); setNewSkillSteps(['']); setNewSkillOrder(0)
      showToast('✅ 기본기가 추가됐어요!')
    } catch (err) { alert('추가 실패: ' + err.message) }
    finally { setAddingSkill(false) }
  }

  const handleDeleteSkill = async (id) => {
    if (!window.confirm('삭제할까요?')) return
    await deleteDoc(doc(db, 'skill_library', id))
    showToast('삭제됐어요.')
  }

  const updateArrayItem = (arr, setArr, i, v) => setArr(arr.map((item, idx) => idx === i ? v : item))
  const addArrayItem = (arr, setArr) => setArr([...arr, ''])
  const removeArrayItem = (arr, setArr, i) => setArr(arr.filter((_, idx) => idx !== i))

  // ── 리캡 핸들러 ──
  const handleAddRecap = async () => {
    if (!recapScheduleId) return alert('수업 일정을 선택해주세요.')
    if (!recapTitle.trim()) return alert('리캡 제목을 입력해주세요.')
    setAddingRecap(true)
    try {
      const selSched = schedules.find(s => s.id === recapScheduleId)
      await addDoc(collection(db, 'class_recaps'), {
        scheduleId: recapScheduleId,
        scheduleTitle: selSched?.title || '',
        date: selSched?.date || Timestamp.now(),
        title: recapTitle.trim(),
        skillRefs: recapSkillRefs,
        coachComment: recapComment.trim(),
        studentVideoUrls: recapVideoUrl.trim() ? [recapVideoUrl.trim()] : [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setRecapScheduleId(''); setRecapTitle(''); setRecapSkillRefs([]); setRecapComment(''); setRecapVideoUrl('')
      showToast('✅ 리캡이 추가됐어요!')
    } catch (err) { alert('추가 실패: ' + err.message) }
    finally { setAddingRecap(false) }
  }

  const handleDeleteRecap = async (id) => {
    if (!window.confirm('리캡을 삭제할까요?')) return
    await deleteDoc(doc(db, 'class_recaps', id))
    showToast('삭제됐어요.')
  }

  const toggleSkillRef = (id) => {
    setRecapSkillRefs(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  // ── 타임라인 편집 헬퍼 (BUG-010: 불변성 유지) ──
  const addTimelineSegment = () => {
    setRecapTimeline(prev => [...prev, {
      order: prev.length + 1,
      time: '',
      title: '',
      category: '체력',
      drills: [{ name: '', description: '' }],
      videoUrl: '',
      skillLibraryRef: '',
    }])
  }

  const updateTimelineSegment = (index, field, value) => {
    setRecapTimeline(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const removeTimelineSegment = (index) => {
    setRecapTimeline(prev => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i + 1 })))
  }

  const addDrill = (timelineIndex) => {
    setRecapTimeline(prev => prev.map((item, i) =>
      i === timelineIndex
        ? { ...item, drills: [...item.drills, { name: '', description: '' }] }
        : item
    ))
  }

  const updateDrillName = (timelineIndex, drillIndex, newName) => {
    setRecapTimeline(prev => prev.map((item, i) =>
      i === timelineIndex
        ? { ...item, drills: item.drills.map((drill, j) => j === drillIndex ? { ...drill, name: newName } : drill) }
        : item
    ))
  }

  const removeDrill = (timelineIndex, drillIndex) => {
    setRecapTimeline(prev => prev.map((item, i) =>
      i === timelineIndex
        ? { ...item, drills: item.drills.filter((_, j) => j !== drillIndex) }
        : item
    ))
  }

  // "이전 수업 타임라인 복사" (BUG-013: 깊은 복사)
  const copyPreviousTimeline = () => {
    const recapWithTimeline = recaps.find(r => r.timeline && r.timeline.length > 0)
    if (!recapWithTimeline) {
      alert('이전 수업 타임라인이 없습니다.')
      return
    }
    const copied = JSON.parse(JSON.stringify(recapWithTimeline.timeline))
    setRecapTimeline(copied)
    showToast('✅ 이전 타임라인을 복사했어요. 수정 후 저장하세요.')
  }

  // 리캡 저장 확장 (타임라인 포함)
  const handleAddRecapWithTimeline = async () => {
    if (!recapScheduleId) return alert('수업 일정을 선택해주세요.')
    if (!recapTitle.trim()) return alert('리캡 제목을 입력해주세요.')
    setAddingRecap(true)
    try {
      const selSched = schedules.find(s => s.id === recapScheduleId)
      // 빈 타임라인 필터링
      const cleanTimeline = recapTimeline
        .filter(seg => seg.title.trim())
        .map((seg, i) => ({
          ...seg,
          order: i + 1,
          drills: seg.drills.filter(d => d.name.trim()),
        }))

      await addDoc(collection(db, 'class_recaps'), {
        scheduleId: recapScheduleId,
        scheduleTitle: selSched?.title || '',
        date: selSched?.date || Timestamp.now(),
        title: recapTitle.trim(),
        skillRefs: recapSkillRefs,
        coachComment: recapComment.trim(),
        studentVideoUrls: recapVideoUrl.trim() ? [recapVideoUrl.trim()] : [],
        timeline: cleanTimeline,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setRecapScheduleId(''); setRecapTitle(''); setRecapSkillRefs([])
      setRecapComment(''); setRecapVideoUrl(''); setRecapTimeline([])
      showToast('✅ 리캡이 추가됐어요!')
    } catch (err) { alert('추가 실패: ' + err.message) }
    finally { setAddingRecap(false) }
  }

  // ── 교정 피드백 핸들러 ──
  const applyPreset = (preset) => {
    setCfCategory(preset.category)
    setCfProblem(preset.problem)
    setCfCorrection(preset.correction)
  }

  const handleAddCorrection = async () => {
    if (!cfParticipantId) return alert('수강생을 선택해주세요.')
    if (!cfScheduleId) return alert('수업 일정을 선택해주세요.')
    if (!cfProblem.trim() || !cfCorrection.trim()) return alert('문제 행동과 교정 피드백을 입력해주세요.')
    setAddingCorrection(true)
    try {
      await addDoc(collection(db, 'correction_feedback'), {
        participantId: cfParticipantId,
        scheduleId: cfScheduleId,
        recapId: cfRecapId || '',
        timelineOrder: cfTimelineOrder ? Number(cfTimelineOrder) : null,
        category: cfCategory || '',
        problem: cfProblem.trim(),
        correction: cfCorrection.trim(),
        priority: cfPriority,
        videoUrl: cfVideoUrl.trim(),
        createdAt: serverTimestamp(),
      })
      setCfProblem(''); setCfCorrection(''); setCfVideoUrl(''); setCfTimelineOrder('')
      showToast('✅ 교정 피드백이 저장됐어요!')
    } catch (err) { alert('저장 실패: ' + err.message) }
    finally { setAddingCorrection(false) }
  }

  const handleDeleteCorrection = async (id) => {
    if (!window.confirm('교정 피드백을 삭제할까요?')) return
    await deleteDoc(doc(db, 'correction_feedback', id))
    showToast('삭제됐어요.')
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
              <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="비밀번호 입력" required />
            </div>
            <button type="submit" className="btn-apply" style={{ marginTop: 14 }}>로그인</button>
          </form>
        </div>
      </div>
    )
  }

  const libFiltered = libFilterCat === '전체' ? skills : skills.filter(s => s.category === libFilterCat)

  return (
    <div className="page-wrap">
      <div className="page-nav">
        <Link to="/" className="back-btn">← 홈으로</Link>
        <span className="admin-badge">관리자</span>
      </div>

      {toast && <div className="toast">{toast}</div>}

      <div className="admin-tab-bar">
        {[['schedules', '📅 일정'], ['report', '📊 리포트'], ['library', '📚 라이브러리'], ['recap', '🎬 리캡'], ['correction', '✏️ 교정']].map(([v, l]) => (
          <button key={v} className={`admin-tab-btn${adminTab === v ? ' active' : ''}`} onClick={() => setAdminTab(v)}>{l}</button>
        ))}
      </div>

      <div className="admin-wrap">

        {/* ── 일정 관리 ── */}
        {adminTab === 'schedules' && (
          <>
            <p className="sec-eyebrow">Admin</p>
            <h2 className="admin-title">일정 관리</h2>

            <div className="admin-section">
              <h3 className="admin-section-title">새 일정 추가</h3>
              <div className="admin-row">
                <div className="fg" style={{ flex: 2 }}>
                  <label>날짜</label>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                  {newDate && <p className="admin-hint">{dateToTitle(newDate)}</p>}
                </div>
                <div className="fg" style={{ flex: 1 }}>
                  <label>정원</label>
                  <input type="number" min="1" max="20" value={newCapacity} onChange={e => setNewCapacity(e.target.value)} />
                </div>
              </div>
              <div className="admin-row">
                <div className="fg" style={{ flex: 1 }}>
                  <label>시간</label>
                  <input type="text" value={newTimeSlot} onChange={e => setNewTimeSlot(e.target.value)} placeholder="20:30 – 22:00" />
                </div>
                <div className="fg" style={{ flex: 1 }}>
                  <label>장소</label>
                  <input type="text" value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="광교 PPC" />
                </div>
              </div>
              <div className="fg">
                <label>메모 (선택)</label>
                <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="예: 우천 시 취소될 수 있음" />
              </div>
              <button className="btn-apply" onClick={handleAddSchedule} disabled={addingSchedule || !newDate} style={{ marginTop: 4 }}>
                {addingSchedule ? '추가 중...' : '+ 일정 추가하기'}
              </button>
            </div>

            <div className="admin-section admin-section-dark">
              <h3 className="admin-section-title">등록된 일정 ({schedules.length}개)</h3>
              {schedules.length === 0 ? <p className="admin-hint">아직 등록된 일정이 없습니다.</p> : (
                <div className="admin-sched-list">
                  {schedules.map(s => {
                    const spots = s.capacity - (s.enrolledCount || 0)
                    const isPast = s.date && new Date(s.date.seconds * 1000) < new Date()
                    return (
                      <div key={s.id} className={`admin-sched-item${isPast ? ' past' : ''}`}>
                        {editingScheduleId === s.id ? (
                          <div className="admin-edit-form">
                            <div className="admin-row">
                              <div className="fg" style={{ flex: 2 }}>
                                <label>날짜</label>
                                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
                                {editDate && <p className="admin-hint">{dateToTitle(editDate)}</p>}
                              </div>
                              <div className="fg" style={{ flex: 1 }}>
                                <label>정원</label>
                                <input type="number" min="1" max="20" value={editCapacity} onChange={e => setEditCapacity(e.target.value)} />
                              </div>
                            </div>
                            <div className="admin-row">
                              <div className="fg" style={{ flex: 1 }}>
                                <label>시간</label>
                                <input type="text" value={editTimeSlot} onChange={e => setEditTimeSlot(e.target.value)} />
                              </div>
                              <div className="fg" style={{ flex: 1 }}>
                                <label>장소</label>
                                <input type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} />
                              </div>
                            </div>
                            <div className="fg">
                              <label>메모 (선택)</label>
                              <input type="text" value={editNote} onChange={e => setEditNote(e.target.value)} />
                            </div>
                            <div className="admin-edit-actions">
                              <button className="admin-edit-save-btn" onClick={() => handleSaveEdit(s.id)} disabled={savingEdit}>{savingEdit ? '저장 중...' : '저장'}</button>
                              <button className="admin-edit-cancel-btn" onClick={() => setEditingScheduleId(null)}>취소</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="admin-sched-info">
                              <div className="admin-sched-title">{s.title}</div>
                              <div className="admin-sched-meta">{s.timeSlot} · {s.location}{s.note && <em> · {s.note}</em>}</div>
                              <div className="admin-sched-count">신청 {s.enrolledCount || 0}/{s.capacity}명{!isPast && spots > 0 && <span className="admin-sched-spots"> · 남은 {spots}</span>}</div>
                            </div>
                            <div className="admin-sched-actions">
                              <button className="admin-edit-btn" onClick={() => handleStartEdit(s)}>수정</button>
                              <button className={`admin-toggle-btn${s.isOpen ? ' open' : ' closed'}`} onClick={() => handleToggleOpen(s)}>{s.isOpen ? '접수중' : '마감'}</button>
                              <button className="admin-del-btn" onClick={() => handleDeleteSchedule(s)}>×</button>
                            </div>
                          </>
                        )}
                        <div className="admin-app-section">
                          <div className="admin-app-section-header">
                            <button className="admin-app-toggle-btn" onClick={() => setExpandedScheduleId(expandedScheduleId === s.id ? null : s.id)}>
                              신청자 {s.enrolledCount || 0}명 {expandedScheduleId === s.id ? '▲' : '▼'}
                            </button>
                            {s.enrolledCount !== applications.filter(a => a.scheduleId === s.id).length && (
                              <button className="admin-sync-btn" onClick={() => handleSyncCount(s.id)}>
                                ⚠️ 실제 {applications.filter(a => a.scheduleId === s.id).length}명 · 동기화
                              </button>
                            )}
                          </div>
                          {expandedScheduleId === s.id && (
                            <div className="admin-app-list">
                              {applications.filter(a => a.scheduleId === s.id).length === 0
                                ? <p className="admin-hint" style={{ margin: '8px 0 0' }}>신청자가 없습니다.</p>
                                : applications.filter(a => a.scheduleId === s.id).map(app => (
                                  <div key={app.id} className="admin-app-item">
                                    <span className="admin-app-name">{app.name}</span>
                                    <span className="admin-app-phone">{app.phone}</span>
                                    <button className="admin-app-del-btn" onClick={() => handleDeleteApplication(app, s.id)}>×</button>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── 리포트 입력 ── */}
        {adminTab === 'report' && (
          <>
            <p className="sec-eyebrow">Admin</p>
            <h2 className="admin-title">리포트 입력</h2>

            <div className="admin-section">
              <h3 className="admin-section-title">1. 참가자 선택</h3>
              <div className="fg">
                <label>참가자</label>
                <select value={selectedAppId} onChange={e => setSelectedAppId(e.target.value)}>
                  <option value="">참가자를 선택하세요</option>
                  {applications.map(app => {
                    const phone = (app.phone || '').replace(/[^0-9]/g, '')
                    return <option key={app.id} value={app.id}>{app.name} ({phone.slice(-4)}){app.scheduleName ? ` — ${app.scheduleName}` : ''}</option>
                  })}
                </select>
              </div>
            </div>

            <div className="admin-section">
              <h3 className="admin-section-title">2. 클래스 정보</h3>
              <div className="admin-row">
                <div className="fg" style={{ flex: 1 }}><label>날짜</label><input type="date" value={classDate} onChange={e => setClassDate(e.target.value)} /></div>
                <div className="fg" style={{ flex: 1 }}><label>회차</label><input type="number" min="1" value={sessionNumber} onChange={e => setSessionNumber(e.target.value)} /></div>
              </div>
            </div>

            <div className="admin-section">
              <h3 className="admin-section-title">3. 훈련 구성 (분)</h3>
              {trainingItems.map((item, i) => (
                <div key={i} className="dynamic-row">
                  <input type="text" value={item.name} onChange={e => updateTrainingItem(i, 'name', e.target.value)} placeholder="훈련 항목" className="dynamic-input" />
                  <input type="number" value={item.minutes} onChange={e => updateTrainingItem(i, 'minutes', e.target.value)} placeholder="분" className="dynamic-num" />
                  <button type="button" onClick={() => removeTrainingItem(i)} className="remove-btn">×</button>
                </div>
              ))}
              <button type="button" onClick={addTrainingItem} className="add-btn">+ 항목 추가</button>
            </div>

            <div className="admin-section">
              <h3 className="admin-section-title">4. 스킬 평가 (1~5점)</h3>
              {SKILL_KEYS.map(key => (
                <div key={key} className="skill-row">
                  <label className="skill-label">{key}</label>
                  <div className="skill-slider-wrap">
                    <input type="range" min="1" max="5" value={skillRatings[key]}
                      onChange={e => setSkillRatings(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="skill-slider" />
                    <span className="skill-score">{skillRatings[key]}점</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-section">
              <h3 className="admin-section-title">5. 체력 기록</h3>
              {fitnessItems.map((item, i) => (
                <div key={i} className="dynamic-row">
                  <input type="text" value={item.name} onChange={e => updateFitnessItem(i, 'name', e.target.value)} placeholder="측정 항목" className="dynamic-input" />
                  <input type="number" step="0.1" value={item.value} onChange={e => updateFitnessItem(i, 'value', e.target.value)} placeholder="수치" className="dynamic-num" />
                  <button type="button" onClick={() => removeFitnessItem(i)} className="remove-btn">×</button>
                </div>
              ))}
              <button type="button" onClick={addFitnessItem} className="add-btn">+ 항목 추가</button>
            </div>

            <div className="admin-section">
              <h3 className="admin-section-title">6. 강사 코멘트</h3>
              <div className="fg"><textarea rows={4} value={coachComment} onChange={e => setCoachComment(e.target.value)} placeholder="참가자에 대한 피드백을 입력해주세요" /></div>
            </div>

            <div className="admin-section">
              <h3 className="admin-section-title">7. YouTube URL (선택)</h3>
              <div className="fg"><input type="text" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://youtu.be/..." /></div>
            </div>

            <button className="btn-apply" onClick={handleSave} disabled={saving} style={{ marginTop: 8 }}>
              {saving ? '저장 중...' : '💾 리포트 저장하기'}
            </button>
          </>
        )}

        {/* ── 기본기 라이브러리 ── */}
        {adminTab === 'library' && (
          <>
            <p className="sec-eyebrow">Admin</p>
            <h2 className="admin-title">기본기 라이브러리</h2>

            <div className="admin-section">
              <h3 className="admin-section-title">새 기본기 추가</h3>
              <div className="admin-row">
                <div className="fg" style={{ flex: 2 }}>
                  <label>기본기 이름</label>
                  <input type="text" value={newSkillName} onChange={e => setNewSkillName(e.target.value)} placeholder="예: 인사이드 터치" />
                </div>
                <div className="fg" style={{ flex: 1 }}>
                  <label>난이도</label>
                  <select value={newSkillDifficulty} onChange={e => setNewSkillDifficulty(e.target.value)}>
                    {DIFFICULTY_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              </div>
              <div className="admin-row">
                <div className="fg" style={{ flex: 1 }}>
                  <label>카테고리</label>
                  <select value={newSkillCat} onChange={e => setNewSkillCat(e.target.value)}>
                    {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fg" style={{ flex: 2 }}>
                  <label>YouTube URL (선택)</label>
                  <input type="text" value={newSkillVideoUrl} onChange={e => setNewSkillVideoUrl(e.target.value)} placeholder="https://youtu.be/..." />
                </div>
              </div>

              <div className="fg">
                <label>핵심 포인트</label>
                {newSkillKeyPoints.map((pt, i) => (
                  <div key={i} className="dynamic-row" style={{ marginBottom: 6 }}>
                    <input type="text" value={pt} onChange={e => updateArrayItem(newSkillKeyPoints, setNewSkillKeyPoints, i, e.target.value)} placeholder={`포인트 ${i + 1}`} className="dynamic-input" />
                    {newSkillKeyPoints.length > 1 && <button type="button" onClick={() => removeArrayItem(newSkillKeyPoints, setNewSkillKeyPoints, i)} className="remove-btn">×</button>}
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem(newSkillKeyPoints, setNewSkillKeyPoints)} className="add-btn">+ 포인트 추가</button>
              </div>

              <div className="fg" style={{ marginTop: 12 }}>
                <label>흔한 실수 (선택)</label>
                {newSkillMistakes.map((m, i) => (
                  <div key={i} className="dynamic-row" style={{ marginBottom: 6 }}>
                    <input type="text" value={m} onChange={e => updateArrayItem(newSkillMistakes, setNewSkillMistakes, i, e.target.value)} placeholder={`실수 ${i + 1}`} className="dynamic-input" />
                    {newSkillMistakes.length > 1 && <button type="button" onClick={() => removeArrayItem(newSkillMistakes, setNewSkillMistakes, i)} className="remove-btn">×</button>}
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem(newSkillMistakes, setNewSkillMistakes)} className="add-btn">+ 실수 추가</button>
              </div>

              <div className="fg" style={{ marginTop: 12 }}>
                <label>한줄 설명 (선택, 40자 이내)</label>
                <input type="text" value={newSkillShortDesc} onChange={e => setNewSkillShortDesc(e.target.value)} placeholder="예: 발 안쪽 면으로 공을 부드럽게 터치하는 기본기" maxLength={40} />
              </div>

              <div className="fg" style={{ marginTop: 12 }}>
                <label>단계별 연습 (선택)</label>
                {newSkillSteps.map((step, i) => (
                  <div key={i} className="dynamic-row" style={{ marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-4)', fontSize: '0.75rem', minWidth: 20 }}>{i + 1}.</span>
                    <input type="text" value={step} onChange={e => updateArrayItem(newSkillSteps, setNewSkillSteps, i, e.target.value)} placeholder={`단계 ${i + 1}`} className="dynamic-input" />
                    {newSkillSteps.length > 1 && <button type="button" onClick={() => removeArrayItem(newSkillSteps, setNewSkillSteps, i)} className="remove-btn">×</button>}
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem(newSkillSteps, setNewSkillSteps)} className="add-btn">+ 단계 추가</button>
              </div>

              <div className="fg" style={{ marginTop: 12 }}>
                <label>정렬 순서</label>
                <input type="number" min="0" value={newSkillOrder} onChange={e => setNewSkillOrder(e.target.value)} placeholder="0" style={{ width: 80 }} />
              </div>

              <button className="btn-apply" onClick={handleAddSkill} disabled={addingSkill || !newSkillName.trim()} style={{ marginTop: 12 }}>
                {addingSkill ? '추가 중...' : '+ 기본기 추가하기'}
              </button>
            </div>

            <div className="admin-section admin-section-dark">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 className="admin-section-title" style={{ margin: 0 }}>등록된 기본기 ({skills.length}개)</h3>
                <button
                  onClick={() => seedDemoData(skills, showToast)}
                  style={{ fontSize: '0.7rem', fontWeight: 700, padding: '5px 12px', borderRadius: 10, border: '1px dashed var(--orange)', background: 'rgba(255,92,0,0.08)', color: 'var(--orange)', cursor: 'pointer' }}
                >
                  🌱 샘플 데이터 채우기
                </button>
              </div>
              {/* 카테고리 필터 */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {['전체', ...SKILL_CATEGORIES].map(cat => (
                  <button key={cat} onClick={() => setLibFilterCat(cat)} style={{
                    padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                    background: libFilterCat === cat ? 'var(--orange)' : 'var(--surface-3)', color: libFilterCat === cat ? '#fff' : 'var(--text-2)', transition: 'all 0.2s'
                  }}>{cat}</button>
                ))}
              </div>
              {libFiltered.length === 0
                ? <p className="admin-hint">등록된 기본기가 없습니다.</p>
                : libFiltered.map(skill => (
                  <div key={skill.id} style={{ background: 'var(--surface-1)', borderRadius: 12, padding: '12px 14px', marginBottom: 10, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-1)' }}>{skill.name}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--orange)', fontWeight: 700, background: 'rgba(255,92,0,0.12)', padding: '1px 8px', borderRadius: 10 }}>{skill.category}</span>
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-4)', fontWeight: 600 }}>{{beginner:'초급', intermediate:'중급', advanced:'고급'}[skill.difficulty]}</span>
                        </div>
                        {(skill.keyPoints || []).length > 0 && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                            {(skill.keyPoints || []).map((pt, i) => <div key={i}>▸ {pt}</div>)}
                          </div>
                        )}
                        {skill.videoUrl && <div style={{ fontSize: '0.65rem', color: 'var(--orange)', marginTop: 4 }}>🎬 영상 있음</div>}
                      </div>
                      <button onClick={() => handleDeleteSkill(skill.id)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 8, color: '#ef4444', cursor: 'pointer', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}>삭제</button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* ── 수업 리캡 ── */}
        {adminTab === 'recap' && (
          <>
            <p className="sec-eyebrow">Admin</p>
            <h2 className="admin-title">수업 리캡</h2>

            <div className="admin-section">
              <h3 className="admin-section-title">새 리캡 생성</h3>

              <div className="fg">
                <label>수업 일정 선택</label>
                <select value={recapScheduleId} onChange={e => setRecapScheduleId(e.target.value)}>
                  <option value="">일정을 선택하세요</option>
                  {schedules.map(s => <option key={s.id} value={s.id}>{s.title} ({s.timeSlot})</option>)}
                </select>
              </div>

              <div className="fg">
                <label>리캡 제목</label>
                <input type="text" value={recapTitle} onChange={e => setRecapTitle(e.target.value)} placeholder="예: 약한 발 인사이드 집중 훈련" />
              </div>

              <div className="fg">
                <label>오늘 배운 기본기 선택</label>
                {skills.length === 0
                  ? <p className="admin-hint">라이브러리 탭에서 기본기를 먼저 추가해주세요.</p>
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      {skills.map(skill => (
                        <label key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 12px', borderRadius: 10, background: recapSkillRefs.includes(skill.id) ? 'rgba(255,92,0,0.1)' : 'var(--surface-1)', border: `1px solid ${recapSkillRefs.includes(skill.id) ? 'var(--orange)' : 'var(--border)'}`, transition: 'all 0.2s' }}>
                          <input type="checkbox" checked={recapSkillRefs.includes(skill.id)} onChange={() => toggleSkillRef(skill.id)} style={{ accentColor: 'var(--orange)', width: 16, height: 16 }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-1)' }}>{skill.name}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>{skill.category}</span>
                        </label>
                      ))}
                    </div>
                  )}
              </div>

              <div className="fg">
                <label>코치 코멘트</label>
                <textarea rows={3} value={recapComment} onChange={e => setRecapComment(e.target.value)} placeholder="오늘 수업 총평 또는 다음 과제를 입력해주세요" />
              </div>

              <div className="fg">
                <label>수강생 영상 URL (선택)</label>
                <input type="text" value={recapVideoUrl} onChange={e => setRecapVideoUrl(e.target.value)} placeholder="https://youtu.be/..." />
              </div>

              {/* 타임라인 편집기 */}
              <div className="fg" style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label>수업 타임라인</label>
                  <button type="button" onClick={copyPreviousTimeline} style={{
                    fontSize: '0.68rem', fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                    border: '1px dashed var(--orange)', background: 'rgba(255,92,0,0.06)',
                    color: 'var(--orange)', cursor: 'pointer',
                  }}>📋 이전 수업 복사</button>
                </div>

                {recapTimeline.map((seg, si) => (
                  <div key={si} style={{
                    background: 'var(--surface-1)', borderRadius: 10, padding: 12, marginBottom: 8,
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <input type="text" value={seg.time} onChange={e => updateTimelineSegment(si, 'time', e.target.value)}
                        placeholder="8:30-8:45" style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-3)', color: 'var(--text-1)', fontSize: '0.8rem' }} />
                      <input type="text" value={seg.title} onChange={e => updateTimelineSegment(si, 'title', e.target.value)}
                        placeholder="구간 제목" style={{ flex: 2, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-3)', color: 'var(--text-1)', fontSize: '0.8rem' }} />
                      <select value={seg.category} onChange={e => updateTimelineSegment(si, 'category', e.target.value)}
                        style={{ flex: 1, padding: '6px 4px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-3)', color: 'var(--text-1)', fontSize: '0.75rem' }}>
                        {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button type="button" onClick={() => removeTimelineSegment(si)} style={{
                        background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 6,
                        color: '#ef4444', cursor: 'pointer', padding: '4px 8px', fontSize: '0.8rem', fontWeight: 700,
                      }}>×</button>
                    </div>

                    {/* 드릴 */}
                    <div style={{ marginLeft: 8 }}>
                      {seg.drills.map((drill, di) => (
                        <div key={di} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-4)', fontSize: '0.75rem', marginTop: 6 }}>▸</span>
                          <input type="text" value={drill.name} onChange={e => updateDrillName(si, di, e.target.value)}
                            placeholder="드릴 이름" style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-3)', color: 'var(--text-1)', fontSize: '0.78rem' }} />
                          {seg.drills.length > 1 && (
                            <button type="button" onClick={() => removeDrill(si, di)} style={{
                              background: 'none', border: 'none', color: 'var(--text-4)', cursor: 'pointer', fontSize: '0.75rem',
                            }}>×</button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addDrill(si)} style={{
                        fontSize: '0.7rem', color: 'var(--text-3)', background: 'none', border: 'none',
                        cursor: 'pointer', padding: '2px 0', fontWeight: 600,
                      }}>+ 드릴 추가</button>
                    </div>

                    {/* 영상 URL */}
                    <input type="text" value={seg.videoUrl} onChange={e => updateTimelineSegment(si, 'videoUrl', e.target.value)}
                      placeholder="YouTube URL (선택)" style={{
                        width: '100%', marginTop: 4, padding: '4px 8px', borderRadius: 6,
                        border: '1px solid var(--border)', background: 'var(--surface-3)',
                        color: 'var(--text-1)', fontSize: '0.75rem', boxSizing: 'border-box',
                      }} />
                  </div>
                ))}

                <button type="button" onClick={addTimelineSegment} className="add-btn" style={{ marginTop: 4 }}>
                  + 타임라인 구간 추가
                </button>
              </div>

              <button className="btn-apply" onClick={handleAddRecapWithTimeline} disabled={addingRecap || !recapScheduleId || !recapTitle.trim()} style={{ marginTop: 8 }}>
                {addingRecap ? '저장 중...' : '🎬 리캡 저장하기'}
              </button>
            </div>

            <div className="admin-section admin-section-dark">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 className="admin-section-title" style={{ margin: 0 }}>저장된 리캡 ({recaps.length}개)</h3>
                <button onClick={() => seedV3Data(schedules, showToast)} style={{
                  fontSize: '0.68rem', fontWeight: 700, padding: '5px 10px', borderRadius: 10,
                  border: '1px dashed var(--orange)', background: 'rgba(255,92,0,0.08)',
                  color: 'var(--orange)', cursor: 'pointer',
                }}>🌱 V3 시드 데이터</button>
              </div>
              {recaps.length === 0
                ? <p className="admin-hint">아직 저장된 리캡이 없습니다.</p>
                : recaps.map(recap => (
                  <div key={recap.id} style={{ background: 'var(--surface-1)', borderRadius: 12, padding: '14px', marginBottom: 10, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginBottom: 4 }}>{recap.scheduleTitle}</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: 6 }}>{recap.title}</div>
                        {(recap.skillRefs || []).length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {recap.skillRefs.map(ref => {
                              const sk = skills.find(s => s.id === ref)
                              return sk ? <span key={ref} style={{ fontSize: '0.65rem', color: 'var(--orange)', background: 'rgba(255,92,0,0.12)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{sk.name}</span> : null
                            })}
                          </div>
                        )}
                        {recap.coachComment && <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5 }}>{recap.coachComment}</p>}
                        {(recap.timeline || []).length > 0 && (
                          <span style={{ display: 'inline-block', marginTop: 4, fontSize: '0.6rem', color: '#10B981', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                            타임라인 {recap.timeline.length}구간
                          </span>
                        )}
                      </div>
                      <button onClick={() => handleDeleteRecap(recap.id)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 8, color: '#ef4444', cursor: 'pointer', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>삭제</button>
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
        {/* ── 교정 피드백 ── */}
        {adminTab === 'correction' && (
          <>
            <p className="sec-eyebrow">Admin</p>
            <h2 className="admin-title">교정 피드백</h2>

            <div className="admin-section">
              <h3 className="admin-section-title">교정 피드백 입력</h3>

              <div className="admin-row">
                <div className="fg" style={{ flex: 1 }}>
                  <label>수강생 선택</label>
                  <select value={cfParticipantId} onChange={e => setCfParticipantId(e.target.value)}>
                    <option value="">수강생 선택</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.phoneLast4})</option>
                    ))}
                  </select>
                </div>
                <div className="fg" style={{ flex: 1 }}>
                  <label>수업 일정</label>
                  <select value={cfScheduleId} onChange={e => setCfScheduleId(e.target.value)}>
                    <option value="">일정 선택</option>
                    {schedules.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="admin-row">
                <div className="fg" style={{ flex: 1 }}>
                  <label>카테고리</label>
                  <select value={cfCategory} onChange={e => setCfCategory(e.target.value)}>
                    <option value="">선택</option>
                    {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="fg" style={{ flex: 1 }}>
                  <label>타임라인 구간 (선택)</label>
                  <input type="number" min="1" max="10" value={cfTimelineOrder} onChange={e => setCfTimelineOrder(e.target.value)} placeholder="구간 번호" />
                </div>
                <div className="fg" style={{ flex: 1 }}>
                  <label>우선순위</label>
                  <select value={cfPriority} onChange={e => setCfPriority(e.target.value)}>
                    <option value="high">🔴 높음</option>
                    <option value="medium">🟡 보통</option>
                    <option value="low">⚪ 낮음</option>
                  </select>
                </div>
              </div>

              {/* 퀵 프리셋 */}
              {correctionPresets.length > 0 && (
                <div className="fg">
                  <label>퀵 프리셋</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {correctionPresets.map(preset => (
                      <button key={preset.id} type="button" onClick={() => applyPreset(preset)} style={{
                        padding: '5px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600,
                        border: '1px solid var(--border)', background: 'var(--surface-3)',
                        color: 'var(--text-2)', cursor: 'pointer', transition: 'all 0.2s',
                      }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-4)' }}>[{preset.category}]</span> {preset.problem}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="fg">
                <label>문제 행동</label>
                <input type="text" value={cfProblem} onChange={e => setCfProblem(e.target.value)} placeholder="예: 슈팅 시 공이 뜸" />
              </div>

              <div className="fg">
                <label>교정 피드백</label>
                <textarea rows={2} value={cfCorrection} onChange={e => setCfCorrection(e.target.value)} placeholder="예: 공의 정중앙을 맞추세요. 상체를 공 위로." />
              </div>

              <div className="fg">
                <label>관련 영상 URL (선택)</label>
                <input type="text" value={cfVideoUrl} onChange={e => setCfVideoUrl(e.target.value)} placeholder="https://youtu.be/..." />
              </div>

              <button className="btn-apply" onClick={handleAddCorrection} disabled={addingCorrection || !cfParticipantId || !cfScheduleId} style={{ marginTop: 8 }}>
                {addingCorrection ? '저장 중...' : '✏️ 교정 피드백 저장'}
              </button>
            </div>

            {/* 저장된 교정 피드백 목록 */}
            <div className="admin-section admin-section-dark">
              <h3 className="admin-section-title">저장된 교정 피드백 ({savedCorrections.length}개)</h3>
              {savedCorrections.length === 0
                ? <p className="admin-hint">아직 저장된 교정 피드백이 없습니다.</p>
                : savedCorrections.map(fb => {
                    const participant = participants.find(p => p.id === fb.participantId)
                    const schedule = schedules.find(s => s.id === fb.scheduleId)
                    const priorityIcons = { high: '🔴', medium: '🟡', low: '⚪' }
                    return (
                      <div key={fb.id} style={{ background: 'var(--surface-1)', borderRadius: 12, padding: '12px 14px', marginBottom: 8, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: '0.75rem' }}>{priorityIcons[fb.priority] || '🟡'}</span>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-1)' }}>{participant?.name || '알 수 없음'}</span>
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-4)' }}>{schedule?.title || ''}</span>
                              {fb.category && <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--orange)', background: 'rgba(255,92,0,0.12)', padding: '1px 6px', borderRadius: 8 }}>{fb.category}</span>}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 2 }}>{fb.problem}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-1)', fontWeight: 600, lineHeight: 1.5 }}>→ {fb.correction}</div>
                          </div>
                          <button onClick={() => handleDeleteCorrection(fb.id)} style={{ background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 8, color: '#ef4444', cursor: 'pointer', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>삭제</button>
                        </div>
                      </div>
                    )
                  })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
