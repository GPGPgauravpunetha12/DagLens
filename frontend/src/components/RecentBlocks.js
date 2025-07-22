import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Box, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const Container = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const Title = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BlockList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
`;

const BlockItem = styled(motion.div)`
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

const BlockHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const BlockId = styled.div`
  font-weight: 600;
  color: white;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const BlockHash = styled.div`
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
  word-break: break-all;
`;

const BlockDetails = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.7);
`;

const StatusBadge = styled.div`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => {
    if (props.$isTip) return 'rgba(245, 158, 11, 0.2)';
    if (props.confirmations > 50) return 'rgba(16, 185, 129, 0.2)';
    if (props.confirmations > 10) return 'rgba(102, 126, 234, 0.2)';
    return 'rgba(107, 114, 128, 0.2)';
  }};
  color: ${props => {
    if (props.$isTip) return '#f59e0b';
    if (props.confirmations > 50) return '#10b981';
    if (props.confirmations > 10) return '#667eea';
    return '#6b7280';
  }};
  border: 1px solid ${props => {
    if (props.$isTip) return 'rgba(245, 158, 11, 0.3)';
    if (props.confirmations > 50) return 'rgba(16, 185, 129, 0.3)';
    if (props.confirmations > 10) return 'rgba(102, 126, 234, 0.3)';
    return 'rgba(107, 114, 128, 0.3)';
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

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
`;

const RecentBlocks = ({ blocks, loading }) => {
  const getStatusText = (block) => {
    if (block.isTip) return 'TIP';
    if (block.confirmations > 50) return 'CONFIRMED';
    if (block.confirmations > 10) return 'PARTIAL';
    return 'PENDING';
  };

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

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>
            <Box size={20} />
            Recent Blocks
          </Title>
        </Header>
        {[...Array(5)].map((_, index) => (
          <LoadingSkeleton key={index} />
        ))}
      </Container>
    );
  }

  if (!blocks || blocks.length === 0) {
    return (
      <Container>
        <Header>
          <Title>
            <Box size={20} />
            Recent Blocks
          </Title>
        </Header>
        <EmptyState>
          <Box size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <p>No blocks found</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <Box size={20} />
          Recent Blocks
        </Title>
      </Header>
      
      <BlockList>
        {blocks.map((block, index) => (
          <BlockItem
            key={block.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <BlockHeader>
              <BlockId>
                <Box size={14} />
                {block.id}
              </BlockId>
              <StatusBadge
                $isTip={block.isTip}
                confirmations={block.confirmations}
              >
                {getStatusText(block)}
              </StatusBadge>
            </BlockHeader>
            
            <BlockHash>
              {block.hash.substring(0, 32)}...
            </BlockHash>
            
            <BlockDetails>
              <DetailItem>
                <Clock size={12} />
                {formatTime(block.timestamp)}
              </DetailItem>
              
              <DetailItem>
                {block.confirmations > 50 ? (
                  <CheckCircle size={12} color="#10b981" />
                ) : (
                  <AlertCircle size={12} color="#f59e0b" />
                )}
                {block.confirmations} confirmations
              </DetailItem>
              
              <DetailItem>
                Weight: {block.weight}
              </DetailItem>
            </BlockDetails>
          </BlockItem>
        ))}
      </BlockList>
    </Container>
  );
};

export default RecentBlocks; 