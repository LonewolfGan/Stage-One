import { useState, useEffect, useRef, type FormEvent } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Camera, Save, Lock, Eye, EyeOff } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: string;
  photoUrl?: string | null;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 15, fontWeight: 500, color: "var(--ink)",
      letterSpacing: "-0.01em", marginBottom: 0,
    }}>
      {children}
    </h2>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarHovered, setAvatarHovered] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [showPwdSection, setShowPwdSection] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdError, setPwdError] = useState<string | undefined>();

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

  const profileMutation = useMutation({
    mutationFn: (body: { name?: string; email?: string; phone?: string }) =>
      api.put("/auth/profile", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Profil mis à jour");
    },
    onError: (err: any) => {
      toast.error(err?.data?.message ?? err?.message ?? "Erreur lors de la mise à jour");
    },
  });

  const pwdMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      api.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Mot de passe modifié");
      setCurrentPwd("");
      setNewPwd("");
      setShowPwdSection(false);
      setPwdError(undefined);
    },
    onError: (err: any) => {
      const msg: string = err?.data?.message ?? err?.message ?? "Erreur";
      setPwdError(msg);
    },
  });

  function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    const body: { name?: string; email?: string; phone?: string } = {};
    if (name !== user?.name) body.name = name;
    if (email !== user?.email) body.email = email;
    if (phone !== user?.phone) body.phone = phone;
    if (Object.keys(body).length === 0) return;
    profileMutation.mutate(body);
  }

  function handlePwdSubmit(e: FormEvent) {
    e.preventDefault();
    setPwdError(undefined);
    if (newPwd.length < 8) { setPwdError("Le nouveau mot de passe doit contenir au moins 8 caractères."); return; }
    pwdMutation.mutate({ currentPassword: currentPwd, newPassword: newPwd });
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image trop lourde (max 2 Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUri = evt.target?.result as string;
      if (!dataUri) return;
      setPhotoLoading(true);
      try {
        await api.post("/auth/upload-photo", { dataUri });
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        toast.success("Photo mise à jour");
      } catch (err: any) {
        toast.error(err?.data?.message ?? "Erreur lors de l'upload");
      } finally {
        setPhotoLoading(false);
        e.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  }

  const roleLabel = user?.role === "OWNER" ? "Prestataire" : user?.role === "ADMIN" ? "Administrateur" : "Client";

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
      <TopBar />

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px 96px" }}>

        {/* ── Profile header ── */}
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 40 }}>
            <Skeleton style={{ width: 76, height: 76, borderRadius: "50%", flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ) : user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 40 }}>
            {/* Avatar with upload overlay */}
            <div
              style={{ position: "relative", display: "inline-block", flexShrink: 0 }}
              onMouseEnter={() => setAvatarHovered(true)}
              onMouseLeave={() => setAvatarHovered(false)}
            >
              <Avatar
                name={user.name}
                photoUrl={user.photoUrl}
                size={76}
                style={{ opacity: photoLoading ? 0.5 : 1, transition: "opacity 200ms" }}
              />
              {/* Overlay on hover */}
              <AnimatePresence>
                {(avatarHovered || photoLoading) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "absolute", inset: 0, borderRadius: "50%",
                      backgroundColor: "rgba(0,0,0,0.32)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => !photoLoading && fileRef.current?.click()}
                  >
                    {photoLoading ? (
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    ) : (
                      <Camera size={18} color="#fff" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handlePhotoChange}
              />
            </div>

            {/* Name + meta */}
            <div>
              <h1 style={{
                fontSize: 20, fontWeight: 600, color: "var(--ink)",
                letterSpacing: "-0.015em", lineHeight: 1.2, marginBottom: 4,
              }}>
                {user.name}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "2px 8px", borderRadius: 9999,
                  fontSize: 11, fontWeight: 500,
                  backgroundColor: "var(--surface-3)",
                  color: "var(--ink-secondary)",
                }}>
                  {roleLabel}
                </span>
                <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>{user.email}</span>
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  marginTop: 8, fontSize: 12, fontWeight: 500,
                  color: "var(--ink-tertiary)", background: "none",
                  border: "none", cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", gap: 4,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)"; }}
              >
                <Camera size={11} />
                Changer la photo
              </button>
            </div>
          </div>
        ) : null}

        {/* ── Divider ── */}
        <div style={{ height: 1, backgroundColor: "var(--hairline)", marginBottom: 32 }} />

        {/* ── Informations personnelles ── */}
        <SectionTitle>Informations personnelles</SectionTitle>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
            <FieldGroup>
              <Label htmlFor="profile-name">Nom complet</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom complet"
                className="h-10"
              />
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="profile-email">Adresse email</Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.ma"
                className="h-10"
              />
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="profile-phone">Téléphone</Label>
              <Input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0612345678"
                className="h-10"
              />
            </FieldGroup>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <motion.button
                type="submit"
                disabled={profileMutation.isPending}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  height: 38, padding: "0 18px",
                  backgroundColor: profileMutation.isPending ? "rgba(212,70,110,0.35)" : "var(--accent)",
                  color: "#fff", fontSize: 13, fontWeight: 500,
                  letterSpacing: "-0.01em", borderRadius: 9999,
                  border: "none", cursor: profileMutation.isPending ? "not-allowed" : "pointer",
                  transition: "background-color 150ms ease",
                }}
              >
                <Save size={13} />
                {profileMutation.isPending ? "Sauvegarde…" : "Sauvegarder"}
              </motion.button>
            </div>
          </form>
        )}

        {/* ── Divider ── */}
        <div style={{ height: 1, backgroundColor: "var(--hairline)", margin: "36px 0 32px" }} />

        {/* ── Sécurité ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <SectionTitle>Sécurité</SectionTitle>
          <button
            type="button"
            onClick={() => { setShowPwdSection((v) => !v); setPwdError(undefined); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 13, fontWeight: 500,
              color: showPwdSection ? "var(--ink-tertiary)" : "var(--ink)",
              background: "none", border: "none", cursor: "pointer", padding: 0,
              transition: "color 140ms ease",
            }}
          >
            <Lock size={12} />
            {showPwdSection ? "Annuler" : "Changer le mot de passe"}
          </button>
        </div>

        <AnimatePresence>
          {showPwdSection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ overflow: "hidden" }}
            >
              <form onSubmit={handlePwdSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
                <FieldGroup>
                  <Label htmlFor="current-pwd">Mot de passe actuel</Label>
                  <div style={{ position: "relative" }}>
                    <Input
                      id="current-pwd"
                      type={showCurrentPwd ? "text" : "password"}
                      autoComplete="current-password"
                      value={currentPwd}
                      onChange={(e) => { setCurrentPwd(e.target.value); setPwdError(undefined); }}
                      placeholder="Mot de passe actuel"
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd((v) => !v)}
                      style={{
                        position: "absolute", right: 10, top: "50%",
                        transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--ink-tertiary)", display: "flex", alignItems: "center", padding: 0,
                      }}
                    >
                      {showCurrentPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </FieldGroup>

                <FieldGroup>
                  <Label htmlFor="new-pwd">Nouveau mot de passe</Label>
                  <div style={{ position: "relative" }}>
                    <Input
                      id="new-pwd"
                      type={showNewPwd ? "text" : "password"}
                      autoComplete="new-password"
                      value={newPwd}
                      onChange={(e) => { setNewPwd(e.target.value); setPwdError(undefined); }}
                      placeholder="Au moins 8 caractères"
                      className="h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd((v) => !v)}
                      style={{
                        position: "absolute", right: 10, top: "50%",
                        transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--ink-tertiary)", display: "flex", alignItems: "center", padding: 0,
                      }}
                    >
                      {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </FieldGroup>

                <AnimatePresence>
                  {pwdError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ fontSize: 12, color: "#E53E3E", margin: 0 }}
                    >
                      {pwdError}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <motion.button
                    type="submit"
                    disabled={pwdMutation.isPending || !currentPwd || !newPwd}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      height: 38, padding: "0 18px",
                      backgroundColor: (pwdMutation.isPending || !currentPwd || !newPwd)
                        ? "var(--surface-3)"
                        : "var(--ink)",
                      color: (pwdMutation.isPending || !currentPwd || !newPwd) ? "var(--ink-tertiary)" : "#fff",
                      fontSize: 13, fontWeight: 500,
                      letterSpacing: "-0.01em", borderRadius: 8,
                      border: "none",
                      cursor: (pwdMutation.isPending || !currentPwd || !newPwd) ? "not-allowed" : "pointer",
                      transition: "all 150ms ease",
                    }}
                  >
                    <Lock size={12} />
                    {pwdMutation.isPending ? "Modification…" : "Changer le mot de passe"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
      <Footer />
    </div>
  );
}
