import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/DSButton";
import { api, type ApiStaff, type ApiService } from "@/lib/api";
import { Plus, Pencil, X, Trash2, Scissors } from "lucide-react";

/* ─── helpers ─────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function serviceCount(staffId: string, services: ApiService[]) {
  return services.filter((s) => s.staffIds?.includes(staffId)).length;
}

/* ─── Status toggle ───────────────────────────────────────── */
function StatusChip({
  isActive,
  loading,
  onClick,
}: {
  isActive: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title={isActive ? "Marquer indisponible" : "Marquer disponible"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 26,
        paddingInline: 10,
        borderRadius: 9999,
        border: "1px solid",
        borderColor: isActive ? "var(--success-border)" : "var(--hairline-strong)",
        backgroundColor: isActive ? "var(--success-bg)" : "rgba(12,12,14,0.04)",
        color: isActive ? "var(--success)" : "var(--ink-tertiary)",
        fontSize: 11,
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "var(--font)",
        opacity: loading ? 0.5 : 1,
        transition: "all 160ms ease",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: isActive ? "var(--success)" : "var(--ink-disabled)",
          flexShrink: 0,
        }}
      />
      {loading ? "…" : isActive ? "Disponible" : "Indisponible"}
    </button>
  );
}

/* ─── Staff Row Card ──────────────────────────────────────── */
function StaffCard({
  member,
  services,
  slug,
  index,
  onEdit,
}: {
  member: ApiStaff;
  services: ApiService[];
  slug: string;
  index: number;
  onEdit: (m: ApiStaff) => void;
}) {
  const qc = useQueryClient();

  const toggle = useMutation({
    mutationFn: () =>
      api.updateStaff(slug, member.id, { isActive: !member.isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff", slug] }),
  });

  const count = serviceCount(member.id, services);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2, ease: [0, 0, 0.2, 1] }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderRadius: 12,
        border: "1px solid var(--hairline)",
        backgroundColor: member.isActive ? "var(--surface-1)" : "rgba(12,12,14,0.02)",
        transition: "border-color 150ms ease, background-color 150ms ease",
      }}
    >
      {/* Avatar */}
      {member.photoUrl ? (
        <img
          src={member.photoUrl}
          alt={member.name}
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
            border: "1px solid var(--hairline)",
            opacity: member.isActive ? 1 : 0.5,
          }}
        />
      ) : (
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            backgroundColor: "rgba(12,12,14,0.06)",
            border: "1px solid var(--hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "var(--ink-secondary)",
            flexShrink: 0,
            opacity: member.isActive ? 1 : 0.45,
            letterSpacing: "-0.01em",
          }}
        >
          {initials(member.name)}
        </div>
      )}

      {/* Name + bio */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: member.isActive ? "var(--ink)" : "var(--ink-tertiary)",
            letterSpacing: "-0.015em",
            margin: "0 0 2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {member.name}
        </p>
        {member.bio && (
          <p
            style={{
              fontSize: 12,
              color: "var(--ink-tertiary)",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {member.bio}
          </p>
        )}
      </div>

      {/* Services badge */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          fontWeight: 500,
          color: count > 0 ? "var(--ink-secondary)" : "var(--ink-disabled)",
          backgroundColor: "rgba(12,12,14,0.05)",
          border: "1px solid var(--hairline)",
          borderRadius: 9999,
          padding: "3px 9px",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <Scissors size={10} strokeWidth={2} />
        {count} prestation{count !== 1 ? "s" : ""}
      </span>

      {/* Status toggle */}
      <StatusChip
        isActive={member.isActive}
        loading={toggle.isPending}
        onClick={() => toggle.mutate()}
      />

      {/* Edit */}
      <button
        onClick={() => onEdit(member)}
        style={{
          height: 30,
          width: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "1px solid var(--hairline)",
          borderRadius: 8,
          cursor: "pointer",
          color: "var(--ink-tertiary)",
          flexShrink: 0,
          transition: "border-color 140ms ease, color 140ms ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--hairline-strong)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--hairline)";
        }}
        title="Modifier"
      >
        <Pencil size={13} />
      </button>
    </motion.div>
  );
}

/* ─── Skeleton row ────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderRadius: 12,
        border: "1px solid var(--hairline)",
      }}
    >
      <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ height: 13, width: "38%", borderRadius: 5, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 11, width: "55%", borderRadius: 4, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite" }} />
      </div>
      <div style={{ height: 24, width: 90, borderRadius: 9999, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite" }} />
      <div style={{ height: 24, width: 90, borderRadius: 9999, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite" }} />
      <div style={{ height: 30, width: 30, borderRadius: 8, backgroundColor: "var(--hairline)", animation: "pulse 1.4s ease-in-out infinite" }} />
    </div>
  );
}

/* ─── Staff Form Modal ────────────────────────────────────── */
interface StaffFormProps {
  slug: string;
  member?: ApiStaff | null; // null = create
  onClose: () => void;
}

function StaffForm({ slug, member, onClose }: StaffFormProps) {
  const isEdit = !!member;
  const qc = useQueryClient();

  const [name, setName]       = useState(member?.name ?? "");
  const [bio, setBio]         = useState(member?.bio ?? "");
  const [photo, setPhoto]     = useState(member?.photoUrl ?? "");
  const [preview, setPreview] = useState(member?.photoUrl ?? "");
  const [error, setError]     = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 2 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhoto(result);
      setPreview(result);
      setError("");
    };
    reader.readAsDataURL(file);
  }

  const save = useMutation({
    mutationFn: () => {
      const data = {
        name: name.trim(),
        bio: bio.trim() || undefined,
        photoUrl: photo.trim() || undefined,
      };
      return isEdit
        ? api.updateStaff(slug, member!.id, data)
        : api.createStaff(slug, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff", slug] });
      onClose();
    },
    onError: () => setError("Une erreur est survenue."),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteStaff(slug, member!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff", slug] });
      onClose();
    },
    onError: () => setError("Impossible de supprimer ce membre."),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Le nom est requis."); return; }
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
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420,
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
            {isEdit ? "Modifier le membre" : "Nouveau membre"}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-tertiary)", padding: 4, display: "flex", borderRadius: 6 }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Nom <span style={{ color: "var(--accent)" }}>*</span></label>
              <input
                style={fieldStyle}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Nadia Bensali"
                autoFocus
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ink)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
              />
            </div>
            <div>
              <label style={labelStyle}>Biographie <span style={{ color: "var(--ink-disabled)", fontWeight: 400 }}>(optionnel)</span></label>
              <textarea
                style={{ ...fieldStyle, height: 68, padding: "10px 12px", resize: "vertical", lineHeight: 1.5 }}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Coiffeuse senior — 8 ans d'expérience"
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ink)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--hairline-strong)"; }}
              />
            </div>
            {/* Photo upload */}
            <div>
              <label style={labelStyle}>Photo <span style={{ color: "var(--ink-disabled)", fontWeight: 400 }}>(optionnel)</span></label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 14px",
                  border: "1px dashed var(--hairline-strong)",
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "border-color 140ms ease, background-color 140ms ease",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLLabelElement).style.borderColor = "var(--ink)";
                  (e.currentTarget as HTMLLabelElement).style.backgroundColor = "rgba(12,12,14,0.02)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLLabelElement).style.borderColor = "var(--hairline-strong)";
                  (e.currentTarget as HTMLLabelElement).style.backgroundColor = "transparent";
                }}
              >
                {/* Preview or placeholder */}
                {preview ? (
                  <img
                    src={preview}
                    alt="Aperçu"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                      border: "1px solid var(--hairline)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      backgroundColor: "rgba(12,12,14,0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 18,
                      color: "var(--ink-disabled)",
                    }}
                  >
                    {name ? initials(name) : "?"}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                    {preview ? "Changer la photo" : "Choisir une photo"}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)" }}>
                    JPG, PNG ou WebP · max 2 Mo
                  </p>
                </div>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </label>

              {/* Clear button */}
              {preview && (
                <button
                  type="button"
                  onClick={() => { setPhoto(""); setPreview(""); }}
                  style={{
                    marginTop: 6,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 11,
                    color: "var(--ink-tertiary)",
                    padding: 0,
                    fontFamily: "var(--font)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <X size={10} /> Supprimer la photo
                </button>
              )}
            </div>
            {error && (
              <p style={{ margin: 0, fontSize: 12, color: "var(--error)", fontWeight: 500 }}>{error}</p>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22, gap: 10 }}>
            {isEdit ? (
              <button
                type="button"
                onClick={() => remove.mutate()}
                disabled={remove.isPending}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  height: 34, paddingInline: 14,
                  backgroundColor: "var(--error-bg)", color: "var(--error)",
                  border: "1px solid var(--error-border)",
                  borderRadius: 8, fontSize: 12, fontWeight: 500,
                  cursor: remove.isPending ? "not-allowed" : "pointer",
                  fontFamily: "var(--font)", opacity: remove.isPending ? 0.6 : 1,
                  transition: "opacity 140ms ease",
                }}
              >
                <Trash2 size={12} />
                {remove.isPending ? "Suppression…" : "Retirer de l'équipe"}
              </button>
            ) : <span />}

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  height: 34, paddingInline: 16,
                  backgroundColor: "transparent", color: "var(--ink-secondary)",
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
                  color: "#fff", border: "none",
                  borderRadius: 8, fontSize: 13, fontWeight: 500,
                  cursor: save.isPending ? "not-allowed" : "pointer",
                  fontFamily: "var(--font)", transition: "background-color 140ms ease",
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

/* ─── Page ────────────────────────────────────────────────── */
export default function StaffPage() {
  const [editing, setEditing] = useState<ApiStaff | null | undefined>(undefined);
  // undefined = closed, null = create, ApiStaff = edit

  const qc = useQueryClient();

  // Step 1: get provider slug + services
  const { data: providerData } = useQuery({
    queryKey: ["dashboard", "provider"],
    queryFn: () => api.getDashboardProvider(),
    staleTime: 300_000,
    retry: false,
  });

  const slug: string = providerData?.slug ?? "";
  const services: ApiService[] = providerData?.services ?? [];

  // Step 2: get all staff (including inactive) once we have the slug
  const { data: staffData, isLoading } = useQuery({
    queryKey: ["staff", slug],
    queryFn: () => api.getStaff(slug),
    enabled: !!slug,
    staleTime: 60_000,
  });

  const allStaff: ApiStaff[] = staffData ?? [];
  const activeCount   = allStaff.filter((s) => s.isActive).length;
  const inactiveCount = allStaff.filter((s) => !s.isActive).length;

  return (
    <>
      <DashboardLayout
        title="Équipe"
        breadcrumb="Équipe"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={13} />}
            onClick={() => setEditing(null)}
          >
            Ajouter un membre
          </Button>
        }
      >
        {/* Section: disponibles */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
          </div>
        ) : allStaff.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 14, padding: "80px 24px",
            border: "1px dashed var(--hairline-strong)", borderRadius: 12, textAlign: "center",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(12,12,14,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Scissors size={18} color="var(--ink-tertiary)" strokeWidth={1.5} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
                Aucun membre dans l'équipe
              </p>
              <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: 0 }}>
                Ajoutez des membres pour qu'ils apparaissent sur vos disponibilités.
              </p>
            </div>
            <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => setEditing(null)}>
              Ajouter un membre
            </Button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Active */}
            {activeCount > 0 && (
              <section>
                <p style={{
                  fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)",
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  margin: "0 0 10px", paddingLeft: 2,
                }}>
                  Disponibles · {activeCount}
                </p>
                <motion.div layout style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <AnimatePresence mode="popLayout">
                    {allStaff.filter((m) => m.isActive).map((member, i) => (
                      <StaffCard
                        key={member.id}
                        member={member}
                        services={services}
                        slug={slug}
                        index={i}
                        onEdit={(m) => setEditing(m)}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </section>
            )}

            {/* Inactive */}
            {inactiveCount > 0 && (
              <section>
                <p style={{
                  fontSize: 11, fontWeight: 600, color: "var(--ink-disabled)",
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  margin: "0 0 10px", paddingLeft: 2,
                }}>
                  Indisponibles · {inactiveCount}
                </p>
                <motion.div layout style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <AnimatePresence mode="popLayout">
                    {allStaff.filter((m) => !m.isActive).map((member, i) => (
                      <StaffCard
                        key={member.id}
                        member={member}
                        services={services}
                        slug={slug}
                        index={i}
                        onEdit={(m) => setEditing(m)}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </section>
            )}

          </div>
        )}
      </DashboardLayout>

      {/* Modal */}
      <AnimatePresence>
        {editing !== undefined && (
          <StaffForm
            slug={slug}
            member={editing}
            onClose={() => setEditing(undefined)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
