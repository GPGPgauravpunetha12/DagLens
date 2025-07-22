import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Wifi, WifiOff, Search, Menu } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
`;

const Logo = styled(Link)`
  font-size: 24px;
  font-weight: 700;
  color: white;
  text-decoration: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 500px;
  margin: 0 48px;
`;

const SearchInput = styled.input`
  width: 100%;
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
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${props => props.connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  border: 1px solid ${props => props.connected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
  border-radius: 6px;
  color: ${props => props.connected ? '#10b981' : '#ef4444'};
  font-size: 12px;
  font-weight: 500;
`;

const MenuButton = styled.button`
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const Header = () => {
  const { isConnected } = useWebSocket();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results or implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <HeaderContainer>
      <Logo to="/">BlockDAG Lens</Logo>
      
      <SearchContainer>
        <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%', gap: '12px' }}>
          <SearchInput
            type="text"
            placeholder="Search blocks, transactions, or addresses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchButton type="submit">
            <Search size={18} />
          </SearchButton>
        </form>
      </SearchContainer>

      <RightSection>
        <ConnectionStatus connected={isConnected}>
          {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
          {isConnected ? 'Connected' : 'Disconnected'}
        </ConnectionStatus>
        
        <MenuButton>
          <Menu size={20} />
        </MenuButton>
      </RightSection>
    </HeaderContainer>
  );
};

export default Header; 