import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { ApiValidationError } from '../../api/auth';
import { useAuth } from '../../auth/AuthContext';
import { AuthLayout } from '../../components/AuthLayout';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { colors, fonts, palette } from '../../theme';
import { cadastroSchema, type CadastroFormValues } from './CadastroScreen.schema';

type Props = NativeStackScreenProps<AuthStackParamList, 'Cadastro'>;

// Não há frame de Cadastro no Figma: segue o mesmo layout da tela de Login.
export function CadastroScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CadastroFormValues>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(values: CadastroFormValues) {
    setSubmitError(null);

    try {
      await register(values.username, values.email, values.password);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (field === 'username' || field === 'email' || field === 'password') {
            setError(field, { message: messages[0] });
          }
        });
        return;
      }

      setSubmitError(error instanceof Error ? error.message : 'Não foi possível cadastrar.');
    }
  }

  return (
    <AuthLayout title="Cadastro">
      <View style={styles.fields}>
        <Controller
          control={control}
          name="username"
          render={({ field }) => (
            <TextField
              placeholder="Nome de usuário"
              icon="profile"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.username?.message}
              testID="cadastro-username"
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              placeholder="Email"
              icon="mail"
              keyboardType="email-address"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.email?.message}
              testID="cadastro-email"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              placeholder="Senha"
              icon="lock"
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
              testID="cadastro-password"
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <TextField
              placeholder="Confirmar senha"
              icon="lock"
              secureTextEntry
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.confirmPassword?.message}
              testID="cadastro-confirmPassword"
            />
          )}
        />
      </View>

      {submitError && <Text style={styles.error}>{submitError}</Text>}

      <View style={styles.actions}>
        <Button
          label="Cadastrar"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          testID="cadastro-submit"
        />

        <Pressable testID="go-to-login" hitSlop={8} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>
            Já tem conta? <Text style={styles.linkStrong}>Entrar</Text>
          </Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  fields: {
    width: '100%',
    gap: 24,
  },
  error: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 14,
    color: palette.dangerStrong,
    textAlign: 'center',
    marginTop: 24,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
    marginTop: 36,
  },
  link: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: colors.navy,
  },
  linkStrong: {
    fontFamily: fonts.inter.extraBold,
    color: colors.primary,
  },
});
