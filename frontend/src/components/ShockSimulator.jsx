import React, { useState } from 'react';
import { AlertTriangle, TrendingDown, Zap } from 'lucide-react';

const ShockSimulator = ({ totals, stats }) => {
  const [crashIntensity, setCrashIntensity] = useState(20); // Default 20% drop
  const beta = stats?.beta || 1.0;

  // Math: Portfolio Drop = Market Drop * Beta
  const estimatedDropPercent = crashIntensity * beta;
  const estimatedLossValue = totals.current * (estimatedDropPercent / 100);

  return (
    <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/20 rounded-lg text-rose-500">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-rose-200">Stress Test: Market Shock</h3>
            <p className="text-[10px] text-rose-200/50 uppercase">Simulating portfolio resilience</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <span className="text-[10px] font-bold text-rose-300">Market Drop: -{crashIntensity}%</span>
           <input 
            type="range" min="5" max="60" step="10" 
            value={crashIntensity} 
            onChange={(e) => setCrashIntensity(e.target.value)}
            className="accent-rose-500 w-32"
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-black/40 rounded-xl border border-rose-500/20">
          <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Portfolio Impact</p>
          <p className="text-xl font-mono font-bold text-rose-500">-{estimatedDropPercent.toFixed(1)}%</p>
        </div>

        <div className="p-4 bg-black/40 rounded-xl border border-rose-500/20">
          <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Value Loss</p>
          <p className="text-xl font-mono font-bold text-rose-500">-{estimatedLossValue.toLocaleString(undefined, {maximumFractionDigits:0})}€</p>
        </div>

        <div className="p-4 bg-black/40 rounded-xl border border-rose-500/20">
          <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Resilience Rating</p>
          <p className={`text-xl font-bold ${beta > 1.2 ? 'text-orange-500' : 'text-emerald-500'}`}>
            {beta > 1.2 ? 'Fragile' : beta < 0.8 ? 'Fortified' : 'Standard'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
        <AlertTriangle size={14} className="text-rose-500 mt-0.5" />
        <p className="text-[10px] text-rose-200/70 leading-relaxed">
          Based on your current **Beta of {beta.toFixed(2)}**, a {crashIntensity}% market correction could wipe out approximately **{estimatedLossValue.toLocaleString()}€** of your unrealized gains. Do you have the cash reserves to hold through this?
        </p>
      </div>
    </div>
  );
};

export default ShockSimulator;