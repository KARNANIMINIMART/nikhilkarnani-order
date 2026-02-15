import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";

type ParsedRow = {
  row: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  mrp?: number;
  unit: string;
  description?: string;
  is_trending?: boolean;
  is_active?: boolean;
};

type ValidationError = { row: number; field: string; message: string };

const REQUIRED_FIELDS = ["name", "brand", "category", "price", "unit"];

export const BulkProductUpload = () => {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        const rows: ParsedRow[] = [];
        const errs: ValidationError[] = [];

        json.forEach((row, i) => {
          const rowNum = i + 2; // +2 for header row + 0-index
          const parsed: ParsedRow = {
            row: rowNum,
            name: String(row.name || "").trim(),
            brand: String(row.brand || "").trim(),
            category: String(row.category || "").trim(),
            price: Number(row.price) || 0,
            mrp: row.mrp ? Number(row.mrp) : undefined,
            unit: String(row.unit || "").trim(),
            description: row.description ? String(row.description).trim() : undefined,
            is_trending: row.is_trending === true || row.is_trending === "true" || row.is_trending === 1,
            is_active: row.is_active !== false && row.is_active !== "false" && row.is_active !== 0,
          };

          REQUIRED_FIELDS.forEach((f) => {
            if (!parsed[f as keyof ParsedRow]) {
              errs.push({ row: rowNum, field: f, message: `${f} is required` });
            }
          });

          if (parsed.price <= 0) errs.push({ row: rowNum, field: "price", message: "price must be > 0" });

          rows.push(parsed);
        });

        setParsed(rows);
        setErrors(errs);
        if (errs.length === 0) toast.success(`${rows.length} rows parsed successfully`);
        else toast.warning(`${rows.length} rows parsed, ${errs.length} validation errors`);
      } catch (err) {
        toast.error("Failed to parse file");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCommit = async () => {
    if (errors.length > 0) {
      toast.error("Fix validation errors first");
      return;
    }

    setUploading(true);
    try {
      const payload = parsed.map(({ row, ...rest }) => ({
        ...rest,
        price: rest.price,
        mrp: rest.mrp || null,
        is_trending: rest.is_trending || false,
        is_active: rest.is_active !== false,
      }));

      const { error } = await supabase.from("products").upsert(payload, { onConflict: "name,brand,unit" });
      if (error) throw error;

      toast.success(`${payload.length} products uploaded`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setParsed([]);
      setErrors([]);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Bulk Upload (Excel/CSV)</h3>
      </div>

      <p className="text-xs text-muted-foreground">
        Required columns: <code>name, brand, category, price, unit</code>. Optional: <code>mrp, description, is_trending, is_active</code>
      </p>

      <input ref={fileRef} type="file" accept=".xlsx,.csv,.xls" onChange={handleFile} className="hidden" />
      <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
        <Upload className="h-4 w-4" /> Select File
      </Button>

      {errors.length > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">{errors.length} Validation Errors</span>
          </div>
          <ScrollArea className="max-h-32">
            {errors.map((e, i) => (
              <p key={i} className="text-xs text-destructive">Row {e.row}: {e.field} – {e.message}</p>
            ))}
          </ScrollArea>
        </div>
      )}

      {parsed.length > 0 && (
        <>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            {parsed.length} rows ready
          </div>

          <ScrollArea className="h-48 border rounded-md">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="p-2">Name</th>
                  <th className="p-2">Brand</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Unit</th>
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-2">{r.name}</td>
                    <td className="p-2">{r.brand}</td>
                    <td className="p-2">{r.category}</td>
                    <td className="p-2">₹{r.price}</td>
                    <td className="p-2">{r.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>

          <Button onClick={handleCommit} disabled={uploading || errors.length > 0} className="gap-2">
            {uploading ? "Uploading..." : `Commit ${parsed.length} Products`}
          </Button>
        </>
      )}
    </div>
  );
};
