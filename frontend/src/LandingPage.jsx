import React from 'react';
import { Zap, ArrowRight, BarChart3 } from 'lucide-react';

const LandingPage = ({ onEnterDashboard, navigateTo }) => {
  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#2D2924] selection:bg-emerald-500/30 font-sans">
      
      {/* --- WIDE NAVBAR --- */}
      <nav className="flex items-center justify-between px-12 py-8 w-full border-b border-zinc-800/50">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={onEnterDashboard}>
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-transform group-hover:scale-110">
             <span className="text-black font-black text-2xl">S</span>
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase">Slock<span className="text-emerald-500">.</span></span>
        </div>

        <div className="flex items-center gap-10">
          <div className="hidden md:flex gap-8 text-sm font-bold uppercase tracking-widest text-zinc-500">
            <button onClick={() => navigateTo('methodology')} className="hover:text-emerald-400 transition-colors">Methodology</button>
          </div>
          <button 
            onClick={onEnterDashboard}
            className="px-8 py-3 bg-zinc-300 text-black rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-400 hover:-translate-y-1 transition-all border-b border-zinc-800/50"
          >
            Connect Portfolio
          </button>
        </div>
      </nav>

      {/* --- SPLIT HERO SECTION --- */}
      <header className="flex flex-col md:flex-row items-center justify-between px-18 pt-10 pb-32 w-full max-w-[1800px] mx-auto gap-12">
        <div className="w-full md:w-1/2 text-left">
          <h1 className="text-7xl md:text-[100px] font-black tracking-tighter mb-8 leading-[0.85]">
            Portfolio <br />management <br />
            <span className="text-emerald-800/60 italic font-serif lowercase">for sloths.</span>
          </h1>
          <h3 className="text-2xl text-zinc-400 mb-12 max-w-lg leading-relaxed font-medium">
            Buy and forget! Look at the horizon and make an educated decision. Tools reserved for quants, designed for you.
          </h3>
          <button 
            onClick={onEnterDashboard}
            className="group relative px-10 py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-xl hover:scale-105 transition-all shadow-2xl shadow-emerald-500/40"
          >
            <span className="flex items-center gap-3 uppercase tracking-tighter">
              Create & Manage <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </span>
          </button>
        </div>

        {/* Hero Image Placeholder (3D Sloth) */}
        <div className="w-full md:w-1/2 h-[600px] bg-zinc-900/50 border border-zinc-800 rounded-[4rem] relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
            <span className="text-zinc-700 text-sm font-mono uppercase tracking-[0.3em] rotate-90 underline underline-offset-8">
              [3D Sloth Clay Visual Placeholder]
            </span>
        </div>
      </header>

      {/* --- WIDE BENTO SECTION --- */}
      <section className="px-12 py-20 w-full max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-3 bg-zinc-200/40 border border-zinc-800 p-12 rounded-[3.5rem] relative overflow-hidden h-[500px]">
             <div className="relative z-10">
                <p className="text-emerald-500 font-black text-sm uppercase tracking-[0.2em] mb-4">Sloth Portfolio</p>
                <h4 className="text-5xl font-bold mb-6 tracking-tighter leading-none">Visualize your <br/> ratio risk / returns</h4>
                <p className="text-zinc-500 max-w-sm text-lg font-medium">Stop guessing. See how your assets actually behave under market pressure.</p>
             </div>
             <div className="absolute bottom-0 right-0 w-[70%] h-[70%] bg-zinc-800 rounded-tl-[4rem] border-t border-l border-zinc-700 p-8">
                <div className="w-full h-full bg-zinc-900 rounded-3xl border border-dashed border-zinc-700 flex items-center justify-center text-emerald-800/60 text-xs italic">
                    [Live Chart Preview Placeholder]
                </div>
             </div>
          </div>

          <div className="bg-emerald-600 p-10 rounded-[3.5rem] text-white flex flex-col justify-between hover:bg-emerald-500 transition-colors cursor-pointer group">
            <BarChart3 size={56} strokeWidth={2.5} className="group-hover:-translate-y-2 transition-transform" />
            <div>
                <h4 className="text-4xl font-black mb-4 leading-none uppercase tracking-tighter">Quant <br/> Tools</h4>
                <p className="text-emerald-100 text-sm font-medium leading-relaxed opacity-80">Professional grade RSI and Volatility metrics for the deliberate holder.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- THE 3-STEP PATH --- */}
      <section className="px-6 py-24 bg-white text-black rounded-[3rem] mx-4 mb-10 max-w-[1800px] mx-auto">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                <div className="space-y-4">
                    <span className="text-5xl font-black text-zinc-200">01</span>
                    <h5 className="text-2xl font-bold">Create your twin <br/> virtual portfolio</h5>
                    <p className="text-zinc-500">Import your holdings once. Slock mirrors them to keep your data clean and safe.</p>
                </div>
                <div className="space-y-4">
                    <span className="text-5xl font-black text-zinc-200">02</span>
                    <h5 className="text-2xl font-bold italic">Visualize the <br/> unseen</h5>
                    <p className="text-zinc-500">Deep dive into Alpha and Beta metrics. Understand if you are truly beating the market.</p>
                </div>
                <div className="space-y-4">
                    <span className="text-5xl font-black text-zinc-200">03</span>
                    <h5 className="text-2xl font-bold font-serif uppercase tracking-tight">Make better <br/> decisions</h5>
                    <p className="text-zinc-500">Move slow. Think fast. Execute with the confidence of a professional quant.</p>
                </div>
            </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="p-12 text-center text-emerald-800/60 text-xs max-w-[1800px] mx-auto">
        <p>© 2026 SLOCK - All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;