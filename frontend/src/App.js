import React from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import BlockExplorer from './pages/BlockExplorer';
import TransactionExplorer from './pages/TransactionExplorer';
import NetworkMetrics from './pages/NetworkMetrics';
import DAGView from './pages/DAGView';
import ActivityMonitor from './pages/ActivityMonitor';
import { useWebSocket } from './hooks/useWebSocket';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  margin-top: 80px;
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
`;

function App() {
  useWebSocket();

  return (
    <AppContainer>
      <Header />
      <MainContent>
        <Sidebar />
        <ContentArea>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/blocks" element={<BlockExplorer />} />
            <Route path="/transactions" element={<TransactionExplorer />} />
            <Route path="/metrics" element={<NetworkMetrics />} />
            <Route path="/dag-view" element={<DAGView />} />
            <Route path="/activity" element={<ActivityMonitor />} />
          </Routes>
        </ContentArea>
      </MainContent>
    </AppContainer>
  );
}

export default App; 