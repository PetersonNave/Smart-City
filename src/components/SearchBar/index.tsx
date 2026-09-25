import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { fonts, palette } from '../../theme';
import { Icon } from '../Icon';

export type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  testID?: string;
};

// Campo de busca sobre o gradiente, no mesmo raio dos cards das telas de demanda.
export function SearchBar({ value, onChangeText, placeholder = 'Buscar', testID = 'search-bar' }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Icon name="search" size={18} color={palette.textSubtle} />
      <TextInput
        testID={`${testID}-input`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textSubtle}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
        accessibilityLabel={placeholder}
        style={styles.input}
      />
      {value.length > 0 && (
        <Pressable
          testID={`${testID}-clear`}
          onPress={() => onChangeText('')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
        >
          <Icon name="close" size={18} color={palette.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.white,
  },
  input: {
    flex: 1,
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: palette.text,
    paddingVertical: 0,
  },
});

