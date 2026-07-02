import { useState, useEffect, useRef } from "react";
import { useBreakpoint } from "@/hooks/use-mobile";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Save, User, Bell, Shield, MapPin,
  Plus, Trash2, X, Phone, Image, Coffee, Upload, CalendarOff,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/* ─── Types ───────────────────────────────────────────────────────────────────── */

interface BreakTime  { id: string; start: string; end: string }
interface DayHours   { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean; breaks: BreakTime[] }
interface PhoneEntry { id: string; number: string; label: string }

/* ─── Constants ───────────────────────────────────────────────────────────────── */

const DAYS_FULL  = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const DAYS_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const PHONE_LABELS = ["Réception", "Directrice", "WhatsApp", "Réservation", "Urgences"];
const CATEGORIES   = [
  "Coiffure mixte", "Coiffure femme", "Barbier (homme)",
  "Institut de beauté", "Spa & Bien-être", "Salon à domicile",
];

/* ─── Helpers ─────────────────────────────────────────────────────────────────── */

let _uid = 0;
function uid() { return `id-${Date.now()}-${++_uid}`; }

function defaultHours(): DayHours[] {
  return DAYS_FULL.map((_, i) => ({
    dayOfWeek: i,
    openTime:  "09:00",
    closeTime: "19:00",
    isClosed:  i === 0,
    breaks:    [],
  }));
}

/* ─── Primitives ──────────────────────────────────────────────────────────────── */

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Icon size={14} color="var(--ink-secondary)" strokeWidth={1.75} />
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", margin: 0 }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}


function Field({
  label, value, onChange, type = "text", placeholder, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; hint?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <Label style={{ fontSize: 12, letterSpacing: "0.01em" }}>{label}</Label>
      <Input
        type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 text-[13px]"
      />
      {hint && <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: 0 }}>{hint}</p>}
    </div>
  );
}

function SaveBtn({ label, onClick, loading }: { label: string; onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick} disabled={loading}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "9px 18px", background: "#0C0C0E", color: "#fff",
        border: "none", borderRadius: 8, fontSize: 12, fontWeight: 500,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.65 : 1, transition: "opacity 140ms ease",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.opacity = "0.78"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = loading ? "0.65" : "1"; }}
    >
      <Save size={13} />
      {loading ? "Sauvegarde…" : label}
    </button>
  );
}

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleChange() {
    setError(null);
    if (!current) { setError("Saisissez votre mot de passe actuel."); return; }
    if (next.length < 8) { setError("Le nouveau mot de passe doit contenir au moins 8 caractères."); return; }
    if (next !== confirm) { setError("Les deux mots de passe ne correspondent pas."); return; }
    setLoading(true);
    try {
      await api.changePassword(current, next);
      toast.success("Mot de passe modifié avec succès");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err: any) {
      setError(err?.message ?? "Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section title="Sécurité" icon={Shield}>
      <div className="ds-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Mot de passe actuel"        value={current}  onChange={setCurrent}  type="password" placeholder="••••••••" />
          <Field label="Nouveau mot de passe"        value={next}     onChange={setNext}     type="password" placeholder="8 caractères min." />
        </div>
        <Field label="Confirmer le nouveau mot de passe" value={confirm} onChange={setConfirm} type="password" placeholder="••••••••" />
        {error && (
          <p style={{ fontSize: 12, color: "var(--error)", margin: 0 }}>{error}</p>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <SaveBtn label="Changer le mot de passe" onClick={handleChange} loading={loading} />
        </div>
      </div>
    </Section>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Input
      type="time" value={value} onChange={(e) => onChange(e.target.value)}
      className="h-8 text-[13px] min-w-[90px] w-auto"
    />
  );
}

/* ─── Photo tile ───────────────────────────────────────────────────────────────── */

function PhotoTile({ src, isCover, onDelete }: { src: string; isCover: boolean; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", background: "var(--surface-2)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={src} alt=""
        onError={(e) => { e.currentTarget.style.display = "none"; }}
        style={{
          width: "100%", height: "100%", objectFit: "cover", display: "block",
          transform: hovered ? "scale(1.03)" : "scale(1)",
          transition: "transform 300ms ease",
        }}
      />
      {isCover && (
        <span style={{
          position: "absolute", top: 8, left: 8,
          fontSize: 10, fontWeight: 600, color: "var(--ink)",
          background: "rgba(255,255,255,0.92)", borderRadius: 4, padding: "2px 7px",
        }}>
          Couverture
        </span>
      )}
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(14,14,18,0.38)",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: hovered ? 1 : 0, transition: "opacity 180ms ease",
      }}>
        <button
          onClick={onDelete}
          style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "rgba(14,14,18,0.72)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}
        >
          <Trash2 size={14} color="#fff" />
        </button>
      </div>
    </div>
  );
}

/* ─── Photo gallery section ───────────────────────────────────────────────────── */

function PhotoGallery({ photos, onDelete, onAdd }: {
  photos: string[]; onDelete: (i: number) => void; onAdd: () => void;
}) {
  return (
    <div className="ds-card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Info bar */}
      <div style={{
        padding: "11px 18px", borderBottom: "1px solid var(--hairline)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <p style={{ fontSize: 12, color: "var(--ink-tertiary)", margin: 0 }}>
          {photos.length}/10 photos — La première photo est la couverture
        </p>
        <button
          onClick={onAdd}
          style={{
            display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
            background: "var(--surface-2)", border: "1px solid var(--hairline)",
            borderRadius: 7, fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)",
            cursor: "pointer",
          }}
        >
          <Plus size={12} /> Ajouter
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 1, background: "var(--hairline)" }}>
        {photos.map((src, i) => (
          <PhotoTile key={src + i} src={src} isCover={i === 0} onDelete={() => onDelete(i)} />
        ))}

        {/* Add slot */}
        {photos.length < 10 && (
          <button
            onClick={onAdd}
            style={{
              aspectRatio: "4/3", background: "var(--surface-2)", border: "none",
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 140ms ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-3)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)"; }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              border: "1.5px dashed var(--hairline-strong)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Plus size={14} color="var(--ink-tertiary)" />
            </div>
            <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>Nouvelle photo</span>
          </button>
        )}
      </div>

      {/* Caption */}
      <div style={{ padding: "10px 18px", borderTop: "1px solid var(--hairline)" }}>
        <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: 0 }}>
          Formats acceptés : JPG, PNG, WebP — Taille max : 5 Mo — La première photo est la couverture de la fiche publique
        </p>
      </div>
    </div>
  );
}

/* ─── Phone list ───────────────────────────────────────────────────────────────── */

function PhoneList({ phones, onChange }: { phones: PhoneEntry[]; onChange: (p: PhoneEntry[]) => void }) {
  function add() {
    onChange([...phones, { id: uid(), number: "", label: "Réception" }]);
  }
  function update(id: string, patch: Partial<PhoneEntry>) {
    onChange(phones.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function remove(id: string) {
    if (phones.length === 1) return;
    onChange(phones.filter((p) => p.id !== id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {phones.map((phone) => (
        <div key={phone.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Phone size={13} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
          <Select value={phone.label} onValueChange={(v) => update(phone.id, { label: v })}>
            <SelectTrigger className="w-[130px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PHONE_LABELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            type="tel" value={phone.number} placeholder="+212 6 XX XX XX XX"
            onChange={(e) => update(phone.id, { number: e.target.value })}
            className="flex-1 h-9 text-[13px]"
          />
          {phones.length > 1 && (
            <button
              onClick={() => remove(phone.id)}
              style={{
                width: 32, height: 32, borderRadius: 7, border: "1px solid var(--hairline)",
                background: "var(--surface-1)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <X size={13} color="var(--ink-tertiary)" />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={add}
        style={{
          display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
          background: "transparent", border: "1px dashed var(--hairline-strong)",
          borderRadius: 8, fontSize: 12, color: "var(--ink-tertiary)",
          cursor: "pointer", fontFamily: "var(--font)", alignSelf: "flex-start",
        }}
      >
        <Plus size={12} /> Ajouter un numéro
      </button>
    </div>
  );
}

/* ─── Day hours row ────────────────────────────────────────────────────────────── */

function DayHoursRow({
  day, isLast, onChange,
}: {
  day: DayHours; isLast: boolean; onChange: (patch: Partial<DayHours>) => void;
}) {
  const { isMd: rowIsMd } = useBreakpoint();
  function addBreak() {
    onChange({ breaks: [...day.breaks, { id: uid(), start: "13:00", end: "14:00" }] });
  }
  function updateBreak(id: string, patch: Partial<BreakTime>) {
    onChange({ breaks: day.breaks.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  }
  function removeBreak(id: string) {
    onChange({ breaks: day.breaks.filter((b) => b.id !== id) });
  }

  return (
    <div style={{ borderBottom: isLast ? "none" : "1px solid var(--hairline)" }}>
      {/* Main row */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: rowIsMd ? 12 : 8,
          flexWrap: rowIsMd ? "nowrap" : "wrap",
          padding: rowIsMd ? "11px 20px" : "8px 12px", minHeight: 50,
          opacity: day.isClosed ? 0.48 : 1, transition: "opacity 160ms ease",
        }}
      >
        {/* Day name */}
        <span style={{
          width: 36, fontSize: 13, fontWeight: 500,
          color: "var(--ink)", flexShrink: 0, letterSpacing: "-0.01em",
        }}>
          {DAYS_SHORT[day.dayOfWeek]}
        </span>

        {/* Open/Closed toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
          <Switch checked={!day.isClosed} onCheckedChange={(v) => onChange({ isClosed: !v })} />
          <span style={{ fontSize: 11, color: "var(--ink-tertiary)", minWidth: 38 }}>
            {day.isClosed ? "Fermé" : "Ouvert"}
          </span>
        </div>

        {!day.isClosed ? (
          <>
            {/* Time range */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <TimeInput value={day.openTime}  onChange={(v) => onChange({ openTime: v })} />
              <span style={{ fontSize: 11, color: "var(--ink-disabled)" }}>→</span>
              <TimeInput value={day.closeTime} onChange={(v) => onChange({ closeTime: v })} />
            </div>

            {/* Add break */}
            <button
              onClick={addBreak}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "5px 10px", background: "var(--surface-2)",
                border: "1px solid var(--hairline)", borderRadius: 6,
                fontSize: 11, color: "var(--ink-tertiary)", cursor: "pointer",
                fontFamily: "var(--font)", flexShrink: 0, whiteSpace: "nowrap",
              }}
              title="Ajouter une pause"
            >
              <Coffee size={11} /> Pause
            </button>
          </>
        ) : null}
      </div>

      {/* Break rows */}
      <AnimatePresence initial={false}>
        {!day.isClosed && day.breaks.map((brk) => (
          <motion.div
            key={brk.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 20px 10px 72px",
              backgroundColor: "var(--surface-2)",
              borderTop: "1px solid var(--hairline)",
            }}>
              <Coffee size={11} color="var(--ink-tertiary)" />
              <span style={{ fontSize: 11, color: "var(--ink-tertiary)", flexShrink: 0 }}>Pause :</span>
              <TimeInput value={brk.start} onChange={(v) => updateBreak(brk.id, { start: v })} />
              <span style={{ fontSize: 11, color: "var(--ink-disabled)" }}>→</span>
              <TimeInput value={brk.end} onChange={(v) => updateBreak(brk.id, { end: v })} />
              <button
                onClick={() => removeBreak(brk.id)}
                style={{
                  marginLeft: "auto", width: 26, height: 26, borderRadius: 6,
                  background: "transparent", border: "1px solid var(--hairline)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={11} color="var(--ink-tertiary)" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const [hours, setHours] = useState<DayHours[]>(defaultHours());
  const [photos, setPhotos] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function handleAddPhoto() {
    photoInputRef.current?.click();
  }

  function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("La photo ne doit pas dépasser 5 Mo."); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUri = ev.target?.result as string;
      try {
        const res = await api.uploadProviderPhoto(dataUri);
        setPhotos(res.photos ?? [...photos, dataUri]);
        queryClient.invalidateQueries({ queryKey: ["dashboard", "provider"] });
        toast.success("Photo ajoutée !");
      } catch {
        // Fallback: add locally if API not yet built
        setPhotos((prev) => [...prev, dataUri]);
        toast.success("Photo ajoutée (aperçu local)");
      }
    };
    reader.readAsDataURL(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  }
  const [phones, setPhones] = useState<PhoneEntry[]>([
    { id: uid(), number: "", label: "Réception" },
  ]);
  const [profile, setProfile] = useState({
    name:        "",
    category:    "Coiffure mixte",
    description: "",
    email:       "",
    address:     "",
    logoUrl: "", // <-- added logoUrl
  });
  const [notifs, setNotifs] = useState({
    newBooking: true, cancelation: true, reminder24h: true, weeklyReport: false,
  });

  /* Load provider profile from API */
  const { data: providerData } = useQuery<any>({
    queryKey: ["dashboard", "provider"],
    queryFn:  () => api.get("/dashboard/provider"),
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (providerData) {
      setProfile((p) => ({
        ...p,
        name:        providerData.name        ?? p.name,
        description: providerData.description ?? p.description,
        email:       providerData.email       ?? p.email,
        address:     providerData.address     ?? p.address,
        logoUrl:     providerData.logoUrl     ?? p.logoUrl, // <-- set logoUrl from API
      }));
      setPhotos(Array.isArray(providerData.photos) ? providerData.photos : []);
      if (providerData.phone) {
        setPhones([{ id: uid(), number: providerData.phone, label: "Réception" }]);
      }
    }
  }, [providerData]);

  /* Load hours from API */
  const { data, isLoading } = useQuery<any[]>({
    queryKey: ["dashboard", "business-hours"],
    queryFn:  () => api.get("/dashboard/business-hours"),
    staleTime: 60_000,
    retry: false,
  });

  /* Load schedule blocks */
  const { data: blocksData, isLoading: blocksLoading } = useQuery<any[]>({
    queryKey: ["dashboard", "blocks"],
    queryFn:  () => api.getBlocks(),
    staleTime: 30_000,
    retry: false,
  });

  /* Block creation form state */
  const [blockForm, setBlockForm] = useState<{
    type: "VACATION" | "BREAK";
    startDate: string;
    endDate: string;
    title: string;
    staffId: string;
  }>({ type: "VACATION", startDate: "", endDate: "", title: "", staffId: "" });
  const [showBlockForm, setShowBlockForm] = useState(false);

  const createBlockMutation = useMutation({
    mutationFn: () => {
      if (!blockForm.startDate || !blockForm.endDate) throw new Error("Dates requises");
      const startDatetime = `${blockForm.startDate}T00:00:00.000Z`;
      const endDatetime   = `${blockForm.endDate}T23:59:59.000Z`;
      return api.createBlock({
        type: blockForm.type,
        startDatetime,
        endDatetime,
        title: blockForm.title || undefined,
        staffId: blockForm.staffId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "blocks"] });
      setBlockForm({ type: "VACATION", startDate: "", endDate: "", title: "", staffId: "" });
      setShowBlockForm(false);
      toast.success("Congé enregistré");
    },
    onError: (err: any) => toast.error(err?.data?.message ?? "Erreur lors de l'enregistrement"),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (blockId: string) => api.deleteBlock(blockId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "blocks"] });
      toast.success("Congé supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const staffList: { id: string; name: string }[] = Array.isArray(providerData?.staff) ? providerData.staff : [];

  useEffect(() => {
    if (data && data.length > 0) {
      const filled = defaultHours().map((def) => {
        const found = data.find((d: any) => d.dayOfWeek === def.dayOfWeek);
        return found ? { ...def, ...found, breaks: def.breaks } : def;
      });
      setHours(filled);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (h: DayHours[]) => api.put("/dashboard/business-hours", { hours: h }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "business-hours"] });
      toast.success("Horaires mis à jour");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde des horaires"),
  });

  const profileMutation = useMutation({
    mutationFn: () => api.put("/dashboard/provider", {
      name:        profile.name        || undefined,
      description: profile.description || undefined,
      address:     profile.address     || undefined,
      email:       profile.email       || undefined,
      phone:       phones[0]?.number   || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "provider"] });
      toast.success("Profil enregistré");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde du profil"),
  });

  const contactMutation = useMutation({
    mutationFn: () => api.put("/dashboard/provider", {
      email: profile.email       || undefined,
      phone: phones[0]?.number   || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "provider"] });
      toast.success("Coordonnées enregistrées");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde du contact"),
  });

  function setDay(i: number, patch: Partial<DayHours>) {
    setHours((prev) => prev.map((d) => (d.dayOfWeek === i ? { ...d, ...patch } : d)));
  }

  /* ─── Logo upload handler ──────────────────────────────────────────────── */
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le logo ne doit pas dépasser 5 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUri = ev.target?.result as string;
      try {
        const res = await api.uploadProviderLogo(dataUri);
        setProfile((p) => ({ ...p, logoUrl: res.logoUrl }));
        // Also update the provider data in the query? We'll refetch the provider data to be safe.
        queryClient.invalidateQueries({ queryKey: ["dashboard", "provider"] });
        toast.success("Logo mis à jour !");
      } catch {
        // Fallback: update locally if API not yet built
        setProfile((p) => ({ ...p, logoUrl: dataUri }));
        toast.success("Logo mis à jour (aperçu local)");
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  return (
    <DashboardLayout title="Paramètres" breadcrumb="Paramètres">
      <div style={{ maxWidth: 720 }}>

        {/* ── Photos ── */}
        <Section title="Photos du salon" icon={Image}>
          <PhotoGallery
            photos={photos}
            onDelete={async (i) => {
              const photoUrl = photos[i];
              setPhotos((prev) => prev.filter((_, idx) => idx !== i));
              try {
                await api.deleteProviderPhoto(photoUrl);
                queryClient.invalidateQueries({ queryKey: ["dashboard", "provider"] });
              } catch {
                /* best-effort — local state already updated */
              }
              toast.success("Photo supprimée");
            }}
            onAdd={handleAddPhoto}
          />
        </Section>

        {/* ── Profil ── */}
        <Section title="Profil du salon" icon={User}>
          <div className="ds-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Logo upload */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Label style={{ fontSize: 12 }}>Logo du salon</Label>
              <div style={{ position: "relative", width: 120, height: 120, marginBottom: 10 }}>
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt="Logo du salon"
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--surface-2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Upload size={24} color="var(--ink-tertiary)" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                  onChange={handleLogoUpload}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
              <Field
                label="Nom du salon"
                value={profile.name}
                onChange={(v) => setProfile((p) => ({ ...p, name: v }))}
                placeholder="Nom du salon"
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <Label style={{ fontSize: 12 }}>Catégorie</Label>
                <Select value={profile.category} onValueChange={(v) => setProfile((p) => ({ ...p, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Label style={{ fontSize: 12 }}>Description</Label>
              <Textarea
                value={profile.description}
                onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))}
                placeholder="Décrivez votre salon en quelques lignes…"
                rows={3}
                className="resize-y text-[13px]"
              />
              <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: 0 }}>
                Visible sur la page publique du salon
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                <MapPin size={11} /> Adresse
              </Label>
              <Input
                value={profile.address}
                onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                placeholder="Numéro, rue, quartier, ville"
                className="h-9 text-[13px]"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <SaveBtn label="Sauvegarder le profil" onClick={() => profileMutation.mutate()} loading={profileMutation.isPending} />
            </div>
          </div>
        </Section>

        {/* ── Contact ── */}
        <Section title="Contact" icon={Phone}>
          <div className="ds-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <Label style={{ fontSize: 12, display: "block", marginBottom: 10 }}>Téléphones</Label>
              <PhoneList phones={phones} onChange={setPhones} />
            </div>
            <Field
              label="Email de contact"
              value={profile.email}
              onChange={(v) => setProfile((p) => ({ ...p, email: v }))}
              type="email"
              placeholder="contact@salon.ma"
              hint="Utilisé pour les confirmations de réservation et le rapport hebdomadaire"
            />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <SaveBtn label="Sauvegarder le contact" onClick={() => contactMutation.mutate()} loading={contactMutation.isPending} />
            </div>
          </div>
        </Section>

        {/* ── Horaires ── */}
        <Section title="Horaires d'ouverture" icon={Clock}>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {DAYS_FULL.map((d) => (
                <div key={d} style={{ height: 50, borderRadius: 8, background: "var(--surface-2)", animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : (
            <>
              <div style={{ border: "1px solid var(--hairline)", borderRadius: 12, overflow: "hidden", background: "var(--surface-1)" }}>
                {hours.map((day, idx) => (
                  <DayHoursRow
                    key={day.dayOfWeek}
                    day={day}
                    isLast={idx === hours.length - 1}
                    onChange={(patch) => setDay(day.dayOfWeek, patch)}
                  />
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                <p style={{ fontSize: 11, color: "var(--ink-tertiary)", margin: 0, maxWidth: 340 }}>
                  Les pauses bloquent tous les créneaux pour l'ensemble de l'équipe
                </p>
                <SaveBtn
                  label="Sauvegarder les horaires"
                  onClick={() => mutation.mutate(hours)}
                  loading={mutation.isPending}
                />
              </div>
            </>
          )}
        </Section>

        {/* ── Notifications ── */}
        <Section title="Notifications" icon={Bell}>
          <div className="ds-card" style={{ padding: 0, overflow: "hidden" }}>
            {(
              [
                { key: "newBooking"   as const, label: "Nouvelle réservation",   desc: "Alerte à chaque nouvelle réservation reçue"          },
                { key: "cancelation"  as const, label: "Annulation",             desc: "Prévenu lorsqu'un client annule son rendez-vous"      },
                { key: "reminder24h"  as const, label: "Rappel 24 h avant",      desc: "Rappel automatique pour les RDV du lendemain"         },
                { key: "weeklyReport" as const, label: "Rapport hebdomadaire",   desc: "Synthèse de l'activité envoyée chaque lundi matin"    },
              ] as const
            ).map(({ key, label, desc }, i, arr) => (
              <div
                key={key}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--hairline)" : "none",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>{desc}</div>
                </div>
                <Switch checked={notifs[key]} onCheckedChange={(v) => setNotifs((p) => ({ ...p, [key]: v }))} />
              </div>
            ))}
          </div>
        </Section>

        {/* ── Congés & Fermetures ── */}
        <Section title="Congés & Fermetures" icon={CalendarOff}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Existing blocks list */}
            {blocksLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2].map((i) => (
                  <div key={i} className="bg-[#ECEDF0] animate-pulse" style={{ height: 52, borderRadius: 8 }} />
                ))}
              </div>
            ) : !blocksData || blocksData.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "32px 20px", border: "1px dashed var(--hairline-strong)", borderRadius: 10,
                gap: 8,
              }}>
                <CalendarOff size={28} color="var(--ink-tertiary)" />
                <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: 0, textAlign: "center" }}>
                  Aucune période de fermeture planifiée.<br />
                  Ajoutez congés et pauses pour bloquer automatiquement les disponibilités.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {blocksData.map((block: any) => {
                  const staffName = staffList.find((s) => s.id === block.staffId)?.name;
                  const typeLabel = block.type === "VACATION" ? "Congé" : block.type === "BREAK" ? "Pause" : "Blocage";
                  const typeBg   = block.type === "VACATION" ? "var(--accent-tint)" : block.type === "BREAK" ? "#EEF2FF" : "var(--surface-2)";
                  const typeColor= block.type === "VACATION" ? "var(--accent)" : block.type === "BREAK" ? "#4F46E5" : "var(--ink-secondary)";
                  const start = new Date(block.startDatetime).toLocaleDateString("fr-MA", { day: "numeric", month: "short", year: "numeric" });
                  const end   = new Date(block.endDatetime).toLocaleDateString("fr-MA", { day: "numeric", month: "short", year: "numeric" });
                  return (
                    <div key={block.id} className="ds-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ padding: "3px 8px", borderRadius: 5, background: typeBg }}>
                          <span style={{ fontSize: 11, fontWeight: 500, color: typeColor }}>{typeLabel}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                            {block.title || typeLabel}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--ink-tertiary)", marginTop: 2 }}>
                            {start} → {end}{staffName ? ` · ${staffName}` : ""}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={deleteBlockMutation.isPending}
                        onClick={() => deleteBlockMutation.mutate(block.id)}
                        style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, color: "var(--ink-tertiary)" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add block form */}
            <AnimatePresence>
              {showBlockForm && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="ds-card"
                  style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <div style={{ display: "flex", gap: 10 }}>
                    {(["VACATION", "BREAK"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setBlockForm((f) => ({ ...f, type: t }))}
                        style={{
                          padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
                          border: blockForm.type === t ? "1.5px solid var(--accent)" : "1px solid var(--hairline-strong)",
                          background: blockForm.type === t ? "var(--accent-tint)" : "var(--canvas-pure)",
                          color: blockForm.type === t ? "var(--accent)" : "var(--ink-secondary)",
                        }}
                      >
                        {t === "VACATION" ? "Congé" : "Pause / Fermeture"}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <Label style={{ fontSize: 11 }}>Date de début</Label>
                      <Input
                        type="date"
                        value={blockForm.startDate}
                        onChange={(e) => setBlockForm((f) => ({ ...f, startDate: e.target.value }))}
                        className="h-9 text-[13px]"
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <Label style={{ fontSize: 11 }}>Date de fin</Label>
                      <Input
                        type="date"
                        value={blockForm.endDate}
                        onChange={(e) => setBlockForm((f) => ({ ...f, endDate: e.target.value }))}
                        className="h-9 text-[13px]"
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Label style={{ fontSize: 11 }}>Titre (facultatif)</Label>
                    <Input
                      type="text"
                      value={blockForm.title}
                      onChange={(e) => setBlockForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="Ex : Vacances d'été, Fermeture exceptionnelle…"
                      className="h-9 text-[13px]"
                    />
                  </div>

                  {staffList.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <Label style={{ fontSize: 11 }}>Membre du personnel (laisser vide = tout le salon)</Label>
                      <Select
                        value={blockForm.staffId === "" ? "_all" : blockForm.staffId}
                        onValueChange={(v) => setBlockForm((f) => ({ ...f, staffId: v === "_all" ? "" : v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_all">Tout le salon</SelectItem>
                          {staffList.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setShowBlockForm(false)}
                      style={{ padding: "8px 16px", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "1px solid var(--hairline-strong)", background: "transparent", color: "var(--ink-secondary)" }}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={createBlockMutation.isPending || !blockForm.startDate || !blockForm.endDate}
                      onClick={() => createBlockMutation.mutate()}
                      style={{
                        padding: "8px 18px", borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: "pointer",
                        border: "none", background: "var(--accent)", color: "#fff",
                        opacity: (!blockForm.startDate || !blockForm.endDate) ? 0.5 : 1,
                      }}
                    >
                      {createBlockMutation.isPending ? "Enregistrement…" : "Enregistrer"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showBlockForm && (
              <button
                type="button"
                onClick={() => setShowBlockForm(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start",
                  padding: "8px 14px", borderRadius: 7, fontSize: 13, fontWeight: 500,
                  border: "1px solid var(--hairline-strong)", background: "var(--canvas-pure)",
                  color: "var(--ink-secondary)", cursor: "pointer",
                }}
              >
                <Plus size={14} />
                Ajouter une période
              </button>
            )}
          </div>
        </Section>

        {/* ── Sécurité ── */}
        <PasswordSection />

      </div>
    </DashboardLayout>
  );
}