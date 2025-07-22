import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  Box, 
  CreditCard,
  Eye,
  EyeOff
} from 'lucide-react';
import { metricsAPI, blocksAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import BlockDAGVisualization from '../components/BlockDAGVisualization';
import MetricsCard from '../components/MetricsCard';
import RecentBlocks from '../components/RecentBlocks';

const DashboardContainer = styled.div`
  padding: 24px;
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 32px;
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
`;

const VisualizationContainer = styled.div`
  grid-column: 1 / -1;
  height: 600px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
`;

const ControlsOverlay = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  gap: 8px;
`;

const ControlButton = styled.button`
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
`;

const Dashboard = () => {
  const { isConnected, data: wsData } = useWebSocket();
  const [showLabels, setShowLabels] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);

  // Fetch metrics data
  const { data: metrics, isLoading: metricsLoading } = useQuery(
    'metrics',
    metricsAPI.getMetrics,
    {
      refetchInterval: 5000, // Refetch every 5 seconds
    }
  );

  // Fetch recent blocks
  const { data: blocks, isLoading: blocksLoading } = useQuery(
    'recentBlocks',
    () => blocksAPI.getBlocks(10),
    {
      refetchInterval: 10000, // Refetch every 10 seconds
    }
  );

  // Use WebSocket data if available, otherwise use API data
  const currentMetrics = wsData || metrics;

  return (
    <DashboardContainer>
      <Header>
        <Title>BlockDAG Lens Explorer</Title>
        <Subtitle>
          Real-time visualization and monitoring of BlockDAG network topology
        </Subtitle>
      </Header>

      <MetricsGrid>
        <MetricsCard
          title="Transactions per Second"
          value={currentMetrics?.tps?.toFixed(2) || '0.00'}
          unit="TPS"
          icon={Zap}
          color="#667eea"
          loading={metricsLoading}
        />
        <MetricsCard
          title="Confirmation Latency"
          value={currentMetrics?.confirmationLatency?.toFixed(2) || '0.00'}
          unit="s"
          icon={Clock}
          color="#10b981"
          loading={metricsLoading}
        />
        <MetricsCard
          title="Tip Pool Size"
          value={currentMetrics?.tipPoolSize || 0}
          unit="tips"
          icon={Activity}
          color="#f59e0b"
          loading={metricsLoading}
        />
        <MetricsCard
          title="Orphan Rate"
          value={currentMetrics?.orphanRate?.toFixed(2) || '0.00'}
          unit="%"
          icon={TrendingUp}
          color="#ef4444"
          loading={metricsLoading}
        />
      </MetricsGrid>

      <VisualizationContainer>
        <ControlsOverlay>
          <ControlButton onClick={() => setShowLabels(!showLabels)}>
            {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}
            {showLabels ? 'Hide Labels' : 'Show Labels'}
          </ControlButton>
          <ControlButton onClick={() => setAutoRotate(!autoRotate)}>
            <Activity size={14} />
            {autoRotate ? 'Stop Rotation' : 'Start Rotation'}
          </ControlButton>
        </ControlsOverlay>
        
        <Canvas
          camera={{ position: [0, 0, 10], fov: 75 }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          <BlockDAGVisualization 
            blocks={blocks || []}
            showLabels={showLabels}
            autoRotate={autoRotate}
          />
          
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </VisualizationContainer>

      <Grid>
        <RecentBlocks blocks={blocks || []} loading={blocksLoading} />
        <div className="card">
          <h3>Network Status</h3>
          <div style={{ marginTop: '16px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isConnected ? '#10b981' : '#ef4444'
              }} />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              {isConnected 
                ? 'Real-time data streaming is active' 
                : 'Attempting to reconnect...'
              }
            </p>
          </div>
        </div>
      </Grid>
      
      {/* Remove HeadAPIExample component usage if present */}
    </DashboardContainer>
  );
};

export default Dashboard; 