import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Zap,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { metricsAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

const Container = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  color: white;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const ChartContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
`;

const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TimeRangeSelector = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
`;

const TimeButton = styled.button`
  padding: 8px 16px;
  background: ${props => props.active ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.active ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 6px;
  color: ${props => props.active ? '#667eea' : 'rgba(255, 255, 255, 0.8)'};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  font-weight: 500;

  &:hover {
    background: rgba(102, 126, 234, 0.2);
    border-color: rgba(102, 126, 234, 0.3);
    color: #667eea;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const StatCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const NetworkMetrics = () => {
  const { isConnected, data: wsData } = useWebSocket();
  const [timeRange, setTimeRange] = useState('1h');

  const { data: metrics, isLoading } = useQuery(
    'metrics',
    metricsAPI.getMetrics,
    {
      refetchInterval: 5000,
    }
  );

  const currentMetrics = wsData || metrics;

  // Generate mock time series data
  const generateTimeSeriesData = (range) => {
    const data = [];
    const now = new Date();
    let points;
    let interval;

    switch (range) {
      case '1h':
        points = 60;
        interval = 60000; // 1 minute
        break;
      case '24h':
        points = 24;
        interval = 3600000; // 1 hour
        break;
      case '7d':
        points = 7;
        interval = 86400000; // 1 day
        break;
      default:
        points = 60;
        interval = 60000;
    }

    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * interval);
      data.push({
        time: time.toLocaleTimeString(),
        tps: Math.random() * 100 + 50,
        latency: Math.random() * 5 + 1,
        tipPool: Math.floor(Math.random() * 20) + 5,
        orphanRate: Math.random() * 2,
      });
    }

    return data;
  };

  const timeSeriesData = generateTimeSeriesData(timeRange);

  // Pie chart data for block status distribution
  const blockStatusData = [
    { name: 'Confirmed', value: 65, color: '#10b981' },
    { name: 'Partially Confirmed', value: 20, color: '#667eea' },
    { name: 'Tips', value: 10, color: '#f59e0b' },
    { name: 'Pending', value: 5, color: '#6b7280' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          padding: '12px',
          color: 'white',
          fontSize: '12px',
        }}>
          <p style={{ margin: '0 0 8px 0' }}>{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              margin: '4px 0', 
              color: entry.color 
            }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Container>
      <Header>
        <Title>Network Metrics</Title>
        <Subtitle>Real-time analytics and performance monitoring</Subtitle>
      </Header>

      <StatsGrid>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <StatValue>{currentMetrics?.tps?.toFixed(2) || '0.00'}</StatValue>
          <StatLabel>Transactions per Second</StatLabel>
        </StatCard>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <StatValue>{currentMetrics?.confirmationLatency?.toFixed(2) || '0.00'}s</StatValue>
          <StatLabel>Confirmation Latency</StatLabel>
        </StatCard>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <StatValue>{currentMetrics?.tipPoolSize || 0}</StatValue>
          <StatLabel>Tip Pool Size</StatLabel>
        </StatCard>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <StatValue>{currentMetrics?.orphanRate?.toFixed(2) || '0.00'}%</StatValue>
          <StatLabel>Orphan Rate</StatLabel>
        </StatCard>
      </StatsGrid>

      <TimeRangeSelector>
        <TimeButton 
          active={timeRange === '1h'} 
          onClick={() => setTimeRange('1h')}
        >
          1 Hour
        </TimeButton>
        <TimeButton 
          active={timeRange === '24h'} 
          onClick={() => setTimeRange('24h')}
        >
          24 Hours
        </TimeButton>
        <TimeButton 
          active={timeRange === '7d'} 
          onClick={() => setTimeRange('7d')}
        >
          7 Days
        </TimeButton>
      </TimeRangeSelector>

      <MetricsGrid>
        <ChartContainer>
          <ChartHeader>
            <ChartTitle>
              <Zap size={20} />
              Transactions per Second
            </ChartTitle>
          </ChartHeader>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="time" 
                stroke="rgba(255, 255, 255, 0.6)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.6)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="tps" 
                stroke="#667eea" 
                fill="rgba(102, 126, 234, 0.2)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer>
          <ChartHeader>
            <ChartTitle>
              <Clock size={20} />
              Confirmation Latency
            </ChartTitle>
          </ChartHeader>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="time" 
                stroke="rgba(255, 255, 255, 0.6)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.6)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="latency" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer>
          <ChartHeader>
            <ChartTitle>
              <Activity size={20} />
              Tip Pool Size
            </ChartTitle>
          </ChartHeader>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="time" 
                stroke="rgba(255, 255, 255, 0.6)"
                fontSize={12}
              />
              <YAxis 
                stroke="rgba(255, 255, 255, 0.6)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="tipPool" 
                fill="#f59e0b" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer>
          <ChartHeader>
            <ChartTitle>
              <PieChartIcon size={20} />
              Block Status Distribution
            </ChartTitle>
          </ChartHeader>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={blockStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {blockStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: 'white',
                        fontSize: '12px',
                      }}>
                        <p style={{ margin: '0' }}>
                          {`${payload[0].name}: ${payload[0].value}%`}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </MetricsGrid>
    </Container>
  );
};

export default NetworkMetrics; 