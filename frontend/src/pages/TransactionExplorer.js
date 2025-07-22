import React, { useState } from 'react';
import styled from 'styled-components';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { Search, CreditCard, ArrowRight, Clock, Hash, DollarSign } from 'lucide-react';
import { transactionsAPI } from '../services/api';

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

const TransactionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 24px;
`;

const TransactionCard = styled(motion.div)`
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

const TransactionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const TransactionHash = styled.div`
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  font-weight: 600;
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
    if (props.status === 'confirmed') return 'rgba(16, 185, 129, 0.2)';
    if (props.status === 'pending') return 'rgba(245, 158, 11, 0.2)';
    return 'rgba(239, 68, 68, 0.2)';
  }};
  color: ${props => {
    if (props.status === 'confirmed') return '#10b981';
    if (props.status === 'pending') return '#f59e0b';
    return '#ef4444';
  }};
  border: 1px solid ${props => {
    if (props.status === 'confirmed') return 'rgba(16, 185, 129, 0.3)';
    if (props.status === 'pending') return 'rgba(245, 158, 11, 0.3)';
    return 'rgba(239, 68, 68, 0.3)';
  }};
`;

const TransactionFlow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
`;

const Address = styled.div`
  flex: 1;
  text-align: center;
`;

const AddressLabel = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
`;

const AddressValue = styled.div`
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  color: white;
  word-break: break-all;
`;

const ArrowContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  color: #667eea;
`;

const TransactionDetails = styled.div`
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
  height: 250px;
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

const TransactionExplorer = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: transactions, isLoading } = useQuery(
    ['transactions', searchTerm],
    () => searchTerm ? transactionsAPI.searchTransactions(searchTerm) : transactionsAPI.getTransaction('sample'),
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

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(amount);
  };

  const getStatusText = (status) => {
    return status.toUpperCase();
  };

  // Mock data for demonstration
  const mockTransactions = [
    {
      hash: 'tx1',
      from: 'address1',
      to: 'address2',
      amount: 100.0,
      timestamp: new Date(Date.now() - 45 * 60000),
      blockHash: '1111111111111111111111111111111111111111111111111111111111111111',
      status: 'confirmed'
    },
    {
      hash: 'tx2',
      from: 'address2',
      to: 'address3',
      amount: 50.0,
      timestamp: new Date(Date.now() - 40 * 60000),
      blockHash: '2222222222222222222222222222222222222222222222222222222222222222',
      status: 'confirmed'
    },
    {
      hash: 'tx3',
      from: 'address3',
      to: 'address4',
      amount: 25.0,
      timestamp: new Date(Date.now() - 35 * 60000),
      blockHash: '3333333333333333333333333333333333333333333333333333333333333333',
      status: 'confirmed'
    },
    {
      hash: 'tx4',
      from: 'address4',
      to: 'address5',
      amount: 75.0,
      timestamp: new Date(Date.now() - 30 * 60000),
      blockHash: '4444444444444444444444444444444444444444444444444444444444444444',
      status: 'pending'
    }
  ];

  const displayTransactions = transactions || mockTransactions;

  return (
    <Container>
      <Header>
        <Title>Transaction Explorer</Title>
        <Subtitle>Search and explore transactions in the BlockDAG network</Subtitle>
      </Header>

      <SearchSection>
        <form onSubmit={handleSearch}>
          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="Search by transaction hash or address..."
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

      <TransactionsGrid>
        {isLoading ? (
          [...Array(4)].map((_, index) => (
            <LoadingSkeleton key={index} />
          ))
        ) : (
          displayTransactions?.map((tx, index) => (
            <TransactionCard
              key={tx.hash}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <TransactionHeader>
                <TransactionHash>
                  <CreditCard size={20} />
                  {tx.hash}
                </TransactionHash>
                <StatusBadge status={tx.status}>
                  {getStatusText(tx.status)}
                </StatusBadge>
              </TransactionHeader>

              <TransactionFlow>
                <Address>
                  <AddressLabel>From</AddressLabel>
                  <AddressValue>{tx.from}</AddressValue>
                </Address>
                <ArrowContainer>
                  <ArrowRight size={24} />
                </ArrowContainer>
                <Address>
                  <AddressLabel>To</AddressLabel>
                  <AddressValue>{tx.to}</AddressValue>
                </Address>
              </TransactionFlow>

              <TransactionDetails>
                <DetailItem>
                  <DollarSign size={14} />
                  <DetailLabel>Amount:</DetailLabel>
                  <span>{formatAmount(tx.amount)}</span>
                </DetailItem>

                <DetailItem>
                  <Clock size={14} />
                  <DetailLabel>Time:</DetailLabel>
                  <span>{formatTime(tx.timestamp)}</span>
                </DetailItem>

                <DetailItem>
                  <Hash size={14} />
                  <DetailLabel>Block:</DetailLabel>
                  <span>{tx.blockHash.substring(0, 16)}...</span>
                </DetailItem>

                <DetailItem>
                  <CreditCard size={14} />
                  <DetailLabel>Status:</DetailLabel>
                  <span>{tx.status}</span>
                </DetailItem>
              </TransactionDetails>
            </TransactionCard>
          ))
        )}
      </TransactionsGrid>
    </Container>
  );
};

export default TransactionExplorer; 