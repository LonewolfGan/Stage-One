import { useState, useEffect, type FormEvent } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Mail, Save, AlertTriangle, Phone } from "lucide-react";
import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/DSButton";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: string;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<UserProfile>({
    queryKey: ["auth", "me"],
    queryFn: () => api.get("/auth/me"),
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
    }
  }, [user]);

  const emailChanged = email !== user?.email;
  const phoneChanged = phone !== user?.phone;

  const mutation = useMutation({
    mutationFn: (body: { name?: string; email?: string; phone?: string }) =>
      api.put("/auth/profile", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Profil mis à jour");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Erreur lors de la mise à jour");
    },
  });

  const sendVerificationMutation = useMutation({
    mutationFn: () => api.post("/auth/send-email-verification", {}),
    onSuccess: () => toast.success("Email de vérification envoyé"),
    onError: () => toast.error("Erreur lors de l'envoi"),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body: { name?: string; email?: string; phone?: string } = {};
    if (name !== user?.name) body.name = name;
    if (email !== user?.email) body.email = email;
    if (phone !== user?.phone) body.phone = phone;
    if (Object.keys(body).length === 0) return;
    mutation.mutate(body);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
      <TopBar />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.015em", marginBottom: 4 }}>
            Mon profil
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-tertiary)" }}>
            Mettez à jour vos informations personnelles.
          </p>
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Nom */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label htmlFor="profile-name" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <User size={13} /> Nom complet
              </Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom complet"
                className="h-10"
              />
            </div>

            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label htmlFor="profile-email" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Mail size={13} /> Adresse email
                {user?.emailVerified
                  ? <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 500 }}>· Vérifiée</span>
                  : <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 500 }}>· Non vérifiée</span>}
              </Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.ma"
                className="h-10"
              />
            </div>

            {!user?.emailVerified && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--accent-tint)", border: "1px solid rgba(212,70,110,0.18)", borderRadius: 8 }}>
                <AlertTriangle size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "var(--ink-secondary)", flex: 1 }}>Votre email n'est pas vérifié.</span>
                <button
                  type="button"
                  onClick={() => sendVerificationMutation.mutate()}
                  disabled={sendVerificationMutation.isPending}
                  style={{ fontSize: 12, fontWeight: 500, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  {sendVerificationMutation.isPending ? "Envoi…" : "Envoyer le lien"}
                </button>
              </div>
            )}

            {/* Téléphone */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label htmlFor="profile-phone" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Phone size={13} /> Téléphone
                {user?.phoneVerified
                  ? <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 500 }}>· Vérifié</span>
                  : <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 500 }}>· Non vérifié</span>}
              </Label>
              <Input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0612345678"
                className="h-10"
              />
            </div>

            {(emailChanged || phoneChanged) && (
              <div style={{ padding: "12px 14px", background: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: 8, fontSize: 13, color: "#92400E" }}>
                Modifier l'email ou le téléphone réinitialisera leur statut de vérification.
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={mutation.isPending}
              icon={<Save size={14} />}
              style={{ marginTop: 4, alignSelf: "flex-start" }}
            >
              {mutation.isPending ? "Sauvegarde…" : "Sauvegarder"}
            </Button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
