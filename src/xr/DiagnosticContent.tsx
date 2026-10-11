import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { AppState } from 'react-native';
import { ViroBox, ViroMaterials, ViroNode, ViroText } from '@reactvision/react-viro';

type Point = [number, number, number];
type Source = Parameters<NonNullable<ComponentProps<typeof ViroBox>['onDrag']>>[1];

ViroMaterials.createMaterials({
  diagnosticCell: { diffuseColor: '#d7b47b' },
  diagnosticTarget: { diffuseColor: '#4c776b' },
});

export default function DiagnosticContent({ onExit }: { onExit: () => void }) {
  const [position, setPosition] = useState<Point>([-0.2, 0.12, 0]);
  const [message, setMessage] = useState('Press and drag the brass box. Raw event coordinates are shown below.');
  const [counts, setCounts] = useState({ presses: 0, releases: 0, dragEvents: 0 });
  const dragSource = useRef<Source | null>(null);
  const lastRender = useRef(0);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', status => {
      if (status !== 'active') dragSource.current = null;
    });
    return () => subscription.remove();
  }, []);

  return (
    <ViroNode>
      <ViroText text="Native input diagnostic" position={[0, 0.62, 0]} width={1.3} height={0.16} style={{ fontSize: 26, color: '#eee9df', textAlign: 'center' }} />
      <ViroText text={message} position={[0, 0.4, 0]} width={1.4} height={0.26} style={{ fontSize: 16, color: '#eee9df', textAlign: 'center' }} />
      <ViroBox
        position={position}
        width={0.14} height={0.14} length={0.14}
        materials={['diagnosticCell']}
        dragType="FixedToPlane"
        dragPlane={{ planePoint: [0, 0.12, 0], planeNormal: [0, 1, 0], maxDistance: 3 }}
        onClickState={(clickState, _point, source) => {
          if (clickState === 1 && dragSource.current === null) {
            dragSource.current = source;
            setCounts(current => ({ ...current, presses: current.presses + 1 }));
          }
          if (clickState === 2 && dragSource.current === source) {
            dragSource.current = null;
            setCounts(current => ({ ...current, releases: current.releases + 1 }));
            setMessage('Release received. Verify the parent coordinate frame on the device before enabling socket snapping.');
          }
        }}
        onDrag={(point, source) => {
          if (dragSource.current !== source || Date.now() - lastRender.current < 100) return;
          lastRender.current = Date.now();
          setMessage(`Drag source ${String(source)}: ${point.map(value => value.toFixed(3)).join(', ')}`);
          setCounts(current => ({ ...current, dragEvents: current.dragEvents + 1 }));
        }}
      />
      <ViroBox position={[0.3, 0.04, 0]} width={0.22} height={0.025} length={0.22} materials={['diagnosticTarget']} />
      <ViroText text="Reference socket" position={[0.3, -0.1, 0]} width={0.7} height={0.12} style={{ fontSize: 16, color: '#eee9df', textAlign: 'center' }} />
      <ViroText text={`Presses ${counts.presses} / releases ${counts.releases} / drag samples ${counts.dragEvents}`} position={[0, -0.28, 0]} width={1.4} height={0.15} style={{ fontSize: 15, color: '#eee9df', textAlign: 'center' }} />
      <ViroText text="Reset box" position={[-0.3, -0.48, 0]} width={0.5} height={0.15} style={{ fontSize: 20, color: '#d7b47b', textAlign: 'center' }} onClick={() => { dragSource.current = null; setPosition([-0.2, 0.12, 0]); setCounts({ presses: 0, releases: 0, dragEvents: 0 }); setMessage('Box reset. Native coordinate interpretation still needs device verification.'); }} />
      <ViroText text="Exit diagnostic" position={[0.3, -0.48, 0]} width={0.6} height={0.15} style={{ fontSize: 20, color: '#d7b47b', textAlign: 'center' }} onClick={onExit} />
    </ViroNode>
  );
}
