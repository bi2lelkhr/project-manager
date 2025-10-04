import { useAppDispatch } from "../app/hooks";
import { useLoginMutation } from "../features/auth/login";
import logo from "./../assets/logo.png"; 
import { AuthState, setCredentials } from "../features/auth/auth-slice";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Toaster } from "sonner";

export default function Login() {
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <img
                  alt="Your Company"
                  src={logo}
                  className="mx-auto h-16 w-auto filter brightness-110 drop-shadow-lg"
                />
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-20"></div>
              </div>
              <h2 className="mt-6 text-2xl font-bold text-white">
                Se connecter à votre compte
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Entrez vos identifiants pour continuer
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form
              className="space-y-6"
              onSubmit={async (e) => {
                try {
                  e.preventDefault();
                  setError("");

                  const form = e.target as HTMLFormElement;
                  const emailIn = form.elements.namedItem(
                    "email"
                  ) as HTMLInputElement;
                  const passwordIn = form.elements.namedItem(
                    "password"
                  ) as HTMLInputElement;
                  const email = emailIn.value;
                  const password = passwordIn.value;

                  const data = await login({ email, password }).unwrap();

                  if (!data.user) {
                    setError(
                      "Données utilisateur non trouvées dans la réponse"
                    );
                    toast.error("User data not found in response");
                    return;
                  }

                  dispatch(
                    setCredentials(
                      new AuthState(
                        true,
                        data.token,
                        data.refreshToken,
                        data.user.username,
                        data.user.id,
                        data.user.is_admin ? "admin" : "cadre"
                      )
                    )
                  );

                  navigate("/");
                  toast.success("Connexion réussie!");
                } catch (e: any) {
                  console.error("Login error:", e);

                  let errorMessage = "Échec de la connexion";

                  if (e?.status === 401) {
                    errorMessage = "Email ou mot de passe incorrect";
                  } else if (e?.status === 400) {
                    errorMessage = "Données de connexion invalides";
                  } else if (e?.status === 500) {
                    errorMessage =
                      "Erreur du serveur. Veuillez réessayer plus tard.";
                  } else if (e?.data?.message) {
                    errorMessage = e.data.message;
                  } else if (e?.message) {
                    errorMessage = e.message;
                  }

                  setError(errorMessage);
                  toast.error(errorMessage);
                }
              }}
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  autoComplete="email"
                  className="block w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-300"
                  >
                    Mot de passe
                  </label>
                  <a
                    href="#"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
                  >
                    Mot de passe oublié?
                  </a>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="block w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Connexion...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-400">
                Vous n'êtes pas membre?{" "}
                <a
                  href="#"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
                >
                  Contactez votre administrateur
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "rgb(30, 41, 59)",
            color: "rgb(248, 250, 252)",
            border: "1px solid rgb(51, 65, 85)",
          },
        }}
      />
    </>
  );
}
