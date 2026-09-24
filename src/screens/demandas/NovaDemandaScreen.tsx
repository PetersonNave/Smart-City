import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiValidationError } from '../../api/envelope';
import { criarDemanda, DEMANDA_CATEGORIAS, type Demanda, type DemandaCategoria } from '../../api/demandas';
import { Button } from '../../components/Button';
import { GradientBackground } from '../../components/GradientBackground';
import { Icon } from '../../components/Icon';
import { PhotoField } from '../../components/PhotoField';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';
import { CATEGORIA_LABELS, STATUS_META } from '../../domain/demanda';
import { useCurrentAddress } from '../../hooks/useCurrentAddress';
import type { AppStackScreenProps } from '../../navigation/types';
import { fonts, palette } from '../../theme';
import { novaDemandaSchema, type NovaDemandaFormValues } from './NovaDemandaScreen.schema';

type Props = AppStackScreenProps<'NovaDemanda'>;

const CATEGORIA_OPTIONS = DEMANDA_CATEGORIAS.map((value) => ({ value, label: CATEGORIA_LABELS[value] }));
const API_FIELDS = ['titulo', 'descricao', 'categoria', 'localizacao'] as const;

const LOCATION_PLACEHOLDER = {
  locating: 'Obtendo localização pelo GPS...',
  ready: 'Endereço do problema',
  denied: 'Digite o endereço do problema',
  error: 'Digite o endereço do problema',
} as const;

// Figma "Nova demanda" (estados normal e "Anexe ao menos uma foto").
export function NovaDemandaScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const location = useCurrentAddress();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<Demanda | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NovaDemandaFormValues>({
    resolver: zodResolver(novaDemandaSchema),
    defaultValues: { foto: '', titulo: '', categoria: '', descricao: '', localizacao: '' },
  });
  // Guarda o endereço vindo do GPS para saber se o usuário o editou à mão.
  const gpsAddress = useRef<string | null>(null);

  useEffect(() => {
    if (location.status === 'ready' && location.address && !getValues('localizacao')) {
      gpsAddress.current = location.address;
      setValue('localizacao', location.address, { shouldValidate: Boolean(errors.localizacao) });
    }
  }, [location.status, location.address, getValues, setValue, errors.localizacao]);

  // Voltar (botão, gesto ou botão físico do Android) com o formulário preenchido pede confirmação.
  usePreventRemove(isDirty && !created, ({ data }) => {
    Alert.alert('Descartar demanda?', 'As informações preenchidas serão perdidas.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  // Navega só depois do re-render com `created`, para o bloqueio acima já estar desligado.
  useEffect(() => {
    if (created) navigation.replace('DemandaEnviada', { demanda: created });
  }, [created, navigation]);

  async function onSubmit(values: NovaDemandaFormValues) {
    setSubmitError(null);
    try {
      // A API ainda não recebe fotos (não há campo no DemandaCreateSchema): a foto é
      // exigida pelo fluxo do Figma, mas por enquanto fica só no aparelho.
      const demanda = await criarDemanda({
        titulo: values.titulo,
        descricao: values.descricao,
        categoria: values.categoria as DemandaCategoria,
        localizacao: values.localizacao,
        // Cidadão não escolhe prioridade no Figma; a triagem fica com o gestor.
        prioridade: 'media',
      });
      setCreated(demanda);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        let mappedAny = false;
        API_FIELDS.forEach((field) => {
          const messages = error.errors[field];
          if (messages?.length) {
            setError(field, { message: messages[0] });
            mappedAny = true;
          }
        });
        if (!mappedAny) setSubmitError(error.message);
        return;
      }
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível enviar a demanda.');
    }
  }

  return (
    <GradientBackground variant="screen" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Nova demanda" variant="plain" onBack={() => navigation.goBack()} testID="nova-header" />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Controller
            control={control}
            name="foto"
            render={({ field }) => (
              <PhotoField
                value={field.value || null}
                onChange={(uri) => field.onChange(uri)}
                error={errors.foto?.message}
                testID="nova-foto"
              />
            )}
          />

          <Controller
            control={control}
            name="titulo"
            render={({ field }) => (
              <TextField
                variant="card"
                label="Título"
                placeholder="Ex.: Semáforo danificado"
                autoCapitalize="sentences"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.titulo?.message}
                testID="nova-titulo"
              />
            )}
          />

          <Controller
            control={control}
            name="categoria"
            render={({ field }) => (
              <SelectField
                label="Categoria"
                placeholder="Selecione uma Categoria"
                value={field.value as DemandaCategoria | ''}
                options={CATEGORIA_OPTIONS}
                onChange={field.onChange}
                error={errors.categoria?.message}
                testID="nova-categoria"
              />
            )}
          />

          <Controller
            control={control}
            name="descricao"
            render={({ field }) => (
              <TextField
                variant="card"
                label="Descrição"
                placeholder="Descreva o problema encontrado"
                multiline
                autoCapitalize="sentences"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={errors.descricao?.message}
                testID="nova-descricao"
              />
            )}
          />

          <Controller
            control={control}
            name="localizacao"
            render={({ field }) => (
              <View>
                <TextField
                  variant="card"
                  label="Localização"
                  icon="map"
                  placeholder={LOCATION_PLACEHOLDER[location.status]}
                  autoCapitalize="sentences"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.localizacao?.message}
                  testID="nova-localizacao"
                />
                <LocationHint
                  status={location.status}
                  isFromGps={Boolean(field.value) && field.value === gpsAddress.current}
                  onRetry={location.retry}
                />
              </View>
            )}
          />

          <View style={styles.statusRow}>
            <Icon name="rotateCw" size={20} color={palette.warning} />
            <Text style={styles.statusText}>
              Status inicial: <Text style={styles.statusValue}>{STATUS_META.PENDING.label}</Text>
            </Text>
          </View>

          {submitError && (
            <Text style={styles.submitError} testID="nova-submit-error">
              {submitError}
            </Text>
          )}

          <Button
            label="Enviar demanda"
            variant="surface"
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            style={styles.submit}
            testID="nova-submit"
          />
          <Text style={styles.footer}>Todos os campos são obrigatórios</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

function LocationHint({
  status,
  isFromGps,
  onRetry,
}: {
  status: ReturnType<typeof useCurrentAddress>['status'];
  isFromGps: boolean;
  onRetry: () => void;
}) {
  if (status === 'ready' && isFromGps) {
    return <Text style={styles.hint}>GPS capturado automaticamente</Text>;
  }
  if (status === 'denied' || status === 'error') {
    return (
      <Pressable onPress={onRetry} hitSlop={8} accessibilityRole="button" testID="nova-localizacao-retry">
        <Text style={styles.hint}>
          {status === 'denied' ? 'Sem permissão de localização. ' : 'Não foi possível obter o GPS. '}
          <Text style={styles.hintAction}>Tentar novamente</Text>
        </Text>
      </Pressable>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 27,
    paddingTop: 14,
    gap: 22,
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 12,
  },
  statusText: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 16,
    color: palette.white,
  },
  statusValue: {
    color: palette.warning,
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
  submit: {
    paddingHorizontal: 10,
  },
  footer: {
    fontFamily: fonts.sourceSans3.semiBold,
    fontSize: 16,
    color: palette.white,
    textAlign: 'center',
    marginTop: -6,
  },
});
