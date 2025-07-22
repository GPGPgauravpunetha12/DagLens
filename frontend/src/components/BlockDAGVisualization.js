import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

const Block = ({ block, position, isTip, showLabels, onClick }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = React.useState(false);

  // Different colors for different block types
  const getBlockColor = () => {
    if (isTip) return '#f59e0b'; // Orange for tips
    if (block.confirmations > 50) return '#10b981'; // Green for confirmed
    if (block.confirmations > 10) return '#667eea'; // Blue for partially confirmed
    return '#6b7280'; // Gray for unconfirmed
  };

  const color = getBlockColor();

  useFrame((state) => {
    if (meshRef.current) {
      // Add subtle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      
      // Add rotation for tips
      if (isTip) {
        meshRef.current.rotation.y += 0.01;
      }
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.2 : 1}
      >
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial 
          color={color}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {showLabels && (
        <Html position={[0, 1.2, 0]} center>
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
          }}>
            {block.id}
          </div>
        </Html>
      )}
      
      {hovered && (
        <Html position={[0, -1.2, 0]} center>
          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            minWidth: '200px',
          }}>
            <div><strong>Block ID:</strong> {block.id}</div>
            <div><strong>Hash:</strong> {block.hash.substring(0, 16)}...</div>
            <div><strong>Confirmations:</strong> {block.confirmations}</div>
            <div><strong>Weight:</strong> {block.weight}</div>
            <div><strong>Tip:</strong> {isTip ? 'Yes' : 'No'}</div>
          </div>
        </Html>
      )}
    </group>
  );
};

const Connection = ({ start, end, color = '#ffffff' }) => {
  const points = useMemo(() => {
    const startPoint = new THREE.Vector3(...start);
    const endPoint = new THREE.Vector3(...end);
    const curve = new THREE.LineCurve3(startPoint, endPoint);
    return curve.getPoints(50);
  }, [start, end]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.6} />
    </line>
  );
};

const BlockDAGVisualization = ({ blocks, showLabels, autoRotate }) => {
  const groupRef = useRef();
  const [selectedBlock, setSelectedBlock] = React.useState(null);

  // Calculate positions for blocks in a DAG layout
  const blockPositions = useMemo(() => {
    const positions = {};
    const levels = {};
    
    // Group blocks by timestamp (simplified level calculation)
    blocks.forEach(block => {
      const timestamp = new Date(block.timestamp).getTime();
      const level = Math.floor(timestamp / 60000); // Group by minute
      
      if (!levels[level]) {
        levels[level] = [];
      }
      levels[level].push(block);
    });

    // Calculate positions
    Object.keys(levels).forEach((level, levelIndex) => {
      const blocksInLevel = levels[level];
      const levelWidth = Math.max(blocksInLevel.length * 2, 4);
      
      blocksInLevel.forEach((block, blockIndex) => {
        const x = (blockIndex - blocksInLevel.length / 2) * 2;
        const y = levelIndex * 3;
        const z = Math.sin(blockIndex * 0.5) * 2;
        
        positions[block.id] = [x, y, z];
      });
    });

    return positions;
  }, [blocks]);

  // Generate connections between blocks
  const connections = useMemo(() => {
    const conns = [];
    
    blocks.forEach(block => {
      if (block.parentHash) {
        const parentBlock = blocks.find(b => b.hash === block.parentHash);
        if (parentBlock && blockPositions[block.id] && blockPositions[parentBlock.id]) {
          conns.push({
            start: blockPositions[parentBlock.id],
            end: blockPositions[block.id],
            color: block.isTip ? '#f59e0b' : '#667eea'
          });
        }
      }
    });

    return conns;
  }, [blocks, blockPositions]);

  useFrame((state) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  const handleBlockClick = (block) => {
    setSelectedBlock(selectedBlock?.id === block.id ? null : block);
    console.log('Selected block:', block);
  };

  return (
    <group ref={groupRef}>
      {/* Render connections first (behind blocks) */}
      {connections.map((conn, index) => (
        <Connection key={`conn-${index}`} {...conn} />
      ))}
      
      {/* Render blocks */}
      {blocks.map((block) => {
        const position = blockPositions[block.id];
        if (!position) return null;
        
        return (
          <Block
            key={block.id}
            block={block}
            position={position}
            isTip={block.isTip}
            showLabels={showLabels}
            onClick={() => handleBlockClick(block)}
          />
        );
      })}
      
      {/* Legend */}
      <Html position={[-8, 8, 0]}>
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Legend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '2px' }} />
            <span>Tip Blocks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }} />
            <span>Confirmed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '12px', height: '12px', background: '#667eea', borderRadius: '2px' }} />
            <span>Partially Confirmed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', background: '#6b7280', borderRadius: '2px' }} />
            <span>Unconfirmed</span>
          </div>
        </div>
      </Html>
    </group>
  );
};

export default BlockDAGVisualization; 