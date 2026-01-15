import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../api';
import './admin.css';
import LoadingSkeleton from './components/LoadingSkeleton';

function showToast(message, type = 'info') {
  try { window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, type } })); } catch (e) {}
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('line'); // 'line' or 'bar'

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.warn('Failed to load analytics', err.message || err);
      showToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={6} cols={3} />;

  if (!analytics) {
    return (
      <div className="admin-analytics">
        <h2>Analytics</h2>
        <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
          No analytics data available
        </div>
      </div>
    );
  }

  const { thisMonth, lastMonth, dailyData } = analytics;

  // Calculate percentage changes
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const userChange = calculateChange(thisMonth.users, lastMonth.users);
  const hikeChange = calculateChange(thisMonth.hikes, lastMonth.hikes);
  const bookingChange = calculateChange(thisMonth.bookings, lastMonth.bookings);
  const guideChange = calculateChange(thisMonth.guides, lastMonth.guides);
  const hikerChange = calculateChange(thisMonth.hikers, lastMonth.hikers);
  const deletedUserChange = calculateChange(thisMonth.deletedUsers, lastMonth.deletedUsers);

  return (
    <div className="admin-analytics">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Analytics Dashboard</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className={`btn ${chartType === 'line' ? 'btn-primary' : ''}`}
            onClick={() => setChartType('line')}
          >
            Line Chart
          </button>
          <button 
            className={`btn ${chartType === 'bar' ? 'btn-primary' : ''}`}
            onClick={() => setChartType('bar')}
          >
            Bar Chart
          </button>
        </div>
      </div>

      {/* Month Comparison Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="analytics-card">
          <div className="analytics-card-header">
            <h3>All New Users</h3>
            <span className="analytics-period">This Month</span>
          </div>
          <div className="analytics-card-body">
            <div className="analytics-value">{thisMonth.users}</div>
            <div className="analytics-comparison">
              <span className="analytics-label">Last Month: {lastMonth.users}</span>
              <span className={`analytics-change ${parseFloat(userChange) >= 0 ? 'positive' : 'negative'}`}>
                {parseFloat(userChange) >= 0 ? '↑' : '↓'} {Math.abs(userChange)}%
              </span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <h3>New Guides</h3>
            <span className="analytics-period">This Month</span>
          </div>
          <div className="analytics-card-body">
            <div className="analytics-value">{thisMonth.guides}</div>
            <div className="analytics-comparison">
              <span className="analytics-label">Last Month: {lastMonth.guides}</span>
              <span className={`analytics-change ${parseFloat(guideChange) >= 0 ? 'positive' : 'negative'}`}>
                {parseFloat(guideChange) >= 0 ? '↑' : '↓'} {Math.abs(guideChange)}%
              </span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <h3>New Hikers</h3>
            <span className="analytics-period">This Month</span>
          </div>
          <div className="analytics-card-body">
            <div className="analytics-value">{thisMonth.hikers}</div>
            <div className="analytics-comparison">
              <span className="analytics-label">Last Month: {lastMonth.hikers}</span>
              <span className={`analytics-change ${parseFloat(hikerChange) >= 0 ? 'positive' : 'negative'}`}>
                {parseFloat(hikerChange) >= 0 ? '↑' : '↓'} {Math.abs(hikerChange)}%
              </span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <h3>New Hikes</h3>
            <span className="analytics-period">This Month</span>
          </div>
          <div className="analytics-card-body">
            <div className="analytics-value">{thisMonth.hikes}</div>
            <div className="analytics-comparison">
              <span className="analytics-label">Last Month: {lastMonth.hikes}</span>
              <span className={`analytics-change ${parseFloat(hikeChange) >= 0 ? 'positive' : 'negative'}`}>
                {parseFloat(hikeChange) >= 0 ? '↑' : '↓'} {Math.abs(hikeChange)}%
              </span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <h3>New Bookings</h3>
            <span className="analytics-period">This Month</span>
          </div>
          <div className="analytics-card-body">
            <div className="analytics-value">{thisMonth.bookings}</div>
            <div className="analytics-comparison">
              <span className="analytics-label">Last Month: {lastMonth.bookings}</span>
              <span className={`analytics-change ${parseFloat(bookingChange) >= 0 ? 'positive' : 'negative'}`}>
                {parseFloat(bookingChange) >= 0 ? '↑' : '↓'} {Math.abs(bookingChange)}%
              </span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-header">
            <h3>Deleted Users</h3>
            <span className="analytics-period">This Month</span>
          </div>
          <div className="analytics-card-body">
            <div className="analytics-value">{thisMonth.deletedUsers}</div>
            <div className="analytics-comparison">
              <span className="analytics-label">Last Month: {lastMonth.deletedUsers}</span>
              <span className={`analytics-change ${parseFloat(deletedUserChange) >= 0 ? 'negative' : 'positive'}`}>
                {parseFloat(deletedUserChange) >= 0 ? '↑' : '↓'} {Math.abs(deletedUserChange)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="analytics-charts">
        <div className="analytics-chart-container">
          <h3 style={{ marginBottom: 16 }}>User Registrations (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'line' ? (
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString();
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2} name="Users" />
              </LineChart>
            ) : (
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString();
                  }}
                />
                <Legend />
                <Bar dataKey="users" fill="#2563eb" name="Users" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="analytics-chart-container">
          <h3 style={{ marginBottom: 16 }}>Guide Profiles Created (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'line' ? (
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString();
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="guides" stroke="#8b5cf6" strokeWidth={2} name="Guides" />
              </LineChart>
            ) : (
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString();
                  }}
                />
                <Legend />
                <Bar dataKey="guides" fill="#8b5cf6" name="Guides" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="analytics-chart-container">
          <h3 style={{ marginBottom: 16 }}>Hiker Registrations (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'line' ? (
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString();
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="hikers" stroke="#06b6d4" strokeWidth={2} name="Hikers" />
              </LineChart>
            ) : (
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString();
                  }}
                />
                <Legend />
                <Bar dataKey="hikers" fill="#06b6d4" name="Hikers" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="analytics-chart-container">
          <h3 style={{ marginBottom: 16 }}>Hikes Created (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'line' ? (
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString();
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="hikes" stroke="#16a34a" strokeWidth={2} name="Hikes" />
              </LineChart>
            ) : (
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString();
                  }}
                />
                <Legend />
                <Bar dataKey="hikes" fill="#16a34a" name="Hikes" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="analytics-chart-container">
          <h3 style={{ marginBottom: 16 }}>Bookings Made (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'line' ? (
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString();
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="bookings" stroke="#ea580c" strokeWidth={2} name="Bookings" />
              </LineChart>
            ) : (
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString();
                  }}
                />
                <Legend />
                <Bar dataKey="bookings" fill="#ea580c" name="Bookings" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="analytics-chart-container">
          <h3 style={{ marginBottom: 16 }}>Users Deleted (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'line' ? (
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString();
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="deletedUsers" stroke="#dc2626" strokeWidth={2} name="Deleted Users" />
              </LineChart>
            ) : (
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString();
                  }}
                />
                <Legend />
                <Bar dataKey="deletedUsers" fill="#dc2626" name="Deleted Users" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Combined Chart */}
        <div className="analytics-chart-container" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: 16 }}>All Metrics Combined (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString();
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2} name="Users" />
                <Line type="monotone" dataKey="guides" stroke="#8b5cf6" strokeWidth={2} name="Guides" />
                <Line type="monotone" dataKey="hikers" stroke="#06b6d4" strokeWidth={2} name="Hikers" />
                <Line type="monotone" dataKey="hikes" stroke="#16a34a" strokeWidth={2} name="Hikes" />
                <Line type="monotone" dataKey="bookings" stroke="#ea580c" strokeWidth={2} name="Bookings" />
                <Line type="monotone" dataKey="deletedUsers" stroke="#dc2626" strokeWidth={2} name="Deleted Users" />
              </LineChart>
            ) : (
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString();
                  }}
                />
                <Legend />
                <Bar dataKey="users" fill="#2563eb" name="Users" />
                <Bar dataKey="guides" fill="#8b5cf6" name="Guides" />
                <Bar dataKey="hikers" fill="#06b6d4" name="Hikers" />
                <Bar dataKey="hikes" fill="#16a34a" name="Hikes" />
                <Bar dataKey="bookings" fill="#ea580c" name="Bookings" />
                <Bar dataKey="deletedUsers" fill="#dc2626" name="Deleted Users" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
