import React from 'react';
import slockLogo from '../../assets/slock_logo.png';

const DashboardHeader = ({ onNavigate }) => {
  return (
    <nav className="h-20 border-b border-zinc-800 bg-black/40 flex items-center px-8 justify-between backdrop-blur-md z-30">
      <div className="flex items-center gap-8">
        <div 
          onClick={() => onNavigate('landing')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img 
            src={slockLogo} 
            alt="Slock Logo" 
            className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" 
          />
          <span className="text-2xl font-black tracking-tighter uppercase">
            <span className="text-emerald-500">Slock</span>
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Market Live</span>
      </div>
    </nav>
  );
};

export default DashboardHeader;