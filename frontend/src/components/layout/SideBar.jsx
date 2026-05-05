import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PortfolioInput from '../PortfolioInput';

const Sidebar = ({ 
  isOpen, 
  setIsOpen, 
  displayPortfolio, 
  setPortfolio, 
  rawPortfolio, 
  onSave, 
  onStartSearch,
  onEdit
}) => {
  return (
    <aside className={`${isOpen ? 'w-80' : 'w-0'} bg-zinc-900 border-r border-zinc-800 transition-all duration-300 relative flex flex-col z-40`}>
      <div className={`${!isOpen && 'hidden'} h-full flex flex-col`}>
        <div className="flex-1 overflow-hidden pt-4">
          <PortfolioInput 
            displayPortfolio={displayPortfolio} 
            setPortfolio={setPortfolio} 
            rawPortfolio={rawPortfolio}
            onSave={onSave} 
            onStartSearch={onStartSearch} 
            onEdit={onEdit}
          />
        </div>
      </div>
      
      {/* The Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-zinc-800 border border-zinc-700 rounded-full p-1 z-50 text-zinc-400 hover:text-emerald-500 transition-colors"
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </aside>
  );
};

export default Sidebar;