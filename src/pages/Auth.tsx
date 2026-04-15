import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface SignInForm {
  email: string;
  password: string;
}

interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

const Auth = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const signInForm = useForm<SignInForm>();
  const signUpForm = useForm<SignUpForm>();

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const onSignIn = async (data: SignInForm) => {
    setIsLoading(true);
    setError(null);
    const { error } = await signIn(data.email, data.password);
    if (!error) {
      navigate('/');
    } else {
      setError(error.message);
    }
    setIsLoading(false);
  };

  const onSignUp = async (data: SignUpForm) => {
    if (data.password !== data.confirmPassword) {
      setError('As senhas nao coincidem');
      return;
    }
    setIsLoading(true);
    setError(null);
    const { error } = await signUp(data.email, data.password, data.displayName);
    if (error) {
      setError(error.message);
    }
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — Navy branding panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-navy-900 relative overflow-hidden items-center justify-center">
        {/* Decorative circles */}
        <div className="absolute top-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-sky-600/10" />
        <div className="absolute bottom-[-60px] left-[-40px] w-[300px] h-[300px] rounded-full bg-sky-500/8" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-sky-400/5" />

        <div className="relative z-10 px-12 text-center">
          <Logo size="lg" variant="white" />
          <p className="mt-6 text-navy-300 font-body text-sm leading-relaxed max-w-[280px] mx-auto">
            Plataforma de inteligencia comercial para acompanhamento de performance e resultados.
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px] animate-fade-up">
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="md" variant="black" className="dark:hidden" />
            <Logo size="md" variant="white" className="hidden dark:flex" />
          </div>

          {!isSignUp ? (
            <>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Bem-vindo de volta
              </h1>
              <p className="text-sm font-body text-muted-foreground mt-1.5 mb-7">
                Entre com suas credenciais para acessar o dashboard
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Criar conta
              </h1>
              <p className="text-sm font-body text-muted-foreground mt-1.5 mb-7">
                Preencha seus dados para comecar
              </p>
            </>
          )}

          {!isSignUp ? (
            <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="signin-email" className="text-sm font-medium font-body text-foreground">
                  Email
                </Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="seu@email.com"
                  className="h-10 font-body"
                  {...signInForm.register('email', { required: 'Email obrigatorio' })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signin-password" className="text-sm font-medium font-body text-foreground">
                  Senha
                </Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="--------"
                  className="h-10 font-body"
                  {...signInForm.register('password', { required: 'Senha obrigatoria' })}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-navy-900 hover:bg-navy-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-body font-semibold text-sm mt-2"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(null); }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
                >
                  Nao tem conta? <span className="text-sky-600 font-semibold">Cadastre-se</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="signup-email" className="text-sm font-medium font-body text-foreground">Email</Label>
                <Input id="signup-email" type="email" autoComplete="email" placeholder="seu@email.com" className="h-10 font-body"
                  {...signUpForm.register('email', { required: 'Email obrigatorio' })} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-name" className="text-sm font-medium font-body text-foreground">Nome completo</Label>
                <Input id="signup-name" type="text" autoComplete="name" placeholder="Seu nome" className="h-10 font-body"
                  {...signUpForm.register('displayName', { required: 'Nome obrigatorio' })} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-password" className="text-sm font-medium font-body text-foreground">Senha</Label>
                <Input id="signup-password" type="password" placeholder="--------" className="h-10 font-body"
                  {...signUpForm.register('password', { required: 'Senha obrigatoria', minLength: { value: 6, message: 'Minimo 6 caracteres' } })} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="signup-confirm-password" className="text-sm font-medium font-body text-foreground">Confirmar senha</Label>
                <Input id="signup-confirm-password" type="password" placeholder="--------" className="h-10 font-body"
                  {...signUpForm.register('confirmPassword', { required: 'Confirme a senha' })} />
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-navy-900 hover:bg-navy-800 dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-body font-semibold text-sm mt-2"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cadastrar
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(null); }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
                >
                  Ja tem conta? <span className="text-sky-600 font-semibold">Entrar</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
