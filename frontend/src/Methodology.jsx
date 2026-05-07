import React, { useState } from 'react';
import { Database, BarChart, ChevronDown, ChevronUp, Lock, Zap } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import slockLogo from './assets/slock_logo.png';

const MathSection = ({ title, formula, explanation }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-zinc-300 py-8">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center group"
      >
        <h4 className="text-2xl font-bold text-[#2D2924] group-hover:text-emerald-700 transition-colors tracking-tight">{title}</h4>
        {isOpen ? <ChevronUp className="text-emerald-600" /> : <ChevronDown className="text-zinc-400" />}
      </button>
      {isOpen && (
        <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#E9E4DB] p-8 rounded-[2rem] text-lg overflow-x-auto shadow-inner">
            <BlockMath math={formula} />
          </div>
          <p className="text-xl text-zinc-600 leading-relaxed font-medium">{explanation}</p>
        </div>
      )}
    </div>
  );
};

const Methodology = ({ navigateTo }) => {
  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#2D2924] font-sans selection:bg-emerald-500/30">
      
      {/* --- REPLICATED LANDING NAVBAR --- */}
      <nav className="flex items-center justify-between px-12 py-8 w-full border-b border-zinc-800/10">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigateTo('landing')}>
          <div className="w-10 h-10 bg-zinc-300 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-110">
            <img 
              src={slockLogo} 
              alt="Slock Logo" 
              className="w-15 h-15 object-contain" 
            />        
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase"><span className="text-emerald-500">Slock</span></span>
        </div>

        <div className="flex items-center gap-10">
          <div className="hidden md:flex gap-8 text-sm font-bold uppercase tracking-widest text-zinc-500">
            <button onClick={() => navigateTo('methodology')} className="text-emerald-600">Methodology</button>
          </div>
          <button 
            onClick={() => navigateTo('dashboard')}
            className="px-8 py-3 bg-[#2D2924] text-[#F5F2ED] rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-600 hover:-translate-y-1 transition-all"
          >
            Connect Portfolio
          </button>
        </div>
      </nav>

      <div className="max-w-[1800px] mx-auto px-12 py-24">
        
        {/* --- HEADER --- */}

        <header className="flex flex-col md:flex-row items-center justify-between px-2 pt-4 pb-32 w-full max-w-[1800px] mx-auto gap-12">
          
          <div className="w-full md:w-1/2 text-left">
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-10 leading-none">
              Our <br />
              <span className="text-emerald-800/60 italic font-serif lowercase">Methodology.</span>
            </h1>
            <p className="text-2xl text-zinc-600 leading-relaxed font-medium">
              Slock operates on radical transparency. We believe you should know exactly how your data is handled and how our engine calculates your path to the horizon.
            </p>
          </div>
          
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
          
          {/* --- PART 1: DATA & SECURITY --- */}
          <section className="space-y-20">
            <div className="group">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <Database size={32} />
              </div>
              <h3 className="text-4xl font-black mb-6 tracking-tight uppercase">Data Sourcing</h3>
              <p className="text-xl text-zinc-500 leading-relaxed font-medium">
                We pull historical data via the Yahoo Finance API. Every "Adjusted Close" price accounts for stock splits and dividend distributions, ensuring your Cumulative Returns are mathematically accurate.
              </p>
            </div>

            <div className="group">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 mb-8 shadow-sm group-hover:scale-110 transition-transform">
                <Lock size={32} />
              </div>
              <h3 className="text-4xl font-black mb-6 tracking-tight uppercase">Privacy-First</h3>
              <p className="text-xl text-zinc-500 leading-relaxed font-medium mb-8">
                Unlike traditional aggregators, Slock <span className="text-[#2D2924] font-bold">never</span> asks for your bank credentials. We prioritize your sovereignty.
              </p>
              <ul className="space-y-6">
                <li className="flex gap-4 items-start">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-3" />
                    <p className="text-lg text-zinc-600"><strong className="text-[#2D2924]">Local Storage:</strong> Your portfolio exists only in your browser's encrypted cache.</p>
                </li>
                <li className="flex gap-4 items-start">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-3" />
                    <p className="text-lg text-zinc-600"><strong className="text-[#2D2924]">Zero-Knowledge:</strong> We don't link identities to holdings. To us, you are just a deliberate investor.</p>
                </li>
              </ul>
            </div>
          </section>

          {/* --- PART 2: THE METRICS --- */}
          <section className="bg-white/50 p-12 rounded-[4rem] border border-white shadow-xl">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg shadow-emerald-500/20">
              <BarChart size={32} />
            </div>
            <h3 className="text-4xl font-black mb-10 tracking-tight uppercase">Financial Metrics</h3>
            
            <MathSection 
              title="Annualized Volatility"
              formula=" \sigma_{ann} = \text{std}(\text{returns}_{21d}) \times \sqrt{252} "
              explanation="Volatility measures the speed of price changes. We use a 21-day rolling window and annualize it by the square root of trading days in a year."
            />

            <MathSection 
              title="Cumulative Returns"
              formula=" \text{CR}_t = \prod_{i=1}^{t} (1 + R_i) - 1 "
              explanation="This calculates the total growth of your capital from the start, accurately compounding daily returns."
            />
          </section>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <footer className="p-12 text-center text-emerald-800/60 text-xs max-w-[1800px] mx-auto">
        <p>© 2026 SLOCK - All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Methodology;