import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { GradientBackground } from '../../components/GradientBackground';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { useAuth } from '../../auth/AuthContext';
import { colors, fonts } from '../../theme';
import { loginSchema, type LoginFormValues } from './LoginScreen.schema';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null);

    try {
      await login(values.email, values.password);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Não foi possível entrar.');
    }
  }

  return (
    <GradientBackground style={styles.container}>
      <Text style={styles.title}>Login</Text>

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
            testID="login-email"
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
            testID="login-password"
          />
        )}
      />

      {submitError && <Text style={styles.error}>{submitError}</Text>}

      <Button
        label="Entrar"
        loading={isSubmitting}
        onPress={handleSubmit(onSubmit)}
        testID="login-submit"
      />

      <Pressable testID="go-to-cadastro" onPress={() => navigation.navigate('Cadastro')}>
        <Text style={styles.link}>Não tem conta? Cadastre-se</Text>
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
