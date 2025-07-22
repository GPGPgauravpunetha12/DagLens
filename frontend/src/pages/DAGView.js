import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { useQuery } from 'react-query';
import { 
  Search, 
  Eye, 
  EyeOff, 
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { blockAPI } from '../services/kaspaApi';

const Container = styled.div`
  padding: 24px;
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
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

const ControlsPanel = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
`;

const ControlButton = styled.button`
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: #667eea;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 8px;
  flex: 1;
  max-width: 400px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const VisualizationContainer = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
`;

const Legend = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  z-index: 10;
  min-width: 200px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  color: white;
`;

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.color};
`;

const StatsPanel = styled.div`
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  z-index: 10;
  min-width: 250px;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: white;
`;

const StatLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
`;

const StatValue = styled.span`
  font-weight: 600;
`;

const BlockInfoPanel = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  z-index: 10;
  min-width: 300px;
  max-width: 400px;
`;

const InfoTitle = styled.h4`
  margin: 0 0 12px 0;
  color: white;
  font-size: 14px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
`;

const InfoLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
`;

const InfoValue = styled.span`
  color: white;
  font-weight: 500;
`;

// Enhanced 3D Block Component
const BlockNode = ({ block, position, onClick, isSelected, showLabels, isSink, isOrphan }) => {
  const color = block.isTip ? '#f59e0b' : (block.color === 'blue' ? '#10b981' : '#667eea');
  const size = 0.5 + (block.daaScore ? Math.min(block.daaScore / 1000, 2) : 0);
  const glowColor = isSink ? '#fbbf24' : color;

  return (
    <group position={position}>
      {/* Glow effect for sink blocks */}
      {isSink && (
        <mesh>
          <sphereGeometry args={[size * 1.5, 16, 16]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.3} />
        </mesh>
      )}
      
      {/* Main block */}
      <mesh onClick={onClick}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={isSelected ? 0.3 : 0.1}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Labels */}
      {showLabels && (
        <Html position={[0, size + 0.5, 0]} center>
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}>
            {block.hash ? `${block.hash.substring(0, 8)}...${block.hash.substring(block.hash.length - 8)}` : 'N/A'}
            {isSink && ' (Sink)'}
            {isOrphan && ' (Orphan)'}
          </div>
        </Html>
      )}
    </group>
  );
};

// Edge component for connections
const BlockEdge = ({ start, end }) => (
  <line>
    <bufferGeometry>
      <bufferAttribute
        attach="attributes-position"
        count={2}
        array={new Float32Array([...start, ...end])}
        itemSize={3}
      />
    </bufferGeometry>
    <lineBasicMaterial color="#ffffff" opacity={0.3} transparent />
  </line>
);

// Layered layout function
function getLayeredPositions(blocks, heightGroups) {
  const positions = {};
  const layerSpacing = 3;
  const nodeSpacing = 2;

  Object.keys(heightGroups).forEach((height, layerIndex) => {
    const layerBlocks = heightGroups[height] || [];
    const layerY = layerIndex * layerSpacing;
    
    layerBlocks.forEach((blockId, blockIndex) => {
      const x = (blockIndex - (layerBlocks.length - 1) / 2) * nodeSpacing;
      const z = 0;
      positions[blockId] = [x, layerY, z];
    });
  });

  return positions;
}

const DAGView = () => {
  const [showLabels, setShowLabels] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch blocks data
  const { data: blocks, isLoading: blocksLoading } = useQuery(
    'blocks',
    () => blockAPI.getBlocks(50),
    {
      refetchInterval: 10000,
    }
  );

  // Process data for visualization
  const processedData = useMemo(() => {
    try {
      if (!blocks || blocks.length === 0) return { nodes: [], edges: [], metrics: {} };
      
      // Create mock DAG structure for demonstration
      const processedBlocks = blocks.map((block, index) => ({
        ...block,
        id: index,
        hash: block.hash || `block_${index}`,
        height: block.height || Math.floor(index / 5),
        daaScore: block.daaScore || index * 100,
        color: index % 3 === 0 ? 'blue' : 'red',
        isTip: index >= blocks.length - 5,
        blueWork: block.weight || index * 10,
        parentIds: index > 0 ? [blocks[index - 1]?.hash] : [],
        timestamp: block.timestamp || Date.now(),
      }));
      
      // Create connections (mock parent-child relationships)
      const connections = [];
      processedBlocks.forEach((block, index) => {
        if (index > 0) {
          connections.push({
            from: index - 1,
            to: index,
          });
        }
      });
      
      // Group blocks by height
      const heightGroups = {};
      processedBlocks.forEach(block => {
        if (!heightGroups[block.height]) {
          heightGroups[block.height] = [];
        }
        heightGroups[block.height].push(block.id);
      });
      
      const positions = getLayeredPositions(processedBlocks, heightGroups);
      const nodes = processedBlocks.map((block) => ({
        ...block,
        position: positions[block.id] || [0, 0, 0],
        isOrphan: !processedBlocks.some(b => b.parentIds && b.parentIds.includes(block.hash)),
      }));
      
      const sinkBlock = processedBlocks.reduce((sink, block) => {
        const sinkWork = sink.blueWork || 0;
        const blockWork = block.blueWork || 0;
        return blockWork > sinkWork ? block : sink;
      }, processedBlocks[0] || null);
      
      const metrics = {
        totalBlocks: processedBlocks.length,
        tips: processedBlocks.filter(b => b.isTip).length,
        orphans: processedBlocks.filter(b => !processedBlocks.some(other => other.parentIds && other.parentIds.includes(b.hash))).length,
        connections: connections.length,
        avgParentsPerBlock: processedBlocks.length > 0 ? connections.length / processedBlocks.length : 0,
        heightRange: 0,
      };
      
      return {
        nodes,
        edges: connections,
        metrics,
        sinkBlock: sinkBlock?.hash
      };
    } catch (error) {
      console.error('Error processing DAG data:', error);
      return { nodes: [], edges: [], metrics: {} };
    }
  }, [blocks]);

  const handleBlockClick = (block) => setSelectedBlock(block);
  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => setIsLoading(false), 1000);
  };

  const filteredNodes = processedData.nodes.filter(node => {
    if (searchQuery) {
      return node.hash.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (filterStatus === 'all') return true;
    if (filterStatus === 'tips') return node.isTip;
    if (filterStatus === 'sink') return node.hash === processedData.sinkBlock;
    if (filterStatus === 'orphans') return node.isOrphan;
    if (filterStatus === 'blue') return node.color === 'blue';
    if (filterStatus === 'red') return node.color === 'red';
    return true;
  });

  return (
    <Container>
      <Header>
        <Title>BlockDAG Visualization</Title>
        <Subtitle>Real-time 3D visualization of BlockDAG network topology</Subtitle>
      </Header>

      <ControlsPanel>
        <ControlButton
          onClick={() => setShowLabels(!showLabels)}
          className={showLabels ? 'active' : ''}
        >
          {showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
          {showLabels ? 'Hide Labels' : 'Show Labels'}
        </ControlButton>

        <ControlButton
          onClick={() => setAutoRotate(!autoRotate)}
          className={autoRotate ? 'active' : ''}
        >
          {autoRotate ? <Pause size={16} /> : <Play size={16} />}
          {autoRotate ? 'Stop Rotation' : 'Start Rotation'}
        </ControlButton>

        <ControlButton onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </ControlButton>

        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Search blocks by hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ControlButton>
            <Search size={16} />
          </ControlButton>
        </SearchContainer>

        <ControlButton
          onClick={() => setFilterStatus('all')}
          className={filterStatus === 'all' ? 'active' : ''}
        >
          All
        </ControlButton>
        <ControlButton
          onClick={() => setFilterStatus('tips')}
          className={filterStatus === 'tips' ? 'active' : ''}
        >
          Tips
        </ControlButton>
        <ControlButton
          onClick={() => setFilterStatus('sink')}
          className={filterStatus === 'sink' ? 'active' : ''}
        >
          Sink
        </ControlButton>
        <ControlButton
          onClick={() => setFilterStatus('orphans')}
          className={filterStatus === 'orphans' ? 'active' : ''}
        >
          Orphans
        </ControlButton>
        <ControlButton
          onClick={() => setFilterStatus('blue')}
          className={filterStatus === 'blue' ? 'active' : ''}
        >
          Blue
        </ControlButton>
        <ControlButton
          onClick={() => setFilterStatus('red')}
          className={filterStatus === 'red' ? 'active' : ''}
        >
          Red
        </ControlButton>
      </ControlsPanel>

      <VisualizationContainer>
        {/* Legend */}
        <Legend>
          <h4 style={{ margin: '0 0 12px 0', color: 'white', fontSize: '14px' }}>Legend</h4>
          <LegendItem>
            <LegendColor color="#f59e0b" />
            <span>Tip Blocks</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="#10b981" />
            <span>Blue Blocks</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="#667eea" />
            <span>Red Blocks</span>
          </LegendItem>
          <LegendItem>
            <LegendColor color="#fbbf24" />
            <span>Sink Block</span>
          </LegendItem>
        </Legend>

        {/* Stats Panel */}
        <StatsPanel>
          <h4 style={{ margin: '0 0 12px 0', color: 'white' }}>Network Metrics</h4>
          <StatItem>
            <StatLabel>Total Blocks:</StatLabel>
            <StatValue>{processedData.metrics.totalBlocks || 0}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Active Tips:</StatLabel>
            <StatValue>{processedData.metrics.tips || 0}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Orphans:</StatLabel>
            <StatValue>{processedData.metrics.orphans || 0}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Connections:</StatLabel>
            <StatValue>{processedData.metrics.connections || 0}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Avg Parents/Block:</StatLabel>
            <StatValue>{(processedData.metrics.avgParentsPerBlock || 0).toFixed(2)}</StatValue>
          </StatItem>
        </StatsPanel>

        {/* Block Info Panel */}
        {selectedBlock && (
          <BlockInfoPanel>
            <InfoTitle>Block Details</InfoTitle>
            <InfoRow>
              <InfoLabel>Hash:</InfoLabel>
              <InfoValue>{selectedBlock.hash ? `${selectedBlock.hash.substring(0, 12)}...${selectedBlock.hash.substring(selectedBlock.hash.length - 12)}` : 'N/A'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Height:</InfoLabel>
              <InfoValue>{selectedBlock.height || 'N/A'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>DAA Score:</InfoLabel>
              <InfoValue>{selectedBlock.daaScore || 'N/A'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Color:</InfoLabel>
              <InfoValue>{selectedBlock.color || 'N/A'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Is Tip:</InfoLabel>
              <InfoValue>{selectedBlock.isTip ? 'Yes' : 'No'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Blue Work:</InfoLabel>
              <InfoValue>{selectedBlock.blueWork || 'N/A'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Parents:</InfoLabel>
              <InfoValue>{selectedBlock.parentIds?.length || 0}</InfoValue>
            </InfoRow>
          </BlockInfoPanel>
        )}

        {/* 3D Canvas */}
        <Canvas
          camera={{ position: [0, 0, 15], fov: 75 }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          {/* Render blocks */}
          {filteredNodes.map((node, index) => (
            <BlockNode
              key={node.hash}
              block={node}
              position={node.position}
              onClick={() => handleBlockClick(node)}
              isSelected={selectedBlock?.hash === node.hash}
              showLabels={showLabels}
              isSink={node.hash === processedData.sinkBlock}
              isOrphan={node.isOrphan}
            />
          ))}
          
          {/* Render connections */}
          {processedData.edges.map((edge, index) => {
            const startNode = processedData.nodes.find(n => n.id === edge.from);
            const endNode = processedData.nodes.find(n => n.id === edge.to);
            if (startNode && endNode) {
              return (
                <BlockEdge
                  key={`${edge.from}-${edge.to}`}
                  start={startNode.position}
                  end={endNode.position}
                />
              );
            }
            return null;
          })}
          
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
            maxDistance={50}
            minDistance={5}
          />
        </Canvas>
      </VisualizationContainer>
    </Container>
  );
};

export default DAGView; 