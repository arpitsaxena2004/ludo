import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  FaChartLine, FaUsers, FaGamepad, FaMoneyBillWave, FaExchangeAlt, 
  FaArrowUp, FaArrowDown, FaTrophy, FaSpinner, FaCalendarAlt,
  FaDownload, FaFilter, FaCoins, FaWallet, FaPercentage
} from 'react-icons/fa';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const { data } = await adminAPI.getReports(dateRange, customStartDate, customEndDate);
      setReportData(data.report);
    } catch (error) {
      console.error('Fetch reports error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateFilter = () => {
    if (!customStartDate || !customEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    fetchReportData();
  };

  const exportReport = () => {
    toast.success('Export functionality coming soon!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400">No report data available</div>
      </div>
    );
  }

  const { overview, revenue, users, games, transactions, trends } = reportData;

  // Chart configurations
  const revenueChartData = {
    labels: trends.dates,
    datasets: [
      {
        label: 'Revenue',
        data: trends.revenue,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Commission',
        data: trends.commission,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const gamesChartData = {
    labels: trends.dates,
    datasets: [
      {
        label: 'Games Played',
        data: trends.gamesPlayed,
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1
      }
    ]
  };

  const userActivityData = {
    labels: ['Active Users', 'Inactive Users', 'Blocked Users'],
    datasets: [
      {
        data: [users.activeUsers, users.inactiveUsers, users.blockedUsers],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 1
      }
    ]
  };

  const transactionTypeData = {
    labels: ['Deposits', 'Withdrawals', 'Game Entries', 'Winnings', 'Refunds'],
    datasets: [
      {
        data: [
          transactions.deposits.count,
          transactions.withdrawals.count,
          transactions.gameEntries.count,
          transactions.winnings.count,
          transactions.refunds.count
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(156, 163, 175, 0.8)'
        ]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#9CA3AF',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        borderColor: '#374151',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF'
        },
        grid: {
          color: '#374151'
        }
      },
      y: {
        ticks: {
          color: '#9CA3AF'
        },
        grid: {
          color: '#374151'
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <FaChartLine className="text-blue-500" />
            Platform Reports
          </h1>
          <p className="text-gray-400 mt-1">Complete overview and analytics</p>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <FaDownload />
          Export Report
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-gray-400" />
            <span className="font-medium text-gray-300">Date Range:</span>
          </div>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCustomDateFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <FaFilter />
                Apply
              </button>
            </>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${overview.totalRevenue.toLocaleString()}`}
          icon={<FaMoneyBillWave />}
          color="green"
          change={overview.revenueChange}
        />
        <StatCard
          title="Total Users"
          value={overview.totalUsers.toLocaleString()}
          icon={<FaUsers />}
          color="blue"
          change={overview.userGrowth}
        />
        <StatCard
          title="Games Played"
          value={overview.totalGames.toLocaleString()}
          icon={<FaGamepad />}
          color="purple"
          change={overview.gamesChange}
        />
        <StatCard
          title="Commission Earned"
          value={`₹${overview.totalCommission.toLocaleString()}`}
          icon={<FaPercentage />}
          color="yellow"
          change={overview.commissionChange}
        />
      </div>

      {/* Revenue & Commission Chart */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FaChartLine className="text-green-500" />
          Revenue & Commission Trends
        </h2>
        <div className="h-80">
          <Line data={revenueChartData} options={chartOptions} />
        </div>
      </div>

      {/* Games & Users Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Games Chart */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaGamepad className="text-purple-500" />
            Games Activity
          </h2>
          <div className="h-80">
            <Bar data={gamesChartData} options={chartOptions} />
          </div>
        </div>

        {/* User Activity */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaUsers className="text-blue-500" />
            User Distribution
          </h2>
          <div className="h-80">
            <Doughnut data={userActivityData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Transaction Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Types */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaExchangeAlt className="text-orange-500" />
            Transaction Types
          </h2>
          <div className="h-80">
            <Pie data={transactionTypeData} options={chartOptions} />
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaWallet className="text-indigo-500" />
            Transaction Summary
          </h2>
          <div className="space-y-4">
            <TransactionSummaryItem
              label="Total Deposits"
              count={transactions.deposits.count}
              amount={transactions.deposits.amount}
              color="green"
            />
            <TransactionSummaryItem
              label="Total Withdrawals"
              count={transactions.withdrawals.count}
              amount={transactions.withdrawals.amount}
              color="red"
            />
            <TransactionSummaryItem
              label="Game Entries"
              count={transactions.gameEntries.count}
              amount={transactions.gameEntries.amount}
              color="blue"
            />
            <TransactionSummaryItem
              label="Winnings Paid"
              count={transactions.winnings.count}
              amount={transactions.winnings.amount}
              color="yellow"
            />
            <TransactionSummaryItem
              label="Refunds"
              count={transactions.refunds.count}
              amount={transactions.refunds.amount}
              color="gray"
            />
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Stats */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">User Statistics</h3>
          <div className="space-y-3">
            <DetailItem label="Total Users" value={users.totalUsers} />
            <DetailItem label="Active Users" value={users.activeUsers} color="green" />
            <DetailItem label="New Users" value={users.newUsers} color="blue" />
            <DetailItem label="Verified Users" value={users.verifiedUsers} />
            <DetailItem label="Blocked Users" value={users.blockedUsers} color="red" />
          </div>
        </div>

        {/* Game Stats */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Game Statistics</h3>
          <div className="space-y-3">
            <DetailItem label="Total Games" value={games.totalGames} />
            <DetailItem label="Completed" value={games.completed} color="green" />
            <DetailItem label="In Progress" value={games.inProgress} color="blue" />
            <DetailItem label="Cancelled" value={games.cancelled} color="red" />
            <DetailItem label="Avg Entry Fee" value={`₹${games.avgEntryFee}`} />
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Revenue Breakdown</h3>
          <div className="space-y-3">
            <DetailItem label="Total Revenue" value={`₹${revenue.totalRevenue.toLocaleString()}`} />
            <DetailItem label="Commission" value={`₹${revenue.commission.toLocaleString()}`} color="green" />
            <DetailItem label="Deposits" value={`₹${revenue.deposits.toLocaleString()}`} color="blue" />
            <DetailItem label="Withdrawals" value={`₹${revenue.withdrawals.toLocaleString()}`} color="red" />
            <DetailItem label="Net Profit" value={`₹${revenue.netProfit.toLocaleString()}`} color="green" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color, change }) => {
  const colors = {
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600'
  };

  const isPositive = change >= 0;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <FaArrowUp /> : <FaArrowDown />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className={`${colors[color]} text-white p-4 rounded-lg text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Transaction Summary Item
const TransactionSummaryItem = ({ label, count, amount, color }) => {
  const colors = {
    green: 'text-green-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
    gray: 'text-gray-400'
  };

  return (
    <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg border border-gray-600">
      <div>
        <p className="text-gray-300 font-medium">{label}</p>
        <p className="text-sm text-gray-400">{count} transactions</p>
      </div>
      <p className={`text-lg font-bold ${colors[color]}`}>
        ₹{amount.toLocaleString()}
      </p>
    </div>
  );
};

// Detail Item Component
const DetailItem = ({ label, value, color }) => {
  const colorClasses = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    red: 'text-red-400',
    yellow: 'text-yellow-400'
  };
  
  const textColor = color ? colorClasses[color] : 'text-white';
  
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}</span>
      <span className={`font-semibold ${textColor}`}>{value}</span>
    </div>
  );
};

export default Reports;
