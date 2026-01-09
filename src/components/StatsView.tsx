import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shift, ShiftAssignment, Profile } from '../types';

interface StatsViewProps {
  shifts: Shift[];
  assignments: ShiftAssignment[];
  profiles: Profile[];
}

const StatsView: React.FC<StatsViewProps> = ({ shifts, assignments, profiles }) => {

  // Prepare Data: Shifts per Doctor
  const shiftsPerDoctor = profiles.map(profile => {
    const count = assignments.filter(a => a.profile_id === profile.id).length;
    return {
      name: profile.full_name.split(' ')[1] || profile.full_name, // Last name or first name
      shifts: count
    };
  }).filter(d => d.shifts > 0);

  // Prepare Data: Shifts Coverage
  const totalSlots = shifts.reduce((acc, curr) => acc + curr.quantity_needed, 0);
  const filledSlots = assignments.length;
  const emptySlots = totalSlots - filledSlots;

  const coverageData = [
    { name: 'Preenchido', value: filledSlots },
    { name: 'Vago', value: emptySlots },
  ];

  const COLORS = ['#2F4858', '#FCD34D']; // Primary, Alert

  return (
    <div className="p-6 pb-20">
      <h2 className="text-2xl font-bold text-primary dark:text-primaryLight mb-2">Dashboard Gestor</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Visão geral da escala mensal</p>

      {/* Coverage Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 mb-6 transition-colors">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">Cobertura da Escala</h3>
        <div className="h-48 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={coverageData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {coverageData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center space-x-6 mt-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#2F4858]"></div>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{filledSlots} Preenchidos</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#FCD34D]"></div>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{emptySlots} Vagos</span>
          </div>
        </div>
      </div>

      {/* Distribution Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">Plantões por Médico</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={shiftsPerDoctor}
              margin={{ top: 5, right: 30, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="shifts" fill="#2F4858" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatsView;