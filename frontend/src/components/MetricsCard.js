import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Card = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.color};
    opacity: 0.8;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const Title = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${props => props.color}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color};
`;

const Value = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
  display: flex;
  align-items: baseline;
  gap: 8px;
`;

const Unit = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
`;

const LoadingSkeleton = styled.div`
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.1) 25%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  height: 32px;
  border-radius: 6px;
  margin-bottom: 8px;

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const MetricsCard = ({ title, value, unit, icon: Icon, color, loading }) => {
  if (loading) {
    return (
      <Card
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Header>
          <Title>{title}</Title>
          <IconWrapper color={color}>
            <Icon size={20} />
          </IconWrapper>
        </Header>
        <LoadingSkeleton />
        <div style={{ height: '16px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }} />
      </Card>
    );
  }

  return (
    <Card
      color={color}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Header>
        <Title>{title}</Title>
        <IconWrapper color={color}>
          <Icon size={20} />
        </IconWrapper>
      </Header>
      
      <Value>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <Unit>{unit}</Unit>}
      </Value>
      
      <div style={{ 
        fontSize: '12px', 
        color: 'rgba(255, 255, 255, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: color,
          animation: 'pulse 2s infinite'
        }} />
        Live data
      </div>
    </Card>
  );
};

export default MetricsCard; 