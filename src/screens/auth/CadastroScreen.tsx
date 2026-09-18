import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { ApiValidationError } from '../../api/auth';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/Button';
import { GradientBackground } from '../../components/GradientBackground';
import { TextField } from '../../components/TextField';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { colors, fonts } from '../../theme';
import { cadastroSchema, type CadastroFormValues } from './CadastroScreen.schema';

type Props = NativeStackScreenProps<AuthStackParamList, 'Cadastro'>;

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
    <GradientBackground style={styles.container}>
      <Text style={styles.title}>Cadastro</Text>

      <Controller
        control={control}
        name="username"
        render={({ field }) => (
          <TextField
            label="Nome de usuário"
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
            label="Email"
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
            label="Senha"
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
            label="Confirmar senha"
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

      {submitError && <Text style={styles.error}>{submitError}</Text>}

      <Button
        label="Cadastrar"
        loading={isSubmitting}
        onPress={handleSubmit(onSubmit)}
        testID="cadastro-submit"
      />

      <Pressable testID="go-to-login" onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Já tem conta? Entrar</Text>
      </Pressable>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontFamily: fonts.inter.extraBold,
    fontSize: 36,
    color: colors.navy,
  },
  error: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: '#E53935',
  },
  link: {
    fontFamily: fonts.inter.medium,
    fontSize: 14,
    color: '#fff',
  },
});
