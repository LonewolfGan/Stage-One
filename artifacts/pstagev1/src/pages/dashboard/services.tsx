import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/DSButton";
import { api } from "@/lib/api";
import { Plus, Clock, Pencil, Tag, X, Trash2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  priceCents: number;
}

/* ── Form modal ─────────────────────────────────────────────── */
interface ServiceFormProps {
  slug: string;
  service?: Service | null;   // null = create mode
  onClose: () => void;
}

function ServiceForm({ slug, service, onClose }: ServiceFormProps) {
  const isEdit = !!service;
  const qc = useQueryClient();

  const [name, setName]             = useState(service?.name ?? "");
  const [description, setDesc]      = useState(service?.description ?? "");
  const [duration, setDuration]     = useState(service ? String(service.durationMinutes) : "");
  const [price, setPrice]           = useState(service ? String(Math.round(service.priceCents / 100)) : "");
  const [error, setError]           = useState("");

  const save = useMutation({
    mutationFn: () => {
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        durationMinutes: parseInt(duration, 10),
        priceCents: Math.round(parseFloat(price) * 100),
      };
      return isEdit
        ? api.updateService(slug, service!.id, data)
        : api.createService(slug, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard", "provider"] });
      onClose();
    },
    onError: () => setError("Une erreur est survenue. Veuillez réessayer."),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteService(slug, service!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard", "provider"] });
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
    width: "100%",
    height: 38,
    padding: "0 12px",
    border: "1px solid var(--hairline-strong)",
    borderRadius: 8,
    backgroundColor: "var(--surface-1)",
    fontSize: 13,
    color: "var(--ink)",
    outline: "none",
    fontFamily: "var(--font)",
    boxSizing: "border-box",
    transition: "border-color 140ms ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--ink-secondary)",
    marginBottom: 6,
    letterSpacing: "-0.01em",
  };

  return (
    /* Backdrop */
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        backgroundColor: "rgba(0,0,0,0.46)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 440,
          backgroundColor: "var(--surface-1)",
          borderRadius: 14,
          border: "1px solid var(--hairline)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px 16px",
          borderBottom: "1px solid var(--hairline)",
        }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.015em" }}>
            {isEdit ? "Modifier la prestation" : "Nouvelle prestation"}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-tertiary)", padding: 4, display: "flex", borderRadius: 6 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Name */}
            <div>
              <label style={labelStyle}>Nom <span style={{ color: "var(--accent)" }}>*</span></label>
              <input
                style={fieldStyle}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Coupe femme"
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ink)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description <span style={{ color: "var(--ink-disabled)", fontWeight: 400 }}>(optionnel)</span></label>
              <textarea
                style={{ ...fieldStyle, height: 72, padding: "10px 12px", resize: "vertical", lineHeight: 1.5 }}
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Décrivez la prestation…"
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ink)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
              />
            </div>

            {/* Duration + Price row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Durée (min) <span style={{ color: "var(--accent)" }}>*</span></label>
                <input
                  style={fieldStyle}
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="45"
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ink)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Prix (MAD) <span style={{ color: "var(--accent)" }}>*</span></label>
                <input
                  style={fieldStyle}
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="150"
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ink)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p style={{ margin: 0, fontSize: 12, color: "var(--error)", fontWeight: 500 }}>{error}</p>
            )}
          </div>

          {/* Footer actions */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 24, gap: 10,
          }}>
            {/* Delete (edit only) */}
            {isEdit ? (
              <button
                type="button"
                onClick={() => remove.mutate()}
                disabled={remove.isPending}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  height: 34, paddingInline: 14,
                  backgroundColor: "var(--error-bg)",
                  color: "var(--error)",
                  border: "1px solid var(--error-border)",
                  borderRadius: 8, fontSize: 12, fontWeight: 500,
                  cursor: remove.isPending ? "not-allowed" : "pointer",
                  fontFamily: "var(--font)", opacity: remove.isPending ? 0.6 : 1,
                  transition: "opacity 140ms ease",
                }}
              >
                <Trash2 size={12} />
                {remove.isPending ? "Suppression…" : "Supprimer"}
              </button>
            ) : <span />}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  height: 34, paddingInline: 16,
                  backgroundColor: "transparent",
                  color: "var(--ink-secondary)",
                  border: "1px solid var(--hairline-strong)",
                  borderRadius: 8, fontSize: 13, fontWeight: 500,
                  cursor: "pointer", fontFamily: "var(--font)",
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={save.isPending}
                style={{
                  height: 34, paddingInline: 18,
                  backgroundColor: save.isPending ? "rgba(12,12,14,0.5)" : "var(--ink)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8, fontSize: 13, fontWeight: 500,
                  cursor: save.isPending ? "not-allowed" : "pointer",
                  fontFamily: "var(--font)",
                  transition: "background-color 140ms ease",
                }}
              >
                {save.isPending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ── Service Card ──────────────────────────────────────────── */
function ServiceCard({
  service,
  index,
  onEdit,
}: {
  service: Service;
  index: number;
  onEdit: (s: Service) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2, ease: [0, 0, 0.2, 1] }}
      whileHover={{ backgroundColor: "rgba(12,12,14,0.015)" }}
      style={{
        borderRadius: 12,
        border: "1px solid var(--hairline)",
        backgroundColor: "var(--surface-1)",
        display: "flex",
        flexDirection: "column",
        padding: "18px 20px 16px",
        gap: 10,
        transition: "border-color 150ms ease, background-color 150ms ease",
        cursor: "default",
      }}
    >
      {/* Name + duration */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--ink)",
            letterSpacing: "-0.015em",
            lineHeight: 1.3,
            margin: 0,
            flex: 1,
          }}
        >
          {service.name}
        </p>
        <span
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: 500,
            color: "var(--ink-tertiary)",
            backgroundColor: "rgba(12,12,14,0.05)",
            borderRadius: 9999,
            padding: "3px 8px",
            whiteSpace: "nowrap",
            lineHeight: 1,
            marginTop: 1,
          }}
        >
          <Clock size={10} strokeWidth={2} style={{ flexShrink: 0 }} />
          {service.durationMinutes} min
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: 12,
          color: "var(--ink-tertiary)",
          lineHeight: 1.55,
          margin: 0,
          flex: 1,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          minHeight: 37,
        }}
      >
        {service.description || (
          <span style={{ opacity: 0.5, fontStyle: "italic" }}>Pas de description</span>
        )}
      </p>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 12,
          borderTop: "1px solid var(--hairline)",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "-0.025em",
            lineHeight: 1,
          }}
        >
          {Math.round(service.priceCents / 100)}{" "}
          <span style={{ fontSize: 11, fontWeight: 400, color: "var(--ink-tertiary)", letterSpacing: 0 }}>
            MAD
          </span>
        </span>

        <button
          onClick={() => onEdit(service)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            height: 28,
            paddingInline: 12,
            backgroundColor: "var(--ink)",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            cursor: "pointer",
            fontFamily: "var(--font)",
            flexShrink: 0,
            transition: "opacity 140ms ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.75"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          <Pencil size={10} strokeWidth={2} />
          Modifier
        </button>
      </div>
    </motion.div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid var(--hairline)",
        padding: "18px 20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ height: 14, width: "52%", borderRadius: 5, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 20, width: 60, borderRadius: 9999, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite", flexShrink: 0 }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
        <div style={{ height: 12, width: "82%", borderRadius: 4, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 12, width: "62%", borderRadius: 4, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite" }} />
      </div>
      <div style={{ paddingTop: 12, borderTop: "1px solid var(--hairline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ height: 17, width: 72, borderRadius: 5, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 28, width: 76, borderRadius: 7, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite" }} />
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function ServicesPage() {
  const [editing, setEditing] = useState<Service | null | undefined>(undefined);
  // undefined = closed, null = create mode, Service = edit mode

  const { data: providerData, isLoading } = useQuery({
    queryKey: ["dashboard", "provider"],
    queryFn: () => api.getDashboardProvider(),
    staleTime: 300_000,
    retry: false,
  });

  const slug: string = providerData?.slug ?? "";

  const raw: any[] = providerData?.services ?? [];
  const services: Service[] = raw.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description ?? "",
    durationMinutes: s.durationMinutes ?? 0,
    priceCents: s.priceCents ?? 0,
  }));

  return (
    <>
      <DashboardLayout
        title="Prestations"
        breadcrumb="Prestations"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={13} />}
            onClick={() => setEditing(null)}
          >
            Ajouter
          </Button>
        }
      >
        {/* Cards grid */}
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : services.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              padding: "80px 24px",
              border: "1px dashed var(--hairline-strong)",
              borderRadius: 12,
              textAlign: "center",
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(12,12,14,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Tag size={18} color="var(--ink-tertiary)" strokeWidth={1.5} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                Aucune prestation
              </p>
              <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: 0 }}>
                Ajoutez votre première prestation pour qu'elle apparaisse ici.
              </p>
            </div>
            <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setEditing(null)}>
              Ajouter une prestation
            </Button>
          </div>
        ) : (
          <motion.div
            layout
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}
          >
            <AnimatePresence mode="popLayout">
              {services.map((service, i) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  index={i}
                  onEdit={(s) => setEditing(s)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </DashboardLayout>

      {/* Modal */}
      <AnimatePresence>
        {editing !== undefined && (
          <ServiceForm
            slug={slug}
            service={editing}
            onClose={() => setEditing(undefined)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
