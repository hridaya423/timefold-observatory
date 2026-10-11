import { exitVRScene, ViroAmbientLight, ViroARScene, ViroController, ViroNode } from '@reactvision/react-viro';
import TimeFoldContent from './TimeFoldContent';

export default function TimeFoldQuestScene() {
  return <ViroARScene>
    <ViroAmbientLight color="#ffffff" intensity={650} />
    <ViroController reticleVisibility controllerVisibility />
    <ViroNode position={[0, -0.25, -2.3]}><TimeFoldContent onExit={exitVRScene} /></ViroNode>
  </ViroARScene>;
}
