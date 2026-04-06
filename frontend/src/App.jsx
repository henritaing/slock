import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { RefreshCw, LayoutDashboard, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { CHART_COLORS } from './constants';

// Component Imports
import PortfolioInput from './components/PortfolioInput';
import DistributionChart from './components/DistributionChart';
import PerformanceChart from './components/PerformanceChart';
import PortfolioHealth from './components/PortfolioHealth';
import SlothScore from './components/SlothScore'; 
import LandingPage from './LandingPage';
import Methodology from './Methodology';
import ShockSimulator from './components/ShockSimulator';
import SectorComparison from './components/SectorPerformance';
import RiskAnalytics from './components/RiskAnalytics';
import Insights from './components/Insights';

// Image imports
import slockLogo from './assets/slock_logo.png'; 
import heroImage from './assets/hero_image.png';


const CollapsibleSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-800 rounded-2xl overflow-hidden bg-zinc-900/20 mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-zinc-900/40 hover:bg-gray-800/60 transition-colors"
      >
        <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-black">{title}</h3>
        <span className="text-emerald-500">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && <div className="p-6">{children}</div>}
    </div>
  );
};

const App = () => {
  const [view, setView] = useState('landing'); 
  const [activeTab, setActiveTab] = useState('dashboard'); // NEW: To toggle Dashboard vs Insights
  const [portfolio, setPortfolio] = useState([]); // Raw user input
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState('portfolio');
  const [benchmark, setBenchmark] = useState('None');
  const [period, setPeriod] = useState('12'); 
  const [globalStats, setGlobalStats] = useState({ beta: 1.0, alpha: 0.0 });

  const [selectedTickers, setSelectedTickers] = useState([]); // NEW: Filter state

  // NEW: Toggle function to be passed down
  const toggleTickerFilter = (ticker) => {
    setSelectedTickers(prev => 
      prev.includes(ticker) 
        ? prev.filter(t => t !== ticker) 
        : [...prev, ticker]
    );
  };

  const navigateTo = (newView) => {
    window.scrollTo(0, 0);
    setView(newView);
  };

  // --- LOGIC: AGGREGATE DUPLICATE TICKERS ---
  const displayPortfolio = useMemo(() => {
    const aggregated = portfolio.reduce((acc, item) => {
      const ticker = item.ticker.toUpperCase();
      const vol = parseFloat(item.volume) || 0;
      const price = parseFloat(item.buy_price) || 0;
      // Convert "YYYY-MM" to timestamp for math
      const dateValue = item.date ? new Date(item.date).getTime() : new Date().getTime();

      if (!acc[ticker]) {
        acc[ticker] = { 
          ...item, 
          ticker, 
          volume: vol, 
          buy_price: price, 
          first_bought: dateValue 
        };
      } else {
        const totalVol = acc[ticker].volume + vol;
        // Weighted Average Cost: ((V1*P1)+(V2*P2)) / (V1+V2)
        acc[ticker].buy_price = ((acc[ticker].volume * acc[ticker].buy_price) + (vol * price)) / totalVol;
        acc[ticker].volume = totalVol;
        // Keep the oldest date for Patience Score
        acc[ticker].first_bought = Math.min(acc[ticker].first_bought, dateValue);
      }
      return acc;
    }, {});
    return Object.values(aggregated);
  }, [portfolio]);

  const sectorAnalysis = useMemo(() => {
    if (!marketData) return [];
    
    const sectors = {};
    let totalValue = 0;

    displayPortfolio.forEach(item => {
      const tickerInfo = marketData[item.ticker];
      const sector = tickerInfo?.sector || 'Unknown';
      const currentPrice = tickerInfo?.[tickerInfo.length - 1]?.adj_close || 0;
      const value = item.volume * currentPrice;
      
      sectors[sector] = (sectors[sector] || 0) + value;
      totalValue += value;
    });

    return Object.entries(sectors).map(([name, value]) => ({
      name,
      value: parseFloat(((value / totalValue) * 100).toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [displayPortfolio, marketData]);

  
  useEffect(() => {
    const saved = localStorage.getItem('slock_portfolio');
    if (saved) setPortfolio(JSON.parse(saved));
  }, []);

  const handleSync = async (forceRefresh = false) => {
    const isActualRefresh = typeof forceRefresh === 'boolean' ? forceRefresh : false;
    if (displayPortfolio.length === 0) return;
    setLoading(true);

    try {
      const tickerList = displayPortfolio.map(p => p.ticker);
      const response = await axios.post('http://127.0.0.1:8000/api/metrics', {
        tickers: tickerList,
        benchmark: benchmark,
        period: period === 'max' ? 60 : parseInt(period),
        refresh: isActualRefresh
      });

      setMarketData(response.data.marketData);
      setGlobalStats(response.data.stats);
      localStorage.setItem('slock_portfolio', JSON.stringify(portfolio));
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    return displayPortfolio.reduce((acc, item) => {
      const tickerInfo = marketData?.[item.ticker];
      
      // NEW: Access the .last_price property from our new dictionary structure
      const currentPrice = tickerInfo?.last_price || 0;
      
      const volume = parseFloat(item.volume) || 0;
      const buyPrice = parseFloat(item.buy_price) || 0;
      
      const currentVal = volume * currentPrice;
      const investedVal = volume * buyPrice;

      return {
        invested: acc.invested + investedVal,
        current: acc.current + currentVal,
        pnl: acc.pnl + (currentVal - investedVal)
      };
    }, { invested: 0, current: 0, pnl: 0 });
  }, [displayPortfolio, marketData]);

  const totalPnLPercent = totals.invested > 0 
    ? ((totals.current - totals.invested) / totals.invested) * 100 
    : 0;

  if (view === 'landing') return <LandingPage onEnterDashboard={() => navigateTo('dashboard')} onGoToMethodology={() => navigateTo('methodology')} navigateTo={navigateTo} />;
  if (view === 'methodology') return <Methodology navigateTo={navigateTo} onEnterDashboard={() => navigateTo('dashboard')} />;

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-zinc-900 border-r border-zinc-800 transition-all duration-300 relative flex flex-col`}>
        <div className={`${!isSidebarOpen && 'hidden'} h-full flex flex-col pt-4`}>
          <div className="flex-1 overflow-y-auto">
            <PortfolioInput 
              displayPortfolio={displayPortfolio} 
              setPortfolio={setPortfolio} 
              rawPortfolio={portfolio}
              onSave={() => handleSync(false)} 
            />
          </div>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute -right-3 top-1/2 -translate-y-1/2 bg-zinc-800 border border-zinc-700 rounded-full p-1 z-50">
          {isSidebarOpen ? <ChevronLeft size={40} /> : <ChevronRight size={40} />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <nav className="h-20 border-b border-zinc-800 bg-black/40 flex items-center px-8 justify-between">
          <div className="flex items-center gap-8">
            <div 
              onClick={() => navigateTo('landing')} 
              className="flex items-center gap-3 cursor-pointer border-r border-zinc-800 pr-8"
            >
              <img 
                src={slockLogo} 
                alt="Slock Logo" 
                className="w-15 h-15 object-contain" 
              />
              <span className="text-2xl font-black tracking-tighter uppercase"><span className="text-emerald-500">Slock</span></span>
            </div>
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1800px] mx-auto space-y-8">
            {loading ? (
              <div className="h-[600px] flex flex-col items-center justify-center gap-4">
                <RefreshCw className="animate-spin text-emerald-500" size={48} />
                <p className="text-emerald-500 text-xs tracking-widest uppercase">Analyzing Alpha...</p>
              </div>
            ) : marketData ? (
              activeTab === 'dashboard' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* Dashboard Control Panel */}
                  <div className="flex flex-wrap items-center gap-6 mb-8 p-4 bg-zinc-900/40 border border-gray-800 rounded-2xl">
                    <div className="flex bg-black p-1 rounded-md border border-gray-800">
                      <button onClick={() => setViewMode('portfolio')} className={`px-3 py-1 text-[10px] font-bold rounded ${viewMode === 'portfolio' ? 'bg-gray-700 text-white' : 'text-emerald-500'}`}>PORTFOLIO</button>
                      <button onClick={() => setViewMode('detailed')} className={`px-3 py-1 text-[10px] font-bold rounded ${viewMode === 'detailed' ? 'bg-gray-700 text-white' : 'text-emerald-500'}`}>STOCKS</button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Benchmark</span>
                      <select value={benchmark} onChange={(e) => setBenchmark(e.target.value)} className="bg-black border border-gray-700 rounded-md px-2 py-1 text-xs text-white outline-none">
                        <option value="None">None</option>
                        <option value="SP500">S&P 500</option>
                        <option value="MSCI World">MSCI World</option>
                        <option value="CAC40">CAC 40</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Horizon</span>
                      <div className="flex bg-black p-1 rounded-md border border-gray-800">
                        {['6', '12', 'max'].map((p) => (
                          <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 text-[10px] font-bold rounded ${period === p ? 'bg-emerald-600 text-white' : 'text-emerald-500'}`}>
                            {p.toUpperCase()}{p !== 'max' && 'M'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-auto">
                      <button onClick={() => handleSync(true)} className="p-2 bg-gray-800 text-zinc-400 rounded-lg"><RefreshCw size={16} /></button>
                      <button onClick={() => handleSync(false)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase">Update Analysis</button>
                    </div>
                  </div>

                  {/* Existing Sections */}
                  <CollapsibleSection title="1. Portfolio Allocation & Value">
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                      <div className="xl:col-span-3 space-y-6">
                        <div className="bg-zinc-900/20 border border-gray-800 p-6 rounded-2xl">
                          <div className="flex-1 min-h-[300px]">
                            <DistributionChart 
                              marketData={marketData} 
                              portfolio={displayPortfolio} 
                              colors={CHART_COLORS} />
                          </div>
                          <SectorComparison 
                            marketData={marketData} 
                            portfolio={displayPortfolio} 
                            benchmark={benchmark} 
                            colors={CHART_COLORS} // New Colors
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-emerald-600/10 border border-emerald-500/20 p-5 rounded-xl">
                          <p className="text-[12px] text-emerald-400 font-bold uppercase mb-1">Total Value</p>
                          <p className="text-2xl font-mono font-bold">{totals.current.toFixed(2)}€</p>
                        </div>
                        <div className={`${totals.pnl >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} border p-5 rounded-xl`}>
                          <p className="text-[12px] text-emerald-400 font-bold uppercase mb-1">Total Gain/Loss</p>
                          <p className="text-2xl font-mono font-bold">{totals.pnl >= 0 ? '+' : ''}{totals.pnl.toFixed(2)}€</p>
                          <p className="text-xs font-bold opacity-70">{totalPnLPercent.toFixed(2)}%</p>
                        </div>
                        <SlothScore portfolio={displayPortfolio} />
                      </div>
                    </div>
                  </CollapsibleSection>
                  <CollapsibleSection title="3. Portfolio Health">
                    <PortfolioHealth 
                      marketData={marketData} 
                      portfolio={displayPortfolio} 
                      stats={globalStats} 
                      colors={CHART_COLORS}
                      benchmark={benchmark}
                    />
                    {benchmark !== 'None' && (
                      <div className="mt-12 border-t border-zinc-800 pt-12">
                        <ShockSimulator totals={totals} stats={globalStats} />
                      </div>
                    )}
                  </CollapsibleSection>

                  <CollapsibleSection title="4. Returns History"> 
                    <PerformanceChart 
                      marketData={marketData} 
                      portfolio={displayPortfolio} 
                      viewMode={viewMode} 
                      colors={CHART_COLORS} 
                      selectedTickers={selectedTickers} 
                      onTickerClick={toggleTickerFilter}
                    />
                  </CollapsibleSection>

                  <CollapsibleSection title="5. RSI & Volatility"> 
                    <RiskAnalytics 
                      marketData={marketData} 
                      portfolio={displayPortfolio} 
                      viewMode={viewMode} 
                      colors={CHART_COLORS} 
                      selectedTickers={selectedTickers} 
                      onTickerClick={toggleTickerFilter}
                    />
                  </CollapsibleSection>
                </div>
              ) : (
                <Insights 
                  marketData={marketData} 
                  portfolio={displayPortfolio} 
                  benchmark={benchmark} 
                />
              )
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center opacity-50">
                <LayoutDashboard size={64} className="mb-4 text-emerald-800" />
                <p>Add your first asset in the sidebar to begin.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;