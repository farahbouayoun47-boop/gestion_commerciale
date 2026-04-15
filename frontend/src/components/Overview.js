import { calcStats, formatCurrency, getStatusSpan } from '../utils';

const Overview = ({ orders, clients }) => {
  const stats = calcStats(orders);
  const recentOrders = orders.slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-6 shadow-soft">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Commandes</p>
          <p className="mt-4 text-4xl font-semibold text-white">{stats.totalOrders}</p>
          <p className="mt-2 text-slate-400">Commandes créées</p>
        </article>
        <article className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-6 shadow-soft">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">En attente</p>
          <p className="mt-4 text-4xl font-semibold text-white">{stats.pending}</p>
          <p className="mt-2 text-slate-400">Besoin de traitement</p>
        </article>
        <article className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-6 shadow-soft">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">En cours</p>
          <p className="mt-4 text-4xl font-semibold text-white">{stats.inProgress}</p>
          <p className="mt-2 text-slate-400">Expédition en cours</p>
        </article>
        <article className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-6 shadow-soft">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Revenu</p>
          <p className="mt-4 text-4xl font-semibold text-white">{formatCurrency(stats.revenue)}</p>
          <p className="mt-2 text-slate-400">Total estimé</p>
        </article>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Commandes récentes</p>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">Dernières 4</span>
          </div>
          <div className="mt-6 space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">{order.numero}</p>
                    <p className="mt-1 text-white">{order.client}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusSpan(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                  <span>{order.date}</span>
                  <span>{formatCurrency(order.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-6 shadow-soft">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Top clients</p>
          <div className="mt-6 space-y-3">
            {clients.slice(0, 3).map((client) => (
              <div key={client.id} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                <p className="font-semibold text-white">{client.name}</p>
                <p className="text-slate-400">{client.company}</p>
                <p className="mt-2 text-sm text-slate-400">Total dépensé {formatCurrency(client.totalSpend)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Overview;
