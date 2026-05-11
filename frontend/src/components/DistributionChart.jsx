import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const getLastPrice = (info) => {
  if (!info) return 0;
  if (info.last_price) return info.last_price;
  const h = info.history || [];
  return h.length > 0 ? h[h.length - 1].adj_close : 0;
};

const DistributionChart = ({ marketData, portfolio, colors }) => {
  const { assetData, sectorData } = useMemo(() => {
  const assets = portfolio.map(item => {
    const tickerInfo = marketData?.[item.ticker];
    const history = tickerInfo?.history || [];
    const lastPrice = getLastPrice(tickerInfo);
    return { name: item.ticker, value: parseFloat((item.volume * lastPrice).toFixed(2)) };
  }).filter(item => item.value > 0);

  const sectorMap = {};
  portfolio.forEach(item => {
    const tickerInfo = marketData?.[item.ticker];
    const sector = tickerInfo?.sector || 'Other/ETF';
    const history = tickerInfo?.history || [];
    const lastPrice = getLastPrice(tickerInfo);
    sectorMap[sector] = (sectorMap[sector] || 0) + (item.volume * lastPrice);
  });

  const sectors = Object.entries(sectorMap)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value);

  return { assetData: assets, sectorData: sectors };
}, [portfolio, marketData]);

  const sectorData = Object.entries(sectorMap)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value);

  const renderDonut = (data, title) => (
    <div className="flex flex-col items-center w-full">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-6 font-black">{title}</p>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={65}
              outerRadius={85}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              isAnimationActive={false} // Keep it feeling smooth
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  // FIX: Use the global colors passed from App.jsx
                  fill={colors[index % colors.length]} 
                  className="outline-none" 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name) => [`${value.toLocaleString()}€`, name]}
              contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', fontSize: '12px' }}
              itemStyle={{ color: '#10b981' }}
            />
            <Legend 
              verticalAlign="bottom" 
              iconType="circle" 
              wrapperStyle={{ fontSize: '10px', paddingTop: '20px', textTransform: 'uppercase' }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full py-4">
      {renderDonut(assetData, "Asset Concentration")}
      {renderDonut(sectorData, "Sector Exposure")}
    </div>
  );
};

export default DistributionChart;