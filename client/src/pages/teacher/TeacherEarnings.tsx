import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { formatINR, formatIST } from '../../lib/formatters';
import { TrendingUp, Download, Calendar, DollarSign, ArrowUpRight } from 'lucide-react';

export const TeacherEarnings: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchEarnings = () => {
    setLoading(true);
    let query = '/api/teacher/earnings';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) query += `?${params.toString()}`;

    api
      .get<any>(query)
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEarnings();
  }, [startDate, endDate]);

  const exportCSV = () => {
    if (!data?.entries || data.entries.length === 0) return;

    const headers = ['Date', 'Type', 'Gross (INR)', 'Platform Fee (INR)', 'Net Earning (INR)', 'Course', 'Payment ID'];
    const rows = data.entries.map((e: any) => [
      new Date(e.createdAt).toISOString(),
      e.type,
      (e.grossInPaise / 100).toFixed(2),
      (e.platformFeeInPaise / 100).toFixed(2),
      (e.teacherNetInPaise / 100).toFixed(2),
      e.order?.course?.title || 'N/A',
      e.razorpayPaymentId || 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cyberforge_earnings_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = data?.summary || { grossPaise: 0, platformFeePaise: 0, netPaise: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Earnings & Financial Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track gross sales, platform fees, and net payouts across all your cybersecurity courses.
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={!data?.entries?.length}
          className="cyber-btn-outline text-xs px-4 py-2"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="cyber-card p-4 flex flex-col sm:flex-row items-center gap-4 text-xs">
        <span className="font-mono text-slate-400 uppercase text-[11px] flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Date Filter:
        </span>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="cyber-input text-xs py-1.5 font-mono"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="cyber-input text-xs py-1.5 font-mono"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="cyber-card p-5">
          <span className="text-xs font-mono text-slate-400 uppercase">Gross Student Sales</span>
          <p className="text-2xl font-extrabold font-mono text-white mt-1">
            {formatINR(summary.grossPaise, true)}
          </p>
        </div>

        <div className="cyber-card p-5">
          <span className="text-xs font-mono text-slate-400 uppercase">Platform Fee (0%)</span>
          <p className="text-2xl font-extrabold font-mono text-slate-400 mt-1">
            {formatINR(summary.platformFeePaise, true)}
          </p>
        </div>

        <div className="cyber-card p-5 border-emerald-500/30">
          <span className="text-xs font-mono text-emerald-400 uppercase">Net Instructor Earnings</span>
          <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
            {formatINR(summary.netPaise, true)}
          </p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="cyber-card overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Itemized Transaction Ledger</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading ledger entries...</div>
        ) : !data?.entries?.length ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No transaction records found for the selected period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0E1524] text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Gross</th>
                  <th className="p-4">Net Earning</th>
                  <th className="p-4">Payment ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data.entries.map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-[11px] text-slate-400">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${entry.type === 'PAYMENT' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="p-4 font-sans text-white">{entry.order?.course?.title || 'Course Sale'}</td>
                    <td className="p-4">{formatINR(entry.grossInPaise, true)}</td>
                    <td className="p-4 text-emerald-400 font-bold">{formatINR(entry.teacherNetInPaise, true)}</td>
                    <td className="p-4 text-slate-500 text-[11px]">{entry.razorpayPaymentId || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
