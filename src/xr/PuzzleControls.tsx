import { ViroBox, ViroNode } from '@reactvision/react-viro';
import { chapterComplete, chapterContent, chapterFields, objectNames, placementChoices, type PuzzleAction, type PuzzleSession } from '../../shared/puzzle';
import type { Chapter } from '../../shared/timefold';
import SceneLabel from './SceneLabel';

type Point = [number, number, number];
export function PuzzleButton({ label, position, disabled, selected = false, dispatchWhenDisabled = false, onPress }: { label: string; position: Point; disabled: boolean; selected?: boolean; dispatchWhenDisabled?: boolean; onPress: () => void }) {
  const click = () => { if (!disabled || dispatchWhenDisabled) onPress(); };
  return <ViroNode position={position} viroTag={`control-${label}`}>
    <SceneLabel text={label} position={[0, 0.105, 0]} width={0.51} height={0.075} color={disabled ? '#89968f' : selected ? '#8be0c4' : '#d7b47b'} size={0.3} />
    <ViroBox onClick={click} width={0.52} height={0.075} length={0.022} materials={disabled ? 'tfDark' : selected ? 'tfSignal' : 'tfBrass'} />
  </ViroNode>;
}

export default function PuzzleControls({ session, busy, dispatch }: { session: PuzzleSession; busy: boolean; dispatch: (action: PuzzleAction) => void }) {
  const confirming = session.pendingReset !== null;
  const selected = session.selected;
  return <ViroNode>
    <SceneLabel text={`CHAPTER ${session.chapter} / ${chapterContent[session.chapter].title}${chapterComplete(session.game, session.chapter) ? ' / COMPLETE' : ''}`} position={[0, -0.48, 0.58]} width={2.4} height={0.12} color="#eee9df" size={0.4} />
    {([1, 2, 3] satisfies Chapter[]).map((chapter, index) => <PuzzleButton key={chapter} label={`Chapter ${chapter}`} position={[(index - 1) * 0.58, -0.65, 0.58]} selected={chapter === session.chapter} disabled={busy || chapter > session.game.unlocked} onPress={() => dispatch({ kind: 'chapter', chapter })} />)}
    {!confirming && <ViroNode>
      {chapterFields[session.chapter].map((field, index, fields) => <PuzzleButton key={field} label={objectNames[field]} position={[(index - (fields.length - 1) / 2) * 0.58, -0.82, 0.58]} selected={selected === field} disabled={busy} onPress={() => dispatch({ kind: 'select', field })} />)}
      <SceneLabel text={selected ? `Selected: ${objectNames[selected]}. Choose a destination.` : 'Select a past object, then choose its destination.'} position={[0, -0.98, 0.58]} width={2.4} height={0.12} color="#d7b47b" size={0.3} />
      {[0, 1, 2].map(index => {
        const choice = selected ? placementChoices(selected)[index] : null;
        return <PuzzleButton key={index} label={choice?.label ?? `Destination ${index + 1}`} position={[(index - 1) * 0.58, -1.15, 0.58]} disabled={busy || !choice} dispatchWhenDisabled selected={choice ? session.game.state[choice.action.field] === choice.action.value : false} onPress={() => dispatch({ kind: 'placeChoice', index })} />;
      })}
    </ViroNode>}
    {confirming && <ViroNode>
      <SceneLabel text={`Reset chapter ${session.pendingReset}: ${chapterContent[session.pendingReset ?? session.chapter].title}? Earlier arrangements and learned unlocks are retained. Undo remains available.`} position={[0, -0.91, 0.58]} width={2.4} height={0.22} color="#eee9df" size={0.32} />
      <PuzzleButton label="Cancel reset" position={[-0.3, -1.15, 0.58]} disabled={busy} onPress={() => dispatch({ kind: 'cancelReset' })} />
      <PuzzleButton label={`Reset chapter ${session.pendingReset}`} position={[0.3, -1.15, 0.58]} disabled={busy} onPress={() => { if (session.pendingReset) dispatch({ kind: 'confirmReset', chapter: session.pendingReset }); }} />
    </ViroNode>}
  </ViroNode>;
}
