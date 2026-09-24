import { StyleSheet, View } from 'react-native';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { DEMANDA_CATEGORIAS, type DemandaCategoria } from '../../api/demandas';
import { PhotoField } from '../../components/PhotoField';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';
import { CATEGORIA_LABELS } from '../../domain/demanda';
import type { DemandaFormValues } from './demandaForm.schema';

const CATEGORIA_OPTIONS = DEMANDA_CATEGORIAS.map((value) => ({ value, label: CATEGORIA_LABELS[value] }));

export type DemandaFormFieldsProps = {
  control: Control<DemandaFormValues>;
  errors: FieldErrors<DemandaFormValues>;
  /** Prefixo dos testIDs (ex.: "nova" → "nova-titulo-input"). */
  testIDPrefix: string;
  /** Foto já salva na API (edição). */
  existingPhotoUrl?: string | null;
  locationPlaceholder: string;
  /** Linha abaixo do campo de localização (ex.: "GPS capturado automaticamente"). */
  locationHint?: React.ReactNode;
};

// Campos comuns às telas "Nova demanda" e "Editar Demanda" do Figma:
// foto, título (exigido pela API), categoria, descrição e localização.
export function DemandaFormFields({
  control,
  errors,
  testIDPrefix,
  existingPhotoUrl,
  locationPlaceholder,
  locationHint,
}: DemandaFormFieldsProps) {
  return (
    <>
      <Controller
        control={control}
        name="foto"
        render={({ field }) => (
          <PhotoField
            value={field.value}
            existingUrl={existingPhotoUrl}
            onChange={field.onChange}
            error={errors.foto?.message}
            testID={`${testIDPrefix}-foto`}
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
            testID={`${testIDPrefix}-titulo`}
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
            testID={`${testIDPrefix}-categoria`}
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
            testID={`${testIDPrefix}-descricao`}
          />
        )}
      />

      <Controller
        control={control}
        name="localizacao"
        render={({ field }) => (
          <View style={styles.locationField}>
            <TextField
              variant="card"
              label="Localização"
              icon="map"
              placeholder={locationPlaceholder}
              autoCapitalize="sentences"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.localizacao?.message}
              testID={`${testIDPrefix}-localizacao`}
            />
            {locationHint}
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  locationField: {
    width: '100%',
  },
});
