import React from 'react';

const Statistics = ({ stats, loading = false }) => {
  const statCards = [
    {
      title: 'Total Commandes',
      value: stats?.totalOrders || 0,
      icon: '',
      color: 'blue',
    },
    {
      title: 'En Attente',
      value: stats?.pending || 0,
      icon: '',
      color: 'amber',
    },
    {
      title: 'En Cours',
      value: stats?.inProgress || 0,
      icon: '',
      color: 'sky',
    },
    {
      title: 'Livrées',
      value: stats?.delivered || 0,
      icon: '',
      color: 'emerald',
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-slate-100 p-6 dark:bg-slate-800">
            <div className="animate-pulse">
              <div className="mb-2 h-4 w-3/4 rounded bg-slate-300 dark:bg-slate-600"></div>
              <div className="h-8 w-1/2 rounded bg-slate-300 dark:bg-slate-600"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => (
        <div key={index} className="rounded-lg bg-white p-6 shadow dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{card.title}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
            </div>
            <div className="text-3xl">{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Statistics;