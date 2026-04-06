import React from 'react';
import { Hourglass, ShieldCheck, Heart } from 'lucide-react';

const SlothScore = ({ portfolio }) => {
  // 1. Calculate Patience (Average Age)
  const calculatePatience = () => {
    if (portfolio.length === 0) return 0;
    const now = new Date().getTime();
    const ages = portfolio.map(p => (now - p.first_bought) / (1000 * 60 * 60 * 24 * 30)); // Months
    const avgAge = ages.reduce((a, b) => a + b, 0) / ages.length;
    
    // Score: 10 if held > 24 months, scales down to 1
    return Math.min(Math.max((avgAge / 24) * 10, 1), 10);
  };

  // 2. Calculate Diversification (Concentration)
  const calculateDiversification = () => {
    if (portfolio.length === 0) return 0;
    const totalValue = portfolio.reduce((sum, p) => sum + (p.volume * p.buy_price), 0);
    const weightsSquared = portfolio.map(p => Math.pow((p.volume * p.buy_price) / totalValue, 2));
    const hhi = weightsSquared.reduce((a, b) => a + b, 0); // 1 is max concentration
    
    // Invert HHI: 1 (monopoly) -> score 2, 0.1 (diversified) -> score 10
    return Math.min(Math.max((1 - hhi) * 10, 1), 10);
  };

  const patience = calculatePatience();
  const diversity = calculateDiversification();
  const totalSloth = (patience + diversity) / 2;

  const getFeedback = (score) => {
    if (score > 8) return "Legendary Sloth. Your patience is a superpower.";
    if (score > 5) return "Steady climber. You're finding your rhythm.";
    return "A bit restless! Remember: the best moves are often no moves.";
  };

  return (
    <div className="bg-black/60 border border-white rounded-[2.5rem] p-8 shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-xl">
          {totalSloth.toFixed(1)}
        </div>
        <div>
          <h4 className="text-sm text-lime-300 uppercase tracking-widest text-[#2D2924]">Overall Sloth Score</h4>
          <p className="text-xs font-medium text-emerald-700">{getFeedback(totalSloth)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter mb-2">
            <span className="flex items-center gap-1"><Hourglass size={12}/> Patience</span>
            <span>{patience.toFixed(1)}/10</span>
          </div>
          <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${patience * 10}%` }} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter mb-2">
            <span className="flex items-center gap-1"><ShieldCheck size={12}/> Allocation</span>
            <span>{diversity.toFixed(1)}/10</span>
          </div>
          <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${diversity * 10}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlothScore;