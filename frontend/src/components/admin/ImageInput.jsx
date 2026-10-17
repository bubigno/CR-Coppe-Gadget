import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";

export default function ImageInput({ value, onChange, label = "" }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await api.post("/admin/uploads", fd);
      onChange(r.data.url);
      toast.success("Immagine caricata");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div data-testid="admin-image-input">
      {label && <label className="field-label">{label}</label>}
      <div className="flex gap-2">
        <input
          className="field flex-1"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Incolla un URL oppure carica un'immagine"
          data-testid="admin-image-url-input"
        />
        <button
          type="button"
          onClick={() => fileRef.current && fileRef.current.click()}
          className="btn-ghost shrink-0 !px-4 !py-2 !text-xs"
          disabled={uploading}
          data-testid="admin-image-upload-button"
        >
          <Upload size={14} /> {uploading ? "…" : "Carica"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={upload} />
      </div>
      {value && <img src={value} alt="" className="mt-2 h-20 w-20 rounded-lg border border-line object-cover" />}
    </div>
  );
}