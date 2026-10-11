import { exitVRScene, ViroAmbientLight, ViroController, ViroNode, ViroScene } from '@reactvision/react-viro';
import DiagnosticContent from './DiagnosticContent';

export default function QuestScene() {
  return (
    <ViroScene>
      <ViroAmbientLight color="#ffffff" intensity={500} />
      <ViroController reticleVisibility controllerVisibility />
      <ViroNode position={[0, -0.2, -1.6]}>
        <DiagnosticContent onExit={exitVRScene} />
      </ViroNode>
    </ViroScene>
  );
}
