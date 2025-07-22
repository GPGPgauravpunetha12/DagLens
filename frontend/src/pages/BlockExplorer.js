import React, { useState } from 'react';
import styled from 'styled-components';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Search, Box, Hash, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { blocksAPI } from '../services/api';

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

const SearchSection = styled.div`
  margin-bottom: 32px;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 12px;
  max-width: 600px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const SearchButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
`;

const BlocksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
`;

const BlockCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const BlockHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const BlockId = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusBadge = styled.div`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => {
    if (props.isTip) return 'rgba(245, 158, 11, 0.2)';
    if (props.confirmations > 50) return 'rgba(16, 185, 129, 0.2)';
    if (props.confirmations > 10) return 'rgba(102, 126, 234, 0.2)';
    return 'rgba(107, 114, 128, 0.2)';
  }};
  color: ${props => {
    if (props.isTip) return '#f59e0b';
    if (props.confirmations > 50) return '#10b981';
    if (props.confirmations > 10) return '#667eea';
    return '#6b7280';
  }};
  border: 1px solid ${props => {
    if (props.isTip) return 'rgba(245, 158, 11, 0.3)';
    if (props.confirmations > 50) return 'rgba(16, 185, 129, 0.3)';
    if (props.confirmations > 10) return 'rgba(102, 126, 234, 0.3)';
    return 'rgba(107, 114, 128, 0.3)';
  }};
`;

const BlockHash = styled.div`
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 16px;
  word-break: break-all;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-radius: 6px;
`;

const BlockDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  font-size: 14px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.8);
`;

const DetailLabel = styled.span`
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
`;

const LoadingSkeleton = styled.div`
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  height: 200px;
  border-radius: 12px;

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const BlockExplorer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: blocks, isLoading } = useQuery(
    ['blocks', searchTerm],
    () => searchTerm ? blocksAPI.searchBlocks(searchTerm) : blocksAPI.getBlocks(50),
    {
      refetchInterval: 10000,
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchQuery);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusText = (block) => {
    if (block.isTip) return 'TIP';
    if (block.confirmations > 50) return 'CONFIRMED';
    if (block.confirmations > 10) return 'PARTIAL';
    return 'PENDING';
  };

  return (
    <Container>
      <Header>
        <Title>Block Explorer</Title>
        <Subtitle>Search and explore blocks in the BlockDAG network</Subtitle>
      </Header>

      <SearchSection>
        <form onSubmit={handleSearch}>
          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="Search by block ID or hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchButton type="submit">
              <Search size={16} />
              Search
            </SearchButton>
          </SearchContainer>
        </form>
      </SearchSection>

      <BlocksGrid>
        {isLoading ? (
          [...Array(6)].map((_, index) => (
            <LoadingSkeleton key={index} />
          ))
        ) : (
          blocks?.map((block, index) => (
            <BlockCard
              key={block.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <BlockHeader>
                <BlockId>
                  <Box size={20} />
                  {block.id}
                </BlockId>
                <StatusBadge
                  isTip={block.isTip}
                  confirmations={block.confirmations}
                >
                  {getStatusText(block)}
                </StatusBadge>
              </BlockHeader>

              <BlockHash>
                {block.hash}
              </BlockHash>

              <BlockDetails>
                <DetailItem>
                  <Hash size={14} />
                  <DetailLabel>Parent:</DetailLabel>
                  <span>{block.parentHash ? block.parentHash.substring(0, 16) + '...' : 'Genesis'}</span>
                </DetailItem>

                <DetailItem>
                  <Clock size={14} />
                  <DetailLabel>Time:</DetailLabel>
                  <span>{formatTime(block.timestamp)}</span>
                </DetailItem>

                <DetailItem>
                  <ArrowUpRight size={14} />
                  <DetailLabel>Confirmations:</DetailLabel>
                  <span>{block.confirmations}</span>
                </DetailItem>

                <DetailItem>
                  <ArrowDownLeft size={14} />
                  <DetailLabel>Weight:</DetailLabel>
                  <span>{block.weight}</span>
                </DetailItem>
              </BlockDetails>
            </BlockCard>
          ))
        )}
      </BlocksGrid>
    </Container>
  );
};

export default BlockExplorer; 