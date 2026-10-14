import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, X, Check, Loader2 } from 'lucide-react';
import { OTIVO_BRAND } from '../constants/brand';
import { signInWithGoogle, signUpWithEmail, loginWithEmail } from '../lib/firebase';
import { formatAuthError, extractFirstName } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess?: (user: { name?: string; email: string; uid?: string }) => void;
}

const SLIDES = [
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=2000&auto=format&fit=crop'
];

const PHRASES = [
  "Creativity runs on",
  "Innovation thrives on",
  "Build the future on",
  "Your potential unlocks with"
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  onSuccess
}) => {
  const [showSignup, setShowSignup] = useState(initialMode === 'signup');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastLoginMethod, setLastLoginMethod] = useState<string | null>(() => {
    try {
      return localStorage.getItem('otivo_last_login_method');
    } catch {
      return null;
    }
  });

  // Sync mode on open
  useEffect(() => {
    if (isOpen) {
      setShowSignup(initialMode === 'signup');
      setErrorMsg(null);
    }
  }, [isOpen, initialMode]);

  // Slideshow timer (5s)
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Typewriter effect
  const [typewriterText, setTypewriterText] = useState('');
  useEffect(() => {
    if (!isOpen) return;

    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timer: NodeJS.Timeout;

    const typeSpeed = 90;
    const deleteSpeed = 50;
    const pauseDelay = 1800;

    const tick = () => {
      const currentPhrase = PHRASES[phraseIdx];

      if (isDeleting) {
        setTypewriterText(currentPhrase.substring(0, charIdx - 1));
        charIdx--;
      } else {
        setTypewriterText(currentPhrase.substring(0, charIdx + 1));
        charIdx++;
      }

      let delay = isDeleting ? deleteSpeed : typeSpeed;

      if (!isDeleting && charIdx === currentPhrase.length) {
        delay = pauseDelay;
        isDeleting = true;
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        phraseIdx = (phraseIdx + 1) % PHRASES.length;
        delay = 400;
      }

      timer = setTimeout(tick, delay);
    };

    tick();

    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const { user, profile } = await loginWithEmail(loginEmail, loginPassword);
      try {
        localStorage.setItem('otivo_last_login_method', 'email');
      } catch (e) {
        // ignore
      }
      setLastLoginMethod('email');
      const firstName = extractFirstName(profile.displayName, profile.email);
      setNotification(`Welcome back, ${firstName}!`);
      setTimeout(() => {
        if (onSuccess) onSuccess({ email: profile.email, name: profile.displayName || firstName, uid: user.uid });
        onClose();
      }, 800);
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!signupEmail) {
      setErrorMsg('Please enter your Email address');
      return;
    }
    if (!signupPassword) {
      setErrorMsg('Please enter a password');
      return;
    }
    if (signupPassword.length < 6) {
      setErrorMsg('Password should be at least 6 characters');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { user, profile } = await signUpWithEmail(signupEmail, signupPassword, signupName);
      try {
        localStorage.setItem('otivo_last_login_method', 'email');
      } catch (e) {
        // ignore
      }
      setLastLoginMethod('email');
      const firstName = extractFirstName(profile.displayName, profile.email);
      setNotification(`Welcome to OTIVO, ${firstName}!`);
      setTimeout(() => {
        if (onSuccess) onSuccess({ email: profile.email, name: profile.displayName || firstName, uid: user.uid });
        onClose();
      }, 800);
    } catch (err: any) {
      console.error("Signup error:", err);
      setErrorMsg(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const { user, profile } = await signInWithGoogle();
      try {
        localStorage.setItem('otivo_last_login_method', 'google');
      } catch (e) {
        // ignore
      }
      setLastLoginMethod('google');
      const firstName = extractFirstName(profile.displayName, profile.email);
      setNotification(`Authenticated as ${firstName}!`);
      setTimeout(() => {
        if (onSuccess) onSuccess({ email: profile.email, name: profile.displayName || firstName, uid: user.uid });
        onClose();
      }, 800);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        console.error("Google Auth error:", err);
      }
      setErrorMsg(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Full opened page view taking up 100% viewport */}
      <div className="fixed inset-0 z-[9999] w-screen h-screen bg-white flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-300">
        
        {/* Top Right Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 md:top-6 md:right-6 z-[120] p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-black transition-all shadow-md active:scale-95 border border-gray-200/80"
          title="Close"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Toast Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-5 left-1/2 -translate-x-1/2 z-[110] bg-[#2e7d32] text-white px-6 py-3 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>

          {/* Left: Forms Wrapper Container */}
          <div
            className="flex-1 relative overflow-hidden z-10 min-h-[500px]"
            style={{
              background: 'linear-gradient(-45deg, #ffffff, #e8f5e9, #c8e6c9, #ffffff, #f1f8e9)',
              backgroundSize: '400% 400%',
              animation: 'livePaintGradient 12s ease infinite'
            }}
          >
            <style>{`
              @keyframes livePaintGradient {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              @keyframes blinkCursor {
                from, to { border-color: transparent }
                50% { border-color: #a5d6a7; }
              }
            `}</style>

            {/* 1. LOGIN PANEL */}
            <div
              className="absolute inset-0 p-8 md:p-12 flex flex-col overflow-y-auto custom-scrollbar transition-all duration-700 ease-in-out"
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                transform: showSignup ? 'translateX(-100%)' : 'translateX(0)',
                opacity: showSignup ? 0 : 1,
                pointerEvents: showSignup ? 'none' : 'auto',
                zIndex: showSignup ? 1 : 2
              }}
            >
              {/* Header Logo */}
              <div className="flex items-center gap-2 font-bold text-xl text-[#1c1c1c] mb-8">
                <img src={OTIVO_BRAND.logo.path} alt="OTIVO" className="h-7 w-auto object-contain" />
                <span>OTIVO</span>
              </div>

              <div className="max-w-sm w-full mx-auto my-auto text-center py-4">
                <h1 className="text-2xl font-bold text-[#1c1c1c] mb-6">Log in to your account</h1>
                
                {errorMsg && !showSignup && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium text-left">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-[#1c1c1c] mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-3 border border-[#d1d1d1] rounded-lg text-sm text-[#1c1c1c] outline-none bg-white/90 focus:border-[#2e7d32] focus:bg-white transition-all shadow-sm disabled:opacity-50"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-semibold text-[#1c1c1c] mb-1.5">
                      Password
                    </label>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-3 pr-10 border border-[#d1d1d1] rounded-lg text-sm text-[#1c1c1c] outline-none bg-white/90 focus:border-[#2e7d32] focus:bg-white transition-all shadow-sm disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-8 text-gray-500 hover:text-gray-700 p-1"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-semibold rounded-lg text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{isLoading ? 'Signing In...' : 'Log In'}</span>
                  </button>
                </form>

                <div className="mt-4 text-xs">
                  <a href="#" className="text-[#555555] hover:text-[#2e7d32] hover:underline transition-colors">
                    Forgot password?
                  </a>
                </div>

                <div className="mt-6 pt-6 border-t border-black/10">
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    className="relative w-full py-3 px-4 border border-[#d1d1d1] bg-white/90 hover:bg-white rounded-lg text-sm text-[#1c1c1c] font-medium flex items-center justify-center gap-3 transition-all shadow-sm group"
                  >
                    {lastLoginMethod === 'google' && (
                      <span className="absolute -top-2.5 right-3 bg-gray-500 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow">
                        Last used
                      </span>
                    )}
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>

                <div className="mt-6 text-xs text-[#555555] space-y-2">
                  <p>
                    New to OTIVO?{' '}
                    <button
                      type="button"
                      onClick={() => setShowSignup(true)}
                      className="text-[#2e7d32] font-semibold hover:underline"
                    >
                      Sign up
                    </button>
                  </p>
                  <div>
                    <a href="#" className="text-[#2e7d32] font-semibold hover:underline">
                      Get help
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. SIGN UP PANEL */}
            <div
              className="absolute inset-0 p-8 md:p-12 flex flex-col overflow-y-auto custom-scrollbar transition-all duration-700 ease-in-out"
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                transform: showSignup ? 'translateX(0)' : 'translateX(100%)',
                opacity: showSignup ? 1 : 0,
                pointerEvents: showSignup ? 'auto' : 'none',
                zIndex: showSignup ? 2 : 1
              }}
            >
              {/* Header Logo */}
              <div className="flex items-center gap-2 font-bold text-xl text-[#1c1c1c] mb-6">
                <img src={OTIVO_BRAND.logo.path} alt="OTIVO" className="h-7 w-auto object-contain" />
                <span>OTIVO</span>
              </div>

              <div className="max-w-sm w-full mx-auto my-auto text-center py-2">
                <h1 className="text-2xl font-bold text-[#1c1c1c] mb-6">Create your account</h1>

                {errorMsg && showSignup && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-medium text-left">
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-[#1c1c1c] mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 border border-[#d1d1d1] rounded-lg text-sm text-[#1c1c1c] outline-none bg-white/90 focus:border-[#2e7d32] focus:bg-white transition-all shadow-sm disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1c1c1c] mb-1">
                      Email address
                    </label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 border border-[#d1d1d1] rounded-lg text-sm text-[#1c1c1c] outline-none bg-white/90 focus:border-[#2e7d32] focus:bg-white transition-all shadow-sm disabled:opacity-50"
                    />
                    {signupEmail.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail.trim()) && (
                      <p className="text-[11px] text-red-500 mt-1">Please enter a valid email address</p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-semibold text-[#1c1c1c] mb-1">
                      Password
                    </label>
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="Create password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 pr-10 border border-[#d1d1d1] rounded-lg text-sm text-[#1c1c1c] outline-none bg-white/90 focus:border-[#2e7d32] focus:bg-white transition-all shadow-sm disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-7 text-gray-500 hover:text-gray-700 p-1"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {signupPassword.length > 0 && signupPassword.length < 6 && (
                      <p className="text-[11px] text-amber-600 mt-1">Password must be at least 6 characters</p>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-semibold text-[#1c1c1c] mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={showSignupConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-2.5 pr-10 border border-[#d1d1d1] rounded-lg text-sm text-[#1c1c1c] outline-none bg-white/90 focus:border-[#2e7d32] focus:bg-white transition-all shadow-sm disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                      className="absolute right-3 top-7 text-gray-500 hover:text-gray-700 p-1"
                    >
                      {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {signupConfirmPassword.length > 0 && signupConfirmPassword !== signupPassword && (
                      <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  {(() => {
                    const isSignupNameValid = signupName.trim().length > 0;
                    const isSignupEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail.trim());
                    const isSignupPasswordValid = signupPassword.length >= 6;
                    const isSignupConfirmValid = signupPassword === signupConfirmPassword && signupConfirmPassword.length > 0;
                    const isSignupFormValid = isSignupNameValid && isSignupEmailValid && isSignupPasswordValid && isSignupConfirmValid;

                    return (
                      <button
                        type="submit"
                        disabled={!isSignupFormValid || isLoading}
                        className="w-full py-3.5 bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-semibold rounded-lg text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 mt-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#2e7d32] disabled:active:scale-100"
                      >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>{isLoading ? 'Creating Account...' : 'Create Account'}</span>
                      </button>
                    );
                  })()}
                </form>

                <div className="mt-5 text-xs text-[#555555] space-y-2">
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setShowSignup(false)}
                      className="text-[#2e7d32] font-semibold hover:underline"
                    >
                      Log in
                    </button>
                  </p>
                  <div>
                    <a href="#" className="text-[#2e7d32] font-semibold hover:underline">
                      Terms & Privacy Policy
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Image Slideshow & Animated Overlay */}
          <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden bg-black min-h-[500px]">
            {/* Slideshow Layer */}
            {SLIDES.map((slide, idx) => (
              <div
                key={slide}
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
                style={{
                  backgroundImage: `url(${slide})`,
                  opacity: currentSlide === idx ? 1 : 0
                }}
              />
            ))}

            {/* Dark Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70 z-[2]" />

            {/* Overlay Text & Box */}
            <div className="relative z-[3] flex flex-wrap items-center justify-center gap-3 px-6 text-center text-white text-2xl font-serif">
              <span
                className="italic font-semibold tracking-wide border-r-2 border-[#a5d6a7] pr-2 whitespace-nowrap"
                style={{
                  animation: 'blinkCursor 0.75s step-end infinite'
                }}
              >
                {typewriterText}
              </span>
              
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2e7d32] rounded-xl font-sans font-bold text-lg shadow-xl border border-white/10">
                <img
                  src={OTIVO_BRAND.logo.path}
                  alt="OTIVO"
                  className="h-7 w-auto object-contain brightness-0 invert"
                />
                <span>OTIVO</span>
              </div>
            </div>
          </div>

      </div>
    </AnimatePresence>
  );
};
