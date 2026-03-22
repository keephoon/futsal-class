import { db, collection, query, where, getDocs } from '../firebase'

export async function resolveParticipantId(currentUser) {
  if (!currentUser) return null

  // 1. 캐시 확인
  const cached = sessionStorage.getItem('participantId')
  if (cached) return cached

  // 2. participants 컬렉션에서 조회
  const q = query(
    collection(db, 'participants'),
    where('name', '==', currentUser.name),
    where('phoneLast4', '==', currentUser.phoneLast4)
  )
  const snap = await getDocs(q)

  if (snap.empty) {
    console.warn('참가자를 찾을 수 없습니다:', currentUser.name, currentUser.phoneLast4)
    return null
  }

  const participantId = snap.docs[0].id

  // 3. 캐싱
  sessionStorage.setItem('participantId', participantId)
  return participantId
}
