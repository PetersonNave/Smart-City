import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type TextInput } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { AuthLayout } from '../../components/AuthLayout';
import { TextField } from '../../components/TextField';
import { Button } from '../../components/Button';
import { useAuth } from '../../auth/AuthContext';
import { colors, fonts, palette } from '../../theme';
import { loginSchema, type LoginFormValues } from './LoginScreen.schema';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
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
    <AuthLayout title="Login">
      <View style={styles.fields}>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              placeholder="Email"
              icon="mail"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
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
              ref={passwordRef}
              placeholder="Senha"
              icon="lock"
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit(onSubmit)}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
              testID="login-password"
            />
          )}
        />
      </View>

      {submitError && <Text style={styles.error}>{submitError}</Text>}

      <View style={styles.actions}>
        <Button
          label="Entrar"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          testID="login-submit"
        />

        <Pressable testID="go-to-cadastro" hitSlop={8} onPress={() => navigation.navigate('Cadastro')}>
          <Text style={styles.link}>
            Não tem conta? <Text style={styles.linkStrong}>Cadastre-se</Text>
          </Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  fields: {
    width: '100%',
    gap: 44,
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
    marginTop: 44,
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
