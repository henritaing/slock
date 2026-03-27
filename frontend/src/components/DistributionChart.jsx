import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const DistributionChart = ({ marketData, portfolio }) => {
  const COLORS = ['#f5f5f4', '#3b82f6', '#1e293b', '#64748b', '#94a3b8', '#334155'];

  // Calculate Asset Totals
  const assetData = portfolio.map(item => {
    const tickerData = marketData?.[item.ticker];
    const hasData = Array.isArray(tickerData) && tickerData.length > 0;
    const lastPrice = hasData ? tickerData[tickerData.length - 1].adj_close : 0;
    return {
      name: item.ticker,
      value: parseFloat((parseFloat(item.volume) * lastPrice).toFixed(2))
    };
  }).filter(item => item.value > 0);

  // Calculate Sector Totals
  const sectorMap = {};
  portfolio.forEach(item => {
    const tickerData = marketData?.[item.ticker];
    if (Array.isArray(tickerData) && tickerData.length > 0) {
      const lastPrice = tickerData[tickerData.length - 1].adj_close;
      const sector = tickerData[0].sector || 'Other';
      const value = parseFloat(item.volume) * lastPrice;
      sectorMap[sector] = (sectorMap[sector] || 0) + value;
    }
  });

  const sectorData = Object.entries(sectorMap).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2))
  })).sort((a, b) => b.value - a.value);

  const totalValue = assetData.reduce((acc, curr) => acc + curr.value, 0);

  const renderDonut = (data, title) => (
    <div className="flex flex-col items-center w-full">
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold">{title}</p>
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => {
                const percentage = ((value / totalValue) * 100).toFixed(2);
                return [`${value.toLocaleString()}€ (${percentage}%)`, "Allocation"];
              }}
              contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #1e293b', borderRadius: '8px' }}
              itemStyle={{ color: '#f5f5f4', fontSize: '12px' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
      {renderDonut(assetData, "By Asset")}
      {renderDonut(sectorData, "By Sector")}
    </div>
  );
};

export default DistributionChart;