import { lazy, Suspense, useEffect, useRef } from "react";
import { getToken, setTokens } from "@/lib/auth-store";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";

// ── Lazy-loaded pages (code splitting — each page is a separate JS chunk) ──
const HomePage               = lazy(() => import("@/pages/home"));
const SearchPage             = lazy(() => import("@/pages/search"));
const CategoryPage           = lazy(() => import("@/pages/category"));
const ProviderProfilePage    = lazy(() => import("@/pages/provider-profile"));
const BookingPage            = lazy(() => import("@/pages/booking"));
const BookingConfirmationPage = lazy(() => import("@/pages/booking-confirmation"));
const AccountBookingsPage    = lazy(() => import("@/pages/account/bookings"));
const ProfilePage            = lazy(() => import("@/pages/account/profile"));
const AgendaPage             = lazy(() => import("@/pages/dashboard/agenda"));
const ServicesPage           = lazy(() => import("@/pages/dashboard/services"));
const StaffPage              = lazy(() => import("@/pages/dashboard/staff"));
const AnalyticsPage          = lazy(() => import("@/pages/dashboard/analytics"));
const SettingsPage           = lazy(() => import("@/pages/dashboard/settings"));
const ReviewsPage            = lazy(() => import("@/pages/dashboard/reviews"));
const SubscriptionPage       = lazy(() => import("@/pages/dashboard/subscription"));
const ReservationsPage       = lazy(() => import("@/pages/dashboard/reservations"));
const ProviderSetupPage      = lazy(() => import("@/pages/dashboard/setup"));
const RegisterPage           = lazy(() => import("@/pages/auth/register"));
const LoginPage              = lazy(() => import("@/pages/auth/login"));
const StaticPage             = lazy(() => import("@/pages/static-page"));
const VerifyEmailPage        = lazy(() => import("@/pages/verify-email"));
const NotFoundPage           = lazy(() => import("@/pages/not-found"));

// ── Minimal route-level loading skeleton ──────────────────────────────────
function PageShell() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "2px solid var(--surface-4)",
          borderTopColor: "var(--accent)",
          animation: "spin 0.7s linear infinite",
        }}
      />
    </div>
  );
}

// ── QueryClient — global defaults that prevent waterfall re-fetches ────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,          // data is fresh for 30 s — no refetch on nav
      gcTime: 5 * 60 * 1000,      // keep unused data in cache for 5 min
      retry: 1,                   // one retry on network error, then show error
      refetchOnWindowFocus: false, // don't blast the API when user alt-tabs
    },
    mutations: {
      retry: 0,
    },
  },
});

// ── Route tree ────────────────────────────────────────────────────────────
function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/categorie/:categorySlug" component={CategoryPage} />
      {/* confirmation MUST precede /:slug to avoid slug capturing "confirmation" */}
      <Route path="/booking/confirmation" component={BookingConfirmationPage} />
      <Route path="/booking/:slug" component={BookingPage} />
      <Route path="/account/bookings" component={AccountBookingsPage} />
      <Route path="/account/profile" component={ProfilePage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/dashboard" component={() => <Redirect to="/dashboard/agenda" />} />
      <Route path="/dashboard/setup" component={ProviderSetupPage} />
      <Route path="/dashboard/agenda" component={AgendaPage} />
      <Route path="/dashboard/agenda/bookings" component={ReservationsPage} />
      <Route path="/dashboard/services" component={ServicesPage} />
      <Route path="/dashboard/staff" component={StaffPage} />
      <Route path="/dashboard/analytics" component={AnalyticsPage} />
      <Route path="/dashboard/reviews" component={ReviewsPage} />
      <Route path="/dashboard/settings" component={SettingsPage} />
      <Route path="/dashboard/subscription" component={SubscriptionPage} />
      <Route path="/dashboard/reservations" component={ReservationsPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/page/:slug" component={StaticPage} />
      <Route path="/404" component={NotFoundPage} />
      <Route path="/:slug" component={ProviderProfilePage} />
    </Switch>
  );
}

// ── Animated page wrapper ─────────────────────────────────────────────────
// mode="sync": old and new page animate simultaneously — no blank gap.
// mode="wait" (old) unmounted the old page first, creating a white flash.
function AnimatedRouter() {
  const [location] = useLocation();
  const prevRef = useRef(location);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    prevRef.current = location;
  }, [location]);

  const dashToDash =
    location.startsWith("/dashboard") && prevRef.current.startsWith("/dashboard");

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={location}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: { duration: dashToDash ? 0.12 : 0.2, ease: [0.0, 0.0, 0.2, 1] },
        }}
        exit={{
          opacity: 0,
          transition: { duration: dashToDash ? 0 : 0.1, ease: [0.4, 0.0, 1.0, 1] },
        }}
      >
        {/* Suspense catches lazy-loaded chunks mid-flight */}
        <Suspense fallback={<PageShell />}>
          {/* ErrorBoundary prevents render errors from blanking the page */}
          <PageErrorBoundary>
            <Router />
          </PageErrorBoundary>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Dev auto-login (stripped from prod builds) ────────────────────────────
function DevAutoLogin() {
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (getToken()) return;
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "atlas@salon.ma", password: "password123" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.token && d.refreshToken && d.user) {
          setTokens(d.token, d.refreshToken, d.user);
          window.location.reload();
        }
      })
      .catch((err) => console.warn("[DevAutoLogin] failed:", err));
  }, []);
  return null;
}

// ── App root ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <AnimatedRouter />
        </WouterRouter>
        <DevAutoLogin />
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
