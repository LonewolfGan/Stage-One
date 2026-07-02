import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/DSButton";
import { api, type ApiStaff, type ApiService } from "@/lib/api";
import { Plus, Pencil, X, Trash2, Scissors, CalendarOff } from "lucide-react";
import { ds } from "@/lib/design-system";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/* ─── helpers ─────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function serviceCount(staffId: string, services: ApiService[]) {
  return services.filter((s) => s.staffIds?.includes(staffId)).length;
}

/* ─── Status toggle ───────────────────────────────────────── */
function StatusChip({
  isActive, loading, onClick,
}: { isActive: boolean; loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick} disabled={loading}
      title={isActive ? "Marquer indisponible" : "Marquer disponible"}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, height: 26, paddingInline: 10,
        borderRadius: ds.radius.full, border: "1px solid",
        borderColor: isActive ? ds.colors.successBorder : ds.colors.borderStrong,
        backgroundColor: isActive ? ds.colors.successBg : ds.colors.canvasMuted,
        color:           isActive ? ds.colors.success    : ds.colors.inkTertiary,
        fontSize: 11, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "var(--font)", opacity: loading ? 0.5 : 1,
        transition: "all 160ms ease", whiteSpace: "nowrap", flexShrink: 0,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: isActive ? ds.colors.success : ds.colors.inkDisabled, flexShrink: 0 }} />
      {loading ? "…" : isActive ? "Disponible" : "Indisponible"}
    </button>
  );
}

/* ─── Absence Modal ───────────────────────────────────────── */
function AbsenceModal({
  member, slug, onClose,
}: { member: ApiStaff; slug: string; onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate,   setEndDate]   = useState(today);
  const [reason,    setReason]    = useState("");
  const [error,     setError]     = useState("");

  const declare = useMutation({
    mutationFn: () => {
      if (!startDate || !endDate) throw new Error("Dates requises");
      if (endDate < startDate) throw new Error("La date de fin doit être après la date de début");
      return api.createBlock({
        staffId:       member.id,
        startDatetime: `${startDate}T08:00:00.000Z`,
        endDatetime:   `${endDate}T20:00:00.000Z`,
        title:         reason.trim() || "Absence",
      });
    },
    onSuccess: () => {
      toast.success(`Absence déclarée pour ${member.name}`);
      onClose();
    },
    onError: (err: any) => setError(err?.message ?? "Erreur lors de la déclaration"),
  });

  const fieldStyle: React.CSSProperties = {
    width: "100%", height: 38, padding: "0 12px",
    border: `1px solid ${ds.colors.borderStrong}`, borderRadius: 8,
    backgroundColor: ds.colors.canvas, fontSize: 13, color: ds.colors.ink,
    outline: "none", fontFamily: "var(--font)", boxSizing: "border-box",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 300, backgroundColor: "rgba(0,0,0,0.46)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 400, backgroundColor: ds.colors.canvas, borderRadius: 14, border: `1px solid ${ds.colors.border}`, overflow: "hidden" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 16px", borderBottom: `1px solid ${ds.colors.border}` }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: ds.colors.ink, letterSpacing: "-0.015em" }}>
              Déclarer une absence
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: ds.colors.inkTertiary }}>{member.name}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: ds.colors.inkTertiary, padding: 4, display: "flex", borderRadius: 6 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: ds.colors.inkSecondary, marginBottom: 6 }}>
                Date début <span style={{ color: ds.colors.accent }}>*</span>
              </label>
              <input type="date" value={startDate} min={today}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ ...fieldStyle, cursor: "pointer" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: ds.colors.inkSecondary, marginBottom: 6 }}>
                Date fin <span style={{ color: ds.colors.accent }}>*</span>
              </label>
              <input type="date" value={endDate} min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ ...fieldStyle, cursor: "pointer" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: ds.colors.inkSecondary, marginBottom: 6 }}>
              Motif <span style={{ color: ds.colors.inkDisabled, fontWeight: 400 }}>(optionnel)</span>
            </label>
            <input type="text" value={reason} placeholder="Ex. Congé annuel, Maladie…"
              onChange={(e) => setReason(e.target.value)}
              style={fieldStyle}
            />
          </div>

          {error && <p style={{ margin: 0, fontSize: 12, color: ds.colors.error, fontWeight: 500 }}>{error}</p>}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ height: 34, paddingInline: 16, backgroundColor: "transparent", color: ds.colors.inkSecondary, border: `1px solid ${ds.colors.borderStrong}`, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font)" }}>
              Annuler
            </button>
            <button
              onClick={() => declare.mutate()} disabled={declare.isPending}
              style={{ height: 34, paddingInline: 18, backgroundColor: declare.isPending ? ds.colors.inkDisabled : ds.colors.ink, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: declare.isPending ? "not-allowed" : "pointer", fontFamily: "var(--font)", transition: "background-color 140ms ease" }}
            >
              {declare.isPending ? "Enregistrement…" : "Confirmer l'absence"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Staff Grid Card ─────────────────────────────────────── */
function StaffCard({
  member, services, slug, index, onEdit, onAbsence,
}: {
  member: ApiStaff; services: ApiService[]; slug: string;
  index: number; onEdit: (m: ApiStaff) => void; onAbsence: (m: ApiStaff) => void;
}) {
  const qc = useQueryClient();

  const toggle = useMutation({
    mutationFn: () => api.updateStaff(slug, member.id, { isActive: !member.isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff", slug] });
      toast.success(member.isActive ? `${member.name} marqué indisponible` : `${member.name} marqué disponible`);
    },
    onError: () => toast.error("Impossible de modifier le statut"),
  });

  const count = serviceCount(member.id, services);
  const assignedServices = services.filter((s) => s.staffIds?.includes(member.id));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2, ease: [0, 0, 0.2, 1] }}
      style={{
        display: "flex", flexDirection: "column",
        borderRadius: 12, border: `1px solid ${ds.colors.border}`,
        backgroundColor: member.isActive ? ds.colors.canvas : ds.colors.canvasSubtle,
        opacity: member.isActive ? 1 : 0.7,
        transition: "border-color 150ms ease, background-color 150ms ease, opacity 150ms ease",
        overflow: "hidden",
      }}
    >
      {/* Top: avatar + status toggle */}
      <div style={{ padding: "18px 16px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flex: 1 }}>
        {/* Avatar */}
        <Avatar
          name={member.name}
          photoUrl={member.photoUrl || undefined}
          size={64}
          style={{ border: `1px solid ${ds.colors.border}` }}
        />

        {/* Name + bio */}
        <div style={{ textAlign: "center", minWidth: 0, width: "100%" }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: ds.colors.ink, letterSpacing: "-0.015em", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {member.name}
          </p>
          {member.bio && (
            <p style={{ fontSize: 12, color: ds.colors.inkTertiary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {member.bio}
            </p>
          )}
        </div>

        {/* Status toggle */}
        <StatusChip isActive={member.isActive} loading={toggle.isPending} onClick={() => toggle.mutate()} />

        {/* Service chips */}
        {assignedServices.length > 0 ? (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
            {assignedServices.slice(0, 3).map((s) => (
              <span key={s.id} style={{ fontSize: 10, fontWeight: 500, color: ds.colors.inkTertiary, backgroundColor: ds.colors.canvasMuted, borderRadius: ds.radius.full, padding: "2px 7px", whiteSpace: "nowrap" }}>
                {s.name}
              </span>
            ))}
            {assignedServices.length > 3 && (
              <span style={{ fontSize: 10, color: ds.colors.inkDisabled, padding: "2px 0" }}>+{assignedServices.length - 3}</span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 11, color: ds.colors.inkDisabled }}>Aucune prestation assignée</span>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ borderTop: `1px solid ${ds.colors.border}`, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: count > 0 ? ds.colors.inkSecondary : ds.colors.inkDisabled }}>
          <Scissors size={10} strokeWidth={2} />
          {count} presta{count !== 1 ? "tions" : "tion"}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => onAbsence(member)}
            title="Déclarer une absence"
            style={{ height: 28, paddingInline: 10, display: "flex", alignItems: "center", gap: 4, background: "none", border: `1px solid ${ds.colors.border}`, borderRadius: 7, cursor: "pointer", color: ds.colors.inkTertiary, fontSize: 11, fontWeight: 500, fontFamily: "var(--font)", transition: "border-color 140ms ease, color 140ms ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = ds.colors.ink; (e.currentTarget as HTMLButtonElement).style.borderColor = ds.colors.borderStrong; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = ds.colors.inkTertiary; (e.currentTarget as HTMLButtonElement).style.borderColor = ds.colors.border; }}
          >
            <CalendarOff size={11} /> Absence
          </button>
          <button
            onClick={() => onEdit(member)}
            style={{ height: 28, width: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: `1px solid ${ds.colors.border}`, borderRadius: 7, cursor: "pointer", color: ds.colors.inkTertiary, transition: "border-color 140ms ease, color 140ms ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = ds.colors.ink; (e.currentTarget as HTMLButtonElement).style.borderColor = ds.colors.borderStrong; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = ds.colors.inkTertiary; (e.currentTarget as HTMLButtonElement).style.borderColor = ds.colors.border; }}
            title="Modifier"
          >
            <Pencil size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Skeleton card ───────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${ds.colors.border}`, overflow: "hidden" }}>
      <div style={{ padding: "18px 16px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: ds.colors.canvasMuted, animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 13, width: "60%", borderRadius: 5, backgroundColor: ds.colors.canvasMuted, animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 26, width: 100, borderRadius: 9999, backgroundColor: ds.colors.canvasMuted, animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 20, width: "80%", borderRadius: 9999, backgroundColor: ds.colors.canvasMuted, animation: "pulse 1.4s ease-in-out infinite" }} />
      </div>
      <div style={{ borderTop: `1px solid ${ds.colors.border}`, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ height: 11, width: 80, borderRadius: 4, backgroundColor: ds.colors.canvasMuted, animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ height: 28, width: 72, borderRadius: 7, backgroundColor: ds.colors.canvasMuted, animation: "pulse 1.4s ease-in-out infinite" }} />
          <div style={{ height: 28, width: 28, borderRadius: 7, backgroundColor: ds.colors.canvasMuted, animation: "pulse 1.4s ease-in-out infinite" }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Staff Form Modal ────────────────────────────────────── */
interface StaffFormProps { slug: string; member?: ApiStaff | null; services: ApiService[]; onClose: () => void; }

function StaffForm({ slug, member, services, onClose }: StaffFormProps) {
  const isEdit = !!member;
  const qc = useQueryClient();

  const [name,     setName]     = useState(member?.name    ?? "");
  const [bio,      setBio]      = useState(member?.bio     ?? "");
  const [photo,    setPhoto]    = useState(member?.photoUrl ?? "");
  const [preview,  setPreview]  = useState(member?.photoUrl ?? "");
  const [error,    setError]    = useState("");
  // Pre-fill services assigned to this staff member
  const [serviceIds, setServiceIds] = useState<string[]>(
    services.filter((s) => s.staffIds?.includes(member?.id ?? "")).map((s) => s.id),
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("L'image ne doit pas dépasser 2 Mo."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhoto(result); setPreview(result); setError("");
    };
    reader.readAsDataURL(file);
  }

  // When services assignments change we also need to update each service's staffIds
  const qClient = useQueryClient();
  const save = useMutation({
    mutationFn: async () => {
      const data = { name: name.trim(), bio: bio.trim() || undefined, photoUrl: photo.trim() || undefined };
      const savedMember = isEdit
        ? await api.updateStaff(slug, member!.id, data)
        : await api.createStaff(slug, data);
      // Update staffIds on each service
      const currentServices: ApiService[] = qClient.getQueryData<any>(["dashboard", "provider"])?.services ?? [];
      for (const svc of currentServices) {
        const hadMember   = svc.staffIds?.includes(savedMember.id) ?? false;
        const wantsMember = serviceIds.includes(svc.id);
        if (hadMember !== wantsMember) {
          const newIds = wantsMember
            ? [...(svc.staffIds ?? []), savedMember.id]
            : (svc.staffIds ?? []).filter((id) => id !== savedMember.id);
          await api.updateService(slug, svc.id, { staffIds: newIds });
        }
      }
      return savedMember;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff", slug] }); qc.invalidateQueries({ queryKey: ["dashboard", "provider"] }); onClose(); },
    onError: () => setError("Une erreur est survenue."),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteStaff(slug, member!.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff", slug] }); onClose(); },
    onError: () => setError("Impossible de supprimer ce membre."),
  });

  const fieldStyle: React.CSSProperties = {
    width: "100%", height: 38, padding: "0 12px",
    border: `1px solid ${ds.colors.borderStrong}`, borderRadius: 8,
    backgroundColor: ds.colors.canvas, fontSize: 13, color: ds.colors.ink,
    outline: "none", fontFamily: "var(--font)", boxSizing: "border-box", transition: "border-color 140ms ease",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 500, color: ds.colors.inkSecondary, marginBottom: 6, letterSpacing: "-0.01em",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "16px 20px 14px", borderBottom: `1px solid ${ds.colors.border}`, flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: ds.colors.ink, letterSpacing: "-0.015em" }}>
          {isEdit ? "Modifier le membre" : "Nouveau membre"}
        </h2>
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) { setError("Le nom est requis."); return; } setError(""); save.mutate(); }} style={{ padding: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <div>
              <label style={labelStyle}>Nom <span style={{ color: ds.colors.accent }}>*</span></label>
              <input style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Nadia Bensali" autoFocus
                onFocus={(e) => { e.currentTarget.style.borderColor = ds.colors.ink; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = ds.colors.borderStrong; }}
              />
            </div>

            <div>
              <label style={labelStyle}>Biographie <span style={{ color: ds.colors.inkDisabled, fontWeight: 400 }}>(optionnel)</span></label>
              <textarea style={{ ...fieldStyle, height: 68, padding: "10px 12px", resize: "vertical", lineHeight: 1.5 }}
                value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Coiffeuse senior, 8 ans d'expérience"
                onFocus={(e) => { e.currentTarget.style.borderColor = ds.colors.ink; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = ds.colors.borderStrong; }}
              />
            </div>

            {/* Photo upload */}
            <div>
              <label style={labelStyle}>Photo <span style={{ color: ds.colors.inkDisabled, fontWeight: 400 }}>(optionnel)</span></label>
              <label style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", border: `1px dashed ${ds.colors.borderStrong}`, borderRadius: 10, cursor: "pointer", transition: "border-color 140ms ease, background-color 140ms ease" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLLabelElement).style.borderColor = ds.colors.ink; (e.currentTarget as HTMLLabelElement).style.backgroundColor = ds.colors.canvasSubtle; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLLabelElement).style.borderColor = ds.colors.borderStrong; (e.currentTarget as HTMLLabelElement).style.backgroundColor = "transparent"; }}
              >
                {preview ? (
                  <img src={preview} alt="Aperçu" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `1px solid ${ds.colors.border}` }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: ds.colors.canvasMuted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18, color: ds.colors.inkDisabled }}>
                    {name ? initials(name) : "?"}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 500, color: ds.colors.ink }}>{preview ? "Changer la photo" : "Choisir une photo"}</p>
                  <p style={{ margin: 0, fontSize: 11, color: ds.colors.inkTertiary }}>JPG, PNG ou WebP · max 2 Mo</p>
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleFileChange} />
              </label>
              {preview && (
                <button type="button" onClick={() => { setPhoto(""); setPreview(""); }}
                  style={{ marginTop: 6, background: "none", border: "none", cursor: "pointer", fontSize: 11, color: ds.colors.inkTertiary, padding: 0, fontFamily: "var(--font)", display: "flex", alignItems: "center", gap: 4 }}
                >
                  <X size={10} /> Supprimer la photo
                </button>
              )}
            </div>

            {/* Services / spécialités */}
            {services.length > 0 && (
              <div>
                <label style={labelStyle}>Spécialités (prestations réalisées)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {services.map((s) => {
                    const checked = serviceIds.includes(s.id);
                    return (
                      <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: ds.colors.ink }}>
                        <input type="checkbox" checked={checked}
                          onChange={() =>
                            setServiceIds((prev) => checked ? prev.filter((id) => id !== s.id) : [...prev, s.id])
                          }
                          style={{ width: 14, height: 14, accentColor: ds.colors.ink, cursor: "pointer" }}
                        />
                        {s.name}
                        <span style={{ marginLeft: "auto", fontSize: 11, color: ds.colors.inkTertiary }}>
                          {s.durationMinutes} min · {Math.round(s.priceCents / 100)} MAD
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {error && <p style={{ margin: 0, fontSize: 12, color: ds.colors.error, fontWeight: 500 }}>{error}</p>}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22, gap: 10 }}>
            {isEdit ? (
              <button type="button" onClick={() => remove.mutate()} disabled={remove.isPending}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 34, paddingInline: 14, backgroundColor: ds.colors.errorBg, color: ds.colors.error, border: `1px solid ${ds.colors.errorBorder}`, borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: remove.isPending ? "not-allowed" : "pointer", fontFamily: "var(--font)", opacity: remove.isPending ? 0.6 : 1 }}
              >
                <Trash2 size={12} />{remove.isPending ? "Suppression…" : "Retirer de l'équipe"}
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

/* ─── Page ────────────────────────────────────────────────── */
export default function StaffPage() {
  const [editing, setEditing]   = useState<ApiStaff | null | undefined>(undefined);
  const [absence, setAbsence]   = useState<ApiStaff | null>(null);

  const { data: providerData } = useQuery({
    queryKey: ["dashboard", "provider"],
    queryFn:  () => api.getDashboardProvider(),
    staleTime: 300_000, retry: false,
  });

  const slug: string      = providerData?.slug ?? "";
  const services: ApiService[] = providerData?.services ?? [];

  const { data: staffData, isLoading } = useQuery({
    queryKey: ["staff", slug],
    queryFn:  () => api.getStaff(slug),
    enabled:  !!slug,
    staleTime: 60_000,
  });

  const allStaff: ApiStaff[] = staffData ?? [];
  const activeCount   = allStaff.filter((s) => s.isActive).length;
  const inactiveCount = allStaff.filter((s) => !s.isActive).length;

  return (
    <>
      <DashboardLayout title="Équipe" breadcrumb="Équipe"
        actions={<Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setEditing(null)}>Ajouter un membre</Button>}
      >
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
          </div>
        ) : allStaff.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: "80px 24px", border: `1px dashed ${ds.colors.borderStrong}`, borderRadius: 12, textAlign: "center" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: ds.colors.canvasMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Scissors size={18} color={ds.colors.inkTertiary} strokeWidth={1.5} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: ds.colors.ink, margin: "0 0 4px" }}>Aucun membre dans l'équipe</p>
              <p style={{ fontSize: 13, color: ds.colors.inkTertiary, margin: 0 }}>Ajoutez des membres pour qu'ils apparaissent sur vos disponibilités.</p>
            </div>
            <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setEditing(null)}>Ajouter un membre</Button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {activeCount > 0 && (
              <section>
                <p style={{ fontSize: 11, fontWeight: 600, color: ds.colors.inkTertiary, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 12px", paddingLeft: 2 }}>
                  Disponibles · {activeCount}
                </p>
                <motion.div layout style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  <AnimatePresence mode="popLayout">
                    {allStaff.filter((m) => m.isActive).map((member, i) => (
                      <StaffCard key={member.id} member={member} services={services} slug={slug} index={i} onEdit={(m) => setEditing(m)} onAbsence={(m) => setAbsence(m)} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </section>
            )}
            {inactiveCount > 0 && (
              <section>
                <p style={{ fontSize: 11, fontWeight: 600, color: ds.colors.inkDisabled, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 12px", paddingLeft: 2 }}>
                  Indisponibles · {inactiveCount}
                </p>
                <motion.div layout style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  <AnimatePresence mode="popLayout">
                    {allStaff.filter((m) => !m.isActive).map((member, i) => (
                      <StaffCard key={member.id} member={member} services={services} slug={slug} index={i} onEdit={(m) => setEditing(m)} onAbsence={(m) => setAbsence(m)} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </section>
            )}
          </div>
        )}
      </DashboardLayout>

      <AnimatePresence>
        {editing !== undefined && (
          <StaffForm slug={slug} member={editing} services={services} onClose={() => setEditing(undefined)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {absence && <AbsenceModal member={absence} slug={slug} onClose={() => setAbsence(null)} />}
      </AnimatePresence>
    </>
  );
}
