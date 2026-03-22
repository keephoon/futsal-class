import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import ScheduleTab from './components/ScheduleTab'
import MyTab from './components/MyTab'
import ApplyModal from './components/ApplyModal'
import AdminReport from './components/AdminReport'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import RecapTab from './components/RecapTab'
import TrainingLogTab from './components/TrainingLogTab'

const REPORT_CATEGORIES = ['전체', '드리블', '볼터치', '체력', '포지셔닝', '팀플레이']

// ── 아이콘 ──────────────────────────────────────────────

function IconPerson({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="7" r="4" stroke={active ? '#FF5C00' : '#555'} strokeWidth="1.8" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={active ? '#FF5C00' : '#555'} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconPlay({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={active ? '#FF5C00' : '#555'} strokeWidth="1.8" />
      <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill={active ? '#FF5C00' : '#555'} />
    </svg>
  )
}

function IconNote({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="18" rx="2" stroke={active ? '#FF5C00' : '#555'} strokeWidth="1.8" />
      <path d="M8 8h8M8 12h8M8 16h4" stroke={active ? '#FF5C00' : '#555'} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 17l2-2-2-2" stroke={active ? '#FF5C00' : '#555'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCalendar({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke={active ? '#FF5C00' : '#555'} strokeWidth="1.8" />
      <path d="M3 9h18" stroke={active ? '#FF5C00' : '#555'} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 2v4M16 2v4" stroke={active ? '#FF5C00' : '#555'} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="14" r="1" fill={active ? '#FF5C00' : '#555'} />
      <circle cx="12" cy="14" r="1" fill={active ? '#FF5C00' : '#555'} />
      <circle cx="16" cy="14" r="1" fill={active ? '#FF5C00' : '#555'} />
    </svg>
  )
}

function IconBall() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="white" />
      <path d="M12 7l3 2.5-1.2 3.5H10.2L9 9.5 12 7z" fill="#111" />
      <path d="M12 7V2M15 9.5l4.5-2M14.8 13l3.5 3M9.2 13l-3.5 3M9 9.5L4.5 7.5" stroke="#111" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

// ── 메인 앱 ──────────────────────────────────────────────

function MainApp() {
  const [activeTab, setActiveTab] = useState('my')
  const [modalOpen, setModalOpen] = useState(false)
  const [preSelectedSchedule, setPreSelectedSchedule] = useState(null)
  const [reportHasResults, setReportHasResults] = useState(false)
  const [reportCategory, setReportCategory] = useState('전체')

  // 세션 기반 자동 로그인
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  const handleLogin = (user) => {
    sessionStorage.setItem('user', JSON.stringify(user))
    setCurrentUser(user)
  }

  const openApply = (schedule = null) => {
    setPreSelectedSchedule(schedule)
    setModalOpen(true)
  }

  const closeApply = () => {
    setModalOpen(false)
    setPreSelectedSchedule(null)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab !== 'my') {
      setReportHasResults(false)
      setReportCategory('전체')
    }
  }

  const showSecondaryNav = activeTab === 'my' && reportHasResults

  return (
    <>
      <div className={`page-wrap tab-page${showSecondaryNav ? ' has-secondary-nav' : ''}`}>
        {activeTab === 'my' && (
          <MyTab
            onResultsChange={setReportHasResults}
            activeCategory={reportCategory}
            currentUser={currentUser}
            onLogin={handleLogin}
          />
        )}
        {activeTab === 'recap' && <RecapTab currentUser={currentUser} />}
        {activeTab === 'log' && <TrainingLogTab currentUser={currentUser} />}
        {activeTab === 'schedule' && <ScheduleTab onApply={openApply} />}
      </div>

      {/* 이중 네비 — MY 탭 리포트 결과 있을 때만 */}
      {showSecondaryNav && (
        <div className="secondary-nav">
          <div className="secondary-nav-inner">
            {REPORT_CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`sec-nav-pill${reportCategory === cat ? ' active' : ''}`}
                onClick={() => setReportCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 메인 탭바 */}
      <nav className="tab-bar">
        <button
          className={`tab-item${activeTab === 'my' ? ' active' : ''}`}
          onClick={() => handleTabChange('my')}
        >
          <IconPerson active={activeTab === 'my'} />
          <span className="tab-label">MY</span>
        </button>

        <button
          className={`tab-item${activeTab === 'recap' ? ' active' : ''}`}
          onClick={() => handleTabChange('recap')}
        >
          <IconPlay active={activeTab === 'recap'} />
          <span className="tab-label">리캡</span>
        </button>

        <button className="tab-item tab-apply-item" onClick={() => openApply()}>
          <span className="tab-apply-ball">
            <IconBall />
          </span>
          <span className="tab-label tab-apply-label">신청</span>
        </button>

        <button
          className={`tab-item${activeTab === 'log' ? ' active' : ''}`}
          onClick={() => handleTabChange('log')}
        >
          <IconNote active={activeTab === 'log'} />
          <span className="tab-label">기록</span>
        </button>

        <button
          className={`tab-item${activeTab === 'schedule' ? ' active' : ''}`}
          onClick={() => handleTabChange('schedule')}
        >
          <IconCalendar active={activeTab === 'schedule'} />
          <span className="tab-label">일정</span>
        </button>
      </nav>

      {modalOpen && (
        <ApplyModal
          onClose={closeApply}
          preSelectedSchedule={preSelectedSchedule}
        />
      )}
      <PWAInstallPrompt />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/admin" element={<AdminReport />} />
      </Routes>
    </BrowserRouter>
  )
}
