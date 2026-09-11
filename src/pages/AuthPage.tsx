import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  Fingerprint,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import { z } from "zod";
import {
  isBiometricSupported,
  hasBiometricCreds,
  saveBiometricCreds,
  unlockWithBiometrics,
} from "@/hooks/useBiometricAuth";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = loginSchema
  .extend({
    fullName: z
      .string()
      .trim()
      .min(2, { message: "Name must be at least 2 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    referralCode: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // biometricSupported: device has WebAuthn; biometricEnrolled: creds saved
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  // Forgot / reset password flow
  type ForgotStep = "none" | "email" | "reset";
  const [forgotStep, setForgotStep] = useState<ForgotStep>("none");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      const res = await api.post<{ message: string; dev_token?: string }>(
        "/auth/forgot-password",
        { email: forgotEmail.trim() },
      );
      if (res.dev_token) {
        // Development: show code in toast since email may not be configured
        toast({
          title: "Dev mode — reset code",
          description: `Code: ${res.dev_token}`,
        });
      } else {
        toast({
          title: "Reset code sent",
          description: "Check your email for the 6-digit code.",
        });
      }
      setForgotStep("reset");
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Minimum 6 characters.",
        variant: "destructive",
      });
      return;
    }
    setForgotLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: forgotEmail.trim(),
        token: forgotCode.trim(),
        new_password: newPassword,
      });
      toast({
        title: "Password reset!",
        description: "You can now sign in with your new password.",
      });
      // Reset forgot state and go back to login
      setForgotStep("none");
      setForgotEmail("");
      setForgotCode("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: unknown) {
      toast({
        title: "Reset failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, loading: authLoading } = useAuth();

  useEffect(() => {
    setBiometricSupported(isBiometricSupported());
    setBiometricEnrolled(hasBiometricCreds());
    const referralCode = searchParams.get("ref")?.trim().toUpperCase();
    if (referralCode) {
      setIsLogin(false);
      setFormData((prev) => ({ ...prev, referralCode }));
    }
  }, [searchParams]);

  const handleBiometricLogin = async () => {
    if (!biometricEnrolled) {
      toast({
        title: "Fingerprint not set up",
        description:
          "Sign in with your password once to enable fingerprint login.",
      });
      return;
    }
    setBiometricLoading(true);
    try {
      const creds = await unlockWithBiometrics();
      if (!creds) {
        toast({
          title: "Biometric failed",
          description: "Could not verify identity.",
          variant: "destructive",
        });
        return;
      }
      const { error } = await signIn(creds.email, creds.password);
      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "Signed in with biometrics",
        });
        navigate("/dashboard");
      }
    } catch {
      toast({
        title: "Biometric error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setBiometricLoading(false);
    }
  };

  // Redirect already-authenticated users away from the auth page
  if (!authLoading && user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Login failed",
              description: "Invalid email or password",
              variant: "destructive",
            });
          } else if (error.message.includes("Email not confirmed")) {
            toast({
              title: "Email not verified",
              description: "Please check your email to verify your account",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({ title: "Welcome back!", description: "Login successful" });
          // Offer to save credentials for biometric login next time
          if (isBiometricSupported() && !hasBiometricCreds()) {
            const saved = await saveBiometricCreds(
              formData.email,
              formData.password,
            );
            if (saved) {
              setBiometricEnrolled(true);
              toast({
                title: "Biometric login enabled",
                description: "You can now sign in with your fingerprint.",
              });
            }
          }
          navigate("/dashboard");
        }
      } else {
        const result = signupSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(
          formData.email,
          formData.password,
          formData.fullName,
          formData.referralCode,
        );
        if (error) {
          if (
            error.message.includes("User already registered") ||
            error.message.includes("already exists")
          ) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Try logging in.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Signup failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account created!",
            description: `Welcome to ${siteConfig.name}!`,
          });
          navigate("/dashboard");
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-slide-up">
          <img
            src={siteConfig.logo}
            alt={siteConfig.name}
            className="h-20 w-auto mx-auto mb-4 select-none"
            draggable={false}
          />

          <p className="text-muted-foreground mt-1">
            {forgotStep === "email" &&
              "Enter your email to receive a reset code"}
            {forgotStep === "reset" && "Enter the code and your new password"}
            {forgotStep === "none" &&
              (isLogin
                ? "Welcome back! Sign in to continue"
                : "Create your account")}
          </p>
        </div>

        {/* ── Forgot: enter email ── */}
        {forgotStep === "email" && (
          <div className="p-6 rounded-2xl bg-secondary/50 border border-border/50 animate-slide-up">
            <form onSubmit={handleForgotRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgotEmail">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="forgotEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="pl-10"
                    autoFocus
                    disabled={forgotLoading}
                  />
                </div>
              </div>
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                size="lg"
                disabled={forgotLoading || !forgotEmail.trim()}
              >
                {forgotLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Send Reset Code
              </Button>
              <button
                type="button"
                onClick={() => setForgotStep("none")}
                className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </button>
            </form>
          </div>
        )}

        {/* ── Forgot: enter code + new password ── */}
        {forgotStep === "reset" && (
          <div className="p-6 rounded-2xl bg-secondary/50 border border-border/50 animate-slide-up">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgotCode">6-digit reset code</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="forgotCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={forgotCode}
                    onChange={(e) =>
                      setForgotCode(e.target.value.replace(/\D/g, ""))
                    }
                    className="pl-10 tracking-[0.4em] text-center font-mono text-lg"
                    autoFocus
                    disabled={forgotLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={forgotLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm new password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmNewPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="pl-10"
                    disabled={forgotLoading}
                  />
                </div>
              </div>
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                size="lg"
                disabled={
                  forgotLoading || forgotCode.length !== 6 || !newPassword
                }
              >
                {forgotLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <KeyRound className="w-4 h-4 mr-2" />
                )}
                Reset Password
              </Button>
              <button
                type="button"
                onClick={() => setForgotStep("email")}
                className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" /> Resend code
              </button>
            </form>
          </div>
        )}
        {/* ── Auth Form (login / signup) ── */}
        {forgotStep === "none" && (
          <div
            className="p-6 rounded-2xl bg-secondary/50 border border-border/50 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-destructive">
                      {errors.fullName}
                    </p>
                  )}
                </div>
              )}

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="referralCode">Referral Code (optional)</Label>
                  <Input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    placeholder="Enter referral code"
                    value={formData.referralCode}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        referralCode: event.target.value.toUpperCase(),
                      }))
                    }
                    disabled={loading}
                  />
                  {errors.referralCode && (
                    <p className="text-sm text-destructive">
                      {errors.referralCode}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(formData.email);
                        setForgotStep("email");
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {isLogin ? "Sign In" : "Create Account"}
              </Button>

              {isLogin && biometricSupported && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={handleBiometricLogin}
                  disabled={biometricLoading}
                >
                  {biometricLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Fingerprint className="w-5 h-5 mr-2" />
                  )}
                  {biometricEnrolled
                    ? "Sign in with Fingerprint"
                    : "Use Fingerprint Login"}
                </Button>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                    setFormData({
                      email: "",
                      password: "",
                      confirmPassword: "",
                      fullName: "",
                      referralCode: "",
                    });
                  }}
                  className="text-primary font-medium hover:underline"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
