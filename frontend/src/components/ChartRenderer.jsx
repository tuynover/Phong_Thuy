import React from 'react';
import ZiweiChart from './ZiweiChart';

// Đăng ký các đồ hình vẽ biểu đồ học thuật
const chartRegistry = {
  tu_vi: ZiweiChart,
  ziwei: ZiweiChart
};

const ChartRenderer = ({ system, chartData }) => {
  const Component = chartRegistry[system];
  
  if (!Component) {
    return (
      <div className="p-12 bg-white/40 border border-slate-200 rounded-3xl text-center text-slate-400 backdrop-blur-sm">
        Đồ hình hệ thống '{system}' chưa được tích hợp hoặc đang tải.
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-300">
      <Component chartData={chartData} />
    </div>
  );
};

export default ChartRenderer;
