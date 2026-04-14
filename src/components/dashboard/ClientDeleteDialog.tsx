import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

interface ClientDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  onConfirm: () => Promise<void>;
}

export function ClientDeleteDialog({ 
  open, 
  onOpenChange, 
  clientName, 
  onConfirm 
}: ClientDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting client:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (!isDeleting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isDeleting ? undefined : onOpenChange}>
      <DialogContent 
        className="sm:max-w-md bg-card border-border"
        onInteractOutside={isDeleting ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirmar exclusão
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Você tem certeza que deseja excluir o cliente <strong className="text-foreground">{clientName}</strong>? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              • Todos os dados deste cliente serão removidos permanentemente
            </p>
            <p className="text-sm text-muted-foreground">
              • Os gráficos e KPIs serão atualizados automaticamente
            </p>
            <p className="text-sm text-muted-foreground">
              • Esta ação não pode ser desfeita
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isDeleting}
              className="flex-1"
              autoFocus
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}