import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiValidationError } from '../../api/envelope';
import { criarDemanda, enviarFotoDemanda, type Demanda, type DemandaCategoria } from '../../api/demandas';
import { Button } from '../../components/Button';
import { GradientBackground } from '../../components/GradientBackground';
import { Icon } from '../../components/Icon';
import { ScreenHeader } from '../../components/ScreenHeader';
import { STATUS_META } from '../../domain/demanda';
import { useCurrentAddress, type AddressStatus } from '../../hooks/useCurrentAddress';
import { useDiscardGuard } from '../../hooks/useDiscardGuard';
import { routes } from '../../navigation/routes';
import { fonts, palette } from '../../theme';
import { DemandaFormFields } from './DemandaFormFields';
import { DEMANDA_FORM_VAZIO, novaDemandaSchema, type DemandaFormValues } from './demandaForm.schema';

const API_FIELDS = ['titulo', 'descricao', 'categoria', 'localizacao'] as const;

const LOCATION_PLACEHOLDER: Record<AddressStatus, string> = {
  idle: 'Endereço do problema',
  locating: 'Obtendo localização pelo GPS...',
  ready: 'Endereço do problema',
  denied: 'Digite o endereço do problema',
  error: 'Digite o endereço do problema',
};

// Figma "Nova demanda" (estados normal e "Anexe ao menos uma foto").
export function NovaDemandaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const location = useCurrentAddress();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ demanda: Demanda; fotoPendente: boolean } | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DemandaFormValues>({
    resolver: zodResolver(novaDemandaSchema),
    defaultValues: DEMANDA_FORM_VAZIO,
  });
  // Guarda o endereço vindo do GPS para saber se o usuário o editou à mão.
  const gpsAddress = useRef<string | null>(null);
  const localizacao = watch('localizacao');

  useEffect(() => {
    if (location.status === 'ready' && location.address && !getValues('localizacao')) {
      gpsAddress.current = location.address;
      setValue('localizacao', location.address, { shouldValidate: Boolean(errors.localizacao) });
    }
  }, [location.status, location.address, getValues, setValue, errors.localizacao]);

  useDiscardGuard(isDirty && !created, 'Descartar demanda?');

  // Navega só depois do re-render com `created`, para o bloqueio acima já estar desligado.
  useEffect(() => {
    if (created) router.replace(routes.demandaEnviada(created.demanda.id, created.fotoPendente));
  }, [created, router]);

  async function onSubmit(values: DemandaFormValues) {
    setSubmitError(null);
    let demanda: Demanda;
    try {
      demanda = await criarDemanda({
        titulo: values.titulo,
        descricao: values.descricao,
        categoria: values.categoria as DemandaCategoria,
        localizacao: values.localizacao,
        // Cidadão não escolhe prioridade no Figma; a triagem fica com o gestor.
        prioridade: 'media',
      });
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
      return;
    }

    // A demanda já existe: se só a foto falhar, segue para a confirmação avisando que
    // a foto pode ser reenviada pela edição (em vez de deixar o usuário reenviar tudo).
    try {
      const comFoto = await enviarFotoDemanda(demanda.id, values.foto!);
      setCreated({ demanda: comFoto, fotoPendente: false });
    } catch {
      setCreated({ demanda, fotoPendente: true });
    }
  }

  return (
    <GradientBackground variant="screen" style={{ paddingTop: insets.top }}>
      <ScreenHeader title="Nova demanda" variant="plain" onBack={() => router.back()} testID="nova-header" />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <DemandaFormFields
            control={control}
            errors={errors}
            testIDPrefix="nova"
            locationPlaceholder={LOCATION_PLACEHOLDER[location.status]}
            locationHint={
              <LocationHint
                status={location.status}
                isFromGps={Boolean(localizacao) && localizacao === gpsAddress.current}
                onRetry={location.retry}
              />
            }
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
  status: AddressStatus;
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
