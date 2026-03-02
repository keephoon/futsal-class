import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomeTab from './components/HomeTab'
import ReportLookup from './components/ReportLookup'
import ApplyModal from './components/ApplyModal'
import AdminReport from './components/AdminReport'

function MainApp() {
  const [activeTab, setActiveTab] = useState('home')
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      {activeTab === 'home'
        ? <HomeTab onApply={() => setModalOpen(true)} />
        : <ReportLookup />
      }

      <nav className="tab-bar">
        <button
          className={`tab-item${activeTab === 'home' ? ' active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span className="tab-icon">🏠</span>
          <span className="tab-label">홈</span>
        </button>

        <button className="tab-center-btn" onClick={() => setModalOpen(true)}>
          <span>+</span>
        </button>

        <button
          className={`tab-item${activeTab === 'report' ? ' active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          <span className="tab-icon">📋</span>
          <span className="tab-label">내 리포트</span>
        </button>
      </nav>

      {modalOpen && <ApplyModal onClose={() => setModalOpen(false)} />}
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
