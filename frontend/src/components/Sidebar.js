import React from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Box, 
  CreditCard, 
  BarChart3, 
  Settings,
  Layers,
  Activity
} from 'lucide-react';

const SidebarContainer = styled.aside`
  width: 280px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px 0;
  height: calc(100vh - 80px);
  overflow-y: auto;
`;

const NavSection = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 24px 16px;
`;

const NavItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  color: ${props => props.$active ? '#667eea' : 'rgba(255, 255, 255, 0.8)'};
  text-decoration: none;
  font-weight: ${props => props.$active ? '600' : '500'};
  background: ${props => props.$active ? 'rgba(102, 126, 234, 0.1)' : 'transparent'};
  border-right: ${props => props.$active ? '3px solid #667eea' : 'none'};
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.$active ? 'rgba(102, 126, 234, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
    color: ${props => props.$active ? '#667eea' : 'white'};
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`;

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      section: 'Overview',
      items: [
        { path: '/', label: 'Dashboard', icon: Home },
        { path: '/metrics', label: 'Network Metrics', icon: BarChart3 },
      ]
    },
    {
      section: 'Explorer',
      items: [
        { path: '/blocks', label: 'Block Explorer', icon: Box },
        { path: '/transactions', label: 'Transaction Explorer', icon: CreditCard },
      ]
    },
    {
      section: 'Visualization',
      items: [
        { path: '/dag-view', label: 'DAG View', icon: Layers },
        { path: '/activity', label: 'Activity Monitor', icon: Activity },
      ]
    },
    {
      section: 'Settings',
      items: [
        { path: '/settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  return (
    <SidebarContainer>
      {menuItems.map((section, sectionIndex) => (
        <NavSection key={sectionIndex}>
          <SectionTitle>{section.section}</SectionTitle>
          {section.items.map((item, itemIndex) => {
            const Icon = item.icon;
            return (
              <NavItem
                key={itemIndex}
                to={item.path}
                $active={isActive(item.path)}
              >
                <IconWrapper>
                  <Icon size={18} />
                </IconWrapper>
                {item.label}
              </NavItem>
            );
          })}
        </NavSection>
      ))}
    </SidebarContainer>
  );
};

export default Sidebar; 