"use client";

import { useEffect, useState } from "react";

interface DailyRevenue {
  day: string;
  orders_count: number;
  gross_revenue: number;
  net_revenue: number;
}

interface SalesChartProps {
  data: DailyRevenue[];
}

export function SalesChart({ data }: SalesChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.net_revenue), 1);

  return (
    <div className="rounded-xl border border-black/10 bg-white p-6">
      <h3 className="mb-4 text-lg font-bold">Revenus quotidiens (30 derniers jours)</h3>
      <div className="relative h-48">
        <div className="absolute inset-0 flex items-end justify-between gap-1">
          {data.map((item, index) => {
            const height = (item.net_revenue / maxRevenue) * 100;
            const date = new Date(item.day);
            const isToday = index === 0;

            return (
              <div
                key={item.day}
                className="group relative flex-1"
              >
                <div
                  className={`w-full rounded-t transition-all hover:opacity-80 ${
                    isToday ? "bg-gradient-to-t from-cyan to-violet" : "bg-black/20"
                  }`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
{/* Tooltip */}
                <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white group-hover:block">
                  <p className="font-medium">{date.toLocaleDateString("fr-FR")}</p>
                  <p className="text-cyan">{item.net_revenue.toFixed(2)} FCFA</p>
                  <p className="text-black/60">{item.orders_count} commandes</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex justify-between text-xs text-black/40">
        <span>{data[data.length - 1]?.day ? new Date(data[data.length - 1].day).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : ""}</span>
        <span>Aujourd &#8212; hui</span>
      </div>
    </div>
  );
}
