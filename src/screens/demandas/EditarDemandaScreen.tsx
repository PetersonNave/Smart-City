import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  atualizarDemanda,
  enviarFotoDemanda,
  obterDemanda,
  type Demanda,
  type DemandaCategoria,
  type EditarDemandaInput,
} from '../../api/demandas';
import { ApiValidationError } from '../../api/envelope';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/Button';
import { GradientBackground } from '../../components/GradientBackground';
import { Loading } from '../../components/Loading';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useTabBarInset } from '../../components/TabBar';
import { podeEditar } from '../../domain/demanda';
import { useCurrentAddress } from '../../hooks/useCurrentAddress';
import { useDiscardGuard } from '../../hooks/useDiscardGuard';
import type { DemandaEditFeedback, DemandasStackScreenProps } from '../../navigation/types';
import { fonts, palette } from '../../theme';
import { DemandaFormFields } from './DemandaFormFields';
import { DEMANDA_FORM_VAZIO, editarDemandaSchema, type DemandaFormValues } from './demandaForm.schema';

type Props = DemandasStackScreenProps<'EditarDemanda'>;

const TEXT_FIELDS = ['titulo', 'descricao', 'categoria', 'localizacao'] as const;

function toFormValues(demanda: Demanda): DemandaFormValues {
  return {
    foto: null,
    titulo: demanda.title,
    categoria: demanda.category,
    descricao: demanda.description,
    localizacao: demanda.location,
  };
}

// Figma "Editar Demanda": mesmos campos da nova demanda, com a foto atual e os botões
// "Cancelar" / "Atualizar". Envia só o que mudou (PATCH) e a foto nova, se houver.
export function EditarDemandaScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarInset = useTabBarInset();
  const location = useCurrentAddress({ auto: false });
  const [demanda, setDemanda] = useState<Demanda | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState<DemandaEditFeedback | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<DemandaFormValues>({
    resolver: zodResolver(editarDemandaSchema),
    defaultValues: DEMANDA_FORM_VAZIO,
  });

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const current = await obterDemanda(id);
      setDemanda(current);
      // Os valores atuais viram a base do "isDirty" (o aviso de descarte só aparece se algo mudar).
      reset(toFormValues(current));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Não foi possível carregar a demanda.');
    }
  }, [id, reset]);

  useEffect(() => {
    load();
  }, [load]);

  // "Usar minha localização atual": só preenche quando o GPS responder.
  useEffect(() => {
    if (location.status === 'ready' && location.address) {
      setValue('localizacao', location.address, { shouldDirty: true, shouldValidate: true });
    }
  }, [location.status, location.address, setValue]);

  useDiscardGuard(isDirty && !saved, 'Descartar alterações?', 'As alterações feitas nesta demanda serão perdidas.');

  useEffect(() => {
    if (saved) navigation.popTo('DemandaDetalhe', { id, feedback: saved });
  }, [saved, id, navigation]);

  async function onSubmit(values: DemandaFormValues) {
    setSubmitError(null);

    const changes: EditarDemandaInput = {};
    TEXT_FIELDS.forEach((field) => {
      if (dirtyFields[field]) {
        (changes as Record<string, string>)[field] = values[field];
      }
    });
    if (changes.categoria) changes.categoria = values.categoria as DemandaCategoria;

    try {
      if (Object.keys(changes).length > 0) {
        await atualizarDemanda(id, changes);
      }
    } catch (error) {
      if (error instanceof ApiValidationError) {
        let mappedAny = false;
        TEXT_FIELDS.forEach((field) => {
          const messages = error.errors[field];
          if (messages?.length) {
            setError(field, { message: messages[0] });
            mappedAny = true;
          }
        });
        if (!mappedAny) setSubmitError(error.message);
        return;
      }
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível atualizar a demanda.');
      return;
    }

    let fotoFalhou = false;
    if (values.foto) {
      try {
        await enviarFotoDemanda(id, values.foto);
      } catch (error) {
        // Sem nenhuma outra alteração salva, o erro da foto fica na própria tela.
        if (Object.keys(changes).length === 0) {
          const message =
            error instanceof ApiValidationError && error.errors.foto?.length
              ? error.errors.foto[0]
              : error instanceof Error
                ? error.message
                : 'Não foi possível enviar a foto.';
          setError('foto', { message });
          return;
        }
        fotoFalhou = true;
      }
    }

    setSaved({ at: Date.now(), localizacaoAtualizada: Boolean(changes.localizacao), fotoFalhou });
  }

  const goBack = () => navigation.goBack();
  const canEdit = demanda ? podeEditar(demanda, user) : true;

  return (
    <GradientBackground variant="screen" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Editar Demanda" onBack={goBack} testID="editar-header" />

      {!demanda && !loadError && (
        <View style={styles.centered}>
          <Loading color={palette.white} testID="editar-loading" />
        </View>
      )}

      {loadError && (
        <View style={[styles.centered, styles.padded]} testID="editar-error">
          <Text style={styles.message}>{loadError}</Text>
          <Button label="Tentar novamente" variant="surface" onPress={load} testID="editar-retry" />
        </View>
      )}

      {demanda && !canEdit && (
        <View style={[styles.centered, styles.padded]} testID="editar-bloqueado">
          <Text style={styles.message}>
            Esta demanda não pode mais ser editada porque já saiu do status pendente.
          </Text>
          <Button label="Voltar" variant="surface" onPress={goBack} />
        </View>
      )}

      {demanda && canEdit && !loadError && (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: tabBarInset + 24 }]}
            keyboardShouldPersistTaps="handled"
          >
            <DemandaFormFields
              control={control}
              errors={errors}
              testIDPrefix="editar"
              existingPhotoUrl={demanda.photoUrl}
              locationPlaceholder="Endereço do problema"
              locationHint={
                <Pressable
                  onPress={location.retry}
                  disabled={location.status === 'locating'}
                  hitSlop={8}
                  accessibilityRole="button"
                  testID="editar-usar-gps"
                >
                  <Text style={styles.hint}>
                    {location.status === 'locating'
                      ? 'Obtendo localização pelo GPS...'
                      : location.status === 'denied'
                        ? 'Sem permissão de localização. '
                        : location.status === 'error'
                          ? 'Não foi possível obter o GPS. '
                          : ''}
                    {location.status !== 'locating' && (
                      <Text style={styles.hintAction}>
                        {location.status === 'denied' || location.status === 'error'
                          ? 'Tentar novamente'
                          : 'Usar minha localização atual'}
                      </Text>
                    )}
                  </Text>
                </Pressable>
              }
            />

            {submitError && (
              <Text style={styles.submitError} testID="editar-submit-error">
                {submitError}
              </Text>
            )}

            <View style={styles.actions}>
              <Button
                label="Cancelar"
                variant="outline"
                radius={15}
                onPress={goBack}
                disabled={isSubmitting}
                style={styles.action}
                testID="editar-cancelar"
              />
              <Button
                label="Atualizar"
                radius={15}
                loading={isSubmitting}
                onPress={handleSubmit(onSubmit)}
                style={styles.action}
                testID="editar-atualizar"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  padded: {
    paddingHorizontal: 32,
  },
  message: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 15,
    lineHeight: 21,
    color: palette.white,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 16,
  },
  hint: {
    fontFamily: fonts.inter.medium,
    fontSize: 13,
    color: palette.white,
    marginTop: 6,
    marginLeft: 16,
  },
  hintAction: {
    fontFamily: fonts.inter.bold,
    textDecorationLine: 'underline',
  },
  submitError: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 14,
    color: palette.white,
    backgroundColor: palette.danger,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    textAlign: 'center',
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  action: {
    flex: 1,
    width: undefined,
  },
});
