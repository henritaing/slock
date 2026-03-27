import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCw, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';

// Component Imports
import PortfolioInput from './components/PortfolioInput';
import DistributionChart from './components/DistributionChart';
import PerformanceChart from './components/PerformanceChart';
import PortfolioHealth from './components/PortfolioHealth';
import RiskAnalytics from './components/RiskAnalytics';

// Helper component stays outside
const CollapsibleSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-800 rounded-2xl overflow-hidden bg-gray-900/20 mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-900/40 hover:bg-gray-800/60 transition-colors"
      >
        <h3 className="text-xs uppercase tracking-widest text-gray-400 font-black">{title}</h3>
        <span className="text-gray-500">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && <div className="p-6">{children}</div>}
    </div>
  );
};

const App = () => {
  // 1. ALL HOOKS MUST BE HERE
  const [portfolio, setPortfolio] = useState([]);
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // New States moved inside the component
  const [viewMode, setViewMode] = useState('portfolio'); // 'portfolio' or 'detailed'
  const [benchmark, setBenchmark] = useState('None');
  const [period, setPeriod] = useState('12'); 
  
  useEffect(() => {
    const saved = localStorage.getItem('adviz_portfolio');
    if (saved) setPortfolio(JSON.parse(saved));
  }, []);

  // 2. Updated handleSync logic inside the component
  const handleSync = async () => {
    if (portfolio.length === 0) return;
    setLoading(true);
    try {
      const tickerList = portfolio.map(p => p.ticker);
      const response = await axios.post('http://127.0.0.1:8000/api/metrics', {
        tickers: tickerList,
        benchmark: benchmark,
        period: period === 'max' ? 60 : parseInt(period)
      });
      setMarketData(response.data);
      localStorage.setItem('adviz_portfolio', JSON.stringify(portfolio));
    } catch (error) {
      console.error("Sync failed:", error);
      alert("Backend connection failed. Make sure your FastAPI server is running.");
    } finally {
      setLoading(false);
    }
  };

  const totals = portfolio.reduce((acc, item) => {
    const tickerData = marketData?.[item.ticker];
    const currentPrice = (Array.isArray(tickerData) && tickerData.length > 0) 
      ? tickerData[tickerData.length - 1].adj_close : 0;
    const volume = parseFloat(item.volume) || 0;
    const buyPrice = parseFloat(item.buy_price) || 0;
    return {
      invested: acc.invested + (volume * buyPrice),
      current: acc.current + (volume * currentPrice),
      pnl: acc.pnl + ((currentPrice - buyPrice) * volume)
    };
  }, { invested: 0, current: 0, pnl: 0 });

  const totalPnLPercent = totals.invested > 0 ? ((totals.current - totals.invested) / totals.invested) * 100 : 0;

  return (
    <div className="flex h-screen bg-brand-black text-brand-beige overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-gray-900 border-r border-gray-800 transition-all duration-300 relative flex flex-col`}>
        <div className={`${!isSidebarOpen && 'hidden'} h-full flex flex-col`}>
          <div className="p-6 border-b border-gray-800">
             <span className="text-xl font-black tracking-tighter">ADVIZ<span className="text-blue-500">.</span></span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PortfolioInput 
              portfolio={portfolio} 
              setPortfolio={setPortfolio} 
              onSave={handleSync} 
            />
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-gray-800 border border-gray-700 rounded-full p-1 z-50 hover:bg-blue-600 transition-colors"
        >
          {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <nav className="h-16 border-b border-gray-800 bg-black/20 flex items-center px-8 justify-between">
          <div className="flex gap-6 text-sm font-medium">
            <button onClick={() => setActivePage('dashboard')} className={activePage === 'dashboard' ? 'text-blue-500' : 'text-gray-500'}>Dashboard</button>
            <button className="text-gray-700 cursor-not-allowed">Metrics</button>
          </div>
          <div className="text-[10px] font-mono text-gray-600 px-3 py-1 rounded-full border border-gray-800">
            {totals.current.toLocaleString()}€ TOTAL MKT VAL
          </div>
        </nav>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-8">
            
            {loading ? (
              <div className="h-[600px] flex flex-col items-center justify-center gap-4">
                <RefreshCw className="animate-spin text-blue-500" size={48} />
                <p className="text-gray-500 animate-pulse text-xs tracking-widest uppercase">Fetching Market Signals...</p>
              </div>
            ) : marketData ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Control Panel */}
                <div className="flex flex-wrap items-center gap-6 mb-8 p-4 bg-gray-900/40 border border-gray-800 rounded-2xl">
                  <div className="flex bg-black p-1 rounded-md border border-gray-800">
                    <button
                      onClick={() => setViewMode('portfolio')}
                      className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${viewMode === 'portfolio' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      PORTFOLIO
                    </button>
                    <button
                      onClick={() => setViewMode('detailed')}
                      className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${viewMode === 'detailed' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      STOCKS
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Benchmark</span>
                    <select 
                      value={benchmark}
                      onChange={(e) => setBenchmark(e.target.value)}
                      className="bg-black border border-gray-700 rounded-md px-2 py-1 text-xs outline-none focus:border-blue-500 text-white"
                    >
                      <option value="None">None</option>
                      <option value="SP500">S&P 500</option>
                      <option value="MSCI World">MSCI World</option>
                      <option value="CAC40">CAC 40</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Horizon</span>
                    <div className="flex bg-black p-1 rounded-md border border-gray-700">
                      {['6', '12', '24', 'max'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriod(p)}
                          className={`px-3 py-1 text-[10px] font-bold rounded ${period === p ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          {p.toUpperCase()}{p !== 'max' && 'M'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleSync}
                    className="ml-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Update Analysis
                  </button>
                </div>

                <CollapsibleSection title="1. Portfolio Allocation & Value">
                  <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    <div className="xl:col-span-3 bg-gray-900/20 border border-gray-800 p-6 rounded-2xl">
                      <DistributionChart marketData={marketData} portfolio={portfolio} />
                    </div>
                    <div className="space-y-4">
                      <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-xl">
                        <p className="text-[12px] text-blue-400 font-bold uppercase mb-1">Portfolio Value</p>
                        <p className="text-2xl font-mono font-bold">{totals.current.toLocaleString()}€</p>
                      </div>
                      <div className={`${totals.pnl >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} border p-5 rounded-xl`}>
                        <p className={`text-[12px] font-bold uppercase mb-1 ${totals.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>Unrealized PnL</p>
                        <p className="text-2xl font-mono font-bold">{totals.pnl >= 0 ? '+' : ''}{totals.pnl.toLocaleString()}€</p>
                        <p className="text-xs font-bold opacity-70">{totalPnLPercent.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="2. Portfolio Health">
                  <PortfolioHealth marketData={marketData} portfolio={portfolio} />
                </CollapsibleSection>

                <CollapsibleSection title="3. RSI (14 days window) & Volatility" defaultOpen={false}>
                  <RiskAnalytics 
                    marketData={marketData} 
                    portfolio={portfolio} 
                    viewMode={viewMode} 
                  />
                </CollapsibleSection>

                <CollapsibleSection title="4. Returns evolution"> 
                  <PerformanceChart 
                    marketData={marketData} 
                    portfolio={portfolio} 
                    viewMode={viewMode} 
                  />
                </CollapsibleSection>

              </div>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center opacity-50">
                <LayoutDashboard size={64} className="mb-4 text-gray-800" />
                <p>Open the Sidebar to add holdings and sync.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;