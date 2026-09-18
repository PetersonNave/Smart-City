import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Em construção</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontFamily: fonts.inter.extraBold, fontSize: 24, color: colors.navy },
  subtitle: { fontFamily: fonts.inter.medium, fontSize: 14, color: '#90A4AE' },
});
