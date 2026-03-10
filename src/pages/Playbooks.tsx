import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import Topbar from "@/components/layout/Topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Upload, Trash2, FileText, Loader2 } from "lucide-react";

interface Playbook {
  id: string;
  title: string;
  file_path: string;
  extracted_text: string | null;
  created_at: string;
}

export default function Playbooks() {
  const { onMenuClick } = useOutletContext<{ onMenuClick: () => void }>();
  const { user } = useAuth();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Playbook | null>(null);

  const fetchPlaybooks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("playbooks")
      .select("id, title, file_path, extracted_text, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    setPlaybooks(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlaybooks();
  }, [user]);

  const handleUpload = async () => {
    if (!user || !file || !title.trim()) return;
    setUploading(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "txt";
      const filePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("playbooks")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: pb, error: insertError } = await supabase
        .from("playbooks")
        .insert({ owner_id: user.id, title: title.trim(), file_path: filePath })
        .select("id")
        .single();
      if (insertError || !pb) throw insertError ?? new Error("Falha ao salvar playbook");

      setTitle("");
      setFile(null);
      setDialogOpen(false);
      fetchPlaybooks();
      toast({
        title: "Playbook enviado com sucesso!",
        description: "Estamos processando o texto em segundo plano.",
      });

      void supabase.functions
        .invoke("extract-playbook", {
          body: { playbook_id: pb.id },
        })
        .then(({ error: extractError }) => {
          if (extractError) {
            console.error("Extract error:", extractError);
            toast({
              title: "Erro ao processar playbook",
              description: "O arquivo foi salvo, mas houve falha na extração do texto.",
              variant: "destructive",
            });
            return;
          }
          fetchPlaybooks();
          toast({
            title: "Texto extraído",
            description: "Seu playbook já pode ser usado no Roleplay.",
          });
        })
        .catch((extractError) => {
          console.error("Extract error:", extractError);
          toast({
            title: "Erro ao processar playbook",
            description: "O arquivo foi salvo, mas houve falha na extração do texto.",
            variant: "destructive",
          });
        });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const pb = deleteTarget;
    setDeleteTarget(null);
    try {
      await supabase.storage.from("playbooks").remove([pb.file_path]);
      await supabase.from("playbooks").delete().eq("id", pb.id);
      setPlaybooks((prev) => prev.filter((p) => p.id !== pb.id));
      toast({ title: "Playbook removido" });
    } catch (e: any) {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    }
  };

  return (
    <>
      <Topbar title="Playbooks" description="Gerencie seus guias comerciais" onMenuClick={onMenuClick} />

      <div className="px-6 lg:px-8 py-6 space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Enviar Playbook
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : playbooks.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum playbook enviado ainda.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {playbooks.map((pb) => (
              <div
                key={pb.id}
                className="flex items-center justify-between bg-card rounded-lg px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{pb.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(pb.created_at).toLocaleDateString("pt-BR")}
                    {pb.extracted_text ? " · Texto extraído" : " · Processando..."}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(pb)}
                  className="text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Playbook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Título do playbook"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleUpload} disabled={!title.trim() || !file || uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir playbook</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
