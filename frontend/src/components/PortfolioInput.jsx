import React from 'react';
import { Trash2, Plus, Calendar, Edit2 } from 'lucide-react';
import { TICKER_MAP } from '../constants';

const PortfolioInput = ({ displayPortfolio, setPortfolio, rawPortfolio, onSave, onStartSearch, onEdit }) => {
  return (
    <div className="p-4 flex flex-col h-full bg-zinc-900 overflow-hidden">
      <button 
        onClick={onStartSearch}
        className="w-full bg-emerald-600/10 border border-emerald-500/30 text-emerald-500 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600/20 transition-all mb-8 shadow-lg shadow-emerald-900/10"
      >
        <Plus size={14} /> Add New Position
      </button>

      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
        <p className="text-[11px] font-black text-zinc-500 tracking-[0.2em] uppercase mb-4 px-1">Active Positions</p>
        {displayPortfolio.map((item) => (
          <div key={item.ticker} className="group bg-black/20 border border-zinc-800/50 p-4 rounded-xl hover:border-zinc-600 transition-all">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                {/* Flex container to keep Ticker and Name on the same line */}
                <div className="flex items-center gap-2">
                  <p className="font-mono font-bold text-sm text-white">{item.ticker}</p>
                  {/* Fallback to Ticker if Name is somehow still missing */}
                  <p className="text-[10px] text-zinc-500 font-medium truncate max-w-[120px]">
                    {item.name || ""}
                  </p>
                </div>

                <p className="text-[10px] text-zinc-500 font-medium">
                  {item.volume.toLocaleString()} shares @ {Math.round(item.buy_price)}€
                </p>
                
                <div className="flex items-center gap-1 text-[10px] text-emerald-500/60 font-bold italic">
                  <Calendar size={10} /> {item.date || '---'}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => onEdit(item)}
                  className="p-1 text-zinc-600 hover:text-emerald-500 transition-colors"
                  title="Edit Position"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => setPortfolio(rawPortfolio.filter(p => p.id !== item.id))}
                  className="p-1 text-zinc-600 hover:text-red-500 transition-colors"
                  title="Delete Position"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-zinc-800 mt-auto">
        <button onClick={onSave} className="w-full bg-[#F5F2ED] text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl">
          Refresh Analytics
        </button>
      </div>
    </div>
  );
};

export default PortfolioInput;