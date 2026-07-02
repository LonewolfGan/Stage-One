import { useRef, useState } from "react";
import { useBreakpoint } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/DSButton";
import { api, type ApiService, type ApiStaff } from "@/lib/api";
import { Pencil, Tag, Trash2, Clock, Timer, Users, ToggleLeft, ToggleRight, Plus } from "lucide-react";
import { ds } from "@/lib/design-system";
import { toast } from "sonner";
import { initials } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/* ── Staff chip ───────────────────────────────────────────── */
function StaffChip({ name }: { name: string }) {
  return (
    <span
      title={name}
      style={{
        display:         "inline-flex",
        alignItems:      "center",
        justifyContent:  "center",
        width:           22,
        height:          22,
        borderRadius:    "50%",
        backgroundColor: ds.colors.canvasMuted,
        border:          `1px solid ${ds.colors.border}`,
        fontSize:        9,
        fontWeight:      700,
        color:           ds.colors.inkSecondary,
        letterSpacing:   "-0.01em",
        flexShrink:      0,
      }}
    >
      {initials(name)}
    </span>
  );
}

/* ── Service Card ──────────────────────────────────────────── */
function ServiceCard({
  service,
  staff,
  slug,
  index,
  onEdit,
}: {
  service: ApiService;
  staff:   ApiStaff[];
  slug:    string;
  index:   number;
  onEdit:  (s: ApiService) => void;
}) {
  const qc = useQueryClient();

  const toggle = useMutation({
    mutationFn: () =>
      api.updateService(slug, service.id, { isActive: !service.isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard", "provider"] });
      toast.success(service.isActive ? "Prestation désactivée" : "Prestation activée");
    },
    onError: () => toast.error("Impossible de modifier l'état"),
  });

  const assignedStaff = staff.filter((m) => service.staffIds?.includes(m.id));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2, ease: [0, 0, 0.2, 1] }}
      style={{
        borderRadius:    12,
        border:          `1px solid ${service.isActive ? ds.colors.border : ds.colors.border}`,
        backgroundColor: service.isActive ? ds.colors.canvas : ds.colors.canvasSubtle,
        display:         "flex",
        flexDirection:   "column",
        padding:         "16px 18px 14px",
        gap:             10,
        opacity:         service.isActive ? 1 : 0.65,
        transition:      "border-color 150ms ease, background-color 150ms ease, opacity 150ms ease",
      }}
    >
      {/* Name + active badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <p style={{
          fontSize:      14, fontWeight: 600, color: ds.colors.ink,
          letterSpacing: "-0.015em", lineHeight: 1.3, margin: 0, flex: 1,
        }}>
          {service.name}
        </p>
        {/* Active toggle */}
        <button
          onClick={() => toggle.mutate()}
          disabled={toggle.isPending}
          title={service.isActive ? "Désactiver" : "Activer"}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color:      service.isActive ? ds.colors.success : ds.colors.inkDisabled,
            padding:    2, display: "flex", flexShrink: 0,
            opacity:    toggle.isPending ? 0.5 : 1, transition: "opacity 140ms",
          }}
        >
          {service.isActive
            ? <ToggleRight size={20} />
            : <ToggleLeft  size={20} />
          }
        </button>
      </div>

      {/* Description */}
      <p style={{
        fontSize: 12, color: ds.colors.inkTertiary, lineHeight: 1.55,
        margin: 0, flex: 1,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        minHeight: 37,
      }}>
        {service.description || <span style={{ opacity: 0.5, fontStyle: "italic" }}>Pas de description</span>}
      </p>

      {/* Meta row: duration + buffer */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 500, color: ds.colors.inkSecondary,
          backgroundColor: ds.colors.canvasMuted,
          borderRadius: ds.radius.full, padding: "3px 8px",
        }}>
          <Clock size={10} /> {service.durationMinutes} min
        </span>
        {service.bufferMinutes > 0 && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 11, fontWeight: 500, color: ds.colors.inkTertiary,
            backgroundColor: ds.colors.canvasMuted,
            borderRadius: ds.radius.full, padding: "3px 8px",
          }}>
            <Timer size={10} /> +{service.bufferMinutes} min pause
          </span>
        )}
      </div>

      {/* Assigned staff chips */}
      {assignedStaff.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          <Users size={11} color={ds.colors.inkDisabled} />
          {assignedStaff.map((m) => (
            <StaffChip key={m.id} name={m.name} />
          ))}
          <span style={{ fontSize: 10, color: ds.colors.inkTertiary, marginLeft: 2 }}>
            {assignedStaff.length} professionnel{assignedStaff.length > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingTop: 10, borderTop: `1px solid ${ds.colors.border}`, gap: 8,
      }}>
        <span style={{
          fontSize: 17, fontWeight: 700, color: ds.colors.ink,
          letterSpacing: "-0.025em", lineHeight: 1,
        }}>
          {Math.round(service.priceCents / 100)}{" "}
          <span style={{ fontSize: 11, fontWeight: 400, color: ds.colors.inkTertiary, letterSpacing: 0 }}>MAD</span>
        </span>

        <button
          onClick={() => onEdit(service)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            height: 28, paddingInline: 12,
            backgroundColor: ds.colors.ink, color: "#fff",
            border: "none", borderRadius: 7,
            fontSize: 12, fontWeight: 500, cursor: "pointer",
            fontFamily: "var(--font)", flexShrink: 0,
            transition: "opacity 140ms ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.75"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          <Pencil size={10} strokeWidth={2} /> Modifier
        </button>
      </div>
    </motion.div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${ds.colors.border}`, padding: "16px 18px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ height: 14, width: "52%", borderRadius: 5, backgroundColor: ds.colors.canvasMuted, animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 20, width: 20, borderRadius: 9999, backgroundColor: ds.colors.canvasMuted, animation: "pulse 1.4s ease-in-out infinite", flexShrink: 0 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
        <div style={{ height: 12, width: "82%", borderRadius: 4, backgroundColor: ds.colors.canvasMuted, animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 12, width: "62%", borderRadius: 4, backgroundColor: ds.colors.canvasMuted, animation: "pulse 1.4s ease-in-out infinite" }} />
      </div>
      <div style={{ paddingTop: 10, borderTop: `1px solid ${ds.colors.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ height: 17, width: 72, borderRadius: 5, backgroundColor: ds.colors.canvasMuted, animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 28, width: 76, borderRadius: 7, backgroundColor: ds.colors.canvasMuted, animation: "pulse 1.4s ease-in-out infinite" }} />
      </div>
    </div>
  );
}

/* ── Service Form Modal ─────────────────────────────────────── */
interface ServiceFormProps {
  slug:      string;
  service?:  ApiService | null;
  allStaff:  ApiStaff[];
  onClose:   () => void;
}

function ServiceForm({ slug, service, allStaff, onClose }: ServiceFormProps) {
  const isEdit = !!service;
  const qc = useQueryClient();
  const { isMd: formIsMd } = useBreakpoint();

  const [name, setName]         = useState(service?.name ?? "");
  const [description, setDesc]  = useState(service?.description ?? "");
  const [duration, setDuration] = useState(service ? String(service.durationMinutes) : "");
  const [buffer, setBuffer]     = useState(service ? String(service.bufferMinutes ?? 0) : "0");
  const [price, setPrice]       = useState(service ? String(Math.round(service.priceCents / 100)) : "");
  const [staffIds, setStaffIds] = useState<string[]>(service?.staffIds ?? []);
  const [error, setError]       = useState("");

  const save = useMutation({
    mutationFn: () => {
      const data = {
        name:            name.trim(),
        description:     description.trim() || undefined,
        durationMinutes: parseInt(duration, 10),
        bufferMinutes:   parseInt(buffer, 10) || 0,
        priceCents:      Math.round(parseFloat(price) * 100),
        staffIds,
      };
      return isEdit
        ? api.updateService(slug, service!.id, data)
        : api.createService(slug, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard", "provider"] });
      toast.success(isEdit ? "Prestation mise à jour" : "Prestation ajoutée");
      onClose();
    },
    onError: () => setError("Une erreur est survenue. Veuillez réessayer."),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteService(slug, service!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard", "provider"] });
      toast.success("Prestation supprimée");
      onClose();
    },
    onError: () => setError("Impossible de supprimer cette prestation."),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Le nom est requis."); return; }
    const d = parseInt(duration, 10);
    if (!d || d < 1) { setError("Durée invalide."); return; }
    const p = parseFloat(price);
    if (isNaN(p) || p < 0) { setError("Prix invalide."); return; }
    save.mutate();
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%", height: 38, padding: "0 12px",
    border: `1px solid ${ds.colors.borderStrong}`, borderRadius: 8,
    backgroundColor: ds.colors.canvas, fontSize: 13, color: ds.colors.ink,
    outline: "none", fontFamily: "var(--font)", boxSizing: "border-box",
    transition: "border-color 140ms ease",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 500,
    color: ds.colors.inkSecondary, marginBottom: 6, letterSpacing: "-0.01em",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 20px 14px", borderBottom: `1px solid ${ds.colors.border}`, flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: ds.colors.ink, letterSpacing: "-0.015em" }}>
          {isEdit ? "Modifier la prestation" : "Nouvelle prestation"}
        </h2>
      </div>

      {/* Form */}
      <div style={{ overflowY: "auto", flex: 1 }}>
      <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div>
              <label style={labelStyle}>Nom <span style={{ color: ds.colors.accent }}>*</span></label>
              <input style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Coupe femme" autoFocus
                onFocus={(e) => { e.currentTarget.style.borderColor = ds.colors.ink; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = ds.colors.borderStrong; }}
              />
            </div>

            <div>
              <label style={labelStyle}>Description <span style={{ color: ds.colors.inkDisabled, fontWeight: 400 }}>(optionnel)</span></label>
              <textarea style={{ ...fieldStyle, height: 68, padding: "10px 12px", resize: "vertical", lineHeight: 1.5 }}
                value={description} onChange={(e) => setDesc(e.target.value)} placeholder="Décrivez la prestation…"
                onFocus={(e) => { e.currentTarget.style.borderColor = ds.colors.ink; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = ds.colors.borderStrong; }}
              />
            </div>

            {/* Duration + Buffer + Price */}
            <div style={{ display: "grid", gridTemplateColumns: formIsMd ? "1fr 1fr 1fr" : "1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Durée (min) <span style={{ color: ds.colors.accent }}>*</span></label>
                <input style={fieldStyle} type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="45"
                  onFocus={(e) => { e.currentTarget.style.borderColor = ds.colors.ink; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = ds.colors.borderStrong; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Pause (min)</label>
                <input style={fieldStyle} type="number" min="0" value={buffer} onChange={(e) => setBuffer(e.target.value)} placeholder="0"
                  onFocus={(e) => { e.currentTarget.style.borderColor = ds.colors.ink; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = ds.colors.borderStrong; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Prix (MAD) <span style={{ color: ds.colors.accent }}>*</span></label>
                <input style={fieldStyle} type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="150"
                  onFocus={(e) => { e.currentTarget.style.borderColor = ds.colors.ink; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = ds.colors.borderStrong; }}
                />
              </div>
            </div>

            {/* Staff checkboxes */}
            {allStaff.length > 0 && (
              <div>
                <label style={labelStyle}>Professionnels assignés</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {allStaff.map((m) => {
                    const checked = staffIds.includes(m.id);
                    return (
                      <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: ds.colors.ink }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setStaffIds((prev) =>
                              checked ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                            )
                          }
                          style={{ width: 14, height: 14, accentColor: ds.colors.ink, cursor: "pointer" }}
                        />
                        {m.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {error && <p style={{ margin: 0, fontSize: 12, color: ds.colors.error, fontWeight: 500 }}>{error}</p>}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, gap: 10 }}>
            {isEdit ? (
              <button type="button" onClick={() => remove.mutate()} disabled={remove.isPending}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 34, paddingInline: 14, backgroundColor: ds.colors.errorBg, color: ds.colors.error, border: `1px solid ${ds.colors.errorBorder}`, borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: remove.isPending ? "not-allowed" : "pointer", fontFamily: "var(--font)", opacity: remove.isPending ? 0.6 : 1, transition: "opacity 140ms ease" }}
              >
                <Trash2 size={12} />{remove.isPending ? "Suppression…" : "Supprimer"}
              </button>
            ) : <span />}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={onClose} style={{ height: 34, paddingInline: 16, backgroundColor: "transparent", color: ds.colors.inkSecondary, border: `1px solid ${ds.colors.borderStrong}`, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)" }}>Annuler</button>
              <button type="submit" disabled={save.isPending} style={{ height: 34, paddingInline: 18, backgroundColor: save.isPending ? ds.colors.inkDisabled : ds.colors.ink, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: save.isPending ? "not-allowed" : "pointer", fontFamily: "var(--font)", transition: "background-color 140ms ease" }}>
                {save.isPending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function ServicesPage() {
  const [editing, setEditing] = useState<ApiService | null | undefined>(undefined);

  const { data: providerData, isLoading } = useQuery({
    queryKey: ["dashboard", "provider"],
    queryFn:  () => api.getDashboardProvider(),
    staleTime: 300_000,
    retry: false,
  });

  const slug: string = providerData?.slug ?? "";
  const services: ApiService[] = providerData?.services ?? [];
  const allStaff: ApiStaff[]   = providerData?.staff    ?? [];

  return (
    <>
      <DashboardLayout
        title="Prestations"
        breadcrumb="Prestations"
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setEditing(null)}>
            Ajouter
          </Button>
        }
      >
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : services.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "80px 24px", border: `1px dashed ${ds.colors.borderStrong}`, borderRadius: 12, textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: ds.colors.canvasMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Tag size={18} color={ds.colors.inkTertiary} strokeWidth={1.5} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: ds.colors.ink, margin: "0 0 4px", letterSpacing: "-0.01em" }}>Aucune prestation</p>
              <p style={{ fontSize: 13, color: ds.colors.inkTertiary, margin: 0 }}>Ajoutez votre première prestation pour qu'elle apparaisse ici.</p>
            </div>
            <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setEditing(null)}>Ajouter une prestation</Button>
          </div>
        ) : (
          <motion.div layout style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            <AnimatePresence mode="popLayout">
              {services.map((service, i) => (
                <ServiceCard key={service.id} service={service} staff={allStaff} slug={slug} index={i} onEdit={(s) => setEditing(s)} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </DashboardLayout>

      <AnimatePresence>
        {editing !== undefined && (
          <ServiceForm slug={slug} service={editing} allStaff={allStaff} onClose={() => setEditing(undefined)} />
        )}
      </AnimatePresence>
    </>
  );
}
