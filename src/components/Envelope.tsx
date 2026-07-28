/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Heart } from 'lucide-react';

interface EnvelopeProps {
  sposoName: string;
  sposaName: string;
  onOpened: () => void;
}

export default function Envelope({ sposoName, sposaName, onOpened }: EnvelopeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSealed, setIsSealed] = useState(true);
  const [isCardOut, setIsCardOut] = useState(false);

  const handleOpenClick = async () => {
    if (isOpen) return;
    setIsSealed(false);
    
    // Wait for wax seal to fade, then open flap
    setTimeout(() => {
      setIsOpen(true);
      
      // Wait for flap animation, then slide out card
      setTimeout(() => {
        setIsCardOut(true);
      }, 800);
    }, 400);
  };

  return (
    <div id="interactive-envelope-view" className="flex flex-col items-center justify-center min-h-[95vh] px-4 py-8 bg-[#0D2C1E] text-[#FFFFFF]">
      
      {/* Narrative Intro Greeting */}
      <div className="text-center mb-12 max-w-sm">
        <span className="text-[10px] tracking-[0.4em] font-display text-[#FF4B55] uppercase block mb-3 font-semibold">
          Ti invitiamo a celebrare
        </span>
        <div className="flex flex-col items-center justify-center w-full mx-auto my-4 py-2 text-center">
          <h1 className="font-script text-5xl sm:text-6xl text-[#CEB381] select-none leading-none tracking-wide">
            {sposoName}
          </h1>
          <span className="font-script text-2xl sm:text-3xl text-[#CEB381] select-none my-1.5 leading-none">
            e
          </span>
          <h1 className="font-script text-5xl sm:text-6xl text-[#CEB381] select-none leading-none tracking-wide">
            {sposaName}
          </h1>
        </div>
        <div className="w-12 h-[1px] bg-[#FF4B55]/30 mx-auto my-5" />
        <p className="font-serif italic text-sm text-[#FFFFFF]/70 max-w-xs mx-auto leading-relaxed">
          Un'esperienza unica e interattiva per svelare i dettagli e celebrare insieme. Premi il sigillo per iniziare.
        </p>
      </div>

      {/* Main Interactive Envelope Envelope Container */}
      <div className="relative w-full max-w-md h-[340px] flex items-end justify-center">
        
        {/* ENVELOPE BACK & POCKET BOX */}
        <div className="absolute w-[320px] sm:w-[360px] h-[220px] bg-[#CEB381] rounded-b-lg shadow-xl z-10 overflow-visible border-b border-[#FF4B55]/20">
          
          {/* Inner pocket gradient shadow */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent rounded-b-lg" />

          {/* Paper invitation card (slides up) */}
          <motion.div
            initial={{ y: 0, opacity: 0 }}
            animate={
              isCardOut
                ? { y: -160, opacity: 1, scale: 1.05 }
                : isOpen
                ? { y: -30, opacity: 0.8, scale: 1 }
                : { y: 0, opacity: 0, scale: 0.95 }
            }
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            className="absolute left-4 right-4 h-[230px] bg-[#0D2C1E] rounded-md p-6 shadow-md border border-[#CEB381] flex flex-col items-center justify-between text-center select-none z-20"
          >
            <div className="flex flex-col items-center">
              <Heart className="w-4 h-4 text-[#FF4B55] mb-3" />
              <span className="text-[9px] font-display tracking-[0.3em] text-[#FF4B55] uppercase font-bold">
                L'Invito Ufficiale
              </span>
              <h2 className="font-display text-xl font-normal text-[#FFFFFF] mt-3 tracking-widest uppercase">
                Il Nostro Matrimonio
              </h2>
              <div className="w-6 h-[1px] bg-[#0D2C1E]/25 my-3" />
              <p className="font-serif italic text-xs text-[#FFFFFF]/70 leading-relaxed px-2">
                "La gioia è reale solo se condivisa con le persone amate."
              </p>
            </div>

            {/* Confirm Reveal Button inside physical card */}
            {isCardOut && (
              <motion.button
                id="enter-site-btn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={onOpened}
                className="w-full py-2.5 bg-[#FFFFFF] text-[#0D2C1E] font-sans tracking-[0.2em] text-[10px] font-bold rounded-none uppercase hover:bg-[#FF4B55] transition-all cursor-pointer border border-white/30"
              >
                Scopri l'Invito ➔
              </motion.button>
            )}
          </motion.div>

          {/* Diagonal triangular envelope pockets (Front flaps) */}
          {/* Left bottom corner flap */}
          <div className="absolute left-0 bottom-0 w-0 h-0 border-t-[110px] border-t-transparent border-l-[160px] sm:border-l-[180px] border-l-[#B59966] border-b-[110px] border-b-[#B59966] rounded-bl-lg z-25 pointer-events-none" />
          
          {/* Right bottom corner flap */}
          <div className="absolute right-0 bottom-0 w-0 h-0 border-t-[110px] border-t-transparent border-r-[160px] sm:border-r-[180px] border-r-[#B59966] border-b-[110px] border-b-[#B59966] rounded-br-lg z-25 pointer-events-none" />

          {/* Bottom center flap overlap */}
          <div className="absolute left-0 right-0 bottom-0 h-28 bg-gradient-to-t from-[#B59966]/50 to-transparent rounded-b-lg z-26 pointer-events-none" />
        </div>

        {/* ENVELOPE TOP FLAP */}
        {/* Flips up on open */}
        <motion.div
          initial={{ rotateX: 0 }}
          animate={isOpen ? { rotateX: 180 } : { rotateX: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute left-1/2 -ml-[160px] sm:-ml-[180px] bottom-[220px] w-[320px] sm:w-[360px] h-0 border-b-[110px] border-b-[#CEB381] border-l-[160px] sm:border-l-[180px] border-l-transparent border-r-[160px] sm:border-r-[180px] border-r-transparent origin-bottom z-30"
          style={{ backfaceVisibility: 'hidden' }}
        />

        {/* BRONZE WAX SEAL / OPENS FLAP */}
        {isSealed && (
          <motion.button
            id="wax-seal-btn"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenClick}
            className="absolute bottom-[95px] left-1/2 -ml-8 w-16 h-16 bg-[#FF4B55] rounded-full flex items-center justify-center shadow-md border-2 border-[#CEB381] cursor-pointer z-40"
          >
            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center animate-pulse">
              <Heart className="w-5 h-5 text-[#CEB381] fill-white/10" />
            </div>
          </motion.button>
        )}
      </div>

      {/* Sealed Instruction Hints */}
      {!isSealed && !isCardOut && (
        <span className="text-[9px] font-sans tracking-[0.3em] uppercase text-[#FF4B55] animate-pulse mt-6">
          Apertura sigillo ceralacca...
        </span>
      )}
    </div>
  );
}
