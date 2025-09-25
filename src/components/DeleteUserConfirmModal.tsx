import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteUserConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userEmail: string;
  onConfirm: () => void;
}

export default function DeleteUserConfirmModal({ 
  open, 
  onOpenChange, 
  userName, 
  userEmail,
  onConfirm 
}: DeleteUserConfirmModalProps) {
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
              Delete User
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Are you sure you want to permanently delete the user <span className="font-medium text-gray-900">{userName}</span> ({userEmail})? 
          </p>
          <p className="text-sm text-red-600 leading-relaxed font-medium mb-2">
            This action cannot be undone. The user will be permanently removed from both Firebase Auth and Firestore.
          </p>
          <p className="text-sm text-red-600 leading-relaxed">
            • The user's authentication account will be deleted
          </p>
          <p className="text-sm text-red-600 leading-relaxed">
            • All user data will be removed from the database
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
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}