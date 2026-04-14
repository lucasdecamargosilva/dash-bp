import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useDashboard } from "@/context/DashboardContext";
import { useAuth } from "@/hooks/useAuth";
import { Channel } from "@/data/mockData";
import { toast } from "sonner";

interface DeleteChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel | null;
  clientId: string;
}

export function DeleteChannelDialog({ open, onOpenChange, channel, clientId }: DeleteChannelDialogProps) {
  const { deleteChannel, clients } = useDashboard();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [affectedRecordsCount, setAffectedRecordsCount] = useState(0);

  useEffect(() => {
    if (channel && clientId) {
      // Count how many records will be affected by this deletion
      const client = clients.find(c => c.id === clientId);
      if (client && client.channels) {
        const channelRecords = client.channels.filter(c => c.name === channel.name).length;
        setAffectedRecordsCount(channelRecords);
      } else {
        setAffectedRecordsCount(0);
      }
    }
  }, [channel, clientId, clients]);

  const handleConfirm = async () => {
    if (!channel) return;
    
    setIsDeleting(true);
    
    try {
      // For hard delete, we need to remove all instances of this channel for the client
      const client = clients.find(c => c.id === clientId);
      if (client && client.channels) {
        const channelsToDelete = client.channels.filter(c => c.name === channel.name);
        
        for (const channelToDelete of channelsToDelete) {
          await deleteChannel(clientId, channelToDelete.id);
        }
      } else {
        // Fallback: delete the specific channel if no client.channels array
        await deleteChannel(clientId, channel.id);
      }
      
      toast.success(`Canal "${channel.name}" excluído com sucesso!`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting channel:", error);
      toast.error("Erro ao excluir canal");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!channel) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Tem certeza que deseja excluir o canal <strong>"{channel.name}"</strong>?
            </p>
            <p className="text-sm text-destructive font-medium">
              Esta ação é <strong>definitiva</strong> e não pode ser desfeita.
            </p>
            {affectedRecordsCount > 1 && (
              <p className="text-sm text-muted-foreground">
                Serão removidos {affectedRecordsCount} registros de métricas associados a este canal.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Excluindo..." : "Excluir Definitivamente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}