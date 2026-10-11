import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function LabButton({ label, onPress, disabled = false, selected = false, primary = false }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  selected?: boolean;
  primary?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, selected }} disabled={disabled}
      onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [styles.button, (primary || selected) && styles.selected, hovered && !disabled && styles.hover, focused && styles.focus, pressed && styles.pressed, disabled && styles.disabled]}>
      <Text style={[styles.label, (primary || selected) && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 46, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#566052', justifyContent: 'center' },
  label: { color: '#eee9df', fontSize: 14, fontWeight: '500' },
  selected: { backgroundColor: '#d7b47b', borderColor: '#d7b47b' },
  selectedLabel: { color: '#141817' },
  hover: { borderColor: '#eee9df' },
  focus: { borderWidth: 2, borderColor: '#f6e4ba' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
});
