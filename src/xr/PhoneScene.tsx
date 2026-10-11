import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { ViroAmbientLight, ViroARPlaneSelector, ViroARScene, ViroText } from '@reactvision/react-viro';
import DiagnosticContent from './DiagnosticContent';

export default function PhoneScene() {
  const selector = useRef<ViroARPlaneSelector>(null);
  const [selected, setSelected] = useState(false);
  return (
    <ViroARScene
      onAnchorFound={anchor => selector.current?.handleAnchorFound(anchor)}
      onAnchorUpdated={anchor => selector.current?.handleAnchorUpdated(anchor)}
      onAnchorRemoved={anchor => { if (anchor) selector.current?.handleAnchorRemoved(anchor); }}
    >
      <ViroAmbientLight color="#ffffff" intensity={500} />
      {!selected && <ViroText text="Scan a horizontal surface, then tap its outline." position={[0, 0, -1.5]} width={1.3} height={0.3} style={{ fontSize: 22, color: '#ffffff', textAlign: 'center' }} />}
      <ViroARPlaneSelector ref={selector} minWidth={0.3} minHeight={0.3} onPlaneSelected={() => setSelected(true)}>
        <DiagnosticContent onExit={() => router.replace('/')} />
      </ViroARPlaneSelector>
    </ViroARScene>
  );
}
