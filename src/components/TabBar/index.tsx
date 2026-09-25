import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Icon, type IconName } from '../Icon';
import { colors, fonts, palette } from '../../theme';

// Figma "bottom-nav-bar": 60px de abas + área do home indicator, fundo branco,
// cantos superiores de 30px e borda superior #E8ECF0. Fica sobreposta (absolute)
// ao conteúdo para o gradiente das telas aparecer atrás dos cantos arredondados.
export const TAB_BAR_HEIGHT = 60;

/** Espaço que o conteúdo rolável de uma aba precisa reservar para não ficar sob a TabBar. */
export function useTabBarInset(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, 8);
}

export type TabBarProps = BottomTabBarProps & {
  icons: Record<string, IconName>;
};

export function TabBar({ state, descriptors, navigation, icons }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]} testID="tab-bar">
      <View style={styles.tabs}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = typeof options.title === 'string' ? options.title : route.name;
          const isFocused = state.index === index;
          const color = isFocused ? colors.primary : palette.textSubtle;

          function onPress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }

          return (
            <Pressable
              key={route.key}
              testID={`tab-${route.name}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={styles.tab}
            >
              <Icon name={icons[route.name]} size={22} color={color} />
              <Text style={[styles.label, isFocused ? styles.labelActive : null, { color }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderColor: palette.border,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  tabs: {
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  tab: {
    width: 76,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: fonts.inter.medium,
    fontSize: 11,
  },
  labelActive: {
    fontFamily: fonts.inter.bold,
  },
});
