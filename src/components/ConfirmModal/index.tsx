import { Modal, StyleSheet, Text, View } from 'react-native';
import { fonts, palette } from '../../theme';
import { Button } from '../Button';
import { Icon, type IconName } from '../Icon';

export type ConfirmModalProps = {
  visible: boolean;
  title: string;
  /** Aceita nós de texto para destacar trechos (ex.: nome da demanda em negrito). */
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: IconName;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
};

// Figma "modal-container" (confirmação de exclusão) sobre overlay escurecido.
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  icon = 'trash',
  loading = false,
  onConfirm,
  onCancel,
  testID = 'confirm-modal',
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.overlay} testID={testID}>
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.iconCircle}>
            <Icon name={icon} size={28} color={palette.danger} />
          </View>
          <View style={styles.texts}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.message}>{message}</Text>
          </View>
          <View style={styles.actions}>
            <Button
              label={cancelLabel}
              variant="outline"
              onPress={onCancel}
              disabled={loading}
              style={styles.action}
              testID={`${testID}-cancel`}
            />
            <Button
              label={confirmLabel}
              variant="danger"
              onPress={onConfirm}
              loading={loading}
              style={styles.action}
              testID={`${testID}-confirm`}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: palette.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: palette.white,
    borderRadius: 24,
    padding: 24,
    gap: 20,
    alignItems: 'center',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.17,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    gap: 8,
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.inter.extraBold,
    fontSize: 20,
    color: palette.text,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.inter.regular,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textMuted,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  action: {
    flex: 1,
    width: undefined,
  },
});
