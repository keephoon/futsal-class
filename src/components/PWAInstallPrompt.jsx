import { useState, useEffect } from 'react'

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false)
  // 'ios' | 'android-native' | 'android-manual' | 'kakao-ios' | 'kakao-android'
  const [platform, setPlatform] = useState(null)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    // ① standalone 모드 (이미 설치돼서 홈화면에서 열린 경우)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    if (isStandalone) return

    // ② appinstalled 이벤트로 설치 확인된 경우
    if (localStorage.getItem('pwa-installed')) return

    // ③ 사용자가 직접 닫은 경우 (영구 억제)
    if (localStorage.getItem('pwa-dismissed')) return

    // ── 개발 테스트: ?pwa=ios|android|kakao-ios|kakao-android ──
    const params = new URLSearchParams(window.location.search)
    const testPlatform = params.get('pwa')
    if (testPlatform) {
      setPlatform(testPlatform)
      setTimeout(() => setShow(true), 500)
      return
    }

    const ua = navigator.userAgent
    const isIOS = /iPhone|iPad|iPod/.test(ua) && !window.MSStream
    const isAndroid = /Android/.test(ua)

    // ── 카카오 인앱 브라우저 감지 (최우선) ──
    const isKakao = /KAKAOTALK/i.test(ua)
    if (isKakao) {
      // kakaotalk:// 스킴으로 외부 브라우저 자동 열기 시도 (iOS · Android 공통)
      const cleanUrl = window.location.origin + window.location.pathname
      window.location.href =
        'kakaotalk://web/openExternal?url=' + encodeURIComponent(cleanUrl)

      // 1.5초 후에도 여전히 이 페이지면 → 리다이렉트 실패, 수동 안내 배너 표시
      const timer = setTimeout(() => {
        setPlatform(isIOS ? 'kakao-ios' : 'kakao-android')
        setShow(true)
      }, 1500)
      return () => clearTimeout(timer)
    }

    // ── iOS Safari (Chrome on iOS 제외) ──
    const isSafariBrowser = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua)
    if (isIOS && isSafariBrowser) {
      setPlatform('ios')
      setTimeout(() => setShow(true), 1800)
      return
    }

    // ── Android ──
    if (isAndroid) {
      const handler = (e) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setPlatform('android-native')
        setTimeout(() => setShow(true), 1800)
      }
      window.addEventListener('beforeinstallprompt', handler)

      // beforeinstallprompt 없을 때 수동 안내 (삼성 인터넷 등)
      const fallback = setTimeout(() => {
        setPlatform(prev => prev || 'android-manual')
        setShow(prev => prev || true)
      }, 3200)

      return () => {
        window.removeEventListener('beforeinstallprompt', handler)
        clearTimeout(fallback)
      }
    }
  }, [])

  // ── 설치 완료 감지 (Android Chrome의 appinstalled 이벤트) ──
  useEffect(() => {
    const onInstalled = () => {
      localStorage.setItem('pwa-installed', '1')
      setShow(false)
    }
    window.addEventListener('appinstalled', onInstalled)
    return () => window.removeEventListener('appinstalled', onInstalled)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-installed', '1')
      }
    }
    handleDismiss()
  }

  // 닫기 → localStorage에 저장해서 이후 세션에도 안 뜨게
  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('pwa-dismissed', '1')
  }

  // 카카오 → 외부 브라우저 열기 (버튼 재시도용)
  const tryOpenExternal = () => {
    const cleanUrl = window.location.origin + window.location.pathname
    window.location.href =
      'kakaotalk://web/openExternal?url=' + encodeURIComponent(cleanUrl)
  }

  if (!show) return null

  /* ── 카카오 iOS: Safari로 열기 안내 ── */
  if (platform === 'kakao-ios') {
    return (
      <div className="pwa-kakao-card" role="dialog" aria-label="외부 브라우저 안내">
        <div className="pwa-row">
          <span className="pwa-kakao-icon">🌐</span>
          <div className="pwa-kakao-body">
            <strong>Safari에서 열어주세요</strong>
            <p>하단 <em>···</em> 버튼 → <em>Safari로 열기</em></p>
          </div>
        </div>
        <button className="pwa-x-btn pwa-x-android" onClick={handleDismiss} aria-label="닫기">✕</button>
      </div>
    )
  }

  /* ── 카카오 Android: 외부 브라우저 열기 ── */
  if (platform === 'kakao-android') {
    return (
      <div className="pwa-kakao-card" role="dialog" aria-label="외부 브라우저 안내">
        <div className="pwa-row">
          <span className="pwa-kakao-icon">🌐</span>
          <div className="pwa-kakao-body">
            <strong>Chrome에서 열어주세요</strong>
            <p>우측 상단 <em>⋮</em> → <em>다른 앱으로 열기</em></p>
          </div>
          <button className="pwa-open-btn" onClick={tryOpenExternal}>열기</button>
        </div>
        <button className="pwa-x-btn pwa-x-android" onClick={handleDismiss} aria-label="닫기">✕</button>
      </div>
    )
  }

  /* ── iOS Safari: 하단 고정, 아래 화살표 ── */
  if (platform === 'ios') {
    return (
      <div className="pwa-ios-wrap" role="dialog" aria-label="앱 설치 안내">
        <div className="pwa-ios-card">
          <div className="pwa-row">
            <span className="pwa-ball">⚽</span>
            <div className="pwa-ios-body">
              <strong>홈 화면에 추가하기</strong>
              <p>
                하단{' '}
                <span className="pwa-share-badge">
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                    <path d="M6 9V1M6 1L3 4M6 1l3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="1" y="6" width="10" height="7" rx="1.5" stroke="white" strokeWidth="1.3"/>
                  </svg>
                  공유
                </span>{' '}
                버튼 → <em>'홈 화면에 추가'</em>
              </p>
            </div>
          </div>
          <button className="pwa-x-btn" onClick={handleDismiss} aria-label="닫기">✕</button>
        </div>
        <div className="pwa-ios-arrow">▼</div>
      </div>
    )
  }

  /* ── Android Chrome (native install button) ── */
  if (platform === 'android-native') {
    return (
      <div className="pwa-android-card" role="dialog" aria-label="앱 설치 안내">
        <div className="pwa-row">
          <span className="pwa-ball">⚽</span>
          <div className="pwa-android-body">
            <strong>앱으로 설치하기</strong>
            <p>홈 화면에서 빠르게 접속하세요!</p>
          </div>
          <button className="pwa-install-btn" onClick={handleInstall}>설치</button>
        </div>
        <button className="pwa-x-btn pwa-x-android" onClick={handleDismiss} aria-label="닫기">✕</button>
      </div>
    )
  }

  /* ── Android 수동 안내 (삼성 인터넷 등) ── */
  if (platform === 'android-manual') {
    return (
      <div className="pwa-android-card" role="dialog" aria-label="앱 설치 안내">
        <div className="pwa-row">
          <span className="pwa-ball">⚽</span>
          <div className="pwa-android-body">
            <strong>홈 화면에 추가하기</strong>
            <p>브라우저 메뉴 <em>⋮</em> → <em>'홈 화면에 추가'</em></p>
          </div>
        </div>
        <button className="pwa-x-btn pwa-x-android" onClick={handleDismiss} aria-label="닫기">✕</button>
      </div>
    )
  }

  return null
}
