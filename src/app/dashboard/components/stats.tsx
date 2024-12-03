import React from 'react';
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const StatsOverview = () => {
  const monthlyData = [
    { name: 'Gen', budgets: 4, approved: 3, value: 12000 },
    { name: 'Feb', budgets: 6, approved: 4, value: 15000 },
    { name: 'Mar', budgets: 5, approved: 3, value: 9000 },
    { name: 'Apr', budgets: 8, approved: 6, value: 20000 },
  ];

  const clientStats = [
    { name: 'Acme Inc', value: 25000 },
    { name: 'Tech Corp', value: 18000 },
    { name: 'Global Ltd', value: 15000 },
    { name: 'Local Co', value: 12000 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Totale Preventivi</h3>
          <div className="text-3xl font-bold">23</div>
          <p className="text-sm text-gray-500">+15% rispetto al mese scorso</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Tasso Approvazione</h3>
          <div className="text-3xl font-bold">76%</div>
          <p className="text-sm text-gray-500">16 preventivi approvati</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Valore Totale</h3>
          <div className="text-3xl font-bold">€56,000</div>
          <p className="text-sm text-gray-500">Media: €2,435 per preventivo</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Andamento Mensile</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="budgets" stroke="#8884d8" name="Totale" />
                <Line yAxisId="left" type="monotone" dataKey="approved" stroke="#82ca9d" name="Approvati" />
                <Line yAxisId="right" type="monotone" dataKey="value" stroke="#ffc658" name="Valore (€)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Clienti per Valore</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" name="Valore (€)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StatsOverview;