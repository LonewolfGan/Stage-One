import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";

// Pages
import HomePage from "@/pages/home";
import SearchPage from "@/pages/search";
import CategoryPage from "@/pages/category";
import ProviderProfilePage from "@/pages/provider-profile";
import BookingPage from "@/pages/booking";
import BookingConfirmationPage from "@/pages/booking-confirmation";
import AccountBookingsPage from "@/pages/account/bookings";
import AgendaPage from "@/pages/dashboard/agenda";
import ServicesPage from "@/pages/dashboard/services";
import StaffPage from "@/pages/dashboard/staff";
import AnalyticsPage from "@/pages/dashboard/analytics";
import SettingsPage from "@/pages/dashboard/settings";
import ReviewsPage from "@/pages/dashboard/reviews";
import RegisterPage from "@/pages/auth/register";
import LoginPage from "@/pages/auth/login";
import StaticPage from "@/pages/static-page";
import VerifyEmailPage from "@/pages/verify-email";
import SubscriptionPage from "@/pages/dashboard/subscription";
import ReservationsPage from "@/pages/dashboard/reservations";
import ProfilePage from "@/pages/account/profile";
import NotFoundPage from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/categorie/:categorySlug" component={CategoryPage} />
      <Route path="/booking/confirmation" component={BookingConfirmationPage} />
      <Route path="/booking/:slug" component={BookingPage} />
      <Route path="/account/bookings" component={AccountBookingsPage} />
      <Route path="/account/profile" component={ProfilePage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/dashboard" component={() => <Redirect to="/dashboard/agenda" />} />
      <Route path="/dashboard/agenda" component={AgendaPage} />
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

function AnimatedRouter() {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.25, ease: [0.0, 0.0, 0.2, 1] } }}
        exit={{ opacity: 0, transition: { duration: 0.15, ease: [0.4, 0.0, 1.0, 1] } }}
      >
        <Router />
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <AnimatedRouter />
        </WouterRouter>
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
