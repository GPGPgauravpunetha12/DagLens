import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Hash,
  Users,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { metricsAPI } from '../services/kaspaApi';

const Container = styled.div`
  padding: 24px;
  height: calc(100vh - 80px);
  overflow-y: auto;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
`;

const MetricCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const MetricTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
`;

const MetricIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${props => props.color}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color};
`;

const MetricValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const MetricUnit = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
`;

const MetricChange = styled.div`
  font-size: 12px;
  color: ${props => props.positive ? '#10b981' : '#ef4444'};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
`;

const TransactionStream = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
`;

const StreamHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const StreamTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TransactionList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TransactionItem = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateX(4px);
  }
`;

const TransactionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const TransactionHash = styled.div`
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const TransactionAmount = styled.div`
  font-weight: 600;
  color: white;
  font-size: 14px;
`;

const TransactionDetails = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const AlertsPanel = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
`;

const AlertItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${props => {
    if (props.severity === 'high') return 'rgba(239, 68, 68, 0.1)';
    if (props.severity === 'medium') return 'rgba(245, 158, 11, 0.1)';
    return 'rgba(102, 126, 234, 0.1)';
  }};
  border: 1px solid ${props => {
    if (props.severity === 'high') return 'rgba(239, 68, 68, 0.3)';
    if (props.severity === 'medium') return 'rgba(245, 158, 11, 0.3)';
    return 'rgba(102, 126, 234, 0.3)';
  }};
  border-radius: 8px;
  margin-bottom: 12px;
  color: white;
  font-size: 14px;
`;

const AlertIcon = styled.div`
  color: ${props => {
    if (props.severity === 'high') return '#ef4444';
    if (props.severity === 'medium') return '#f59e0b';
    return '#667eea';
  }};
`;

const LoadingSkeleton = styled.div`
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  height: 60px;
  border-radius: 8px;
  margin-bottom: 12px;

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const ActivityMonitor = () => {
  const [alerts, setAlerts] = useState([]);

  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery(
    'metrics',
    metricsAPI.getMetrics,
    {
      refetchInterval: 10000,
    }
  );

  // Mock data for transactions and mempool
  const transactions = [];
  const mempool = [];
  const networkInfo = { connections: 0 };
  const txsLoading = false;
  const mempoolLoading = false;

  // Generate alerts based on data
  useEffect(() => {
    const newAlerts = [];
    
    if (mempool?.length > 1000) {
      newAlerts.push({
        id: 'mempool-congestion',
        message: `High mempool congestion: ${mempool.length} pending transactions`,
        severity: 'high',
        icon: AlertTriangle
      });
    }

    if (metrics?.tps > 100) {
      newAlerts.push({
        id: 'high-tps',
        message: `High transaction rate: ${metrics.tps.toFixed(2)} TPS`,
        severity: 'medium',
        icon: TrendingUp
      });
    }

    if (transactions?.length > 0) {
      const largeTx = transactions.find(tx => tx.amount > 1000000);
      if (largeTx) {
        newAlerts.push({
          id: 'large-transaction',
          message: `Large transaction detected: ${largeTx.amount} KAS`,
          severity: 'medium',
          icon: Zap
        });
      }
    }

    setAlerts(newAlerts);
  }, [mempool, metrics, transactions]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <Container>
      <Header>
        <Title>Activity Monitor</Title>
        <Subtitle>Real-time transaction activity and network monitoring</Subtitle>
      </Header>

      <MetricsGrid>
        <MetricCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <MetricHeader>
            <MetricTitle>Transactions per Second</MetricTitle>
            <MetricIcon color="#667eea">
              <Zap size={20} />
            </MetricIcon>
          </MetricHeader>
          <MetricValue>
            {metricsLoading ? '...' : (metrics?.tps?.toFixed(2) || '0.00')}
            <MetricUnit>TPS</MetricUnit>
          </MetricValue>
          <MetricChange positive={true}>
            <ArrowUpRight size={12} />
            +5.2%
          </MetricChange>
        </MetricCard>

        <MetricCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <MetricHeader>
            <MetricTitle>Mempool Size</MetricTitle>
            <MetricIcon color="#f59e0b">
              <Clock size={20} />
            </MetricIcon>
          </MetricHeader>
          <MetricValue>
            {mempoolLoading ? '...' : (mempool?.length || 0)}
            <MetricUnit>txs</MetricUnit>
          </MetricValue>
          <MetricChange positive={false}>
            <ArrowDownLeft size={12} />
            -2.1%
          </MetricChange>
        </MetricCard>

        <MetricCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <MetricHeader>
            <MetricTitle>Active Connections</MetricTitle>
            <MetricIcon color="#10b981">
              <Users size={20} />
            </MetricIcon>
          </MetricHeader>
          <MetricValue>
            {networkInfo?.connections || 0}
            <MetricUnit>nodes</MetricUnit>
          </MetricValue>
          <MetricChange positive={true}>
            <ArrowUpRight size={12} />
            +1.3%
          </MetricChange>
        </MetricCard>

        <MetricCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <MetricHeader>
            <MetricTitle>Block Rate</MetricTitle>
            <MetricIcon color="#ef4444">
              <Activity size={20} />
            </MetricIcon>
          </MetricHeader>
          <MetricValue>
            {metrics?.blockRate?.toFixed(2) || '0.00'}
            <MetricUnit>blocks/s</MetricUnit>
          </MetricValue>
          <MetricChange positive={true}>
            <ArrowUpRight size={12} />
            +0.8%
          </MetricChange>
        </MetricCard>
      </MetricsGrid>

      <ContentGrid>
        <TransactionStream>
          <StreamHeader>
            <StreamTitle>
              <Activity size={20} />
              Live Transaction Stream
            </StreamTitle>
            <RefreshCw size={16} style={{ opacity: 0.6 }} />
          </StreamHeader>
          
          <TransactionList>
            {txsLoading ? (
              [...Array(5)].map((_, index) => (
                <LoadingSkeleton key={index} />
              ))
            ) : (
              transactions?.map((tx, index) => (
                <TransactionItem
                  key={tx.hash}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <TransactionHeader>
                    <TransactionHash>
                      <Hash size={12} />
                      {tx.hash ? `${tx.hash.substring(0, 12)}...${tx.hash.substring(tx.hash.length - 12)}` : 'N/A'}
                    </TransactionHash>
                    <TransactionAmount>
                      {tx.amount ? `${tx.amount} KAS` : '0 KAS'}
                    </TransactionAmount>
                  </TransactionHeader>
                  
                  <TransactionDetails>
                    <DetailItem>
                      <ArrowUpRight size={10} />
                      From: {tx.from ? `${tx.from.substring(0, 8)}...${tx.from.substring(tx.from.length - 8)}` : 'N/A'}
                    </DetailItem>
                    <DetailItem>
                      <ArrowDownLeft size={10} />
                      To: {tx.to ? `${tx.to.substring(0, 8)}...${tx.to.substring(tx.to.length - 8)}` : 'N/A'}
                    </DetailItem>
                    <DetailItem>
                      <Clock size={10} />
                      {formatTime(tx.timestamp)}
                    </DetailItem>
                  </TransactionDetails>
                </TransactionItem>
              ))
            )}
          </TransactionList>
        </TransactionStream>

        <AlertsPanel>
          <StreamHeader>
            <StreamTitle>
              <AlertTriangle size={20} />
              Network Alerts
            </StreamTitle>
          </StreamHeader>
          
          {alerts.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: 'rgba(255, 255, 255, 0.5)', 
              padding: '40px 20px' 
            }}>
              <BarChart3 size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p>No alerts at the moment</p>
              <p style={{ fontSize: '12px' }}>Network is running smoothly</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <AlertItem key={alert.id} severity={alert.severity}>
                  <AlertIcon severity={alert.severity}>
                    <Icon size={16} />
                  </AlertIcon>
                  <span>{alert.message}</span>
                </AlertItem>
              );
            })
          )}
        </AlertsPanel>
      </ContentGrid>
    </Container>
  );
};

export default ActivityMonitor; 