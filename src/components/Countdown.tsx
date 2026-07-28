/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

interface CountdownProps {
  targetDateStr: string; // ISO string format 'YYYY-MM-DDTHH:mm:ss'
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export default function Countdown({ targetDateStr }: CountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(targetDateStr) - +new Date();
      
      if (difference <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      setTimeRemaining({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isPast: false,
      });
    };

    calculateTime();
    const intervalId = setInterval(calculateTime, 1000);

    return () => clearInterval(intervalId);
  }, [targetDateStr]);

  const timeBlocks = [
    { label: 'Giorni', value: timeRemaining.days },
    { label: 'Ore', value: timeRemaining.hours },
    { label: 'Minuti', value: timeRemaining.minutes },
    { label: 'Secondi', value: timeRemaining.seconds },
  ];

  if (timeRemaining.isPast) {
    return (
      <div id="countdown-completed" className="bg-[#13442D] rounded-none p-8 border border-[#CEB381] text-center max-w-md mx-auto my-6">
        <span className="text-2xl block mb-2">✦</span>
        <h3 className="font-serif text-xl font-light text-[#FFFFFF] tracking-wide">Oggi si Celebra</h3>
        <p className="font-serif italic text-xs text-[#FFFFFF]/70 mt-2">
          Il grande giorno è arrivato. Viva gli Sposi!
        </p>
      </div>
    );
  }

  return (
    <div id="countdown-ticker" className="bg-transparent border-t border-white/10 pt-8 pb-4 max-w-md mx-auto my-6 text-center">
      <span className="text-[10px] font-sans tracking-[0.3em] text-[#FF4B55] uppercase block mb-5 font-bold">
        IL CONTO ALLA ROVESCIA
      </span>
      
      <div className="flex justify-between items-center px-4 sm:px-8">
        {timeBlocks.map((block) => (
          <div key={block.label} className="flex flex-col items-center flex-1">
            <span className="font-serif text-4xl sm:text-5xl font-light text-[#FFFFFF] select-all tracking-tight">
              {String(block.value).padStart(2, '0')}
            </span>
            <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#FFFFFF]/60 mt-2 font-medium">
              {block.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
