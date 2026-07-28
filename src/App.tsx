/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, MapPin, Clock, Navigation, 
  Sparkles, ShieldCheck, Music, Milestone, ArrowRight, Lock, X
} from 'lucide-react';

import { WeddingConfig, RSVPGuest, GuestbookPhoto } from './types';
import Envelope from './components/Envelope';
import ScratchCard from './components/ScratchCard';
import Countdown from './components/Countdown';
import RSVPForm from './components/RSVPForm';
import AdminPanel from './components/AdminPanel';
import { useWeddingData } from './hooks/useWeddingData';

export default function App() {
  const {
    config,
    rsvps,
    photos,
    historyList,
    guestList,
    updateConfig,
    addOrUpdateRSVP,
    deleteRSVP,
    clearRSVPs,
    addSampleRSVPs,
    addPhoto,
    deletePhoto,
    logAdminLogin,
    clearHistory,
    uploadGuestList,
    triggerSystemReset
  } = useWeddingData();

  const [hasOpenedEnvelope, setHasOpenedEnvelope] = useState<boolean>(() => {
    return localStorage.getItem('wedding_opened') === 'true';
  });

  const [isScratchRevealed, setIsScratchRevealed] = useState<boolean>(() => {
    return localStorage.getItem('wedding_scratched') === 'true';
  });

  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [passwordHint, setPasswordHint] = useState<string>('sposi2026');

  useEffect(() => {
    if (showPasswordModal) {
      fetch('/api/history/password-hint')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.password) {
            setPasswordHint(data.password);
          }
        })
        .catch((err) => console.error('Error fetching password hint:', err));
    }
  }, [showPasswordModal]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await logAdminLogin(passwordInput);
    if (result.success) {
      setIsAdminMode(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError(result.error || 'Password non corretta. Riprova.');
    }
  };

  const handleOpenEnvelope = () => {
    setHasOpenedEnvelope(true);
    localStorage.setItem('wedding_opened', 'true');
  };

  const handleRevealComplete = () => {
    setIsScratchRevealed(true);
    localStorage.setItem('wedding_scratched', 'true');
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const handleRSVPSubmit = (newGuest: RSVPGuest) => {
    addOrUpdateRSVP(newGuest);
  };

  const handleClearRSVPs = () => {
    if (window.confirm('Sicuro di voler resettare tutta la lista organizzativa? I dati andranno persi.')) {
      clearRSVPs();
    }
  };

  const handleAddSampleRSVPs = () => {
    addSampleRSVPs();
  };

  const handleDeleteRSVP = (id: string) => {
    deleteRSVP(id);
  };

  const handleUpdateConfig = (newConfig: WeddingConfig) => {
    updateConfig(newConfig);
  };



  const handleOpenMap = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank', 'noreferrer,noopener');
  };

  const formatWeddingDateItalian = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      const formatted = d.toLocaleDateString('it-IT', options);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return 'Sabato, 12 Settembre 2026';
    }
  };

  const getWeddingTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '15:30';
    }
  };

  const renderLeafDecorations = () => {
    const holidaySymbols = ['❄️', '✨', '❄️', '✦', '❄️', '✨'];
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              y: -50, 
              x: Math.random() * 280,
              rotate: Math.random() * 360 
            }}
            animate={{ 
              opacity: [0, 0.5, 0.5, 0],
              y: [0, 850],
              x: [null, Math.random() * 150 + 20],
              rotate: [null, Math.random() * 360 + 90]
            }}
            transition={{
              duration: 9 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: 'linear'
            }}
            className="absolute text-[#FF4B55]/20 text-md sm:text-lg"
            style={{ left: `${(i * 10) % 100}%` }}
          >
            {holidaySymbols[i % holidaySymbols.length]}
          </motion.div>
        ))}
      </div>
    );
  };

  // If wedding envelope is NOT opened yet, show the Envelope view
  if (!hasOpenedEnvelope) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="envelope"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Envelope 
            sposoName={config.sposoName} 
            sposaName={config.sposaName} 
            onOpened={handleOpenEnvelope} 
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D2C1E] text-[#FFFFFF] relative overflow-x-hidden pb-20 font-sans selection:bg-[#CEB381]">
      
      {/* Soft falling decorative elements */}
      {renderLeafDecorations()}

      {/* Confetti Visual Alerts */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-center px-6 py-3 bg-[#FFFFFF] text-[#0D2C1E] border border-white/30 font-sans tracking-[0.2em] text-[10px] uppercase font-bold text-xs select-none">
            ✦ Data Rivelata con Successo ✦
          </div>
        </div>
      )}

      {/* EDITORIAL TOP BRANDING HEADER NAVIGATION */}
      <header className="w-full max-w-6xl mx-auto px-6 py-8 flex justify-between items-center relative z-20">
        <div className="text-[10px] tracking-[0.3em] uppercase font-sans font-bold">
          {config.sposoName.charAt(0)} & {config.sposaName.charAt(0)} — {new Date(config.weddingDate).getFullYear() || 2026}
        </div>
        <div className="flex gap-4 sm:gap-6 text-[9px] uppercase tracking-[0.2em] font-sans items-center">
          <button 
            onClick={() => {
              localStorage.removeItem('wedding_opened');
              localStorage.removeItem('wedding_scratched');
              setHasOpenedEnvelope(false);
              setIsScratchRevealed(false);
            }}
            className="hover:text-[#FF4B55] transition-all cursor-pointer font-semibold py-1.5 text-[#FF4B55] border-b border-[#FF4B55]/30"
          >
            Chiudi Busta
          </button>
          
          <button 
            onClick={() => {
              if (isAdminMode) {
                setIsAdminMode(false);
              } else {
                setShowPasswordModal(true);
                setPasswordError('');
                setPasswordInput('');
              }
            }}
            className={`border border-white/30 px-3.5 py-1.5 rounded-none font-bold tracking-widest uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              isAdminMode 
                ? 'bg-[#0D2C1E] text-white' 
                : 'bg-transparent text-[#FFFFFF] hover:bg-[#0D2C1E] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {isAdminMode ? 'Invito Pubblico' : 'Spazio Coppia (Admin)'}
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT SWITCHER */}
      <AnimatePresence mode="wait">
        {isAdminMode ? (
          <motion.div
            key="admin-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-6 relative z-10 animate-fadeIn"
          >
            <AdminPanel
              rsvps={rsvps}
              onClearRSVPs={clearRSVPs}
              onAddSampleRSVPs={handleAddSampleRSVPs}
              onDeleteRSVP={handleDeleteRSVP}
              config={config}
              onUpdateConfig={handleUpdateConfig}
              historyList={historyList}
              onClearHistory={clearHistory}
              guestList={guestList}
              onUploadGuestList={uploadGuestList}
              onTriggerSystemReset={triggerSystemReset}
            />
          </motion.div>
        ) : (
          <motion.div
            key="invite-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-6xl mx-auto px-6 relative z-10 space-y-16"
          >
            
            {/* GRID LAYOUT: LEFT HERO/STORY COLUMN + RIGHT INTERACTIVE COLUMN */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 items-stretch">
              
              {/* LEFT COLUMN: Editorial Hero Section & Our Story */}
              <div className="md:col-span-7 flex flex-col justify-between items-center text-center py-4 space-y-8">
                
                {/* Large Typographic Focal Point */}
                <div className="space-y-5 flex flex-col items-center w-full">
                  <p className="text-[10px] uppercase tracking-[0.4em] font-display font-bold text-[#FF4B55] opacity-90 text-center">
                    Insieme con le nostre famiglie
                  </p>
                  
                  <div className="py-2 flex flex-col items-center justify-center w-full max-w-md mx-auto">
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-script text-[#CEB381] tracking-wide select-none leading-none">
                      {config.sposoName}
                    </h1>
                    <span className="font-script text-3xl sm:text-4xl lg:text-5xl text-[#CEB381] select-none my-2 leading-none">
                      e
                    </span>
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-script text-[#CEB381] tracking-wide select-none leading-none">
                      {config.sposaName}
                    </h1>
                  </div>

                  <div className="w-16 h-[1px] bg-white/20 self-center" />
                  
                  <p className="font-serif italic text-base text-[#FFFFFF]/85 leading-relaxed max-w-sm text-center">
                    "{config.welcomeMessage}"
                  </p>
                </div>

                {/* Arched Portrait Placeholder Box */}
                <div className="relative w-full max-w-[280px] aspect-3/4 bg-[#CEB381] rounded-t-full border-[8px] border-white overflow-hidden shadow-lg grayscale hover:grayscale-0 transition-all duration-700 ease-in-out mx-auto">
                  <div className="absolute inset-0 border border-black/5 rounded-t-full" />
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-[#FF4B55]/10 to-transparent">
                    <Heart className="w-6 h-6 text-[#FF4B55] mb-3 animate-pulse" />
                    <span className="text-xs font-display tracking-[0.2em] uppercase font-bold text-[#FFFFFF]/70">
                      I Nostri Momenti
                    </span>
                    <span className="text-[10px] font-display tracking-[0.25em] uppercase text-[#CEB381] mt-2 font-semibold">
                      {config.sposoName.toUpperCase()} & {config.sposaName.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Our Story text with elegant dividers */}
                <div className="border-t border-white/10 pt-8 space-y-3 w-full flex flex-col items-center">
                  <span className="text-xs font-display font-bold tracking-[0.3em] uppercase text-[#FF4B55] text-center">
                    LA NOSTRA STORIA
                  </span>
                  <p className="font-serif text-sm leading-relaxed text-[#FFFFFF]/75 max-w-md text-center">
                    {config.ourStory}
                  </p>
                </div>

              </div>

              {/* RIGHT COLUMN: Interactive Widgets, Scratch-Card, Bento Countdown, Logistics */}
              <div className="md:col-span-5 bg-[#13442D] border-l border-white/5 p-6 sm:p-10 flex flex-col justify-center space-y-10">
                
                {/* Gamified Scratch Date Revealer Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-[1px] flex-grow bg-white/10"></div>
                    <span className="text-xs font-display font-bold tracking-[0.25em] text-[#CEB381] uppercase">SVELA LA DATA</span>
                    <div className="h-[1px] flex-grow bg-white/10"></div>
                  </div>
                  
                  <ScratchCard 
                    revealText={`${formatWeddingDateItalian(config.weddingDate)} - ore ${getWeddingTime(config.weddingDate)}`}
                    onRevealComplete={handleRevealComplete}
                  />

                  {isScratchRevealed ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Countdown targetDateStr={config.weddingDate} />
                    </motion.div>
                  ) : (
                    <p className="text-xs tracking-widest uppercase font-mono text-center text-[#CEB381]/90 bg-[#0D2C1E]/60 py-3 border border-dashed border-[#CEB381]/30 select-none">
                      🔒 Gratta per sbloccare la data e il conto alla rovescia
                    </p>
                  )}
                </div>

                {/* Logistics Info: Ceremony & Reception */}
                <div className="space-y-8">
                  
                  {/* Ceremony Section */}
                  <div className="space-y-3 text-center">
                    <div className="flex items-center gap-3">
                      <div className="h-[1px] flex-grow bg-white/10"></div>
                      <span className="text-xs font-display font-medium tracking-[0.25em] uppercase text-[#CEB381]">La Cerimonia</span>
                      <div className="h-[1px] flex-grow bg-white/10"></div>
                    </div>
                    <h3 className="font-display text-xl font-normal tracking-wider text-[#FFFFFF]">{config.venueCeremony.name}</h3>
                    <p className="text-sm text-[#FFFFFF]/75 leading-relaxed px-4">{config.venueCeremony.description}</p>
                    <p className="text-xs uppercase tracking-wider font-semibold text-[#FF4B55]">Ingresso alle ore {config.venueCeremony.time}</p>
                    <button 
                      onClick={() => handleOpenMap(config.venueCeremony.latitude, config.venueCeremony.longitude)}
                      className="px-6 py-2 border border-white/30 bg-transparent text-[#FFFFFF] hover:bg-[#FFFFFF] hover:text-[#0D2C1E] transition-all text-xs font-bold uppercase tracking-[0.2em] rounded-none cursor-pointer mt-1"
                    >
                      Apri in Google Maps
                    </button>
                  </div>

                  {/* Reception Section */}
                  <div className="space-y-3 text-center">
                    <div className="flex items-center gap-3">
                      <div className="h-[1px] flex-grow bg-white/10"></div>
                      <span className="text-xs font-display font-medium tracking-[0.25em] uppercase text-[#CEB381]">Il Ricevimento</span>
                      <div className="h-[1px] flex-grow bg-white/10"></div>
                    </div>
                    <h3 className="font-display text-xl font-normal tracking-wider text-[#FFFFFF]">{config.venueReception.name}</h3>
                    <p className="text-sm text-[#FFFFFF]/75 leading-relaxed px-4">{config.venueReception.description}</p>
                    <p className="text-xs uppercase tracking-wider font-semibold text-[#FF4B55]">Aperitivo alle ore {config.venueReception.time}</p>
                    <button 
                      onClick={() => handleOpenMap(config.venueReception.latitude, config.venueReception.longitude)}
                      className="px-6 py-2 border border-white/30 bg-transparent text-[#FFFFFF] hover:bg-[#FFFFFF] hover:text-[#0D2C1E] transition-all text-xs font-bold uppercase tracking-[0.2em] rounded-none cursor-pointer mt-1"
                    >
                      Ottieni Direzioni
                    </button>
                  </div>

                </div>

              </div>

            </div>

            {/* FULL WIDTH IN-FORSE MULTI-COMPANION RSVP FORM */}
            <div id="rsvp-section" className="border-t border-white/10 pt-10">
              <RSVPForm onRSVPSubmit={handleRSVPSubmit} />
            </div>



            {/* FOOTER */}
            <footer className="text-center pt-10 pb-4 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-[1px] bg-white/10"></div>
                <span className="text-[9px] font-display uppercase tracking-[0.5em] text-[#FF4B55] font-semibold">
                  Save the Date — {config.sposoName} & {config.sposaName} — {new Date(config.weddingDate).toLocaleDateString('it-IT', {day: 'numeric', month: 'numeric', year: '2-digit'})}
                </span>
                <div className="w-8 h-[1px] bg-white/10"></div>
              </div>
              <p className="text-[8px] font-mono tracking-widest text-[#FFFFFF]/40 uppercase mt-1">Con amore, fatto in Toscana ✦</p>
            </footer>

          </motion.div>
        )}
      </AnimatePresence>

      {/* PASSWORD PROTECTION MODAL FOR ADMIN PORTAL */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-[#0D2C1E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full max-w-sm bg-[#0D2C1E] border border-[#CEB381] px-6 py-8 shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError('');
                  setPasswordInput('');
                }}
                className="absolute top-4 right-4 text-[#FFFFFF]/50 hover:text-[#FFFFFF] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-4">
                <div className="w-12 h-12 border border-[#FF4B55] rounded-full flex items-center justify-center mx-auto text-[#FF4B55]">
                  <Lock className="w-5 h-5" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-serif text-lg text-[#FFFFFF]">Area Riservata Sposi</h3>
                  <p className="font-sans text-[10px] text-[#FFFFFF]/60 uppercase tracking-widest">AUTENTICAZIONE RICHIESTA</p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
                  <div className="relative">
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setPasswordError('');
                      }}
                      placeholder="Inserisci password"
                      className="w-full px-3 py-2.5 bg-[#13442D] border border-[#CEB381] font-sans text-xs tracking-wider rounded-none text-center focus:outline-none focus:border-[#FF4B55] placeholder:text-[#FFFFFF]/30 text-[#FFFFFF]"
                      autoFocus
                    />
                  </div>

                  {passwordError && (
                    <p className="text-[10px] font-sans text-red-600 font-semibold tracking-wide">
                      {passwordError}
                    </p>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#FFFFFF] text-[#0D2C1E] border border-white/30 font-sans tracking-[0.2em] text-[9px] font-bold rounded-none uppercase hover:bg-[#FF4B55] hover:border-[#FF4B55] transition-all cursor-pointer"
                    >
                      Accedi all'Area Coppia
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordError('');
                        setPasswordInput('');
                      }}
                      className="w-full py-2.5 bg-transparent text-[#FFFFFF] border border-white/20 font-sans tracking-[0.2em] text-[10px] font-bold rounded-none uppercase hover:bg-black/5 transition-all cursor-pointer"
                    >
                      Annulla
                    </button>
                  </div>
                </form>

                <div className="pt-4 border-t border-[#CEB381] text-[10px] font-serif text-[#FFFFFF]/70 leading-relaxed text-center">
                  L'area riservata è protetta da codice di accesso.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
