import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userEmail: string;
  onConfirm: () => void;
}

export default function DeleteUserModal({ 
  open, 
  onOpenChange, 
  userName, 
  userEmail,
  onConfirm 
}: DeleteUserModalProps) {
  const handleDelete = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Deactivate User
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Are you sure you want to deactivate the user <span className="font-medium text-gray-900">{userName}</span> ({userEmail})? 
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            This will change their status to inactive and prevent them from accessing the system. You can reactivate them later if needed.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Deactivate User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}