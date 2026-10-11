import { exitVRScene, ViroAmbientLight, ViroController, ViroNode, ViroScene } from '@reactvision/react-viro';
import TimeFoldContent from './TimeFoldContent';

export default function TimeFoldQuestScene() {
  return <ViroScene>
    <ViroAmbientLight color="#ffffff" intensity={650} />
    <ViroController reticleVisibility controllerVisibility />
    <ViroNode position={[0, -0.25, -2.3]}><TimeFoldContent onExit={exitVRScene} /></ViroNode>
  </ViroScene>;
}
