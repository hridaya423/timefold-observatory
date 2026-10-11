import { readFile } from 'node:fs/promises';

async function source(path, pointName = 'Point') {
  return (await readFile(new URL(path, import.meta.url), 'utf8'))
    .replace(/^import .*\r?\n/gm, '')
    .replace(/export default function /g, 'function ')
    .replace(/^export /gm, '')
    .replace(/\bPoint\b/g, pointName);
}
const code = await Promise.all([
  source('../../shared/timefold.ts'), source('../../shared/puzzle.ts'),
  source('../../src/xr/SceneLabel.tsx', 'LabelPoint'), source('../../src/xr/PuzzleControls.tsx', 'ControlPoint'),
]);
console.log(`import React from 'react';\nimport {Viro3DSceneNavigator,ViroScene,ViroCamera,ViroNode,ViroBox,ViroText,ViroMaterials,ViroAmbientLight} from '@reactvision/react-viro';\n${code.join('\n')}\nViroMaterials.createMaterials({tfBrass:{diffuseColor:'#c6a065'},tfDark:{diffuseColor:'#182323'},tfSignal:{diffuseColor:'#8be0c4'}});\nfunction Preview(){const [session,setSession]=React.useState(newPuzzleSession);const dispatch=action=>setSession(before=>{const next=reducePuzzle(before,action);console.log(JSON.stringify({event:action.kind,cell:next.game.state.cell,fuse:next.game.state.fuse,selected:next.selected,revision:next.game.revision}));return next;});return <ViroScene><ViroAmbientLight color="#ffffff" intensity={650}/><ViroCamera active position={[0,-0.8,2.4]} /><PuzzleControls session={session} busy={false} dispatch={dispatch}/><SceneLabel text={session.trace?session.trace.past:'Select a past object'} position={[0,-1.38,0.58]} width={2.4} height={0.2} color="#ffffff" /></ViroScene>;}\nexport default function App(){return <Viro3DSceneNavigator initialScene={{scene:Preview}} style={{width:'100%',height:'100%'}}/>;}\n`);
